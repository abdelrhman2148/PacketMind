import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Progress,
  keyframes,
  useBreakpointValue
} from '@chakra-ui/react'
import {
  MdPlayArrow,
  MdStop,
  MdSettings,
  MdVisibility
} from 'react-icons/md'

// Animated background keyframes
const pulseGradient = keyframes`
  0%, 100% { 
    background-position: 0% 50%; 
    opacity: 0.8;
  }
  50% { 
    background-position: 100% 50%; 
    opacity: 1;
  }
`

const floatingElements = keyframes`
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
    opacity: 0.1;
  }
  33% { 
    transform: translateY(-20px) rotate(120deg); 
    opacity: 0.3;
  }
  66% { 
    transform: translateY(10px) rotate(240deg); 
    opacity: 0.2;
  }
`

const dataFlow = keyframes`
  0% { 
    transform: translateX(-100%) scale(0); 
    opacity: 0;
  }
  50% { 
    transform: translateX(0%) scale(1); 
    opacity: 1;
  }
  100% { 
    transform: translateX(100%) scale(0); 
    opacity: 0;
  }
`

// Animated Counter Component
const LiveStatsCounter = ({ 
  value, 
  label, 
  suffix = '', 
  color = 'wireshark.accent',
  size = 'lg',
  animate = true 
}) => {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value)
      return
    }

    if (value !== prevValueRef.current) {
      setIsAnimating(true)
      
      const startValue = prevValueRef.current
      const endValue = value
      const duration = 800 // ms
      const startTime = Date.now()

      const animateValue = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart)
        
        setDisplayValue(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(animateValue)
        } else {
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animateValue)
      prevValueRef.current = value
    }
  }, [value, animate])

  const fontSize = {
    sm: '1.5rem',
    md: '2rem',
    lg: '2.5rem',
    xl: '3rem'
  }

  return (
    <VStack spacing={1} align="center">
      <Text
        fontSize={fontSize[size]}
        fontWeight="bold"
        color={color}
        lineHeight={1}
        fontFamily="heading"
        textShadow="0 0 20px rgba(6, 182, 212, 0.5)"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        transform={isAnimating ? 'scale(1.1)' : 'scale(1)'}
      >
        {displayValue.toLocaleString()}{suffix}
      </Text>
      <Text
        fontSize="sm"
        color="netflix.silver"
        fontWeight="medium"
        textAlign="center"
        opacity={0.8}
      >
        {label}
      </Text>
    </VStack>
  )
}

// Traffic Rate Visualization
const TrafficRateVisualizer = ({ rate, maxRate = 1000 }) => {
  const percentage = Math.min((rate / maxRate) * 100, 100)
  const intensity = Math.min(rate / 100, 1)
  
  return (
    <Box position="relative" w="full" h="8px" bg="rgba(255, 255, 255, 0.1)" borderRadius="full">
      <Box
        position="absolute"
        top={0}
        left={0}
        h="full"
        borderRadius="full"
        bg={`linear-gradient(90deg, 
          ${intensity > 0.7 ? '#E50914' : intensity > 0.4 ? '#F59E0B' : '#06B6D4'} 0%, 
          ${intensity > 0.7 ? '#DC143C' : intensity > 0.4 ? '#D97706' : '#0891B2'} 100%
        )`}
        w={`${percentage}%`}
        boxShadow={`0 0 ${10 + intensity * 20}px ${
          intensity > 0.7 ? 'rgba(229, 9, 20, 0.6)' : 
          intensity > 0.4 ? 'rgba(245, 158, 11, 0.6)' : 
          'rgba(6, 182, 212, 0.6)'
        }`}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      />
      
      {/* Animated data flow effect */}
      {rate > 0 && (
        <Box
          position="absolute"
          top="50%"
          left="0"
          w="20px"
          h="2px"
          bg="rgba(255, 255, 255, 0.8)"
          borderRadius="full"
          transform="translateY(-50%)"
          animation={`${dataFlow} 2s ease-in-out infinite`}
        />
      )}
    </Box>
  )
}

// Main Hero Section Component
const NetflixHeroSection = ({
  connectionStatus = 'disconnected',
  packetCount = 0,
  packetRate = 0,
  currentInterface = 'eth0',
  isCapturing = false,
  onStartCapture = () => {},
  onStopCapture = () => {},
  onOpenSettings = () => {},
  onOpenAnalytics = () => {},
  trafficHistory = [],
  alerts = []
}) => {
  const [timeConnected, setTimeConnected] = useState(0)
  const isMobile = useBreakpointValue({ base: true, md: false })
  const heroHeight = useBreakpointValue({ base: '400px', md: '500px', lg: '600px' })

  // Update connected time
  useEffect(() => {
    let interval
    if (connectionStatus === 'connected') {
      interval = setInterval(() => {
        setTimeConnected(prev => prev + 1)
      }, 1000)
    } else {
      setTimeConnected(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [connectionStatus])

  // Calculate stats
  const avgRate = trafficHistory.length > 0 
    ? Math.round(trafficHistory.reduce((sum, item) => sum + item.rate, 0) / trafficHistory.length)
    : 0

  const peakRate = trafficHistory.length > 0 
    ? Math.max(...trafficHistory.map(item => item.rate))
    : 0

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) return `${hrs}h ${mins}m`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10B981'
      case 'error': return '#E50914'
      case 'reconnecting': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live Monitoring'
      case 'error': return 'Connection Error'
      case 'reconnecting': return 'Reconnecting...'
      default: return 'Disconnected'
    }
  }

  return (
    <Box
      position="relative"
      h={heroHeight}
      overflow="hidden"
      bg="netflix.black"
      borderRadius={{ base: '0', md: '24px' }}
      mb={8}
      mx={{ base: '-4', md: '0' }}
    >
      {/* Animated Background */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        background={`
          linear-gradient(135deg, 
            rgba(229, 9, 20, 0.1) 0%, 
            rgba(6, 182, 212, 0.1) 25%,
            rgba(157, 78, 221, 0.1) 50%,
            rgba(229, 9, 20, 0.1) 75%,
            rgba(6, 182, 212, 0.1) 100%
          )
        `}
        backgroundSize="400% 400%"
        animation={`${pulseGradient} 8s ease-in-out infinite`}
      />

      {/* Floating Background Elements */}
      <Box position="absolute" top="10%" left="5%" w="100px" h="100px" opacity={0.1}>
        <Box
          w="full"
          h="full"
          bg="wireshark.accent"
          borderRadius="full"
          animation={`${floatingElements} 12s ease-in-out infinite`}
        />
      </Box>
      <Box position="absolute" top="60%" right="10%" w="60px" h="60px" opacity={0.1}>
        <Box
          w="full"
          h="full"
          bg="netflix.red"
          borderRadius="full"
          animation={`${floatingElements} 8s ease-in-out infinite reverse`}
        />
      </Box>
      <Box position="absolute" bottom="20%" left="20%" w="80px" h="80px" opacity={0.1}>
        <Box
          w="full"
          h="full"
          bg="wireshark.quantum"
          borderRadius="full"
          animation={`${floatingElements} 15s ease-in-out infinite`}
        />
      </Box>

      {/* Content Overlay */}
      <Box
        position="relative"
        h="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={{ base: 6, md: 12 }}
        zIndex={1}
      >
        <VStack spacing={8} w="full" maxW="1200px" align="center">
          {/* Status and Title */}
          <VStack spacing={4} textAlign="center">
            <HStack spacing={3}>
              <Box
                w={3}
                h={3}
                borderRadius="full"
                bg={getStatusColor()}
                boxShadow={`0 0 20px ${getStatusColor()}`}
                animation={connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none'}
              />
              <Badge
                px={3}
                py={1}
                bg="rgba(255, 255, 255, 0.1)"
                color={getStatusColor()}
                borderRadius="full"
                fontSize="sm"
                fontWeight="bold"
                backdropFilter="blur(10px)"
              >
                {getStatusText()}
              </Badge>
            </HStack>
            
            <Text
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
              fontWeight="bold"
              color="netflix.white"
              textAlign="center"
              lineHeight={1.1}
              fontFamily="heading"
              textShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
            >
              AI-Powered Network
              <Text
                as="span"
                background="linear-gradient(135deg, #E50914 0%, #06B6D4 100%)"
                bgClip="text"
                color="transparent"
                ml={3}
              >
                Intelligence
              </Text>
            </Text>
            
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="netflix.silver"
              textAlign="center"
              maxW="600px"
              opacity={0.9}
            >
              Real-time packet analysis with AI-powered insights and anomaly detection
            </Text>
          </VStack>

          {/* Live Statistics Grid */}
          <Box
            w="full"
            bg="rgba(31, 31, 31, 0.8)"
            backdropFilter="blur(20px)"
            borderRadius="20px"
            border="1px solid rgba(255, 255, 255, 0.1)"
            p={6}
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
          >
            <VStack spacing={6}>
              {/* Traffic Rate Visualizer */}
              <VStack spacing={3} w="full">
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm" color="netflix.silver">Traffic Rate</Text>
                  <Text fontSize="sm" color="wireshark.accent" fontWeight="bold">
                    {packetRate} pps
                  </Text>
                </HStack>
                <TrafficRateVisualizer rate={packetRate} maxRate={1000} />
              </VStack>

              {/* Stats Grid */}
              <Box
                display="grid"
                gridTemplateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
                gap={6}
                w="full"
              >
                <LiveStatsCounter
                  value={packetCount}
                  label="Total Packets"
                  color="wireshark.accent"
                  size={isMobile ? 'md' : 'lg'}
                />
                
                <LiveStatsCounter
                  value={packetRate}
                  label="Packets/Sec"
                  suffix=" pps"
                  color="netflix.red"
                  size={isMobile ? 'md' : 'lg'}
                />
                
                <LiveStatsCounter
                  value={avgRate}
                  label="Avg Rate"
                  suffix=" pps"
                  color="wireshark.quantum"
                  size={isMobile ? 'md' : 'lg'}
                />
                
                <LiveStatsCounter
                  value={peakRate}
                  label="Peak Rate"
                  suffix=" pps"
                  color="wireshark.plasma"
                  size={isMobile ? 'md' : 'lg'}
                />
              </Box>

              {/* Interface and Uptime Info */}
              <HStack 
                justify="space-between" 
                w="full" 
                pt={4} 
                borderTop="1px solid rgba(255, 255, 255, 0.1)"
                flexWrap="wrap"
                gap={4}
              >
                <VStack spacing={1} align="start">
                  <Text fontSize="xs" color="netflix.silver">Interface</Text>
                  <Badge
                    colorScheme="blue"
                    bg="wireshark.accent"
                    color="netflix.black"
                    fontWeight="bold"
                    px={3}
                    py={1}
                  >
                    {currentInterface}
                  </Badge>
                </VStack>
                
                <VStack spacing={1} align="center">
                  <Text fontSize="xs" color="netflix.silver">Uptime</Text>
                  <Text fontSize="sm" color="netflix.white" fontWeight="bold">
                    {formatUptime(timeConnected)}
                  </Text>
                </VStack>
                
                <VStack spacing={1} align="end">
                  <Text fontSize="xs" color="netflix.silver">Alerts</Text>
                  <Badge
                    colorScheme={alerts.length > 0 ? 'red' : 'gray'}
                    variant={alerts.length > 0 ? 'solid' : 'outline'}
                    px={3}
                    py={1}
                  >
                    {alerts.length}
                  </Badge>
                </VStack>
              </HStack>
            </VStack>
          </Box>

          {/* Action Buttons */}
          <HStack spacing={4} flexWrap="wrap" justify="center">
            <Button
              variant="netflix"
              size="lg"
              leftIcon={isCapturing ? <MdStop /> : <MdPlayArrow />}
              onClick={isCapturing ? onStopCapture : onStartCapture}
              isDisabled={connectionStatus !== 'connected' && !isCapturing}
              minW="160px"
            >
              {isCapturing ? 'Stop Capture' : 'Start Capture'}
            </Button>
            
            <Button
              variant="netflixSecondary"
              size="lg"
              leftIcon={<MdVisibility />}
              onClick={onOpenAnalytics}
              minW="140px"
            >
              Analytics
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              leftIcon={<MdSettings />}
              onClick={onOpenSettings}
              color="netflix.white"
              _hover={{
                bg: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              }}
              minW="120px"
            >
              Settings
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  )
}

export default NetflixHeroSection