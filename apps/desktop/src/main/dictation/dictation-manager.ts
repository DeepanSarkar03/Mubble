/**
 * Dictation Manager - Full Wispr Flow implementation
 * 
 * Flow:
 * 1. User presses shortcut
 * 2. Start audio recording via hidden window (getUserMedia)
 * 3. Stream/accumulate audio chunks
 * 4. User releases shortcut
 * 5. Stop recording, send to STT
 * 6. Process result (dict, snippets, cleanup)
 * 7. Inject text into active window
 */

import { EventEmitter } from 'events'
import { BrowserWindow } from 'electron'
import { IPC } from '@mubble/shared'
import { sttRegistry } from '@mubble/stt-providers'
import { llmRegistry } from '@mubble/llm-providers'
import { getCleanupPrompt } from '@mubble/llm-providers'
import type { DictationState, DictationMode } from '@mubble/shared'
import { AudioRecorder } from '../audio/audio-recorder'
import { injectText } from '../text-injector/text-injector'
import { SoundEffects } from '../audio/sound-effects'
import { NotificationManager } from '../notifications/notification-manager'

interface DictationConfig {
  sttProviderId: string
  sttApiKey: string
  sttModel?: string
  llmProviderId?: string
  llmApiKey?: string
  enableCleanup?: boolean
  formality?: 'casual' | 'neutral' | 'formal'
  language?: string
  microphoneDeviceId?: string | null
  audioSampleRate?: number
  dictionary?: Record<string, string>
  snippets?: Record<string, string>
}

interface DictationConfigLoaders {
  getSettings: () => Promise<Record<string, any>>
  getApiKey: (providerId: string) => Promise<string | null>
}

export class DictationManager extends EventEmitter {
  private state: DictationState = 'idle'
  private config: DictationConfig | null = null
  private currentMode: DictationMode = 'push-to-talk'
  private audioRecorder: AudioRecorder | null = null
  private lastTranscription = ''
  private startTime = 0
  private mainWindow: BrowserWindow | null = null
  private flowBarWindow: BrowserWindow | null = null
  private soundEffects: SoundEffects
  private notifications: NotificationManager
  private history: Array<{text: string, timestamp: number}> = []
  private configLoaders: DictationConfigLoaders

  constructor(
    mainWindow: BrowserWindow | null,
    flowBarWindow: BrowserWindow | null,
    configLoaders: DictationConfigLoaders
  ) {
    super()
    this.mainWindow = mainWindow
    this.flowBarWindow = flowBarWindow
    this.configLoaders = configLoaders
    this.soundEffects = new SoundEffects()
    this.notifications = new NotificationManager(mainWindow, flowBarWindow)
  }

  async start(mode: DictationMode = 'push-to-talk'): Promise<boolean> {
    if (this.state === 'recording' || this.state === 'processing') {
      console.log('Already recording, ignoring start request')
      return false
    }

    console.log('Starting dictation...')

    try {
      // Load config
      this.config = await this.loadConfig()
      if (!this.config) {
        console.error('No STT provider configured')
        this.notifications.showError('No STT provider configured', 'Please set up a provider in Settings first.')
        this.setState('error')
        return false
      }

      console.log('Config loaded:', this.config.sttProviderId)

      this.currentMode = mode
      this.setState('recording')
      this.startTime = Date.now()

      // Start audio recording
      this.audioRecorder = new AudioRecorder({
        sampleRate: this.config.audioSampleRate || 16000,
        channels: 1,
        deviceId: this.config.microphoneDeviceId || '',
      })

      // Listen for audio levels
      this.audioRecorder.on('level', (level: number) => {
        this.mainWindow?.webContents.send(IPC.AUDIO_LEVEL, level)
        this.flowBarWindow?.webContents.send(IPC.AUDIO_LEVEL, level)
      })

      // Listen for errors
      this.audioRecorder.on('error', (error: Error) => {
        console.error('Audio recorder error:', error)
        this.soundEffects.playError()
        this.notifications.showError('Recording error', error.message)
        this.setState('error')
      })

      await this.audioRecorder.start()
      
      // Play start sound
      this.soundEffects.playStart()
      
      console.log('Recording started successfully')
      this.emit('start', { mode, timestamp: this.startTime })
      
      return true
    } catch (error: any) {
      console.error('Failed to start dictation:', error)
      this.soundEffects.playError()
      this.notifications.showError('Failed to start recording', error.message || 'Check microphone permissions')
      this.setState('error')
      return false
    }
  }

  async stop(): Promise<string | null> {
    if (this.state !== 'recording') {
      console.log('Not recording, ignoring stop request')
      return null
    }

    console.log('Stopping dictation...')
    this.setState('processing')
    this.soundEffects.playStop()

    try {
      // Stop recording and get audio
      const audioBuffer = this.audioRecorder?.stop()
      const duration = Date.now() - this.startTime

      if (!audioBuffer || audioBuffer.length < 1000) {
        console.warn('Recording too short')
        this.notifications.showWarning('Recording too short', 'Please hold the key longer while speaking.')
        this.setState('idle')
        return null
      }

      console.log(`Audio recorded: ${audioBuffer.length} bytes, ${duration}ms`)

      // Get STT provider
      if (!this.config) {
        console.error('No config loaded')
        this.setState('idle')
        return null
      }

      const provider = sttRegistry.get(this.config.sttProviderId)
      if (!provider) {
        throw new Error(`STT provider ${this.config.sttProviderId} not found`)
      }

      console.log('Transcribing with', provider.name)

      // Transcribe audio
      const sttResult = await provider.transcribe(audioBuffer, 'webm', {
        apiKey: this.config.sttApiKey,
        model: this.config.sttModel,
        language: this.config.language || 'en'
      })

      if (!sttResult.text || sttResult.text.trim().length === 0) {
        console.warn('No speech detected')
        this.notifications.showWarning('No speech detected', 'Try speaking louder or closer to the microphone.')
        this.setState('idle')
        return null
      }

      console.log('Raw transcript:', sttResult.text)

      // Process text
      const processedText = await this.processText(sttResult.text)
      console.log('Processed text:', processedText)

      // Save to history
      this.lastTranscription = processedText
      this.history.unshift({ text: processedText, timestamp: Date.now() })
      if (this.history.length > 100) this.history.pop()

      // Inject text into active window
      console.log('Injecting text...')
      await injectText(processedText)

      // Success
      this.soundEffects.playSuccess()
      const wordCount = processedText.split(/\s+/).length
      this.notifications.showSuccess(`Inserted ${wordCount} words`)

      this.setState('idle')
      this.emit('result', { 
        rawText: sttResult.text, 
        processedText, 
        duration,
        confidence: sttResult.confidence 
      })

      return processedText
    } catch (error: any) {
      console.error('Dictation failed:', error)
      this.soundEffects.playError()
      this.notifications.showError('Transcription failed', error.message || 'Please try again')
      this.setState('error')
      return null
    }
  }

  private async processText(rawText: string): Promise<string> {
    if (!this.config) return rawText

    let text = rawText

    // Remove filler words
    text = this.removeFillerWords(text)

    // Apply dictionary
    if (this.config.dictionary) {
      for (const [from, to] of Object.entries(this.config.dictionary)) {
        text = text.replace(new RegExp(`\\b${this.escapeRegExp(from)}\\b`, 'gi'), to)
      }
    }

    // Apply snippets
    if (this.config.snippets) {
      for (const [trigger, expansion] of Object.entries(this.config.snippets)) {
        const regex = new RegExp(`\\b${this.escapeRegExp(trigger)}\\b`, 'gi')
        if (regex.test(text)) {
          text = text.replace(regex, expansion)
        }
      }
    }

    // Auto-format
    text = this.autoFormat(text)

    // LLM cleanup
    if (this.config.enableCleanup && this.config.llmProviderId && this.config.llmApiKey) {
      try {
        const llmProvider = llmRegistry.get(this.config.llmProviderId)
        if (llmProvider) {
          const systemPrompt = getCleanupPrompt(this.config.formality || 'neutral')
          const result = await llmProvider.complete(
            [{ role: 'user', content: text }],
            {
              apiKey: this.config.llmApiKey,
              systemPrompt,
              temperature: 0.3,
              maxTokens: 2048
            }
          )
          text = result.text || text
        }
      } catch (e) {
        console.error('LLM cleanup failed:', e)
      }
    }

    return text
  }

  private removeFillerWords(text: string): string {
    const fillers = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically', 'literally', 'so', 'well']
    let result = text
    for (const filler of fillers) {
      result = result.replace(new RegExp(`\\b${filler}\\b\\s*`, 'gi'), ' ')
    }
    return result.replace(/\s+/g, ' ').trim()
  }

  private autoFormat(text: string): string {
    text = text.charAt(0).toUpperCase() + text.slice(1)
    if (!text.match(/[.!?]$/)) {
      text += '.'
    }
    return text
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private async loadConfig(): Promise<DictationConfig | null> {
    const settings = await this.configLoaders.getSettings()
    
    const sttProviderId = settings.activeSTTProvider
    const sttApiKey = await this.configLoaders.getApiKey(`stt:${sttProviderId}`)
    const llmProviderId = settings.activeLLMProvider as string | null
    const llmApiKey = llmProviderId
      ? await this.configLoaders.getApiKey(`llm:${llmProviderId}`)
      : null

    if (!sttProviderId || !sttApiKey) {
      return null
    }

    return {
      sttProviderId,
      sttApiKey,
      sttModel: settings.sttModel,
      llmProviderId: llmProviderId || undefined,
      llmApiKey: llmApiKey || undefined,
      enableCleanup: settings.enableAICleanup !== false,
      formality: settings.defaultFormality || 'neutral',
      language: settings.language || 'en',
      microphoneDeviceId: settings.microphoneDeviceId || null,
      audioSampleRate: settings.audioSampleRate || 16000,
      dictionary: settings.dictionary || {},
      snippets: settings.snippets || {}
    }
  }

  private setState(newState: DictationState): void {
    console.log(`State: ${this.state} -> ${newState}`)
    this.state = newState
    this.emit('stateChange', newState)
    
    const stateData = { state: newState, mode: this.currentMode }
    this.mainWindow?.webContents.send(IPC.DICTATION_STATE_CHANGED, stateData)
    this.flowBarWindow?.webContents.send(IPC.DICTATION_STATE_CHANGED, stateData)
  }

  getState(): DictationState {
    return this.state
  }

  getLastTranscription(): string {
    return this.lastTranscription
  }
}
