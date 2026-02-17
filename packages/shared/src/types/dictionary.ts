export interface DictionaryEntry {
  id: number
  original: string
  replacement: string
  frequency: number
  isAutoLearned: boolean
  createdAt: number
  updatedAt: number
}

export interface DictionaryEntryInput {
  original: string
  replacement: string
  isAutoLearned?: boolean
}
