import { useState, useEffect, useRef } from 'react'
import { Box, Heading, Text } from '@chakra-ui/react'
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

  // WebSocket connection management with automatic reconnection
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/packets')
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully')
        setConnectionStatus('connected')
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        
        try {
          wsRef.current.send('ping')
        } catch (error) {
          console.warn('Failed to send initial ping:', error)
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          if (event.data === 'pong') {
            console.debug('Received pong from server')
            return
          }
          
          const data = JSON.parse(event.data)
          
          if (data.type === 'alert') {
            setAlerts(prev => [data, ...prev.slice(0, 9)])
          } else if (data.type === 'connection_status') {
            console.log('Connection status:', data.message)
          } else if (data.type === 'error') {
            console.error('Server error:', data.message)
            setConnectionStatus('error')
          } else if (data.type === 'config_change') {
            console.log('Configuration changed:', data)
            setCurrentSettings({
              iface: data.interface || '',
              bpf: data.bpf_filter || ''
            })
          } else {
            setPackets(prev => {
              const maxPackets = 500
              const dropThreshold = 450
              
              if (prev.length >= dropThreshold) {
                const keepCount = Math.floor(maxPackets * 0.7)
                const newPackets = [data, ...prev.slice(0, keepCount)]
                return newPackets
              } else {
                const newPackets = [data, ...prev.slice(0, maxPackets - 1)]
                return newPackets
              }
            })
            
            packetCountRef.current += 1
            const now = Date.now()
            const timeDiff = now - lastRateUpdateRef.current
            
            if (timeDiff >= 1000) {
              const rate = Math.round((packetCountRef.current * 1000) / timeDiff)
              setPacketRate(rate)
              
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
        
        let reconnectDelay = 3000
        
        if (event.code === 1006) {
          reconnectDelay = 1000
        } else if (event.code === 1000) {
          reconnectDelay = 5000
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          setConnectionStatus('reconnecting')
          connectWebSocket()
        }, reconnectDelay)
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        
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
      
      setTimeout(() => {
        console.log('Retrying WebSocket connection after creation error...')
        setConnectionStatus('reconnecting')
        connectWebSocket()
      }, 5000)
    }
  }

  // Load available interfaces on component mount
  const loadInterfaces = async () => {
    try {
      const interfaceList = await getInterfaces()
      setInterfaces(interfaceList)
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
      setSettingsError(null)
      
    } catch (error) {
      console.error('Failed to update capture settings:', error)
      
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
    setAiResponse(null)
  }

  // Handle AI explanation request
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
      const windowStart = alert.meta.window_start * 1000
      const windowEnd = windowStart + 60000
      
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
      connected: '#4ade80',
      disconnected: '#ef4444',
      reconnecting: '#f59e0b',
      error: '#ef4444'
    }
    
    const statusText = {
      connected: 'Connected',
      disconnected: 'Disconnected',
      reconnecting: 'Reconnecting...',
      error: 'Connection Error'
    }
    
    return (
      <Box display="flex" alignItems="center" gap={2} fontSize="sm">
        <Box
          w="8px"
          h="8px"
          borderRadius="50%"
          bg={statusColors[connectionStatus]}
        />
        <Text>{statusText[connectionStatus]}</Text>
      </Box>
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
            <Text fontSize="sm">Packets: {packets.length}</Text>
            <Text fontSize="sm">Rate: {packetRate} pps</Text>
            <Sparkline data={trafficHistory} width={120} height={30} />
            <ThemeToggle />
          </Box>
        </Box>
      </Box>

      {/* Simple demonstration of Chakra UI theming */}
      <Box p={4} textAlign="center">
        <Heading size="md" mb={4} color={{ base: 'gray.700', _dark: 'gray.200' }}>
          Modern UI with Chakra UI & Theme System
        </Heading>
        <Text mb={4} color={{ base: 'gray.600', _dark: 'gray.400' }}>
          This demonstrates the integration of Chakra UI with dark/light mode theming.
          The theme toggle in the header switches between modes.
        </Text>
        <Box 
          p={4} 
          bg={{ base: 'blue.50', _dark: 'blue.900' }} 
          borderRadius="lg" 
          border="1px solid" 
          borderColor={{ base: 'blue.200', _dark: 'blue.700' }}
          maxW="md"
          mx="auto"
        >
          <Text fontWeight="600" color={{ base: 'blue.800', _dark: 'blue.200' }}>
            Theme-aware Component
          </Text>
          <Text fontSize="sm" color={{ base: 'blue.600', _dark: 'blue.300' }}>
            This box changes colors based on the current theme mode.
          </Text>
        </Box>
      </Box>

      {/* Basic packet display */}
      <Box p={4}>
        <Heading size="md" mb={4}>Live Packets ({packets.length})</Heading>
        <Box 
          bg={{ base: 'white', _dark: '#2d2d2d' }} 
          borderRadius="lg" 
          border="1px solid" 
          borderColor={{ base: 'gray.200', _dark: '#404040' }}
          p={4}
          maxH="400px"
          overflowY="auto"
        >
          {packets.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              {connectionStatus === 'connected' 
                ? 'Waiting for packets...' 
                : 'Not connected to packet stream'
              }
            </Text>
          ) : (
            <Box>
              {packets.slice(0, 10).map((packet, index) => (
                <Box 
                  key={index}
                  p={3}
                  mb={2}
                  bg={{ base: 'gray.50', _dark: '#374151' }}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => handlePacketSelect(packet)}
                  border={selectedPacket === packet ? '2px solid' : '1px solid'}
                  borderColor={selectedPacket === packet ? 'blue.500' : 'transparent'}
                  _hover={{ bg: { base: 'gray.100', _dark: '#4b5563' } }}
                >
                  <Text fontSize="sm" fontWeight="600">
                    {packet.src} → {packet.dst} ({packet.proto})
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {formatTimestamp(packet.ts)} | Length: {packet.length} bytes
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Selected packet details */}
      {selectedPacket && (
        <Box p={4}>
          <Heading size="md" mb={4}>Packet Details</Heading>
          <Box 
            bg={{ base: 'white', _dark: '#2d2d2d' }} 
            borderRadius="lg" 
            border="1px solid" 
            borderColor={{ base: 'gray.200', _dark: '#404040' }}
            p={4}
          >
            <Text mb={2}><strong>Summary:</strong> {selectedPacket.summary}</Text>
            <button
              onClick={handleExplainPacket}
              disabled={aiLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#10b981',
                color: 'white',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.6 : 1,
                marginTop: '8px'
              }}
            >
              {aiLoading ? 'Analyzing...' : 'Explain Packet'}
            </button>
            
            {aiResponse && (
              <Box 
                mt={4}
                p={3}
                bg={aiResponse.error ? { base: 'red.50', _dark: 'rgba(239, 68, 68, 0.1)' } : { base: 'green.50', _dark: 'rgba(16, 185, 129, 0.1)' }}
                borderRadius="md"
                border="1px solid"
                borderColor={aiResponse.error ? 'red.200' : 'green.200'}
              >
                <Text fontWeight="600" mb={2} color={aiResponse.error ? 'red.700' : 'green.700'}>
                  AI Analysis {aiResponse.is_mock && '(Mock)'} {aiResponse.error && '- Error'}
                </Text>
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {aiResponse.explanation}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default App