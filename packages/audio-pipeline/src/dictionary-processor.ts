/**
 * Dictionary processor for applying custom word replacements
 * to transcribed text. Handles personal dictionary entries,
 * technical terms, names, and custom corrections.
 */

export interface DictionaryEntry {
  id: string
  word: string
  replacement: string
  caseSensitive: boolean
  wholeWord: boolean
  enabled: boolean
}

export class DictionaryProcessor {
  private entries: DictionaryEntry[] = []

  /** Load dictionary entries */
  setEntries(entries: DictionaryEntry[]): void {
    this.entries = entries.filter((e) => e.enabled)
  }

  /** Add a single entry */
  addEntry(entry: DictionaryEntry): void {
    if (entry.enabled) {
      this.entries.push(entry)
    }
  }

  /** Remove an entry by ID */
  removeEntry(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id)
  }

  /**
   * Apply all dictionary replacements to the text.
   * Processes entries in order — first match wins for overlapping replacements.
   */
  process(text: string): string {
    let result = text

    for (const entry of this.entries) {
      result = this.applyEntry(result, entry)
    }

    return result
  }

  /**
   * Apply a single dictionary entry replacement.
   */
  private applyEntry(text: string, entry: DictionaryEntry): string {
    const flags = entry.caseSensitive ? 'g' : 'gi'
    const escaped = this.escapeRegex(entry.word)
    const pattern = entry.wholeWord ? `\\b${escaped}\\b` : escaped

    try {
      const regex = new RegExp(pattern, flags)
      return text.replace(regex, entry.replacement)
    } catch {
      // If regex fails, do simple string replacement
      if (entry.caseSensitive) {
        return text.split(entry.word).join(entry.replacement)
      } else {
        return text.replace(new RegExp(this.escapeRegex(entry.word), 'gi'), entry.replacement)
      }
    }
  }

  /**
   * Suggest a dictionary entry based on a correction.
   * Called when the user manually corrects a transcription,
   * allowing auto-learning of frequently misheard words.
   */
  suggestEntry(original: string, corrected: string): DictionaryEntry | null {
    // Don't suggest if they're the same (case-insensitive)
    if (original.toLowerCase().trim() === corrected.toLowerCase().trim()) {
      return null
    }

    // Don't suggest for very short or very long strings
    if (original.length < 2 || original.length > 50) {
      return null
    }

    return {
      id: `auto_${Date.now()}`,
      word: original.trim(),
      replacement: corrected.trim(),
      caseSensitive: false,
      wholeWord: true,
      enabled: true,
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
