import type { Database } from '../database'

export class SettingsRepository {
  constructor(private db: Database) {}

  get(key: string): unknown {
    // Use JSON fallback if available
    if (!this.db.instance) {
      const settings = this.db.getSettings()
      return settings[key] ?? null
    }
    
    const row = this.db.instance
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined
    return row ? JSON.parse(row.value) : null
  }

  set(key: string, value: unknown): void {
    // Use JSON fallback if available
    if (!this.db.instance) {
      this.db.setSetting(key, value)
      return
    }
    
    this.db.instance
      .prepare(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)'
      )
      .run(key, JSON.stringify(value), Date.now())
  }

  getAll(): Record<string, unknown> {
    // Use JSON fallback if available
    if (!this.db.instance) {
      return this.db.getSettings()
    }
    
    const rows = this.db.instance.prepare('SELECT key, value FROM settings').all() as Array<{
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
    // Use JSON fallback if available
    if (!this.db.instance) {
      const settings = this.db.getSettings()
      delete settings[key]
      this.db.setSetting(key, undefined)
      return
    }
    
    this.db.instance.prepare('DELETE FROM settings WHERE key = ?').run(key)
  }
}
