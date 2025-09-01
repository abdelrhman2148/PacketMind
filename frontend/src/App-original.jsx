import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Heading,
  Text,
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
      connected: 'status.success',
      disconnected: 'status.error',
      reconnecting: 'status.warning',
      error: 'status.error'
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
        />
        <Text color="text.secondary">{statusText[connectionStatus]}</Text>
      </HStack>
    )
  }

  return (
    <Box minH="100vh" bg={{ base: 'white', _dark: '#1a1a1a' }} color={{ base: 'black', _dark: 'white' }}>
      {/* Header */}
      <Box
        as="header"
        p={4}
        bg={{ base: 'gray.50', _dark: '#2d2d2d' }}
        borderBottom="1px solid"
        borderColor={{ base: 'gray.200', _dark: '#404040' }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg" color={{ base: 'blue.600', _dark: '#61dafb' }}>
            Wireshark+ Web Dashboard
          </Heading>
          <Box display="flex" alignItems="center" gap={4}>
            {getConnectionIndicator()}
            <Text fontSize="sm">
              Packets: {packets.length}
            </Text>
            <Text fontSize="sm">
              Rate: {packetRate} pps
            </Text>
            <Sparkline data={trafficHistory} width={120} height={30} />
            <ThemeToggle />
          </Box>
        </Box>
      </Box>

      {/* Capture Controls */}
      <Box m={4} p={4} bg={{ base: 'white', _dark: '#2d2d2d' }} borderRadius="lg" border="1px solid" borderColor={{ base: 'gray.200', _dark: '#404040' }}>
        <Heading size="md" mb={4}>
          Capture Settings
        </Heading>
        <Box display="flex" flexDirection="column" gap={4}>
          <Box display="flex" gap={4} flexWrap="wrap">
            <Box minW="200px">
              <Text fontSize="sm" fontWeight="500" mb={2}>
                Network Interface:
              </Text>
              <select
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                disabled={settingsLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  backgroundColor: 'inherit',
                  color: 'inherit'
                }}
              >
                <option value="">Select interface...</option>
                {interfaces.map((iface) => (
                  <option key={iface.name} value={iface.name}>
                    {iface.name} {iface.description && `(${iface.description})`}
                  </option>
                ))}
              </select>
            </Box>

            <Box minW="200px">
              <Text fontSize="sm" fontWeight="500" mb={2}>
                BPF Filter:
              </Text>
              <input
                type="text"
                value={bpfFilter}
                onChange={(e) => setBpfFilter(e.target.value)}
                placeholder="e.g., port 80 or tcp"
                disabled={settingsLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  backgroundColor: 'inherit',
                  color: 'inherit'
                }}
              />
            </Box>

            <Box display="flex" alignItems="end">
              <button
                onClick={handleSettingsUpdate}
                disabled={settingsLoading || !selectedInterface}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: settingsLoading || !selectedInterface ? 'not-allowed' : 'pointer',
                  opacity: settingsLoading || !selectedInterface ? 0.6 : 1
                }}
              >
                {settingsLoading ? 'Applying...' : 'Apply Settings'}
              </button>
            </Box>
          </Box>

          {currentSettings.iface && (
            <Box
              p={3}
              bg={{ base: 'blue.50', _dark: 'rgba(97, 218, 251, 0.1)' }}
              borderRadius="md"
              border="1px solid"
              borderColor={{ base: 'blue.200', _dark: '#404040' }}
            >
              <Text fontSize="sm">
                <Text as="span" fontWeight="600" color={{ base: 'blue.600', _dark: '#61dafb' }}>
                  Current:
                </Text>{' '}
                Interface: {currentSettings.iface}
                {currentSettings.bpf && `, Filter: ${currentSettings.bpf}`}
              </Text>
            </Box>
          )}

          {settingsError && (
            <Box
              p={3}
              bg={{ base: 'red.50', _dark: 'rgba(239, 68, 68, 0.1)' }}
              borderRadius="md"
              border="1px solid"
              borderColor={{ base: 'red.200', _dark: '#ef4444' }}
              color={{ base: 'red.700', _dark: '#fca5a5' }}
            >
              <Text fontSize="sm">Error: {settingsError}</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Box m={4} p={4} bg={{ base: 'white', _dark: '#2d2d2d' }} borderRadius="lg" border="1px solid" borderColor={{ base: 'gray.200', _dark: '#404040' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md" color={{ base: 'orange.600', _dark: '#fbbf24' }}>
              Recent Alerts
            </Heading>
            {alertFilter && (
              <button
                onClick={clearAlertFilter}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer'
                }}
              >
                Clear Filter
              </button>
            )}
          </Box>
          <Box display="flex" flexDirection="column" gap={3}>
            {alerts.slice(0, 3).map((alert, index) => (
              <Box
                key={index}
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
                border={alertFilter?.alert === alert ? '2px solid #61dafb' : '1px solid transparent'}
                _hover={{ transform: 'translateX(2px)' }}
                transition="all 0.2s"
              >
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {formatTimestamp(alert.timestamp || Date.now() / 1000)}
                    </Text>
                    <Text fontSize="sm">
                      {alert.message}
                    </Text>
                  </Box>
                  {alert.meta && (
                    <Box textAlign="right">
                      <Text fontSize="xs" color="gray.500">
                        Z-score: {alert.meta.z_score?.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Count: {alert.meta.packet_count}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
            
            {alertFilter && (
              <Box
                p={3}
                bg={{ base: 'blue.50', _dark: 'rgba(97, 218, 251, 0.1)' }}
                borderRadius="md"
                border="1px solid"
                borderColor={{ base: 'blue.200', _dark: '#61dafb' }}
                textAlign="center"
              >
                <Text fontSize="sm" color={{ base: 'blue.600', _dark: '#61dafb' }}>
                  Showing packets from {new Date(alertFilter.start).toLocaleTimeString()} to {new Date(alertFilter.end).toLocaleTimeString()}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Main Content */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 400px' }} gap={4} p={4} minH="calc(100vh - 200px)">
        {/* Packets Section */}
        <GridItem>
          <Card variant="outline" h="full">
            <CardHeader>
              <Heading size="md" color="text.primary">
                Live Packets
              </Heading>
            </CardHeader>
            <CardBody p={0}>
              <TableContainer maxH="600px" overflowY="auto">
                <Table variant="wireshark" size="sm">
                  <Thead position="sticky" top={0} zIndex={1}>
                    <Tr>
                      <Th>Time</Th>
                      <Th>Source</Th>
                      <Th>Destination</Th>
                      <Th>Protocol</Th>
                      <Th>Length</Th>
                      <Th>Ports</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredPackets.map((packet, index) => (
                      <Tr
                        key={index}
                        bg={selectedPacket === packet ? 'brand.500' : undefined}
                        color={selectedPacket === packet ? 'white' : undefined}
                        onClick={() => handlePacketSelect(packet)}
                        cursor="pointer"
                        _hover={{
                          bg: selectedPacket === packet ? 'brand.600' : 'bg.accent',
                        }}
                        transition="background-color 0.2s"
                      >
                        <Td fontSize="xs">{formatTimestamp(packet.ts)}</Td>
                        <Td fontSize="xs">{packet.src}</Td>
                        <Td fontSize="xs">{packet.dst}</Td>
                        <Td fontSize="xs">
                          <Badge colorScheme="blue" size="sm">
                            {packet.proto}
                          </Badge>
                        </Td>
                        <Td fontSize="xs">{packet.length}</Td>
                        <Td fontSize="xs">
                          {packet.sport && packet.dport 
                            ? `${packet.sport} → ${packet.dport}` 
                            : '-'
                          }
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
              
              {filteredPackets.length === 0 && packets.length > 0 && alertFilter && (
                <Box p={8} textAlign="center">
                  <Text color="text.muted" fontStyle="italic">
                    No packets found in the selected time window
                  </Text>
                </Box>
              )}
              
              {packets.length === 0 && (
                <Box p={8} textAlign="center">
                  <Text color="text.muted" fontStyle="italic">
                    {connectionStatus === 'connected' 
                      ? 'Waiting for packets...' 
                      : 'Not connected to packet stream'
                    }
                  </Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Packet Detail Section */}
        {selectedPacket && (
          <GridItem>
            <Card variant="outline" h="full">
              <CardHeader>
                <Heading size="md" color="text.primary">
                  Packet Details
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Packet Information */}
                  <VStack spacing={3} align="stretch">
                    <HStack>
                      <Text fontWeight="600" color="text.accent" minW="100px">
                        Timestamp:
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        {formatTimestamp(selectedPacket.ts)}
                      </Text>
                    </HStack>
                    
                    <HStack>
                      <Text fontWeight="600" color="text.accent" minW="100px">
                        Source:
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        {selectedPacket.src}
                        {selectedPacket.sport && `:${selectedPacket.sport}`}
                      </Text>
                    </HStack>
                    
                    <HStack>
                      <Text fontWeight="600" color="text.accent" minW="100px">
                        Destination:
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        {selectedPacket.dst}
                        {selectedPacket.dport && `:${selectedPacket.dport}`}
                      </Text>
                    </HStack>
                    
                    <HStack>
                      <Text fontWeight="600" color="text.accent" minW="100px">
                        Protocol:
                      </Text>
                      <Badge colorScheme="blue">
                        {selectedPacket.proto}
                      </Badge>
                    </HStack>
                    
                    <HStack>
                      <Text fontWeight="600" color="text.accent" minW="100px">
                        Length:
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        {selectedPacket.length} bytes
                      </Text>
                    </HStack>
                    
                    <VStack align="stretch">
                      <Text fontWeight="600" color="text.accent">
                        Summary:
                      </Text>
                      <Box
                        p={3}
                        bg="bg.primary"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="border.primary"
                        fontFamily="mono"
                        fontSize="xs"
                        lineHeight="1.4"
                        wordBreak="break-all"
                        color="text.secondary"
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
                    >
                      Explain Packet
                    </Button>

                    {aiResponse && (
                      <Card variant="outline">
                        <CardHeader pb={2}>
                          <HStack>
                            <Heading size="sm" color={aiResponse.error ? 'status.error' : 'status.success'}>
                              AI Analysis
                            </Heading>
                            {aiResponse.is_mock && (
                              <Badge colorScheme="orange" size="sm">
                                Mock
                              </Badge>
                            )}
                            {aiResponse.error && (
                              <Badge colorScheme="red" size="sm">
                                Error
                              </Badge>
                            )}
                          </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <Box
                            p={3}
                            bg={aiResponse.error ? 'alert.error.bg' : 'bg.primary'}
                            borderRadius="md"
                            border="1px solid"
                            borderColor={aiResponse.error ? 'status.error' : 'border.primary'}
                            fontSize="sm"
                            lineHeight="1.6"
                            color={aiResponse.error ? 'status.error' : 'text.secondary'}
                            whiteSpace="pre-wrap"
                            wordBreak="break-word"
                            maxH="300px"
                            overflowY="auto"
                          >
                            {aiResponse.explanation}
                          </Box>
                          
                          {aiResponse.error && (
                            <Alert status="warning" mt={3} size="sm">
                              <AlertIcon />
                              <AlertDescription fontSize="xs">
                                If this error persists, try selecting a different packet or check the server logs.
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        )}
      </Grid>
    </Box>
  )
}

export default App
