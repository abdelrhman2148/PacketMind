import { useState, useEffect, useRef } from 'react'
import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { explainPacket, getInterfaces, updateCaptureSettings } from './api'
import { ThemeToggle } from './components/ThemeProvider'
import NetflixHeader from './components/NetflixHeader'
import NetflixHeroSection from './components/NetflixHeroSection'
import NetflixPacketCards from './components/NetflixPacketCards'
import NetflixPacketModal from './components/NetflixPacketModal'
import PacketDetailsSidebar from './components/PacketDetailsSidebar'
import NetflixCharts from './components/NetflixCharts'
import LoadingSpinner, { NetflixLoader } from './components/LoadingSpinner'
import NetflixSearchBar from './components/NetflixSearchBar'
import AdvancedFilterPanel from './components/AdvancedFilterPanel'
import FilterTags from './components/FilterTags'
import MobileNavigation from './components/MobileNavigation'
import MobilePacketList from './components/MobilePacketList'
import TimelineView from './components/TimelineView'
import AIChatInterface from './components/AIChatInterface'
import useRealTimeStats from './hooks/useRealTimeStats'
import { useSearch } from './hooks/useSearch'
import { useMobileDetection } from './hooks/useMobileGestures'
import './styles/mobile.css'

const MotionBox = motion(Box)

function App() {
  const [packets, setPackets] = useState([])
  const [selectedPacket, setSelectedPacket] = useState(null)
  const [isPacketModalOpen, setIsPacketModalOpen] = useState(false)
  const [isPacketSidebarOpen, setIsPacketSidebarOpen] = useState(false)
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
  const [currentView, setCurrentView] = useState('home') // 'home', 'timeline', 'analytics', etc.
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const packetCountRef = useRef(0)
  const lastRateUpdateRef = useRef(Date.now())

  // Initialize real-time stats hook
  const realTimeStats = useRealTimeStats(packets, connectionStatus)

  // Mobile detection
  const { isMobile, isTablet } = useMobileDetection()

  // Initialize search and filter functionality
  const {
    searchQuery,
    isSearching,
    searchResults,
    searchHistory,
    suggestions,
    showSuggestions,
    activeFilters,
    savedFilters,
    activeFilterCount,
    handleSearchChange,
    executeSearch,
    clearSearch,
    setShowSuggestions,
    addFilter,
    removeFilter,
    clearAllFilters,
    saveFilterSet,
    loadFilterSet,
    deleteFilterSet,
    getQuickFilters
  } = useSearch(packets, {
    debounceDelay: 300,
    maxSuggestions: 10,
    maxHistory: 20,
    enableHistory: true,
    enableSuggestions: true
  })

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
    setIsPacketModalOpen(true)
  }

  // Handle packet selection for sidebar
  const handlePacketSelectSidebar = (packet) => {
    setSelectedPacket(packet)
    setAiResponse(null)
    setIsPacketSidebarOpen(true)
  }

  // Handle packet filter creation
  const handlePacketFilter = (packet) => {
    if (!packet) return
    
    // Add to search filters
    if (packet.proto) {
      addFilter('protocol', packet.proto)
    }
    if (packet.src) {
      addFilter('source', packet.src)
    }
    if (packet.dst) {
      addFilter('destination', packet.dst)
    }
    if (packet.sport) {
      addFilter('port', packet.sport)
    }
    if (packet.dport) {
      addFilter('port', packet.dport)
    }
    
    // Also create BPF filter for backend
    let bpfFilter = ''
    if (packet.src && packet.dst) {
      bpfFilter = `host ${packet.src} or host ${packet.dst}`
    }
    if (packet.proto) {
      bpfFilter = bpfFilter ? `${bpfFilter} and ${packet.proto.toLowerCase()}` : packet.proto.toLowerCase()
    }
    if (packet.sport || packet.dport) {
      const port = packet.sport || packet.dport
      bpfFilter = bpfFilter ? `${bpfFilter} and port ${port}` : `port ${port}`
    }
    
    setBpfFilter(bpfFilter)
    console.log('Created filters:', { searchFilters: activeFilters, bpfFilter })
  }

  // Handle packet export
  const handlePacketExport = (packet) => {
    if (!packet) return
    
    const exportData = {
      timestamp: new Date(packet.ts * 1000).toISOString(),
      source: packet.src,
      destination: packet.dst,
      protocol: packet.proto,
      sourcePort: packet.sport,
      destinationPort: packet.dport,
      length: packet.length,
      summary: packet.summary
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `packet_${packet.ts}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  // Filter packets based on alert filter and search results
  useEffect(() => {
    let basePackets = packets
    
    // Apply search/filter results if active
    if (searchQuery || activeFilterCount > 0) {
      basePackets = searchResults
    }
    
    // Apply alert filter on top of search results
    if (alertFilter) {
      const filtered = basePackets.filter(packet => {
        const packetTime = packet.ts * 1000
        return packetTime >= alertFilter.start && packetTime <= alertFilter.end
      })
      setFilteredPackets(filtered)
    } else {
      setFilteredPackets(basePackets)
    }
  }, [packets, alertFilter, searchResults, searchQuery, activeFilterCount])

  // Navigation handler
  const handleNavigation = (viewId) => {
    console.log('Navigation to:', viewId)
    setCurrentView(viewId)
    // Add navigation logic here as needed
  }

  // Timeline export handler
  const handleTimelineExport = (exportData) => {
    console.log('Timeline export:', exportData)
    
    // Create download
    const blob = new Blob([JSON.stringify(exportData.data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportData.filename || 'timeline_export.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
    <Box minH="100vh" bg="netflix.black" color="netflix.white" className="safe-area-all">
      {/* Mobile Navigation Wrapper */}
      {isMobile ? (
        <MobileNavigation
          connectionStatus={connectionStatus}
          packetCount={packets.length}
          currentInterface={currentSettings.iface || selectedInterface}
          isCapturing={realTimeStats.isCapturing}
          onNavigation={handleNavigation}
          onSettings={handleSettings}
          onAbout={handleAbout}
          onStartCapture={handleStartCapture}
          onStopCapture={handleStopCapture}
        >
          {/* Mobile Content */}
          <MobileAppContent />
        </MobileNavigation>
      ) : (
        /* Desktop Content */
        <DesktopAppContent />
      )}
    </Box>
  )

  // Mobile app content component
  function MobileAppContent() {
    // Render different views based on current navigation
    const renderMobileView = () => {
      switch (currentView) {
        case 'timeline':
          return (
            <Box px={4} pt={6} pb={4}>
              <TimelineView
                packets={filteredPackets}
                selectedPackets={selectedPacket ? [selectedPacket] : []}
                isCapturing={realTimeStats.isCapturing}
                onPacketSelect={handlePacketSelect}
                onPacketFilter={handlePacketFilter}
                onExport={handlePacketExport}
                onTimelineExport={handleTimelineExport}
                searchFilters={activeFilters}
              />
            </Box>
          )
        case 'analytics':
          return (
            <Box px={4} pt={6} pb={4}>
              <NetflixCharts
                packets={filteredPackets}
                isCapturing={realTimeStats.isCapturing}
                timeRange="5m"
                autoRefresh={true}
              />
            </Box>
          )
        case 'search':
          return (
            <Box px={4} pt={6} pb={4}>
              <VStack align="stretch" spacing={4}>
                <NetflixSearchBar
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  onSearch={executeSearch}
                  onClear={clearSearch}
                  suggestions={suggestions}
                  showSuggestions={showSuggestions}
                  onSuggestionSelect={(suggestion) => {
                    handleSearchChange(suggestion)
                    executeSearch(suggestion)
                  }}
                  searchHistory={searchHistory}
                  isSearching={isSearching}
                  placeholder="Search packets..."
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  isMobile={true}
                />
                <AdvancedFilterPanel
                  activeFilters={activeFilters}
                  onAddFilter={addFilter}
                  onRemoveFilter={removeFilter}
                  onClearAll={clearAllFilters}
                  savedFilters={savedFilters}
                  onSaveFilters={saveFilterSet}
                  onLoadFilters={loadFilterSet}
                  onDeleteFilters={deleteFilterSet}
                  getQuickFilters={getQuickFilters}
                  packets={packets}
                  isMobile={true}
                  defaultCollapsed={false}
                />
              </VStack>
            </Box>
          )
        case 'chat':
          return (
            <Box h="100vh" bg="netflix.black">
              <AIChatInterface
                packets={filteredPackets}
                selectedPackets={selectedPacket ? [selectedPacket] : []}
                onPacketSelect={handlePacketSelect}
                onAddPacketsToContext={(packets) => {
                  console.log('Adding packets to chat context:', packets)
                }}
                isFullscreen={true}
                isMobile={true}
              />
            </Box>
          )
        case 'packets':
        case 'home':
        default:
          return (
            <Box className="mobile-scroll">
              {/* Mobile Hero Section */}
              <Box px={4} pt={6} pb={4}>
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
                  isMobile={true}
                />
              </Box>

              {/* Mobile Search and Filter System */}
              <Box px={4} pb={4}>
                <VStack align="stretch" spacing={4}>
                  {/* Compact Search Bar */}
                  <NetflixSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearch={executeSearch}
                    onClear={clearSearch}
                    suggestions={suggestions}
                    showSuggestions={showSuggestions}
                    onSuggestionSelect={(suggestion) => {
                      handleSearchChange(suggestion)
                      executeSearch(suggestion)
                    }}
                    searchHistory={searchHistory}
                    isSearching={isSearching}
                    placeholder="Search packets..."
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    isMobile={true}
                  />

                  {/* Filter Tags - Horizontal scroll on mobile */}
                  {activeFilterCount > 0 && (
                    <Box className="mobile-horizontal-scroll">
                      <FilterTags
                        activeFilters={activeFilters}
                        onRemoveFilter={removeFilter}
                        onClearAll={clearAllFilters}
                        getQuickFilters={getQuickFilters}
                        onQuickFilter={addFilter}
                        isMobile={true}
                      />
                    </Box>
                  )}

                  {/* Collapsible Advanced Filter Panel */}
                  <AdvancedFilterPanel
                    activeFilters={activeFilters}
                    onAddFilter={addFilter}
                    onRemoveFilter={removeFilter}
                    onClearAll={clearAllFilters}
                    savedFilters={savedFilters}
                    onSaveFilters={saveFilterSet}
                    onLoadFilters={loadFilterSet}
                    onDeleteFilters={deleteFilterSet}
                    getQuickFilters={getQuickFilters}
                    packets={packets}
                    isMobile={true}
                    defaultCollapsed={true}
                  />
                </VStack>
              </Box>

              {/* Mobile Packet List */}
              <Box h="calc(100vh - 400px)" minH="400px">
                <MobilePacketList
                  packets={filteredPackets}
                  isCapturing={realTimeStats.isCapturing}
                  searchQuery={searchQuery}
                  activeFilters={activeFilters}
                  onPacketSelect={handlePacketSelect}
                  onPacketFilter={handlePacketFilter}
                  onPacketExport={handlePacketExport}
                  onRefresh={async () => {
                    // Refresh functionality - could reload data or clear cache
                    console.log('Mobile refresh triggered')
                  }}
                />
              </Box>
            </Box>
          )
      }
    }

    return renderMobileView()
  }

  // Desktop app content component  
  function DesktopAppContent() {
    return (
      <>
        {/* Netflix-Style Header */}
        <NetflixHeader
          connectionStatus={connectionStatus}
          currentInterface={currentSettings.iface || selectedInterface}
          packetCount={packets.length}
          onNavigation={handleNavigation}
          onSettings={handleSettings}
          onAbout={handleAbout}
        />

        {/* Theme Toggle - Floating */}
        <Box
          position="fixed"
          top={4}
          right={4}
          zIndex={1001}
        >
          <ThemeToggle size="sm" iconOnly />
        </Box>

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

        {/* Netflix-Style Search and Filter System */}
        <Box mb={8}>
          <VStack align="stretch" spacing={6}>
            {/* Search Bar */}
            <NetflixSearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearch={executeSearch}
              onClear={clearSearch}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              onSuggestionSelect={(suggestion) => {
                handleSearchChange(suggestion)
                executeSearch(suggestion)
              }}
              searchHistory={searchHistory}
              isSearching={isSearching}
              placeholder="Search packets by IP, protocol, port, or content..."
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {/* Filter Tags - Show active filters */}
            {activeFilterCount > 0 && (
              <FilterTags
                activeFilters={activeFilters}
                onRemoveFilter={removeFilter}
                onClearAll={clearAllFilters}
                getQuickFilters={getQuickFilters}
                onQuickFilter={addFilter}
              />
            )}

            {/* Advanced Filter Panel */}
            <AdvancedFilterPanel
              activeFilters={activeFilters}
              onAddFilter={addFilter}
              onRemoveFilter={removeFilter}
              onClearAll={clearAllFilters}
              savedFilters={savedFilters}
              onSaveFilters={saveFilterSet}
              onLoadFilters={loadFilterSet}
              onDeleteFilters={deleteFilterSet}
              getQuickFilters={getQuickFilters}
              packets={packets}
            />
          </VStack>
        </Box>

        {/* Netflix-Style Packet Cards */}
        <Box mb={8}>
          <NetflixPacketCards
            packets={filteredPackets}
            isCapturing={realTimeStats.isCapturing}
            searchQuery={searchQuery}
            activeFilters={activeFilters}
          />
        </Box>

        {/* Netflix-Style Analytics Dashboard */}
        <Box mb={8}>
          <NetflixCharts
            packets={filteredPackets}
            isCapturing={realTimeStats.isCapturing}
            timeRange="5m"
            autoRefresh={true}
          />
        </Box>

        {/* Timeline and Playback Section */}
        <Box mb={8}>
          <TimelineView
            packets={filteredPackets}
            selectedPackets={selectedPacket ? [selectedPacket] : []}
            isCapturing={realTimeStats.isCapturing}
            onPacketSelect={handlePacketSelect}
            onPacketFilter={handlePacketFilter}
            onExport={handlePacketExport}
            onTimelineExport={handleTimelineExport}
            searchFilters={activeFilters}
          />
        </Box>

        {/* AI Chat Interface */}
        <Box mb={8}>
          <AIChatInterface
            packets={filteredPackets}
            selectedPackets={selectedPacket ? [selectedPacket] : []}
            onPacketSelect={handlePacketSelect}
            onAddPacketsToContext={(packets) => {
              console.log('Adding packets to chat context:', packets)
            }}
            isFullscreen={false}
            isMobile={false}
          />
        </Box>

        {/* Live Packets Section */}
        <Box mb={8}>
          <VStack align="stretch" spacing={4} mb={6}>
            <Heading 
              size="lg" 
              color="netflix.white"
              fontWeight="bold"
              letterSpacing="-0.025em"
            >
              {searchQuery || activeFilterCount > 0 ? (
                <>Filtered Network Traffic ({filteredPackets.length} packets)</>
              ) : (
                <>Live Network Traffic</>
              )}
            </Heading>
            <Text color="netflix.silver" fontSize="sm">
              💡 Click a packet to open detailed modal, double-click for sidebar view
              {(searchQuery || activeFilterCount > 0) && (
                <Text as="span" color="wireshark.accent" ml={2}>
                  • {filteredPackets.length} of {packets.length} packets shown
                </Text>
              )}
            </Text>
          </VStack>
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
            {filteredPackets.length === 0 ? (
              <Box textAlign="center" py={12}>
                {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
                  <NetflixLoader
                    variant="netflix"
                    size="md"
                    message="Connecting to packet stream..."
                    showMessage={true}
                  />
                ) : (
                  <>
                    <Text 
                      color="netflix.silver" 
                      fontSize="lg" 
                      mb={2}
                      fontWeight="medium"
                    >
                      {connectionStatus === 'connected' 
                        ? (searchQuery || activeFilterCount > 0 ? 'No packets match your search criteria' : 'Monitoring network traffic...') 
                        : 'Establishing connection to packet stream'
                      }
                    </Text>
                    <Text color="rgba(179, 179, 179, 0.7)" fontSize="sm">
                      {connectionStatus === 'connected' 
                        ? (searchQuery || activeFilterCount > 0 ? 'Try adjusting your search or filters' : 'Packets will appear here in real-time') 
                        : 'Please check your connection status'
                      }
                    </Text>
                  </>
                )}
              </Box>
            ) : (
              <Box>
                <AnimatePresence>
                  {filteredPackets.slice(0, 10).map((packet, index) => (
                    <MotionBox 
                      key={`${packet.ts}-${index}`}
                      p={4}
                      mb={3}
                      bg={selectedPacket === packet 
                        ? 'rgba(6, 182, 212, 0.1)' 
                        : 'rgba(255, 255, 255, 0.05)'
                      }
                      borderRadius="12px"
                      cursor="pointer"
                      onClick={() => handlePacketSelect(packet)}
                      onDoubleClick={() => handlePacketSelectSidebar(packet)}
                      border="1px solid"
                      borderColor={selectedPacket === packet 
                        ? 'rgba(6, 182, 212, 0.5)' 
                        : 'rgba(255, 255, 255, 0.1)'
                      }
                      title="Click to open modal, double-click for sidebar"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05
                      }}
                      whileHover={{
                        backgroundColor: selectedPacket === packet 
                          ? 'rgba(6, 182, 212, 0.15)' 
                          : 'rgba(255, 255, 255, 0.08)',
                        borderColor: 'rgba(6, 182, 212, 0.3)',
                        y: -2,
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                      }}
                      whileTap={{ scale: 0.98 }}
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
                    </MotionBox>
                  ))}
                </AnimatePresence>
              </Box>
            )}
          </Box>
        </Box>

        {/* Selected Packet Details */}
        <AnimatePresence>
          {selectedPacket && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
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
                
                <MotionBox
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
                  border="none"
                  boxShadow="0 4px 15px rgba(229, 9, 20, 0.3)"
                  whileHover={!aiLoading ? {
                    y: -2,
                    scale: 1.02,
                    boxShadow: '0 8px 25px rgba(229, 9, 20, 0.5)'
                  } : {}}
                  whileTap={!aiLoading ? {
                    y: 0,
                    scale: 1
                  } : {}}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                >
                  {aiLoading ? (
                    <Box display="flex" alignItems="center" gap={2}>
                      <NetflixLoader 
                        variant="minimal" 
                        size="xs" 
                        showMessage={false} 
                        isVisible={true}
                      />
                      <Text>Analyzing with AI...</Text>
                    </Box>
                  ) : (
                    'Explain with AI'
                  )}
                </MotionBox>
                
                <AnimatePresence>
                  {aiResponse && (
                    <MotionBox 
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
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
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
        
        {/* Netflix-Style Packet Modal */}
        <NetflixPacketModal
          isOpen={isPacketModalOpen}
          onClose={() => setIsPacketModalOpen(false)}
          packet={selectedPacket}
          onExplain={handleExplainPacket}
          onFilter={handlePacketFilter}
          onExport={handlePacketExport}
          aiResponse={aiResponse}
          aiLoading={aiLoading}
          relatedPackets={packets.filter(p => 
            p !== selectedPacket && 
            selectedPacket && (
              p.src === selectedPacket.src || 
              p.dst === selectedPacket.dst || 
              p.proto === selectedPacket.proto
            )
          ).slice(0, 5)}
        />
        
        {/* Packet Details Sidebar */}
        <PacketDetailsSidebar
          isOpen={isPacketSidebarOpen}
          onClose={() => setIsPacketSidebarOpen(false)}
          packet={selectedPacket}
          onExplain={handleExplainPacket}
          onFilter={handlePacketFilter}
          onExport={handlePacketExport}
          aiResponse={aiResponse}
          aiLoading={aiLoading}
          relatedPackets={packets.filter(p => 
            p !== selectedPacket && 
            selectedPacket && (
              p.src === selectedPacket.src || 
              p.dst === selectedPacket.dst || 
              p.proto === selectedPacket.proto
            )
          ).slice(0, 5)}
        />
        </Box>
      </>
    )
  }

}

export default App