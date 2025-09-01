import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Divider,
  Spinner,
  GridItem,
  useColorMode,
  useColorModeValue,
  Select,
  Input,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VisuallyHidden,
  Flex,
  Stack,
  Container,
  useBreakpointValue,
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { explainPacket, getInterfaces, updateCaptureSettings } from './api'
import Sparkline from './components/Sparkline'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const [packets, setPackets] = useState([])
  const [selectedPacket, setSelectedPacket] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [alerts, setAlerts] = useState([])
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [interfaces, setInterfaces] = useState([])
  const [selectedInterface, setSelectedInterface] = useState('')
  const [bpfFilter, setBpfFilter] = useState('')
  const [currentSettings, setCurrentSettings] = useState({ iface: '', bpf: '' })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState(null)
  const [packetRate, setPacketRate] = useState(0)
  const [trafficHistory, setTrafficHistory] = useState([])
  const [alertFilter, setAlertFilter] = useState(null)
  const [filteredPackets, setFilteredPackets] = useState([])
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const packetCountRef = useRef(0)
  const lastRateUpdateRef = useRef(Date.now())

  // Color mode values
  const { colorMode } = useColorMode()
  const bgColor = useColorModeValue('white', '#1a1a1a')
  const headerBg = useColorModeValue('gray.50', '#2d2d2d')
  const cardBg = useColorModeValue('white', '#2d2d2d')

  // Responsive breakpoint values
  const isMobile = useBreakpointValue({ base: true, md: false })
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false })
  const headerDirection = useBreakpointValue({ base: 'column', md: 'row' })
  const headerSpacing = useBreakpointValue({ base: 2, md: 4 })
  const mainPadding = useBreakpointValue({ base: 2, md: 4 })
  const gridColumns = useBreakpointValue({ 
    base: '1fr', 
    lg: selectedPacket ? '1fr 400px' : '1fr' 
  })

  // WebSocket connection management with automatic reconnection
  // Enhanced error handling per requirement 2.5
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/packets')
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully')
        setConnectionStatus('connected')
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        
        // Send initial ping to confirm connection
        try {
          wsRef.current.send('ping')
        } catch (error) {
          console.warn('Failed to send initial ping:', error)
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          // Handle pong responses
          if (event.data === 'pong') {
            console.debug('Received pong from server')
            return
          }
          
          const data = JSON.parse(event.data)
          
          if (data.type === 'alert') {
            // Handle anomaly alerts
            setAlerts(prev => [data, ...prev.slice(0, 9)]) // Keep last 10 alerts
          } else if (data.type === 'connection_status') {
            console.log('Connection status:', data.message)
          } else if (data.type === 'error') {
            console.error('Server error:', data.message)
            setConnectionStatus('error')
          } else if (data.type === 'config_change') {
            console.log('Configuration changed:', data)
            // Update current settings display
            setCurrentSettings({
              iface: data.interface || '',
              bpf: data.bpf_filter || ''
            })
          } else {
            // Handle packet data with optimized buffer management
            setPackets(prev => {
              // Implement efficient buffer management per requirement 2.3
              const maxPackets = 500
              const dropThreshold = 450 // Start dropping when approaching limit
              
              if (prev.length >= dropThreshold) {
                // Drop older packets more aggressively when approaching limit
                const keepCount = Math.floor(maxPackets * 0.7) // Keep 70% of max
                const newPackets = [data, ...prev.slice(0, keepCount)]
                return newPackets
              } else {
                // Normal operation
                const newPackets = [data, ...prev.slice(0, maxPackets - 1)]
                return newPackets
              }
            })
            
            // Update packet rate calculation
            packetCountRef.current += 1
            const now = Date.now()
            const timeDiff = now - lastRateUpdateRef.current
            
            // Update rate every second
            if (timeDiff >= 1000) {
              const rate = Math.round((packetCountRef.current * 1000) / timeDiff)
              setPacketRate(rate)
              
              // Update traffic history for sparkline (keep last 60 seconds)
              setTrafficHistory(prev => {
                const newHistory = [...prev, { time: now, rate }].slice(-60)
                return newHistory
              })
              
              packetCountRef.current = 0
              lastRateUpdateRef.current = now
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setConnectionStatus('disconnected')
        
        // Determine reconnection strategy based on close code
        let reconnectDelay = 3000 // Default 3 seconds
        
        if (event.code === 1006) {
          // Abnormal closure, try reconnecting sooner
          reconnectDelay = 1000
        } else if (event.code === 1000) {
          // Normal closure, wait longer
          reconnectDelay = 5000
        }
        
        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          setConnectionStatus('reconnecting')
          connectWebSocket()
        }, reconnectDelay)
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        
        // Try to reconnect after error
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            console.log('Attempting to reconnect after error...')
            setConnectionStatus('reconnecting')
            connectWebSocket()
          }
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
      
      // Retry connection after error
      setTimeout(() => {
        console.log('Retrying WebSocket connection after creation error...')
        setConnectionStatus('reconnecting')
        connectWebSocket()
      }, 5000)
    }
  }

  // Load available interfaces on component mount
  // Enhanced error handling for interface loading
  const loadInterfaces = async () => {
    try {
      const interfaceList = await getInterfaces()
      setInterfaces(interfaceList)
      // Set default interface if none selected
      if (interfaceList.length > 0 && !selectedInterface) {
        setSelectedInterface(interfaceList[0].name)
        setCurrentSettings(prev => ({ ...prev, iface: interfaceList[0].name }))
      }
      console.log('Loaded network interfaces:', interfaceList.length)
    } catch (error) {
      console.error('Failed to load interfaces:', error)
      
      let errorMessage = 'Failed to load network interfaces'
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Timeout loading network interfaces. Please try refreshing the page.'
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection error. Please check if the backend server is running.'
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error loading interfaces. Please check server logs.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSettingsError(errorMessage)
    }
  }

  // Handle capture settings update
  // Enhanced error handling per requirement 4.5
  const handleSettingsUpdate = async () => {
    if (!selectedInterface) {
      setSettingsError('Please select a network interface')
      return
    }

    setSettingsLoading(true)
    setSettingsError(null)

    try {
      const result = await updateCaptureSettings({
        iface: selectedInterface,
        bpf: bpfFilter
      })
      
      setCurrentSettings({
        iface: selectedInterface,
        bpf: bpfFilter
      })
      
      console.log('Capture settings updated successfully:', result)
      
      // Clear any previous errors on success
      setSettingsError(null)
      
    } catch (error) {
      console.error('Failed to update capture settings:', error)
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Failed to update capture settings'
      
      if (error.message.includes('HTTP 403')) {
        errorMessage = 'Insufficient privileges for packet capture. Please run with sudo or set appropriate capabilities.'
      } else if (error.message.includes('HTTP 400')) {
        if (error.message.includes('BPF filter')) {
          errorMessage = 'Invalid BPF filter expression. Please check the syntax and try again.'
        } else if (error.message.includes('Interface')) {
          errorMessage = 'Selected network interface is not available. Please choose a different interface.'
        } else {
          errorMessage = 'Invalid settings. Please check your input and try again.'
        }
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error while updating settings. Please try again or check server logs.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. The server took too long to respond. Please try again.'
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSettingsError(errorMessage)
    } finally {
      setSettingsLoading(false)
    }
  }

  // Initialize WebSocket connection and load interfaces on component mount
  useEffect(() => {
    connectWebSocket()
    loadInterfaces()

    // Cleanup on component unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Format timestamp for display
  const formatTimestamp = (ts) => {
    return new Date(ts * 1000).toLocaleTimeString()
  }

  // Handle packet selection
  const handlePacketSelect = (packet) => {
    setSelectedPacket(packet)
    setAiResponse(null) // Clear previous AI response
  }

  // Handle AI explanation request
  // Enhanced error handling per requirement 3.5
  const handleExplainPacket = async () => {
    if (!selectedPacket) {
      console.warn('No packet selected for AI explanation')
      return
    }

    setAiLoading(true)
    setAiResponse(null)

    try {
      const data = await explainPacket(selectedPacket.summary)
      setAiResponse(data)
      console.log('AI explanation received:', data.is_mock ? 'mock' : 'real')
    } catch (error) {
      console.error('Error getting AI explanation:', error)
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Failed to get AI explanation. Please try again.'
      
      if (error.message.includes('timeout')) {
        errorMessage = 'AI service timeout. The request took too long to process. Please try again.'
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection error. Please check your connection and try again.'
      } else if (error.message.includes('HTTP 503')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later.'
      } else if (error.message.includes('HTTP 429')) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.'
      } else if (error.message.includes('HTTP 401')) {
        errorMessage = 'AI service authentication failed. Please check API key configuration.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setAiResponse({
        explanation: errorMessage,
        is_mock: false,
        error: true
      })
    } finally {
      setAiLoading(false)
    }
  }

  // Handle alert click for filtering
  const handleAlertClick = (alert) => {
    if (alert.meta && alert.meta.window_start) {
      const windowStart = alert.meta.window_start * 1000 // Convert to milliseconds
      const windowEnd = windowStart + 60000 // 1 minute window
      
      setAlertFilter({
        start: windowStart,
        end: windowEnd,
        alert: alert
      })
    }
  }

  // Clear alert filter
  const clearAlertFilter = () => {
    setAlertFilter(null)
  }

  // Filter packets based on alert filter
  useEffect(() => {
    if (alertFilter) {
      const filtered = packets.filter(packet => {
        const packetTime = packet.ts * 1000
        return packetTime >= alertFilter.start && packetTime <= alertFilter.end
      })
      setFilteredPackets(filtered)
    } else {
      setFilteredPackets(packets)
    }
  }, [packets, alertFilter])

  // Get connection status indicator
  const getConnectionIndicator = () => {
    const statusColors = {
      connected: 'green.500',
      disconnected: 'red.500',
      reconnecting: 'yellow.500',
      error: 'red.500'
    }
    
    const statusText = {
      connected: 'Connected',
      disconnected: 'Disconnected',
      reconnecting: 'Reconnecting...',
      error: 'Connection Error'
    }
    
    return (
      <HStack spacing={2} fontSize="sm">
        <Box
          w="8px"
          h="8px"
          borderRadius="50%"
          bg={statusColors[connectionStatus]}
          aria-hidden="true"
        />
        <Text 
          color="gray.600" 
          _dark={{ color: 'gray.400' }}
          aria-label={`Connection status: ${statusText[connectionStatus]}`}
        >
          {statusText[connectionStatus]}
        </Text>
      </HStack>
    )
  }

  return (
    <Box 
      minH="100vh" 
      bg={{ base: 'white', _dark: '#1a1a1a' }} 
      color={{ base: 'black', _dark: 'white' }}
    >
      {/* Skip Navigation Link */}
      <VisuallyHidden>
        <Button
          as="a"
          href="#main-content"
          position="absolute"
          top={2}
          left={2}
          zIndex={9999}
          _focus={{
            position: 'static',
            clip: 'auto',
            width: 'auto',
            height: 'auto'
          }}
        >
          Skip to main content
        </Button>
      </VisuallyHidden>

      {/* Header */}
      <Box
        as="header"
        role="banner"
        p={mainPadding}
        bg={{ base: 'gray.50', _dark: '#2d2d2d' }}
        borderBottom="1px solid"
        borderColor={{ base: 'gray.200', _dark: '#404040' }}
      >
        <Flex 
          direction={headerDirection}
          justify="space-between" 
          align="center"
          gap={headerSpacing}
        >
          <Heading 
            size={isMobile ? "md" : "lg"} 
            color={{ base: 'blue.600', _dark: '#61dafb' }}
            id="app-title"
          >
            Wireshark+ Web Dashboard
          </Heading>
          <Flex 
            align="center" 
            gap={isMobile ? 2 : 4}
            wrap="wrap"
            justify={isMobile ? "center" : "flex-end"}
          >
            {getConnectionIndicator()}
            {!isMobile && (
              <>
                <Text fontSize="sm" aria-label={`Total packets captured: ${packets.length}`}>
                  Packets: {packets.length}
                </Text>
                <Text fontSize="sm" aria-label={`Current packet rate: ${packetRate} packets per second`}>
                  Rate: {packetRate} pps
                </Text>
                <Box aria-label="Traffic sparkline visualization">
                  <Sparkline data={trafficHistory} width={120} height={30} />
                </Box>
              </>
            )}
            <ThemeToggle />
          </Flex>
        </Flex>
        
        {/* Mobile stats row */}
        {isMobile && (
          <Flex justify="center" gap={4} mt={2} fontSize="sm">
            <Text aria-label={`Total packets captured: ${packets.length}`}>
              Packets: {packets.length}
            </Text>
            <Text aria-label={`Current packet rate: ${packetRate} packets per second`}>
              Rate: {packetRate} pps
            </Text>
          </Flex>
        )}
      </Box>      {/* 
Capture Controls */}
      <Box 
        as="section"
        role="region"
        aria-labelledby="capture-settings-heading"
        m={mainPadding} 
        p={4} 
        bg={{ base: 'white', _dark: '#2d2d2d' }} 
        borderRadius="lg" 
        border="1px solid" 
        borderColor={{ base: 'gray.200', _dark: '#404040' }}
      >
        <Heading id="capture-settings-heading" size="md" mb={4}>
          Capture Settings
        </Heading>
        <VStack spacing={4} align="stretch">
          <Stack 
            direction={{ base: 'column', md: 'row' }} 
            spacing={4}
            align={{ base: 'stretch', md: 'end' }}
          >
            <Box flex={1} minW={{ base: 'auto', md: '200px' }}>
              <Text 
                as="label" 
                htmlFor="interface-select"
                fontSize="sm" 
                fontWeight="500" 
                mb={2}
                display="block"
              >
                Network Interface:
              </Text>
              <Select
                id="interface-select"
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                disabled={settingsLoading}
                placeholder="Select interface..."
                aria-describedby="interface-help"
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px blue.500'
                }}
              >
                {interfaces.map((iface) => (
                  <option key={iface.name} value={iface.name}>
                    {iface.name} {iface.description && `(${iface.description})`}
                  </option>
                ))}
              </Select>
              <VisuallyHidden id="interface-help">
                Select the network interface to capture packets from
              </VisuallyHidden>
            </Box>

            <Box flex={1} minW={{ base: 'auto', md: '200px' }}>
              <Text 
                as="label" 
                htmlFor="bpf-filter"
                fontSize="sm" 
                fontWeight="500" 
                mb={2}
                display="block"
              >
                BPF Filter:
              </Text>
              <Input
                id="bpf-filter"
                type="text"
                value={bpfFilter}
                onChange={(e) => setBpfFilter(e.target.value)}
                placeholder="e.g., port 80 or tcp"
                disabled={settingsLoading}
                aria-describedby="filter-help"
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px blue.500'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !settingsLoading && selectedInterface) {
                    handleSettingsUpdate()
                  }
                }}
              />
              <VisuallyHidden id="filter-help">
                Enter a Berkeley Packet Filter expression to filter captured packets
              </VisuallyHidden>
            </Box>

            <Box>
              <Button
                onClick={handleSettingsUpdate}
                disabled={settingsLoading || !selectedInterface}
                isLoading={settingsLoading}
                loadingText="Applying..."
                colorScheme="blue"
                aria-describedby="apply-help"
                _focus={{
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)'
                }}
              >
                Apply Settings
              </Button>
              <VisuallyHidden id="apply-help">
                Apply the selected interface and filter settings to start packet capture
              </VisuallyHidden>
            </Box>
          </Stack>

          {currentSettings.iface && (
            <Alert 
              status="info" 
              variant="subtle"
              role="status"
              aria-live="polite"
            >
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Current Settings:</AlertTitle>
                <AlertDescription fontSize="sm">
                  Interface: {currentSettings.iface}
                  {currentSettings.bpf && `, Filter: ${currentSettings.bpf}`}
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {settingsError && (
            <Alert 
              status="error" 
              variant="subtle"
              role="alert"
              aria-live="assertive"
            >
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Configuration Error:</AlertTitle>
                <AlertDescription fontSize="sm">{settingsError}</AlertDescription>
              </Box>
            </Alert>
          )}
        </VStack>
      </Box>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Box 
          as="section"
          role="region"
          aria-labelledby="alerts-heading"
          m={mainPadding} 
          p={4} 
          bg={{ base: 'white', _dark: '#2d2d2d' }} 
          borderRadius="lg" 
          border="1px solid" 
          borderColor={{ base: 'gray.200', _dark: '#404040' }}
        >
          <Flex 
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between" 
            align={{ base: 'start', sm: 'center' }}
            mb={4}
            gap={2}
          >
            <Heading 
              id="alerts-heading"
              size="md" 
              color={{ base: 'orange.600', _dark: '#fbbf24' }}
            >
              Recent Alerts
            </Heading>
            {alertFilter && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearAlertFilter}
                aria-label="Clear alert filter and show all packets"
                _focus={{
                  boxShadow: '0 0 0 3px rgba(251, 191, 36, 0.5)'
                }}
              >
                Clear Filter
              </Button>
            )}
          </Flex>
          <VStack spacing={3} align="stretch">
            {alerts.slice(0, 3).map((alert, index) => (
              <Box
                key={index}
                as="button"
                role="button"
                tabIndex={0}
                p={3}
                bg={alert.level === 'critical' 
                  ? { base: 'red.50', _dark: 'rgba(239, 68, 68, 0.1)' }
                  : { base: 'orange.50', _dark: 'rgba(251, 191, 36, 0.1)' }
                }
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor={alert.level === 'critical' ? '#ef4444' : '#fbbf24'}
                cursor="pointer"
                onClick={() => handleAlertClick(alert)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleAlertClick(alert)
                  }
                }}
                border={alertFilter?.alert === alert ? '2px solid #61dafb' : '1px solid transparent'}
                _hover={{ transform: 'translateX(2px)' }}
                _focus={{
                  boxShadow: '0 0 0 3px rgba(251, 191, 36, 0.5)',
                  outline: 'none'
                }}
                transition="all 0.2s"
                textAlign="left"
                width="100%"
                aria-label={`Alert: ${alert.message}. Click to filter packets from this time period.`}
                aria-pressed={alertFilter?.alert === alert}
              >
                <Flex justify="space-between" align="start" gap={4}>
                  <Box flex={1}>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {formatTimestamp(alert.timestamp || Date.now() / 1000)}
                    </Text>
                    <Text fontSize="sm">
                      {alert.message}
                    </Text>
                  </Box>
                  {alert.meta && (
                    <Box textAlign="right" flexShrink={0}>
                      <Text fontSize="xs" color="gray.500">
                        Z-score: {alert.meta.z_score?.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Count: {alert.meta.packet_count}
                      </Text>
                    </Box>
                  )}
                </Flex>
              </Box>
            ))}
            
            {alertFilter && (
              <Alert status="info" variant="subtle" role="status" aria-live="polite">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  Showing packets from {new Date(alertFilter.start).toLocaleTimeString()} to {new Date(alertFilter.end).toLocaleTimeString()}
                </AlertDescription>
              </Alert>
            )}
          </VStack>
        </Box>
      )}

      {/* Main Content */}
      <Container maxW="full" p={mainPadding}>
        <Box 
          id="main-content"
          display="grid" 
          gridTemplateColumns={gridColumns}
          gap={4} 
          minH="calc(100vh - 300px)"
        >
          {/* Packets Section */}
          <Box as="section" role="region" aria-labelledby="packets-heading">
            <Card variant="outline" h="full">
              <CardHeader>
                <Heading id="packets-heading" size="md">
                  Live Packets
                </Heading>
              </CardHeader>
              <CardBody p={0}>
                <Box 
                  maxH="600px" 
                  overflowY="auto"
                  role="table"
                  aria-label="Network packets table"
                  aria-describedby="packets-description"
                >
                  <VisuallyHidden id="packets-description">
                    Table showing captured network packets with timestamp, source, destination, protocol, and port information. Use arrow keys to navigate and Enter to select a packet for detailed analysis.
                  </VisuallyHidden>
                  
                  <Box as="table" w="100%" style={{ borderCollapse: 'collapse' }}>
                    <Box 
                      as="thead" 
                      position="sticky" 
                      top={0} 
                      zIndex={1}
                      bg={{ base: 'gray.50', _dark: '#404040' }}
                    >
                      <Box as="tr">
                        <Box as="th" p={3} textAlign="left" borderBottom="1px solid" borderColor="gray.300" fontSize="sm" fontWeight="600">
                          Time
                        </Box>
                        <Box as="th" p={3} textAlign="left" borderBottom="1px solid" borderColor="gray.300" fontSize="sm" fontWeight="600" display={{ base: 'none', md: 'table-cell' }}>
                          Source
                        </Box>
                        <Box as="th" p={3} textAlign="left" borderBottom="1px solid" borderColor="gray.300" fontSize="sm" fontWeight="600" display={{ base: 'none', md: 'table-cell' }}>
                          Destination
                        </Box>
                        <Box as="th" p={3} textAlign="left" borderBottom="1px solid" borderColor="gray.300" fontSize="sm" fontWeight="600">
                          Protocol
                        </Box>
                        <Box as="th" p={3} textAlign="left" borderBottom="1px solid" borderColor="gray.300" fontSize="sm" fontWeight="600" display={{ base: 'none', sm: 'table-cell' }}>
                          Length
                        </Box>
                        <Box as="th" p={3} textAlign="left" borderBottom="1px solid" borderColor="gray.300" fontSize="sm" fontWeight="600" display={{ base: 'none', lg: 'table-cell' }}>
                          Ports
                        </Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {filteredPackets.map((packet, index) => (
                        <Box
                          key={`${packet.ts}-${index}`}
                          as="tr"
                          role="button"
                          tabIndex={0}
                          cursor="pointer"
                          bg={selectedPacket === packet 
                            ? { base: 'blue.100', _dark: 'blue.900' }
                            : 'transparent'
                          }
                          _hover={{
                            bg: selectedPacket === packet 
                              ? { base: 'blue.200', _dark: 'blue.800' }
                              : { base: 'gray.50', _dark: 'gray.700' }
                          }}
                          _focus={{
                            bg: { base: 'blue.50', _dark: 'blue.900' },
                            outline: '2px solid',
                            outlineColor: 'blue.500',
                            outlineOffset: '-2px'
                          }}
                          onClick={() => handlePacketSelect(packet)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handlePacketSelect(packet)
                            }
                          }}
                          transition="all 0.2s"
                          aria-label={`Packet from ${packet.src} to ${packet.dst}, protocol ${packet.proto}, ${packet.length} bytes`}
                          aria-selected={selectedPacket === packet}
                        >
                          <Box as="td" p={3} borderBottom="1px solid" borderColor="gray.200" fontSize="sm">
                            {formatTimestamp(packet.ts)}
                          </Box>
                          <Box as="td" p={3} borderBottom="1px solid" borderColor="gray.200" fontSize="sm" display={{ base: 'none', md: 'table-cell' }}>
                            {packet.src}
                          </Box>
                          <Box as="td" p={3} borderBottom="1px solid" borderColor="gray.200" fontSize="sm" display={{ base: 'none', md: 'table-cell' }}>
                            {packet.dst}
                          </Box>
                          <Box as="td" p={3} borderBottom="1px solid" borderColor="gray.200" fontSize="sm">
                            <Badge 
                              colorScheme={
                                packet.proto === 'TCP' ? 'blue' :
                                packet.proto === 'UDP' ? 'green' :
                                packet.proto === 'ICMP' ? 'orange' : 'gray'
                              }
                              fontSize="xs"
                            >
                              {packet.proto}
                            </Badge>
                          </Box>
                          <Box as="td" p={3} borderBottom="1px solid" borderColor="gray.200" fontSize="sm" display={{ base: 'none', sm: 'table-cell' }}>
                            {packet.length}
                          </Box>
                          <Box as="td" p={3} borderBottom="1px solid" borderColor="gray.200" fontSize="sm" display={{ base: 'none', lg: 'table-cell' }}>
                            {packet.sport && packet.dport 
                              ? `${packet.sport} → ${packet.dport}` 
                              : '-'
                            }
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  
                  {filteredPackets.length === 0 && packets.length > 0 && (
                    <Box p={8} textAlign="center">
                      <Text color="gray.500" fontSize="sm">
                        No packets match the current filter
                      </Text>
                    </Box>
                  )}
                  
                  {packets.length === 0 && (
                    <Box p={8} textAlign="center">
                      <Text color="gray.500" fontSize="sm">
                        {connectionStatus === 'connected' 
                          ? 'Waiting for packets...' 
                          : 'Not connected to packet stream'
                        }
                      </Text>
                    </Box>
                  )}
                </Box>
              </CardBody>
            </Card>
          </Box>

          {/* Packet Detail Section */}
          {selectedPacket && (
            <GridItem>
              <Card variant="outline" h="full">
                <CardHeader>
                  <Heading size="md" color={{ base: 'blue.600', _dark: '#61dafb' }}>
                    Packet Details
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Packet Information */}
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Text fontWeight="600" color={{ base: 'blue.600', _dark: '#61dafb' }} minW="100px">
                          Timestamp:
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                          {formatTimestamp(selectedPacket.ts)}
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Text fontWeight="600" color={{ base: 'blue.600', _dark: '#61dafb' }} minW="100px">
                          Source:
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                          {selectedPacket.src}
                          {selectedPacket.sport && `:${selectedPacket.sport}`}
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Text fontWeight="600" color={{ base: 'blue.600', _dark: '#61dafb' }} minW="100px">
                          Destination:
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                          {selectedPacket.dst}
                          {selectedPacket.dport && `:${selectedPacket.dport}`}
                        </Text>
                      </HStack>
                      
                      <HStack>
                        <Text fontWeight="600" color={{ base: 'blue.600', _dark: '#61dafb' }} minW="100px">
                          Protocol:
                        </Text>
                        <Badge colorScheme="blue">
                          {selectedPacket.proto}
                        </Badge>
                      </HStack>
                      
                      <HStack>
                        <Text fontWeight="600" color={{ base: 'blue.600', _dark: '#61dafb' }} minW="100px">
                          Length:
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                          {selectedPacket.length} bytes
                        </Text>
                      </HStack>
                      
                      <VStack align="stretch">
                        <Text fontWeight="600" color={{ base: 'blue.600', _dark: '#61dafb' }}>
                          Summary:
                        </Text>
                        <Box
                          p={3}
                          bg={{ base: 'gray.50', _dark: '#1a1a1a' }}
                          borderRadius="md"
                          border="1px solid"
                          borderColor={{ base: 'gray.200', _dark: '#404040' }}
                          fontFamily="mono"
                          fontSize="xs"
                          lineHeight="1.4"
                          wordBreak="break-all"
                          color="gray.600"
                          _dark={{ color: 'gray.400' }}
                          maxH="150px"
                          overflowY="auto"
                        >
                          {selectedPacket.summary}
                        </Box>
                      </VStack>
                    </VStack>

                    <Divider />

                    {/* AI Analysis Section */}
                    <VStack spacing={4} align="stretch">
                      <Button
                        onClick={handleExplainPacket}
                        isLoading={aiLoading}
                        loadingText="Analyzing..."
                        colorScheme="green"
                        size="md"
                        leftIcon={aiLoading ? <Spinner size="sm" /> : undefined}
                        aria-describedby="ai-help"
                        _focus={{
                          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.5)'
                        }}
                      >
                        Explain Packet
                      </Button>
                      <VisuallyHidden id="ai-help">
                        Get an AI-powered explanation of the selected packet's contents and potential security implications
                      </VisuallyHidden>

                      {aiResponse && (
                        <Card variant="outline">
                          <CardHeader pb={2}>
                            <HStack>
                              <Heading size="sm" color={aiResponse.error ? 'red.500' : 'green.500'}>
                                {aiResponse.error ? 'Analysis Error' : 'AI Analysis'}
                              </Heading>
                              {aiResponse.is_mock && !aiResponse.error && (
                                <Badge colorScheme="yellow" fontSize="xs">
                                  Mock Response
                                </Badge>
                              )}
                            </HStack>
                          </CardHeader>
                          <CardBody pt={0}>
                            <Box
                              p={3}
                              bg={aiResponse.error 
                                ? { base: 'red.50', _dark: 'rgba(239, 68, 68, 0.1)' }
                                : { base: 'green.50', _dark: 'rgba(16, 185, 129, 0.1)' }
                              }
                              borderRadius="md"
                              border="1px solid"
                              borderColor={aiResponse.error 
                                ? { base: 'red.200', _dark: '#ef4444' }
                                : { base: 'green.200', _dark: '#10b981' }
                              }
                              lineHeight="1.6"
                              color={aiResponse.error 
                                ? { base: 'red.700', _dark: '#fca5a5' }
                                : { base: 'green.700', _dark: '#6ee7b7' }
                              }
                              fontSize="sm"
                              whiteSpace="pre-wrap"
                              wordWrap="break-word"
                              maxH="300px"
                              overflowY="auto"
                              role={aiResponse.error ? "alert" : "region"}
                              aria-live={aiResponse.error ? "assertive" : "polite"}
                            >
                              {aiResponse.explanation}
                            </Box>
                          </CardBody>
                        </Card>
                      )}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          )}
        </Box>
      </Container>
    </Box>
  )
}

export default App