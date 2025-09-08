import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Collapse,
  useDisclosure
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import PacketTimeline from './PacketTimeline'
import PlaybackControls from './PlaybackControls'
import { BookmarkManager, AnomalyIndicators } from './TimelineMarkers'
import { TimelineManager } from '../utils/timelineManager'
import { slideAnimations, fadeAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)

const TimelineView = ({
  packets = [],
  selectedPackets = [],
  isCapturing = false,
  onPacketSelect = () => {},
  onPacketFilter = () => {},
  onExport = () => {},
  onTimelineExport = () => {},
  searchFilters = {},
  className = '',
  ...props
}) => {
  const [timelineManager] = useState(() => new TimelineManager())
  const [bookmarks, setBookmarks] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [selectedRange, setSelectedRange] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const { isOpen: isAdvancedOpen, onToggle: onAdvancedToggle } = useDisclosure()
  
  const toast = useToast()

  // Initialize timeline data when packets change
  useEffect(() => {
    if (packets.length > 0) {
      // Clear existing data
      timelineManager.clearTimeline()
      
      // Add packets to timeline
      packets.forEach(packet => {
        timelineManager.addPacket({
          ...packet,
          timestamp: packet.ts || Date.now() / 1000,
          id: packet.id || packet.ts,
          source: packet.src,
          destination: packet.dst,
          protocol: packet.proto,
          length: packet.length,
          summary: packet.summary || `${packet.proto} packet from ${packet.src} to ${packet.dst}`,
          isAnomaly: packet.isAnomaly || false,
          isBookmarked: packet.isBookmarked || false
        })
      })

      // Detect anomalies
      const detectedAnomalies = timelineManager.detectAnomalies()
      setAnomalies(detectedAnomalies.map(anomaly => ({
        ...anomaly,
        severity: anomaly.severity || 'medium',
        category: anomaly.category || 'network',
        title: anomaly.title || 'Network Anomaly',
        description: anomaly.description || 'Unusual network activity detected'
      })))

      // Load bookmarks from packets
      const packetBookmarks = packets
        .filter(packet => packet.isBookmarked)
        .map(packet => ({
          timestamp: packet.ts,
          label: packet.bookmarkLabel || `${packet.proto} - ${packet.src}`,
          description: packet.bookmarkDescription || packet.summary,
          type: packet.bookmarkType || 'user',
          color: packet.bookmarkColor || '#F59E0B',
          packet
        }))
      
      setBookmarks(packetBookmarks)
    }
  }, [packets, timelineManager])

  // Format time for display
  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 1000)
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
    } else {
      return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`
    }
  }, [])

  // Handle time change from timeline
  const handleTimeChange = useCallback((time) => {
    setCurrentTime(time)
    
    // Find packets at current time
    const packetsAtTime = timelineManager.getPacketsAtTime(time, 0.1) // 100ms tolerance
    if (packetsAtTime.length > 0) {
      // Select the closest packet
      const closestPacket = packetsAtTime.reduce((closest, packet) => {
        const currentDistance = Math.abs(packet.timestamp - time)
        const closestDistance = Math.abs(closest.timestamp - time)
        return currentDistance < closestDistance ? packet : closest
      })
      onPacketSelect(closestPacket)
    }
  }, [timelineManager, onPacketSelect])

  // Handle bookmark operations
  const handleBookmarkAdd = useCallback((bookmark) => {
    const newBookmark = {
      ...bookmark,
      id: Date.now(),
      created: Date.now()
    }
    
    setBookmarks(prev => [...prev, newBookmark])
    
    // Add to timeline manager
    timelineManager.addBookmark(newBookmark)
    
    toast({
      title: 'Bookmark Added',
      description: `Bookmark "${bookmark.label}" added at ${formatTime(bookmark.timestamp)}`,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }, [timelineManager, toast, formatTime])

  const handleBookmarkEdit = useCallback((bookmark) => {
    setBookmarks(prev => prev.map(b => 
      b.timestamp === bookmark.timestamp ? { ...b, ...bookmark } : b
    ))
    
    toast({
      title: 'Bookmark Updated',
      description: `Bookmark "${bookmark.label}" has been updated`,
      status: 'info',
      duration: 3000,
      isClosable: true
    })
  }, [toast])

  const handleBookmarkDelete = useCallback((bookmark) => {
    setBookmarks(prev => prev.filter(b => 
      !(b.timestamp === bookmark.timestamp && b.label === bookmark.label)
    ))
    
    // Remove from timeline manager
    timelineManager.removeBookmark(bookmark.timestamp)
    
    toast({
      title: 'Bookmark Deleted',
      description: `Bookmark "${bookmark.label}" has been removed`,
      status: 'warning',
      duration: 3000,
      isClosable: true
    })
  }, [timelineManager, toast])

  const handleBookmarkJump = useCallback((timestamp) => {
    setCurrentTime(timestamp)
    handleTimeChange(timestamp)
  }, [handleTimeChange])

  // Handle selection change
  const handleSelectionChange = useCallback((range) => {
    setSelectedRange(range)
  }, [])

  // Handle anomaly click
  const handleAnomalyClick = useCallback((anomaly) => {
    setCurrentTime(anomaly.timestamp)
    handleTimeChange(anomaly.timestamp)
    
    toast({
      title: 'Anomaly Selected',
      description: `Jumped to ${anomaly.title} at ${formatTime(anomaly.timestamp)}`,
      status: 'info',
      duration: 3000,
      isClosable: true
    })
  }, [handleTimeChange, toast, formatTime])

  // Handle anomaly details
  const handleAnomalyDetails = useCallback((anomaly) => {
    // This could open a detailed modal or panel
    console.log('Anomaly details:', anomaly)
    
    toast({
      title: anomaly.title,
      description: anomaly.description,
      status: 'warning',
      duration: 5000,
      isClosable: true
    })
  }, [toast])

  // Handle timeline export
  const handleTimelineExport = useCallback(async (startTime = null, endTime = null) => {
    setIsExporting(true)
    setExportProgress(0)
    
    try {
      const start = startTime || (selectedRange?.start ?? 0)
      const end = endTime || (selectedRange?.end ?? timelineManager.getTimeline().length)
      
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Export timeline segment
      const exportData = timelineManager.exportTimelineSegment(start, end, {
        includeBookmarks: true,
        includeAnomalies: true,
        includeStatistics: true,
        format: 'json'
      })

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      clearInterval(progressInterval)
      setExportProgress(100)
      
      // Call external export handler
      onTimelineExport({
        data: exportData,
        startTime: start,
        endTime: end,
        bookmarks: bookmarks.filter(b => b.timestamp >= start && b.timestamp <= end),
        anomalies: anomalies.filter(a => a.timestamp >= start && a.timestamp <= end),
        filename: `timeline_${start.toFixed(3)}_${end.toFixed(3)}.json`
      })
      
      toast({
        title: 'Export Complete',
        description: `Timeline segment (${formatTime(start)} - ${formatTime(end)}) exported successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export timeline segment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }, [selectedRange, timelineManager, bookmarks, anomalies, onTimelineExport, toast, formatTime])

  // Timeline statistics
  const timelineStats = useMemo(() => {
    if (packets.length === 0) return null
    
    return timelineManager.getStatistics()
  }, [packets, timelineManager])

  // No packets state
  if (packets.length === 0) {
    return (
      <MotionBox
        variants={fadeAnimations}
        initial="initial"
        animate="animate"
        className={className}
        {...props}
      >
        <Alert status="info" bg="rgba(6, 182, 212, 0.1)" border="1px solid rgba(6, 182, 212, 0.3)">
          <AlertIcon color="blue.400" />
          <AlertDescription color="netflix.white">
            {isCapturing 
              ? 'Timeline will appear when packets are captured...'
              : 'No packet data available. Start capturing to view timeline.'
            }
          </AlertDescription>
        </Alert>
      </MotionBox>
    )
  }

  return (
    <MotionVStack
      spacing={4}
      align="stretch"
      variants={slideAnimations.slideInUp}
      initial="initial"
      animate="animate"
      className={className}
      {...props}
    >
      {/* Timeline Header */}
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Text fontSize="lg" fontWeight="bold" color="netflix.white">
            Packet Timeline
          </Text>
          <HStack spacing={4} fontSize="sm" color="netflix.silver">
            <Text>{packets.length} packets</Text>
            {timelineStats && (
              <>
                <Text>•</Text>
                <Text>{formatTime(timelineStats.duration)} duration</Text>
                <Text>•</Text>
                <Text>{timelineStats.protocols.length} protocols</Text>
              </>
            )}
            {bookmarks.length > 0 && (
              <>
                <Text>•</Text>
                <Text>{bookmarks.length} bookmarks</Text>
              </>
            )}
            {anomalies.length > 0 && (
              <>
                <Text>•</Text>
                <Text color="red.400">{anomalies.length} anomalies</Text>
              </>
            )}
          </HStack>
        </VStack>

        <HStack spacing={2}>
          {selectedRange && (
            <Button
              size="sm"
              variant="netflixSecondary"
              onClick={() => handleTimelineExport()}
              isLoading={isExporting}
              loadingText={`${exportProgress}%`}
            >
              Export Selection
            </Button>
          )}
          
          <Button
            size="sm"
            variant="netflixSecondary"
            onClick={onAdvancedToggle}
          >
            {isAdvancedOpen ? 'Hide' : 'Show'} Details
          </Button>
        </HStack>
      </HStack>

      {/* Main Timeline */}
      <PacketTimeline
        packets={packets}
        onTimeChange={handleTimeChange}
        onSelectionChange={handleSelectionChange}
        onBookmarkAdd={handleBookmarkAdd}
        onBookmarkRemove={handleBookmarkDelete}
        showBookmarks={true}
        showAnomalies={true}
        showProtocolBands={true}
        height={120}
        enableSelection={true}
        enableBookmarks={true}
        autoPlay={false}
        playbackSpeed={playbackSpeed}
      />

      {/* Playback Controls */}
      <PlaybackControls
        packets={packets}
        onTimeChange={handleTimeChange}
        onSpeedChange={setPlaybackSpeed}
        onBookmarkJump={handleBookmarkJump}
        onExportSegment={handleTimelineExport}
        showAdvancedControls={true}
        showKeyboardShortcuts={true}
        enableLooping={true}
        enableVolumeControl={false}
        compactMode={false}
        autoPlay={false}
        defaultSpeed={1}
      />

      {/* Advanced Details Panel */}
      <AnimatePresence>
        {isAdvancedOpen && (
          <MotionBox
            variants={slideAnimations.slideInDown}
            initial="initial"
            animate="animate"
            exit="initial"
          >
            <Tabs variant="enclosed" colorScheme="red">
              <TabList bg="rgba(31, 31, 31, 0.8)">
                <Tab color="netflix.silver" _selected={{ color: 'netflix.white', bg: 'netflix.red' }}>
                  Bookmarks ({bookmarks.length})
                </Tab>
                <Tab color="netflix.silver" _selected={{ color: 'netflix.white', bg: 'netflix.red' }}>
                  Anomalies ({anomalies.length})
                </Tab>
                <Tab color="netflix.silver" _selected={{ color: 'netflix.white', bg: 'netflix.red' }}>
                  Statistics
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel bg="rgba(31, 31, 31, 0.8)" border="1px solid rgba(255, 255, 255, 0.1)">
                  <BookmarkManager
                    bookmarks={bookmarks}
                    onBookmarkAdd={handleBookmarkAdd}
                    onBookmarkEdit={handleBookmarkEdit}
                    onBookmarkDelete={handleBookmarkDelete}
                    onBookmarkJump={handleBookmarkJump}
                    currentTime={currentTime}
                    formatTime={formatTime}
                  />
                </TabPanel>

                <TabPanel bg="rgba(31, 31, 31, 0.8)" border="1px solid rgba(255, 255, 255, 0.1)">
                  <AnomalyIndicators
                    anomalies={anomalies}
                    onAnomalyClick={handleAnomalyClick}
                    onAnomalyDetails={handleAnomalyDetails}
                    showSeverity={true}
                    showCategories={true}
                    formatTime={formatTime}
                  />
                </TabPanel>

                <TabPanel bg="rgba(31, 31, 31, 0.8)" border="1px solid rgba(255, 255, 255, 0.1)">
                  {timelineStats && (
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" color="netflix.silver">Total Duration</Text>
                          <Text fontSize="lg" color="netflix.white" fontWeight="bold">
                            {formatTime(timelineStats.duration)}
                          </Text>
                        </VStack>
                        
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" color="netflix.silver">Avg Packet Rate</Text>
                          <Text fontSize="lg" color="wireshark.accent" fontWeight="bold">
                            {timelineStats.averagePacketRate.toFixed(1)}/s
                          </Text>
                        </VStack>
                        
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" color="netflix.silver">Total Bytes</Text>
                          <Text fontSize="lg" color="netflix.white" fontWeight="bold">
                            {(timelineStats.totalBytes / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        </VStack>
                      </HStack>

                      <Box>
                        <Text fontSize="sm" color="netflix.silver" mb={2}>Protocol Distribution</Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {timelineStats.protocols.map(protocol => (
                            <Box
                              key={protocol.name}
                              p={2}
                              bg="rgba(255, 255, 255, 0.1)"
                              borderRadius="6px"
                              border="1px solid rgba(255, 255, 255, 0.2)"
                            >
                              <Text fontSize="xs" color="netflix.white" fontWeight="bold">
                                {protocol.name}
                              </Text>
                              <Text fontSize="xs" color="netflix.silver">
                                {protocol.count} packets ({protocol.percentage.toFixed(1)}%)
                              </Text>
                            </Box>
                          ))}
                        </HStack>
                      </Box>
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </MotionBox>
        )}
      </AnimatePresence>
    </MotionVStack>
  )
}

export default TimelineView