import React, { useState, useEffect, useRef } from 'react'
import {
  VStack,
  Text,
  Box,
  keyframes
} from '@chakra-ui/react'

// Animation keyframes
const countUpAnimation = keyframes`
  0% { 
    transform: scale(1) rotateX(0deg); 
    opacity: 1; 
  }
  50% { 
    transform: scale(1.1) rotateX(180deg); 
    opacity: 0.8; 
  }
  100% { 
    transform: scale(1) rotateX(360deg); 
    opacity: 1; 
  }
`

const glowPulse = keyframes`
  0%, 100% { 
    text-shadow: 0 0 10px currentColor; 
  }
  50% { 
    text-shadow: 0 0 20px currentColor, 0 0 30px currentColor; 
  }
`

const LiveStatsCounter = ({ 
  value = 0,
  label = '',
  suffix = '',
  prefix = '',
  color = 'wireshark.accent',
  size = 'lg',
  animate = true,
  glowEffect = false,
  formatNumber = true,
  animationDuration = 800,
  className = '',
  onClick = null,
  isClickable = false,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isIncreasing, setIsIncreasing] = useState(false)
  const prevValueRef = useRef(value)
  const animationFrameRef = useRef()

  // Animate value changes
  useEffect(() => {
    if (!animate || value === prevValueRef.current) {
      setDisplayValue(value)
      return
    }

    const startValue = prevValueRef.current
    const endValue = value
    const startTime = Date.now()
    
    setIsAnimating(true)
    setIsIncreasing(endValue > startValue)

    const animateValue = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)
      
      // Easing function - ease out cubic
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeOutCubic
      
      setDisplayValue(Math.round(currentValue))
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateValue)
      } else {
        setIsAnimating(false)
        prevValueRef.current = value
      }
    }

    animationFrameRef.current = requestAnimationFrame(animateValue)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [value, animate, animationDuration])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Size configurations
  const sizeConfig = {
    xs: {
      numberSize: '1rem',
      labelSize: 'xs',
      spacing: 0.5
    },
    sm: {
      numberSize: '1.25rem',
      labelSize: 'xs',
      spacing: 1
    },
    md: {
      numberSize: '1.75rem',
      labelSize: 'sm',
      spacing: 1
    },
    lg: {
      numberSize: '2.5rem',
      labelSize: 'sm',
      spacing: 2
    },
    xl: {
      numberSize: '3rem',
      labelSize: 'md',
      spacing: 2
    },
    '2xl': {
      numberSize: '4rem',
      labelSize: 'lg',
      spacing: 3
    }
  }

  const config = sizeConfig[size] || sizeConfig.lg

  // Format the number
  const formatDisplayValue = (val) => {
    if (!formatNumber) return val
    
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`
    }
    return val.toLocaleString()
  }

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick(value)
    }
  }

  return (
    <Box
      className={className}
      cursor={isClickable ? 'pointer' : 'default'}
      onClick={handleClick}
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={isClickable ? {
        transform: 'scale(1.05)',
        filter: 'brightness(1.1)'
      } : {}}
      {...props}
    >
      <VStack spacing={config.spacing} align="center">
        {/* Number Display */}
        <Box position="relative">
          <Text
            fontSize={config.numberSize}
            fontWeight="bold"
            color={color}
            lineHeight={1}
            fontFamily="heading"
            textAlign="center"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={isAnimating ? 'scale(1.05)' : 'scale(1)'}
            animation={glowEffect && isAnimating ? `${glowPulse} 0.6s ease-in-out` : 'none'}
            textShadow={glowEffect ? `0 0 ${isAnimating ? '20px' : '10px'} ${color}` : 'none'}
            style={{
              animation: isAnimating ? `${countUpAnimation} 0.6s ease-in-out` : 'none'
            }}
          >
            {prefix}{formatDisplayValue(displayValue)}{suffix}
          </Text>
          
          {/* Change indicator */}
          {isAnimating && (
            <Box
              position="absolute"
              top="-8px"
              right="-8px"
              w="6px"
              h="6px"
              borderRadius="full"
              bg={isIncreasing ? 'green.400' : 'red.400'}
              boxShadow={`0 0 10px ${isIncreasing ? '#10B981' : '#EF4444'}`}
              animation="pulse 0.8s ease-in-out"
            />
          )}
        </Box>

        {/* Label */}
        {label && (
          <Text
            fontSize={config.labelSize}
            color="netflix.silver"
            fontWeight="medium"
            textAlign="center"
            opacity={0.9}
            lineHeight={1.2}
            maxW="120px"
          >
            {label}
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export default LiveStatsCounter