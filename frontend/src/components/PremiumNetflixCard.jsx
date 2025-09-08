import React from 'react'
import {
  Box,
  Flex,
  HStack,
  VStack,
  Heading,
  Text,
  Badge,
} from '@chakra-ui/react'

const PremiumNetflixCard = ({
  title,
  subtitle,
  icon,
  variant = 'netflix',
  children,
  headerAction,
  isHoverable = true,
  glowEffect = false,
  animationDelay = 0,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'netflix':
        return {
          bg: 'rgba(20, 20, 20, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: 'netflix',
          hoverTransform: 'translateY(-6px) scale(1.02)',
          hoverShadow: 'netflixHover',
          hoverBorderColor: 'rgba(229, 9, 20, 0.3)',
        }
      case 'elevated':
        return {
          bg: 'rgba(31, 31, 31, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: 'premium',
          hoverTransform: 'translateY(-8px) scale(1.03)',
          hoverShadow: 'cinematic',
          hoverBorderColor: 'rgba(6, 182, 212, 0.4)',
        }
      case 'glass':
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: 'glass',
          hoverTransform: 'translateY(-4px)',
          hoverShadow: 'glassHover',
          hoverBorderColor: 'rgba(255, 255, 255, 0.2)',
        }
      case 'hologram':
        return {
          bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(157, 78, 221, 0.1) 50%, rgba(255, 110, 199, 0.1) 100%)',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          boxShadow: 'hologram',
          hoverTransform: 'translateY(-5px)',
          hoverShadow: 'wiresharkGlow',
          hoverBorderColor: 'rgba(6, 182, 212, 0.6)',
        }
      default:
        return {
          bg: 'rgba(20, 20, 20, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: 'netflix',
          hoverTransform: 'translateY(-4px)',
          hoverShadow: 'netflixHover',
          hoverBorderColor: 'rgba(255, 255, 255, 0.2)',
        }
    }
  }

  const variantStyles = getVariantStyles()

  return (
    <Box
      bg={variantStyles.bg}
      borderRadius="20px"
      border="1px solid"
      borderColor={variantStyles.borderColor}
      boxShadow={variantStyles.boxShadow}
      backdropFilter="blur(25px)"
      overflow="hidden"
      position="relative"
      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      css={{
        '@keyframes slideInUp': {
          '0%': { transform: 'translateY(30px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        animation: `slideInUp 0.6s ease-out ${animationDelay}s both`
      }}
      _hover={isHoverable ? {
        transform: variantStyles.hoverTransform,
        boxShadow: variantStyles.hoverShadow,
        borderColor: variantStyles.hoverBorderColor,
      } : {}}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
      }}
      {...(glowEffect && {
        css: {
          '@keyframes glow': {
            '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
            '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' }
          },
          animation: 'glow 3s ease-in-out infinite'
        },
      })}
      {...props}
    >
      {/* Shimmer Effect */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        background="linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)"
        backgroundSize="200% 100%"
        css={{
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' }
          },
          animation: 'shimmer 3s linear infinite'
        }}
        pointerEvents="none"
        opacity={0.5}
      />

      {/* Header */}
      {(title || subtitle || icon || headerAction) && (
        <Box
          p={6}
          borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          bg="rgba(255, 255, 255, 0.02)"
          position="relative"
          zIndex={1}
        >
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              {/* Icon */}
              {icon && (
                <Box
                  w="48px"
                  h="48px"
                  bg="linear-gradient(135deg, #1E40AF 0%, #06B6D4 100%)"
                  borderRadius="12px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="wiresharkGlow"
                  css={{
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-6px)' }
                    },
                    animation: 'float 4s ease-in-out infinite'
                  }}
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '-1px',
                    left: '-1px',
                    right: '-1px',
                    bottom: '-1px',
                    background: 'linear-gradient(45deg, #06B6D4, #9D4EDD, #FF6EC7, #06B6D4)',
                    borderRadius: '13px',
                    zIndex: -1,
                    css: {
                      '@keyframes shimmer': {
                        '0%': { backgroundPosition: '-200% 0' },
                        '100%': { backgroundPosition: '200% 0' }
                      },
                      animation: 'shimmer 2s linear infinite'
                    },
                    backgroundSize: '400% 400%',
                  }}
                >
                  <Text fontSize="xl" color="white">
                    {icon}
                  </Text>
                </Box>
              )}
              
              {/* Title & Subtitle */}
              <VStack align="start" spacing={1}>
                {title && (
                  <Heading 
                    size="lg" 
                    color="netflix.white" 
                    fontWeight="700"
                    letterSpacing="-0.02em"
                    bgGradient="linear(to-r, netflix.white, wireshark.neon)"
                    bgClip="text"
                  >
                    {title}
                  </Heading>
                )}
                {subtitle && (
                  <Text 
                    fontSize="sm" 
                    color="netflix.silver" 
                    fontWeight="500"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    {subtitle}
                  </Text>
                )}
              </VStack>
            </HStack>
            
            {/* Header Action */}
            {headerAction && (
              <Box>
                {headerAction}
              </Box>
            )}
          </Flex>
        </Box>
      )}

      {/* Content */}
      {children && (
        <Box p={6} position="relative" zIndex={1}>
          {children}
        </Box>
      )}
    </Box>
  )
}

// Specialized card variants
export const AlertCard = ({ alert, onClick, isActive, ...props }) => (
  <PremiumNetflixCard
    variant="hologram"
    isHoverable={true}
    cursor="pointer"
    onClick={onClick}
    border={isActive ? '2px solid' : '1px solid'}
    borderColor={isActive ? 'wireshark.neon' : 'rgba(255, 255, 255, 0.1)'}
    boxShadow={isActive ? 'neonIntense' : 'hologram'}
    {...props}
  >
    <HStack spacing={4} align="center">
      <Box
        w="12px"
        h="12px"
        bg={alert.severity === 'critical' ? 'wireshark.error' : 'wireshark.warning'}
        borderRadius="full"
        boxShadow={`0 0 10px ${alert.severity === 'critical' ? '#EF4444' : '#F59E0B'}`}
        css={{
          '@keyframes glow': {
            '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
            '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' }
          },
          animation: 'glow 2s ease-in-out infinite'
        }}
      />
      <VStack align="start" spacing={1} flex={1}>
        <HStack justify="space-between" w="full">
          <Text fontSize="sm" fontWeight="bold" color="netflix.white">
            {alert.message}
          </Text>
          <Badge
            bg={alert.severity === 'critical' ? 'wireshark.error' : 'wireshark.warning'}
            color="white"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
            textTransform="uppercase"
          >
            {alert.severity}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="netflix.silver">
          {new Date(alert.timestamp * 1000).toLocaleTimeString()}
        </Text>
      </VStack>
    </HStack>
  </PremiumNetflixCard>
)

export const StatsCard = ({ label, value, icon, trend, color = 'wireshark.neon', ...props }) => (
  <PremiumNetflixCard variant="glass" isHoverable={false} {...props}>
    <VStack spacing={3} align="center" textAlign="center">
      <Box
        w="40px"
        h="40px"
        bg={`linear-gradient(135deg, ${color} 0%, rgba(255, 255, 255, 0.1) 100%)`}
        borderRadius="10px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow={`0 0 20px ${color}`}
      >
        <Text fontSize="lg" color="white">
          {icon}
        </Text>
      </Box>
      <VStack spacing={1}>
        <Text fontSize="2xl" fontWeight="bold" color="netflix.white">
          {value}
        </Text>
        <Text fontSize="xs" color="netflix.silver" textTransform="uppercase" letterSpacing="0.1em">
          {label}
        </Text>
        {trend && (
          <Text fontSize="xs" color={trend > 0 ? 'wireshark.success' : 'wireshark.error'}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </Text>
        )}
      </VStack>
    </VStack>
  </PremiumNetflixCard>
)

export default PremiumNetflixCard