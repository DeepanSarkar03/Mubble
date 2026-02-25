import { useState, useEffect } from 'react'
import { Keyboard, Command, Zap, CornerDownLeft } from 'lucide-react'
import { Animated, StaggerContainer, Card, Button } from '../../components/ui'

interface ShortcutConfig {
  key: 'pushToTalkShortcut' | 'handsFreeShortcut' | 'commandModeShortcut' | 'pasteLastShortcut'
  managerKey: 'pushToTalk' | 'handsFree' | 'commandMode' | 'pasteLast'
  label: string
  description: string
  icon: React.ReactNode
}

const SHORTCUTS: ShortcutConfig[] = [
  {
    key: 'pushToTalkShortcut',
    managerKey: 'pushToTalk',
    label: 'Push to Talk',
    description: 'Start/stop dictation',
    icon: <Keyboard size={18} />,
  },
  {
    key: 'handsFreeShortcut',
    managerKey: 'handsFree',
    label: 'Hands-Free',
    description: 'Toggle hands-free dictation mode',
    icon: <Zap size={18} />,
  },
  {
    key: 'commandModeShortcut',
    managerKey: 'commandMode',
    label: 'Command Mode',
    description: 'Start command mode dictation',
    icon: <Command size={18} />,
  },
  {
    key: 'pasteLastShortcut',
    managerKey: 'pasteLast',
    label: 'Paste Last',
    description: 'Paste your most recent dictation',
    icon: <CornerDownLeft size={18} />,
  },
]

function toAccelerator(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  const ignored = ['Control', 'Meta', 'Alt', 'Shift']
  if (!ignored.includes(e.key)) {
    const key = e.code.startsWith('Key')
      ? e.code.replace('Key', '')
      : e.code.startsWith('Digit')
        ? e.code.replace('Digit', '')
        : e.key.length === 1
          ? e.key.toUpperCase()
          : e.key
    parts.push(key)
  }

  return parts.join('+')
}

export default function ShortcutSettings() {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({})
  const [recording, setRecording] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const settings = await window.mubble.settings.getAll()
      const initial: Record<string, string> = {}
      SHORTCUTS.forEach((s) => {
        initial[s.key] = (settings as Record<string, string>)[s.key] || ''
      })
      setShortcuts(initial)
    }

    void load()
  }, [])

  useEffect(() => {
    if (!recording) return

    const onKeyDown = async (e: KeyboardEvent) => {
      e.preventDefault()
      const accelerator = toAccelerator(e)
      if (!accelerator || !accelerator.includes('+')) return

      const shortcut = SHORTCUTS.find((s) => s.key === recording)
      if (!shortcut) return

      const next = { ...shortcuts, [recording]: accelerator }
      setShortcuts(next)
      setRecording(null)

      await Promise.all([
        window.mubble.settings.set(shortcut.key as any, accelerator),
        window.mubble.shortcuts.set({ [shortcut.managerKey]: accelerator }),
      ])
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [recording, shortcuts])

  const clearShortcut = async (shortcut: ShortcutConfig) => {
    const next = { ...shortcuts, [shortcut.key]: '' }
    setShortcuts(next)
    await Promise.all([
      window.mubble.settings.set(shortcut.key as any, ''),
      window.mubble.shortcuts.set({ [shortcut.managerKey]: '' }),
    ])
  }

  return (
    <div className="space-y-6">
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-lg font-semibold text-mubble-text">Shortcuts</h2>
          <p className="mt-1 text-sm text-mubble-text-muted">Capture and apply global shortcuts instantly.</p>
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
                <h3 className="text-sm font-medium text-mubble-text">{shortcut.label}</h3>
                <p className="text-xs text-mubble-text-muted">{shortcut.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRecording(shortcut.key)}
                  className={`
                    flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all duration-200
                    ${recording === shortcut.key
                      ? 'border-mubble-primary bg-mubble-primary/10 text-mubble-primary animate-pulse'
                      : 'border-mubble-border bg-mubble-bg text-mubble-text-secondary hover:border-mubble-primary/50 hover:bg-mubble-surface'}
                  `}
                >
                  {recording === shortcut.key ? 'Press keys…' : (
                    <kbd className="rounded bg-mubble-surface px-1.5 py-0.5 font-mono text-xs">
                      {shortcuts[shortcut.key] || 'Not set'}
                    </kbd>
                  )}
                </button>
                <Button size="sm" variant="ghost" onClick={() => clearShortcut(shortcut)}>
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </StaggerContainer>
    </div>
  )
}
