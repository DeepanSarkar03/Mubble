import { useState, type ReactNode } from 'react'

export interface TooltipProps {
  children: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 300,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setIsVisible(false)
  }

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-mubble-surface',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-mubble-surface',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-mubble-surface',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-mubble-surface',
  }

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 whitespace-nowrap animate-fade-in ${positionStyles[position]}`}
        >
          <div className="rounded-lg border border-mubble-border bg-mubble-surface px-3 py-1.5 text-xs text-mubble-text shadow-xl">
            {content}
          </div>
          <div
            className={`absolute h-0 w-0 border-4 ${arrowStyles[position]}`}
          />
        </div>
      )}
    </div>
  )
}

export default Tooltip
