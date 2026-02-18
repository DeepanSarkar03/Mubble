/**
 * Audio Recorder - Records audio from microphone
 * Uses node-record-lpcm16 for cross-platform audio capture
 */

import { EventEmitter } from 'events'
import { spawn, ChildProcess } from 'child_process'
import { platform } from 'os'

export interface AudioRecorderOptions {
  sampleRate?: number
  channels?: number
  device?: string
  silenceThreshold?: number
  silenceDuration?: number
}

export class AudioRecorder extends EventEmitter {
  private process: ChildProcess | null = null
  private audioBuffer: Buffer[] = []
  private isRecording = false
  private options: Required<AudioRecorderOptions>

  constructor(options: AudioRecorderOptions = {}) {
    super()
    this.options = {
      sampleRate: 16000,
      channels: 1,
      device: '',
      silenceThreshold: 0.5,
      silenceDuration: 2000,
      ...options
    }
  }

  async start(): Promise<void> {
    if (this.isRecording) return

    this.isRecording = true
    this.audioBuffer = []

    const os = platform()

    try {
      if (os === 'win32') {
        await this.startWindows()
      } else if (os === 'darwin') {
        await this.startMacOS()
      } else {
        await this.startLinux()
      }
      this.emit('start')
    } catch (error) {
      this.isRecording = false
      this.emit('error', error)
      throw error
    }
  }

  private async startWindows(): Promise<void> {
    // Use PowerShell and Windows Sound Recorder or ffmpeg
    // For production, use a native Node.js addon or ffmpeg
    const args = [
      '-f', 'dshow',
      '-i', `audio=${this.options.device || 'Microphone'}`,
      '-ar', this.options.sampleRate.toString(),
      '-ac', this.options.channels.toString(),
      '-f', 's16le',
      '-'
    ]

    this.process = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    })

    this.setupProcessHandlers()
  }

  private async startMacOS(): Promise<void> {
    // Use ffmpeg with AVFoundation
    const args = [
      '-f', 'avfoundation',
      '-i', `:${this.options.device || '0'}`,
      '-ar', this.options.sampleRate.toString(),
      '-ac', this.options.channels.toString(),
      '-f', 's16le',
      '-'
    ]

    this.process = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    })

    this.setupProcessHandlers()
  }

  private async startLinux(): Promise<void> {
    // Use arecord (ALSA) or ffmpeg with pulse
    const args = [
      '-f', 'alsa',
      '-i', this.options.device || 'default',
      '-ar', this.options.sampleRate.toString(),
      '-ac', this.options.channels.toString(),
      '-f', 's16le',
      '-'
    ]

    this.process = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    })

    this.setupProcessHandlers()
  }

  private setupProcessHandlers(): void {
    if (!this.process) return

    this.process.stdout?.on('data', (data: Buffer) => {
      this.audioBuffer.push(data)
      this.emit('data', data)
      
      // Calculate audio level for VU meter
      const level = this.calculateAudioLevel(data)
      this.emit('level', level)
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      // ffmpeg outputs to stderr
      console.log('Audio recorder:', data.toString())
    })

    this.process.on('error', (error) => {
      this.isRecording = false
      this.emit('error', error)
    })

    this.process.on('close', (code) => {
      this.isRecording = false
      if (code !== 0 && code !== null) {
        this.emit('error', new Error(`Recorder exited with code ${code}`))
      }
    })
  }

  private calculateAudioLevel(data: Buffer): number {
    // Calculate RMS (root mean square) audio level
    let sum = 0
    const samples = data.length / 2 // 16-bit samples
    
    for (let i = 0; i < data.length; i += 2) {
      const sample = data.readInt16LE(i)
      sum += sample * sample
    }
    
    const rms = Math.sqrt(sum / samples)
    // Normalize to 0-1 range (16-bit max is 32768)
    return Math.min(rms / 32768, 1)
  }

  stop(): Buffer {
    if (!this.isRecording || !this.process) {
      return Buffer.concat(this.audioBuffer)
    }

    this.isRecording = false

    // Kill the ffmpeg process
    this.process.kill('SIGTERM')
    
    // Force kill after 2 seconds if still running
    setTimeout(() => {
      if (this.process && !this.process.killed) {
        this.process.kill('SIGKILL')
      }
    }, 2000)

    const result = Buffer.concat(this.audioBuffer)
    this.emit('stop', result)
    return result
  }

  getIsRecording(): boolean {
    return this.isRecording
  }

  getAudioBuffer(): Buffer {
    return Buffer.concat(this.audioBuffer)
  }
}
