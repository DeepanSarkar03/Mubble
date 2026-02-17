export interface Settings {
  // General
  language: string
  autoDetectLanguage: boolean
  launchAtStartup: boolean

  // Shortcuts
  pushToTalkShortcut: string
  handsFreeShortcut: string
  commandModeShortcut: string
  pasteLastShortcut: string

  // UI
  showFlowBar: boolean
  showInDock: boolean
  showInTaskbar: boolean

  // Audio
  microphoneDeviceId: string | null
  dictationSounds: boolean
  muteMusicWhileDictating: boolean

  // STT
  activeSTTProvider: string
  sttModel: string | null

  // LLM
  activeLLMProvider: string | null
  llmModel: string | null
  enableAICleanup: boolean

  // Style
  defaultFormality: 'casual' | 'neutral' | 'formal'
  styleProfiles: StyleProfile[]
}

export interface StyleProfile {
  id: string
  appPattern: string
  formality: 'casual' | 'neutral' | 'formal'
  vibe: string
  customInstructions?: string
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'auto',
  autoDetectLanguage: true,
  launchAtStartup: false,

  pushToTalkShortcut: 'CommandOrControl+Shift+Space',
  handsFreeShortcut: 'CommandOrControl+Shift+H',
  commandModeShortcut: 'CommandOrControl+Shift+K',
  pasteLastShortcut: 'CommandOrControl+Shift+V',

  showFlowBar: true,
  showInDock: true,
  showInTaskbar: true,

  microphoneDeviceId: null,
  dictationSounds: true,
  muteMusicWhileDictating: false,

  activeSTTProvider: 'openai-whisper',
  sttModel: null,

  activeLLMProvider: null,
  llmModel: null,
  enableAICleanup: true,

  defaultFormality: 'neutral',
  styleProfiles: [],
}
