import { type ReactNode, forwardRef, useRef, useState } from 'react'
import { Loader2, ChevronRight } from 'lucide-react'

export interface ButtonProps {
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  showArrow?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  magnetic?: boolean
  pulse?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      onClick,
      className = '',
      disabled = false,
      loading = false,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      showArrow = false,
      type = 'button',
      fullWidth = false,
      magnetic = false,
      pulse = false,
    },
    forwardedRef
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
    const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 })

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || !buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) * 0.2
      const deltaY = (e.clientY - centerY) * 0.2
      setMagneticOffset({ x: deltaX, y: deltaY })
    }

    const handleMouseLeave = () => {
      setMagneticOffset({ x: 0, y: 0 })
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Ripple effect
      const button = buttonRef.current
      if (button && !disabled && !loading) {
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()
        setRipples((prev) => [...prev, { x, y, id }])
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id))
        }, 600)
      }
      onClick?.(e)
    }

    // Phantom-style base classes
    const baseStyles = `
      relative overflow-hidden
      inline-flex items-center justify-center gap-2 
      font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-violet-500/50
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `

    // Phantom-inspired variants
    const variantStyles = {
      // Primary: White bg, black text, fully rounded (like "Get Started Free")
      primary: `
        bg-white text-black 
        hover:bg-neutral-200 
        active:bg-neutral-300
        rounded-full
        shadow-lg shadow-white/10 hover:shadow-white/20
        ${pulse ? 'animate-button-pulse' : ''}
      `,
      // Secondary: Dark/transparent with subtle border (like "Book Demo")
      secondary: `
        bg-transparent text-white 
        border border-white/20 
        hover:border-white/40 hover:bg-white/5
        active:bg-white/10
        rounded-full
        group
      `,
      // Ghost: Transparent, subtle hover
      ghost: `
        bg-transparent text-neutral-400 
        hover:text-white hover:bg-white/5
        active:bg-white/10
        rounded-full
      `,
      // Outline: Similar to secondary but more pronounced
      outline: `
        bg-transparent text-white 
        border border-neutral-700 
        hover:border-neutral-500 hover:bg-neutral-900
        active:bg-neutral-800
        rounded-full
      `,
      // Danger: Red accent
      danger: `
        bg-red-500/10 text-red-400 
        border border-red-500/20 
        hover:bg-red-500/20 hover:border-red-500/30
        active:bg-red-500/30
        rounded-full
      `,
    }

    const sizeStyles = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3.5 text-base',
    }

    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={(node) => {
          buttonRef.current = node
          if (typeof forwardedRef === 'function') {
            forwardedRef(node)
          } else if (forwardedRef) {
            forwardedRef.current = node
          }
        }}
        type={type}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        style={
          magnetic
            ? {
                transform: `translate(${magneticOffset.x}px, ${magneticOffset.y}px)`,
                transition: 'transform 0.15s ease-out',
              }
            : undefined
        }
      >
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-[ripple_0.6s_ease-out_forwards]"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 100,
              height: 100,
              marginLeft: -50,
              marginTop: -50,
            }}
          />
        ))}
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {loading && (
            <Loader2 
              size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} 
              className="animate-spin" 
            />
          )}
          {!loading && icon && iconPosition === 'left' && (
            <span className="transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
          )}
          {children}
          {!loading && icon && iconPosition === 'right' && (
            <span className="transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
          )}
          {!loading && showArrow && (
            <ChevronRight 
              size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} 
              className="transition-transform duration-200 group-hover:translate-x-0.5" 
            />
          )}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

// Icon button variant
export interface IconButtonProps {
  icon: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, onClick, className = '', disabled = false, loading = false, variant = 'ghost', size = 'md', tooltip }, ref) => {
    const sizeStyles = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    }

    const iconSizes = {
      sm: 16,
      md: 18,
      lg: 20,
    }

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || loading}
        title={tooltip}
        className={`
          inline-flex items-center justify-center rounded-xl
          transition-all duration-200
          hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variant === 'primary' ? 'bg-white text-black hover:bg-neutral-200' : ''}
          ${variant === 'secondary' ? 'bg-white/10 text-white hover:bg-white/20' : ''}
          ${variant === 'ghost' ? 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5' : ''}
          ${sizeStyles[size]}
          ${className}
        `}
      >
        {loading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin" />
        ) : (
          <span className="transition-transform duration-200">{icon}</span>
        )}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export default Button
