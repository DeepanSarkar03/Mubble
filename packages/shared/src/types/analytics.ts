export interface DailyAnalytics {
  date: string
  totalDictations: number
  totalWords: number
  totalAudioSeconds: number
  totalProcessingMs: number
  providerUsage: Record<string, number>
  appUsage: Record<string, number>
  languageUsage: Record<string, number>
}

export interface AnalyticsSummary {
  totalDictations: number
  totalWords: number
  totalAudioSeconds: number
  estimatedTimeSavedSeconds: number
  topApps: Array<{ app: string; count: number }>
  topProviders: Array<{ provider: string; count: number }>
  dailyTrend: Array<{ date: string; words: number; dictations: number }>
}
