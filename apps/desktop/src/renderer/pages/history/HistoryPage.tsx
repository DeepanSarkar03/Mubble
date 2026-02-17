import { useState, useEffect } from 'react'
import { Search, Trash2, Copy, Clock, Check, FileText } from 'lucide-react'
import type { HistoryEntry } from '@mubble/shared'
import { Animated, StaggerContainer, Card, BlurReveal } from '../../components/ui'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation({ threshold: 0.1 })

  useEffect(() => {
    loadHistory()
  }, [search])

  const loadHistory = async () => {
    setIsLoading(true)
    const data = await window.mubble.history.query({
      search: search || undefined,
      limit: 100,
    })
    setEntries(data)
    setIsLoading(false)
  }

  const handleCopy = async (text: string, id: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: number) => {
    await window.mubble.history.delete(id)
    loadHistory()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div ref={headerRef}>
        <BlurReveal isInView={headerInView}>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">History</h2>
            <p className="mt-1 text-sm text-neutral-500">
              View and search your past dictations
            </p>
          </div>
        </BlurReveal>

        {/* Search */}
        <Animated animation="fade-in-up" delay={100}>
          <div className="relative mb-4 group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 transition-colors group-focus-within:text-violet-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="
                w-full rounded-xl border border-white/10 bg-white/5 
                py-2.5 pl-10 pr-4 text-sm text-white outline-none 
                transition-all duration-200
                focus:border-violet-500/50 focus:bg-white/10 focus:ring-1 focus:ring-violet-500/20
                placeholder:text-neutral-600
              "
            />
          </div>
        </Animated>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
              <div className="absolute inset-0 h-8 w-8 rounded-full bg-violet-500/20 blur-lg animate-pulse" />
            </div>
            <p className="text-sm text-neutral-500 animate-pulse">Loading...</p>
          </div>
        ) : entries.length === 0 ? (
          <Animated animation="scale-in-bounce" duration={500}>
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 animate-float-gentle">
                <Clock size={28} className="text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-500">
                {search ? 'No results found' : 'No history yet'}
              </p>
            </div>
          </Animated>
        ) : (
          <div className="space-y-2">
            <StaggerContainer staggerDelay={40} initialDelay={100} animation="fade-in-up">
              {entries.map((entry, index) => (
                <Card
                  key={entry.id}
                  gradient
                  padding="md"
                  className="group relative overflow-hidden transition-all duration-300 hover:border-white/10"
                >
                  {/* Hover accent line with animation */}
                  <span className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-violet-500 to-purple-600 transition-all duration-300 scale-y-0 group-hover:scale-y-100 origin-top" />
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-neutral-200 transition-colors group-hover:text-white">{entry.processedText}</p>
                      {entry.rawTranscript !== entry.processedText && (
                        <p className="mt-1 text-xs text-neutral-700 line-through">
                          {entry.rawTranscript}
                        </p>
                      )}
                    </div>
                    <div className="ml-3 flex items-center gap-1 opacity-0 transition-all duration-200 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                      <button
                        onClick={() => handleCopy(entry.processedText, entry.id)}
                        className="rounded-lg p-1.5 text-neutral-600 transition-all duration-200 hover:bg-white/5 hover:text-emerald-400 hover:scale-110"
                      >
                        {copiedId === entry.id ? (
                          <Check size={14} className="text-emerald-400 animate-success-pop" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-lg p-1.5 text-neutral-600 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 hover:scale-110"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-600">
                    <span className="transition-colors group-hover:text-neutral-500">{formatTime(entry.createdAt)}</span>
                    {entry.targetApp && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 border border-white/5 transition-colors group-hover:border-white/10">{entry.targetApp}</span>
                    )}
                    <span className="rounded bg-white/5 px-1.5 py-0.5 border border-white/5">{entry.sttProvider}</span>
                    <span className="tabular-nums">{entry.wordCount} words</span>
                  </div>
                </Card>
              ))}
            </StaggerContainer>
          </div>
        )}
      </div>
    </div>
  )
}
