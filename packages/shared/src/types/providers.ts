export type AudioFormat = 'pcm16' | 'wav' | 'mp3' | 'webm' | 'ogg'

export interface STTProviderConfig {
  apiKey?: string
  apiEndpoint?: string
  model?: string
  language?: string
  additionalOptions?: Record<string, unknown>
}

export interface STTResult {
  text: string
  language?: string
  confidence?: number
  segments?: STTSegment[]
  duration?: number
}

export interface STTSegment {
  text: string
  start: number
  end: number
  confidence?: number
}

export interface StreamHandle {
  write(chunk: Buffer): void
  end(): void
  abort(): void
}

export interface STTProviderInfo {
  id: string
  name: string
  description: string
  requiresApiKey: boolean
  supportsStreaming: boolean
  supportedFormats: AudioFormat[]
  website: string
  defaultModel?: string
  models?: string[]
}

export interface LLMProviderConfig {
  apiKey: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface LLMProviderInfo {
  id: string
  name: string
  description: string
  models: string[]
  defaultModel: string
  website: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface AudioDevice {
  deviceId: string
  label: string
  isDefault: boolean
}
