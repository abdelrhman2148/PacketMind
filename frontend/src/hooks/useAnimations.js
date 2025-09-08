/**
 * AI Shark - Advanced Animation Hook
 * Comprehensive animation state management and performance monitoring
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAnimationControls, useMotionValue, useTransform } from 'framer-motion'
import { usePerformanceMonitoring } from './usePerformanceMonitoring'
import { animationDuration, animationEasing } from '../animations'

// Animation performance metrics
const ANIMATION_PERFORMANCE_THRESHOLD = 16.67 // 60fps target
const MAX_CONCURRENT_ANIMATIONS = 10

/**
 * Advanced animations hook with performance monitoring and state management
 * @param {Object} options - Configuration options
 * @returns {Object} Animation utilities and state
 */
export const useAnimations = (options = {}) => {
  const {
    enablePerformanceMonitoring = true,
    respectReducedMotion = true,
    maxConcurrentAnimations = MAX_CONCURRENT_ANIMATIONS,
    onAnimationStart,
    onAnimationComplete,
    onPerformanceWarning
  } = options

  // Performance monitoring
  const { trackMetric, getMetrics } = usePerformanceMonitoring()
  
  // Animation state management
  const [activeAnimations, setActiveAnimations] = useState(new Set())
  const [animationQueue, setAnimationQueue] = useState([])
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [performanceMode, setPerformanceMode] = useState('normal') // normal, optimized, disabled
  
  // Performance tracking
  const animationTimingsRef = useRef(new Map())
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(0)

  // Framer Motion controls
  const controls = useAnimationControls()
  const motionValue = useMotionValue(0)
  const progress = useTransform(motionValue, [0, 1], [0, 100])

  // Check for reduced motion preference
  useEffect(() => {
    if (!respectReducedMotion) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)

    const handleChange = (e) => setIsReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [respectReducedMotion])

  // Performance monitoring for animations
  useEffect(() => {
    if (!enablePerformanceMonitoring) return

    let rafId
    const monitorPerformance = () => {
      const now = performance.now()
      const deltaTime = now - lastFrameTimeRef.current
      
      if (lastFrameTimeRef.current > 0) {
        frameCountRef.current++
        
        // Track frame timing
        if (deltaTime > ANIMATION_PERFORMANCE_THRESHOLD) {
          trackMetric('animation_frame_drop', deltaTime)
          
          if (onPerformanceWarning) {
            onPerformanceWarning({
              type: 'frame_drop',
              deltaTime,
              threshold: ANIMATION_PERFORMANCE_THRESHOLD,
              activeAnimationCount: activeAnimations.size
            })
          }

          // Auto-optimize performance if too many frame drops
          if (activeAnimations.size > maxConcurrentAnimations) {
            setPerformanceMode('optimized')
          }
        }
      }
      
      lastFrameTimeRef.current = now
      rafId = requestAnimationFrame(monitorPerformance)
    }

    rafId = requestAnimationFrame(monitorPerformance)
    return () => cancelAnimationFrame(rafId)
  }, [activeAnimations.size, enablePerformanceMonitoring, trackMetric, onPerformanceWarning, maxConcurrentAnimations])

  // Animation queue management
  const processAnimationQueue = useCallback(() => {
    if (animationQueue.length === 0 || activeAnimations.size >= maxConcurrentAnimations) {
      return
    }

    const nextAnimation = animationQueue[0]
    setAnimationQueue(prev => prev.slice(1))
    
    // Execute the animation
    nextAnimation.execute()
  }, [animationQueue, activeAnimations.size, maxConcurrentAnimations])

  useEffect(() => {
    processAnimationQueue()
  }, [processAnimationQueue])

  // Animation registration and tracking
  const registerAnimation = useCallback((animationId, animationFn) => {
    const startTime = performance.now()

    // Add to active animations
    setActiveAnimations(prev => new Set([...prev, animationId]))
    animationTimingsRef.current.set(animationId, { startTime })

    if (onAnimationStart) {
      onAnimationStart(animationId, { activeCount: activeAnimations.size + 1 })
    }

    // Create wrapper function with cleanup
    const wrappedAnimation = async () => {
      try {
        await animationFn()
      } finally {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        // Track animation performance
        trackMetric('animation_duration', duration)
        trackMetric('animation_completed', 1)
        
        // Remove from active animations
        setActiveAnimations(prev => {
          const newSet = new Set(prev)
          newSet.delete(animationId)
          return newSet
        })
        
        animationTimingsRef.current.delete(animationId)

        if (onAnimationComplete) {
          onAnimationComplete(animationId, { 
            duration, 
            activeCount: activeAnimations.size - 1 
          })
        }
      }
    }

    return wrappedAnimation
  }, [activeAnimations.size, trackMetric, onAnimationStart, onAnimationComplete])

  // Queue animation if too many are active
  const queueAnimation = useCallback((animationId, animationFn, priority = 0) => {
    if (activeAnimations.size < maxConcurrentAnimations) {
      const wrappedAnimation = registerAnimation(animationId, animationFn)
      return wrappedAnimation()
    }

    // Add to queue with priority
    const queueItem = {
      id: animationId,
      execute: () => {
        const wrappedAnimation = registerAnimation(animationId, animationFn)
        return wrappedAnimation()
      },
      priority
    }

    setAnimationQueue(prev => {
      const newQueue = [...prev, queueItem]
      return newQueue.sort((a, b) => b.priority - a.priority)
    })
  }, [activeAnimations.size, maxConcurrentAnimations, registerAnimation])

  // Create optimized animation variants based on performance mode
  const getOptimizedVariants = useCallback((baseVariants) => {
    if (isReducedMotion) {
      return {
        initial: baseVariants.initial || {},
        animate: { ...baseVariants.animate, transition: { duration: 0.001 } },
        exit: { ...baseVariants.exit, transition: { duration: 0.001 } }
      }
    }

    if (performanceMode === 'optimized') {
      return {
        ...baseVariants,
        animate: {
          ...baseVariants.animate,
          transition: {
            ...baseVariants.animate?.transition,
            duration: (baseVariants.animate?.transition?.duration || animationDuration.normal / 1000) * 0.5
          }
        }
      }
    }

    if (performanceMode === 'disabled') {
      return {
        initial: baseVariants.animate || {},
        animate: baseVariants.animate || {},
        exit: baseVariants.animate || {}
      }
    }

    return baseVariants
  }, [isReducedMotion, performanceMode])

  // Preset animation functions
  const fadeIn = useCallback((element, options = {}) => {
    const animationId = `fade-in-${Date.now()}-${Math.random()}`
    const { duration = animationDuration.normal, delay = 0 } = options

    return queueAnimation(animationId, async () => {
      await controls.start({
        opacity: 1,
        transition: { duration: duration / 1000, delay: delay / 1000, ease: animationEasing.netflix }
      })
    })
  }, [controls, queueAnimation])

  const slideIn = useCallback((element, options = {}) => {
    const animationId = `slide-in-${Date.now()}-${Math.random()}`
    const { direction = 'up', duration = animationDuration.normal, delay = 0, distance = 20 } = options

    const directionMap = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance }
    }

    return queueAnimation(animationId, async () => {
      await controls.start({
        ...directionMap[direction],
        opacity: 1,
        y: direction === 'up' || direction === 'down' ? 0 : undefined,
        x: direction === 'left' || direction === 'right' ? 0 : undefined,
        transition: { duration: duration / 1000, delay: delay / 1000, ease: animationEasing.netflix }
      })
    })
  }, [controls, queueAnimation])

  const scaleIn = useCallback((element, options = {}) => {
    const animationId = `scale-in-${Date.now()}-${Math.random()}`
    const { duration = animationDuration.normal, delay = 0, fromScale = 0.8 } = options

    return queueAnimation(animationId, async () => {
      await controls.start({
        scale: 1,
        opacity: 1,
        transition: { duration: duration / 1000, delay: delay / 1000, ease: animationEasing.bounce }
      })
    })
  }, [controls, queueAnimation])

  // Sequence animations
  const sequence = useCallback(async (animations) => {
    for (const animation of animations) {
      await animation()
    }
  }, [])

  // Parallel animations
  const parallel = useCallback(async (animations) => {
    await Promise.all(animations.map(animation => animation()))
  }, [])

  // Stagger animations
  const stagger = useCallback(async (animations, staggerDelay = 100) => {
    const promises = animations.map((animation, index) => 
      new Promise(resolve => {
        setTimeout(async () => {
          await animation()
          resolve()
        }, index * staggerDelay)
      })
    )
    await Promise.all(promises)
  }, [])

  // Animation utilities
  const cancelAnimation = useCallback((animationId) => {
    setActiveAnimations(prev => {
      const newSet = new Set(prev)
      newSet.delete(animationId)
      return newSet
    })
    
    setAnimationQueue(prev => prev.filter(item => item.id !== animationId))
    animationTimingsRef.current.delete(animationId)
  }, [])

  const cancelAllAnimations = useCallback(() => {
    controls.stop()
    setActiveAnimations(new Set())
    setAnimationQueue([])
    animationTimingsRef.current.clear()
  }, [controls])

  const getAnimationStats = useCallback(() => {
    const metrics = getMetrics()
    return {
      activeAnimations: activeAnimations.size,
      queuedAnimations: animationQueue.length,
      performanceMode,
      isReducedMotion,
      metrics: {
        averageFrameTime: metrics.animation_frame_drop?.average || 0,
        totalAnimations: metrics.animation_completed?.total || 0,
        averageAnimationDuration: metrics.animation_duration?.average || 0
      }
    }
  }, [activeAnimations.size, animationQueue.length, performanceMode, isReducedMotion, getMetrics])

  // Memoized return object
  return useMemo(() => ({
    // State
    activeAnimations: Array.from(activeAnimations),
    queuedAnimations: animationQueue.length,
    isReducedMotion,
    performanceMode,

    // Controls
    controls,
    motionValue,
    progress,

    // Animation functions
    fadeIn,
    slideIn,
    scaleIn,
    sequence,
    parallel,
    stagger,

    // Queue management
    queueAnimation,
    registerAnimation,

    // Utilities
    getOptimizedVariants,
    cancelAnimation,
    cancelAllAnimations,
    getAnimationStats,

    // Performance
    setPerformanceMode,
    
    // Motion values for advanced usage
    createMotionValue: () => useMotionValue(0),
    createTransform: (input, output) => useTransform(motionValue, input, output)
  }), [
    activeAnimations, animationQueue.length, isReducedMotion, performanceMode,
    controls, motionValue, progress,
    fadeIn, slideIn, scaleIn, sequence, parallel, stagger,
    queueAnimation, registerAnimation,
    getOptimizedVariants, cancelAnimation, cancelAllAnimations, getAnimationStats,
    setPerformanceMode
  ])
}

// Hook for simple page transitions
export const usePageTransition = (routePath) => {
  const { slideIn, fadeIn, getOptimizedVariants } = useAnimations()
  
  const pageVariants = useMemo(() => getOptimizedVariants({
    initial: { opacity: 0, x: 20, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -20, scale: 1.02 }
  }), [getOptimizedVariants])

  const enterPage = useCallback(() => {
    return slideIn(null, { direction: 'right', duration: animationDuration.netflix })
  }, [slideIn])

  const exitPage = useCallback(() => {
    return slideIn(null, { direction: 'left', duration: animationDuration.fast })
  }, [slideIn])

  return { pageVariants, enterPage, exitPage }
}

// Hook for loading state animations
export const useLoadingAnimation = () => {
  const { controls, getOptimizedVariants, isReducedMotion } = useAnimations()

  const spinVariants = useMemo(() => getOptimizedVariants({
    animate: {
      rotate: isReducedMotion ? 0 : 360,
      transition: {
        duration: 1,
        repeat: isReducedMotion ? 0 : Infinity,
        ease: 'linear'
      }
    }
  }), [getOptimizedVariants, isReducedMotion])

  const pulseVariants = useMemo(() => getOptimizedVariants({
    animate: {
      scale: isReducedMotion ? [1] : [1, 1.1, 1],
      opacity: isReducedMotion ? [1] : [1, 0.8, 1],
      transition: {
        duration: 1.5,
        repeat: isReducedMotion ? 0 : Infinity,
        ease: 'easeInOut'
      }
    }
  }), [getOptimizedVariants, isReducedMotion])

  return { spinVariants, pulseVariants, controls }
}

export default useAnimations