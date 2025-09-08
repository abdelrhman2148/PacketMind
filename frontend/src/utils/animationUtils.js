/**
 * AI Shark - Animation Utilities
 * Performance optimizations and reduced motion support
 */

import { animationDuration, animationEasing } from '../animations'

// ===== PERFORMANCE CONSTANTS =====

export const PERFORMANCE_THRESHOLDS = {
  FRAME_BUDGET: 16.67, // 60fps target
  MAX_CONCURRENT_ANIMATIONS: 10,
  ANIMATION_COMPLEXITY_LIMIT: 5, // Max simultaneous transform properties
  MEMORY_THRESHOLD: 50 * 1024 * 1024, // 50MB
  CPU_THRESHOLD: 80 // 80% CPU usage
}

export const REDUCED_MOTION_OVERRIDES = {
  duration: 0.001,
  ease: 'linear',
  stagger: 0,
  repeat: 0,
  yoyo: false
}

// ===== BROWSER CAPABILITY DETECTION =====

export const detectBrowserCapabilities = () => {
  const capabilities = {
    supportsWillChange: 'willChange' in document.documentElement.style,
    supportsTransform3d: (() => {
      const test = document.createElement('div')
      test.style.transform = 'translate3d(1px, 1px, 1px)'
      return test.style.transform !== ''
    })(),
    supportsRequestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
    supportsIntersectionObserver: typeof IntersectionObserver !== 'undefined',
    supportsPassiveEvents: (() => {
      let supportsPassive = false
      try {
        const opts = Object.defineProperty({}, 'passive', {
          get() {
            supportsPassive = true
            return true
          }
        })
        window.addEventListener('testPassive', null, opts)
        window.removeEventListener('testPassive', null, opts)
      } catch (e) {}
      return supportsPassive
    })(),
    devicePixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: navigator.hardwareConcurrency || 2,
    memory: navigator.deviceMemory || 4
  }

  return capabilities
}

// ===== PERFORMANCE MONITORING =====

class AnimationPerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.activeAnimations = new Set()
    this.frameCount = 0
    this.lastFrameTime = 0
    this.isMonitoring = false
    this.capabilities = detectBrowserCapabilities()
  }

  startMonitoring() {
    if (this.isMonitoring) return
    this.isMonitoring = true
    this.monitorLoop()
  }

  stopMonitoring() {
    this.isMonitoring = false
  }

  monitorLoop() {
    if (!this.isMonitoring) return

    const now = performance.now()
    const deltaTime = now - this.lastFrameTime

    if (this.lastFrameTime > 0) {
      this.frameCount++
      
      // Track frame timing
      this.recordMetric('frameTime', deltaTime)
      
      // Check for performance issues
      if (deltaTime > PERFORMANCE_THRESHOLDS.FRAME_BUDGET) {
        this.recordMetric('frameDrops', 1)
        this.handlePerformanceIssue('frame_drop', { deltaTime, activeAnimations: this.activeAnimations.size })
      }
    }

    this.lastFrameTime = now
    requestAnimationFrame(() => this.monitorLoop())
  }

  recordMetric(key, value) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, { values: [], total: 0, count: 0, average: 0 })
    }

    const metric = this.metrics.get(key)
    metric.values.push(value)
    metric.total += value
    metric.count++
    metric.average = metric.total / metric.count

    // Keep only last 100 values for memory efficiency
    if (metric.values.length > 100) {
      const removed = metric.values.shift()
      metric.total -= removed
      metric.count--
      metric.average = metric.total / metric.count
    }
  }

  addAnimation(id, complexity = 1) {
    this.activeAnimations.add({ id, complexity, startTime: performance.now() })
    this.recordMetric('animationStarts', 1)
  }

  removeAnimation(id) {
    const animation = Array.from(this.activeAnimations).find(a => a.id === id)
    if (animation) {
      const duration = performance.now() - animation.startTime
      this.recordMetric('animationDuration', duration)
      this.activeAnimations.delete(animation)
      this.recordMetric('animationCompletions', 1)
    }
  }

  getPerformanceLevel() {
    const frameDrops = this.metrics.get('frameDrops')?.average || 0
    const activeCount = this.activeAnimations.size
    const memory = this.capabilities.memory

    if (frameDrops > 5 || activeCount > PERFORMANCE_THRESHOLDS.MAX_CONCURRENT_ANIMATIONS || memory < 2) {
      return 'low'
    }
    
    if (frameDrops > 2 || activeCount > 5 || memory < 4) {
      return 'medium'
    }

    return 'high'
  }

  handlePerformanceIssue(type, data) {
    console.warn(`Animation performance issue: ${type}`, data)
    
    // Auto-optimization strategies
    if (type === 'frame_drop' && data.activeAnimations > 5) {
      this.optimizeAnimations()
    }
  }

  optimizeAnimations() {
    // Reduce animation complexity for active animations
    this.activeAnimations.forEach(animation => {
      if (animation.complexity > 3) {
        // Could emit events to reduce animation complexity
        console.log(`Reducing complexity for animation ${animation.id}`)
      }
    })
  }

  getMetrics() {
    return {
      frameTime: this.metrics.get('frameTime'),
      frameDrops: this.metrics.get('frameDrops'),
      activeAnimations: this.activeAnimations.size,
      performanceLevel: this.getPerformanceLevel(),
      capabilities: this.capabilities
    }
  }
}

export const performanceMonitor = new AnimationPerformanceMonitor()

// ===== MOTION PREFERENCE DETECTION =====

export const getMotionPreference = () => {
  // Check system preference
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (mediaQuery.matches) return 'reduce'

  // Check user setting (could be stored in localStorage)
  const userPreference = localStorage.getItem('motion-preference')
  if (userPreference) return userPreference

  // Check device capabilities
  const capabilities = detectBrowserCapabilities()
  if (capabilities.memory < 2 || capabilities.hardwareConcurrency < 2) {
    return 'reduce'
  }

  return 'full'
}

export const respectsReducedMotion = () => {
  return getMotionPreference() === 'reduce'
}

// ===== OPTIMIZATION UTILITIES =====

export const optimizeAnimationVariants = (variants, options = {}) => {
  const {
    performanceLevel = 'auto',
    reduceComplexity = false,
    forceGPU = true
  } = options

  const motionPreference = getMotionPreference()
  const detectedPerformanceLevel = performanceMonitor.getPerformanceLevel()
  const actualPerformanceLevel = performanceLevel === 'auto' ? detectedPerformanceLevel : performanceLevel

  // Handle reduced motion
  if (motionPreference === 'reduce') {
    return {
      initial: variants.animate || {},
      animate: variants.animate || {},
      exit: variants.animate || {},
      transition: REDUCED_MOTION_OVERRIDES
    }
  }

  // Optimize based on performance level
  let optimizedVariants = { ...variants }

  if (actualPerformanceLevel === 'low') {
    // Simplify animations for low-performance devices
    optimizedVariants = simplifyVariants(variants)
  } else if (actualPerformanceLevel === 'medium') {
    // Moderate optimizations
    optimizedVariants = moderateOptimizations(variants)
  }

  // Apply GPU acceleration hints
  if (forceGPU && optimizedVariants.animate) {
    optimizedVariants.animate = addGPUAcceleration(optimizedVariants.animate)
  }

  return optimizedVariants
}

const simplifyVariants = (variants) => {
  const simplified = {}

  Object.keys(variants).forEach(key => {
    const variant = variants[key]
    
    if (typeof variant === 'object') {
      simplified[key] = {
        // Keep only essential properties
        opacity: variant.opacity,
        scale: variant.scale,
        // Simplify transforms
        ...(variant.x && { x: variant.x }),
        ...(variant.y && { y: variant.y }),
        // Reduce transition complexity
        transition: {
          duration: Math.min(variant.transition?.duration || 0.3, 0.2),
          ease: 'easeOut'
        }
      }
    } else {
      simplified[key] = variant
    }
  })

  return simplified
}

const moderateOptimizations = (variants) => {
  const optimized = { ...variants }

  Object.keys(optimized).forEach(key => {
    const variant = optimized[key]
    
    if (variant?.transition) {
      optimized[key] = {
        ...variant,
        transition: {
          ...variant.transition,
          // Reduce duration slightly
          duration: (variant.transition.duration || 0.3) * 0.8
        }
      }
    }
  })

  return optimized
}

const addGPUAcceleration = (variant) => {
  const accelerated = { ...variant }

  // Add will-change hints for browsers that support it
  if (detectBrowserCapabilities().supportsWillChange) {
    accelerated.willChange = 'transform, opacity'
  }

  // Use transform3d for GPU acceleration
  if (variant.x || variant.y) {
    accelerated.transform = `translate3d(${variant.x || 0}px, ${variant.y || 0}px, 0)`
    delete accelerated.x
    delete accelerated.y
  }

  return accelerated
}

// ===== ANIMATION QUEUE MANAGEMENT =====

class AnimationQueue {
  constructor(maxConcurrent = PERFORMANCE_THRESHOLDS.MAX_CONCURRENT_ANIMATIONS) {
    this.queue = []
    this.active = new Map()
    this.maxConcurrent = maxConcurrent
  }

  add(animation, priority = 0) {
    const item = {
      id: animation.id || `anim-${Date.now()}-${Math.random()}`,
      animation,
      priority,
      addedAt: Date.now()
    }

    // Insert based on priority
    const insertIndex = this.queue.findIndex(queued => queued.priority < priority)
    if (insertIndex === -1) {
      this.queue.push(item)
    } else {
      this.queue.splice(insertIndex, 0, item)
    }

    this.processQueue()
    return item.id
  }

  processQueue() {
    while (this.queue.length > 0 && this.active.size < this.maxConcurrent) {
      const item = this.queue.shift()
      this.executeAnimation(item)
    }
  }

  async executeAnimation(item) {
    this.active.set(item.id, item)
    performanceMonitor.addAnimation(item.id)

    try {
      await item.animation()
    } catch (error) {
      console.error(`Animation ${item.id} failed:`, error)
    } finally {
      this.active.delete(item.id)
      performanceMonitor.removeAnimation(item.id)
      this.processQueue()
    }
  }

  cancel(id) {
    // Remove from queue
    this.queue = this.queue.filter(item => item.id !== id)
    
    // Cancel active animation (implementation depends on animation library)
    if (this.active.has(id)) {
      this.active.delete(id)
      performanceMonitor.removeAnimation(id)
    }
  }

  clear() {
    this.queue = []
    this.active.clear()
  }

  getStats() {
    return {
      queued: this.queue.length,
      active: this.active.size,
      total: this.queue.length + this.active.size
    }
  }
}

export const animationQueue = new AnimationQueue()

// ===== UTILITY FUNCTIONS =====

export const createOptimizedTransition = (options = {}) => {
  const {
    duration = animationDuration.normal,
    ease = animationEasing.netflix,
    delay = 0,
    staggerChildren,
    delayChildren
  } = options

  const motionPreference = getMotionPreference()
  const performanceLevel = performanceMonitor.getPerformanceLevel()

  if (motionPreference === 'reduce') {
    return REDUCED_MOTION_OVERRIDES
  }

  let optimizedDuration = duration
  if (performanceLevel === 'low') {
    optimizedDuration = Math.min(duration, 200)
  } else if (performanceLevel === 'medium') {
    optimizedDuration = duration * 0.8
  }

  const transition = {
    duration: optimizedDuration / 1000,
    ease,
    delay: delay / 1000
  }

  if (staggerChildren !== undefined) {
    transition.staggerChildren = staggerChildren
  }

  if (delayChildren !== undefined) {
    transition.delayChildren = delayChildren / 1000
  }

  return transition
}

export const createResponsiveVariants = (baseVariants, breakpoints = {}) => {
  const { mobile, tablet, desktop } = breakpoints
  const screenWidth = window.innerWidth

  let responsiveVariants = { ...baseVariants }

  if (screenWidth < 768 && mobile) {
    responsiveVariants = { ...responsiveVariants, ...mobile }
  } else if (screenWidth < 1024 && tablet) {
    responsiveVariants = { ...responsiveVariants, ...tablet }
  } else if (desktop) {
    responsiveVariants = { ...responsiveVariants, ...desktop }
  }

  return optimizeAnimationVariants(responsiveVariants)
}

export const preloadAnimations = (animationConfigs) => {
  // Precompute optimized variants for better performance
  const precomputed = new Map()

  animationConfigs.forEach(config => {
    const { name, variants, options = {} } = config
    const optimized = optimizeAnimationVariants(variants, options)
    precomputed.set(name, optimized)
  })

  return precomputed
}

export const measureAnimationPerformance = (animationFn, options = {}) => {
  const { sampleSize = 10, logResults = false } = options
  const measurements = []

  return new Promise((resolve) => {
    let count = 0

    const runSample = async () => {
      const startTime = performance.now()
      const startMemory = performance.memory?.usedJSHeapSize || 0

      await animationFn()

      const endTime = performance.now()
      const endMemory = performance.memory?.usedJSHeapSize || 0

      measurements.push({
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory
      })

      count++
      if (count < sampleSize) {
        requestAnimationFrame(runSample)
      } else {
        const results = analyzePerformanceMeasurements(measurements)
        if (logResults) {
          console.log('Animation Performance Results:', results)
        }
        resolve(results)
      }
    }

    runSample()
  })
}

const analyzePerformanceMeasurements = (measurements) => {
  const durations = measurements.map(m => m.duration)
  const memoryDeltas = measurements.map(m => m.memoryDelta)

  return {
    duration: {
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
    },
    memory: {
      average: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      min: Math.min(...memoryDeltas),
      max: Math.max(...memoryDeltas)
    },
    isPerformant: durations.every(d => d < PERFORMANCE_THRESHOLDS.FRAME_BUDGET),
    recommendations: generatePerformanceRecommendations(measurements)
  }
}

const generatePerformanceRecommendations = (measurements) => {
  const recommendations = []
  const avgDuration = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length
  const avgMemory = measurements.reduce((sum, m) => sum + m.memoryDelta, 0) / measurements.length

  if (avgDuration > PERFORMANCE_THRESHOLDS.FRAME_BUDGET) {
    recommendations.push('Consider reducing animation duration or complexity')
  }

  if (avgMemory > 1024 * 1024) { // 1MB
    recommendations.push('Animation is memory-intensive, consider optimization')
  }

  if (measurements.some(m => m.duration > PERFORMANCE_THRESHOLDS.FRAME_BUDGET * 2)) {
    recommendations.push('Inconsistent performance detected, check for blocking operations')
  }

  return recommendations
}

// ===== EXPORTS =====

export {
  performanceMonitor,
  animationQueue,
  detectBrowserCapabilities,
  getMotionPreference,
  respectsReducedMotion,
  optimizeAnimationVariants,
  createOptimizedTransition,
  createResponsiveVariants,
  preloadAnimations,
  measureAnimationPerformance
}

// Auto-start performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring()
}