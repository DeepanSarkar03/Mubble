export interface Snippet {
  id: number
  triggerPhrase: string
  expansion: string
  usageCount: number
  createdAt: number
  updatedAt: number
}

export interface SnippetInput {
  triggerPhrase: string
  expansion: string
}
