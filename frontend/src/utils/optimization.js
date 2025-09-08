import { memo, useMemo, useCallback, useRef, useEffect } from 'react'

// Deep comparison utility for complex objects
export const deepEqual = (a, b) => {
  if (a === b) return true
  
  if (a == null || b == null) return false
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, index) => deepEqual(val, b[index]))
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    
    if (keysA.length !== keysB.length) return false
    
    return keysA.every(key => 
      keysB.includes(key) && deepEqual(a[key], b[key])
    )
  }
  
  return false
}

// Shallow comparison for props
export const shallowEqual = (a, b) => {
  if (a === b) return true
  
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
    return false
  }
  
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  
  if (keysA.length !== keysB.length) return false
  
  return keysA.every(key => a[key] === b[key])
}

// Optimized memo with custom comparison
export const optimizedMemo = (Component, compareProps = shallowEqual) => {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    return compareProps(prevProps, nextProps)
  })
  
  MemoizedComponent.displayName = `OptimizedMemo(${Component.displayName || Component.name})`
  return MemoizedComponent
}

// Stable callback hook that prevents unnecessary re-renders
export const useStableCallback = (callback, deps = []) => {
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, deps)
  
  return useCallback((...args) => {
    return callbackRef.current(...args)
  }, [])
}

// Memoized state selector
export const useMemoizedSelector = (selector, dependencies = []) => {
  return useMemo(() => selector(), dependencies)
}

// Debounced state hook
export const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timeoutRef = useRef()
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])
  
  return [debouncedValue, setValue]
}

// Optimized list rendering utilities
export const optimizeListRendering = {
  // Create stable keys for list items
  createStableKey: (item, index, keyField = 'id') => {
    if (item && typeof item === 'object' && item[keyField]) {
      return item[keyField]
    }
    return `item-${index}-${JSON.stringify(item).slice(0, 50)}`
  },
  
  // Chunk large arrays for batch processing
  chunkArray: (array, chunkSize = 50) => {
    const chunks = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  },
  
  // Virtual scrolling calculations
  calculateVisibleRange: (scrollTop, itemHeight, containerHeight, totalItems, overscan = 5) => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    return { startIndex, endIndex, visibleCount: endIndex - startIndex + 1 }
  }
}

// Performance-optimized packet comparison
export const packetComparison = {
  // Compare packets for rendering optimizations
  arePacketsEqual: (prevPackets, nextPackets) => {
    if (prevPackets === nextPackets) return true
    if (!prevPackets || !nextPackets) return false
    if (prevPackets.length !== nextPackets.length) return false
    
    // Fast comparison using timestamps and basic properties
    return prevPackets.every((packet, index) => {
      const nextPacket = nextPackets[index]
      return packet.ts === nextPacket.ts &&
             packet.src === nextPacket.src &&
             packet.dst === nextPacket.dst &&
             packet.proto === nextPacket.proto
    })
  },
  
  // Create packet fingerprint for quick comparison
  createPacketFingerprint: (packet) => {
    return `${packet.ts}-${packet.src}-${packet.dst}-${packet.proto}-${packet.length}`
  },
  
  // Batch packet processing
  batchProcessPackets: (packets, batchSize = 100, processor) => {
    const batches = optimizeListRendering.chunkArray(packets, batchSize)
    return batches.map(batch => batch.map(processor)).flat()
  }
}

// Memory optimization utilities
export const memoryOptimization = {
  // Weak reference cache for expensive computations
  createWeakCache: () => {
    const cache = new WeakMap()
    
    return {
      get: (key) => cache.get(key),
      set: (key, value) => cache.set(key, value),
      has: (key) => cache.has(key),
      delete: (key) => cache.delete(key)
    }
  },
  
  // LRU cache implementation
  createLRUCache: (maxSize = 100) => {
    const cache = new Map()
    
    return {
      get: (key) => {
        if (cache.has(key)) {
          const value = cache.get(key)
          cache.delete(key)
          cache.set(key, value)
          return value
        }
        return undefined
      },
      
      set: (key, value) => {
        if (cache.has(key)) {
          cache.delete(key)
        } else if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value
          cache.delete(firstKey)
        }
        cache.set(key, value)
      },
      
      has: (key) => cache.has(key),
      delete: (key) => cache.delete(key),
      clear: () => cache.clear(),
      size: () => cache.size
    }
  },
  
  // Object pooling for frequently created/destroyed objects
  createObjectPool: (factory, reset = () => {}, maxSize = 50) => {
    const pool = []
    
    return {
      acquire: () => {
        if (pool.length > 0) {
          return pool.pop()
        }
        return factory()
      },
      
      release: (obj) => {
        if (pool.length < maxSize) {
          reset(obj)
          pool.push(obj)
        }
      },
      
      size: () => pool.length
    }
  }
}

// React optimization hooks
export const useOptimizedEffect = (effect, deps, comparison = shallowEqual) => {
  const prevDepsRef = useRef()
  
  useEffect(() => {
    if (!prevDepsRef.current || !comparison(prevDepsRef.current, deps)) {
      prevDepsRef.current = deps
      return effect()
    }
  }, deps)
}

export const useStableMemo = (factory, deps, comparison = shallowEqual) => {
  const prevDepsRef = useRef()
  const memoizedValueRef = useRef()
  
  if (!prevDepsRef.current || !comparison(prevDepsRef.current, deps)) {
    prevDepsRef.current = deps
    memoizedValueRef.current = factory()
  }
  
  return memoizedValueRef.current
}

// Component optimization utilities
export const componentOptimization = {
  // HOC for preventing unnecessary re-renders
  withStableProps: (Component) => {
    const StableComponent = (props) => {
      const stableProps = useMemo(() => props, [JSON.stringify(props)])
      return <Component {...stableProps} />
    }
    
    StableComponent.displayName = `withStableProps(${Component.displayName || Component.name})`
    return StableComponent
  },
  
  // HOC for lazy rendering
  withLazyRender: (Component, threshold = 100) => {
    const LazyComponent = (props) => {
      const [shouldRender, setShouldRender] = useState(false)
      const elementRef = useRef()
      
      useEffect(() => {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setShouldRender(true)
              observer.disconnect()
            }
          },
          { rootMargin: `${threshold}px` }
        )
        
        if (elementRef.current) {
          observer.observe(elementRef.current)
        }
        
        return () => observer.disconnect()
      }, [])
      
      if (!shouldRender) {
        return <div ref={elementRef} style={{ minHeight: '50px' }} />
      }
      
      return <Component {...props} />
    }
    
    LazyComponent.displayName = `withLazyRender(${Component.displayName || Component.name})`
    return LazyComponent
  },
  
  // HOC for error boundary optimization
  withErrorBoundary: (Component, fallback = null) => {
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { hasError: false }
      }
      
      static getDerivedStateFromError(error) {
        return { hasError: true }
      }
      
      componentDidCatch(error, errorInfo) {
        console.error('Component Error:', error, errorInfo)
      }
      
      render() {
        if (this.state.hasError) {
          return fallback || <div>Something went wrong.</div>
        }
        
        return <Component {...this.props} />
      }
    }
    
    ErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
    return ErrorBoundary
  }
}

// Bundle optimization utilities
export const bundleOptimization = {
  // Lazy load modules
  lazyLoad: (importFunction) => {
    return React.lazy(importFunction)
  },
  
  // Preload resources
  preloadResource: (href, as = 'script') => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  },
  
  // Resource hints
  prefetchResource: (href) => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  },
  
  // Critical resource loading
  loadCriticalCSS: (css) => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
  }
}

// Performance measurement utilities
export const performanceMeasurement = {
  // Time function execution
  timeFunction: (fn, name = 'anonymous') => {
    return (...args) => {
      const start = performance.now()
      const result = fn(...args)
      const end = performance.now()
      console.debug(`${name} execution time: ${(end - start).toFixed(2)}ms`)
      return result
    }
  },
  
  // Measure component render time
  measureRenderTime: (Component, name) => {
    const MeasuredComponent = (props) => {
      const renderStartRef = useRef()
      
      useEffect(() => {
        renderStartRef.current = performance.now()
      })
      
      useEffect(() => {
        if (renderStartRef.current) {
          const renderTime = performance.now() - renderStartRef.current
          console.debug(`${name} render time: ${renderTime.toFixed(2)}ms`)
        }
      })
      
      return <Component {...props} />
    }
    
    MeasuredComponent.displayName = `MeasuredComponent(${name})`
    return MeasuredComponent
  },
  
  // Profile component performance
  profileComponent: (Component, options = {}) => {
    const { 
      trackRenders = true, 
      trackProps = true, 
      logThreshold = 16 // 60fps threshold
    } = options
    
    const ProfiledComponent = (props) => {
      const renderCountRef = useRef(0)
      const lastPropsRef = useRef()
      
      if (trackRenders) {
        renderCountRef.current++
      }
      
      if (trackProps && lastPropsRef.current) {
        const propsChanged = !shallowEqual(lastPropsRef.current, props)
        if (propsChanged) {
          console.debug(`${Component.name} props changed:`, {
            prev: lastPropsRef.current,
            next: props
          })
        }
      }
      
      lastPropsRef.current = props
      
      const startTime = performance.now()
      const result = <Component {...props} />
      const endTime = performance.now()
      
      const renderTime = endTime - startTime
      if (renderTime > logThreshold) {
        console.warn(`${Component.name} slow render: ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`)
      }
      
      return result
    }
    
    ProfiledComponent.displayName = `ProfiledComponent(${Component.displayName || Component.name})`
    return ProfiledComponent
  }
}

export {
  optimizedMemo,
  useStableCallback,
  useMemoizedSelector,
  useDebouncedState,
  optimizeListRendering,
  packetComparison,
  memoryOptimization,
  useOptimizedEffect,
  useStableMemo,
  componentOptimization,
  bundleOptimization,
  performanceMeasurement
}