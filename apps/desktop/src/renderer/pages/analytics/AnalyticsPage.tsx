import { useState, useEffect } from 'react'
import { BarChart3, MessageSquare, Clock, Zap, TrendingUp, Activity } from 'lucide-react'
import type { AnalyticsSummary } from '@mubble/shared'
import { Animated, StaggerContainer, Card, AnimatedNumber, BlurReveal } from '../../components/ui'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation({ threshold: 0.1 })

  useEffect(() => {
    setIsLoading(true)
    window.mubble.analytics.getSummary().then((data) => {
      setSummary(data)
      setIsLoading(false)
    })
  }, [])

  if (isLoading || !summary) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-violet-500/20 blur-xl" />
        </div>
        <p className="text-sm text-neutral-500 animate-pulse">Loading analytics...</p>
      </div>
    )
  }

  const timeSavedMinutes = Math.round(summary.estimatedTimeSavedSeconds / 60)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div ref={headerRef}>
        <BlurReveal isInView={headerInView}>
          <div>
            <h2 className="text-2xl font-semibold text-white">Analytics</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Track your dictation usage and time saved
            </p>
          </div>
        </BlurReveal>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StaggerContainer staggerDelay={60} initialDelay={100} animation="scale-in">
          <StatCard
            icon={<MessageSquare size={18} />}
            label="Dictations"
            value={summary.totalDictations}
            color="text-violet-400"
            bgColor="bg-violet-500/10"
          />
          <StatCard
            icon={<BarChart3 size={18} />}
            label="Words"
            value={summary.totalWords}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Audio Recorded"
            value={Math.round(summary.totalAudioSeconds / 60)}
            suffix="m"
            color="text-amber-400"
            bgColor="bg-amber-500/10"
          />
          <StatCard
            icon={<Zap size={18} />}
            label="Time Saved"
            value={timeSavedMinutes}
            suffix="m"
            highlight
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
          />
        </StaggerContainer>
      </div>

      {/* Top apps */}
      <Animated animation="fade-in-up" delay={400}>
        <Card gradient padding="lg" className="hover:border-white/10 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Activity size={16} />
            </div>
            <h3 className="text-sm font-medium text-white">Top Applications</h3>
          </div>
          
          {summary.topApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 animate-float-gentle">
                <Activity size={20} className="text-neutral-600" />
              </div>
              <p className="text-xs text-neutral-500">No app data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.topApps.map(({ app, count }, index) => (
                <Animated key={app} animation="fade-in-left" delay={index * 50 + 500}>
                  <div className="flex items-center gap-3 group">
                    <span className="w-32 truncate text-sm text-neutral-400 transition-colors group-hover:text-neutral-300">{app}</span>
                    <div className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-1000 ease-out"
                          style={{ width: `${(count / Math.max(...summary.topApps.map((a) => a.count))) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500 tabular-nums transition-colors group-hover:text-neutral-400">{count}</span>
                  </div>
                </Animated>
              ))}
            </div>
          )}
        </Card>
      </Animated>

      {/* Provider usage */}
      <Animated animation="fade-in-up" delay={500}>
        <Card gradient padding="lg" className="hover:border-white/10 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <TrendingUp size={16} />
            </div>
            <h3 className="text-sm font-medium text-white">Provider Usage</h3>
          </div>
          
          {summary.topProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-neutral-500">No provider data yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {summary.topProviders.map(({ provider, count }, index) => (
                <Animated key={provider} animation="scale-in" delay={index * 40 + 600}>
                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 border border-white/5 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.07]">
                    <span className="text-sm text-neutral-400">{provider}</span>
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-400">
                      {count}
                    </span>
                  </div>
                </Animated>
              ))}
            </div>
          )}
        </Card>
      </Animated>

      {/* Daily trend */}
      {summary.dailyTrend.length > 0 && (
        <Animated animation="fade-in-up" delay={600}>
          <Card gradient padding="lg" className="hover:border-white/10 transition-colors duration-300">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <TrendingUp size={16} />
              </div>
              <h3 className="text-sm font-medium text-white">Daily Trend</h3>
            </div>
            <div className="flex h-24 items-end gap-1">
              {summary.dailyTrend.slice(-30).map((day, index) => {
                const maxWords = Math.max(...summary.dailyTrend.map((d) => d.words))
                const height = maxWords > 0 ? (day.words / maxWords) * 100 : 0
                return (
                  <Animated key={day.date} animation="fade-in-up" delay={index * 10 + 700}>
                    <div
                      className="group relative flex-1 cursor-pointer"
                      title={`${day.date}: ${day.words} words`}
                    >
                      <div
                        className="w-full rounded-t bg-violet-500/40 transition-all duration-300 group-hover:bg-violet-400"
                        style={{ height: `${Math.max(2, height)}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="rounded bg-neutral-900 border border-white/10 px-2 py-1 text-[10px] text-white whitespace-nowrap">
                          {day.words} words
                        </div>
                      </div>
                    </div>
                  </Animated>
                )
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-neutral-600">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </Card>
        </Animated>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  highlight?: boolean
  color?: string
  bgColor?: string
}

function StatCard({ icon, label, value, suffix = '', highlight = false, color = 'text-neutral-400', bgColor = 'bg-white/5' }: StatCardProps) {
  return (
    <Card
      gradient
      padding="lg"
      className={`
        transition-all duration-300 hover:scale-[1.02] group
        ${highlight ? 'border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.1)]' : 'hover:border-white/10'}
      `}
    >
      <div className={`${bgColor} ${color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-white">
        <AnimatedNumber value={value} duration={1500} />
        {suffix}
      </p>
      <p className="text-xs text-neutral-500">{label}</p>
    </Card>
  )
}
