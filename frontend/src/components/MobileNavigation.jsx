import { useState, useRef } from 'react'
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Divider,
  useDisclosure,
  Collapse
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwipeNavigation, useMobileDetection } from '../hooks/useMobileGestures'
import { slideAnimations, buttonAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionButton = motion(Button)

const MobileNavigation = ({
  connectionStatus = 'disconnected',
  packetCount = 0,
  currentInterface = '',
  isCapturing = false,
  onNavigation = () => {},
  onSettings = () => {},
  onAbout = () => {},
  onStartCapture = () => {},
  onStopCapture = () => {},
  children
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeSection, setActiveSection] = useState('home')
  const { isMobile, isTablet, orientation } = useMobileDetection()
  const drawerRef = useRef()

  // Mobile navigation items with icons and actions
  const navigationItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: '🏠',
      action: () => handleNavigation('home'),
      badge: null
    },
    {
      id: 'packets',
      label: 'Live Packets',
      icon: '📡',
      action: () => handleNavigation('packets'),
      badge: packetCount > 0 ? packetCount : null
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📊',
      action: () => handleNavigation('analytics'),
      badge: null
    },
    {
      id: 'search',
      label: 'Search & Filter',
      icon: '🔍',
      action: () => handleNavigation('search'),
      badge: null
    },
    {
      id: 'timeline',
      label: 'Timeline & Playback',
      icon: '⏱️',
      action: () => handleNavigation('timeline'),
      badge: null
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: '🤖',
      action: () => handleNavigation('chat'),
      badge: null
    },
    {
      id: 'capture',
      label: isCapturing ? 'Stop Capture' : 'Start Capture',
      icon: isCapturing ? '⏹️' : '▶️',
      action: isCapturing ? onStopCapture : onStartCapture,
      badge: null,
      variant: isCapturing ? 'error' : 'success'
    }
  ]

  const settingsItems = [
    {
      id: 'interfaces',
      label: 'Network Interfaces',
      icon: '🌐',
      action: () => handleNavigation('interfaces'),
      badge: currentInterface ? '1' : null
    },
    {
      id: 'filters',
      label: 'BPF Filters',
      icon: '🔧',
      action: () => handleNavigation('filters'),
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      action: onSettings,
      badge: null
    },
    {
      id: 'about',
      label: 'About',
      icon: 'ℹ️',
      action: onAbout,
      badge: null
    }
  ]

  // Handle navigation with haptic feedback
  const handleNavigation = (navId) => {
    setActiveSection(navId)
    onNavigation(navId)
    
    // Haptic feedback for mobile devices
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(10)
    }
    
    onClose()
  }

  // Swipe gesture handlers
  const { touchHandlers } = useSwipeNavigation(
    () => onClose(), // Swipe left to close
    () => onOpen(),  // Swipe right to open
    null,
    null
  )

  // Status indicator component
  const StatusIndicator = () => (
    <HStack spacing={2} mb={4}>
      <Box
        w="8px"
        h="8px"
        borderRadius="50%"
        bg={
          connectionStatus === 'connected' ? 'green.500' :
          connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'yellow.500' :
          'red.500'
        }
        boxShadow={`0 0 10px ${
          connectionStatus === 'connected' ? '#10B981' :
          connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? '#F59E0B' :
          '#EF4444'
        }`}
      />
      <Text fontSize="sm" color="netflix.silver">
        {connectionStatus === 'connected' ? 'Connected' :
         connectionStatus === 'connecting' ? 'Connecting...' :
         connectionStatus === 'reconnecting' ? 'Reconnecting...' :
         'Disconnected'}
      </Text>
      {isCapturing && (
        <Badge colorScheme="green" size="sm">
          Capturing
        </Badge>
      )}
    </HStack>
  )

  // Navigation item component
  const NavigationItem = ({ item, isActive = false }) => (
    <MotionButton
      key={item.id}
      w="100%"
      h="56px"
      justifyContent="flex-start"
      leftIcon={
        <Text fontSize="20px" mr={2}>
          {item.icon}
        </Text>
      }
      rightIcon={
        item.badge && (
          <Badge
            colorScheme={item.variant === 'error' ? 'red' : item.variant === 'success' ? 'green' : 'blue'}
            borderRadius="full"
            px={2}
          >
            {item.badge}
          </Badge>
        )
      }
      variant={isActive ? 'netflixPrimary' : 'netflixSecondary'}
      bg={isActive ? 'rgba(229, 9, 20, 0.2)' : 'transparent'}
      color={isActive ? 'netflix.white' : 'netflix.silver'}
      borderRadius="12px"
      border="1px solid"
      borderColor={isActive ? 'rgba(229, 9, 20, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
      onClick={item.action}
      variants={buttonAnimations}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      _hover={{
        bg: isActive ? 'rgba(229, 9, 20, 0.3)' : 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(229, 9, 20, 0.3)'
      }}
    >
      <Text fontWeight="medium" fontSize="md">
        {item.label}
      </Text>
    </MotionButton>
  )

  // Bottom navigation bar for mobile
  const BottomNavigationBar = () => (
    <MotionBox
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="rgba(10, 10, 10, 0.95)"
      backdropFilter="blur(20px)"
      borderTop="1px solid rgba(255, 255, 255, 0.1)"
      p={2}
      zIndex={1000}
      display={{ base: 'block', md: 'none' }}
      variants={slideAnimations.slideInUp}
      initial="initial"
      animate="animate"
    >
      <HStack spacing={1} justify="space-around">
        {navigationItems.slice(0, 5).map((item) => (
          <IconButton
            key={item.id}
            aria-label={item.label}
            icon={
              <VStack spacing={1}>
                <Text fontSize="18px">{item.icon}</Text>
                <Text fontSize="10px" color="netflix.silver">
                  {item.label}
                </Text>
                {item.badge && (
                  <Badge
                    position="absolute"
                    top="-4px"
                    right="-4px"
                    colorScheme="red"
                    borderRadius="full"
                    minW="16px"
                    h="16px"
                    fontSize="10px"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </VStack>
            }
            variant="ghost"
            w="100%"
            h="60px"
            borderRadius="12px"
            position="relative"
            bg={activeSection === item.id ? 'rgba(229, 9, 20, 0.2)' : 'transparent'}
            color={activeSection === item.id ? 'netflix.white' : 'netflix.silver'}
            onClick={item.action}
            _hover={{
              bg: 'rgba(255, 255, 255, 0.05)'
            }}
          />
        ))}
        <IconButton
          aria-label="Menu"
          icon={
            <VStack spacing={1}>
              <Text fontSize="18px">☰</Text>
              <Text fontSize="10px" color="netflix.silver">
                Menu
              </Text>
            </VStack>
          }
          variant="ghost"
          w="100%"
          h="60px"
          borderRadius="12px"
          color="netflix.silver"
          onClick={onOpen}
          _hover={{
            bg: 'rgba(255, 255, 255, 0.05)'
          }}
        />
      </HStack>
    </MotionBox>
  )

  // Hamburger menu button
  const HamburgerButton = () => (
    <IconButton
      aria-label="Open menu"
      icon={<Text fontSize="24px">☰</Text>}
      variant="ghost"
      color="netflix.white"
      size="lg"
      onClick={onOpen}
      display={{ base: 'flex', md: 'none' }}
      position="fixed"
      top={4}
      left={4}
      zIndex={1001}
      bg="rgba(10, 10, 10, 0.8)"
      backdropFilter="blur(10px)"
      borderRadius="12px"
      border="1px solid rgba(255, 255, 255, 0.2)"
      _hover={{
        bg: 'rgba(229, 9, 20, 0.2)',
        borderColor: 'rgba(229, 9, 20, 0.5)'
      }}
    />
  )

  return (
    <>
      {/* Hamburger Menu Button */}
      <HamburgerButton />

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar />

      {/* Slide-out Navigation Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        size={isMobile ? 'xs' : 'sm'}
        finalFocusRef={drawerRef}
      >
        <DrawerOverlay bg="rgba(0, 0, 0, 0.8)" />
        <DrawerContent
          bg="netflix.black"
          borderRight="1px solid rgba(255, 255, 255, 0.1)"
          {...touchHandlers}
        >
          <DrawerCloseButton
            color="netflix.white"
            size="lg"
            top={4}
            right={4}
          />
          
          <DrawerHeader
            borderBottomWidth="1px"
            borderBottomColor="rgba(255, 255, 255, 0.1)"
            pb={4}
          >
            <VStack align="start" spacing={2}>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color="netflix.white"
                letterSpacing="-0.025em"
              >
                AI Shark
              </Text>
              <Text fontSize="sm" color="netflix.silver">
                Network Packet Analyzer
              </Text>
              <StatusIndicator />
            </VStack>
          </DrawerHeader>

          <DrawerBody py={6}>
            <VStack spacing={6} align="stretch">
              {/* Main Navigation */}
              <VStack align="stretch" spacing={3}>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="netflix.silver"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  Navigation
                </Text>
                {navigationItems.map((item) => (
                  <NavigationItem
                    key={item.id}
                    item={item}
                    isActive={activeSection === item.id}
                  />
                ))}
              </VStack>

              <Divider borderColor="rgba(255, 255, 255, 0.1)" />

              {/* Settings & Tools */}
              <VStack align="stretch" spacing={3}>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="netflix.silver"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  Settings & Tools
                </Text>
                {settingsItems.map((item) => (
                  <NavigationItem
                    key={item.id}
                    item={item}
                    isActive={activeSection === item.id}
                  />
                ))}
              </VStack>

              {/* Interface Info */}
              {currentInterface && (
                <>
                  <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                  <Box
                    p={4}
                    bg="rgba(31, 31, 31, 0.5)"
                    borderRadius="12px"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                  >
                    <VStack align="start" spacing={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="netflix.silver"
                      >
                        Active Interface
                      </Text>
                      <Text
                        fontSize="md"
                        color="netflix.white"
                        fontWeight="medium"
                      >
                        {currentInterface}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="blue" size="sm">
                          {packetCount} packets
                        </Badge>
                        {isCapturing && (
                          <Badge colorScheme="green" size="sm">
                            Live
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Content wrapper with bottom padding for mobile navigation */}
      <Box
        pb={{ base: '80px', md: 0 }}
        minH="100vh"
      >
        {children}
      </Box>
    </>
  )
}

export default MobileNavigation