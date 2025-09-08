import React from 'react'
import {
  Box,
  Flex,
  HStack,
  VStack,
  Heading,
  Text,
  Badge,
  Button,
  Container,
  useColorMode,
} from '@chakra-ui/react'
import ThemeToggle from './ThemeToggle'
import HelpButton from './HelpButton'

const PremiumNetflixHeader = ({
  packets = [],
  packetRate = 0,
  trafficHistory = [],
  connectionStatus = 'disconnected',
  onStartTour,
  onResetTour,
  isCapturing = false,
}) => {
  const { colorMode } = useColorMode()

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'wireshark.success'
      case 'reconnecting': return 'wireshark.warning'
      case 'error': return 'wireshark.error'
      default: return 'netflix.lightGray'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'LIVE'
      case 'reconnecting': return 'RECONNECTING'
      case 'error': return 'ERROR'
      default: return 'OFFLINE'
    }
  }

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1000}
      bg="rgba(10, 10, 10, 0.95)"
      backdropFilter="blur(20px)"
      borderBottom="1px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
      boxShadow="netflix"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
        pointerEvents: 'none',
      }}
    >
      <Container maxW="full" py={4} px={6} position="relative" zIndex={1}>
        <Flex justify="space-between" align="center">
          {/* Left Section - Brand */}
          <HStack spacing={6}>
            {/* Logo */}
            <HStack spacing={4}>
              <Box
                w="56px"
                h="56px"
                bg="linear-gradient(135deg, #1E40AF 0%, #06B6D4 100%)"
                borderRadius="16px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="wiresharkGlow"
                css={{
          '@keyframes glow': {
            '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
            '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' }
          },
          animation: 'glow 3s ease-in-out infinite'
        }}
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  background: 'linear-gradient(45deg, #06B6D4, #9D4EDD, #FF6EC7, #06B6D4)',
                  borderRadius: '18px',
                  zIndex: -1,
                  css: {
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '-200% 0' },
              '100%': { backgroundPosition: '200% 0' }
            },
            animation: 'shimmer 3s linear infinite'
          },
                  backgroundSize: '400% 400%',
                }}
              >
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  🦈
                </Text>
              </Box>
              
              <VStack align="start" spacing={1}>
                <Heading 
                  size="xl" 
                  color="netflix.white"
                  fontWeight="800"
                  letterSpacing="-0.02em"
                  bgGradient="linear(to-r, netflix.white, wireshark.neon)"
                  bgClip="text"
                >
                  Wireshark+
                </Heading>
                <Text 
                  fontSize="sm" 
                  color="netflix.silver" 
                  fontWeight="500"
                  textTransform="uppercase"
                  letterSpacing="0.1em"
                >
                  Network Intelligence Platform
                </Text>
              </VStack>
            </HStack>

            {/* Status Indicators */}
            <HStack spacing={4} ml={8}>
              {/* Connection Status */}
              <Box
                px={4}
                py={2}
                bg="rgba(255, 255, 255, 0.05)"
                borderRadius="full"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(10px)"
              >
                <HStack spacing={3}>
                  <Box
                    w="8px"
                    h="8px"
                    bg={getConnectionStatusColor()}
                    borderRadius="full"
                    css={connectionStatus === 'connected' ? {
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 }
                    },
                    animation: 'pulse 2s infinite'
                  } : {}}
                    boxShadow={connectionStatus === 'connected' ? `0 0 10px ${getConnectionStatusColor()}` : 'none'}
                  />
                  <Text 
                    fontSize="xs" 
                    fontWeight="bold" 
                    color="netflix.white"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    {getConnectionStatusText()}
                  </Text>
                </HStack>
              </Box>

              {/* Packet Count */}
              {packets.length > 0 && (
                <Badge
                  bg="linear-gradient(135deg, #06B6D4 0%, #9D4EDD 100%)"
                  color="white"
                  fontSize="xs"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  boxShadow="wiresharkGlow"
                  css={{
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-8px)' }
                    },
                    animation: 'float 4s ease-in-out infinite'
                  }}
                >
                  {packets.length.toLocaleString()} packets
                </Badge>
              )}

              {/* Packet Rate */}
              {packetRate > 0 && (
                <Badge
                  bg="linear-gradient(135deg, #10B981 0%, #06B6D4 100%)"
                  color="white"
                  fontSize="xs"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  boxShadow="0 0 20px rgba(16, 185, 129, 0.4)"
                >
                  {packetRate}/s
                </Badge>
              )}

              {/* Capture Status */}
              {isCapturing && (
                <Badge
                  bg="linear-gradient(135deg, #E50914 0%, #DC143C 100%)"
                  color="white"
                  fontSize="xs"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  boxShadow="netflixGlow"
                  css={{
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 }
                    },
                    animation: 'pulse 1.5s infinite'
                  }}
                  position="relative"
                  _before={{
                    content: '"🔴"',
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '8px',
                  }}
                  pl={6}
                >
                  RECORDING
                </Badge>
              )}
            </HStack>
          </HStack>

          {/* Right Section - Controls */}
          <HStack spacing={4}>
            {/* Tour Controls */}
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="ghost"
                onClick={onStartTour}
                color="netflix.silver"
                _hover={{
                  color: 'wireshark.neon',
                  bg: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-1px)',
                }}
                leftIcon={<Text fontSize="sm">🎯</Text>}
              >
                Tour
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onResetTour}
                color="netflix.silver"
                _hover={{
                  color: 'wireshark.neon',
                  bg: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-1px)',
                }}
                leftIcon={<Text fontSize="sm">🔄</Text>}
              >
                Reset
              </Button>
            </HStack>

            {/* Theme & Help */}
            <HStack spacing={3}>
              <ThemeToggle />
              <HelpButton />
            </HStack>
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}

export default PremiumNetflixHeader