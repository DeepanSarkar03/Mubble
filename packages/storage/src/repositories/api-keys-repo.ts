import type BetterSqlite3 from 'better-sqlite3'

export class ApiKeysRepository {
  constructor(private db: BetterSqlite3.Database) {}

  set(providerId: string, encryptedKey: string): void {
    const now = Date.now()
    this.db.prepare(
      'INSERT OR REPLACE INTO api_keys (provider_id, encrypted_key, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run(providerId, encryptedKey, now, now)
  }

  get(providerId: string): string | null {
    const row = this.db.prepare('SELECT encrypted_key FROM api_keys WHERE provider_id = ?')
      .get(providerId) as { encrypted_key: string } | undefined
    return row?.encrypted_key ?? null
  }

  delete(providerId: string): void {
    this.db.prepare('DELETE FROM api_keys WHERE provider_id = ?').run(providerId)
  }

  has(providerId: string): boolean {
    return !!this.db.prepare('SELECT 1 FROM api_keys WHERE provider_id = ?').get(providerId)
  }
}
