export const APP_NAME = 'Mubble'
export const APP_VERSION = '0.1.0'

export const DEFAULT_SHORTCUTS = {
  pushToTalk: 'CommandOrControl+Shift+Space',
  handsFree: 'CommandOrControl+Shift+H',
  commandMode: 'CommandOrControl+Shift+K',
  pasteLast: 'CommandOrControl+Shift+V',
} as const

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ta', name: 'Tamil' },
  { code: 'bn', name: 'Bengali' },
] as const

export const STT_PROVIDER_IDS = {
  OPENAI_WHISPER: 'openai-whisper',
  DEEPGRAM: 'deepgram',
  GOOGLE_CLOUD_SPEECH: 'google-cloud-speech',
  LOCAL_WHISPER: 'local-whisper',
  GROQ: 'groq',
  AZURE_AI_FOUNDRY: 'azure-ai-foundry',
  CLOUDFLARE: 'cloudflare',
  FIREWORKS_AI: 'fireworks-ai',
  JIGSAWSTACK: 'jigsawstack',
  SAMBANOVA: 'sambanova',
  TOGETHER_AI: 'together-ai',
  LEMONFOX: 'lemonfox',
  ASSEMBLYAI: 'assemblyai',
  GLADIA: 'gladia',
} as const

export const LLM_PROVIDER_IDS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE_GEMINI: 'google-gemini',
  GROQ: 'groq',
} as const
