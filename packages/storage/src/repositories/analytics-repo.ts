import type BetterSqlite3 from 'better-sqlite3'
import type { DailyAnalytics, AnalyticsSummary } from '@mubble/shared'

export class AnalyticsRepository {
  constructor(private db: BetterSqlite3.Database) {}

  recordDictation(data: {
    wordCount: number; audioDurationMs: number; processingTimeMs: number
    provider: string; app: string | null; language: string | null
  }): void {
    const date = new Date().toISOString().split('T')[0]
    const existing = this.db.prepare('SELECT * FROM daily_analytics WHERE date = ?').get(date) as any

    if (existing) {
      const pu = JSON.parse(existing.provider_usage || '{}')
      pu[data.provider] = (pu[data.provider] || 0) + 1
      const au = JSON.parse(existing.app_usage || '{}')
      if (data.app) au[data.app] = (au[data.app] || 0) + 1
      const lu = JSON.parse(existing.language_usage || '{}')
      if (data.language) lu[data.language] = (lu[data.language] || 0) + 1

      this.db.prepare(
        `UPDATE daily_analytics SET total_dictations = total_dictations + 1,
          total_words = total_words + ?, total_audio_seconds = total_audio_seconds + ?,
          total_processing_ms = total_processing_ms + ?, provider_usage = ?,
          app_usage = ?, language_usage = ? WHERE date = ?`
      ).run(data.wordCount, Math.round(data.audioDurationMs / 1000), data.processingTimeMs,
        JSON.stringify(pu), JSON.stringify(au), JSON.stringify(lu), date)
    } else {
      this.db.prepare(
        `INSERT INTO daily_analytics (date, total_dictations, total_words, total_audio_seconds, total_processing_ms, provider_usage, app_usage, language_usage)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?)`
      ).run(date, data.wordCount, Math.round(data.audioDurationMs / 1000), data.processingTimeMs,
        JSON.stringify({ [data.provider]: 1 }),
        JSON.stringify(data.app ? { [data.app]: 1 } : {}),
        JSON.stringify(data.language ? { [data.language]: 1 } : {}))
    }
  }

  getDaily(startDate: string, endDate: string): DailyAnalytics[] {
    return this.db.prepare('SELECT * FROM daily_analytics WHERE date >= ? AND date <= ? ORDER BY date')
      .all(startDate, endDate).map(mapRow)
  }

  getSummary(): AnalyticsSummary {
    const totals = this.db.prepare(
      'SELECT SUM(total_dictations) as dictations, SUM(total_words) as words, SUM(total_audio_seconds) as audio FROM daily_analytics'
    ).get() as any
    const rows = this.db.prepare('SELECT * FROM daily_analytics ORDER BY date DESC LIMIT 30').all() as any[]

    const pc: Record<string, number> = {}, ac: Record<string, number> = {}
    for (const row of rows) {
      for (const [k, v] of Object.entries(JSON.parse(row.provider_usage || '{}'))) pc[k] = (pc[k] || 0) + (v as number)
      for (const [k, v] of Object.entries(JSON.parse(row.app_usage || '{}'))) ac[k] = (ac[k] || 0) + (v as number)
    }

    const totalWords = totals?.words || 0
    const timeSaved = Math.max(0, (totalWords / 45) * 60 - (totalWords / 220) * 60)

    return {
      totalDictations: totals?.dictations || 0, totalWords,
      totalAudioSeconds: totals?.audio || 0, estimatedTimeSavedSeconds: Math.round(timeSaved),
      topApps: Object.entries(ac).map(([app, count]) => ({ app, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      topProviders: Object.entries(pc).map(([provider, count]) => ({ provider, count })).sort((a, b) => b.count - a.count),
      dailyTrend: rows.reverse().map((r: any) => ({ date: r.date, words: r.total_words, dictations: r.total_dictations })),
    }
  }
}

function mapRow(row: any): DailyAnalytics {
  return {
    date: row.date, totalDictations: row.total_dictations, totalWords: row.total_words,
    totalAudioSeconds: row.total_audio_seconds, totalProcessingMs: row.total_processing_ms,
    providerUsage: JSON.parse(row.provider_usage || '{}'),
    appUsage: JSON.parse(row.app_usage || '{}'),
    languageUsage: JSON.parse(row.language_usage || '{}'),
  }
}
