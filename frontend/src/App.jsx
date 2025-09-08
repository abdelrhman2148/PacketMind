import { useState, useEffect, useRef } from 'react'
import { Box, Heading, Text } from '@chakra-ui/react'
import { explainPacket, getInterfaces, updateCaptureSettings } from './api'
import Sparkline from './components/Sparkline'
import ThemeToggle from './components/ThemeToggle'
import NetflixHeader from './components/NetflixHeader'
import NetflixHeroSection from './components/NetflixHeroSection'
import NetflixPacketCards from './components/NetflixPacketCards'
import useRealTimeStats from './hooks/useRealTimeStats'

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

  // Initialize real-time stats hook
  const realTimeStats = useRealTimeStats(packets, connectionStatus)

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

  // Handle navigation clicks from Netflix header
  const handleNavigation = (navId) => {
    console.log('Navigation clicked:', navId)
    // Add navigation logic here as needed
  }

  // Handle settings button click
  const handleSettings = () => {
    console.log('Settings clicked')
    // Add settings modal logic here
  }

  // Handle about button click
  const handleAbout = () => {
    console.log('About clicked')
    // Add about modal logic here
  }

  // Handle hero section actions
  const handleStartCapture = async () => {
    console.log('Start capture clicked')
    // Add start capture logic here
    if (selectedInterface) {
      await handleSettingsUpdate()
    }
  }

  const handleStopCapture = () => {
    console.log('Stop capture clicked')
    // Add stop capture logic here
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  const handleOpenAnalytics = () => {
    console.log('Analytics clicked')
    // Add analytics view logic here
  }

  return (
    <Box minH="100vh" bg="netflix.black" color="netflix.white">
      {/* Netflix-Style Header */}
      <NetflixHeader
        connectionStatus={connectionStatus}
        currentInterface={currentSettings.iface || selectedInterface}
        packetCount={packets.length}
        onNavigation={handleNavigation}
        onSettings={handleSettings}
        onAbout={handleAbout}
      />

      {/* Main Content Area with Netflix Styling */}
      <Box pt={4} px={{ base: 4, md: 8 }}>
        {/* Netflix-Style Hero Section */}
        <NetflixHeroSection
          connectionStatus={connectionStatus}
          packetCount={packets.length}
          packetRate={realTimeStats.currentRate}
          currentInterface={currentSettings.iface || selectedInterface}
          isCapturing={realTimeStats.isCapturing}
          onStartCapture={handleStartCapture}
          onStopCapture={handleStopCapture}
          onOpenSettings={handleSettings}
          onOpenAnalytics={handleOpenAnalytics}
          trafficHistory={realTimeStats.trafficHistory}
          alerts={alerts}
        />

        {/* Netflix-Style Packet Cards */}
        <Box mb={8}>
          <NetflixPacketCards
            packets={packets}
            isCapturing={realTimeStats.isCapturing}
          />
        </Box>

        {/* Live Packets Section */}
        <Box mb={8}>
          <Heading 
            size="lg" 
            mb={6} 
            color="netflix.white"
            fontWeight="bold"
            letterSpacing="-0.025em"
          >
            Live Network Traffic
          </Heading>
          <Box 
            bg="rgba(31, 31, 31, 0.95)"
            borderRadius="16px"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            p={6}
            maxH="500px"
            overflowY="auto"
            boxShadow="netflix"
            backdropFilter="blur(20px)"
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(10, 10, 10, 0.3)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            {packets.length === 0 ? (
              <Box textAlign="center" py={12}>
                <Text 
                  color="netflix.silver" 
                  fontSize="lg" 
                  mb={2}
                  fontWeight="medium"
                >
                  {connectionStatus === 'connected' 
                    ? 'Monitoring network traffic...' 
                    : 'Establishing connection to packet stream'
                  }
                </Text>
                <Text color="rgba(179, 179, 179, 0.7)" fontSize="sm">
                  {connectionStatus === 'connected' 
                    ? 'Packets will appear here in real-time' 
                    : 'Please check your connection status'
                  }
                </Text>
              </Box>
            ) : (
              <Box>
                {packets.slice(0, 10).map((packet, index) => (
                  <Box 
                    key={index}
                    p={4}
                    mb={3}
                    bg={selectedPacket === packet 
                      ? 'rgba(6, 182, 212, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)'
                    }
                    borderRadius="12px"
                    cursor="pointer"
                    onClick={() => handlePacketSelect(packet)}
                    border="1px solid"
                    borderColor={selectedPacket === packet 
                      ? 'rgba(6, 182, 212, 0.5)' 
                      : 'rgba(255, 255, 255, 0.1)'
                    }
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{ 
                      bg: selectedPacket === packet 
                        ? 'rgba(6, 182, 212, 0.15)' 
                        : 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(6, 182, 212, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <Text 
                      fontSize="sm" 
                      fontWeight="600"
                      color="netflix.white"
                      mb={2}
                    >
                      {packet.src} → {packet.dst} ({packet.proto})
                    </Text>
                    <Text 
                      fontSize="xs" 
                      color="netflix.silver"
                      opacity={0.8}
                    >
                      {formatTimestamp(packet.ts)} | Length: {packet.length} bytes
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Selected Packet Details */}
        {selectedPacket && (
          <Box>
            <Heading 
              size="lg" 
              mb={6} 
              color="netflix.white"
              fontWeight="bold"
              letterSpacing="-0.025em"
            >
              Packet Analysis
            </Heading>
            <Box 
              bg="rgba(31, 31, 31, 0.95)"
              borderRadius="16px"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              p={6}
              boxShadow="netflix"
              backdropFilter="blur(20px)"
            >
              <Text 
                mb={4}
                color="netflix.white"
                fontSize="md"
                fontWeight="medium"
              >
                <Text as="span" color="wireshark.accent" fontWeight="bold">
                  Summary:
                </Text>{' '}
                {selectedPacket.summary}
              </Text>
              
              <Box
                as="button"
                onClick={handleExplainPacket}
                disabled={aiLoading}
                px={6}
                py={3}
                borderRadius="8px"
                bg={aiLoading 
                  ? 'rgba(229, 9, 20, 0.5)' 
                  : 'linear-gradient(135deg, #E50914 0%, #DC143C 50%, #B20710 100%)'
                }
                color="netflix.white"
                fontWeight="semibold"
                cursor={aiLoading ? 'not-allowed' : 'pointer'}
                opacity={aiLoading ? 0.6 : 1}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                border="none"
                boxShadow="0 4px 15px rgba(229, 9, 20, 0.3)"
                _hover={!aiLoading ? {
                  transform: 'translateY(-2px) scale(1.02)',
                  boxShadow: '0 8px 25px rgba(229, 9, 20, 0.5)'
                } : {}}
                _active={!aiLoading ? {
                  transform: 'translateY(0) scale(1)'
                } : {}}
              >
                {aiLoading ? 'Analyzing with AI...' : 'Explain with AI'}
              </Box>
              
              {aiResponse && (
                <Box 
                  mt={6}
                  p={4}
                  bg={aiResponse.error 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : 'rgba(16, 185, 129, 0.1)'
                  }
                  borderRadius="12px"
                  border="1px solid"
                  borderColor={aiResponse.error 
                    ? 'rgba(239, 68, 68, 0.3)' 
                    : 'rgba(16, 185, 129, 0.3)'
                  }
                  backdropFilter="blur(10px)"
                >
                  <Text 
                    fontWeight="600" 
                    mb={3} 
                    color={aiResponse.error ? '#FCA5A5' : '#6EE7B7'}
                    fontSize="md"
                  >
                    AI Analysis {aiResponse.is_mock && '(Demo Mode)'} {aiResponse.error && '- Analysis Failed'}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    whiteSpace="pre-wrap"
                    color="netflix.white"
                    lineHeight="1.6"
                  >
                    {aiResponse.explanation}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default App