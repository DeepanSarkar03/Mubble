export const IPC = {
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_CHANGED: 'settings:changed',

  // Dictation
  DICTATION_START: 'dictation:start',
  DICTATION_STOP: 'dictation:stop',
  DICTATION_STATE_CHANGED: 'dictation:state-changed',
  DICTATION_TRANSCRIPT: 'dictation:transcript',

  // Audio
  AUDIO_GET_DEVICES: 'audio:getDevices',
  AUDIO_SET_DEVICE: 'audio:setDevice',
  AUDIO_LEVEL: 'audio:level',

  // STT Providers
  STT_LIST_PROVIDERS: 'stt:listProviders',
  STT_SET_PROVIDER: 'stt:setProvider',
  STT_GET_PROVIDER: 'stt:getProvider',
  STT_VALIDATE_KEY: 'stt:validateKey',

  // LLM Providers
  LLM_LIST_PROVIDERS: 'llm:listProviders',
  LLM_SET_PROVIDER: 'llm:setProvider',
  LLM_GET_PROVIDER: 'llm:getProvider',
  LLM_VALIDATE_KEY: 'llm:validateKey',

  // Dictionary
  DICT_GET_ALL: 'dictionary:getAll',
  DICT_ADD: 'dictionary:add',
  DICT_UPDATE: 'dictionary:update',
  DICT_DELETE: 'dictionary:delete',

  // Snippets
  SNIPPETS_GET_ALL: 'snippets:getAll',
  SNIPPETS_ADD: 'snippets:add',
  SNIPPETS_UPDATE: 'snippets:update',
  SNIPPETS_DELETE: 'snippets:delete',

  // History
  HISTORY_QUERY: 'history:query',
  HISTORY_DELETE: 'history:delete',
  HISTORY_CLEAR: 'history:clear',
  HISTORY_ADD: 'history:add',

  // Analytics
  ANALYTICS_GET_DAILY: 'analytics:getDaily',
  ANALYTICS_GET_SUMMARY: 'analytics:getSummary',

  // Platform
  PLATFORM_GET_OS: 'platform:getOS',
  PLATFORM_OPEN_EXTERNAL: 'platform:openExternal',
  PLATFORM_GET_VERSION: 'platform:getVersion',

  // API Keys
  API_KEY_SET: 'apiKey:set',
  API_KEY_GET: 'apiKey:get',
  API_KEY_DELETE: 'apiKey:delete',
  API_KEY_HAS: 'apiKey:has',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  FLOW_BAR_TOGGLE: 'flowBar:toggle',

  // Auto-updater (main → renderer events)
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_DOWNLOADING: 'update:downloading',
  UPDATE_PROGRESS: 'update:progress',
  UPDATE_DOWNLOADED: 'update:downloaded',
  UPDATE_ERROR: 'update:error',
  UPDATE_NOT_AVAILABLE: 'update:not-available',

  // Auto-updater (renderer → main commands)
  UPDATE_CHECK: 'update:check',
  UPDATE_INSTALL: 'update:install',
} as const
