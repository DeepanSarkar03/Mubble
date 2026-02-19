/**
 * Native Audio Recorder using Web Audio API via hidden BrowserWindow
 * No ffmpeg required - uses Chromium's built-in audio capture
 */

import { EventEmitter } from 'events'
import { BrowserWindow } from 'electron'
import { join } from 'path'

export interface AudioRecorderOptions {
  sampleRate?: number
  channels?: number
  deviceId?: string
}

export class AudioRecorderNative extends EventEmitter {
  private recordingWindow: BrowserWindow | null = null
  private isRecording = false
  private audioChunks: Buffer[] = []
  private options: Required<AudioRecorderOptions>

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
    this.audioChunks = []

    // Create hidden window for Web Audio API access
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

    // Load inline HTML with Web Audio recording
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          let mediaRecorder = null;
          let audioChunks = [];
          let audioContext = null;
          let analyser = null;
          let dataArray = null;
          let intervalId = null;

          async function startRecording() {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  sampleRate: 16000,
                  channelCount: 1,
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true
                }
              });

              // Set up audio context for level monitoring
              audioContext = new AudioContext({ sampleRate: 16000 });
              const source = audioContext.createMediaStreamSource(stream);
              analyser = audioContext.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);
              dataArray = new Uint8Array(analyser.frequencyBinCount);

              // Start level monitoring
              intervalId = setInterval(() => {
                if (analyser && dataArray) {
                  analyser.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                  }
                  const average = sum / dataArray.length;
                  const normalized = average / 255;
                  window.electronAPI.sendAudioLevel(normalized);
                }
              }, 50);

              // Set up MediaRecorder
              mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
              });

              audioChunks = [];
              mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  audioChunks.push(event.data);
                }
              };

              mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                window.electronAPI.sendAudioData(buffer);
              };

              mediaRecorder.start(100); // Collect data every 100ms
              window.electronAPI.sendStatus('started');
            } catch (err) {
              window.electronAPI.sendStatus('error:' + err.message);
            }
          }

          function stopRecording() {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
            if (audioContext) {
              audioContext.close();
            }
          }

          // Expose functions to main process
          window.startRecording = startRecording;
          window.stopRecording = stopRecording;

          // Auto-start
          startRecording();
        </script>
      </body>
      </html>
    `

    await this.recordingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    // Set up IPC from hidden window
    const { ipcMain } = require('electron')
    
    ipcMain.once('audio:started', () => {
      this.emit('start')
    })

    ipcMain.once('audio:error', (_event, error) => {
      this.emit('error', new Error(error))
      this.cleanup()
    })

    ipcMain.on('audio:level', (_event, level) => {
      this.emit('level', level)
    })

    ipcMain.once('audio:data', (_event, buffer) => {
      this.audioChunks.push(buffer)
      this.emit('data', buffer)
    })

    // Inject IPC bridge
    await this.recordingWindow.webContents.executeJavaScript(`
      const { ipcRenderer } = require('electron');
      window.electronAPI = {
        sendAudioLevel: (level) => ipcRenderer.send('audio:level', level),
        sendAudioData: (buffer) => ipcRenderer.send('audio:data', buffer),
        sendStatus: (status) => ipcRenderer.send('audio:' + status)
      };
    `)

    // Wait for recording to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Recording timeout')), 5000)
      
      ipcMain.once('audio:started', () => {
        clearTimeout(timeout)
        resolve(true)
      })

      ipcMain.once('audio:error', (_event, error) => {
        clearTimeout(timeout)
        reject(new Error(error))
      })
    })

    this.emit('start')
  }

  stop(): Buffer {
    if (!this.isRecording) {
      return Buffer.concat(this.audioChunks)
    }

    this.isRecording = false

    // Trigger stop in hidden window
    this.recordingWindow?.webContents.executeJavaScript('window.stopRecording()')

    const result = Buffer.concat(this.audioChunks)
    
    setTimeout(() => this.cleanup(), 1000)

    this.emit('stop', result)
    return result
  }

  private cleanup(): void {
    this.recordingWindow?.destroy()
    this.recordingWindow = null
  }

  getIsRecording(): boolean {
    return this.isRecording
  }
}
