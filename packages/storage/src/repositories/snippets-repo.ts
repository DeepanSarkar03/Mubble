import type BetterSqlite3 from 'better-sqlite3'
import type { Snippet, SnippetInput } from '@mubble/shared'

export class SnippetsRepository {
  constructor(private db: BetterSqlite3.Database) {}

  getAll(): Snippet[] {
    return this.db
      .prepare('SELECT * FROM snippets ORDER BY usage_count DESC')
      .all()
      .map(mapRow)
  }

  add(input: SnippetInput): Snippet {
    const now = Date.now()
    const result = this.db
      .prepare(
        'INSERT INTO snippets (trigger_phrase, expansion, created_at, updated_at) VALUES (?, ?, ?, ?)'
      )
      .run(input.triggerPhrase, input.expansion, now, now)
    return this.getById(result.lastInsertRowid as number)!
  }

  update(id: number, input: Partial<SnippetInput>): void {
    const current = this.getById(id)
    if (!current) return
    this.db
      .prepare(
        'UPDATE snippets SET trigger_phrase = ?, expansion = ?, updated_at = ? WHERE id = ?'
      )
      .run(
        input.triggerPhrase ?? current.triggerPhrase,
        input.expansion ?? current.expansion,
        Date.now(),
        id
      )
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM snippets WHERE id = ?').run(id)
  }

  incrementUsage(id: number): void {
    this.db
      .prepare('UPDATE snippets SET usage_count = usage_count + 1 WHERE id = ?')
      .run(id)
  }

  private getById(id: number): Snippet | null {
    const row = this.db.prepare('SELECT * FROM snippets WHERE id = ?').get(id)
    return row ? mapRow(row) : null
  }
}

function mapRow(row: any): Snippet {
  return {
    id: row.id,
    triggerPhrase: row.trigger_phrase,
    expansion: row.expansion,
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
