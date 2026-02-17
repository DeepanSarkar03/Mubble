/**
 * DictationPipeline — The core orchestrator.
 *
 * Flow: Microphone → Resampler → AudioBuffer → STT → Dictionary → Snippets → LLM Cleanup → Output
 *
 * Supports two modes:
 * - Push-to-Talk: User holds a key to record, releases to transcribe
 * - Hands-Free: VAD auto-detects speech start/end
 *
 * Also supports Command Mode: capture selected text + voice command → LLM transformation
 */

import { EventEmitter } from 'events'
import { AudioAccumulator } from './audio-buffer'
import { AudioResampler } from './resampler'
import { VoiceActivityDetector } from './vad'
import { DictionaryProcessor } from './dictionary-processor'
import { SnippetProcessor } from './snippet-processor'
import type { DictionaryEntry } from './dictionary-processor'
import type { Snippet } from './snippet-processor'

export type PipelineMode = 'push-to-talk' | 'hands-free' | 'command'

export type PipelineState =
  | 'idle'
  | 'listening'
  | 'recording'
  | 'processing'
  | 'error'

export interface PipelineConfig {
  /** STT provider ID */
  sttProviderId: string
  /** STT provider config (API key, model, etc.) */
  sttConfig: {
    apiKey?: string
    model?: string
    language?: string
    additionalOptions?: Record<string, unknown>
  }
  /** LLM provider ID (for cleanup) */
  llmProviderId?: string
  /** LLM provider config */
  llmConfig?: {
    apiKey?: string
    model?: string
    temperature?: number
    systemPrompt?: string
  }
  /** Audio input sample rate (default: 48000) */
  inputSampleRate?: number
  /** Audio input channels (default: 1) */
  inputChannels?: number
  /** Whether to apply LLM cleanup (default: true) */
  enableCleanup?: boolean
  /** Formality level for cleanup (default: 'neutral') */
  formality?: 'casual' | 'neutral' | 'formal'
  /** VAD options for hands-free mode */
  vadOptions?: {
    threshold?: number
    silenceDurationMs?: number
  }
}

export interface PipelineResult {
  /** Final processed text */
  text: string
  /** Raw STT output before processing */
  rawText: string
  /** Detected language */
  language?: string
  /** Duration of audio in seconds */
  duration?: number
  /** STT confidence score */
  confidence?: number
  /** Pipeline mode used */
  mode: PipelineMode
  /** Time taken for STT in ms */
  sttTimeMs: number
  /** Time taken for LLM cleanup in ms (0 if not used) */
  llmTimeMs: number
  /** Total pipeline time in ms */
  totalTimeMs: number
}

export interface PipelineEvents {
  stateChange: (state: PipelineState) => void
  partialTranscript: (text: string) => void
  result: (result: PipelineResult) => void
  error: (error: Error) => void
  audioLevel: (level: number) => void
}

export class DictationPipeline extends EventEmitter {
  private config: PipelineConfig
  private state: PipelineState = 'idle'
  private mode: PipelineMode = 'push-to-talk'

  // Audio components
  private resampler: AudioResampler
  private audioBuffer: AudioAccumulator
  private vad: VoiceActivityDetector

  // Text processors
  private dictionaryProcessor: DictionaryProcessor
  private snippetProcessor: SnippetProcessor

  // Provider references (injected externally)
  private sttProvider: any = null
  private llmProvider: any = null

  // Streaming state
  private streamHandle: any = null
  private isRecording = false

  constructor(config: PipelineConfig) {
    super()
    this.config = config
    this.resampler = new AudioResampler(
      config.inputSampleRate || 48000,
      16000,
      config.inputChannels || 1,
    )
    this.audioBuffer = new AudioAccumulator()
    this.vad = new VoiceActivityDetector(config.vadOptions)
    this.dictionaryProcessor = new DictionaryProcessor()
    this.snippetProcessor = new SnippetProcessor()
  }

  /** Set the STT provider instance */
  setSTTProvider(provider: any): void {
    this.sttProvider = provider
  }

  /** Set the LLM provider instance */
  setLLMProvider(provider: any): void {
    this.llmProvider = provider
  }

  /** Load dictionary entries */
  setDictionary(entries: DictionaryEntry[]): void {
    this.dictionaryProcessor.setEntries(entries)
  }

  /** Load snippets */
  setSnippets(snippets: Snippet[]): void {
    this.snippetProcessor.setSnippets(snippets)
  }

  /** Update pipeline configuration */
  updateConfig(partial: Partial<PipelineConfig>): void {
    Object.assign(this.config, partial)
    if (partial.inputSampleRate || partial.inputChannels) {
      this.resampler = new AudioResampler(
        this.config.inputSampleRate || 48000,
        16000,
        this.config.inputChannels || 1,
      )
    }
  }

  /** Get current state */
  getState(): PipelineState {
    return this.state
  }

  /** Get current mode */
  getMode(): PipelineMode {
    return this.mode
  }

  /**
   * Start recording (push-to-talk mode).
   * Call stopRecording() when the user releases the key.
   */
  async startRecording(mode: PipelineMode = 'push-to-talk'): Promise<void> {
    if (this.isRecording) return

    this.mode = mode
    this.isRecording = true
    this.audioBuffer.clear()
    this.setState('recording')

    // If the STT provider supports streaming, start a stream
    if (this.sttProvider?.startStream && mode !== 'command') {
      try {
        this.streamHandle = this.sttProvider.startStream(
          this.config.sttConfig,
          (partial: string) => this.emit('partialTranscript', partial),
          (result: any) => {
            // Will be handled in stopRecording
          },
          (error: Error) => this.emit('error', error),
        )
      } catch {
        // Fall back to batch transcription
        this.streamHandle = null
      }
    }

    if (mode === 'hands-free') {
      await this.vad.initialize()
      this.vad.on('speechEnd', () => {
        this.stopRecording()
      })
    }
  }

  /**
   * Feed audio data into the pipeline.
   * Called continuously while recording.
   * @param audioData Raw audio data from the microphone (Float32Array or Buffer)
   */
  processAudio(audioData: Float32Array | Buffer): void {
    if (!this.isRecording) return

    // Convert to 16-bit PCM if needed
    let pcmData: Buffer
    if (audioData instanceof Float32Array) {
      pcmData = this.resampler.float32ToInt16(audioData)
    } else {
      pcmData = audioData
    }

    // Resample to 16kHz
    const resampled = this.resampler.resample(pcmData)

    // Calculate and emit audio level
    const level = this.calculateLevel(resampled)
    this.emit('audioLevel', level)

    // Store in buffer
    this.audioBuffer.write(resampled)

    // Feed to streaming STT if available
    if (this.streamHandle) {
      this.streamHandle.write(resampled)
    }

    // Feed to VAD if in hands-free mode
    if (this.mode === 'hands-free') {
      const float32 = this.resampler.int16ToFloat32(resampled)
      this.vad.processFrame(float32).catch((e) => this.emit('error', e))
    }
  }

  /**
   * Stop recording and process the captured audio.
   * Returns the final result after STT + dictionary + snippets + LLM cleanup.
   */
  async stopRecording(): Promise<PipelineResult | null> {
    if (!this.isRecording) return null

    this.isRecording = false
    const startTime = Date.now()
    this.setState('processing')

    // End streaming if active
    if (this.streamHandle) {
      this.streamHandle.end()
      this.streamHandle = null
    }

    // Stop VAD if in hands-free mode
    if (this.mode === 'hands-free') {
      this.vad.reset()
    }

    try {
      // Get accumulated audio
      const audioData = this.audioBuffer.drain()
      if (audioData.length === 0) {
        this.setState('idle')
        return null
      }

      // Wrap in WAV header for providers that need it
      const wavData = AudioResampler.createWavHeader(audioData, 16000)

      // Step 1: STT
      const sttStart = Date.now()
      if (!this.sttProvider) {
        throw new Error('No STT provider configured')
      }

      const sttResult = await this.sttProvider.transcribe(
        wavData,
        'wav',
        this.config.sttConfig,
      )
      const sttTimeMs = Date.now() - sttStart
      const rawText = sttResult.text || ''

      if (!rawText.trim()) {
        this.setState('idle')
        return null
      }

      // Step 2: Dictionary replacements
      let processedText = this.dictionaryProcessor.process(rawText)

      // Step 3: Snippet expansion
      processedText = this.snippetProcessor.process(processedText)

      // Step 4: LLM cleanup (optional)
      let llmTimeMs = 0
      if (this.config.enableCleanup !== false && this.llmProvider && this.config.llmConfig?.apiKey) {
        const llmStart = Date.now()
        try {
          const { getCleanupPrompt } = require('@mubble/llm-providers')
          const systemPrompt = getCleanupPrompt(this.config.formality || 'neutral')

          const llmResult = await this.llmProvider.complete(
            [{ role: 'user', content: processedText }],
            { ...this.config.llmConfig, systemPrompt },
          )
          if (llmResult.text?.trim()) {
            processedText = llmResult.text.trim()
          }
          llmTimeMs = Date.now() - llmStart
        } catch (e) {
          // LLM cleanup is optional — if it fails, use the pre-cleanup text
          console.warn('LLM cleanup failed, using raw text:', e)
          llmTimeMs = Date.now() - llmStart
        }
      }

      const totalTimeMs = Date.now() - startTime
      const result: PipelineResult = {
        text: processedText,
        rawText,
        language: sttResult.language,
        duration: sttResult.duration || this.audioBuffer.getDurationSeconds(),
        confidence: sttResult.confidence,
        mode: this.mode,
        sttTimeMs,
        llmTimeMs,
        totalTimeMs,
      }

      this.setState('idle')
      this.emit('result', result)
      return result
    } catch (error) {
      this.setState('error')
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Command Mode: Transform selected text with a voice command.
   * @param selectedText The text the user has selected
   * @param voiceCommand The voice command (already transcribed)
   */
  async executeCommand(selectedText: string, voiceCommand: string): Promise<string> {
    if (!this.llmProvider) {
      throw new Error('No LLM provider configured for Command Mode')
    }

    this.setState('processing')
    try {
      const { buildCommandModeMessages } = require('@mubble/llm-providers')
      const messages = buildCommandModeMessages(selectedText, voiceCommand)

      const result = await this.llmProvider.complete(messages, {
        ...this.config.llmConfig,
      })

      this.setState('idle')
      return result.text?.trim() || selectedText
    } catch (error) {
      this.setState('error')
      throw error
    }
  }

  /** Cancel any in-progress operation */
  cancel(): void {
    this.isRecording = false
    if (this.streamHandle) {
      this.streamHandle.abort()
      this.streamHandle = null
    }
    this.vad.reset()
    this.audioBuffer.clear()
    this.setState('idle')
  }

  /** Clean up resources */
  destroy(): void {
    this.cancel()
    this.vad.destroy()
    this.removeAllListeners()
  }

  private setState(state: PipelineState): void {
    if (this.state !== state) {
      this.state = state
      this.emit('stateChange', state)
    }
  }

  /**
   * Calculate audio level (RMS) for visualization.
   * Returns a value between 0 and 1.
   */
  private calculateLevel(pcmData: Buffer): number {
    const samples = pcmData.length / 2
    if (samples === 0) return 0

    let sumSquares = 0
    for (let i = 0; i < samples; i++) {
      const sample = pcmData.readInt16LE(i * 2) / 32768
      sumSquares += sample * sample
    }

    const rms = Math.sqrt(sumSquares / samples)
    return Math.min(1, rms * 5) // Amplify for better visual range
  }
}
