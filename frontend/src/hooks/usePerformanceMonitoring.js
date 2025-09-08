import { useState, useRef, useEffect, useCallback } from 'react'

// Performance monitoring hook for tracking app metrics
export const usePerformanceMonitoring = (options = {}) => {
  const {
    enabled = true,
    reportInterval = 5000, // Report every 5 seconds
    onReport = () => {},
    trackRenders = true,
    trackMemory = true,
    trackFPS = true,
    maxSamples = 100
  } = options

  // Performance metrics state
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    fps: 0,
    lastUpdate: Date.now(),
    isCollecting: false
  })

  // Internal refs for tracking
  const metricsRef = useRef({
    renderTimes: [],
    frameCount: 0,
    lastFrameTime: 0,
    startTime: performance.now(),
    memoryPeak: 0,
    renderCount: 0
  })

  const reportTimerRef = useRef(null)
  const frameIdRef = useRef(null)

  // Memory usage tracking
  const getMemoryUsage = useCallback(() => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
    return null
  }, [])

  // FPS tracking
  const trackFPSFrame = useCallback((timestamp) => {
    if (!enabled || !trackFPS) return

    const { frameCount, lastFrameTime } = metricsRef.current
    
    if (lastFrameTime) {
      const delta = timestamp - lastFrameTime
      metricsRef.current.frameCount = frameCount + 1
      
      // Calculate FPS every second
      if (frameCount % 60 === 0) {
        const fps = Math.round(1000 / (delta || 16.67))
        setMetrics(prev => ({ ...prev, fps }))
      }
    }
    
    metricsRef.current.lastFrameTime = timestamp
    frameIdRef.current = requestAnimationFrame(trackFPSFrame)
  }, [enabled, trackFPS])

  // Render time tracking
  const trackRender = useCallback((renderTime) => {
    if (!enabled || !trackRenders) return

    const { renderTimes, renderCount } = metricsRef.current
    
    // Add new render time
    renderTimes.push(renderTime)
    
    // Keep only recent samples
    if (renderTimes.length > maxSamples) {
      renderTimes.shift()
    }
    
    // Calculate average
    const average = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
    
    metricsRef.current.renderCount = renderCount + 1
    
    setMetrics(prev => ({
      ...prev,
      renderCount: renderCount + 1,
      averageRenderTime: Math.round(average * 100) / 100
    }))
  }, [enabled, trackRenders, maxSamples])

  // Performance report generation
  const generateReport = useCallback(() => {
    if (!enabled) return null

    const memory = getMemoryUsage()
    const currentTime = performance.now()
    const { startTime, renderCount, frameCount } = metricsRef.current

    const report = {
      timestamp: Date.now(),
      uptime: Math.round((currentTime - startTime) / 1000), // seconds
      renderCount,
      frameCount,
      averageRenderTime: metrics.averageRenderTime,
      fps: metrics.fps,
      memory: memory ? {
        ...memory,
        peak: metricsRef.current.memoryPeak
      } : null,
      navigation: performance.navigation ? {
        type: performance.navigation.type,
        redirectCount: performance.navigation.redirectCount
      } : null,
      timing: performance.timing ? {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || null,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || null
      } : null
    }

    // Update memory peak
    if (memory && memory.used > metricsRef.current.memoryPeak) {
      metricsRef.current.memoryPeak = memory.used
    }

    return report
  }, [enabled, getMemoryUsage, metrics.averageRenderTime, metrics.fps])

  // Periodic reporting
  const startReporting = useCallback(() => {
    if (!enabled || reportTimerRef.current) return

    reportTimerRef.current = setInterval(() => {
      const report = generateReport()
      if (report) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: report.memory?.used || 0,
          lastUpdate: Date.now(),
          isCollecting: true
        }))
        onReport(report)
      }
    }, reportInterval)
  }, [enabled, generateReport, reportInterval, onReport])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (reportTimerRef.current) {
      clearInterval(reportTimerRef.current)
      reportTimerRef.current = null
    }
    
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current)
      frameIdRef.current = null
    }
    
    setMetrics(prev => ({ ...prev, isCollecting: false }))
  }, [])

  // Performance mark utilities
  const mark = useCallback((name) => {
    if (enabled && performance.mark) {
      performance.mark(name)
    }
  }, [enabled])

  const measure = useCallback((name, startMark, endMark) => {
    if (enabled && performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name, 'measure')[0]
        return measure ? measure.duration : null
      } catch (error) {
        console.warn('Performance measure failed:', error)
        return null
      }
    }
    return null
  }, [enabled])

  // Clear performance entries
  const clearMarks = useCallback(() => {
    if (enabled && performance.clearMarks) {
      performance.clearMarks()
    }
    if (enabled && performance.clearMeasures) {
      performance.clearMeasures()
    }
  }, [enabled])

  // Component render tracking hook
  const useRenderTracking = useCallback((componentName) => {
    const renderStartRef = useRef()
    
    useEffect(() => {
      if (!enabled || !trackRenders) return
      
      renderStartRef.current = performance.now()
      
      return () => {
        if (renderStartRef.current) {
          const renderTime = performance.now() - renderStartRef.current
          trackRender(renderTime)
          
          // Optional: Mark specific component renders
          if (componentName) {
            mark(`${componentName}-render-end`)
            const measureTime = measure(`${componentName}-render`, `${componentName}-render-start`, `${componentName}-render-end`)
            if (measureTime) {
              console.debug(`${componentName} render time:`, measureTime.toFixed(2), 'ms')
            }
          }
        }
      }
    })
    
    // Mark render start
    useEffect(() => {
      if (componentName && enabled) {
        mark(`${componentName}-render-start`)
      }
    })
  }, [enabled, trackRenders, trackRender, mark, measure, componentName])

  // Resource loading performance
  const getResourceMetrics = useCallback(() => {
    if (!enabled) return null

    const resources = performance.getEntriesByType('resource')
    const metrics = {
      total: resources.length,
      scripts: resources.filter(r => r.name.includes('.js')).length,
      styles: resources.filter(r => r.name.includes('.css')).length,
      images: resources.filter(r => r.initiatorType === 'img').length,
      fonts: resources.filter(r => r.initiatorType === 'css' && r.name.includes('font')).length,
      averageLoadTime: resources.length > 0 
        ? resources.reduce((sum, r) => sum + r.duration, 0) / resources.length 
        : 0,
      slowestResource: resources.reduce((slowest, r) => 
        r.duration > (slowest?.duration || 0) ? r : slowest, null)
    }

    return metrics
  }, [enabled])

  // Bundle size analysis
  const analyzeBundleSize = useCallback(() => {
    if (!enabled) return null

    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    
    return {
      scriptCount: scripts.length,
      styleCount: styles.length,
      scripts: scripts.map(script => ({
        src: script.src,
        async: script.async,
        defer: script.defer
      })),
      styles: styles.map(style => ({
        href: style.href,
        media: style.media
      }))
    }
  }, [enabled])

  // Initialize monitoring
  useEffect(() => {
    if (!enabled) return

    // Start FPS tracking
    if (trackFPS) {
      frameIdRef.current = requestAnimationFrame(trackFPSFrame)
    }

    // Start periodic reporting
    startReporting()

    return () => {
      stopMonitoring()
    }
  }, [enabled, trackFPS, trackFPSFrame, startReporting, stopMonitoring])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  return {
    // Metrics
    metrics,
    
    // Control
    enabled,
    startReporting,
    stopMonitoring,
    
    // Utilities
    mark,
    measure,
    clearMarks,
    trackRender,
    useRenderTracking,
    
    // Analysis
    generateReport,
    getMemoryUsage,
    getResourceMetrics,
    analyzeBundleSize
  }
}

// HOC for component performance tracking
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  const TrackedComponent = (props) => {
    const { useRenderTracking } = usePerformanceMonitoring()
    useRenderTracking(componentName || WrappedComponent.name)
    
    return <WrappedComponent {...props} />
  }
  
  TrackedComponent.displayName = `withPerformanceTracking(${componentName || WrappedComponent.name})`
  return TrackedComponent
}

export default usePerformanceMonitoring