/**
 * Voice Activity Detection (VAD) integration.
 * Uses Silero VAD via @ricky0123/vad-node for detecting speech segments.
 * This enables hands-free mode where dictation starts/stops automatically.
 */

import { EventEmitter } from 'events'

export interface VADOptions {
  /** Probability threshold above which speech is detected (0-1, default: 0.5) */
  threshold?: number
  /** Minimum speech duration in ms to trigger (default: 250) */
  minSpeechDurationMs?: number
  /** Silence duration in ms to end speech segment (default: 1500) */
  silenceDurationMs?: number
  /** Audio sample rate (default: 16000) */
  sampleRate?: number
  /** Frame size in samples (default: 512 for Silero) */
  frameSamples?: number
}

export interface VADEvent {
  /** Whether speech is currently detected */
  isSpeech: boolean
  /** Speech probability from the model (0-1) */
  probability: number
  /** Timestamp in ms */
  timestamp: number
}

export class VoiceActivityDetector extends EventEmitter {
  private options: Required<VADOptions>
  private vadInstance: any = null
  private isSpeaking = false
  private speechStartTime = 0
  private lastSpeechTime = 0
  private silenceTimer: NodeJS.Timeout | null = null
  private _isRunning = false

  constructor(options: VADOptions = {}) {
    super()
    this.options = {
      threshold: options.threshold ?? 0.5,
      minSpeechDurationMs: options.minSpeechDurationMs ?? 250,
      silenceDurationMs: options.silenceDurationMs ?? 1500,
      sampleRate: options.sampleRate ?? 16000,
      frameSamples: options.frameSamples ?? 512,
    }
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  /**
   * Initialize the Silero VAD model.
   * Must be called before processing audio.
   */
  async initialize(): Promise<void> {
    try {
      const vad = require('@ricky0123/vad-node')
      this.vadInstance = await vad.Silero.new()
      this._isRunning = true
    } catch (error: any) {
      // If vad-node is not installed, use energy-based fallback
      console.warn('Silero VAD not available, using energy-based detection:', error.message)
      this.vadInstance = null
      this._isRunning = true
    }
  }

  /**
   * Process an audio frame (Float32Array of samples).
   * Emits 'speechStart' and 'speechEnd' events.
   */
  async processFrame(frame: Float32Array): Promise<VADEvent> {
    if (!this._isRunning) {
      throw new Error('VAD not initialized. Call initialize() first.')
    }

    let probability: number

    if (this.vadInstance?.process) {
      // Use Silero VAD model
      probability = await this.vadInstance.process(frame)
    } else {
      // Fallback: energy-based VAD
      probability = this.computeEnergy(frame)
    }

    const isSpeech = probability >= this.options.threshold
    const now = Date.now()

    if (isSpeech) {
      this.lastSpeechTime = now

      if (!this.isSpeaking) {
        this.speechStartTime = now
        this.isSpeaking = true

        // Clear any pending silence timer
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer)
          this.silenceTimer = null
        }

        // Only emit speechStart after minimum duration
        setTimeout(() => {
          if (this.isSpeaking && Date.now() - this.speechStartTime >= this.options.minSpeechDurationMs) {
            this.emit('speechStart', { probability, timestamp: this.speechStartTime })
          }
        }, this.options.minSpeechDurationMs)
      }
    } else if (this.isSpeaking && !this.silenceTimer) {
      // Start silence timer
      this.silenceTimer = setTimeout(() => {
        if (this.isSpeaking) {
          this.isSpeaking = false
          this.silenceTimer = null
          this.emit('speechEnd', {
            probability,
            timestamp: now,
            duration: now - this.speechStartTime,
          })
        }
      }, this.options.silenceDurationMs)
    }

    const event: VADEvent = { isSpeech, probability, timestamp: now }
    this.emit('frame', event)
    return event
  }

  /**
   * Simple energy-based voice activity detection.
   * Used as fallback when Silero VAD is not available.
   */
  private computeEnergy(frame: Float32Array): number {
    if (frame.length === 0) return 0

    let sumSquares = 0
    for (let i = 0; i < frame.length; i++) {
      sumSquares += frame[i] * frame[i]
    }
    const rms = Math.sqrt(sumSquares / frame.length)

    // Map RMS to 0-1 probability (rough approximation)
    // RMS of ~0.01 = silence, ~0.1+ = speech
    const normalized = Math.min(1, Math.max(0, (rms - 0.005) / 0.05))
    return normalized
  }

  /** Reset the VAD state */
  reset(): void {
    this.isSpeaking = false
    this.speechStartTime = 0
    this.lastSpeechTime = 0
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  /** Stop and clean up */
  destroy(): void {
    this.reset()
    this._isRunning = false
    this.vadInstance = null
    this.removeAllListeners()
  }
}
