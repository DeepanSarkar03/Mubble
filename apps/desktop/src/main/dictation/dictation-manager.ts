/**
 * Dictation Manager - Full Wispr Flow functionality
 * 
 * Features:
 * - Push-to-Talk: Hold key to record, release to transcribe
 * - Hands-Free: VAD auto-start/stop
 * - Command Mode: Transform selected text
 * - Real STT integration
 * - Dictionary, Snippets, LLM cleanup
 * - Text injection into active window
 */

import { EventEmitter } from 'events'
import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '@mubble/shared'
import { sttRegistry } from '@mubble/stt-providers'
import { llmRegistry } from '@mubble/llm-providers'
import { getCleanupPrompt } from '@mubble/llm-providers'
import type { DictationState, DictationMode } from '@mubble/shared'
import { injectText } from '../text-injector/text-injector'
import { AudioRecorderNative } from '../audio/audio-recorder-native'
import { SoundEffects } from '../audio/sound-effects'
import { ActiveWindowDetector } from '../window-detector/active-window'
import { NotificationManager } from '../notifications/notification-manager'

interface DictationConfig {
  sttProviderId: string
  sttApiKey: string
  sttModel?: string
  llmProviderId?: string
  llmApiKey?: string
  enableCleanup?: boolean
  formality?: 'casual' | 'neutral' | 'formal'
  dictionary?: Record<string, string>
  snippets?: Record<string, string>
}

interface HistoryEntry {
  id: number
  rawText: string
  processedText: string
  timestamp: string
  duration: number
  mode: DictationMode
}

export class DictationManager extends EventEmitter {
  private state: DictationState = 'idle'
  private config: DictationConfig | null = null
  private currentMode: DictationMode = 'push-to-talk'
  private audioRecorder: AudioRecorderNative | null = null
  private lastTranscription: string = ''
  private history: HistoryEntry[] = []
  private historyId = 0
  private startTime: number = 0
  private mainWindow: BrowserWindow | null = null
  private flowBarWindow: BrowserWindow | null = null
  private soundEffects: SoundEffects
  private windowDetector: ActiveWindowDetector
  private notifications: NotificationManager

  constructor(mainWindow: BrowserWindow | null, flowBarWindow: BrowserWindow | null) {
    super()
    this.mainWindow = mainWindow
    this.flowBarWindow = flowBarWindow
    this.soundEffects = new SoundEffects()
    this.windowDetector = new ActiveWindowDetector()
    this.windowDetector.startMonitoring()
    this.notifications = new NotificationManager(mainWindow, flowBarWindow)
    this.setupIPC()
  }

  private setupIPC(): void {
    // Handle dictation start
    ipcMain.handle(IPC.DICTATION_START, async (_event, mode: DictationMode) => {
      return this.start(mode)
    })

    // Handle dictation stop
    ipcMain.handle(IPC.DICTATION_STOP, async () => {
      return this.stop()
    })

    // Get current state
    ipcMain.handle(IPC.DICTATION_GET_STATE, () => {
      return {
        state: this.state,
        mode: this.currentMode
      }
    })

    // Get last transcription
    ipcMain.handle('dictation:getLast', () => {
      return this.lastTranscription
    })

    // Paste last transcription
    ipcMain.handle('dictation:pasteLast', async () => {
      if (this.lastTranscription) {
        await injectText(this.lastTranscription)
      }
      return this.lastTranscription
    })

    // Handle command mode
    ipcMain.handle('command:execute', async (_event, selectedText: string, command: string) => {
      return this.executeCommand(selectedText, command)
    })
  }

  async start(mode: DictationMode = 'push-to-talk'): Promise<void> {
    if (this.state === 'recording' || this.state === 'processing') {
      return
    }

    try {
      // Load config
      this.config = await this.loadConfig()
      if (!this.config) {
        this.notifications.noProviderConfigured()
        this.setState('error')
        return
      }

      this.currentMode = mode
      this.setState('listening')
      this.startTime = Date.now()

      // Start audio recording (native, no ffmpeg needed)
      this.audioRecorder = new AudioRecorderNative({
        sampleRate: 16000,
        channels: 1
      })

      // Listen for audio levels (for VU meter)
      this.audioRecorder.on('level', (level: number) => {
        this.mainWindow?.webContents.send(IPC.AUDIO_LEVEL, level)
        this.flowBarWindow?.webContents.send(IPC.AUDIO_LEVEL, level)
      })

      await this.audioRecorder.start()
      this.setState('recording')
      
      // Play start sound
      this.soundEffects.playStart()

      this.emit('start', { mode, timestamp: this.startTime })
    } catch (error: any) {
      console.error('Failed to start dictation:', error)
      this.soundEffects.playError()
      if (error.message?.includes('microphone') || error.message?.includes('audio')) {
        this.notifications.noMicrophoneAccess()
      } else {
        this.notifications.showError('Failed to start recording', error.message || 'Please check your microphone.')
      }
      this.setState('error')
    }
  }

  async stop(): Promise<string | null> {
    if (this.state !== 'recording') {
      return null
    }

    this.setState('processing')

    try {
      // Stop recording and get audio
      const audioBuffer = this.audioRecorder?.stop()
      const duration = Date.now() - this.startTime

      if (!audioBuffer || audioBuffer.length < 1000) {
        this.showError('Recording too short. Please try again.')
        this.setState('idle')
        return null
      }

      // Get STT provider
      if (!this.config) {
        this.setState('idle')
        return null
      }

      const provider = sttRegistry.get(this.config.sttProviderId)
      if (!provider) {
        this.showError(`STT provider ${this.config.sttProviderId} not found`)
        this.setState('error')
        return null
      }

      // Transcribe audio
      this.showNotification('Transcribing...')
      
      const sttResult = await provider.transcribe(audioBuffer, {
        apiKey: this.config.sttApiKey,
        model: this.config.sttModel,
        language: 'en'
      })

      if (!sttResult.text) {
        this.showError('No speech detected. Please try again.')
        this.setState('idle')
        return null
      }

      // Process text (dictionary, snippets, cleanup)
      const processedText = await this.processText(sttResult.text)

      // Save to history
      this.lastTranscription = processedText
      this.addToHistory(sttResult.text, processedText, duration)

      // Inject text into active window
      this.showNotification('Inserting text...')
      await injectText(processedText)

      // Update analytics
      this.updateAnalytics(processedText, duration)

      // Play success sound
      this.soundEffects.playSuccess()

      // Show success notification
      const wordCount = processedText.split(/\s+/).length
      this.notifications.dictationSuccess(wordCount)

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
      this.notifications.dictationError(error.message || 'Transcription failed. Please try again.')
      this.setState('error')
      return null
    }
  }

  private async processText(rawText: string): Promise<string> {
    if (!this.config) return rawText

    let text = rawText

    // Remove filler words (like Wispr Flow)
    text = this.removeFillerWords(text)

    // Apply dictionary replacements
    if (this.config.dictionary) {
      for (const [from, to] of Object.entries(this.config.dictionary)) {
        text = text.replace(new RegExp(`\\b${this.escapeRegExp(from)}\\b`, 'gi'), to)
      }
    }

    // Apply snippets expansion
    if (this.config.snippets) {
      for (const [trigger, expansion] of Object.entries(this.config.snippets)) {
        const regex = new RegExp(`\\b${this.escapeRegExp(trigger)}\\b`, 'gi')
        if (regex.test(text)) {
          text = text.replace(regex, expansion)
        }
      }
    }

    // Auto-format: capitalize first letter, add period if needed
    text = this.autoFormat(text)

    // Apply LLM cleanup if enabled
    if (this.config.enableCleanup && this.config.llmProviderId && this.config.llmApiKey) {
      try {
        const llmProvider = llmRegistry.get(this.config.llmProviderId)
        if (llmProvider) {
          // Detect current app and get style
          const activeWindow = await this.windowDetector.getActiveWindow()
          const appStyle = activeWindow 
            ? this.windowDetector.getStyleForApp(activeWindow.processName)
            : (this.config.formality || 'neutral')
          
          const systemPrompt = getCleanupPrompt(appStyle)
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
    const fillers = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically', 'literally']
    let result = text
    for (const filler of fillers) {
      result = result.replace(new RegExp(`\\b${filler}\\b\\s*`, 'gi'), ' ')
    }
    return result.replace(/\s+/g, ' ').trim()
  }

  private autoFormat(text: string): string {
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1)
    
    // Add period if no ending punctuation
    if (!text.match(/[.!?]$/)) {
      text += '.'
    }
    
    return text
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private async executeCommand(selectedText: string, command: string): Promise<string> {
    if (!this.config?.llmProviderId || !this.config?.llmApiKey) {
      return selectedText
    }

    const llmProvider = llmRegistry.get(this.config.llmProviderId)
    if (!llmProvider) return selectedText

    const prompts: Record<string, string> = {
      'formal': 'Make this text more formal and professional:',
      'casual': 'Make this text more casual and conversational:',
      'shorter': 'Make this text shorter and more concise:',
      'longer': 'Expand on this text with more detail:',
      'fix': 'Fix any grammar and spelling errors in this text:',
      'bullet': 'Convert this text into bullet points:',
      'email': 'Format this as a professional email:',
    }

    const systemPrompt = prompts[command.toLowerCase()] || command

    try {
      const result = await llmProvider.complete(
        [{ role: 'user', content: `${systemPrompt}\n\n${selectedText}` }],
        {
          apiKey: this.config.llmApiKey,
          temperature: 0.5,
          maxTokens: 2048
        }
      )
      
      const processedText = result.text || selectedText
      
      // Inject the transformed text
      await injectText(processedText)
      
      return processedText
    } catch (e) {
      console.error('Command failed:', e)
      return selectedText
    }
  }

  private async loadConfig(): Promise<DictationConfig | null> {
    // Get settings from storage
    const settings = await ipcMain.emit(IPC.SETTINGS_GET_ALL) || {}
    
    const sttProviderId = settings.activeSTTProvider
    const sttApiKey = settings.sttApiKey
    const llmProviderId = settings.activeLLMProvider
    const llmApiKey = settings.llmApiKey

    if (!sttProviderId || !sttApiKey) {
      return null
    }

    return {
      sttProviderId,
      sttApiKey,
      sttModel: settings.sttModel,
      llmProviderId: llmProviderId || undefined,
      llmApiKey: llmApiKey || undefined,
      enableCleanup: settings.enableCleanup !== false,
      formality: settings.formality || 'neutral',
      dictionary: settings.dictionary || {},
      snippets: settings.snippets || {}
    }
  }

  private addToHistory(rawText: string, processedText: string, duration: number): void {
    this.historyId++
    this.history.unshift({
      id: this.historyId,
      rawText,
      processedText,
      timestamp: new Date().toISOString(),
      duration,
      mode: this.currentMode
    })

    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100)
    }

    // Notify renderer
    this.mainWindow?.webContents.send(IPC.HISTORY_CHANGED, this.history)
  }

  private updateAnalytics(text: string, duration: number): void {
    const wordCount = text.split(/\s+/).length
    
    this.mainWindow?.webContents.send(IPC.ANALYTICS_UPDATE, {
      words: wordCount,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  private setState(newState: DictationState): void {
    this.state = newState
    this.emit('stateChange', newState)
    
    // Notify both windows
    const stateData = { state: newState, mode: this.currentMode }
    this.mainWindow?.webContents.send(IPC.DICTATION_STATE_CHANGED, stateData)
    this.flowBarWindow?.webContents.send(IPC.DICTATION_STATE_CHANGED, stateData)
  }

  private showNotification(message: string): void {
    this.notifications.showInfo(message)
  }

  getState(): DictationState {
    return this.state
  }

  getHistory(): HistoryEntry[] {
    return this.history
  }
}
