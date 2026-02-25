import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@mubble/shared'
import type {
  DictationMode,
  DictationState,
  Settings,
  DictionaryEntry,
  DictionaryEntryInput,
  Snippet,
  SnippetInput,
  HistoryEntry,
  HistoryFilters,
  AnalyticsSummary,
  DailyAnalytics,
  AudioDevice,
  STTProviderInfo,
  LLMProviderInfo,
  ValidationResult,
} from '@mubble/shared'

const api = {
  // Settings
  settings: {
    get: <K extends keyof Settings>(key: K): Promise<Settings[K] | null> =>
      ipcRenderer.invoke(IPC.SETTINGS_GET, key),
    set: <K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> =>
      ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
    getAll: (): Promise<Partial<Settings>> =>
      ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),
    onChanged: (cb: (key: string, value: unknown) => void): (() => void) => {
      const handler = (_: unknown, key: string, value: unknown) => cb(key, value)
      ipcRenderer.on(IPC.SETTINGS_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC.SETTINGS_CHANGED, handler)
    },
  },

  // API Keys
  apiKeys: {
    set: (providerId: string, apiKey: string): Promise<void> =>
      ipcRenderer.invoke(IPC.API_KEY_SET, providerId, apiKey),
    get: (providerId: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.API_KEY_GET, providerId),
    delete: (providerId: string): Promise<void> =>
      ipcRenderer.invoke(IPC.API_KEY_DELETE, providerId),
    has: (providerId: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC.API_KEY_HAS, providerId),
  },

  // Dictation
  dictation: {
    start: (mode: DictationMode): Promise<void> =>
      ipcRenderer.invoke(IPC.DICTATION_START, mode),
    stop: (): Promise<void> =>
      ipcRenderer.invoke(IPC.DICTATION_STOP),
    pasteLast: (): Promise<string | null> =>
      ipcRenderer.invoke('dictation:pasteLast'),
    onStateChanged: (cb: (state: DictationState) => void): (() => void) => {
      const handler = (_: unknown, state: DictationState) => cb(state)
      ipcRenderer.on(IPC.DICTATION_STATE_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC.DICTATION_STATE_CHANGED, handler)
    },
    onTranscript: (cb: (text: string, isFinal: boolean) => void): (() => void) => {
      const handler = (_: unknown, text: string, isFinal: boolean) => cb(text, isFinal)
      ipcRenderer.on(IPC.DICTATION_TRANSCRIPT, handler)
      return () => ipcRenderer.removeListener(IPC.DICTATION_TRANSCRIPT, handler)
    },
  },

  // Audio
  audio: {
    getDevices: (): Promise<AudioDevice[]> =>
      ipcRenderer.invoke(IPC.AUDIO_GET_DEVICES),
    setDevice: (deviceId: string): Promise<void> =>
      ipcRenderer.invoke(IPC.AUDIO_SET_DEVICE, deviceId),
    onLevel: (cb: (level: number) => void): (() => void) => {
      const handler = (_: unknown, level: number) => cb(level)
      ipcRenderer.on(IPC.AUDIO_LEVEL, handler)
      return () => ipcRenderer.removeListener(IPC.AUDIO_LEVEL, handler)
    },
  },

  // STT Providers
  stt: {
    listProviders: (): Promise<STTProviderInfo[]> =>
      ipcRenderer.invoke(IPC.STT_LIST_PROVIDERS),
    validateKey: (providerId: string, apiKey: string): Promise<ValidationResult> =>
      ipcRenderer.invoke(IPC.STT_VALIDATE_KEY, providerId, apiKey),
  },

  // LLM Providers
  llm: {
    listProviders: (): Promise<LLMProviderInfo[]> =>
      ipcRenderer.invoke(IPC.LLM_LIST_PROVIDERS),
    validateKey: (providerId: string, apiKey: string): Promise<ValidationResult> =>
      ipcRenderer.invoke(IPC.LLM_VALIDATE_KEY, providerId, apiKey),
  },

  // Dictionary
  dictionary: {
    getAll: (): Promise<DictionaryEntry[]> =>
      ipcRenderer.invoke(IPC.DICT_GET_ALL),
    add: (entry: DictionaryEntryInput): Promise<DictionaryEntry> =>
      ipcRenderer.invoke(IPC.DICT_ADD, entry),
    update: (id: number, entry: Partial<DictionaryEntryInput>): Promise<void> =>
      ipcRenderer.invoke(IPC.DICT_UPDATE, id, entry),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC.DICT_DELETE, id),
  },

  // Snippets
  snippets: {
    getAll: (): Promise<Snippet[]> =>
      ipcRenderer.invoke(IPC.SNIPPETS_GET_ALL),
    add: (snippet: SnippetInput): Promise<Snippet> =>
      ipcRenderer.invoke(IPC.SNIPPETS_ADD, snippet),
    update: (id: number, snippet: Partial<SnippetInput>): Promise<void> =>
      ipcRenderer.invoke(IPC.SNIPPETS_UPDATE, id, snippet),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC.SNIPPETS_DELETE, id),
  },

  // History
  history: {
    query: (filters?: HistoryFilters): Promise<HistoryEntry[]> =>
      ipcRenderer.invoke(IPC.HISTORY_QUERY, filters),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC.HISTORY_DELETE, id),
    clear: (): Promise<void> =>
      ipcRenderer.invoke(IPC.HISTORY_CLEAR),
  },

  // Analytics
  analytics: {
    getDaily: (startDate: string, endDate: string): Promise<DailyAnalytics[]> =>
      ipcRenderer.invoke(IPC.ANALYTICS_GET_DAILY, startDate, endDate),
    getSummary: (): Promise<AnalyticsSummary> =>
      ipcRenderer.invoke(IPC.ANALYTICS_GET_SUMMARY),
  },


  // Shortcuts
  shortcuts: {
    get: (): Promise<{ pushToTalk: string; handsFree: string; commandMode: string; pasteLast: string }> =>
      ipcRenderer.invoke(IPC.SHORTCUTS_GET),
    set: (config: Partial<{ pushToTalk: string; handsFree: string; commandMode: string; pasteLast: string }>): Promise<{ pushToTalk: string; handsFree: string; commandMode: string; pasteLast: string }> =>
      ipcRenderer.invoke(IPC.SHORTCUTS_SET, config),
  },

  // Platform
  platform: {
    getOS: (): Promise<string> =>
      ipcRenderer.invoke(IPC.PLATFORM_GET_OS),
    openExternal: (url: string): Promise<void> =>
      ipcRenderer.invoke(IPC.PLATFORM_OPEN_EXTERNAL, url),
    getVersion: (): Promise<string> =>
      ipcRenderer.invoke(IPC.PLATFORM_GET_VERSION),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(IPC.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.send(IPC.WINDOW_CLOSE),
    toggleFlowBar: () => ipcRenderer.send(IPC.FLOW_BAR_TOGGLE),
  },

  // Navigation (from tray)
  onNavigate: (cb: (path: string) => void): (() => void) => {
    const handler = (_: unknown, path: string) => cb(path)
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
  },

  // Auto-updater
  updates: {
    /** Manually trigger an update check. */
    check: (): Promise<void> =>
      ipcRenderer.invoke(IPC.UPDATE_CHECK).then(() => undefined),

    /** Quit and install the downloaded update immediately. */
    install: (): void => ipcRenderer.send(IPC.UPDATE_INSTALL),

    /** Fires when a new version is available and the download has started. */
    onUpdateAvailable: (cb: (info: { version: string; releaseName: string; releaseDate: string }) => void): (() => void) => {
      const handler = (_: unknown, info: { version: string; releaseName: string; releaseDate: string }) => cb(info)
      ipcRenderer.on(IPC.UPDATE_AVAILABLE, handler)
      return () => ipcRenderer.removeListener(IPC.UPDATE_AVAILABLE, handler)
    },

    /** Fires repeatedly with download progress (0–100 %). */
    onProgress: (cb: (info: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void): (() => void) => {
      const handler = (_: unknown, info: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => cb(info)
      ipcRenderer.on(IPC.UPDATE_PROGRESS, handler)
      return () => ipcRenderer.removeListener(IPC.UPDATE_PROGRESS, handler)
    },

    /** Fires when the update has been downloaded and is ready to install. */
    onUpdateDownloaded: (cb: (info: { version: string; releaseName: string; releaseDate: string }) => void): (() => void) => {
      const handler = (_: unknown, info: { version: string; releaseName: string; releaseDate: string }) => cb(info)
      ipcRenderer.on(IPC.UPDATE_DOWNLOADED, handler)
      return () => ipcRenderer.removeListener(IPC.UPDATE_DOWNLOADED, handler)
    },

    /** Fires if the update check or download encountered an error. */
    onError: (cb: (message: string) => void): (() => void) => {
      const handler = (_: unknown, message: string) => cb(message)
      ipcRenderer.on(IPC.UPDATE_ERROR, handler)
      return () => ipcRenderer.removeListener(IPC.UPDATE_ERROR, handler)
    },
  },
}

export type MubbleAPI = typeof api

contextBridge.exposeInMainWorld('mubble', api)
