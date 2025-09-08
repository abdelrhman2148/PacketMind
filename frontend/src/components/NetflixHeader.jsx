import React, { useState, useEffect } from 'react'
import {
  Box,
  Flex,
  Heading,
  HStack,
  VStack,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Badge,
  useColorMode,
  useBreakpointValue,
  Collapse,
  Divider,
  Text,
  Tooltip,
  keyframes
} from '@chakra-ui/react'
import {
  MdMenu,
  MdClose,
  MdSettings,
  MdInfo,
  MdKeyboardArrowDown,
  MdLightMode,
  MdDarkMode
} from 'react-icons/md'

// Animated shark icon keyframes
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(-2deg); }
`

const glowAnimation = keyframes`
  0%, 100% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.3)); }
  50% { filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.6)); }
`

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

// Animated Shark Logo Component
const AnimatedSharkLogo = ({ size = 32 }) => {
  return (
    <Box
      as="svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animation={`${floatAnimation} 3s ease-in-out infinite, ${glowAnimation} 2s ease-in-out infinite`}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: 'scale(1.1)',
        filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.8))',
      }}
      cursor="pointer"
    >
      {/* Shark body */}
      <path
        d="M10 50 Q20 30, 40 35 Q60 40, 80 45 Q90 50, 85 55 Q70 60, 50 58 Q30 56, 10 50 Z"
        fill="url(#sharkGradient)"
        stroke="rgba(6, 182, 212, 0.8)"
        strokeWidth="1"
      />
      {/* Shark fins */}
      <path
        d="M25 35 L30 25 L35 35 Z"
        fill="rgba(6, 182, 212, 0.9)"
      />
      <path
        d="M55 58 L60 68 L65 58 Z"
        fill="rgba(6, 182, 212, 0.9)"
      />
      {/* Shark tail */}
      <path
        d="M80 45 L95 35 L95 55 Z"
        fill="rgba(6, 182, 212, 0.8)"
      />
      {/* Shark eye */}
      <circle
        cx="30"
        cy="45"
        r="3"
        fill="#FFFFFF"
      />
      <circle
        cx="32"
        cy="44"
        r="1.5"
        fill="#0A0A0A"
      />
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="sharkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(6, 182, 212, 0.8)" />
          <stop offset="50%" stopColor="rgba(14, 165, 233, 0.9)" />
          <stop offset="100%" stopColor="rgba(6, 182, 212, 1)" />
        </linearGradient>
      </defs>
    </Box>
  )
}

// Navigation Menu Items
const NavItem = ({ children, href, isActive = false, onClick, ...props }) => {
  return (
    <Button
      variant="ghost"
      color={isActive ? 'wireshark.accent' : 'netflix.white'}
      fontWeight={isActive ? 'bold' : 'medium'}
      fontSize="sm"
      h="auto"
      p={2}
      position="relative"
      onClick={onClick}
      _hover={{
        color: 'wireshark.accent',
        transform: 'translateY(-1px)',
        _after: {
          width: '100%',
        },
      }}
      _after={{
        content: '""',
        position: 'absolute',
        bottom: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isActive ? '100%' : '0%',
        height: '2px',
        bg: 'wireshark.accent',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

// Connection Status Indicator
const ConnectionStatus = ({ status }) => {
  const statusColors = {
    connected: 'green.400',
    disconnected: 'red.400',
    reconnecting: 'yellow.400',
    error: 'red.500'
  }

  const statusText = {
    connected: 'Live',
    disconnected: 'Offline',
    reconnecting: 'Connecting...',
    error: 'Error'
  }

  return (
    <Tooltip label={`Connection: ${statusText[status]}`} placement="bottom">
      <HStack spacing={2}>
        <Box
          w={2}
          h={2}
          borderRadius="full"
          bg={statusColors[status]}
          animation={status === 'connected' ? `${glowAnimation} 2s ease-in-out infinite` : 'none'}
        />
        <Text fontSize="xs" color="netflix.silver" fontWeight="medium">
          {statusText[status]}
        </Text>
      </HStack>
    </Tooltip>
  )
}

// Main Netflix Header Component
const NetflixHeader = ({
  connectionStatus = 'connected',
  currentInterface = 'eth0',
  packetCount = 0,
  onNavigation = () => {},
  onSettings = () => {},
  onAbout = () => {},
}) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('dashboard')
  
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', active: true },
    { id: 'packets', label: 'Live Packets' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'filters', label: 'Filters' },
  ]

  const handleNavClick = (navId) => {
    setActiveNav(navId)
    onNavigation(navId)
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1000}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      {/* Main Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        w="full"
        h={16}
        px={{ base: 4, md: 8 }}
        bg={isScrolled 
          ? 'rgba(10, 10, 10, 0.95)' 
          : 'rgba(10, 10, 10, 0.8)'
        }
        backdropFilter="blur(20px)"
        borderBottom="1px solid"
        borderColor={isScrolled 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'transparent'
        }
        boxShadow={isScrolled ? 'netflix' : 'none'}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), transparent)',
        }}
      >
        {/* Left Section - Logo and Brand */}
        <HStack spacing={4}>
          <HStack spacing={3} cursor="pointer" onClick={() => handleNavClick('dashboard')}>
            <AnimatedSharkLogo size={isMobile ? 28 : 32} />
            <VStack spacing={0} align="start">
              <Heading
                size={isMobile ? 'sm' : 'md'}
                color="netflix.white"
                fontWeight="bold"
                lineHeight={1}
                background="linear-gradient(135deg, #E50914 0%, #06B6D4 100%)"
                bgClip="text"
                textFillColor="transparent"
                _hover={{
                  background: `linear-gradient(135deg, #E50914 0%, #06B6D4 100%)`,
                  backgroundSize: '200% 200%',
                  animation: `${shimmerAnimation} 2s ease-in-out infinite`,
                  bgClip: 'text',
                }}
              >
                AI-Shark
              </Heading>
              {!isMobile && (
                <Text fontSize="xs" color="netflix.silver" lineHeight={1}>
                  Network Analysis
                </Text>
              )}
            </VStack>
          </HStack>

          {/* Connection Status */}
          {!isMobile && (
            <Box ml={4}>
              <ConnectionStatus status={connectionStatus} />
            </Box>
          )}
        </HStack>

        {/* Center Section - Navigation (Desktop) */}
        {!isMobile && (
          <HStack spacing={6}>
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                isActive={activeNav === item.id}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </NavItem>
            ))}
          </HStack>
        )}

        {/* Right Section - Stats and Controls */}
        <HStack spacing={4}>
          {/* Quick Stats */}
          {!isMobile && (
            <HStack spacing={4}>
              <VStack spacing={0}>
                <Text fontSize="xs" color="netflix.silver">
                  Interface
                </Text>
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  bg="wireshark.accent"
                  color="netflix.black"
                  fontWeight="bold"
                >
                  {currentInterface}
                </Badge>
              </VStack>
              
              <VStack spacing={0}>
                <Text fontSize="xs" color="netflix.silver">
                  Packets
                </Text>
                <Text fontSize="sm" color="netflix.white" fontWeight="bold">
                  {packetCount.toLocaleString()}
                </Text>
              </VStack>
            </HStack>
          )}

          {/* Theme Toggle */}
          <Tooltip label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'dark' ? <MdLightMode /> : <MdDarkMode />}
              variant="ghost"
              color="netflix.white"
              size="sm"
              onClick={toggleColorMode}
              _hover={{
                bg: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.1)',
              }}
            />
          </Tooltip>

          {/* Settings Menu */}
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Settings menu"
              icon={<MdSettings />}
              variant="ghost"
              color="netflix.white"
              size="sm"
              _hover={{
                bg: 'rgba(255, 255, 255, 0.1)',
                transform: 'rotate(90deg)',
              }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            />
            <MenuList
              bg="netflix.darkGray"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              boxShadow="netflix"
            >
              <MenuItem
                bg="transparent"
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                onClick={onSettings}
              >
                <MdSettings style={{ marginRight: '12px' }} />
                Settings
              </MenuItem>
              <MenuItem
                bg="transparent"
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                onClick={onAbout}
              >
                <MdInfo style={{ marginRight: '12px' }} />
                About
              </MenuItem>
            </MenuList>
          </Menu>

          {/* User Profile */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              rightIcon={<MdKeyboardArrowDown />}
              color="netflix.white"
              _hover={{
                bg: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Avatar
                size="sm"
                name="Network Analyst"
                bg="wireshark.accent"
                color="netflix.black"
              />
            </MenuButton>
            <MenuList
              bg="netflix.darkGray"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              boxShadow="netflix"
            >
              <MenuItem
                bg="transparent"
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                Profile
              </MenuItem>
              <MenuItem
                bg="transparent"
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                Preferences
              </MenuItem>
              <Divider borderColor="rgba(255, 255, 255, 0.1)" />
              <MenuItem
                bg="transparent"
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <IconButton
              aria-label="Toggle mobile menu"
              icon={isMobileMenuOpen ? <MdClose /> : <MdMenu />}
              variant="ghost"
              color="netflix.white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              _hover={{
                bg: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          )}
        </HStack>
      </Flex>

      {/* Mobile Navigation Menu */}
      <Collapse in={isMobileMenuOpen} animateOpacity>
        <Box
          bg="rgba(20, 20, 20, 0.98)"
          backdropFilter="blur(20px)"
          borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          p={4}
        >
          <VStack spacing={4} align="stretch">
            {/* Mobile Connection Status */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="netflix.silver">
                Connection Status
              </Text>
              <ConnectionStatus status={connectionStatus} />
            </HStack>

            <Divider borderColor="rgba(255, 255, 255, 0.1)" />

            {/* Mobile Navigation Items */}
            <VStack spacing={2} align="stretch">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  justifyContent="flex-start"
                  color={activeNav === item.id ? 'wireshark.accent' : 'netflix.white'}
                  fontWeight={activeNav === item.id ? 'bold' : 'medium'}
                  onClick={() => handleNavClick(item.id)}
                  _hover={{
                    bg: 'rgba(255, 255, 255, 0.1)',
                    color: 'wireshark.accent',
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </VStack>

            <Divider borderColor="rgba(255, 255, 255, 0.1)" />

            {/* Mobile Quick Stats */}
            <HStack justify="space-between">
              <VStack spacing={1}>
                <Text fontSize="xs" color="netflix.silver">
                  Interface
                </Text>
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  bg="wireshark.accent"
                  color="netflix.black"
                >
                  {currentInterface}
                </Badge>
              </VStack>
              
              <VStack spacing={1}>
                <Text fontSize="xs" color="netflix.silver">
                  Packets
                </Text>
                <Text fontSize="sm" color="netflix.white" fontWeight="bold">
                  {packetCount.toLocaleString()}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  )
}

export default NetflixHeader