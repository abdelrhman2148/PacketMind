import { Box, VStack, HStack, Text, Spinner as ChakraSpinner } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLoadingAnimation, usePulseAnimation } from '../hooks/useAnimations.js'
import { rotationAnimations, pulseAnimations, scaleAnimations } from '../animations/transitions.js'

const MotionBox = motion(Box)
const MotionText = motion(Text)

// Netflix-style loading spinner with various styles
const LoadingSpinner = ({ 
  size = 'md',
  variant = 'netflix',
  message = 'Loading...',
  showMessage = true,
  showProgress = false,
  progress = 0,
  color,
  thickness = 4,
  speed = 1,
  emptyColor = 'rgba(255, 255, 255, 0.2)',
  isVisible = true,
  className,
  ...props 
}) => {
  const { animationPhase, progress: animatedProgress } = useLoadingAnimation(isVisible)
  const { shouldPulse, pulseKey } = usePulseAnimation(isVisible)

  // Size configurations
  const sizeConfig = {
    xs: { 
      spinner: '16px', 
      fontSize: 'xs', 
      container: '60px',
      iconSize: '20px',
      strokeWidth: 2 
    },
    sm: { 
      spinner: '24px', 
      fontSize: 'sm', 
      container: '80px',
      iconSize: '28px',
      strokeWidth: 3 
    },
    md: { 
      spinner: '32px', 
      fontSize: 'md', 
      container: '100px',
      iconSize: '36px',
      strokeWidth: 4 
    },
    lg: { 
      spinner: '48px', 
      fontSize: 'lg', 
      container: '120px',
      iconSize: '52px',
      strokeWidth: 5 
    },
    xl: { 
      spinner: '64px', 
      fontSize: 'xl', 
      container: '140px',
      iconSize: '68px',
      strokeWidth: 6 
    }
  }

  const config = sizeConfig[size] || sizeConfig.md

  // Variant configurations
  const variantConfig = {
    netflix: {
      color: '#E50914',
      bgColor: 'rgba(229, 9, 20, 0.2)',
      glowColor: 'rgba(229, 9, 20, 0.4)',
      textColor: '#FFFFFF'
    },
    wireshark: {
      color: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.2)',
      glowColor: 'rgba(6, 182, 212, 0.4)',
      textColor: '#FFFFFF'
    },
    success: {
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.2)',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      textColor: '#FFFFFF'
    },
    warning: {
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.2)',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      textColor: '#FFFFFF'
    },
    error: {
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.2)',
      glowColor: 'rgba(239, 68, 68, 0.4)',
      textColor: '#FFFFFF'
    },
    minimal: {
      color: '#FFFFFF',
      bgColor: 'transparent',
      glowColor: 'transparent',
      textColor: '#B3B3B3'
    }
  }

  const variantStyle = variantConfig[variant] || variantConfig.netflix
  const finalColor = color || variantStyle.color

  // Custom Netflix-style spinner
  const NetflixSpinner = () => (
    <MotionBox
      key={pulseKey}
      width={config.container}
      height={config.container}
      position="relative"
      variants={shouldPulse ? pulseAnimations : {}}
      initial="initial"
      animate={shouldPulse ? "pulse" : "initial"}
    >
      {/* Outer ring */}
      <MotionBox
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        border={`${config.strokeWidth}px solid`}
        borderColor={emptyColor}
        borderRadius="50%"
        variants={scaleAnimations.scaleIn}
        initial="initial"
        animate="animate"
      />
      
      {/* Spinning arc */}
      <MotionBox
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        border={`${config.strokeWidth}px solid transparent`}
        borderTopColor={finalColor}
        borderRightColor={finalColor}
        borderRadius="50%"
        variants={rotationAnimations}
        animate="spin"
        transition={{
          duration: 1 / speed,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          filter: variant !== 'minimal' ? `drop-shadow(0 0 10px ${variantStyle.glowColor})` : 'none'
        }}
      />
      
      {/* Center glow effect */}
      {variant !== 'minimal' && (
        <MotionBox
          position="absolute"
          top="50%"
          left="50%"
          width="60%"
          height="60%"
          transform="translate(-50%, -50%)"
          bg={variantStyle.bgColor}
          borderRadius="50%"
          variants={pulseAnimations}
          animate={shouldPulse ? "pulse" : "initial"}
          filter={`blur(8px)`}
        />
      )}

      {/* Progress indicator for progress variant */}
      {showProgress && (
        <MotionBox
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          fontSize={config.fontSize}
          fontWeight="bold"
          color={variantStyle.textColor}
          variants={scaleAnimations.scaleIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          {Math.round(showProgress ? progress : animatedProgress)}%
        </MotionBox>
      )}
    </MotionBox>
  )

  // Dots spinner variant
  const DotsSpinner = () => (
    <HStack spacing={2}>
      {[0, 1, 2].map((index) => (
        <MotionBox
          key={index}
          width={config.spinner}
          height={config.spinner}
          bg={finalColor}
          borderRadius="50%"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 1.2 / speed,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"
          }}
          style={{
            filter: variant !== 'minimal' ? `drop-shadow(0 0 8px ${variantStyle.glowColor})` : 'none'
          }}
        />
      ))}
    </HStack>
  )

  // Bars spinner variant
  const BarsSpinner = () => (
    <HStack spacing={1}>
      {[0, 1, 2, 3, 4].map((index) => (
        <MotionBox
          key={index}
          width="4px"
          height={config.spinner}
          bg={finalColor}
          borderRadius="2px"
          animate={{
            height: [config.spinner, `calc(${config.spinner} * 1.5)`, config.spinner],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 1 / speed,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut"
          }}
          style={{
            filter: variant !== 'minimal' ? `drop-shadow(0 0 6px ${variantStyle.glowColor})` : 'none'
          }}
        />
      ))}
    </HStack>
  )

  // Pulse spinner variant
  const PulseSpinner = () => (
    <MotionBox
      width={config.container}
      height={config.container}
      position="relative"
    >
      {[0, 1, 2].map((index) => (
        <MotionBox
          key={index}
          position="absolute"
          top="50%"
          left="50%"
          width="100%"
          height="100%"
          border={`2px solid ${finalColor}`}
          borderRadius="50%"
          transform="translate(-50%, -50%)"
          animate={{
            scale: [0, 1],
            opacity: [1, 0]
          }}
          transition={{
            duration: 2 / speed,
            repeat: Infinity,
            delay: index * 0.6,
            ease: "easeOut"
          }}
          style={{
            filter: variant !== 'minimal' ? `drop-shadow(0 0 10px ${variantStyle.glowColor})` : 'none'
          }}
        />
      ))}
    </MotionBox>
  )

  // Chakra UI spinner as fallback
  const ChakraSpinnerComponent = () => (
    <ChakraSpinner
      size={size}
      color={finalColor}
      thickness={`${thickness}px`}
      speed={`${1/speed}s`}
      emptyColor={emptyColor}
    />
  )

  // Spinner type selection
  const getSpinnerComponent = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner />
      case 'bars':
        return <BarsSpinner />
      case 'pulse':
        return <PulseSpinner />
      case 'chakra':
        return <ChakraSpinnerComponent />
      default:
        return <NetflixSpinner />
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionBox
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={4}
          className={className}
          variants={scaleAnimations.scaleIn}
          initial="initial"
          animate="animate"
          exit="scaleOut"
          {...props}
        >
          {/* Spinner */}
          <Box display="flex" alignItems="center" justifyContent="center">
            {getSpinnerComponent()}
          </Box>

          {/* Message */}
          {showMessage && message && (
            <MotionText
              color={variantStyle.textColor}
              fontSize={config.fontSize}
              fontWeight="medium"
              textAlign="center"
              variants={scaleAnimations.scaleIn}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              {message}
            </MotionText>
          )}

          {/* Progress bar */}
          {showProgress && (
            <MotionBox
              width="200px"
              height="4px"
              bg={emptyColor}
              borderRadius="2px"
              overflow="hidden"
              variants={scaleAnimations.scaleIn}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            >
              <MotionBox
                height="100%"
                bg={finalColor}
                borderRadius="2px"
                animate={{
                  width: `${showProgress ? progress : animatedProgress}%`
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
                style={{
                  filter: variant !== 'minimal' ? `drop-shadow(0 0 8px ${variantStyle.glowColor})` : 'none'
                }}
              />
            </MotionBox>
          )}
        </MotionBox>
      )}
    </AnimatePresence>
  )
}

// Pre-configured spinner variants for common use cases
export const NetflixLoader = (props) => (
  <LoadingSpinner variant="netflix" {...props} />
)

export const WiresharkLoader = (props) => (
  <LoadingSpinner variant="wireshark" {...props} />
)

export const DotsLoader = (props) => (
  <LoadingSpinner variant="dots" {...props} />
)

export const BarsLoader = (props) => (
  <LoadingSpinner variant="bars" {...props} />
)

export const PulseLoader = (props) => (
  <LoadingSpinner variant="pulse" {...props} />
)

export const MinimalLoader = (props) => (
  <LoadingSpinner variant="minimal" {...props} />
)

// Full-screen loading overlay
export const LoadingOverlay = ({ 
  isVisible = true, 
  message = "Loading...",
  variant = "netflix",
  backdrop = true,
  ...props 
}) => (
  <AnimatePresence>
    {isVisible && (
      <MotionBox
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg={backdrop ? "rgba(0, 0, 0, 0.8)" : "transparent"}
        backdropFilter={backdrop ? "blur(10px)" : "none"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LoadingSpinner
          variant={variant}
          message={message}
          size="lg"
          {...props}
        />
      </MotionBox>
    )}
  </AnimatePresence>
)

export default LoadingSpinner