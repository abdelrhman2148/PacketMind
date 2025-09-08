/**
 * AI Shark - Advanced Page Transitions
 * Route-based animations with Netflix-style transitions
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigationType } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { useAnimations } from '../hooks/useAnimations'
import { optimizeAnimationVariants, createOptimizedTransition } from '../utils/animationUtils'

// ===== PAGE TRANSITION CONTEXT =====

const PageTransitionContext = createContext({
  transitionType: 'slide',
  direction: 'forward',
  isTransitioning: false,
  setTransitionType: () => {},
  setCustomTransition: () => {}
})

export const usePageTransition = () => useContext(PageTransitionContext)

// ===== TRANSITION VARIANTS =====

const createSlideVariants = (direction = 'forward') => ({
  initial: {
    x: direction === 'forward' ? '100%' : '-100%',
    opacity: 0,
    scale: 0.98
  },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: createOptimizedTransition({
      duration: 400,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })
  },
  exit: {
    x: direction === 'forward' ? '-100%' : '100%',
    opacity: 0,
    scale: 1.02,
    transition: createOptimizedTransition({
      duration: 300,
      ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
    })
  }
})

const fadeVariants = {
  initial: {
    opacity: 0,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: createOptimizedTransition({
      duration: 300,
      ease: 'easeOut'
    })
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: createOptimizedTransition({
      duration: 200,
      ease: 'easeIn'
    })
  }
}

const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 50
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: createOptimizedTransition({
      duration: 400,
      ease: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    })
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -25,
    transition: createOptimizedTransition({
      duration: 250,
      ease: 'easeIn'
    })
  }
}

const flipVariants = {
  initial: {
    rotateY: 90,
    opacity: 0,
    scale: 0.95
  },
  animate: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transition: createOptimizedTransition({
      duration: 500,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })
  },
  exit: {
    rotateY: -90,
    opacity: 0,
    scale: 0.95,
    transition: createOptimizedTransition({
      duration: 350,
      ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
    })
  }
}

const depthVariants = {
  initial: {
    z: -1000,
    rotateX: 45,
    opacity: 0,
    scale: 0.8
  },
  animate: {
    z: 0,
    rotateX: 0,
    opacity: 1,
    scale: 1,
    transition: createOptimizedTransition({
      duration: 600,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })
  },
  exit: {
    z: 1000,
    rotateX: -45,
    opacity: 0,
    scale: 0.8,
    transition: createOptimizedTransition({
      duration: 400,
      ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
    })
  }
}

// Netflix-style transition with card effect
const netflixVariants = {
  initial: {
    opacity: 0,
    y: 60,
    scale: 0.95,
    rotateX: 15,
    filter: 'blur(8px)'
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -40,
    scale: 1.05,
    rotateX: -10,
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  }
}

// ===== ROUTE-SPECIFIC TRANSITIONS =====

const routeTransitions = {
  '/': { type: 'netflix', direction: 'forward' },
  '/dashboard': { type: 'slide', direction: 'forward' },
  '/packets': { type: 'slide', direction: 'forward' },
  '/analytics': { type: 'scale', direction: 'forward' },
  '/settings': { type: 'flip', direction: 'forward' },
  '/profile': { type: 'depth', direction: 'forward' },
  // Modal routes
  '/modal': { type: 'scale', direction: 'up' },
  '/dialog': { type: 'fade', direction: 'forward' }
}

// ===== TRANSITION PROVIDER =====

export const PageTransitionProvider = ({ children }) => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [transitionType, setTransitionType] = useState('slide')
  const [direction, setDirection] = useState('forward')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [customTransition, setCustomTransition] = useState(null)
  const [routeHistory, setRouteHistory] = useState([])

  // Track route history for direction detection
  useEffect(() => {
    setRouteHistory(prev => {
      const newHistory = [...prev, location.pathname]
      return newHistory.slice(-5) // Keep last 5 routes
    })
  }, [location.pathname])

  // Determine transition direction based on navigation
  useEffect(() => {
    const currentRoute = location.pathname
    const routeConfig = routeTransitions[currentRoute]

    if (routeConfig) {
      setTransitionType(routeConfig.type)
      
      // Determine direction based on navigation type and route depth
      if (navigationType === 'POP') {
        setDirection('backward')
      } else {
        const routeDepth = currentRoute.split('/').length
        const prevRoute = routeHistory[routeHistory.length - 2]
        const prevDepth = prevRoute ? prevRoute.split('/').length : 0
        
        if (routeDepth > prevDepth) {
          setDirection('forward')
        } else if (routeDepth < prevDepth) {
          setDirection('backward')
        } else {
          setDirection(routeConfig.direction || 'forward')
        }
      }
    }
  }, [location.pathname, navigationType, routeHistory])

  const contextValue = useMemo(() => ({
    transitionType,
    direction,
    isTransitioning,
    setTransitionType,
    setCustomTransition,
    customTransition
  }), [transitionType, direction, isTransitioning, customTransition])

  return (
    <PageTransitionContext.Provider value={contextValue}>
      {children}
    </PageTransitionContext.Provider>
  )
}

// ===== TRANSITION WRAPPER COMPONENT =====

export const PageTransitionWrapper = ({ 
  children, 
  routeKey,
  customVariants,
  onTransitionStart,
  onTransitionComplete,
  ...props 
}) => {
  const { transitionType, direction, customTransition } = usePageTransition()
  const { getOptimizedVariants, isReducedMotion } = useAnimations()

  // Get appropriate variants based on transition type
  const getVariants = () => {
    if (customVariants) return getOptimizedVariants(customVariants)
    if (customTransition) return getOptimizedVariants(customTransition)
    if (isReducedMotion) return getOptimizedVariants(fadeVariants)

    switch (transitionType) {
      case 'slide':
        return getOptimizedVariants(createSlideVariants(direction))
      case 'fade':
        return getOptimizedVariants(fadeVariants)
      case 'scale':
        return getOptimizedVariants(scaleVariants)
      case 'flip':
        return getOptimizedVariants(flipVariants)
      case 'depth':
        return getOptimizedVariants(depthVariants)
      case 'netflix':
        return getOptimizedVariants(netflixVariants)
      default:
        return getOptimizedVariants(fadeVariants)
    }
  }

  const variants = getVariants()

  return (
    <AnimatePresence 
      mode="wait"
      onExitComplete={() => onTransitionComplete?.()}
    >
      <motion.div
        key={routeKey || transitionType}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        onAnimationStart={() => onTransitionStart?.()}
        onAnimationComplete={() => onTransitionComplete?.()}
        style={{
          width: '100%',
          minHeight: '100vh',
          position: 'relative'
        }}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ===== SPECIALIZED TRANSITION COMPONENTS =====

/**
 * Modal Transition Component
 */
export const ModalTransition = ({ 
  isOpen, 
  onClose, 
  children,
  backdrop = true,
  ...props 
}) => {
  const { getOptimizedVariants } = useAnimations()

  const backdropVariants = getOptimizedVariants({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  })

  const modalVariants = getOptimizedVariants({
    initial: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      rotateX: 15
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      rotateX: 0,
      transition: createOptimizedTransition({
        duration: 400,
        ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      })
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 30,
      rotateX: -10,
      transition: createOptimizedTransition({
        duration: 300,
        ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
      })
    }
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          {...props}
        >
          {backdrop && (
            <motion.div
              variants={backdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(4px)'
              }}
            />
          )}
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'relative',
              zIndex: 1001,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {children}
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  )
}

/**
 * Drawer Transition Component
 */
export const DrawerTransition = ({ 
  isOpen, 
  onClose, 
  children,
  direction = 'right',
  ...props 
}) => {
  const { getOptimizedVariants } = useAnimations()

  const getDrawerVariants = () => {
    const variants = {
      right: { x: '100%' },
      left: { x: '-100%' },
      top: { y: '-100%' },
      bottom: { y: '100%' }
    }

    return getOptimizedVariants({
      initial: {
        ...variants[direction],
        opacity: 0
      },
      animate: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }
      },
      exit: {
        ...variants[direction],
        opacity: 0,
        transition: createOptimizedTransition({
          duration: 300,
          ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
        })
      }
    })
  }

  const drawerVariants = getDrawerVariants()

  return (
    <AnimatePresence>
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          zIndex={1000}
          {...props}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)'
            }}
          />
          <motion.div
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'absolute',
              [direction]: 0,
              top: direction === 'top' || direction === 'bottom' ? 0 : undefined,
              width: direction === 'left' || direction === 'right' ? '320px' : '100%',
              height: direction === 'top' || direction === 'bottom' ? '320px' : '100%',
              zIndex: 1001
            }}
          >
            {children}
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  )
}

/**
 * Toast Transition Component
 */
export const ToastTransition = ({ 
  notifications = [],
  position = 'top-right',
  ...props 
}) => {
  const { getOptimizedVariants } = useAnimations()

  const getToastVariants = () => {
    const positions = {
      'top-right': { x: '100%', y: 0 },
      'top-left': { x: '-100%', y: 0 },
      'bottom-right': { x: '100%', y: 0 },
      'bottom-left': { x: '-100%', y: 0 },
      'top': { x: 0, y: '-100%' },
      'bottom': { x: 0, y: '100%' }
    }

    return getOptimizedVariants({
      initial: {
        ...positions[position],
        opacity: 0,
        scale: 0.8
      },
      animate: {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        transition: createOptimizedTransition({
          duration: 400,
          ease: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        })
      },
      exit: {
        ...positions[position],
        opacity: 0,
        scale: 0.8,
        transition: createOptimizedTransition({
          duration: 300,
          ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
        })
      }
    })
  }

  const toastVariants = getToastVariants()

  const positionStyles = {
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'top': { top: 20, left: '50%', transform: 'translateX(-50%)' },
    'bottom': { bottom: 20, left: '50%', transform: 'translateX(-50%)' }
  }

  return (
    <Box
      position="fixed"
      zIndex={1080}
      pointerEvents="none"
      {...positionStyles[position]}
      {...props}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            style={{
              marginBottom: '8px',
              pointerEvents: 'auto'
            }}
          >
            {notification.component}
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  )
}

// ===== CUSTOM HOOKS =====

/**
 * Hook for route-based transitions
 */
export const useRouteTransition = (routePath) => {
  const { setTransitionType, setCustomTransition } = usePageTransition()

  const setRouteTransition = (type, customVariants = null) => {
    if (customVariants) {
      setCustomTransition(customVariants)
    } else {
      setTransitionType(type)
      setCustomTransition(null)
    }
  }

  useEffect(() => {
    const routeConfig = routeTransitions[routePath]
    if (routeConfig) {
      setTransitionType(routeConfig.type)
    }
  }, [routePath, setTransitionType])

  return { setRouteTransition }
}

/**
 * Hook for conditional transitions based on user preferences
 */
export const useConditionalTransition = () => {
  const { isReducedMotion } = useAnimations()
  const { setTransitionType } = usePageTransition()

  useEffect(() => {
    if (isReducedMotion) {
      setTransitionType('fade')
    }
  }, [isReducedMotion, setTransitionType])

  return { isReducedMotion }
}

// ===== EXPORTS =====

export {
  PageTransitionWrapper,
  ModalTransition,
  DrawerTransition,
  ToastTransition,
  useRouteTransition,
  useConditionalTransition,
  createSlideVariants,
  fadeVariants,
  scaleVariants,
  flipVariants,
  depthVariants,
  netflixVariants
}

export default {
  PageTransitionProvider,
  PageTransitionWrapper,
  ModalTransition,
  DrawerTransition,
  ToastTransition,
  usePageTransition,
  useRouteTransition,
  useConditionalTransition
}