/**
 * Audio Recorder using Electron's desktopCapturer
 * Captures microphone audio via Chromium's MediaDevices API
 */

import { EventEmitter } from 'events'
import { BrowserWindow, desktopCapturer, ipcMain } from 'electron'
import { join } from 'path'

export interface AudioRecorderOptions {
  sampleRate?: number
  channels?: number
  deviceId?: string
}

export class AudioRecorder extends EventEmitter {
  private isRecording = false
  private audioBuffer: Buffer[] = []
  private options: Required<AudioRecorderOptions>
  private recordingWindow: BrowserWindow | null = null
  private ipcHandlers: (() => void)[] = []

  constructor(options: AudioRecorderOptions = {}) {
    super()
    this.options = {
      sampleRate: 16000,
      channels: 1,
      deviceId: '',
      ...options
    }
  }

  async start(): Promise<void> {
    if (this.isRecording) return

    this.isRecording = true
    this.audioBuffer = []

    try {
      // Create a hidden window for Web Audio API access
      this.recordingWindow = new BrowserWindow({
        width: 1,
        height: 1,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          sandbox: false,
        },
      })

      // Set up IPC handlers
      this.setupIPC()

      // Load the recording HTML
      await this.recordingWindow.loadURL(`data:text/html,${encodeURIComponent(this.getRecordingHTML())}`)

      // Wait for ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Audio initialization timeout')), 5000)
        
        const handler = (_event: any, result: string) => {
          if (result === 'started') {
            clearTimeout(timeout)
            cleanup()
            resolve(true)
          } else if (result.startsWith('error:')) {
            clearTimeout(timeout)
            cleanup()
            reject(new Error(result.substring(6)))
          }
        }
        
        ipcMain.once('audio:status', handler)
        
        const cleanup = () => {
          ipcMain.removeListener('audio:status', handler)
        }
      })

      // Start recording in the hidden window
      await this.recordingWindow.webContents.executeJavaScript(`window.startRecording()`)
      
      this.emit('start')
    } catch (error) {
      this.cleanup()
      this.isRecording = false
      this.emit('error', error)
      throw error
    }
  }

  private setupIPC(): void {
    // Audio data handler
    const dataHandler = (_event: any, base64Data: string) => {
      const buffer = Buffer.from(base64Data, 'base64')
      this.audioBuffer.push(buffer)
      this.emit('data', buffer)
    }
    ipcMain.on('audio:data', dataHandler)
    this.ipcHandlers.push(() => ipcMain.removeListener('audio:data', dataHandler))

    // Audio level handler
    const levelHandler = (_event: any, level: number) => {
      this.emit('level', level)
    }
    ipcMain.on('audio:level', levelHandler)
    this.ipcHandlers.push(() => ipcMain.removeListener('audio:level', levelHandler))

    // Status handler
    const statusHandler = (_event: any, status: string) => {
      if (status.startsWith('error:')) {
        console.error('Audio error:', status.substring(6))
      }
    }
    ipcMain.on('audio:status', statusHandler)
    this.ipcHandlers.push(() => ipcMain.removeListener('audio:status', statusHandler))
  }

  private getRecordingHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
<script>
  const { ipcRenderer } = require('electron');
  
  let mediaRecorder = null;
  let audioContext = null;
  let analyser = null;
  let source = null;
  let stream = null;
  let recordedChunks = [];
  let levelInterval = null;

  async function startRecording() {
    try {
      console.log('Requesting microphone access...');
      
      // Get microphone stream
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      console.log('Microphone access granted');

      // Set up audio context for level monitoring
      audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      // Start level monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      levelInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = average / 255;
        ipcRenderer.send('audio:level', normalized);
      }, 50);

      // Set up MediaRecorder with WAV format
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };
      
      mediaRecorder = new MediaRecorder(stream, options);
      recordedChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          // Convert to base64 and send to main process
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            ipcRenderer.send('audio:data', base64);
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped');
      };

      mediaRecorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        ipcRenderer.send('audio:status', 'error:' + err.message);
      };

      // Start recording - collect data every 100ms
      mediaRecorder.start(100);
      
      console.log('Recording started');
      ipcRenderer.send('audio:status', 'started');
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      ipcRenderer.send('audio:status', 'error:' + err.message);
    }
  }

  function stopRecording() {
    if (levelInterval) {
      clearInterval(levelInterval);
      levelInterval = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContext) {
      audioContext.close();
    }
    
    console.log('Recording cleanup complete');
  }

  // Expose to window
  window.startRecording = startRecording;
  window.stopRecording = stopRecording;
</script>
</body>
</html>
    `
  }

  stop(): Buffer {
    if (!this.isRecording) {
      return Buffer.concat(this.audioBuffer)
    }

    this.isRecording = false

    // Stop recording in the hidden window
    if (this.recordingWindow) {
      this.recordingWindow.webContents.executeJavaScript(`window.stopRecording()`)
        .catch(() => {})
    }

    // Wait a bit for final data
    setTimeout(() => this.cleanup(), 500)

    const result = Buffer.concat(this.audioBuffer)
    this.emit('stop', result)
    return result
  }

  private cleanup(): void {
    // Remove IPC handlers
    this.ipcHandlers.forEach(cleanup => cleanup())
    this.ipcHandlers = []

    // Close window
    if (this.recordingWindow) {
      this.recordingWindow.destroy()
      this.recordingWindow = null
    }
  }

  getIsRecording(): boolean {
    return this.isRecording
  }

  getAudioBuffer(): Buffer {
    return Buffer.concat(this.audioBuffer)
  }
}
