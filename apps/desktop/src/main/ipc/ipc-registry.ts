import { ipcMain, app, shell, safeStorage, BrowserWindow } from 'electron'
import { IPC } from '@mubble/shared'
import { sttRegistry } from '@mubble/stt-providers'
import { llmRegistry } from '@mubble/llm-providers'
import { Database, SettingsRepository, DictionaryRepository, SnippetsRepository, HistoryRepository, AnalyticsRepository, ApiKeysRepository } from '@mubble/storage'
import { DictationManager } from '../dictation/dictation-manager'
import { injectText } from '../text-injector/text-injector'

// Database instance
let db: Database | null = null
let repositories: {
  settings: SettingsRepository
  dictionary: DictionaryRepository
  snippets: SnippetsRepository
  history: HistoryRepository
  analytics: AnalyticsRepository
  apiKeys: ApiKeysRepository
} | null = null

// Dictation manager instance
let dictationManager: DictationManager | null = null

// Initialize database and repositories
async function initializeStorage(): Promise<void> {
  const dbPath = app.getPath('userData')
  db = new Database(dbPath)
  await db.connect()

  repositories = {
    settings: new SettingsRepository(db),
    dictionary: new DictionaryRepository(db),
    snippets: new SnippetsRepository(db),
    history: new HistoryRepository(db),
    analytics: new AnalyticsRepository(db),
    apiKeys: new ApiKeysRepository(db),
  }
}

export async function registerAllHandlers(mainWindow: BrowserWindow | null, flowBarWindow: BrowserWindow | null): Promise<void> {
  // Initialize storage
  await initializeStorage()

  // Initialize dictation manager
  dictationManager = new DictationManager(mainWindow, flowBarWindow)

  // Settings handlers
  ipcMain.handle(IPC.SETTINGS_GET, async (_event, key: string) => {
    return repositories?.settings.get(key) ?? null
  })

  ipcMain.handle(IPC.SETTINGS_SET, async (_event, key: string, value: unknown) => {
    await repositories?.settings.set(key, value)
  })

  ipcMain.handle(IPC.SETTINGS_GET_ALL, async () => {
    return repositories?.settings.getAll() ?? {}
  })

  // API Key handlers (encrypted)
  ipcMain.handle(IPC.API_KEY_SET, async (_event, providerId: string, apiKey: string) => {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(apiKey).toString('base64')
      await repositories?.apiKeys.set(providerId, encrypted)
    } else {
      await repositories?.apiKeys.set(providerId, apiKey)
    }
  })

  ipcMain.handle(IPC.API_KEY_GET, async (_event, providerId: string) => {
    const stored = await repositories?.apiKeys.get(providerId)
    if (!stored) return null
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(stored, 'base64'))
      } catch {
        return stored
      }
    }
    return stored
  })

  ipcMain.handle(IPC.API_KEY_DELETE, async (_event, providerId: string) => {
    await repositories?.apiKeys.delete(providerId)
  })

  ipcMain.handle(IPC.API_KEY_HAS, async (_event, providerId: string) => {
    return (await repositories?.apiKeys.get(providerId)) !== null
  })

  // STT Provider handlers
  ipcMain.handle(IPC.STT_LIST_PROVIDERS, () => {
    return sttRegistry.list().map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      requiresApiKey: p.requiresApiKey,
      website: p.website,
      defaultModel: p.defaultModel,
      models: p.models,
    }))
  })

  ipcMain.handle(IPC.STT_VALIDATE_KEY, async (_event, providerId: string, apiKey: string) => {
    const provider = sttRegistry.get(providerId)
    if (!provider) return { valid: false, error: 'Provider not found' }
    try {
      return await provider.validate({ apiKey })
    } catch (e: any) {
      return { valid: false, error: e?.message || 'Validation failed' }
    }
  })

  // LLM Provider handlers
  ipcMain.handle(IPC.LLM_LIST_PROVIDERS, () => {
    return llmRegistry.list().map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      requiresApiKey: p.requiresApiKey,
      website: p.website,
      defaultModel: p.defaultModel,
      models: p.models,
    }))
  })

  ipcMain.handle(IPC.LLM_VALIDATE_KEY, async (_event, providerId: string, apiKey: string) => {
    const provider = llmRegistry.get(providerId)
    if (!provider) return { valid: false, error: 'Provider not found' }
    try {
      return await provider.validate({ apiKey })
    } catch (e: any) {
      return { valid: false, error: e?.message || 'Validation failed' }
    }
  })

  // Dictionary handlers
  ipcMain.handle(IPC.DICT_GET_ALL, async () => {
    return repositories?.dictionary.getAll() ?? []
  })

  ipcMain.handle(IPC.DICT_ADD, async (_event, entry) => {
    return repositories?.dictionary.add(entry)
  })

  ipcMain.handle(IPC.DICT_UPDATE, async (_event, id, entry) => {
    await repositories?.dictionary.update(id, entry)
  })

  ipcMain.handle(IPC.DICT_DELETE, async (_event, id) => {
    await repositories?.dictionary.delete(id)
  })

  // Snippets handlers
  ipcMain.handle(IPC.SNIPPETS_GET_ALL, async () => {
    return repositories?.snippets.getAll() ?? []
  })

  ipcMain.handle(IPC.SNIPPETS_ADD, async (_event, snippet) => {
    return repositories?.snippets.add(snippet)
  })

  ipcMain.handle(IPC.SNIPPETS_UPDATE, async (_event, id, snippet) => {
    await repositories?.snippets.update(id, snippet)
  })

  ipcMain.handle(IPC.SNIPPETS_DELETE, async (_event, id) => {
    await repositories?.snippets.delete(id)
  })

  // History handlers
  ipcMain.handle(IPC.HISTORY_QUERY, async (_event, filters) => {
    return repositories?.history.query(filters) ?? []
  })

  ipcMain.handle(IPC.HISTORY_DELETE, async (_event, id) => {
    await repositories?.history.delete(id)
  })

  ipcMain.handle(IPC.HISTORY_CLEAR, async () => {
    await repositories?.history.clear()
  })

  // Analytics handlers
  ipcMain.handle(IPC.ANALYTICS_GET_DAILY, async (_event, startDate, endDate) => {
    return repositories?.analytics.getDaily(startDate, endDate) ?? []
  })

  ipcMain.handle(IPC.ANALYTICS_GET_SUMMARY, async () => {
    return repositories?.analytics.getSummary() ?? {
      totalDictations: 0,
      totalWords: 0,
      totalAudioSeconds: 0,
      estimatedTimeSavedSeconds: 0,
      topApps: [],
      topProviders: [],
      dailyTrend: [],
    }
  })

  // Audio handlers
  ipcMain.handle(IPC.AUDIO_GET_DEVICES, async () => {
    // Return mock devices for now
    return [
      { id: 'default', name: 'Default Microphone', isDefault: true },
      { id: 'mic1', name: 'Microphone (Realtek)', isDefault: false },
    ]
  })

  ipcMain.handle(IPC.AUDIO_SET_DEVICE, async (_event, deviceId) => {
    await repositories?.settings.set('audioDevice', deviceId)
  })

  // Dictation handlers - wired to dictation manager
  ipcMain.handle(IPC.DICTATION_START, async (_event, mode) => {
    await dictationManager?.start(mode)
  })

  ipcMain.handle(IPC.DICTATION_STOP, async () => {
    return await dictationManager?.stop()
  })

  ipcMain.handle(IPC.DICTATION_GET_STATE, async () => {
    return {
      state: dictationManager?.getState() ?? 'idle',
      mode: 'push-to-talk'
    }
  })

  // Command mode handlers
  ipcMain.handle('command:execute', async (_event, selectedText: string, command: string) => {
    // This is handled in the dictation manager
    return selectedText
  })

  // Paste last text
  ipcMain.handle('dictation:pasteLast', async () => {
    const lastText = dictationManager?.getHistory()[0]?.processedText
    if (lastText) {
      await injectText(lastText)
    }
    return lastText
  })

  // Platform handlers
  ipcMain.handle(IPC.PLATFORM_GET_OS, () => process.platform)
  ipcMain.handle(IPC.PLATFORM_OPEN_EXTERNAL, async (_event, url: string) => {
    await shell.openExternal(url)
  })
  ipcMain.handle(IPC.PLATFORM_GET_VERSION, () => app.getVersion())
}

export function cleanupStorage(): void {
  db?.close()
}
