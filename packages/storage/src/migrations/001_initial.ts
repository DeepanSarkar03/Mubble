export const migration001 = {
  name: '001_initial',
  sql: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dictionary_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original TEXT NOT NULL,
      replacement TEXT NOT NULL,
      frequency INTEGER DEFAULT 0,
      is_auto_learned INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_dict_original ON dictionary_entries(original);

    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger_phrase TEXT NOT NULL UNIQUE,
      expansion TEXT NOT NULL,
      usage_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_snippets_trigger ON snippets(trigger_phrase);

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_transcript TEXT NOT NULL,
      processed_text TEXT NOT NULL,
      target_app TEXT,
      stt_provider TEXT NOT NULL,
      llm_provider TEXT,
      language TEXT,
      audio_duration_ms INTEGER,
      processing_time_ms INTEGER,
      word_count INTEGER,
      mode TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_history_date ON history(created_at);
    CREATE INDEX IF NOT EXISTS idx_history_app ON history(target_app);

    CREATE TABLE IF NOT EXISTS daily_analytics (
      date TEXT PRIMARY KEY,
      total_dictations INTEGER DEFAULT 0,
      total_words INTEGER DEFAULT 0,
      total_audio_seconds INTEGER DEFAULT 0,
      total_processing_ms INTEGER DEFAULT 0,
      provider_usage TEXT,
      app_usage TEXT,
      language_usage TEXT
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      provider_id TEXT PRIMARY KEY,
      encrypted_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `,
}
