import { useEffect, useState } from 'react'
import { Mic, Keyboard, Zap, BookOpen, Sparkles, ArrowRight, Play } from 'lucide-react'
import { Animated, StaggerContainer, Card, Button, FloatingElement, BlurReveal } from '../../components/ui'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { ref: heroRef, isInView: heroInView } = useScrollAnimation({ threshold: 0.2 })

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-[120px] animate-gradient-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Hero Section - Phantom Style */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-8 py-12">
        
        {/* Floating mascot elements */}
        <FloatingElement variant="gentle" className="absolute top-20 left-[15%] opacity-40">
          <div className="w-3 h-3 rounded-full bg-violet-400/50" />
        </FloatingElement>
        <FloatingElement variant="wiggle" duration={3} className="absolute top-32 right-[20%] opacity-30">
          <div className="w-2 h-2 rounded-full bg-blue-400/50" />
        </FloatingElement>
        <FloatingElement variant="bob" duration={4} className="absolute bottom-40 left-[25%] opacity-20">
          <div className="w-4 h-4 rounded-full bg-purple-400/40" />
        </FloatingElement>

        {/* Main Hero Card */}
        <div ref={heroRef} className="relative w-full max-w-2xl">
          {/* Glow effect behind card */}
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-violet-500/20 via-transparent to-transparent blur-2xl opacity-60 animate-pulse-glow" />
          
          <BlurReveal delay={100}>
            <Card 
              gradient 
              glow 
              padding="xl" 
              className="relative text-center border-white/10"
            >
              {/* Icon with bounce animation */}
              <Animated animation="scale-in-bounce" delay={200} duration={600}>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 backdrop-blur-sm border border-violet-500/20 animate-glow-pulse">
                  <Mic size={32} className="text-white" />
                </div>
              </Animated>

              {/* Headline with staggered reveal */}
              <div className="space-y-2">
                <Animated animation="fade-in-up" delay={300}>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Start Dictating
                  </h1>
                </Animated>
                <Animated animation="fade-in-up" delay={400}>
                  <p className="text-3xl font-semibold tracking-tight text-neutral-400 sm:text-4xl">
                    Your Ideas Instantly
                  </p>
                </Animated>
              </div>

              {/* Subtitle */}
              <Animated animation="fade-in-up" delay={500}>
                <p className="mx-auto mt-5 max-w-md text-base text-neutral-500 leading-relaxed">
                  Transform your voice into text with AI-powered precision. 
                  No setup required, just speak and we handle the rest.
                </p>
              </Animated>

              {/* CTA Buttons - Phantom Style */}
              <Animated animation="fade-in-up" delay={600}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button 
                    variant="primary" 
                    size="md"
                    icon={<Mic size={16} />}
                    onClick={() => window.mubble.dictation.start('push-to-talk')}
                    magnetic
                  >
                    Start Dictating
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="md"
                    showArrow
                    onClick={() => window.location.hash = '#/settings'}
                  >
                    Configure
                  </Button>
                </div>
              </Animated>

              {/* Trust indicators */}
              <Animated animation="fade-in" delay={800}>
                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
                    Ready
                  </span>
                  <span>•</span>
                  <span>14+ STT Providers</span>
                  <span>•</span>
                  <span>AI Powered</span>
                </div>
              </Animated>
            </Card>
          </BlurReveal>
        </div>

        {/* Quick Actions Grid */}
        <div className="mt-8 w-full max-w-2xl">
          <StaggerContainer 
            staggerDelay={80} 
            initialDelay={700} 
            animation="fade-in-up"
            className="grid grid-cols-2 gap-3"
          >
            <QuickAction
              icon={<Keyboard size={18} />}
              title="Push to Talk"
              shortcut="Ctrl+Shift+Space"
              description="Hold to dictate"
            />
            <QuickAction
              icon={<Zap size={18} />}
              title="Hands-Free"
              shortcut="Ctrl+Shift+H"
              description="Auto-detect speech"
            />
            <QuickAction
              icon={<BookOpen size={18} />}
              title="Command Mode"
              shortcut="Ctrl+Shift+K"
              description="Voice commands"
            />
            <QuickAction
              icon={<Sparkles size={18} />}
              title="Snippets"
              shortcut=""
              description="Text shortcuts"
            />
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
}: {
  icon: React.ReactNode
  title: string
  shortcut: string
  description: string
}) {
  return (
    <Card
      hover
      gradient
      padding="md"
      className="group text-left transition-all duration-300 hover:border-white/10"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-neutral-400 transition-all duration-300 group-hover:bg-violet-500/10 group-hover:text-violet-400 group-hover:scale-110">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-white transition-colors group-hover:text-neutral-200">{title}</h3>
            <p className="text-xs text-neutral-600">{description}</p>
          </div>
        </div>
        {shortcut && (
          <kbd className="hidden rounded-lg bg-white/5 px-2 py-1 font-mono text-[10px] text-neutral-600 border border-white/5 group-hover:border-white/10 group-hover:text-neutral-500 transition-colors">
            {shortcut}
          </kbd>
        )}
      </div>
    </Card>
  )
}
