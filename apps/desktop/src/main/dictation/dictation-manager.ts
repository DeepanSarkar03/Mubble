/**
 * Dictation Manager - Orchestrates the entire dictation flow
 * 
 * Flow:
 * 1. Start recording audio
 * 2. Send audio to STT provider
 * 3. Process result (dictionary, snippets, LLM cleanup)
 * 4. Inject text into active window
 */

import { EventEmitter } from 'events'
import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '@mubble/shared'
import { sttRegistry } from '@mubble/stt-providers'
import { llmRegistry } from '@mubble/llm-providers'
import { getCleanupPrompt } from '@mubble/llm-providers'
import type { DictationState, DictationMode } from '@mubble/shared'
import { injectText } from '../text-injector/text-injector'

interface DictationConfig {
  sttProviderId: string
  sttApiKey: string
  sttModel?: string
  llmProviderId?: string
  llmApiKey?: string
  enableCleanup?: boolean
  dictionary?: Record<string, string>
  snippets?: Record<string, string>
}

export class DictationManager extends EventEmitter {
  private state: DictationState = 'idle'
  private config: DictationConfig | null = null
  private currentMode: DictationMode = 'push-to-talk'
  private audioBuffer: Buffer | null = null
  private startTime: number = 0

  constructor(private mainWindow: BrowserWindow | null) {
    super()
    this.setupIPC()
  }

  private setupIPC() {
    // Handle dictation start from renderer
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
  }

  async start(mode: DictationMode = 'push-to-talk'): Promise<void> {
    if (this.state === 'recording' || this.state === 'processing') {
      return
    }

    try {
      // Load config from settings
      this.config = await this.loadConfig()
      if (!this.config) {
        throw new Error('No STT provider configured')
      }

      this.currentMode = mode
      this.setState('listening')

      // For now, simulate the recording process
      // In full implementation, this would use native audio capture
      this.startTime = Date.now()
      
      // If push-to-talk, we wait for stop() to be called
      // If hands-free, VAD would trigger stop automatically
      
      this.emit('start', { mode, timestamp: this.startTime })
    } catch (error) {
      this.setState('error')
      throw error
    }
  }

  async stop(): Promise<string | null> {
    if (this.state !== 'listening' && this.state !== 'recording') {
      return null
    }

    this.setState('processing')

    try {
      // In real implementation, get audio buffer from recorder
      // For now, simulate the process
      const duration = Date.now() - this.startTime
      
      // Simulate audio capture delay
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get the STT provider
      if (!this.config) {
        throw new Error('No configuration loaded')
      }

      const provider = sttRegistry.get(this.config.sttProviderId)
      if (!provider) {
        throw new Error(`STT provider ${this.config.sttProviderId} not found`)
      }

      // In real implementation, transcribe actual audio
      // For demo purposes, show a notification that transcription is happening
      this.notifyTranscribing()

      // Simulate transcription (replace with actual STT call)
      const rawText = await this.simulateTranscription()

      if (!rawText) {
        this.setState('idle')
        return null
      }

      // Process text (dictionary, snippets, cleanup)
      const processedText = await this.processText(rawText)

      // Inject text into active window
      await injectText(processedText)

      // Save to history
      await this.saveHistory(rawText, processedText, duration)

      this.setState('idle')
      this.emit('result', { rawText, processedText, duration })

      return processedText
    } catch (error) {
      this.setState('error')
      this.emit('error', error)
      throw error
    }
  }

  private async simulateTranscription(): Promise<string> {
    // In real implementation, this would:
    // 1. Get audio buffer from recorder
    // 2. Call provider.transcribe(audioBuffer, config)
    // 3. Return the transcription
    
    // For demo, return a placeholder
    return "This is a simulated transcription. In the full implementation, this would be actual speech-to-text output from your configured provider."
  }

  private async processText(rawText: string): Promise<string> {
    if (!this.config) return rawText

    let text = rawText

    // Apply dictionary replacements
    if (this.config.dictionary) {
      for (const [from, to] of Object.entries(this.config.dictionary)) {
        text = text.replace(new RegExp(`\\b${from}\\b`, 'gi'), to)
      }
    }

    // Apply snippets expansion
    if (this.config.snippets) {
      for (const [trigger, expansion] of Object.entries(this.config.snippets)) {
        if (text.toLowerCase().includes(trigger.toLowerCase())) {
          text = text.replace(new RegExp(`\\b${trigger}\\b`, 'gi'), expansion)
        }
      }
    }

    // Apply LLM cleanup if enabled
    if (this.config.enableCleanup && this.config.llmProviderId && this.config.llmApiKey) {
      const llmProvider = llmRegistry.get(this.config.llmProviderId)
      if (llmProvider) {
        try {
          const systemPrompt = getCleanupPrompt('neutral')
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
        } catch (e) {
          console.error('LLM cleanup failed:', e)
        }
      }
    }

    return text
  }

  private async loadConfig(): Promise<DictationConfig | null> {
    // Get settings from IPC handlers
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
      dictionary: settings.dictionary || {},
      snippets: settings.snippets || {}
    }
  }

  private async saveHistory(rawText: string, processedText: string, duration: number) {
    // Save to history via IPC
    ipcMain.emit(IPC.HISTORY_ADD, {
      rawText,
      processedText,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  private setState(newState: DictationState) {
    this.state = newState
    this.emit('stateChange', newState)
    
    // Notify renderer
    this.mainWindow?.webContents.send(IPC.DICTATION_STATE_CHANGED, {
      state: newState,
      mode: this.currentMode
    })
  }

  private notifyTranscribing() {
    this.mainWindow?.webContents.send(IPC.DICTATION_TRANSCRIPT, {
      text: 'Transcribing...',
      isFinal: false
    })
  }

  getState(): DictationState {
    return this.state
  }
}
