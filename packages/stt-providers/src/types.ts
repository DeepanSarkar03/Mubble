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

export interface STTProvider {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly supportedFormats: AudioFormat[]
  readonly supportsStreaming: boolean
  readonly requiresApiKey: boolean
  readonly website: string
  readonly defaultModel?: string
  readonly models?: string[]

  validate(config: STTProviderConfig): Promise<{ valid: boolean; error?: string }>
  transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult>
  startStream?(
    config: STTProviderConfig,
    onPartial: (text: string) => void,
    onFinal: (result: STTResult) => void,
    onError: (error: Error) => void
  ): StreamHandle
}
