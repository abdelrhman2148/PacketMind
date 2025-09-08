import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Progress,
} from '@chakra-ui/react'

const PremiumLoadingScreen = ({
  message = 'Initializing Wireshark+ Network Intelligence...',
  progress = 0,
  showProgress = false,
  ...props
}) => {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="netflix.black"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={9999}
      {...props}
    >
      {/* Background Effects */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="radial(circle at 20% 80%, rgba(229, 9, 20, 0.15) 0%, transparent 50%), radial(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial(circle at 40% 40%, rgba(157, 78, 221, 0.1) 0%, transparent 50%)"
        zIndex={-1}
      />

      <VStack spacing={8} textAlign="center" maxW="400px" px={6}>
        {/* Logo */}
        <Box
          w="120px"
          h="120px"
          bg="linear-gradient(135deg, #1E40AF 0%, #06B6D4 100%)"
          borderRadius="24px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 0 60px rgba(6, 182, 212, 0.4)"
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
            top: '-4px',
            left: '-4px',
            right: '-4px',
            bottom: '-4px',
            background: 'linear-gradient(45deg, #06B6D4, #9D4EDD, #FF6EC7, #06B6D4)',
            borderRadius: '28px',
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
          <Text fontSize="4xl" fontWeight="bold" color="white">
            🦈
          </Text>
        </Box>

        {/* Brand */}
        <VStack spacing={2}>
          <Text
            fontSize="3xl"
            fontWeight="800"
            color="netflix.white"
            letterSpacing="-0.02em"
            bgGradient="linear(to-r, netflix.white, wireshark.neon)"
            bgClip="text"
          >
            Wireshark+
          </Text>
          <Text
            fontSize="md"
            color="netflix.silver"
            fontWeight="500"
            textTransform="uppercase"
            letterSpacing="0.1em"
          >
            Network Intelligence Platform
          </Text>
        </VStack>

        {/* Loading Spinner */}
        <Box position="relative">
          <Spinner
            size="xl"
            color="wireshark.neon"
            thickness="4px"
            speed="0.8s"
            emptyColor="rgba(255, 255, 255, 0.1)"
          />
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w="32px"
            h="32px"
            bg="wireshark.neon"
            borderRadius="full"
            css={{
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 }
              },
              animation: 'pulse 2s infinite'
            }}
            opacity={0.6}
          />
        </Box>

        {/* Loading Message */}
        <VStack spacing={3}>
          <Text
            fontSize="lg"
            color="netflix.white"
            fontWeight="600"
            css={{
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-10px)' }
              },
              animation: 'float 4s ease-in-out infinite'
            }}
          >
            {message}
          </Text>
          
          {/* Progress Bar */}
          {showProgress && (
            <Box w="300px">
              <Progress
                value={progress}
                size="sm"
                bg="rgba(255, 255, 255, 0.1)"
                borderRadius="full"
                sx={{
                  '& > div': {
                    background: 'linear-gradient(90deg, #06B6D4, #9D4EDD)',
                    borderRadius: 'full',
                  }
                }}
              />
              <Text fontSize="sm" color="netflix.silver" mt={2}>
                {Math.round(progress)}% Complete
              </Text>
            </Box>
          )}
        </VStack>

        {/* Loading Steps */}
        <VStack spacing={2} opacity={0.7}>
          <HStack spacing={3}>
            <Box w="6px" h="6px" bg="wireshark.success" borderRadius="full" />
            <Text fontSize="sm" color="netflix.silver">
              Initializing network interfaces
            </Text>
          </HStack>
          <HStack spacing={3}>
            <Box 
              w="6px" 
              h="6px" 
              bg="wireshark.neon" 
              borderRadius="full"
              css={{
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 }
                },
                animation: 'pulse 1s infinite'
              }}
            />
            <Text fontSize="sm" color="netflix.silver">
              Establishing WebSocket connection
            </Text>
          </HStack>
          <HStack spacing={3}>
            <Box w="6px" h="6px" bg="rgba(255, 255, 255, 0.3)" borderRadius="full" />
            <Text fontSize="sm" color="netflix.silver">
              Loading AI analysis engine
            </Text>
          </HStack>
        </VStack>

        {/* Footer */}
        <Text fontSize="xs" color="netflix.silver" opacity={0.6}>
          Powered by advanced packet analysis technology
        </Text>
      </VStack>
    </Box>
  )
}

export default PremiumLoadingScreen