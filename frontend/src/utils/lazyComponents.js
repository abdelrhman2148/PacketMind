import { lazy, Suspense } from 'react'
import { Box, Spinner, VStack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

// Loading fallback component
const LoadingFallback = ({ 
  message = 'Loading component...', 
  size = 'md',
  variant = 'netflix' 
}) => (
  <MotionBox
    display="flex"
    alignItems="center"
    justifyContent="center"
    minH="200px"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <VStack spacing={4}>
      <Spinner 
        size={size}
        color={variant === 'netflix' ? '#E50914' : 'blue.500'}
        thickness="3px"
        speed="0.8s"
      />
      <Text fontSize="sm" color="netflix.silver">
        {message}
      </Text>
    </VStack>
  </MotionBox>
)

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minH="200px"
          p={6}
          bg="rgba(239, 68, 68, 0.1)"
          borderRadius="12px"
          border="1px solid rgba(239, 68, 68, 0.3)"
        >
          <VStack spacing={4}>
            <Text fontSize="4xl">⚠️</Text>
            <Text color="red.300" textAlign="center">
              Failed to load component
            </Text>
            <Text fontSize="sm" color="netflix.silver" textAlign="center">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#E50914',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}

// HOC for lazy loading with custom fallback
export const withLazyLoading = (
  importFunction, 
  fallbackProps = {},
  errorBoundary = true
) => {
  const LazyComponent = lazy(importFunction)
  
  const WrappedComponent = (props) => {
    const content = (
      <Suspense fallback={<LoadingFallback {...fallbackProps} />}>
        <LazyComponent {...props} />
      </Suspense>
    )
    
    if (errorBoundary) {
      return <LazyErrorBoundary>{content}</LazyErrorBoundary>
    }
    
    return content
  }
  
  WrappedComponent.displayName = `LazyLoaded(${LazyComponent.displayName || 'Component'})`
  return WrappedComponent
}

// Preload function for critical components
export const preloadComponent = (importFunction) => {
  return importFunction()
}

// Critical components that should be loaded immediately
export const CriticalComponents = {
  // Main app components
  App: lazy(() => import('../App')),
  
  // Core UI components
  NetflixHeader: lazy(() => import('../components/NetflixHeader')),
  MobileNavigation: lazy(() => import('../components/MobileNavigation')),
  
  // Essential features
  NetflixSearchBar: lazy(() => import('../components/NetflixSearchBar')),
  PacketList: lazy(() => import('../components/PacketList'))
}

// Heavy components that can be lazy loaded
export const LazyComponents = {
  // Analytics and Charts
  NetflixCharts: withLazyLoading(
    () => import('../components/NetflixCharts'),
    { message: 'Loading analytics...', size: 'lg' }
  ),
  
  // Timeline components
  TimelineView: withLazyLoading(
    () => import('../components/TimelineView'),
    { message: 'Loading timeline...', size: 'md' }
  ),
  
  PacketTimeline: withLazyLoading(
    () => import('../components/PacketTimeline'),
    { message: 'Loading packet timeline...', size: 'md' }
  ),
  
  PlaybackControls: withLazyLoading(
    () => import('../components/PlaybackControls'),
    { message: 'Loading playback controls...', size: 'sm' }
  ),
  
  // Chat components
  AIChatInterface: withLazyLoading(
    () => import('../components/AIChatInterface'),
    { message: 'Loading AI chat...', size: 'md' }
  ),
  
  ChatMessage: withLazyLoading(
    () => import('../components/ChatMessage'),
    { message: 'Loading chat...', size: 'sm' }
  ),
  
  // Advanced features
  AdvancedFilterPanel: withLazyLoading(
    () => import('../components/AdvancedFilterPanel'),
    { message: 'Loading filters...', size: 'sm' }
  ),
  
  DragAndDropSystem: withLazyLoading(
    () => import('../components/DragAndDropSystem'),
    { message: 'Loading drag system...', size: 'sm' }
  ),
  
  // Performance components
  VirtualizedPacketTable: withLazyLoading(
    () => import('../components/VirtualizedPacketTable'),
    { message: 'Loading virtualized table...', size: 'md' }
  ),
  
  // Mobile specific
  MobilePacketList: withLazyLoading(
    () => import('../components/MobilePacketList'),
    { message: 'Loading mobile view...', size: 'sm' }
  ),
  
  // Utility components
  ExportDialog: withLazyLoading(
    () => import('../components/ExportDialog'),
    { message: 'Loading export...', size: 'sm' }
  ),
  
  SettingsPanel: withLazyLoading(
    () => import('../components/SettingsPanel'),
    { message: 'Loading settings...', size: 'sm' }
  ),
  
  AboutDialog: withLazyLoading(
    () => import('../components/AboutDialog'),
    { message: 'Loading about...', size: 'sm' }
  )
}

// Route-based lazy loading
export const LazyRoutes = {
  Dashboard: withLazyLoading(
    () => import('../pages/Dashboard'),
    { message: 'Loading dashboard...', size: 'lg' }
  ),
  
  Analytics: withLazyLoading(
    () => import('../pages/Analytics'),
    { message: 'Loading analytics page...', size: 'lg' }
  ),
  
  Settings: withLazyLoading(
    () => import('../pages/Settings'),
    { message: 'Loading settings page...', size: 'md' }
  ),
  
  Help: withLazyLoading(
    () => import('../pages/Help'),
    { message: 'Loading help page...', size: 'md' }
  )
}

// Preloading strategies
export const PreloadStrategies = {
  // Preload on user interaction
  onHover: (importFunction) => {
    let preloaded = false
    return {
      onMouseEnter: () => {
        if (!preloaded) {
          preloaded = true
          preloadComponent(importFunction)
        }
      }
    }
  },
  
  // Preload after idle time
  onIdle: (importFunction, delay = 2000) => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        setTimeout(() => preloadComponent(importFunction), delay)
      })
    } else {
      setTimeout(() => preloadComponent(importFunction), delay)
    }
  },
  
  // Preload when in viewport
  onIntersection: (importFunction, threshold = 0.1) => {
    return (ref) => {
      if (ref && typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              preloadComponent(importFunction)
              observer.disconnect()
            }
          },
          { threshold }
        )
        observer.observe(ref)
      }
    }
  },
  
  // Preload on route change
  onRouteChange: (importFunction) => {
    // This would be integrated with router
    preloadComponent(importFunction)
  },
  
  // Preload based on user behavior
  onUserBehavior: (importFunction, triggers = []) => {
    triggers.forEach(trigger => {
      document.addEventListener(trigger, () => {
        preloadComponent(importFunction)
      }, { once: true })
    })
  }
}

// Bundle splitting helpers
export const BundleSplitting = {
  // Split by feature
  features: {
    analytics: () => import('../features/analytics'),
    chat: () => import('../features/chat'),
    timeline: () => import('../features/timeline'),
    export: () => import('../features/export')
  },
  
  // Split by vendor
  vendors: {
    charts: () => import('chart.js'),
    virtualization: () => import('react-window'),
    animations: () => import('framer-motion')
  },
  
  // Split by utility
  utilities: {
    dateUtils: () => import('../utils/dateUtils'),
    packetUtils: () => import('../utils/packetUtils'),
    exportUtils: () => import('../utils/exportUtils')
  }
}

// Progressive loading for large datasets
export const ProgressiveLoading = {
  // Load components in chunks
  loadInChunks: async (components, chunkSize = 3) => {
    const chunks = []
    for (let i = 0; i < components.length; i += chunkSize) {
      chunks.push(components.slice(i, i + chunkSize))
    }
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(component => preloadComponent(component)))
      // Small delay between chunks to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  },
  
  // Load based on priority
  loadByPriority: async (componentMap) => {
    const priorities = Object.keys(componentMap).sort((a, b) => a - b)
    
    for (const priority of priorities) {
      const components = componentMap[priority]
      await Promise.all(components.map(component => preloadComponent(component)))
    }
  }
}

// Development helpers
export const DevHelpers = {
  // Log lazy loading performance
  logPerformance: (componentName) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Lazy loading: ${componentName}`)
      const start = performance.now()
      
      return () => {
        const end = performance.now()
        console.log(`✅ Loaded ${componentName} in ${(end - start).toFixed(2)}ms`)
      }
    }
    return () => {}
  },
  
  // Bundle analysis helper
  analyzeBundles: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Bundle Analysis:')
      console.log('Critical Components:', Object.keys(CriticalComponents))
      console.log('Lazy Components:', Object.keys(LazyComponents))
      console.log('Lazy Routes:', Object.keys(LazyRoutes))
    }
  }
}

// Initialize preloading strategies
export const initializePreloading = () => {
  // Preload critical components after initial render
  PreloadStrategies.onIdle(() => import('../components/NetflixCharts'), 1000)
  PreloadStrategies.onIdle(() => import('../components/TimelineView'), 2000)
  
  // Preload based on user behavior
  PreloadStrategies.onUserBehavior(
    () => import('../components/AIChatInterface'),
    ['click', 'touchstart']
  )
  
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    DevHelpers.analyzeBundles()
  }
}

export default {
  LoadingFallback,
  LazyErrorBoundary,
  withLazyLoading,
  preloadComponent,
  CriticalComponents,
  LazyComponents,
  LazyRoutes,
  PreloadStrategies,
  BundleSplitting,
  ProgressiveLoading,
  DevHelpers,
  initializePreloading
}