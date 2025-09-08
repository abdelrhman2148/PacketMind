import { useState, useEffect, useRef, useCallback } from 'react'
import { useInView } from 'framer-motion'

// Custom hook for managing animations
export const useAnimations = (options = {}) => {
  const {
    threshold = 0.1,
    triggerOnce = true,
    rootMargin = '0px 0px -100px 0px',
    enableReducedMotion = true
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { threshold, rootMargin })

  // Check for reduced motion preference
  useEffect(() => {
    if (enableReducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      
      const handleChange = (e) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handleChange)
      
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [enableReducedMotion])

  // Handle visibility changes
  useEffect(() => {
    if (isInView && (!triggerOnce || !hasAnimated)) {
      setIsVisible(true)
      if (triggerOnce) {
        setHasAnimated(true)
      }
    } else if (!triggerOnce && !isInView) {
      setIsVisible(false)
    }
  }, [isInView, triggerOnce, hasAnimated])

  // Get animation variants based on reduced motion preference
  const getVariants = useCallback((variants) => {
    if (prefersReducedMotion) {
      // Return simplified variants for reduced motion
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }
    }
    return variants
  }, [prefersReducedMotion])

  // Get transition config based on reduced motion preference
  const getTransition = useCallback((transition) => {
    if (prefersReducedMotion) {
      return { duration: 0.01 }
    }
    return transition
  }, [prefersReducedMotion])

  return {
    ref,
    isVisible,
    hasAnimated,
    prefersReducedMotion,
    getVariants,
    getTransition,
    shouldAnimate: !prefersReducedMotion
  }
}

// Hook for staggered animations
export const useStaggeredAnimation = (items = [], delay = 0.1) => {
  const [visibleItems, setVisibleItems] = useState(new Set())
  const { ref, isVisible, prefersReducedMotion } = useAnimations()

  useEffect(() => {
    if (isVisible && !prefersReducedMotion) {
      items.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems(prev => new Set([...prev, index]))
        }, index * delay * 1000)
      })
    } else if (isVisible && prefersReducedMotion) {
      // Show all items immediately for reduced motion
      setVisibleItems(new Set(items.map((_, index) => index)))
    }
  }, [isVisible, items.length, delay, prefersReducedMotion])

  const isItemVisible = useCallback((index) => {
    return visibleItems.has(index)
  }, [visibleItems])

  return {
    ref,
    isItemVisible,
    allVisible: visibleItems.size === items.length
  }
}

// Hook for loading animations
export const useLoadingAnimation = (isLoading = false) => {
  const [animationPhase, setAnimationPhase] = useState('idle') // 'idle', 'loading', 'success', 'error'
  const [progress, setProgress] = useState(0)
  const { prefersReducedMotion } = useAnimations()

  useEffect(() => {
    if (isLoading) {
      setAnimationPhase('loading')
      setProgress(0)
      
      if (!prefersReducedMotion) {
        // Simulate progress for visual feedback
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev
            return prev + Math.random() * 10
          })
        }, 200)
        
        return () => clearInterval(interval)
      } else {
        setProgress(100)
      }
    } else {
      if (animationPhase === 'loading') {
        setProgress(100)
        setAnimationPhase('success')
        
        // Reset after success animation
        setTimeout(() => {
          setAnimationPhase('idle')
          setProgress(0)
        }, 1000)
      }
    }
  }, [isLoading, prefersReducedMotion, animationPhase])

  const setError = useCallback(() => {
    setAnimationPhase('error')
    setTimeout(() => {
      setAnimationPhase('idle')
      setProgress(0)
    }, 2000)
  }, [])

  return {
    animationPhase,
    progress,
    setError,
    isLoading: animationPhase === 'loading'
  }
}

// Hook for hover animations
export const useHoverAnimation = () => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const { prefersReducedMotion } = useAnimations()

  const hoverProps = {
    onMouseEnter: () => !prefersReducedMotion && setIsHovered(true),
    onMouseLeave: () => !prefersReducedMotion && setIsHovered(false),
    onMouseDown: () => !prefersReducedMotion && setIsPressed(true),
    onMouseUp: () => !prefersReducedMotion && setIsPressed(false),
    onMouseOut: () => {
      if (!prefersReducedMotion) {
        setIsHovered(false)
        setIsPressed(false)
      }
    }
  }

  const getHoverVariants = useCallback((baseVariants) => {
    if (prefersReducedMotion) {
      return {
        initial: baseVariants.initial,
        animate: baseVariants.initial
      }
    }
    
    return {
      initial: baseVariants.initial,
      hover: baseVariants.hover,
      tap: baseVariants.tap
    }
  }, [prefersReducedMotion])

  return {
    isHovered,
    isPressed,
    hoverProps,
    getHoverVariants,
    animate: isPressed ? 'tap' : isHovered ? 'hover' : 'initial'
  }
}

// Hook for scroll-triggered animations
export const useScrollAnimation = (options = {}) => {
  const {
    offset = 100,
    throttle = 16
  } = options

  const [scrollY, setScrollY] = useState(0)
  const [scrollDirection, setScrollDirection] = useState('up')
  const [isScrolling, setIsScrolling] = useState(false)
  const lastScrollY = useRef(0)
  const scrollTimeout = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Update scroll direction
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down')
      } else {
        setScrollDirection('up')
      }
      
      setScrollY(currentScrollY)
      setIsScrolling(true)
      lastScrollY.current = currentScrollY
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
      
      // Set scroll end timeout
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    const throttledHandler = throttleFunction(handleScroll, throttle)
    window.addEventListener('scroll', throttledHandler, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledHandler)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [throttle])

  const getParallaxTransform = useCallback((speed = 0.5) => {
    return `translateY(${scrollY * speed}px)`
  }, [scrollY])

  return {
    scrollY,
    scrollDirection,
    isScrolling,
    getParallaxTransform
  }
}

// Hook for page transitions
export const usePageTransition = (isLoading = false) => {
  const [transitionPhase, setTransitionPhase] = useState('idle') // 'idle', 'entering', 'entered', 'exiting'
  const { prefersReducedMotion } = useAnimations()

  useEffect(() => {
    if (isLoading) {
      setTransitionPhase('entering')
      
      if (!prefersReducedMotion) {
        setTimeout(() => {
          setTransitionPhase('entered')
        }, 500)
      } else {
        setTransitionPhase('entered')
      }
    } else {
      if (transitionPhase === 'entered') {
        setTransitionPhase('exiting')
        
        setTimeout(() => {
          setTransitionPhase('idle')
        }, prefersReducedMotion ? 10 : 300)
      }
    }
  }, [isLoading, prefersReducedMotion, transitionPhase])

  return {
    transitionPhase,
    shouldShowLoader: transitionPhase === 'entering' || transitionPhase === 'entered'
  }
}

// Hook for real-time pulse animations
export const usePulseAnimation = (isActive = false, interval = 2000) => {
  const [pulseCount, setPulseCount] = useState(0)
  const { prefersReducedMotion } = useAnimations()

  useEffect(() => {
    if (isActive && !prefersReducedMotion) {
      const pulseInterval = setInterval(() => {
        setPulseCount(prev => prev + 1)
      }, interval)
      
      return () => clearInterval(pulseInterval)
    }
  }, [isActive, interval, prefersReducedMotion])

  return {
    shouldPulse: isActive && !prefersReducedMotion,
    pulseKey: pulseCount // Use as key for re-triggering animations
  }
}

// Utility function for throttling
const throttleFunction = (func, delay) => {
  let timeoutId
  let lastExecTime = 0
  
  return function (...args) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

// Hook for managing multiple animation states
export const useAnimationState = (initialState = 'idle') => {
  const [currentState, setCurrentState] = useState(initialState)
  const [previousState, setPreviousState] = useState(null)
  const [stateHistory, setStateHistory] = useState([initialState])

  const transitionTo = useCallback((newState, delay = 0) => {
    if (delay > 0) {
      setTimeout(() => {
        setPreviousState(currentState)
        setCurrentState(newState)
        setStateHistory(prev => [...prev, newState].slice(-10)) // Keep last 10 states
      }, delay)
    } else {
      setPreviousState(currentState)
      setCurrentState(newState)
      setStateHistory(prev => [...prev, newState].slice(-10))
    }
  }, [currentState])

  const isInState = useCallback((state) => {
    return currentState === state
  }, [currentState])

  const hasBeenInState = useCallback((state) => {
    return stateHistory.includes(state)
  }, [stateHistory])

  return {
    currentState,
    previousState,
    stateHistory,
    transitionTo,
    isInState,
    hasBeenInState
  }
}

export default {
  useAnimations,
  useStaggeredAnimation,
  useLoadingAnimation,
  useHoverAnimation,
  useScrollAnimation,
  usePageTransition,
  usePulseAnimation,
  useAnimationState
}