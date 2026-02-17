import { ipcMain, app, shell, safeStorage } from 'electron'
import { IPC } from '@mubble/shared'

// In-memory settings store (will be backed by SQLite later)
const settingsStore = new Map<string, unknown>()
const apiKeysStore = new Map<string, string>()

export function registerAllHandlers(): void {
  // Settings handlers
  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => {
    return settingsStore.get(key) ?? null
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: unknown) => {
    settingsStore.set(key, value)
  })

  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    return Object.fromEntries(settingsStore)
  })

  // API Key handlers (encrypted)
  ipcMain.handle(IPC.API_KEY_SET, (_event, providerId: string, apiKey: string) => {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(apiKey).toString('base64')
      apiKeysStore.set(providerId, encrypted)
    } else {
      // Fallback: store in memory (not persisted securely)
      apiKeysStore.set(providerId, apiKey)
    }
  })

  ipcMain.handle(IPC.API_KEY_GET, (_event, providerId: string) => {
    const stored = apiKeysStore.get(providerId)
    if (!stored) return null
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(stored, 'base64'))
      } catch {
        return null
      }
    }
    return stored
  })

  ipcMain.handle(IPC.API_KEY_DELETE, (_event, providerId: string) => {
    apiKeysStore.delete(providerId)
  })

  ipcMain.handle(IPC.API_KEY_HAS, (_event, providerId: string) => {
    return apiKeysStore.has(providerId)
  })

  // STT Provider handlers
  ipcMain.handle(IPC.STT_LIST_PROVIDERS, () => {
    // Will be connected to the stt-providers package registry
    return []
  })

  ipcMain.handle(IPC.STT_VALIDATE_KEY, (_event, _providerId: string, _apiKey: string) => {
    return { valid: true }
  })

  // LLM Provider handlers
  ipcMain.handle(IPC.LLM_LIST_PROVIDERS, () => {
    return []
  })

  ipcMain.handle(IPC.LLM_VALIDATE_KEY, (_event, _providerId: string, _apiKey: string) => {
    return { valid: true }
  })

  // Dictionary handlers (stub)
  ipcMain.handle(IPC.DICT_GET_ALL, () => [])
  ipcMain.handle(IPC.DICT_ADD, () => null)
  ipcMain.handle(IPC.DICT_UPDATE, () => null)
  ipcMain.handle(IPC.DICT_DELETE, () => null)

  // Snippets handlers (stub)
  ipcMain.handle(IPC.SNIPPETS_GET_ALL, () => [])
  ipcMain.handle(IPC.SNIPPETS_ADD, () => null)
  ipcMain.handle(IPC.SNIPPETS_UPDATE, () => null)
  ipcMain.handle(IPC.SNIPPETS_DELETE, () => null)

  // History handlers (stub)
  ipcMain.handle(IPC.HISTORY_QUERY, () => [])
  ipcMain.handle(IPC.HISTORY_DELETE, () => null)
  ipcMain.handle(IPC.HISTORY_CLEAR, () => null)

  // Analytics handlers (stub)
  ipcMain.handle(IPC.ANALYTICS_GET_DAILY, () => [])
  ipcMain.handle(IPC.ANALYTICS_GET_SUMMARY, () => ({
    totalDictations: 0,
    totalWords: 0,
    totalAudioSeconds: 0,
    estimatedTimeSavedSeconds: 0,
    topApps: [],
    topProviders: [],
    dailyTrend: [],
  }))

  // Audio handlers (stub)
  ipcMain.handle(IPC.AUDIO_GET_DEVICES, () => [])
  ipcMain.handle(IPC.AUDIO_SET_DEVICE, () => null)

  // Dictation handlers (stub)
  ipcMain.handle(IPC.DICTATION_START, () => null)
  ipcMain.handle(IPC.DICTATION_STOP, () => null)

  // Platform handlers
  ipcMain.handle(IPC.PLATFORM_GET_OS, () => process.platform)
  ipcMain.handle(IPC.PLATFORM_OPEN_EXTERNAL, (_event, url: string) => {
    shell.openExternal(url)
  })
  ipcMain.handle(IPC.PLATFORM_GET_VERSION, () => app.getVersion())
}
