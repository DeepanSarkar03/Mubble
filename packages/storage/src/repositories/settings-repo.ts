import type BetterSqlite3 from 'better-sqlite3'

export class SettingsRepository {
  constructor(private db: BetterSqlite3.Database) {}

  get(key: string): unknown {
    const row = this.db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined
    return row ? JSON.parse(row.value) : null
  }

  set(key: string, value: unknown): void {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)'
      )
      .run(key, JSON.stringify(value), Date.now())
  }

  getAll(): Record<string, unknown> {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as Array<{
      key: string
      value: string
    }>
    const result: Record<string, unknown> = {}
    for (const row of rows) {
      result[row.key] = JSON.parse(row.value)
    }
    return result
  }

  delete(key: string): void {
    this.db.prepare('DELETE FROM settings WHERE key = ?').run(key)
  }
}
