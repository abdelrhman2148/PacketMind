import { Box, Text, Badge, Image, VStack, HStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'

const MotionBox = motion(Box)

const ProtocolCard = ({ 
  protocol, 
  count, 
  percentage, 
  color, 
  icon,
  isActive = false,
  onClick,
  trend = 'stable'
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Generate thumbnail preview based on protocol
  const getThumbnailPreview = () => {
    const thumbnailData = {
      'HTTP': {
        gradient: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
        pattern: 'Web Traffic'
      },
      'HTTPS': {
        gradient: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
        pattern: 'Secure Web'
      },
      'TCP': {
        gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
        pattern: 'Transport'
      },
      'UDP': {
        gradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
        pattern: 'Datagram'
      },
      'DNS': {
        gradient: 'linear-gradient(135deg, #00BCD4 0%, #4DD0E1 100%)',
        pattern: 'Name Resolution'
      },
      'ICMP': {
        gradient: 'linear-gradient(135deg, #F44336 0%, #EF5350 100%)',
        pattern: 'Network Control'
      }
    }

    return thumbnailData[protocol] || {
      gradient: 'linear-gradient(135deg, #607D8B 0%, #90A4AE 100%)',
      pattern: 'Other Traffic'
    }
  }

  const thumbnail = getThumbnailPreview()

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'wireshark.success'
      case 'down':
        return 'wireshark.error'
      default:
        return 'netflix.silver'
    }
  }

  return (
    <MotionBox
      as="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      w="280px"
      h="380px"
      bg="rgba(31, 31, 31, 0.95)"
      borderRadius="16px"
      border="2px solid"
      borderColor={isActive ? color : 'rgba(255, 255, 255, 0.1)'}
      cursor="pointer"
      overflow="hidden"
      position="relative"
      backdropFilter="blur(20px)"
      boxShadow={isActive 
        ? `0 0 30px ${color}40` 
        : '0 8px 32px rgba(0, 0, 0, 0.6)'
      }
      initial={{ scale: 1, y: 0 }}
      animate={{
        scale: isHovered ? 1.05 : 1,
        y: isHovered ? -8 : 0,
        boxShadow: isHovered
          ? `0 0 40px ${color}60, 0 16px 48px rgba(0, 0, 0, 0.8)`
          : isActive
          ? `0 0 30px ${color}40`
          : '0 8px 32px rgba(0, 0, 0, 0.6)'
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
      _focus={{
        outline: 'none',
        boxShadow: `0 0 0 3px ${color}80`
      }}
    >
      {/* Thumbnail Preview */}
      <Box
        h="200px"
        bg={thumbnail.gradient}
        position="relative"
        overflow="hidden"
      >
        {/* Animated background pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity={0.3}
          background={`
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
          `}
          animation={isHovered ? 'shimmer 2s ease-in-out infinite' : 'none'}
        />
        
        {/* Protocol icon/symbol */}
        <VStack
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          spacing={2}
        >
          <Text
            fontSize="4xl"
            fontWeight="bold"
            color="white"
            textShadow="0 2px 8px rgba(0,0,0,0.5)"
            opacity={0.9}
          >
            {icon || protocol.charAt(0)}
          </Text>
          <Text
            fontSize="sm"
            color="white"
            fontWeight="medium"
            textShadow="0 1px 4px rgba(0,0,0,0.5)"
            opacity={0.8}
          >
            {thumbnail.pattern}
          </Text>
        </VStack>

        {/* Glow effect on hover */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={`radial-gradient(circle at center, ${color}20 0%, transparent 70%)`}
          opacity={isHovered ? 1 : 0}
          transition="opacity 0.3s ease"
        />
      </Box>

      {/* Card content */}
      <VStack
        p={6}
        align="stretch"
        justify="space-between"
        h="180px"
        spacing={4}
      >
        {/* Protocol name and trend */}
        <HStack justify="space-between" align="center">
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="netflix.white"
            letterSpacing="-0.025em"
          >
            {protocol}
          </Text>
          <HStack spacing={1}>
            <Text
              fontSize="sm"
              color={getTrendColor()}
              fontWeight="medium"
            >
              {getTrendIcon()}
            </Text>
            <Badge
              bg={`${color}20`}
              color={color}
              border="1px solid"
              borderColor={`${color}40`}
              borderRadius="6px"
              px={2}
              py={1}
              fontSize="xs"
              fontWeight="semibold"
            >
              {trend.toUpperCase()}
            </Badge>
          </HStack>
        </HStack>

        {/* Packet count */}
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Text
              fontSize="sm"
              color="netflix.silver"
              fontWeight="medium"
            >
              Packets
            </Text>
            <Text
              fontSize="sm"
              color="netflix.silver"
              fontWeight="medium"
            >
              {percentage}%
            </Text>
          </HStack>
          
          <Text
            fontSize="3xl"
            fontWeight="bold"
            color={color}
            lineHeight="1"
            textShadow={`0 0 20px ${color}40`}
          >
            {count.toLocaleString()}
          </Text>
        </VStack>

        {/* Progress bar */}
        <Box
          w="100%"
          h="4px"
          bg="rgba(255, 255, 255, 0.1)"
          borderRadius="2px"
          overflow="hidden"
        >
          <MotionBox
            h="100%"
            bg={color}
            borderRadius="2px"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            boxShadow={`0 0 10px ${color}60`}
          />
        </Box>
      </VStack>

      {/* Hover overlay */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="rgba(255, 255, 255, 0.05)"
        opacity={isHovered ? 1 : 0}
        transition="opacity 0.3s ease"
        pointerEvents="none"
      />

      {/* Active border glow */}
      {isActive && (
        <Box
          position="absolute"
          top="-2px"
          left="-2px"
          right="-2px"
          bottom="-2px"
          borderRadius="18px"
          bg={`linear-gradient(45deg, ${color}, transparent, ${color})`}
          opacity={0.6}
          zIndex={-1}
          animation="glow 2s ease-in-out infinite"
        />
      )}
    </MotionBox>
  )
}

export default ProtocolCard