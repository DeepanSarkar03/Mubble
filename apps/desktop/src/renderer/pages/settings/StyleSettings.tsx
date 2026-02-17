import { useState, useEffect } from 'react'
import { Palette, Sparkles, Briefcase, MessageCircle, FileText } from 'lucide-react'
import { Animated, StaggerContainer, Card, Button } from '../../components/ui'

interface StyleProfile {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  formality: 'casual' | 'neutral' | 'formal'
}

const DEFAULT_PROFILES: StyleProfile[] = [
  {
    id: 'casual',
    name: 'Casual',
    icon: <MessageCircle size={18} />,
    description: 'Relaxed and conversational tone',
    formality: 'casual',
  },
  {
    id: 'neutral',
    name: 'Neutral',
    icon: <FileText size={18} />,
    description: 'Balanced and straightforward',
    formality: 'neutral',
  },
  {
    id: 'formal',
    name: 'Formal',
    icon: <Briefcase size={18} />,
    description: 'Professional and polished',
    formality: 'formal',
  },
]

export default function StyleSettings() {
  const [defaultFormality, setDefaultFormality] = useState<'casual' | 'neutral' | 'formal'>('neutral')
  const [activeProfile, setActiveProfile] = useState('neutral')

  useEffect(() => {
    window.mubble.settings.getAll().then((settings) => {
      if (settings.defaultFormality) {
        setDefaultFormality(settings.defaultFormality)
        setActiveProfile(settings.defaultFormality)
      }
    })
  }, [])

  const updateFormality = (value: 'casual' | 'neutral' | 'formal') => {
    setDefaultFormality(value)
    setActiveProfile(value)
    window.mubble.settings.set('defaultFormality', value)
  }

  return (
    <div className="space-y-6">
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-lg font-semibold text-mubble-text">Style Profiles</h2>
          <p className="mt-1 text-sm text-mubble-text-muted">
            Configure how AI formats and styles your dictated text
          </p>
        </div>
      </Animated>

      {/* Default style */}
      <Animated animation="fade-in-up" delay={50}>
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mubble-primary/10 text-mubble-primary">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-mubble-text">Default Style</h3>
              <p className="text-xs text-mubble-text-muted">
                Choose your preferred writing tone
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {DEFAULT_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => updateFormality(profile.formality)}
                className={`
                  flex flex-col items-center gap-2 rounded-xl border p-4
                  transition-all duration-300
                  ${activeProfile === profile.id
                    ? 'border-mubble-primary bg-mubble-primary/10 text-mubble-primary shadow-lg shadow-mubble-primary/10'
                    : 'border-mubble-border bg-mubble-bg text-mubble-text-secondary hover:border-mubble-primary/30 hover:bg-mubble-surface'
                  }
                `}
              >
                <span className={`
                  transition-transform duration-200
                  ${activeProfile === profile.id ? 'scale-110' : ''}
                `}>
                  {profile.icon}
                </span>
                <span className="text-sm font-medium">{profile.name}</span>
                <span className="text-[10px] opacity-70">{profile.description}</span>
              </button>
            ))}
          </div>
        </Card>
      </Animated>

      {/* App-specific profiles */}
      <Animated animation="fade-in-up" delay={100}>
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-mubble-text">App-Specific Styles</h3>
                <p className="text-xs text-mubble-text-muted">
                  Different styles for different applications
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Add Rule
            </Button>
          </div>

          <div className="rounded-xl border border-mubble-border bg-mubble-bg p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mubble-surface">
              <Sparkles size={20} className="text-mubble-text-muted" />
            </div>
            <p className="text-sm text-mubble-text-muted">
              No app-specific styles configured
            </p>
            <p className="mt-1 text-xs text-mubble-text-muted">
              Create custom formatting rules for specific applications
            </p>
          </div>

          <p className="mt-3 text-[10px] text-mubble-text-muted">
            Note: App-specific styles are not yet implemented.
          </p>
        </Card>
      </Animated>

      {/* Preview */}
      <Animated animation="fade-in-up" delay={150}>
        <Card padding="lg">
          <h3 className="mb-3 text-sm font-medium text-mubble-text">Preview</h3>
          <div className="rounded-lg border border-mubble-border bg-mubble-bg p-4">
            <p className="text-xs text-mubble-text-muted mb-2">Original:</p>
            <p className="text-sm text-mubble-text-secondary mb-3">
              "um like I was thinking maybe we could meet up tomorrow if that works for you"
            </p>
            <p className="text-xs text-mubble-text-muted mb-2">After processing:</p>
            <p className="text-sm text-mubble-text">
              {defaultFormality === 'formal' 
                ? '"I was wondering if we could schedule a meeting tomorrow, should that be convenient for you."'
                : defaultFormality === 'casual'
                  ? '"Hey, wanna meet up tomorrow if you\'re free?"'
                  : '"I was thinking we could meet tomorrow if that works for you."'}
            </p>
          </div>
        </Card>
      </Animated>
    </div>
  )
}
