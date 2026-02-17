/**
 * Snippet processor for expanding trigger phrases into full text.
 * For example, "my email" → "john@example.com" or
 * "sign off" → "Best regards,\nJohn Doe"
 */

export interface Snippet {
  id: string
  trigger: string
  expansion: string
  enabled: boolean
  caseSensitive: boolean
}

export class SnippetProcessor {
  private snippets: Snippet[] = []

  /** Load all snippets */
  setSnippets(snippets: Snippet[]): void {
    // Sort by trigger length (longest first) to match longer phrases first
    this.snippets = snippets
      .filter((s) => s.enabled)
      .sort((a, b) => b.trigger.length - a.trigger.length)
  }

  /** Add a single snippet */
  addSnippet(snippet: Snippet): void {
    if (snippet.enabled) {
      this.snippets.push(snippet)
      this.snippets.sort((a, b) => b.trigger.length - a.trigger.length)
    }
  }

  /** Remove a snippet by ID */
  removeSnippet(id: string): void {
    this.snippets = this.snippets.filter((s) => s.id !== id)
  }

  /**
   * Process text and expand any matching snippet triggers.
   * Matches are whole-word only to prevent partial matches.
   */
  process(text: string): string {
    let result = text

    for (const snippet of this.snippets) {
      result = this.expandSnippet(result, snippet)
    }

    return result
  }

  /**
   * Expand a single snippet trigger in the text.
   */
  private expandSnippet(text: string, snippet: Snippet): string {
    const flags = snippet.caseSensitive ? 'g' : 'gi'
    const escaped = this.escapeRegex(snippet.trigger)
    // Use word boundaries for whole-word matching
    const pattern = `\\b${escaped}\\b`

    try {
      const regex = new RegExp(pattern, flags)
      return text.replace(regex, snippet.expansion)
    } catch {
      // Fallback to simple replacement
      return text.split(snippet.trigger).join(snippet.expansion)
    }
  }

  /**
   * Check if a text contains any snippet triggers.
   * Useful for UI hints.
   */
  findMatches(text: string): Array<{ snippet: Snippet; index: number }> {
    const matches: Array<{ snippet: Snippet; index: number }> = []

    for (const snippet of this.snippets) {
      const flags = snippet.caseSensitive ? 'g' : 'gi'
      const escaped = this.escapeRegex(snippet.trigger)
      const pattern = `\\b${escaped}\\b`

      try {
        const regex = new RegExp(pattern, flags)
        let match: RegExpExecArray | null
        while ((match = regex.exec(text)) !== null) {
          matches.push({ snippet, index: match.index })
        }
      } catch {
        // Skip invalid patterns
      }
    }

    return matches.sort((a, b) => a.index - b.index)
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
