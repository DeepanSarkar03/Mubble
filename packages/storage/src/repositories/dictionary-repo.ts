import type BetterSqlite3 from 'better-sqlite3'
import type { DictionaryEntry, DictionaryEntryInput } from '@mubble/shared'

export class DictionaryRepository {
  constructor(private db: BetterSqlite3.Database) {}

  getAll(): DictionaryEntry[] {
    return this.db
      .prepare('SELECT * FROM dictionary_entries ORDER BY updated_at DESC')
      .all()
      .map(mapRow)
  }

  add(entry: DictionaryEntryInput): DictionaryEntry {
    const now = Date.now()
    const result = this.db
      .prepare(
        'INSERT INTO dictionary_entries (original, replacement, is_auto_learned, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(entry.original, entry.replacement, entry.isAutoLearned ? 1 : 0, now, now)
    return this.getById(result.lastInsertRowid as number)!
  }

  update(id: number, entry: Partial<DictionaryEntryInput>): void {
    const current = this.getById(id)
    if (!current) return
    this.db
      .prepare(
        'UPDATE dictionary_entries SET original = ?, replacement = ?, updated_at = ? WHERE id = ?'
      )
      .run(
        entry.original ?? current.original,
        entry.replacement ?? current.replacement,
        Date.now(),
        id
      )
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM dictionary_entries WHERE id = ?').run(id)
  }

  incrementFrequency(id: number): void {
    this.db
      .prepare('UPDATE dictionary_entries SET frequency = frequency + 1 WHERE id = ?')
      .run(id)
  }

  private getById(id: number): DictionaryEntry | null {
    const row = this.db
      .prepare('SELECT * FROM dictionary_entries WHERE id = ?')
      .get(id)
    return row ? mapRow(row) : null
  }
}

function mapRow(row: any): DictionaryEntry {
  return {
    id: row.id,
    original: row.original,
    replacement: row.replacement,
    frequency: row.frequency,
    isAutoLearned: !!row.is_auto_learned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
