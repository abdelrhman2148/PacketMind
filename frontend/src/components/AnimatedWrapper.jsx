/**
 * AI Shark - Animated Wrapper Component
 * Easy-to-use wrapper for adding animations to any component
 */

import React, { forwardRef, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box } from '@chakra-ui/react'
import { useAnimations } from '../hooks/useAnimations'
import { 
  fadeVariants, 
  slideUpVariants, 
  slideDownVariants, 
  slideLeftVariants, 
  slideRightVariants,
  scaleVariants,
  netflixCardVariants,
  modalVariants
} from '../animations'

// Predefined animation variants
const ANIMATION_PRESETS = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  slideLeft: slideLeftVariants,
  slideRight: slideRightVariants,
  scale: scaleVariants,
  netflixCard: netflixCardVariants,
  modal: modalVariants
}

/**
 * AnimatedWrapper component for easy animation integration
 * @param {Object} props - Component props
 * @returns {JSX.Element} Animated wrapper component
 */
export const AnimatedWrapper = forwardRef(({
  children,
  animation = 'fadeIn',
  variants,
  duration,
  delay = 0,
  stagger = false,
  staggerDelay = 0.1,
  trigger = 'mount', // mount, hover, click, viewport, manual
  triggerOnce = true,
  threshold = 0.1,
  performanceMode = 'auto',
  enabled = true,
  onAnimationStart,
  onAnimationComplete,
  onAnimationError,
  as = 'div',
  className,
  style,
  ...props
}, ref) => {
  const { 
    getOptimizedVariants, 
    isReducedMotion, 
    registerAnimation,
    queueAnimation 
  } = useAnimations({
    onAnimationStart,
    onAnimationComplete
  })

  const elementRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const animationIdRef = useRef(null)

  // Determine which variants to use
  const getAnimationVariants = () => {
    if (!enabled || isReducedMotion) {
      return {
        initial: {},
        animate: {},
        exit: {}
      }
    }

    if (variants) {
      return getOptimizedVariants(variants)
    }

    if (typeof animation === 'string' && ANIMATION_PRESETS[animation]) {
      let baseVariants = ANIMATION_PRESETS[animation]
      
      // Apply custom duration if provided
      if (duration && baseVariants.animate?.transition) {
        baseVariants = {
          ...baseVariants,
          animate: {
            ...baseVariants.animate,
            transition: {
              ...baseVariants.animate.transition,
              duration: duration / 1000
            }
          }
        }
      }

      return getOptimizedVariants(baseVariants)
    }

    // Fallback to fade
    return getOptimizedVariants(fadeVariants)
  }

  const animationVariants = getAnimationVariants()

  // Intersection Observer for viewport trigger
  useEffect(() => {
    if (trigger !== 'viewport' || !enabled) return

    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!triggerOnce || !hasAnimatedRef.current)) {
            hasAnimatedRef.current = true
            if (onAnimationStart) {
              onAnimationStart()
            }
          }
        })
      },
      { threshold }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
      observer.disconnect()
    }
  }, [trigger, threshold, triggerOnce, enabled, onAnimationStart])

  // Handle manual trigger
  const triggerAnimation = () => {
    if (!enabled || (triggerOnce && hasAnimatedRef.current)) return

    animationIdRef.current = `animated-wrapper-${Date.now()}-${Math.random()}`
    hasAnimatedRef.current = true

    if (onAnimationStart) {
      onAnimationStart()
    }
  }

  // Auto-trigger on mount
  useEffect(() => {
    if (trigger === 'mount' && enabled) {
      triggerAnimation()
    }
  }, [trigger, enabled])

  // Stagger children if requested
  const getStaggerVariants = () => {
    if (!stagger) return animationVariants

    return {
      ...animationVariants,
      animate: {
        ...animationVariants.animate,
        transition: {
          ...animationVariants.animate?.transition,
          staggerChildren: staggerDelay,
          delayChildren: delay / 1000
        }
      }
    }
  }

  const staggerVariants = getStaggerVariants()

  // Handle different trigger types
  const getMotionProps = () => {
    const baseProps = {
      variants: staggerVariants,
      initial: "initial",
      animate: trigger === 'viewport' ? (hasAnimatedRef.current ? "animate" : "initial") : "animate",
      exit: "exit",
      transition: {
        delay: delay / 1000
      }
    }

    if (trigger === 'hover') {
      baseProps.whileHover = "animate"
      baseProps.animate = "initial"
    }

    if (trigger === 'click') {
      baseProps.whileTap = "animate"
      baseProps.animate = "initial"
    }

    return baseProps
  }

  const motionProps = getMotionProps()

  // Event handlers
  const handleAnimationComplete = () => {
    if (onAnimationComplete) {
      onAnimationComplete()
    }
  }

  const handleAnimationStart = () => {
    if (trigger !== 'viewport' && onAnimationStart) {
      onAnimationStart()
    }
  }

  // Click handler for click trigger
  const handleClick = () => {
    if (trigger === 'click') {
      triggerAnimation()
    }
  }

  // Render based on component type
  const MotionComponent = motion(as === 'div' ? Box : as)

  const wrapperProps = {
    ref: (node) => {
      elementRef.current = node
      if (ref) {
        if (typeof ref === 'function') {
          ref(node)
        } else {
          ref.current = node
        }
      }
    },
    className,
    style,
    onClick: handleClick,
    onAnimationStart: handleAnimationStart,
    onAnimationComplete: handleAnimationComplete,
    ...motionProps,
    ...props
  }

  // For Chakra UI Box component
  if (as === 'div' || as === Box) {
    return (
      <MotionComponent {...wrapperProps}>
        {children}
      </MotionComponent>
    )
  }

  // For other HTML elements
  return (
    <MotionComponent {...wrapperProps}>
      {children}
    </MotionComponent>
  )
})

AnimatedWrapper.displayName = 'AnimatedWrapper'

/**
 * Specialized wrapper for list items with stagger animation
 */
export const AnimatedList = ({ 
  children, 
  staggerDelay = 0.1, 
  animation = 'slideUp',
  containerAnimation = 'fade',
  ...props 
}) => {
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    },
    exit: {
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1
      }
    }
  }

  return (
    <AnimatedWrapper 
      variants={containerVariants} 
      animation={containerAnimation}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <AnimatedWrapper 
          key={index} 
          animation={animation}
          trigger="mount"
          delay={index * (staggerDelay * 1000)}
        >
          {child}
        </AnimatedWrapper>
      ))}
    </AnimatedWrapper>
  )
}

/**
 * Wrapper for page transitions
 */
export const AnimatedPage = ({ 
  children, 
  routeKey,
  enterAnimation = 'slideUp',
  exitAnimation = 'slideDown',
  ...props 
}) => {
  const pageVariants = {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.98 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
      }
    }
  }

  return (
    <AnimatePresence mode="wait">
      <AnimatedWrapper
        key={routeKey}
        variants={pageVariants}
        as="main"
        width="100%"
        minHeight="100vh"
        {...props}
      >
        {children}
      </AnimatedWrapper>
    </AnimatePresence>
  )
}

/**
 * Modal/Dialog animation wrapper
 */
export const AnimatedModal = ({ 
  children, 
  isOpen, 
  onClose,
  backdrop = true,
  ...props 
}) => {
  const backdropVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const modalVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 30,
      transition: {
        duration: 0.3,
        ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
      }
    }
  }

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
        >
          {backdrop && (
            <AnimatedWrapper
              variants={backdropVariants}
              position="absolute"
              top={0}
              left={0}
              width="100%"
              height="100%"
              bg="rgba(0, 0, 0, 0.8)"
              onClick={onClose}
            />
          )}
          <AnimatedWrapper
            variants={modalVariants}
            position="relative"
            zIndex={1001}
            {...props}
          >
            {children}
          </AnimatedWrapper>
        </Box>
      )}
    </AnimatePresence>
  )
}

/**
 * Loading state animation wrapper
 */
export const AnimatedLoader = ({ 
  type = 'spin',
  size = 40,
  color = 'cyan.500',
  ...props 
}) => {
  const { isReducedMotion } = useAnimations()

  const spinVariants = {
    animate: {
      rotate: isReducedMotion ? 0 : 360,
      transition: {
        duration: 1,
        repeat: isReducedMotion ? 0 : Infinity,
        ease: 'linear'
      }
    }
  }

  const pulseVariants = {
    animate: {
      scale: isReducedMotion ? [1] : [1, 1.2, 1],
      opacity: isReducedMotion ? [1] : [1, 0.7, 1],
      transition: {
        duration: 1.5,
        repeat: isReducedMotion ? 0 : Infinity,
        ease: 'easeInOut'
      }
    }
  }

  const dotVariants = {
    animate: {
      y: isReducedMotion ? [0] : [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: isReducedMotion ? 0 : Infinity,
        ease: 'easeInOut'
      }
    }
  }

  if (type === 'spin') {
    return (
      <AnimatedWrapper
        variants={spinVariants}
        width={`${size}px`}
        height={`${size}px`}
        border="3px solid"
        borderColor="transparent"
        borderTopColor={color}
        borderRadius="50%"
        {...props}
      />
    )
  }

  if (type === 'pulse') {
    return (
      <AnimatedWrapper
        variants={pulseVariants}
        width={`${size}px`}
        height={`${size}px`}
        bg={color}
        borderRadius="50%"
        {...props}
      />
    )
  }

  if (type === 'dots') {
    return (
      <Box display="flex" alignItems="center" gap={1} {...props}>
        {[0, 1, 2].map((i) => (
          <AnimatedWrapper
            key={i}
            variants={dotVariants}
            width="8px"
            height="8px"
            bg={color}
            borderRadius="50%"
            delay={i * 200}
          />
        ))}
      </Box>
    )
  }

  return null
}

export default AnimatedWrapper