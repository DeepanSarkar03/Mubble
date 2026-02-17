import type BetterSqlite3 from 'better-sqlite3'
import { migration001 } from './001_initial'

const migrations = [migration001]

export function runMigrations(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `)

  const applied = db
    .prepare('SELECT name FROM _migrations')
    .all()
    .map((row: any) => row.name)

  for (const migration of migrations) {
    if (!applied.includes(migration.name)) {
      db.exec(migration.sql)
      db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(
        migration.name,
        Date.now()
      )
    }
  }
}
