import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Code,
} from '@chakra-ui/react'

class PremiumErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    })
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="100vh"
          bg="netflix.black"
          color="netflix.white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          {/* Background Effects */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgGradient="radial(circle at 50% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)"
            zIndex={-1}
          />

          <VStack 
            spacing={8} 
            textAlign="center" 
            maxW="600px" 
            px={6}
            css={{
              '@keyframes slideInUp': {
                '0%': { transform: 'translateY(30px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 }
              },
              animation: 'slideInUp 0.6s ease-out'
            }}
          >
            {/* Error Icon */}
            <Box
              w="120px"
              h="120px"
              bg="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
              borderRadius="24px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 0 60px rgba(239, 68, 68, 0.4)"
              css={{
                '@keyframes glow': {
                  '0%, 100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)' },
                  '50%': { boxShadow: '0 0 40px rgba(239, 68, 68, 0.6)' }
                },
                animation: 'glow 3s ease-in-out infinite'
              }}
            >
              <Text fontSize="4xl" color="white">
                ⚠️
              </Text>
            </Box>

            {/* Error Title */}
            <VStack spacing={3}>
              <Text
                fontSize="3xl"
                fontWeight="800"
                color="netflix.white"
                letterSpacing="-0.02em"
              >
                Something went wrong
              </Text>
              <Text
                fontSize="lg"
                color="netflix.silver"
                fontWeight="500"
                maxW="400px"
              >
                We encountered an unexpected error in the Wireshark+ application. 
                Don't worry, your data is safe.
              </Text>
            </VStack>

            {/* Error Details */}
            <Box
              bg="rgba(239, 68, 68, 0.1)"
              borderRadius="16px"
              border="1px solid"
              borderColor="rgba(239, 68, 68, 0.3)"
              color="netflix.white"
              p={6}
              w="full"
            >
              <VStack spacing={4} align="start">
                <HStack spacing={3}>
                  <Text fontSize="lg" color="#EF4444">⚠️</Text>
                  <Text fontSize="lg" fontWeight="600" color="#EF4444">
                    Application Error
                  </Text>
                </HStack>
                
                <Text fontSize="sm" color="netflix.white">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Text>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.toggleDetails}
                  color="netflix.silver"
                  _hover={{ color: '#EF4444' }}
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>
                
                {this.state.showDetails && (
                  <Box mt={4} p={4} bg="rgba(0, 0, 0, 0.3)" borderRadius="8px" w="full">
                    <VStack align="start" spacing={3}>
                      <Text fontSize="sm" fontWeight="600" color="#EF4444">
                        Error Stack:
                      </Text>
                      <Code
                        fontSize="xs"
                        bg="transparent"
                        color="netflix.silver"
                        whiteSpace="pre-wrap"
                        wordBreak="break-all"
                        maxH="200px"
                        overflowY="auto"
                        w="full"
                        p={2}
                        border="1px solid"
                        borderColor="rgba(255, 255, 255, 0.1)"
                        borderRadius="4px"
                      >
                        {this.state.error?.stack}
                      </Code>
                      
                      {this.state.errorInfo?.componentStack && (
                        <>
                          <Text fontSize="sm" fontWeight="600" color="#EF4444">
                            Component Stack:
                          </Text>
                          <Code
                            fontSize="xs"
                            bg="transparent"
                            color="netflix.silver"
                            whiteSpace="pre-wrap"
                            wordBreak="break-all"
                            maxH="200px"
                            overflowY="auto"
                            w="full"
                            p={2}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.1)"
                            borderRadius="4px"
                          >
                            {this.state.errorInfo.componentStack}
                          </Code>
                        </>
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Action Buttons */}
            <HStack spacing={4}>
              <Button
                onClick={this.handleReset}
                variant="wireshark"
                size="lg"
                leftIcon={<Text fontSize="lg">🔄</Text>}
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="netflix"
                size="lg"
                leftIcon={<Text fontSize="lg">🔃</Text>}
              >
                Reload Page
              </Button>
            </HStack>

            {/* Help Text */}
            <VStack spacing={2} opacity={0.7}>
              <Text fontSize="sm" color="netflix.silver">
                If this problem persists, try the following:
              </Text>
              <VStack spacing={1} fontSize="xs" color="netflix.silver">
                <Text>• Refresh the page or restart your browser</Text>
                <Text>• Check your network connection</Text>
                <Text>• Ensure the backend server is running</Text>
                <Text>• Clear your browser cache and cookies</Text>
              </VStack>
            </VStack>

            {/* Footer */}
            <Text fontSize="xs" color="netflix.silver" opacity={0.6}>
              Wireshark+ Network Intelligence Platform • Error ID: {Date.now()}
            </Text>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}

export default PremiumErrorBoundary