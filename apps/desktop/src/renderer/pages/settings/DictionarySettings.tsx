import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Search } from 'lucide-react'
import type { DictionaryEntry, DictionaryEntryInput } from '@mubble/shared'
import { Animated, StaggerContainer, Card, Button } from '../../components/ui'

export default function DictionarySettings() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([])
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState<DictionaryEntryInput>({
    word: '',
    replacement: '',
    isRegex: false,
    caseSensitive: false,
  })

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    const data = await window.mubble.dictionary.getAll()
    setEntries(data)
  }

  const handleAdd = async () => {
    if (!newEntry.word || !newEntry.replacement) return
    await window.mubble.dictionary.add(newEntry)
    setNewEntry({ word: '', replacement: '', isRegex: false, caseSensitive: false })
    setIsAdding(false)
    loadEntries()
  }

  const handleDelete = async (id: number) => {
    await window.mubble.dictionary.delete(id)
    loadEntries()
  }

  const filteredEntries = entries.filter(
    (e) =>
      e.word.toLowerCase().includes(search.toLowerCase()) ||
      e.replacement.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Animated animation="fade-in-down" duration={200}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-mubble-text">Dictionary</h2>
            <p className="mt-1 text-sm text-mubble-text-muted">
              Create custom word replacements and corrections
            </p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
          >
            Add Entry
          </Button>
        </div>
      </Animated>

      {/* Search */}
      <Animated animation="fade-in-up" delay={50}>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-mubble-text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dictionary..."
            className="
              w-full rounded-xl border border-mubble-border bg-mubble-surface 
              py-2.5 pl-10 pr-4 text-sm text-mubble-text outline-none 
              transition-all duration-200
              focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20
            "
          />
        </div>
      </Animated>

      {/* Add new entry form */}
      {isAdding && (
        <Animated animation="scale-in" duration={200}>
          <Card padding="lg" className="border-mubble-primary/30 bg-mubble-primary/5">
            <h3 className="mb-3 text-sm font-medium text-mubble-text">Add New Entry</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newEntry.word}
                  onChange={(e) => setNewEntry({ ...newEntry, word: e.target.value })}
                  placeholder="Word to replace"
                  className="
                    rounded-lg border border-mubble-border bg-mubble-bg px-3 py-2 
                    text-sm text-mubble-text outline-none transition-all
                    focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20
                  "
                />
                <input
                  value={newEntry.replacement}
                  onChange={(e) => setNewEntry({ ...newEntry, replacement: e.target.value })}
                  placeholder="Replacement"
                  className="
                    rounded-lg border border-mubble-border bg-mubble-bg px-3 py-2 
                    text-sm text-mubble-text outline-none transition-all
                    focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20
                  "
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-mubble-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEntry.isRegex}
                    onChange={(e) => setNewEntry({ ...newEntry, isRegex: e.target.checked })}
                    className="rounded border-mubble-border"
                  />
                  Use regex
                </label>
                <label className="flex items-center gap-2 text-sm text-mubble-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEntry.caseSensitive}
                    onChange={(e) => setNewEntry({ ...newEntry, caseSensitive: e.target.checked })}
                    className="rounded border-mubble-border"
                  />
                  Case sensitive
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} variant="primary" size="sm">
                  Save
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </Animated>
      )}

      {/* Entries list */}
      <div className="space-y-2">
        {filteredEntries.length === 0 ? (
          <Animated animation="scale-in" duration={300}>
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mubble-surface">
                <BookOpen size={28} className="text-mubble-text-muted" />
              </div>
              <p className="text-sm text-mubble-text-muted">
                {search ? 'No matching entries' : 'No dictionary entries yet'}
              </p>
            </div>
          </Animated>
        ) : (
          <StaggerContainer staggerDelay={30} animation="fade-in-up">
            {filteredEntries.map((entry) => (
              <Card
                key={entry.id}
                hover
                padding="md"
                className="group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-mubble-text">{entry.word}</span>
                  <span className="text-mubble-text-muted">→</span>
                  <span className="text-sm text-mubble-primary">{entry.replacement}</span>
                  {entry.isRegex && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                      regex
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="
                    rounded p-1.5 text-mubble-text-muted opacity-0
                    transition-all duration-200
                    group-hover:opacity-100
                    hover:bg-red-500/10 hover:text-red-400 hover:scale-110
                  "
                >
                  <Trash2 size={14} />
                </button>
              </Card>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  )
}
