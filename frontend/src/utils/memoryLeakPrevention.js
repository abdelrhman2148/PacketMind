import { useEffect, useRef, useCallback } from 'react'
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring'

// Memory leak detection and prevention utilities
export class MemoryLeakDetector {
  constructor() {
    this.observers = new Set()
    this.timers = new Set()
    this.listeners = new Set()
    this.subscriptions = new Set()
    this.intervals = new Set()
    this.animationFrames = new Set()
    this.webSockets = new Set()
    this.abortControllers = new Set()
    
    // Memory leak thresholds
    this.thresholds = {
      maxObservers: 50,
      maxTimers: 100,
      maxListeners: 200,
      maxSubscriptions: 50,
      memoryGrowthRate: 50, // MB per minute
      maxMemoryUsage: 500 // MB
    }
    
    // Monitoring state
    this.isMonitoring = false
    this.lastMemoryCheck = 0
    this.memoryHistory = []
    this.warningCallbacks = new Set()
  }

  // Start monitoring for memory leaks
  startMonitoring() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage()
      this.checkResourceLeaks()
    }, 10000) // Check every 10 seconds
    
    // Monitor page visibility to pause/resume monitoring
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  }

  // Handle page visibility changes
  handleVisibilityChange = () => {
    if (document.hidden) {
      this.pauseMonitoring()
    } else {
      this.resumeMonitoring()
    }
  }

  pauseMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  resumeMonitoring() {
    if (this.isMonitoring && !this.monitoringInterval) {
      this.monitoringInterval = setInterval(() => {
        this.checkMemoryUsage()
        this.checkResourceLeaks()
      }, 10000)
    }
  }

  // Check memory usage
  checkMemoryUsage() {
    if (!performance.memory) return

    const memoryInfo = {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
      timestamp: Date.now()
    }

    this.memoryHistory.push(memoryInfo)
    
    // Keep only last 20 entries (3+ minutes of history)
    if (this.memoryHistory.length > 20) {
      this.memoryHistory.shift()
    }

    // Check for memory growth
    this.detectMemoryGrowth()
    
    // Check for excessive memory usage
    if (memoryInfo.used > this.thresholds.maxMemoryUsage) {
      this.triggerWarning('high_memory', {
        current: memoryInfo.used,
        threshold: this.thresholds.maxMemoryUsage,
        message: `High memory usage detected: ${memoryInfo.used}MB`
      })
    }
  }

  // Detect memory growth patterns
  detectMemoryGrowth() {
    if (this.memoryHistory.length < 5) return

    const recent = this.memoryHistory.slice(-5)
    const oldest = recent[0]
    const newest = recent[recent.length - 1]
    
    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000 / 60 // minutes
    const memoryDiff = newest.used - oldest.used // MB
    
    if (timeDiff > 0) {
      const growthRate = memoryDiff / timeDiff // MB per minute
      
      if (growthRate > this.thresholds.memoryGrowthRate) {
        this.triggerWarning('memory_growth', {
          growthRate: growthRate.toFixed(2),
          threshold: this.thresholds.memoryGrowthRate,
          message: `Rapid memory growth detected: ${growthRate.toFixed(2)}MB/min`
        })
      }
    }
  }

  // Check for resource leaks
  checkResourceLeaks() {
    const issues = []

    if (this.observers.size > this.thresholds.maxObservers) {
      issues.push(`Too many observers: ${this.observers.size}`)
    }

    if (this.timers.size > this.thresholds.maxTimers) {
      issues.push(`Too many timers: ${this.timers.size}`)
    }

    if (this.listeners.size > this.thresholds.maxListeners) {
      issues.push(`Too many listeners: ${this.listeners.size}`)
    }

    if (this.subscriptions.size > this.thresholds.maxSubscriptions) {
      issues.push(`Too many subscriptions: ${this.subscriptions.size}`)
    }

    if (issues.length > 0) {
      this.triggerWarning('resource_leak', {
        issues,
        message: `Resource leaks detected: ${issues.join(', ')}`
      })
    }
  }

  // Register resources for tracking
  registerObserver(observer) {
    this.observers.add(observer)
    return () => this.observers.delete(observer)
  }

  registerTimer(timerId) {
    this.timers.add(timerId)
    return () => this.timers.delete(timerId)
  }

  registerListener(element, event, listener) {
    const key = `${element.constructor.name}-${event}`
    this.listeners.add(key)
    return () => this.listeners.delete(key)
  }

  registerSubscription(subscription) {
    this.subscriptions.add(subscription)
    return () => this.subscriptions.delete(subscription)
  }

  registerInterval(intervalId) {
    this.intervals.add(intervalId)
    return () => this.intervals.delete(intervalId)
  }

  registerAnimationFrame(frameId) {
    this.animationFrames.add(frameId)
    return () => this.animationFrames.delete(frameId)
  }

  registerWebSocket(socket) {
    this.webSockets.add(socket)
    return () => this.webSockets.delete(socket)
  }

  registerAbortController(controller) {
    this.abortControllers.add(controller)
    return () => this.abortControllers.delete(controller)
  }

  // Add warning callback
  addWarningCallback(callback) {
    this.warningCallbacks.add(callback)
    return () => this.warningCallbacks.delete(callback)
  }

  // Trigger warning
  triggerWarning(type, data) {
    const warning = {
      type,
      timestamp: Date.now(),
      ...data
    }

    console.warn('Memory Leak Warning:', warning)
    
    this.warningCallbacks.forEach(callback => {
      try {
        callback(warning)
      } catch (error) {
        console.error('Warning callback error:', error)
      }
    })
  }

  // Force garbage collection (if available)
  forceGarbageCollection() {
    if (window.gc) {
      window.gc()
      console.log('Forced garbage collection')
    } else {
      console.warn('Garbage collection not available')
    }
  }

  // Get current stats
  getStats() {
    return {
      observers: this.observers.size,
      timers: this.timers.size,
      listeners: this.listeners.size,
      subscriptions: this.subscriptions.size,
      intervals: this.intervals.size,
      animationFrames: this.animationFrames.size,
      webSockets: this.webSockets.size,
      abortControllers: this.abortControllers.size,
      memoryHistory: this.memoryHistory.slice(-5), // Last 5 entries
      isMonitoring: this.isMonitoring
    }
  }

  // Cleanup all resources
  cleanup() {
    this.stopMonitoring()
    
    // Clear all tracked resources
    this.observers.clear()
    this.timers.clear()
    this.listeners.clear()
    this.subscriptions.clear()
    this.intervals.clear()
    this.animationFrames.clear()
    this.webSockets.clear()
    this.abortControllers.clear()
    this.warningCallbacks.clear()
    
    this.memoryHistory = []
  }
}

// Global instance
export const memoryLeakDetector = new MemoryLeakDetector()

// React hooks for memory leak prevention
export const useMemoryLeakPrevention = (options = {}) => {
  const {
    trackObservers = true,
    trackTimers = true,
    trackListeners = true,
    trackSubscriptions = true,
    onWarning = null
  } = options

  const cleanupFunctions = useRef(new Set())

  // Register cleanup function
  const registerCleanup = useCallback((cleanupFn) => {
    cleanupFunctions.current.add(cleanupFn)
    return () => cleanupFunctions.current.delete(cleanupFn)
  }, [])

  // Safe timer functions
  const safeSetTimeout = useCallback((callback, delay) => {
    const timerId = setTimeout(callback, delay)
    const cleanup = memoryLeakDetector.registerTimer(timerId)
    registerCleanup(() => {
      clearTimeout(timerId)
      cleanup()
    })
    return timerId
  }, [registerCleanup])

  const safeSetInterval = useCallback((callback, delay) => {
    const intervalId = setInterval(callback, delay)
    const cleanup = memoryLeakDetector.registerInterval(intervalId)
    registerCleanup(() => {
      clearInterval(intervalId)
      cleanup()
    })
    return intervalId
  }, [registerCleanup])

  const safeRequestAnimationFrame = useCallback((callback) => {
    const frameId = requestAnimationFrame(callback)
    const cleanup = memoryLeakDetector.registerAnimationFrame(frameId)
    registerCleanup(() => {
      cancelAnimationFrame(frameId)
      cleanup()
    })
    return frameId
  }, [registerCleanup])

  // Safe event listener
  const safeAddEventListener = useCallback((element, event, listener, options) => {
    element.addEventListener(event, listener, options)
    const cleanup = memoryLeakDetector.registerListener(element, event, listener)
    registerCleanup(() => {
      element.removeEventListener(event, listener, options)
      cleanup()
    })
  }, [registerCleanup])

  // Safe observer
  const safeCreateObserver = useCallback((ObserverClass, callback, options) => {
    const observer = new ObserverClass(callback, options)
    const cleanup = memoryLeakDetector.registerObserver(observer)
    registerCleanup(() => {
      observer.disconnect()
      cleanup()
    })
    return observer
  }, [registerCleanup])

  // Safe WebSocket
  const safeCreateWebSocket = useCallback((url, protocols) => {
    const socket = new WebSocket(url, protocols)
    const cleanup = memoryLeakDetector.registerWebSocket(socket)
    registerCleanup(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
      cleanup()
    })
    return socket
  }, [registerCleanup])

  // Safe AbortController
  const safeCreateAbortController = useCallback(() => {
    const controller = new AbortController()
    const cleanup = memoryLeakDetector.registerAbortController(controller)
    registerCleanup(() => {
      controller.abort()
      cleanup()
    })
    return controller
  }, [registerCleanup])

  // Register warning callback
  useEffect(() => {
    if (onWarning) {
      return memoryLeakDetector.addWarningCallback(onWarning)
    }
  }, [onWarning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.error('Cleanup error:', error)
        }
      })
      cleanupFunctions.current.clear()
    }
  }, [])

  return {
    // Safe functions
    safeSetTimeout,
    safeSetInterval,
    safeRequestAnimationFrame,
    safeAddEventListener,
    safeCreateObserver,
    safeCreateWebSocket,
    safeCreateAbortController,
    
    // Utilities
    registerCleanup,
    
    // Stats
    getStats: () => memoryLeakDetector.getStats()
  }
}

// Performance monitoring integration
export const useIntegratedPerformanceMonitoring = (options = {}) => {
  const performanceMonitoring = usePerformanceMonitoring({
    ...options,
    onReport: (report) => {
      // Check for performance issues
      if (report.memory && report.memory.used > 300) {
        console.warn('High memory usage in performance report:', report.memory.used, 'MB')
      }
      
      if (report.fps && report.fps < 30) {
        console.warn('Low FPS detected:', report.fps)
      }
      
      if (report.averageRenderTime > 50) {
        console.warn('Slow render times detected:', report.averageRenderTime, 'ms')
      }
      
      // Call user callback
      if (options.onReport) {
        options.onReport(report)
      }
    }
  })

  const memoryLeakPrevention = useMemoryLeakPrevention({
    onWarning: (warning) => {
      console.warn('Memory leak warning:', warning)
      
      // Integrate with performance monitoring
      performanceMonitoring.mark(`memory-warning-${warning.type}`)
      
      // Trigger performance report
      const report = performanceMonitoring.generateReport()
      if (report) {
        console.log('Performance report on memory warning:', report)
      }
    }
  })

  // Combined stats
  const getCombinedStats = useCallback(() => {
    return {
      performance: performanceMonitoring.metrics,
      memoryLeaks: memoryLeakPrevention.getStats(),
      timestamp: Date.now()
    }
  }, [performanceMonitoring.metrics, memoryLeakPrevention])

  return {
    // Performance monitoring
    ...performanceMonitoring,
    
    // Memory leak prevention
    ...memoryLeakPrevention,
    
    // Combined utilities
    getCombinedStats,
    
    // Force cleanup and GC
    forceCleanup: () => {
      memoryLeakDetector.forceGarbageCollection()
    }
  }
}

// HOC for automatic memory leak prevention
export const withMemoryLeakPrevention = (Component) => {
  const MemoryLeakPreventedComponent = (props) => {
    const { registerCleanup } = useMemoryLeakPrevention()
    
    // Automatic cleanup registration for common patterns
    useEffect(() => {
      // Register component-specific cleanup
      const componentCleanup = () => {
        console.debug(`Cleaning up ${Component.displayName || Component.name}`)
      }
      
      registerCleanup(componentCleanup)
    }, [registerCleanup])
    
    return <Component {...props} />
  }
  
  MemoryLeakPreventedComponent.displayName = `withMemoryLeakPrevention(${Component.displayName || Component.name})`
  return MemoryLeakPreventedComponent
}

// Initialize memory leak detection
export const initializeMemoryLeakDetection = (options = {}) => {
  const {
    autoStart = true,
    enableWarnings = true,
    enableConsoleLogging = true
  } = options

  if (autoStart) {
    memoryLeakDetector.startMonitoring()
  }

  // Setup global error handling
  if (enableWarnings) {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      memoryLeakDetector.triggerWarning('global_error', {
        message: event.error?.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      memoryLeakDetector.triggerWarning('unhandled_rejection', {
        message: event.reason?.message || 'Unhandled promise rejection',
        reason: event.reason
      })
    })
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    memoryLeakDetector.cleanup()
  })

  return memoryLeakDetector
}

export default {
  MemoryLeakDetector,
  memoryLeakDetector,
  useMemoryLeakPrevention,
  useIntegratedPerformanceMonitoring,
  withMemoryLeakPrevention,
  initializeMemoryLeakDetection
}