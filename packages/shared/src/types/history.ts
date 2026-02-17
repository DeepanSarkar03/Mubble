export interface HistoryEntry {
  id: number
  rawTranscript: string
  processedText: string
  targetApp: string | null
  sttProvider: string
  llmProvider: string | null
  language: string | null
  audioDurationMs: number
  processingTimeMs: number
  wordCount: number
  mode: string
  createdAt: number
}

export interface HistoryFilters {
  search?: string
  targetApp?: string
  sttProvider?: string
  mode?: string
  dateFrom?: number
  dateTo?: number
  limit?: number
  offset?: number
}
