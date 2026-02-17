import { useEffect, useRef, useState, useCallback } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (triggerOnce) {
            setHasAnimated(true)
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isInView: triggerOnce ? isInView || hasAnimated : isInView }
}

export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const elementTop = rect.top + scrolled
      const relativeScroll = scrolled - elementTop + window.innerHeight
      setOffset(relativeScroll * speed)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return { ref, offset }
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0
      setProgress(Math.min(Math.max(scrollProgress, 0), 1))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

export function useStaggerAnimation(itemCount: number, baseDelay: number = 50) {
  return useCallback(
    (index: number) => ({
      animationDelay: `${index * baseDelay}ms`,
    }),
    [itemCount, baseDelay]
  )
}

export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return position
}

export function useMagneticEffect<T extends HTMLElement = HTMLDivElement>(
  strength: number = 0.3
) {
  const ref = useRef<T>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) * strength
      const deltaY = (e.clientY - centerY) * strength
      setTransform({ x: deltaX, y: deltaY })
    }

    const handleMouseLeave = () => {
      setTransform({ x: 0, y: 0 })
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [strength])

  return { ref, transform }
}

export function useCountUp(
  end: number,
  duration: number = 1500,
  start: number = 0
) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)

  const startAnimation = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(start + (end - start) * easeOut)
      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [end, duration, start, isAnimating])

  return { count, startAnimation, isAnimating }
}

export function useTypewriter(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const startTyping = useCallback(() => {
    if (isTyping || isComplete) return
    setIsTyping(true)
    let index = 0

    const type = () => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
        setTimeout(type, speed)
      } else {
        setIsTyping(false)
        setIsComplete(true)
      }
    }

    type()
  }, [text, speed, isTyping, isComplete])

  const reset = useCallback(() => {
    setDisplayText('')
    setIsTyping(false)
    setIsComplete(false)
  }, [])

  return { displayText, startTyping, reset, isTyping, isComplete }
}

export default useScrollAnimation
