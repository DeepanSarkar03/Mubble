import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

// Try to import better-sqlite3, fallback to JSON if not available
let BetterSqlite3: any
try {
  BetterSqlite3 = require('better-sqlite3')
} catch {
  console.log('better-sqlite3 not available, using JSON fallback')
}

interface JsonDatabase {
  settings: Record<string, any>
  dictionary: any[]
  snippets: any[]
  history: any[]
  analytics: any[]
  apiKeys: Record<string, string>
}

export class Database {
  private db: any
  private useSqlite: boolean
  private jsonPath: string = ''
  private data: JsonDatabase = {
    settings: {},
    dictionary: [],
    snippets: [],
    history: [],
    analytics: [],
    apiKeys: {}
  }

  constructor(dbPath: string) {
    this.useSqlite = !!BetterSqlite3
    
    if (this.useSqlite) {
      // Use SQLite
      const dbFile = join(dbPath, 'mubble.db')
      this.db = new BetterSqlite3(dbFile)
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('foreign_keys = ON')
      // Run migrations
      const { runMigrations } = require('./migrations/runner')
      runMigrations(this.db)
    } else {
      // Use JSON fallback
      this.jsonPath = join(dbPath, 'mubble-data.json')
      this.data = this.loadJson()
    }
  }

  private loadJson(): JsonDatabase {
    try {
      if (existsSync(this.jsonPath)) {
        return JSON.parse(readFileSync(this.jsonPath, 'utf-8'))
      }
    } catch (error) {
      console.error('Failed to load JSON database:', error)
    }
    
    return {
      settings: {},
      dictionary: [],
      snippets: [],
      history: [],
      analytics: [],
      apiKeys: {}
    }
  }

  private saveJson(): void {
    try {
      const dir = this.jsonPath.substring(0, this.jsonPath.lastIndexOf('\\'))
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(this.jsonPath, JSON.stringify(this.data, null, 2))
    } catch (error) {
      console.error('Failed to save JSON database:', error)
    }
  }

  get instance(): any {
    return this.db
  }

  // JSON fallback methods
  getSettings(): Record<string, any> {
    return this.data.settings
  }

  setSetting(key: string, value: any): void {
    this.data.settings[key] = value
    this.saveJson()
  }

  getDictionary(): any[] {
    return this.data.dictionary
  }

  addDictionaryEntry(entry: any): void {
    this.data.dictionary.push({ id: Date.now(), ...entry })
    this.saveJson()
  }

  updateDictionaryEntry(id: number, entry: any): void {
    const idx = this.data.dictionary.findIndex((e: any) => e.id === id)
    if (idx >= 0) {
      this.data.dictionary[idx] = { ...this.data.dictionary[idx], ...entry }
      this.saveJson()
    }
  }

  deleteDictionaryEntry(id: number): void {
    this.data.dictionary = this.data.dictionary.filter((e: any) => e.id !== id)
    this.saveJson()
  }

  getSnippets(): any[] {
    return this.data.snippets
  }

  addSnippet(snippet: any): void {
    this.data.snippets.push({ id: Date.now(), ...snippet })
    this.saveJson()
  }

  updateSnippet(id: number, snippet: any): void {
    const idx = this.data.snippets.findIndex((s: any) => s.id === id)
    if (idx >= 0) {
      this.data.snippets[idx] = { ...this.data.snippets[idx], ...snippet }
      this.saveJson()
    }
  }

  deleteSnippet(id: number): void {
    this.data.snippets = this.data.snippets.filter((s: any) => s.id !== id)
    this.saveJson()
  }

  getApiKey(providerId: string): string | null {
    return this.data.apiKeys[providerId] || null
  }

  setApiKey(providerId: string, apiKey: string): void {
    this.data.apiKeys[providerId] = apiKey
    this.saveJson()
  }

  deleteApiKey(providerId: string): void {
    delete this.data.apiKeys[providerId]
    this.saveJson()
  }

  close(): void {
    if (this.useSqlite && this.db) {
      this.db.close()
    } else {
      this.saveJson()
    }
  }
}
