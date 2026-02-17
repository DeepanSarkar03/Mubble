export type DictationMode = 'push-to-talk' | 'hands-free' | 'command'

export type DictationState =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'injecting'
  | 'error'

export interface DictationSession {
  id: string
  mode: DictationMode
  state: DictationState
  startedAt: number
  rawTranscript: string
  processedText: string
  targetApp: string | null
  sttProvider: string
  llmProvider: string | null
  language: string | null
  audioDurationMs: number
  processingTimeMs: number
}

export interface TranscriptEvent {
  text: string
  isFinal: boolean
  language?: string
  confidence?: number
}
