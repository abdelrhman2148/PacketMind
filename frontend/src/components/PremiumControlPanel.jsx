import React, { useState } from 'react'
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorMode,
} from '@chakra-ui/react'
import { HelpTooltip, BPFHelpTooltip } from './HelpTooltip'

const PremiumControlPanel = ({
  interfaces = [],
  selectedInterface = '',
  bpfFilter = '',
  currentSettings = { iface: '', bpf: '' },
  settingsLoading = false,
  settingsError = null,
  isCapturing = false,
  onInterfaceChange,
  onBpfFilterChange,
  onApplySettings,
  ...props
}) => {
  const { colorMode } = useColorMode()
  const [localInterface, setLocalInterface] = useState(selectedInterface)
  const [localBpfFilter, setLocalBpfFilter] = useState(bpfFilter)

  const handleInterfaceChange = (e) => {
    const value = e.target.value
    setLocalInterface(value)
    onInterfaceChange?.(value)
  }

  const handleBpfFilterChange = (e) => {
    const value = e.target.value
    setLocalBpfFilter(value)
    onBpfFilterChange?.(value)
  }

  const handleApply = () => {
    onApplySettings?.()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !settingsLoading && localInterface) {
      handleApply()
    }
  }

  return (
    <Box
      bg="rgba(20, 20, 20, 0.95)"
      borderRadius="20px"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
      boxShadow="netflix"
      backdropFilter="blur(25px)"
      overflow="hidden"
      position="relative"
      css={{
        '@keyframes slideInLeft': {
          '0%': { transform: 'translateX(-30px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 }
        },
        animation: 'slideInLeft 0.6s ease-out'
      }}
      {...props}
    >
      {/* Shimmer Effect */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        background="linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.02), transparent)"
        backgroundSize="200% 100%"
        css={{
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' }
          },
          animation: 'shimmer 4s linear infinite'
        }}
        pointerEvents="none"
        opacity={0.5}
      />

      {/* Header */}
      <Box
        p={6}
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        bg="rgba(255, 255, 255, 0.02)"
        position="relative"
        zIndex={1}
      >
        <HStack spacing={4}>
          <Box
            w="48px"
            h="48px"
            bg="linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)"
            borderRadius="12px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 0 20px rgba(245, 158, 11, 0.4)"
            css={isCapturing ? {
              '@keyframes glow': {
                '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' },
                '50%': { boxShadow: '0 0 40px rgba(245, 158, 11, 0.6)' }
              },
              animation: 'glow 3s ease-in-out infinite'
            } : {}}
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: '-1px',
              left: '-1px',
              right: '-1px',
              bottom: '-1px',
              background: 'linear-gradient(45deg, #F59E0B, #EF4444, #E50914, #F59E0B)',
              borderRadius: '13px',
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
            <Text fontSize="xl" color="white">⚙️</Text>
          </Box>
          
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color="netflix.white">
              Capture Configuration
            </Text>
            <Text fontSize="sm" color="netflix.silver">
              Network interface and packet filtering
            </Text>
          </VStack>

          <Box ml="auto">
            <Badge
              bg={isCapturing ? 'wireshark.success' : 'netflix.lightGray'}
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
              css={isCapturing ? {
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.8 }
                },
                animation: 'pulse 2s infinite'
              } : {}}
            >
              {isCapturing ? '🔴 ACTIVE' : '⚫ INACTIVE'}
            </Badge>
          </Box>
        </HStack>
      </Box>

      {/* Controls */}
      <Box p={6} position="relative" zIndex={1}>
        <VStack spacing={6} align="stretch">
          {/* Interface Selection */}
          <Box
            p={5}
            bg="rgba(255, 255, 255, 0.03)"
            borderRadius="16px"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              borderColor: 'rgba(6, 182, 212, 0.3)',
              bg: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <FormControl>
              <FormLabel 
                color="netflix.white" 
                fontWeight="600" 
                fontSize="sm"
                mb={3}
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                <HStack spacing={2}>
                  <Text>Network Interface</Text>
                  <HelpTooltip 
                    content="Select the network interface to capture packets from (e.g., eth0 for Ethernet, wlan0 for WiFi)"
                    showIcon={true}
                  />
                </HStack>
              </FormLabel>
              <Select
                value={localInterface}
                onChange={handleInterfaceChange}
                disabled={settingsLoading}
                placeholder="Select network interface..."
                size="lg"
                bg="rgba(255, 255, 255, 0.05)"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.2)"
                color="netflix.white"
                borderRadius="12px"
                _hover={{
                  borderColor: 'wireshark.neon',
                }}
                _focus={{
                  borderColor: 'wireshark.neon',
                  boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.5)'
                }}
                _disabled={{
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                {interfaces.map((iface) => (
                  <option 
                    key={iface.name} 
                    value={iface.name}
                    style={{ 
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff'
                    }}
                  >
                    {iface.name} {iface.description && `- ${iface.description}`}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* BPF Filter */}
          <Box
            p={5}
            bg="rgba(255, 255, 255, 0.03)"
            borderRadius="16px"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              borderColor: 'rgba(6, 182, 212, 0.3)',
              bg: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <FormControl>
              <FormLabel 
                color="netflix.white" 
                fontWeight="600" 
                fontSize="sm"
                mb={3}
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                <HStack spacing={2}>
                  <Text>BPF Filter Expression</Text>
                  <BPFHelpTooltip />
                </HStack>
              </FormLabel>
              <Input
                value={localBpfFilter}
                onChange={handleBpfFilterChange}
                onKeyPress={handleKeyPress}
                placeholder="tcp port 80 or host 192.168.1.1"
                disabled={settingsLoading}
                size="lg"
                bg="rgba(255, 255, 255, 0.05)"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.2)"
                color="netflix.white"
                borderRadius="12px"
                fontFamily="mono"
                fontSize="sm"
                _placeholder={{ color: 'netflix.silver' }}
                _hover={{
                  borderColor: 'wireshark.neon',
                }}
                _focus={{
                  borderColor: 'wireshark.neon',
                  boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.5)'
                }}
                _disabled={{
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              />
            </FormControl>
          </Box>

          {/* Apply Button */}
          <Button
            onClick={handleApply}
            isLoading={settingsLoading}
            loadingText="Applying Configuration..."
            disabled={!localInterface}
            size="lg"
            h="56px"
            bg="linear-gradient(135deg, #1E40AF 0%, #06B6D4 100%)"
            color="white"
            borderRadius="16px"
            fontWeight="bold"
            fontSize="md"
            textTransform="uppercase"
            letterSpacing="0.05em"
            boxShadow="wiresharkGlow"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              transform: 'translateY(-2px) scale(1.02)',
              boxShadow: '0 12px 40px rgba(30, 64, 175, 0.5)',
            }}
            _active={{
              transform: 'translateY(0) scale(1)',
            }}
            _disabled={{
              opacity: 0.5,
              cursor: 'not-allowed',
              transform: 'none',
            }}
            leftIcon={<Text fontSize="lg">🚀</Text>}
          >
            {isCapturing ? 'Update Configuration' : 'Start Capture'}
          </Button>
        </VStack>
      </Box>

      {/* Status Section */}
      <Box p={6} pt={0} position="relative" zIndex={1}>
        <VStack spacing={4} align="stretch">
          {/* Current Settings */}
          {currentSettings.iface && (
            <Box
              p={4}
              bg="rgba(16, 185, 129, 0.1)"
              borderRadius="12px"
              border="1px solid"
              borderColor="rgba(16, 185, 129, 0.3)"
            >
              <HStack spacing={3}>
                <Box
                  w="24px"
                  h="24px"
                  bg="wireshark.success"
                  borderRadius="6px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="sm" color="white">✓</Text>
                </Box>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="bold" color="wireshark.success">
                    Active Configuration
                  </Text>
                  <Text fontSize="sm" color="netflix.white">
                    Interface: <Text as="span" fontFamily="mono" color="wireshark.neon">{currentSettings.iface}</Text>
                    {currentSettings.bpf && (
                      <>
                        {' • '}Filter: <Text as="span" fontFamily="mono" color="wireshark.neon">{currentSettings.bpf}</Text>
                      </>
                    )}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )}

          {/* Error Display */}
          {settingsError && (
            <Alert
              status="error"
              bg="rgba(239, 68, 68, 0.1)"
              borderRadius="12px"
              border="1px solid"
              borderColor="rgba(239, 68, 68, 0.3)"
              color="netflix.white"
            >
              <AlertIcon color="wireshark.error" />
              <Box>
                <AlertTitle fontSize="sm" color="wireshark.error">
                  Configuration Error
                </AlertTitle>
                <AlertDescription fontSize="sm" color="netflix.white">
                  {settingsError}
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </VStack>
      </Box>
    </Box>
  )
}

export default PremiumControlPanel