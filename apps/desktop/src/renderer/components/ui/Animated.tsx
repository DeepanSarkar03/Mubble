import { useEffect, useRef, useState, type ReactNode, useCallback } from 'react'
import { useScrollAnimation, useMagneticEffect, useSpringAnimation } from '../../hooks/useScrollAnimation'

export type AnimationType =
  | 'fade-in'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'fade-in-left'
  | 'fade-in-right'
  | 'scale-in'
  | 'scale-in-bounce'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'blur-reveal'

export interface AnimatedProps {
  children: ReactNode
  animation?: AnimationType
  delay?: number
  duration?: number
  className?: string
  as?: keyof JSX.IntrinsicElements
  trigger?: 'mount' | 'hover' | 'in-view'
  threshold?: number
  style?: React.CSSProperties
  onAnimationEnd?: () => void
  staggerIndex?: number
  staggerDelay?: number
}

export function Animated({
  children,
  animation = 'fade-in-up',
  delay = 0,
  duration,
  className = '',
  as: Component = 'div',
  trigger = 'mount',
  threshold = 0.1,
  style = {},
  onAnimationEnd,
  staggerIndex,
  staggerDelay = 50,
}: AnimatedProps) {
  const [isVisible, setIsVisible] = useState(trigger !== 'in-view')
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  const calculatedDelay = staggerIndex !== undefined 
    ? delay + staggerIndex * staggerDelay 
    : delay

  useEffect(() => {
    if (trigger === 'mount') {
      setIsVisible(true)
    } else if (trigger === 'in-view' && elementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsVisible(true)
            setHasAnimated(true)
          }
        },
        { threshold }
      )
      observer.observe(elementRef.current)
      return () => observer.disconnect()
    }
  }, [trigger, threshold, hasAnimated])

  const handleAnimationEnd = () => {
    onAnimationEnd?.()
  }

  const animationClass = isVisible ? `animate-${animation}` : 'opacity-0'
  const animationStyle: React.CSSProperties = {
    ...style,
    animationDelay: calculatedDelay ? `${calculatedDelay}ms` : undefined,
    animationDuration: duration ? `${duration}ms` : undefined,
  }

  return (
    <Component
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`${animationClass} ${className}`}
      style={animationStyle}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </Component>
  )
}

// Stagger container for animating children sequentially
export interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  initialDelay?: number
  className?: string
  animation?: AnimationType
  as?: keyof JSX.IntrinsicElements
}

export function StaggerContainer({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  className = '',
  animation = 'fade-in-up',
  as: Component = 'div',
}: StaggerContainerProps) {
  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <Component className={className}>
      {childrenArray.map((child, index) => (
        <Animated
          key={index}
          animation={animation}
          delay={initialDelay + index * staggerDelay}
          className="stagger-item"
          trigger="mount"
        >
          {child}
        </Animated>
      ))}
    </Component>
  )
}

// Animated number counter with Phantom-style spring animation
export interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  format?: (value: number) => string
  trigger?: 'mount' | 'in-view'
}

export function AnimatedNumber({
  value,
  duration = 1500,
  className = '',
  prefix = '',
  suffix = '',
  format,
  trigger = 'mount',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const { ref, isInView } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if ((trigger === 'mount' || (trigger === 'in-view' && isInView)) && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true
      const startTimeRef = { current: null as number | null }
      const startValueRef = { current: 0 }

      const animate = (currentTime: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = currentTime
        }

        const elapsed = currentTime - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // Ease out cubic - Phantom style
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const currentValue = Math.round(
          startValueRef.current + (value - startValueRef.current) * easeOut
        )

        setDisplayValue(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [value, duration, trigger, isInView])

  const formattedValue = format ? format(displayValue) : displayValue.toLocaleString()

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  )
}

// Ripple button effect - Phantom style
export interface RippleButtonProps {
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function RippleButton({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  variant = 'primary',
}: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button || disabled) return

    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { x, y, id }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)

    onClick?.(e)
  }

  const baseStyles = 'relative overflow-hidden transition-all duration-200 active:scale-[0.98]'
  const variantStyles = {
    primary: 'bg-white text-black rounded-full hover:bg-neutral-200',
    secondary: 'bg-transparent text-white border border-white/20 rounded-full hover:border-white/40 hover:bg-white/5',
    ghost: 'bg-transparent text-neutral-400 rounded-full hover:text-white hover:bg-white/5',
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '200%',
            height: '200%',
            marginLeft: '-100%',
            marginTop: '-100%',
          }}
        />
      ))}
      {children}
    </button>
  )
}

// Pulse ring indicator for recording states - Phantom style
export interface PulseRingProps {
  size?: number
  color?: string
  className?: string
  isActive?: boolean
  variant?: 'pulse' | 'glow' | 'ring'
}

export function PulseRing({
  size = 12,
  color = '#8b5cf6',
  className = '',
  isActive = true,
  variant = 'pulse',
}: PulseRingProps) {
  if (!isActive) return null

  const variantClasses = {
    pulse: 'animate-pulse-soft',
    glow: 'animate-pulse-glow',
    ring: 'animate-pulse-ring',
  }

  return (
    <span
      className={`inline-block rounded-full ${variantClasses[variant]} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: variant === 'glow' ? `0 0 20px ${color}` : undefined,
      }}
    />
  )
}

// Animated waveform for audio visualization
export interface WaveformProps {
  bars?: number
  isActive?: boolean
  color?: string
  height?: number
  className?: string
  barWidth?: number
}

export function Waveform({
  bars = 12,
  isActive = true,
  color = '#8b5cf6',
  height = 24,
  className = '',
  barWidth = 3,
}: WaveformProps) {
  return (
    <div className={`flex items-center gap-[2px] ${className}`} style={{ height }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-150 ${isActive ? 'waveform-bar' : ''}`}
          style={{
            width: barWidth,
            backgroundColor: color,
            height: isActive ? '100%' : '30%',
            opacity: isActive ? 0.8 : 0.4,
            animationPlayState: isActive ? 'running' : 'paused',
            animationDelay: `${i * 0.1}s`,
            minHeight: 4,
          }}
        />
      ))}
    </div>
  )
}

// Hover scale wrapper with spring physics
export interface HoverScaleProps {
  children: ReactNode
  scale?: number
  className?: string
}

export function HoverScale({ children, scale = 1.05, className = '' }: HoverScaleProps) {
  return (
    <div
      className={`transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[${scale}] ${className}`}
      style={{ willChange: 'transform' }}
    >
      {children}
    </div>
  )
}

// Fade transition wrapper for conditional rendering
export interface FadeTransitionProps {
  children: ReactNode
  show: boolean
  duration?: number
  className?: string
  unmountOnExit?: boolean
}

export function FadeTransition({
  children,
  show,
  duration = 200,
  className = '',
  unmountOnExit = true,
}: FadeTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      setIsExiting(false)
    } else {
      setIsExiting(true)
      const timer = setTimeout(() => {
        if (unmountOnExit) {
          setShouldRender(false)
        }
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, unmountOnExit])

  if (!shouldRender && unmountOnExit) return null

  return (
    <div
      className={`transition-all ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${className}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  )
}

// Magnetic button that follows cursor
export interface MagneticButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  strength?: number
}

export function MagneticButton({ children, onClick, className = '', strength = 0.3 }: MagneticButtonProps) {
  const { ref, transform } = useMagneticEffect<HTMLButtonElement>(strength)

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`transition-transform duration-100 ease-out ${className}`}
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }}
    >
      {children}
    </button>
  )
}

// Floating element with ghost-like movement
export interface FloatingElementProps {
  children: ReactNode
  className?: string
  variant?: 'gentle' | 'wiggle' | 'bob'
  duration?: number
}

export function FloatingElement({ 
  children, 
  className = '', 
  variant = 'gentle',
  duration,
}: FloatingElementProps) {
  const variantClasses = {
    gentle: 'animate-float-gentle',
    wiggle: 'animate-float-wiggle',
    bob: 'animate-bob',
  }

  return (
    <div 
      className={`${variantClasses[variant]} ${className}`}
      style={duration ? { animationDuration: `${duration}s` } : undefined}
    >
      {children}
    </div>
  )
}

// Text reveal animation
export interface TextRevealProps {
  text: string
  className?: string
  delay?: number
  trigger?: 'mount' | 'in-view'
}

export function TextReveal({ text, className = '', delay = 0, trigger = 'mount' }: TextRevealProps) {
  const { ref, isInView } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const shouldAnimate = trigger === 'mount' || isInView

  return (
    <span
      ref={ref}
      className={`inline-block overflow-hidden ${className}`}
    >
      <span
        className={`inline-block transition-transform duration-500 ${shouldAnimate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        style={{
          transitionDelay: `${delay}ms`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {text}
      </span>
    </span>
  )
}

// Blur reveal animation
export interface BlurRevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function BlurReveal({ children, className = '', delay = 0 }: BlurRevealProps) {
  const { ref, isInView } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isInView ? 'opacity-100 blur-0' : 'opacity-0 blur-[10px]'} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  )
}

// Skeleton loading placeholder
export interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  circle?: boolean
}

export function Skeleton({ width = '100%', height = 20, className = '', circle = false }: SkeletonProps) {
  return (
    <div
      className={`animate-skeleton bg-white/10 ${className}`}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : '4px',
      }}
    />
  )
}

// Confetti effect for celebrations
export interface ConfettiProps {
  active: boolean
  count?: number
}

export function Confetti({ active, count = 50 }: ConfettiProps) {
  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-[confetti-fall_3s_ease-out_forwards]"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            backgroundColor: ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${Math.random() * 2 + 2}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  )
}

export default Animated
