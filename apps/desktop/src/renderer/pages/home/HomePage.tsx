import { Mic, Keyboard, Zap, BookOpen, Sparkles } from 'lucide-react'
import { StaggerContainer, Card, Button, FloatingElement, BlurReveal, Animated } from '../../components/ui'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

export default function HomePage() {
  const { ref: heroRef } = useScrollAnimation({ threshold: 0.2 })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[800px] w-[800px] -translate-x-1/2 animate-gradient-pulse rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 py-12">
        <FloatingElement variant="gentle" className="absolute left-[15%] top-20 opacity-40">
          <div className="h-3 w-3 rounded-full bg-violet-400/50" />
        </FloatingElement>
        <FloatingElement variant="wiggle" duration={3} className="absolute right-[20%] top-32 opacity-30">
          <div className="h-2 w-2 rounded-full bg-blue-400/50" />
        </FloatingElement>
        <FloatingElement variant="bob" duration={4} className="absolute bottom-40 left-[25%] opacity-20">
          <div className="h-4 w-4 rounded-full bg-purple-400/40" />
        </FloatingElement>

        <div ref={heroRef} className="relative w-full max-w-2xl">
          <div className="absolute -inset-4 animate-pulse-glow rounded-[2rem] bg-gradient-to-b from-violet-500/20 via-transparent to-transparent opacity-60 blur-2xl" />

          <BlurReveal delay={100}>
            <Card gradient glow padding="xl" className="relative border-white/10 text-center">
              <Animated animation="scale-in-bounce" delay={200} duration={600}>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-violet-600/10 backdrop-blur-sm animate-glow-pulse">
                  <Mic size={32} className="text-white" />
                </div>
              </Animated>

              <div className="space-y-2">
                <Animated animation="fade-in-up" delay={300}>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Start Dictating</h1>
                </Animated>
                <Animated animation="fade-in-up" delay={400}>
                  <p className="text-3xl font-semibold tracking-tight text-neutral-400 sm:text-4xl">Your Ideas Instantly</p>
                </Animated>
              </div>

              <Animated animation="fade-in-up" delay={500}>
                <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-500">
                  Transform your voice into text with AI-powered precision. Configure a provider once, then dictate anywhere.
                </p>
              </Animated>

              <Animated animation="fade-in-up" delay={600}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" size="md" icon={<Mic size={16} />} onClick={() => window.mubble.dictation.start('push-to-talk')} magnetic>
                    Start Dictating
                  </Button>
                  <Button variant="secondary" size="md" showArrow onClick={() => (window.location.hash = '#/settings/stt-providers')}>
                    Configure
                  </Button>
                </div>
              </Animated>
            </Card>
          </BlurReveal>
        </div>

        <div className="mt-8 w-full max-w-2xl">
          <StaggerContainer staggerDelay={80} initialDelay={700} animation="fade-in-up" className="grid grid-cols-2 gap-3">
            <QuickAction icon={<Keyboard size={18} />} title="Push to Talk" shortcut="Ctrl+Shift+Space" description="Start / stop dictation" onClick={() => window.mubble.dictation.start('push-to-talk')} />
            <QuickAction icon={<Zap size={18} />} title="Hands-Free" shortcut="Ctrl+Shift+H" description="Toggle voice activity mode" onClick={() => window.mubble.dictation.start('hands-free')} />
            <QuickAction icon={<BookOpen size={18} />} title="Command Mode" shortcut="Ctrl+Shift+K" description="Rewrite selected text" onClick={() => window.mubble.dictation.start('command')} />
            <QuickAction icon={<Sparkles size={18} />} title="Paste Last" shortcut="Ctrl+Shift+V" description="Insert the last dictation again" onClick={() => window.mubble.dictation.pasteLast()} />
          </StaggerContainer>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  title,
  shortcut,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  shortcut: string
  description: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card hover gradient padding="md" className="group w-full text-left transition-all duration-300 hover:border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-neutral-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-violet-500/10 group-hover:text-violet-400">
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white transition-colors group-hover:text-neutral-200">{title}</h3>
              <p className="text-xs text-neutral-600">{description}</p>
            </div>
          </div>
          {shortcut && (
            <kbd className="hidden rounded-lg border border-white/5 bg-white/5 px-2 py-1 font-mono text-[10px] text-neutral-600 transition-colors group-hover:border-white/10 group-hover:text-neutral-500">
              {shortcut}
            </kbd>
          )}
        </div>
      </Card>
    </button>
  )
}
