/**
 * AI Shark Design System - Component Composition Patterns
 * Netflix-inspired layout patterns and composition utilities
 */

import React, { createContext, useContext } from 'react'
import { Box, Flex, Grid, Stack, Container } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { designTokens } from '../tokens/designTokens'
import { fadeVariants, slideUpVariants, staggerContainer } from '../animations'

// ===== COMPOSITION CONTEXT =====

const CompositionContext = createContext({
  spacing: 'normal',
  variant: 'default',
  animated: true
})

export const useComposition = () => useContext(CompositionContext)

// ===== LAYOUT COMPONENTS =====

/**
 * Netflix-style page layout with header, main content, and sidebar
 */
export const NetflixPageLayout = ({ 
  children, 
  header, 
  sidebar, 
  footer,
  sidebarWidth = '280px',
  animated = true,
  ...props 
}) => {
  const MotionBox = animated ? motion(Box) : Box

  return (
    <MotionBox
      display="grid"
      gridTemplateColumns={sidebar ? `${sidebarWidth} 1fr` : '1fr'}
      gridTemplateRows="auto 1fr auto"
      gridTemplateAreas={
        sidebar 
          ? `"header header" "sidebar main" "footer footer"`
          : `"header" "main" "footer"`
      }
      minHeight="100vh"
      backgroundColor={designTokens.colors.neutral[950]}
      color={designTokens.colors.neutral[0]}
      {...(animated && {
        variants: fadeVariants,
        initial: "initial",
        animate: "animate",
        exit: "exit"
      })}
      {...props}
    >
      {header && (
        <Box gridArea="header" borderBottom="1px solid" borderColor="whiteAlpha.100">
          {header}
        </Box>
      )}
      
      {sidebar && (
        <Box 
          gridArea="sidebar" 
          borderRight="1px solid" 
          borderColor="whiteAlpha.100"
          backgroundColor={designTokens.colors.neutral[900]}
        >
          {sidebar}
        </Box>
      )}
      
      <Box gridArea="main" overflow="auto">
        {children}
      </Box>
      
      {footer && (
        <Box gridArea="footer" borderTop="1px solid" borderColor="whiteAlpha.100">
          {footer}
        </Box>
      )}
    </MotionBox>
  )
}

/**
 * Card grid layout with Netflix-style spacing and animations
 */
export const NetflixCardGrid = ({ 
  children, 
  columns = { base: 1, md: 2, lg: 3, xl: 4 },
  spacing = 6,
  animated = true,
  ...props 
}) => {
  const MotionGrid = animated ? motion(Grid) : Grid

  return (
    <MotionGrid
      templateColumns={{
        base: `repeat(${columns.base}, 1fr)`,
        md: `repeat(${columns.md}, 1fr)`,
        lg: `repeat(${columns.lg}, 1fr)`,
        xl: `repeat(${columns.xl}, 1fr)`
      }}
      gap={spacing}
      {...(animated && {
        variants: staggerContainer,
        initial: "initial",
        animate: "animate",
        exit: "exit"
      })}
      {...props}
    >
      {children}
    </MotionGrid>
  )
}

/**
 * Hero section with Netflix-style background and content overlay
 */
export const NetflixHeroSection = ({ 
  children, 
  backgroundImage, 
  backgroundVideo,
  overlay = true,
  overlayOpacity = 0.6,
  minHeight = '60vh',
  animated = true,
  ...props 
}) => {
  const MotionBox = animated ? motion(Box) : Box

  return (
    <MotionBox
      position="relative"
      minHeight={minHeight}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      {...(animated && {
        variants: fadeVariants,
        initial: "initial",
        animate: "animate"
      })}
      {...props}
    >
      {/* Background */}
      {backgroundImage && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundImage={`url(${backgroundImage})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
        />
      )}
      
      {backgroundVideo && (
        <Box
          as="video"
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          objectFit="cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={backgroundVideo} type="video/mp4" />
        </Box>
      )}
      
      {/* Overlay */}
      {overlay && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          background={`linear-gradient(
            rgba(0, 0, 0, ${overlayOpacity}), 
            rgba(0, 0, 0, ${overlayOpacity * 0.8})
          )`}
        />
      )}
      
      {/* Content */}
      <Container maxW="container.xl" position="relative" zIndex={2}>
        {children}
      </Container>
    </MotionBox>
  )
}

/**
 * Dashboard layout with draggable widgets
 */
export const DashboardLayout = ({ 
  children, 
  columns = 12,
  spacing = 4,
  animated = true,
  ...props 
}) => {
  const MotionBox = animated ? motion(Box) : Box

  return (
    <CompositionContext.Provider value={{ spacing: 'dashboard', variant: 'dashboard', animated }}>
      <MotionBox
        display="grid"
        gridTemplateColumns={`repeat(${columns}, 1fr)`}
        gap={spacing}
        padding={spacing}
        {...(animated && {
          variants: staggerContainer,
          initial: "initial",
          animate: "animate"
        })}
        {...props}
      >
        {children}
      </MotionBox>
    </CompositionContext.Provider>
  )
}

/**
 * Sidebar navigation layout
 */
export const SidebarLayout = ({ 
  children, 
  title,
  actions,
  width = '280px',
  collapsible = true,
  defaultCollapsed = false,
  animated = true,
  ...props 
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const MotionBox = animated ? motion(Box) : Box

  return (
    <MotionBox
      width={isCollapsed ? '60px' : width}
      height="100vh"
      backgroundColor={designTokens.colors.neutral[900]}
      borderRight="1px solid"
      borderColor="whiteAlpha.100"
      display="flex"
      flexDirection="column"
      transition="width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      {...(animated && {
        variants: slideUpVariants,
        initial: "initial",
        animate: "animate"
      })}
      {...props}
    >
      {/* Header */}
      {(title || actions || collapsible) && (
        <Flex
          align="center"
          justify="space-between"
          padding={4}
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
        >
          {!isCollapsed && title && (
            <Box fontSize="lg" fontWeight="semibold">
              {title}
            </Box>
          )}
          
          <Flex align="center" gap={2}>
            {!isCollapsed && actions}
            {collapsible && (
              <Box
                as="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                padding={1}
                borderRadius="md"
                _hover={{ backgroundColor: 'whiteAlpha.100' }}
                transition="background-color 0.2s"
              >
                {isCollapsed ? '→' : '←'}
              </Box>
            )}
          </Flex>
        </Flex>
      )}
      
      {/* Content */}
      <Box flex={1} overflow="auto">
        {children}
      </Box>
    </MotionBox>
  )
}

/**
 * Content section with consistent spacing and typography
 */
export const ContentSection = ({ 
  children, 
  title, 
  subtitle,
  actions,
  spacing = 'normal',
  animated = true,
  ...props 
}) => {
  const MotionStack = animated ? motion(Stack) : Stack
  const spacingMap = {
    tight: 4,
    normal: 6,
    loose: 8
  }

  return (
    <MotionStack
      spacing={spacingMap[spacing]}
      {...(animated && {
        variants: slideUpVariants,
        initial: "initial",
        animate: "animate"
      })}
      {...props}
    >
      {(title || subtitle || actions) && (
        <Flex align="flex-start" justify="space-between" gap={4}>
          <Stack spacing={2} flex={1}>
            {title && (
              <Box 
                fontSize="2xl" 
                fontWeight="bold" 
                color={designTokens.colors.neutral[0]}
              >
                {title}
              </Box>
            )}
            {subtitle && (
              <Box 
                fontSize="md" 
                color={designTokens.colors.neutral[400]}
              >
                {subtitle}
              </Box>
            )}
          </Stack>
          {actions && <Box>{actions}</Box>}
        </Flex>
      )}
      {children}
    </MotionStack>
  )
}

/**
 * Split layout for side-by-side content
 */
export const SplitLayout = ({ 
  left, 
  right, 
  ratio = [1, 1],
  direction = { base: 'column', lg: 'row' },
  spacing = 6,
  animated = true,
  ...props 
}) => {
  const MotionFlex = animated ? motion(Flex) : Flex

  return (
    <MotionFlex
      direction={direction}
      gap={spacing}
      {...(animated && {
        variants: staggerContainer,
        initial: "initial",
        animate: "animate"
      })}
      {...props}
    >
      <Box flex={ratio[0]}>
        {left}
      </Box>
      <Box flex={ratio[1]}>
        {right}
      </Box>
    </MotionFlex>
  )
}

// ===== CARD COMPOSITIONS =====

/**
 * Netflix-style content card
 */
export const NetflixCard = ({ 
  children, 
  title, 
  subtitle,
  image,
  actions,
  hoverable = true,
  animated = true,
  ...props 
}) => {
  const MotionBox = animated ? motion(Box) : Box

  return (
    <MotionBox
      backgroundColor={designTokens.colors.neutral[800]}
      borderRadius="lg"
      overflow="hidden"
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.4)"
      transition="all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      {...(hoverable && {
        _hover: {
          transform: 'translateY(-4px) scale(1.02)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)'
        }
      })}
      {...(animated && {
        variants: slideUpVariants,
        initial: "initial",
        animate: "animate",
        whileHover: hoverable ? "hover" : undefined
      })}
      {...props}
    >
      {image && (
        <Box 
          height="200px" 
          backgroundImage={`url(${image})`}
          backgroundSize="cover"
          backgroundPosition="center"
        />
      )}
      
      <Stack spacing={3} padding={4}>
        {(title || subtitle) && (
          <Stack spacing={1}>
            {title && (
              <Box fontSize="lg" fontWeight="semibold" color="white">
                {title}
              </Box>
            )}
            {subtitle && (
              <Box fontSize="sm" color="gray.400">
                {subtitle}
              </Box>
            )}
          </Stack>
        )}
        
        {children}
        
        {actions && (
          <Flex justify="flex-end" gap={2}>
            {actions}
          </Flex>
        )}
      </Stack>
    </MotionBox>
  )
}

/**
 * Data display card for metrics and statistics
 */
export const DataCard = ({ 
  title, 
  value, 
  subtitle,
  trend,
  icon,
  color = 'accent',
  animated = true,
  ...props 
}) => {
  const MotionBox = animated ? motion(Box) : Box
  const colorMap = {
    accent: designTokens.colors.accent[500],
    success: designTokens.colors.semantic.success,
    warning: designTokens.colors.semantic.warning,
    error: designTokens.colors.semantic.error
  }

  return (
    <MotionBox
      backgroundColor={designTokens.colors.neutral[800]}
      borderRadius="lg"
      padding={6}
      borderLeft="4px solid"
      borderLeftColor={colorMap[color]}
      {...(animated && {
        variants: slideUpVariants,
        initial: "initial",
        animate: "animate"
      })}
      {...props}
    >
      <Flex align="center" justify="space-between" marginBottom={2}>
        <Box fontSize="sm" color="gray.400" fontWeight="medium">
          {title}
        </Box>
        {icon && (
          <Box color={colorMap[color]}>
            {icon}
          </Box>
        )}
      </Flex>
      
      <Box fontSize="2xl" fontWeight="bold" color="white" marginBottom={1}>
        {value}
      </Box>
      
      {subtitle && (
        <Box fontSize="sm" color="gray.500">
          {subtitle}
        </Box>
      )}
      
      {trend && (
        <Box fontSize="sm" color={trend.positive ? 'green.400' : 'red.400'} marginTop={2}>
          {trend.positive ? '↗' : '↘'} {trend.value}
        </Box>
      )}
    </MotionBox>
  )
}

// ===== UTILITY COMPONENTS =====

/**
 * Responsive container with Netflix-style max widths
 */
export const NetflixContainer = ({ children, size = 'xl', ...props }) => {
  const sizeMap = {
    sm: 'container.sm',
    md: 'container.md',
    lg: 'container.lg',
    xl: 'container.xl',
    '2xl': 'container.2xl',
    full: '100%'
  }

  return (
    <Container maxW={sizeMap[size]} {...props}>
      {children}
    </Container>
  )
}

/**
 * Animated stack with staggered children
 */
export const AnimatedStack = ({ children, spacing = 4, stagger = 0.1, ...props }) => {
  const variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1
      }
    }
  }

  return (
    <motion.div variants={variants} initial="initial" animate="animate">
      <Stack spacing={spacing} {...props}>
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            variants={slideUpVariants}
          >
            {child}
          </motion.div>
        ))}
      </Stack>
    </motion.div>
  )
}

/**
 * Glass morphism container
 */
export const GlassContainer = ({ children, blur = 12, opacity = 0.8, ...props }) => (
  <Box
    background={`rgba(0, 0, 0, ${opacity})`}
    backdropFilter={`blur(${blur}px)`}
    border="1px solid"
    borderColor="whiteAlpha.200"
    borderRadius="lg"
    {...props}
  >
    {children}
  </Box>
)

// ===== COMPOSITION PRESETS =====

export const compositionPresets = {
  // Dashboard layout preset
  dashboard: {
    layout: DashboardLayout,
    card: DataCard,
    container: NetflixContainer,
    spacing: 'normal'
  },

  // Landing page preset
  landing: {
    layout: NetflixPageLayout,
    hero: NetflixHeroSection,
    grid: NetflixCardGrid,
    card: NetflixCard,
    container: NetflixContainer
  },

  // Application layout preset
  application: {
    layout: NetflixPageLayout,
    sidebar: SidebarLayout,
    content: ContentSection,
    split: SplitLayout,
    container: NetflixContainer
  },

  // Data visualization preset
  analytics: {
    layout: SplitLayout,
    card: DataCard,
    container: NetflixContainer,
    spacing: 'loose'
  }
}

export default {
  layouts: {
    NetflixPageLayout,
    NetflixCardGrid,
    NetflixHeroSection,
    DashboardLayout,
    SidebarLayout,
    ContentSection,
    SplitLayout
  },
  cards: {
    NetflixCard,
    DataCard
  },
  utilities: {
    NetflixContainer,
    AnimatedStack,
    GlassContainer
  },
  presets: compositionPresets,
  context: {
    CompositionContext,
    useComposition
  }
}