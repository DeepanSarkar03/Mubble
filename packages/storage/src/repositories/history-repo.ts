import type BetterSqlite3 from 'better-sqlite3'
import type { HistoryEntry, HistoryFilters } from '@mubble/shared'

export class HistoryRepository {
  constructor(private db: BetterSqlite3.Database) {}

  insert(entry: Omit<HistoryEntry, 'id'>): number {
    const result = this.db
      .prepare(
        `INSERT INTO history (raw_transcript, processed_text, target_app, stt_provider, llm_provider, language, audio_duration_ms, processing_time_ms, word_count, mode, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        entry.rawTranscript, entry.processedText, entry.targetApp,
        entry.sttProvider, entry.llmProvider, entry.language,
        entry.audioDurationMs, entry.processingTimeMs, entry.wordCount,
        entry.mode, entry.createdAt
      )
    return result.lastInsertRowid as number
  }

  query(filters?: HistoryFilters): HistoryEntry[] {
    let sql = 'SELECT * FROM history WHERE 1=1'
    const params: unknown[] = []

    if (filters?.search) {
      sql += ' AND (processed_text LIKE ? OR raw_transcript LIKE ?)'
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }
    if (filters?.targetApp) { sql += ' AND target_app = ?'; params.push(filters.targetApp) }
    if (filters?.sttProvider) { sql += ' AND stt_provider = ?'; params.push(filters.sttProvider) }
    if (filters?.mode) { sql += ' AND mode = ?'; params.push(filters.mode) }
    if (filters?.dateFrom) { sql += ' AND created_at >= ?'; params.push(filters.dateFrom) }
    if (filters?.dateTo) { sql += ' AND created_at <= ?'; params.push(filters.dateTo) }

    sql += ' ORDER BY created_at DESC'
    sql += ` LIMIT ${filters?.limit ?? 100}`
    if (filters?.offset) sql += ` OFFSET ${filters.offset}`

    return this.db.prepare(sql).all(...params).map(mapRow)
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM history WHERE id = ?').run(id)
  }

  clear(): void {
    this.db.prepare('DELETE FROM history').run()
  }
}

function mapRow(row: any): HistoryEntry {
  return {
    id: row.id, rawTranscript: row.raw_transcript, processedText: row.processed_text,
    targetApp: row.target_app, sttProvider: row.stt_provider, llmProvider: row.llm_provider,
    language: row.language, audioDurationMs: row.audio_duration_ms,
    processingTimeMs: row.processing_time_ms, wordCount: row.word_count,
    mode: row.mode, createdAt: row.created_at,
  }
}
