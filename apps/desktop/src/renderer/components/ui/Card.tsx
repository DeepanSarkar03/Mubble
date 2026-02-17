import { type ReactNode, useState, useRef } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
  gradient?: boolean
  glow?: boolean
  tilt?: boolean
  magnetic?: boolean
  animate?: boolean
  animationDelay?: number
}

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
  gradient = false,
  glow = false,
  tilt = false,
  magnetic = false,
  animate = false,
  animationDelay = 0,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tiltStyle, setTiltStyle] = useState({ transform: '', background: '' })
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    if (tilt) {
      const rotateX = (y - centerY) / 20
      const rotateY = (centerX - x) / 20
      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        background: `radial-gradient(circle at ${x}px ${y}px, rgba(139, 92, 246, 0.1), transparent 50%)`,
      })
    }

    if (magnetic) {
      const deltaX = (x - centerX) * 0.1
      const deltaY = (y - centerY) * 0.1
      setMagneticOffset({ x: deltaX, y: deltaY })
    }
  }

  const handleMouseLeave = () => {
    setTiltStyle({ transform: '', background: '' })
    setMagneticOffset({ x: 0, y: 0 })
  }

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  }

  const hoverStyles = hover && !tilt
    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] hover:border-white/10'
    : ''

  const clickableStyles = onClick ? 'cursor-pointer active:scale-[0.98]' : ''
  
  const gradientStyles = gradient
    ? 'bg-gradient-to-b from-neutral-900 to-neutral-950'
    : 'bg-neutral-900/50'
  
  const glowStyles = glow
    ? 'shadow-[0_0_40px_rgba(139,92,246,0.15)]'
    : ''

  const animateStyles = animate
    ? `animate-fade-in-up`
    : ''

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`
        relative rounded-2xl border border-white/5 overflow-hidden
        ${gradientStyles} ${glowStyles}
        ${paddingStyles[padding]} 
        ${hoverStyles} ${clickableStyles} 
        ${animateStyles}
        ${className}
      `}
      style={{
        animationDelay: animate ? `${animationDelay}ms` : undefined,
        transform: tilt ? tiltStyle.transform : magnetic ? `translate(${magneticOffset.x}px, ${magneticOffset.y}px)` : undefined,
        transition: tilt ? 'transform 0.1s ease-out' : magnetic ? 'transform 0.2s ease-out' : undefined,
      }}
    >
      {/* Tilt highlight overlay */}
      {tilt && tiltStyle.background && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{ background: tiltStyle.background }}
        />
      )}
      
      {/* Card content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
  iconClassName?: string
}

export function CardHeader({ 
  title, 
  description, 
  icon, 
  action, 
  className = '',
  iconClassName = '',
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white transition-transform duration-200 hover:scale-105 ${iconClassName}`}>
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-medium text-white">{title}</h3>
          {description && <p className="text-sm text-neutral-500">{description}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Feature card with icon and hover effect
export interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
  onClick?: () => void
  delay?: number
}

export function FeatureCard({ icon, title, description, className = '', onClick, delay = 0 }: FeatureCardProps) {
  return (
    <Card
      hover
      gradient
      padding="lg"
      onClick={onClick}
      animate
      animationDelay={delay}
      className={`group ${className}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-violet-500/20">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-medium text-white mb-1">{title}</h3>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
      </div>
    </Card>
  )
}

// Stat card for analytics
export interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  className?: string
  delay?: number
}

export function StatCard({ 
  icon, 
  label, 
  value, 
  change, 
  changeType = 'neutral',
  className = '',
  delay = 0,
}: StatCardProps) {
  const changeColors = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-neutral-500',
  }

  return (
    <Card
      gradient
      padding="lg"
      animate
      animationDelay={delay}
      className={`group hover:border-white/10 transition-colors duration-300 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-neutral-400 transition-all duration-300 group-hover:bg-violet-500/10 group-hover:text-violet-400">
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-medium ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-sm text-neutral-500">{label}</p>
      </div>
    </Card>
  )
}

export default Card
