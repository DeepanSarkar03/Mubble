import { useState, useEffect } from 'react'
import { Keyboard, Command, Zap, MessageSquare, CornerDownLeft } from 'lucide-react'
import { Animated, StaggerContainer, Card } from '../../components/ui'

interface ShortcutConfig {
  key: string
  label: string
  description: string
  icon: React.ReactNode
}

const SHORTCUTS: ShortcutConfig[] = [
  {
    key: 'pushToTalkShortcut',
    label: 'Push to Talk',
    description: 'Hold to dictate, release to stop',
    icon: <Keyboard size={18} />,
  },
  {
    key: 'handsFreeShortcut',
    label: 'Hands-Free',
    description: 'Toggle hands-free dictation mode',
    icon: <Zap size={18} />,
  },
  {
    key: 'commandModeShortcut',
    label: 'Command Mode',
    description: 'Activate command mode for text editing',
    icon: <Command size={18} />,
  },
  {
    key: 'pasteLastShortcut',
    label: 'Paste Last',
    description: 'Paste your last dictation',
    icon: <CornerDownLeft size={18} />,
  },
]

export default function ShortcutSettings() {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({})
  const [recording, setRecording] = useState<string | null>(null)

  useEffect(() => {
    window.mubble.settings.getAll().then((settings) => {
      const initial: Record<string, string> = {}
      SHORTCUTS.forEach((s) => {
        initial[s.key] = (settings as Record<string, string>)[s.key] || ''
      })
      setShortcuts(initial)
    })
  }, [])

  const updateShortcut = (key: string, value: string) => {
    setShortcuts((prev) => ({ ...prev, [key]: value }))
    window.mubble.settings.set(key as any, value)
  }

  return (
    <div className="space-y-6">
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-lg font-semibold text-mubble-text">Shortcuts</h2>
          <p className="mt-1 text-sm text-mubble-text-muted">
            Customize keyboard shortcuts for quick dictation control
          </p>
        </div>
      </Animated>

      <StaggerContainer staggerDelay={60} initialDelay={100} animation="fade-in-up">
        {SHORTCUTS.map((shortcut) => (
          <Card key={shortcut.key} padding="lg" className="group">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mubble-primary/10 text-mubble-primary transition-transform duration-200 group-hover:scale-110">
                {shortcut.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-mubble-text">
                  {shortcut.label}
                </h3>
                <p className="text-xs text-mubble-text-muted">
                  {shortcut.description}
                </p>
              </div>
              <button
                onClick={() => setRecording(shortcut.key)}
                className={`
                  flex items-center gap-2 rounded-lg border px-4 py-2 text-sm
                  transition-all duration-200
                  ${recording === shortcut.key
                    ? 'border-mubble-primary bg-mubble-primary/10 text-mubble-primary animate-pulse'
                    : 'border-mubble-border bg-mubble-bg text-mubble-text-secondary hover:border-mubble-primary/50 hover:bg-mubble-surface'
                  }
                `}
              >
                {recording === shortcut.key ? (
                  <>Recording...</>
                ) : (
                  <>
                    <kbd className="rounded bg-mubble-surface px-1.5 py-0.5 font-mono text-xs">
                      {shortcuts[shortcut.key] || 'Not set'}
                    </kbd>
                  </>
                )}
              </button>
            </div>
          </Card>
        ))}
      </StaggerContainer>

      <Animated animation="fade-in-up" delay={400}>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-400">
            <strong>Note:</strong> Shortcut recording is not yet implemented. This will be available in a future update.
          </p>
        </div>
      </Animated>
    </div>
  )
}
