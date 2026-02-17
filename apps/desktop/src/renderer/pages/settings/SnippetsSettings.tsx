import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2, Search, Sparkles } from 'lucide-react'
import type { Snippet, SnippetInput } from '@mubble/shared'
import { Animated, StaggerContainer, Card, Button } from '../../components/ui'

export default function SnippetsSettings() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newSnippet, setNewSnippet] = useState<SnippetInput>({
    trigger: '',
    replacement: '',
  })

  useEffect(() => {
    loadSnippets()
  }, [])

  const loadSnippets = async () => {
    const data = await window.mubble.snippets.getAll()
    setSnippets(data)
  }

  const handleAdd = async () => {
    if (!newSnippet.trigger || !newSnippet.replacement) return
    await window.mubble.snippets.add(newSnippet)
    setNewSnippet({ trigger: '', replacement: '' })
    setIsAdding(false)
    loadSnippets()
  }

  const handleDelete = async (id: number) => {
    await window.mubble.snippets.delete(id)
    loadSnippets()
  }

  const filteredSnippets = snippets.filter(
    (s) =>
      s.trigger.toLowerCase().includes(search.toLowerCase()) ||
      s.replacement.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Animated animation="fade-in-down" duration={200}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-mubble-text">Snippets</h2>
            <p className="mt-1 text-sm text-mubble-text-muted">
              Create text shortcuts that expand when you type them
            </p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
          >
            Add Snippet
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
            placeholder="Search snippets..."
            className="
              w-full rounded-xl border border-mubble-border bg-mubble-surface 
              py-2.5 pl-10 pr-4 text-sm text-mubble-text outline-none 
              transition-all duration-200
              focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20
            "
          />
        </div>
      </Animated>

      {/* Add new snippet form */}
      {isAdding && (
        <Animated animation="scale-in" duration={200}>
          <Card padding="lg" className="border-mubble-primary/30 bg-mubble-primary/5">
            <h3 className="mb-3 text-sm font-medium text-mubble-text">Add New Snippet</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-mubble-text-muted">Trigger</label>
                <input
                  value={newSnippet.trigger}
                  onChange={(e) => setNewSnippet({ ...newSnippet, trigger: e.target.value })}
                  placeholder="e.g., @@email"
                  className="
                    w-full rounded-lg border border-mubble-border bg-mubble-bg px-3 py-2 
                    text-sm text-mubble-text outline-none transition-all
                    focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20
                  "
                />
                <p className="mt-1 text-[10px] text-mubble-text-muted">
                  Type this to trigger the snippet
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-mubble-text-muted">Replacement</label>
                <textarea
                  value={newSnippet.replacement}
                  onChange={(e) => setNewSnippet({ ...newSnippet, replacement: e.target.value })}
                  placeholder="Text to insert..."
                  rows={3}
                  className="
                    w-full rounded-lg border border-mubble-border bg-mubble-bg px-3 py-2 
                    text-sm text-mubble-text outline-none transition-all resize-none
                    focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20
                  "
                />
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

      {/* Snippets list */}
      <div className="space-y-2">
        {filteredSnippets.length === 0 ? (
          <Animated animation="scale-in" duration={300}>
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mubble-surface">
                <Sparkles size={28} className="text-mubble-text-muted" />
              </div>
              <p className="text-sm text-mubble-text-muted">
                {search ? 'No matching snippets' : 'No snippets yet. Create your first shortcut!'}
              </p>
            </div>
          </Animated>
        ) : (
          <StaggerContainer staggerDelay={30} animation="fade-in-up">
            {filteredSnippets.map((snippet) => (
              <Card
                key={snippet.id}
                hover
                padding="md"
                className="group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <kbd className="rounded bg-mubble-primary/10 px-2 py-0.5 text-xs text-mubble-primary font-mono">
                        {snippet.trigger}
                      </kbd>
                    </div>
                    <p className="text-sm text-mubble-text-secondary line-clamp-2">
                      {snippet.replacement}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(snippet.id)}
                    className="
                      rounded p-1.5 text-mubble-text-muted opacity-0
                      transition-all duration-200
                      group-hover:opacity-100
                      hover:bg-red-500/10 hover:text-red-400 hover:scale-110
                    "
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  )
}
