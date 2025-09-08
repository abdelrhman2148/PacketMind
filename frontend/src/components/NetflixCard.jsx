import React from 'react'
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  Button,
  Flex,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'

// Motion components
const MotionCard = motion(Card)
const MotionBox = motion(Box)

const NetflixCard = ({
  title,
  subtitle,
  children,
  variant = 'netflix',
  headerAction,
  badge,
  isHoverable = true,
  gradient,
  icon,
  ...props
}) => {
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: isHoverable ? {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    } : {},
  }

  const glowVariants = {
    initial: { opacity: 0 },
    hover: {
      opacity: 1,
      transition: { duration: 0.3 }
    }
  }

  return (
    <MotionCard
      variant={variant}
      position="relative"
      overflow="hidden"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      {...props}
    >
      {/* Glow effect on hover */}
      {isHoverable && (
        <MotionBox
          position="absolute"
          top={-2}
          left={-2}
          right={-2}
          bottom={-2}
          borderRadius="14px"
          bgGradient="linear(135deg, wireshark.accent, netflix.red, wireshark.secondary)"
          opacity={0}
          variants={glowVariants}
          zIndex={-1}
          filter="blur(8px)"
        />
      )}

      {/* Background gradient overlay */}
      {gradient && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient={gradient}
          opacity={0.1}
          zIndex={0}
        />
      )}

      {/* Header */}
      {(title || headerAction) && (
        <CardHeader pb={2} position="relative" zIndex={1}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              {icon && (
                <MotionBox
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  fontSize="2xl"
                >
                  {icon}
                </MotionBox>
              )}
              <VStack align="start" spacing={0}>
                <HStack spacing={2} align="center">
                  <Heading 
                    size="md" 
                    color="netflix.white"
                    fontWeight="bold"
                    letterSpacing="-0.01em"
                  >
                    {title}
                  </Heading>
                  {badge && (
                    <Badge
                      colorScheme="blue"
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                      py={1}
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {badge}
                    </Badge>
                  )}
                </HStack>
                {subtitle && (
                  <Text 
                    fontSize="sm" 
                    color="netflix.lightGray"
                    opacity={0.8}
                  >
                    {subtitle}
                  </Text>
                )}
              </VStack>
            </HStack>
            {headerAction && (
              <Box>{headerAction}</Box>
            )}
          </Flex>
        </CardHeader>
      )}

      {/* Body */}
      <CardBody pt={title ? 0 : 4} position="relative" zIndex={1}>
        {children}
      </CardBody>

      {/* Subtle border animation */}
      {isHoverable && (
        <MotionBox
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          border="1px solid"
          borderColor="transparent"
          borderRadius="12px"
          variants={{
            hover: {
              borderColor: "rgba(6, 182, 212, 0.3)",
              transition: { duration: 0.3 }
            }
          }}
          pointerEvents="none"
        />
      )}
    </MotionCard>
  )
}

// Specialized card variants
export const AlertCard = ({ alert, onClick, isActive, ...props }) => (
  <NetflixCard
    variant="netflix"
    isHoverable={true}
    cursor="pointer"
    onClick={onClick}
    border={isActive ? "2px solid" : "1px solid"}
    borderColor={isActive ? "wireshark.accent" : "netflix.mediumGray"}
    bg={alert.level === 'critical' 
      ? "rgba(239, 68, 68, 0.1)" 
      : "rgba(245, 158, 11, 0.1)"
    }
    _hover={{
      transform: "translateX(4px)",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.5)",
    }}
    {...props}
  >
    <HStack justify="space-between" align="start">
      <VStack align="start" spacing={1} flex={1}>
        <HStack spacing={2}>
          <Text fontSize="lg">
            {alert.level === 'critical' ? '🚨' : '⚠️'}
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="netflix.white">
            {alert.message}
          </Text>
        </HStack>
        <Text fontSize="xs" color="netflix.lightGray">
          {new Date(alert.timestamp * 1000).toLocaleString()}
        </Text>
      </VStack>
      {alert.meta && (
        <VStack align="end" spacing={0}>
          <Text fontSize="xs" color="netflix.lightGray">
            Z-score: {alert.meta.z_score?.toFixed(2)}
          </Text>
          <Text fontSize="xs" color="netflix.lightGray">
            Count: {alert.meta.packet_count}
          </Text>
        </VStack>
      )}
    </HStack>
  </NetflixCard>
)

export const StatsCard = ({ title, value, subtitle, icon, color = "wireshark.accent", ...props }) => (
  <NetflixCard
    variant="glass"
    isHoverable={true}
    textAlign="center"
    {...props}
  >
    <VStack spacing={3}>
      {icon && (
        <MotionBox
          fontSize="3xl"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
        </MotionBox>
      )}
      <VStack spacing={1}>
        <Text fontSize="3xl" fontWeight="bold" color={color}>
          {value}
        </Text>
        <Text fontSize="md" fontWeight="semibold" color="netflix.white">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="sm" color="netflix.lightGray" opacity={0.8}>
            {subtitle}
          </Text>
        )}
      </VStack>
    </VStack>
  </NetflixCard>
)

export default NetflixCard