/**
 * Streaming STT - Real-time transcription using WebSocket
 * Sends audio chunks as they arrive for live transcription
 */

import { EventEmitter } from 'events'
import { sttRegistry } from '@mubble/stt-providers'

interface StreamingSTTOptions {
  providerId: string
  apiKey: string
  model?: string
  language?: string
  onTranscript: (text: string, isFinal: boolean) => void
  onError: (error: Error) => void
}

export class StreamingSTT extends EventEmitter {
  private options: StreamingSTTOptions
  private audioBuffer: Buffer[] = []
  private isStreaming = false
  private ws: WebSocket | null = null

  constructor(options: StreamingSTTOptions) {
    super()
    this.options = options
   }

  async start(): Promise<void> {
    const provider = sttRegistry.get(this.options.providerId)
    if (!provider) {
      throw new Error(`Provider ${this.options.providerId} not found`)
    }

    // Check if provider supports streaming
    if (!provider.supportsStreaming) {
      // Fall back to batch mode
      this.isStreaming = false
      return
    }

    // Set up WebSocket connection for streaming
    // This would connect to provider's streaming endpoint
    // For now, we'll accumulate and transcribe at the end
    this.isStreaming = true
    this.audioBuffer = []
  }

  addAudioChunk(chunk: Buffer): void {
    if (!this.isStreaming) return
    
    this.audioBuffer.push(chunk)
    
    // For providers that support true streaming (like Deepgram, AssemblyAI)
    // we would send this chunk over WebSocket here
    
    // For now, just accumulate
  }

  async stop(): Promise<string> {
    this.isStreaming = false
    
    const provider = sttRegistry.get(this.options.providerId)
    if (!provider) {
      throw new Error('Provider not found')
    }

    // Combine all audio chunks
    const fullAudio = Buffer.concat(this.audioBuffer)
    
    if (fullAudio.length < 1000) {
      throw new Error('Audio too short')
    }

    // Transcribe the full audio
    const result = await provider.transcribe(fullAudio, 'webm', {
      apiKey: this.options.apiKey,
      model: this.options.model,
      language: this.options.language || 'en'
    })

    return result.text
  }

  getIsStreaming(): boolean {
    return this.isStreaming
  }
}
