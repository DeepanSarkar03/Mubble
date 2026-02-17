import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Mic, Check, Play } from 'lucide-react'
import { Animated, StaggerContainer, Card } from '../../components/ui'

interface SoundConfig {
  key: string
  label: string
  description: string
}

const SOUND_OPTIONS: SoundConfig[] = [
  {
    key: 'dictationSounds',
    label: 'Dictation Sounds',
    description: 'Play sounds when starting and stopping dictation',
  },
  {
    key: 'muteMusicWhileDictating',
    label: 'Mute Music While Dictating',
    description: 'Automatically pause music apps when recording',
  },
]

export default function SoundSettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>({})

  useEffect(() => {
    window.mubble.settings.getAll().then((s) => {
      const initial: Record<string, boolean> = {}
      SOUND_OPTIONS.forEach((opt) => {
        initial[opt.key] = (s as Record<string, boolean>)[opt.key] ?? true
      })
      setSettings(initial)
    })
  }, [])

  const updateSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    window.mubble.settings.set(key as any, value)
  }

  return (
    <div className="space-y-6">
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-lg font-semibold text-mubble-text">Sounds</h2>
          <p className="mt-1 text-sm text-mubble-text-muted">
            Configure audio feedback and system integration
          </p>
        </div>
      </Animated>

      <StaggerContainer staggerDelay={80} initialDelay={100} animation="fade-in-up">
        {SOUND_OPTIONS.map((option) => (
          <Card
            key={option.key}
            padding="lg"
            className="group transition-all duration-200 hover:border-mubble-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-xl
                  transition-all duration-200
                  ${settings[option.key] 
                    ? 'bg-mubble-primary/10 text-mubble-primary' 
                    : 'bg-mubble-surface text-mubble-text-muted'}
                `}>
                  {option.key === 'dictationSounds' ? (
                    settings[option.key] ? <Volume2 size={20} /> : <VolumeX size={20} />
                  ) : (
                    <Mic size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-mubble-text">
                    {option.label}
                  </h3>
                  <p className="text-xs text-mubble-text-muted">
                    {option.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting(option.key, !settings[option.key])}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full 
                  transition-all duration-300
                  ${settings[option.key] 
                    ? 'bg-mubble-primary shadow-inner shadow-mubble-primary/50' 
                    : 'bg-mubble-border'}
                `}
              >
                <span
                  className={`
                    inline-flex h-4 w-4 items-center justify-center rounded-full bg-white 
                    shadow-sm transition-all duration-300
                    ${settings[option.key] ? 'translate-x-6' : 'translate-x-1'}
                  `}
                >
                  {settings[option.key] && <Check size={10} className="text-mubble-primary" />}
                </span>
              </button>
            </div>
          </Card>
        ))}
      </StaggerContainer>

      {/* Sound preview */}
      <Animated animation="fade-in-up" delay={300}>
        <Card padding="lg" className="bg-mubble-surface/50">
          <h3 className="mb-3 text-sm font-medium text-mubble-text">Preview Sounds</h3>
          <div className="flex gap-2">
            <button
              className="
                flex items-center gap-2 rounded-lg border border-mubble-border 
                bg-mubble-bg px-3 py-2 text-sm text-mubble-text-secondary
                transition-all duration-200
                hover:border-mubble-primary/50 hover:text-mubble-text
              "
            >
              <Play size={14} />
              Start Sound
            </button>
            <button
              className="
                flex items-center gap-2 rounded-lg border border-mubble-border 
                bg-mubble-bg px-3 py-2 text-sm text-mubble-text-secondary
                transition-all duration-200
                hover:border-mubble-primary/50 hover:text-mubble-text
              "
            >
              <Play size={14} />
              Stop Sound
            </button>
          </div>
          <p className="mt-2 text-[10px] text-mubble-text-muted">
            Sound preview is not yet implemented.
          </p>
        </Card>
      </Animated>
    </div>
  )
}
