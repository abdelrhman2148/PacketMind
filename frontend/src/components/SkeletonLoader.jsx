import { Box, VStack, HStack, Skeleton, SkeletonCircle, SkeletonText } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStaggeredAnimation } from '../hooks/useAnimations.js'
import { shimmerAnimations, listItemAnimations } from '../animations/transitions.js'

const MotionBox = motion(Box)

// Netflix-style skeleton loader with shimmer effects
const SkeletonLoader = ({
  variant = 'card',
  count = 1,
  isVisible = true,
  animate = true,
  shimmer = true,
  className,
  ...props
}) => {
  const skeletonItems = Array.from({ length: count }, (_, index) => index)
  const { ref, isItemVisible } = useStaggeredAnimation(skeletonItems, 0.1)

  // Base skeleton styles
  const skeletonBaseStyle = {
    bg: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
    _before: shimmer ? {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      animation: 'shimmer 2s infinite'
    } : {}
  }

  // Card skeleton variant
  const CardSkeleton = ({ index = 0 }) => (
    <MotionBox
      variants={animate ? listItemAnimations : {}}
      initial={animate ? "hidden" : "visible"}
      animate={animate && isItemVisible(index) ? "visible" : "hidden"}
      custom={index}
      w="280px"
      h="380px"
      bg="rgba(31, 31, 31, 0.95)"
      borderRadius="16px"
      border="1px solid rgba(255, 255, 255, 0.1)"
      overflow="hidden"
      position="relative"
    >
      {/* Image skeleton */}
      <Box
        h="200px"
        {...skeletonBaseStyle}
        borderRadius="16px 16px 0 0"
      />
      
      {/* Content skeleton */}
      <VStack p={6} align="stretch" spacing={4}>
        {/* Title */}
        <Box
          h="24px"
          w="80%"
          {...skeletonBaseStyle}
        />
        
        {/* Description lines */}
        <VStack spacing={2} align="stretch">
          <Box h="16px" w="100%" {...skeletonBaseStyle} />
          <Box h="16px" w="60%" {...skeletonBaseStyle} />
        </VStack>
        
        {/* Stats bar */}
        <Box h="4px" w="40%" {...skeletonBaseStyle} borderRadius="2px" />
        
        {/* Button */}
        <Box
          h="36px"
          w="100%"
          {...skeletonBaseStyle}
          mt={4}
        />
      </VStack>
    </MotionBox>
  )

  // List item skeleton variant
  const ListSkeleton = ({ index = 0 }) => (
    <MotionBox
      variants={animate ? listItemAnimations : {}}
      initial={animate ? "hidden" : "visible"}
      animate={animate && isItemVisible(index) ? "visible" : "hidden"}
      custom={index}
      p={4}
      bg="rgba(31, 31, 31, 0.95)"
      borderRadius="12px"
      border="1px solid rgba(255, 255, 255, 0.1)"
    >
      <HStack spacing={4}>
        {/* Avatar */}
        <Box
          w="48px"
          h="48px"
          borderRadius="full"
          {...skeletonBaseStyle}
        />
        
        {/* Content */}
        <VStack flex={1} align="stretch" spacing={2}>
          <Box h="20px" w="60%" {...skeletonBaseStyle} />
          <Box h="16px" w="40%" {...skeletonBaseStyle} />
        </VStack>
        
        {/* Action */}
        <Box w="80px" h="32px" {...skeletonBaseStyle} />
      </HStack>
    </MotionBox>
  )

  // Table row skeleton variant
  const TableRowSkeleton = ({ index = 0 }) => (
    <MotionBox
      variants={animate ? listItemAnimations : {}}
      initial={animate ? "hidden" : "visible"}
      animate={animate && isItemVisible(index) ? "visible" : "hidden"}
      custom={index}
      py={4}
      borderBottom="1px solid rgba(255, 255, 255, 0.1)"
    >
      <HStack spacing={6}>
        <Box w="100px" h="16px" {...skeletonBaseStyle} />
        <Box w="150px" h="16px" {...skeletonBaseStyle} />
        <Box w="80px" h="16px" {...skeletonBaseStyle} />
        <Box w="120px" h="16px" {...skeletonBaseStyle} />
        <Box w="60px" h="16px" {...skeletonBaseStyle} />
      </HStack>
    </MotionBox>
  )

  // Chart skeleton variant
  const ChartSkeleton = ({ index = 0 }) => (
    <MotionBox
      variants={animate ? listItemAnimations : {}}
      initial={animate ? "hidden" : "visible"}
      animate={animate && isItemVisible(index) ? "visible" : "hidden"}
      custom={index}
      w="100%"
      h="400px"
      bg="rgba(31, 31, 31, 0.95)"
      borderRadius="16px"
      border="1px solid rgba(255, 255, 255, 0.1)"
      p={6}
    >
      <VStack spacing={6} h="100%">
        {/* Chart title */}
        <HStack w="100%" justify="space-between">
          <Box h="24px" w="200px" {...skeletonBaseStyle} />
          <Box h="20px" w="60px" {...skeletonBaseStyle} />
        </HStack>
        
        {/* Chart area */}
        <Box
          flex={1}
          w="100%"
          position="relative"
          {...skeletonBaseStyle}
          borderRadius="12px"
        >
          {/* Fake chart elements */}
          <HStack
            position="absolute"
            bottom="20px"
            left="20px"
            right="20px"
            align="end"
            spacing={2}
          >
            {[40, 60, 80, 45, 90, 30, 70].map((height, i) => (
              <Box
                key={i}
                flex={1}
                h={`${height}px`}
                bg="rgba(255, 255, 255, 0.2)"
                borderRadius="4px"
              />
            ))}
          </HStack>
        </Box>
        
        {/* Legend */}
        <HStack spacing={4} w="100%">
          {[0, 1, 2].map((i) => (
            <HStack key={i} spacing={2}>
              <Box w="12px" h="12px" borderRadius="full" {...skeletonBaseStyle} />
              <Box w="60px" h="16px" {...skeletonBaseStyle} />
            </HStack>
          ))}
        </HStack>
      </VStack>
    </MotionBox>
  )

  // Text block skeleton variant
  const TextSkeleton = ({ index = 0 }) => (
    <MotionBox
      variants={animate ? listItemAnimations : {}}
      initial={animate ? "hidden" : "visible"}
      animate={animate && isItemVisible(index) ? "visible" : "hidden"}
      custom={index}
    >
      <VStack spacing={3} align="stretch">
        {/* Title */}
        <Box h="28px" w="70%" {...skeletonBaseStyle} />
        
        {/* Paragraph lines */}
        <VStack spacing={2} align="stretch">
          <Box h="18px" w="100%" {...skeletonBaseStyle} />
          <Box h="18px" w="95%" {...skeletonBaseStyle} />
          <Box h="18px" w="80%" {...skeletonBaseStyle} />
          <Box h="18px" w="90%" {...skeletonBaseStyle} />
          <Box h="18px" w="60%" {...skeletonBaseStyle} />
        </VStack>
      </VStack>
    </MotionBox>
  )

  // Profile skeleton variant
  const ProfileSkeleton = ({ index = 0 }) => (
    <MotionBox
      variants={animate ? listItemAnimations : {}}
      initial={animate ? "hidden" : "visible"}
      animate={animate && isItemVisible(index) ? "visible" : "hidden"}
      custom={index}
      p={6}
      bg="rgba(31, 31, 31, 0.95)"
      borderRadius="16px"
      border="1px solid rgba(255, 255, 255, 0.1)"
    >
      <VStack spacing={6}>
        {/* Avatar */}
        <Box
          w="80px"
          h="80px"
          borderRadius="full"
          {...skeletonBaseStyle}
        />
        
        {/* Name */}
        <Box h="24px" w="150px" {...skeletonBaseStyle} />
        
        {/* Bio */}
        <VStack spacing={2} w="100%">
          <Box h="16px" w="100%" {...skeletonBaseStyle} />
          <Box h="16px" w="80%" {...skeletonBaseStyle} />
        </VStack>
        
        {/* Stats */}
        <HStack spacing={8}>
          {[0, 1, 2].map((i) => (
            <VStack key={i} spacing={2}>
              <Box h="20px" w="40px" {...skeletonBaseStyle} />
              <Box h="14px" w="60px" {...skeletonBaseStyle} />
            </VStack>
          ))}
        </HStack>
      </VStack>
    </MotionBox>
  )

  // Navigation skeleton variant
  const NavSkeleton = ({ index = 0 }) => (
    <MotionBox
      variants={animate ? listItemAnimations : {}}
      initial={animate ? "hidden" : "visible"}
      animate={animate && isItemVisible(index) ? "visible" : "hidden"}
      custom={index}
    >
      <HStack spacing={6}>
        {/* Logo */}
        <Box w="120px" h="32px" {...skeletonBaseStyle} />
        
        {/* Nav items */}
        <HStack spacing={4} flex={1}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} w="80px" h="20px" {...skeletonBaseStyle} />
          ))}
        </HStack>
        
        {/* Profile */}
        <Box w="32px" h="32px" borderRadius="full" {...skeletonBaseStyle} />
      </HStack>
    </MotionBox>
  )

  // Sidebar skeleton variant
  const SidebarSkeleton = ({ index = 0 }) => (
    <MotionBox
      variants={animate ? listItemAnimations : {}}
      initial={animate ? "hidden" : "visible"}
      animate={animate && isItemVisible(index) ? "visible" : "hidden"}
      custom={index}
      w="250px"
      h="100vh"
      bg="rgba(31, 31, 31, 0.95)"
      borderRight="1px solid rgba(255, 255, 255, 0.1)"
      p={4}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Box h="40px" w="100%" {...skeletonBaseStyle} />
        
        {/* Menu items */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <HStack key={i} spacing={3}>
            <Box w="20px" h="20px" {...skeletonBaseStyle} />
            <Box h="18px" flex={1} {...skeletonBaseStyle} />
          </HStack>
        ))}
        
        {/* Divider */}
        <Box h="1px" w="100%" bg="rgba(255, 255, 255, 0.1)" my={4} />
        
        {/* More items */}
        {[0, 1, 2].map((i) => (
          <HStack key={i} spacing={3}>
            <Box w="20px" h="20px" {...skeletonBaseStyle} />
            <Box h="18px" flex={1} {...skeletonBaseStyle} />
          </HStack>
        ))}
      </VStack>
    </MotionBox>
  )

  // Component selection based on variant
  const getSkeletonComponent = (index) => {
    switch (variant) {
      case 'card':
        return <CardSkeleton key={index} index={index} />
      case 'list':
        return <ListSkeleton key={index} index={index} />
      case 'table':
        return <TableRowSkeleton key={index} index={index} />
      case 'chart':
        return <ChartSkeleton key={index} index={index} />
      case 'text':
        return <TextSkeleton key={index} index={index} />
      case 'profile':
        return <ProfileSkeleton key={index} index={index} />
      case 'nav':
        return <NavSkeleton key={index} index={index} />
      case 'sidebar':
        return <SidebarSkeleton key={index} index={index} />
      default:
        return <CardSkeleton key={index} index={index} />
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <Box ref={ref} className={className} {...props}>
          {/* Add shimmer keyframes to global styles if needed */}
          <style jsx global>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
          
          {count === 1 ? (
            getSkeletonComponent(0)
          ) : (
            <VStack spacing={variant === 'table' ? 0 : 4} align="stretch">
              {skeletonItems.map((_, index) => getSkeletonComponent(index))}
            </VStack>
          )}
        </Box>
      )}
    </AnimatePresence>
  )
}

// Pre-configured skeleton variants for common use cases
export const CardSkeletons = ({ count = 3, ...props }) => (
  <Box
    display="grid"
    gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
    gap={6}
  >
    <SkeletonLoader variant="card" count={count} {...props} />
  </Box>
)

export const ListSkeletons = ({ count = 5, ...props }) => (
  <SkeletonLoader variant="list" count={count} {...props} />
)

export const TableSkeletons = ({ count = 8, ...props }) => (
  <Box>
    {/* Table header */}
    <HStack
      spacing={6}
      py={4}
      borderBottom="2px solid rgba(255, 255, 255, 0.2)"
      mb={2}
    >
      <Box w="100px" h="18px" bg="rgba(255, 255, 255, 0.2)" borderRadius="4px" />
      <Box w="150px" h="18px" bg="rgba(255, 255, 255, 0.2)" borderRadius="4px" />
      <Box w="80px" h="18px" bg="rgba(255, 255, 255, 0.2)" borderRadius="4px" />
      <Box w="120px" h="18px" bg="rgba(255, 255, 255, 0.2)" borderRadius="4px" />
      <Box w="60px" h="18px" bg="rgba(255, 255, 255, 0.2)" borderRadius="4px" />
    </HStack>
    
    <SkeletonLoader variant="table" count={count} {...props} />
  </Box>
)

export const ChartSkeleton = (props) => (
  <SkeletonLoader variant="chart" count={1} {...props} />
)

export const TextSkeleton = ({ lines = 1, ...props }) => (
  <SkeletonLoader variant="text" count={lines} {...props} />
)

export const ProfileSkeleton = (props) => (
  <SkeletonLoader variant="profile" count={1} {...props} />
)

export const NavSkeleton = (props) => (
  <SkeletonLoader variant="nav" count={1} {...props} />
)

export const SidebarSkeleton = (props) => (
  <SkeletonLoader variant="sidebar" count={1} {...props} />
)

// Enhanced Chakra UI skeleton with Netflix styling
export const NetflixSkeleton = ({ 
  height = "20px",
  width = "100%",
  borderRadius = "8px",
  shimmer = true,
  ...props 
}) => (
  <Skeleton
    height={height}
    width={width}
    borderRadius={borderRadius}
    startColor="rgba(255, 255, 255, 0.1)"
    endColor="rgba(255, 255, 255, 0.2)"
    isLoaded={false}
    fadeDuration={shimmer ? 2 : 0}
    {...props}
  />
)

export const NetflixSkeletonCircle = ({ 
  size = "40px",
  shimmer = true,
  ...props 
}) => (
  <SkeletonCircle
    size={size}
    startColor="rgba(255, 255, 255, 0.1)"
    endColor="rgba(255, 255, 255, 0.2)"
    isLoaded={false}
    fadeDuration={shimmer ? 2 : 0}
    {...props}
  />
)

export const NetflixSkeletonText = ({ 
  lines = 3,
  spacing = "4",
  shimmer = true,
  ...props 
}) => (
  <SkeletonText
    noOfLines={lines}
    spacing={spacing}
    startColor="rgba(255, 255, 255, 0.1)"
    endColor="rgba(255, 255, 255, 0.2)"
    isLoaded={false}
    fadeDuration={shimmer ? 2 : 0}
    {...props}
  />
)

export default SkeletonLoader