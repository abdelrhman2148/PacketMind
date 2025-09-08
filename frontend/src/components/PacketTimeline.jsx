import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Tooltip,
  Badge,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useTheme
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayback } from '../hooks/usePlayback'
import { slideAnimations, scaleAnimations, buttonAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)

const PacketTimeline = ({
  packets = [],
  onTimeChange = () => {},
  onSelectionChange = () => {},
  onBookmarkAdd = () => {},
  onBookmarkRemove = () => {},
  showBookmarks = true,
  showAnomalies = true,
  showProtocolBands = true,
  showThumbnails = false,
  height = 120,
  enableSelection = true,
  enableBookmarks = true,
  autoPlay = false,
  playbackSpeed = 1,
  ...props
}) => {
  const theme = useTheme()
  const timelineRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [hoveredTime, setHoveredTime] = useState(null)
  const [hoveredPacket, setHoveredPacket] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState(0)

  // Initialize playback hook
  const {
    isPlaying,
    currentTime,
    duration,
    seekTo,
    togglePlayback,
    formatTime,
    getProgress,
    selectedRange,
    setSelectionRange
  } = usePlayback(packets, {
    autoPlay,
    defaultSpeed: playbackSpeed,
    onTimeUpdate: onTimeChange,
    onBookmarkReached: (bookmark) => console.log('Bookmark reached:', bookmark),
    onAnomalyDetected: (anomaly) => console.log('Anomaly detected:', anomaly)
  })

  // Protocol color mapping
  const protocolColors = {
    'TCP': '#06B6D4',
    'UDP': '#10B981',
    'HTTP': '#F59E0B',
    'HTTPS': '#EF4444',
    'DNS': '#8B5CF6',
    'ICMP': '#EC4899',
    'ARP': '#84CC16',
    'TLS': '#EF4444',
    'SSH': '#059669',
    'FTP': '#DC2626',
    'SMTP': '#7C3AED',
    'default': '#9CA3AF'
  }

  // Calculate timeline segments for visualization
  const timelineSegments = useMemo(() => {
    if (!packets.length || duration === 0) return []

    const segmentDuration = duration / 1000 // Divide timeline into 1000 segments
    const segments = []

    for (let i = 0; i < 1000; i++) {
      const segmentStart = i * segmentDuration
      const segmentEnd = (i + 1) * segmentDuration
      
      const segmentPackets = packets.filter(packet => 
        packet.ts >= segmentStart && packet.ts < segmentEnd
      )

      if (segmentPackets.length > 0) {
        // Get dominant protocol
        const protocolCounts = {}
        segmentPackets.forEach(packet => {
          protocolCounts[packet.proto] = (protocolCounts[packet.proto] || 0) + 1
        })
        
        const dominantProtocol = Object.entries(protocolCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'default'

        // Check for anomalies
        const hasAnomalies = segmentPackets.some(p => p.isAnomaly)
        
        segments.push({
          index: i,
          startTime: segmentStart,
          endTime: segmentEnd,
          packetCount: segmentPackets.length,
          dominantProtocol,
          hasAnomalies,
          intensity: Math.min(segmentPackets.length / 10, 1) // Normalize intensity
        })
      }
    }

    return segments
  }, [packets, duration])

  // Get bookmarks from packets
  const bookmarks = useMemo(() => {
    return packets
      .filter(packet => packet.isBookmarked)
      .map(packet => ({
        timestamp: packet.ts,
        label: packet.bookmarkLabel || `Packet ${packet.id}`,
        type: packet.bookmarkType || 'user',
        packet
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [packets])

  // Convert timeline position to time
  const positionToTime = useCallback((x) => {
    if (!timelineRef.current) return 0
    
    const rect = timelineRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (x - rect.left) / rect.width))
    return (percentage * duration) / zoom + offset
  }, [duration, zoom, offset])

  // Convert time to timeline position
  const timeToPosition = useCallback((time) => {
    if (!timelineRef.current) return 0
    
    const rect = timelineRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, ((time - offset) * zoom) / duration))
    return percentage * rect.width
  }, [duration, zoom, offset])

  // Handle mouse/touch events
  const handleMouseDown = useCallback((event) => {
    const clientX = event.clientX || event.touches?.[0]?.clientX
    const time = positionToTime(clientX)
    
    if (event.shiftKey && enableSelection) {
      // Start selection
      setIsSelecting(true)
      setSelectionStart(time)
      setSelectionEnd(time)
    } else {
      // Seek to position
      setIsDragging(true)
      seekTo(time)
    }
  }, [positionToTime, seekTo, enableSelection])

  const handleMouseMove = useCallback((event) => {
    const clientX = event.clientX || event.touches?.[0]?.clientX
    const time = positionToTime(clientX)
    
    setHoveredTime(time)
    
    // Find packet closest to hovered time
    const closestPacket = packets.reduce((closest, packet) => {
      const currentDistance = Math.abs(packet.ts - time)
      const closestDistance = Math.abs(closest?.ts - time) || Infinity
      return currentDistance < closestDistance ? packet : closest
    }, null)
    setHoveredPacket(closestPacket)

    if (isDragging) {
      seekTo(time)
    } else if (isSelecting) {
      setSelectionEnd(time)
    }
  }, [positionToTime, packets, isDragging, isSelecting, seekTo])

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd)
      const end = Math.max(selectionStart, selectionEnd)
      setSelectionRange(start, end)
      onSelectionChange({ start, end })
    }
    
    setIsDragging(false)
    setIsSelecting(false)
  }, [isSelecting, selectionStart, selectionEnd, setSelectionRange, onSelectionChange])

  // Handle double-click for bookmarks
  const handleDoubleClick = useCallback((event) => {
    if (!enableBookmarks) return
    
    const clientX = event.clientX || event.touches?.[0]?.clientX
    const time = positionToTime(clientX)
    
    // Find packet closest to clicked time
    const closestPacket = packets.reduce((closest, packet) => {
      const currentDistance = Math.abs(packet.ts - time)
      const closestDistance = Math.abs(closest?.ts - time) || Infinity
      return currentDistance < closestDistance ? packet : closest
    }, null)
    
    if (closestPacket) {
      if (closestPacket.isBookmarked) {
        onBookmarkRemove(closestPacket)
      } else {
        onBookmarkAdd(closestPacket, { timestamp: time, label: `Bookmark at ${formatTime(time)}` })
      }
    }
  }, [enableBookmarks, positionToTime, packets, formatTime, onBookmarkAdd, onBookmarkRemove])

  // Zoom and pan controls
  const handleWheel = useCallback((event) => {
    event.preventDefault()
    
    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(1, Math.min(10, zoom * zoomFactor))
      setZoom(newZoom)
    } else {
      // Pan
      const panAmount = (event.deltaX || event.deltaY) * (duration / 1000)
      const newOffset = Math.max(0, Math.min(duration * (1 - 1/zoom), offset + panAmount))
      setOffset(newOffset)
    }
  }, [zoom, offset, duration])

  // Event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()
    
    if (isDragging || isSelecting) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('touchmove', handleGlobalMouseMove)
      document.addEventListener('touchend', handleGlobalMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalMouseMove)
      document.removeEventListener('touchend', handleGlobalMouseUp)
    }
  }, [isDragging, isSelecting, handleMouseMove, handleMouseUp])

  // Timeline segment component
  const TimelineSegment = ({ segment, index }) => (
    <Box
      key={segment.index}
      position="absolute"
      left={`${(segment.index / 1000) * 100}%`}
      width={`${(1 / 1000) * 100}%`}
      height="40px"
      bg={protocolColors[segment.dominantProtocol] || protocolColors.default}
      opacity={0.3 + (segment.intensity * 0.7)}
      borderRadius="1px"
      cursor="pointer"
      onClick={() => seekTo(segment.startTime)}
      _hover={{
        opacity: 0.8,
        transform: 'scaleY(1.1)'
      }}
      transition="all 0.2s ease"
    >
      {segment.hasAnomalies && (
        <Box
          position="absolute"
          top="-2px"
          left="50%"
          transform="translateX(-50%)"
          w="4px"
          h="4px"
          bg="red.500"
          borderRadius="50%"
          boxShadow="0 0 4px rgba(239, 68, 68, 0.8)"
        />
      )}
    </Box>
  )

  // Bookmark marker component
  const BookmarkMarker = ({ bookmark }) => (
    <Tooltip
      label={`${bookmark.label} - ${formatTime(bookmark.timestamp)}`}
      placement="top"
      hasArrow
    >
      <Box
        position="absolute"
        left={`${((bookmark.timestamp - offset) * zoom / duration) * 100}%`}
        top="0"
        transform="translateX(-50%)"
        cursor="pointer"
        onClick={() => seekTo(bookmark.timestamp)}
        onDoubleClick={() => onBookmarkRemove(bookmark.packet)}
      >
        <MotionBox
          w="12px"
          h="12px"
          bg="yellow.400"
          clipPath="polygon(50% 0%, 0% 100%, 100% 100%)"
          variants={scaleAnimations}
          initial="initial"
          animate="animate"
          whileHover="hover"
          _hover={{
            bg: 'yellow.300',
            transform: 'scale(1.2)'
          }}
        />
      </Box>
    </Tooltip>
  )

  // Progress indicator
  const currentPosition = ((currentTime - offset) * zoom / duration) * 100

  return (
    <MotionVStack
      spacing={3}
      align="stretch"
      variants={slideAnimations.slideInUp}
      initial="initial"
      animate="animate"
      {...props}
    >
      {/* Timeline Header */}
      <HStack justify="space-between" align="center">
        <HStack spacing={3}>
          <Text fontSize="sm" fontWeight="bold" color="netflix.white">
            Timeline
          </Text>
          <Badge
            colorScheme={isPlaying ? 'green' : 'gray'}
            variant="solid"
            px={2}
            py={1}
          >
            {isPlaying ? 'Playing' : 'Paused'}
          </Badge>
          <Text fontSize="xs" color="netflix.silver">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </HStack>

        <HStack spacing={2}>
          {/* Zoom controls */}
          <Text fontSize="xs" color="netflix.silver">
            Zoom: {zoom.toFixed(1)}x
          </Text>
          <IconButton
            size="xs"
            variant="ghost"
            color="netflix.silver"
            icon={<Text fontSize="xs">−</Text>}
            onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            _hover={{ color: 'netflix.white' }}
          />
          <IconButton
            size="xs"
            variant="ghost"
            color="netflix.silver"
            icon={<Text fontSize="xs">+</Text>}
            onClick={() => setZoom(Math.min(10, zoom + 0.5))}
            _hover={{ color: 'netflix.white' }}
          />
        </HStack>
      </HStack>

      {/* Main Timeline */}
      <Box
        ref={timelineRef}
        position="relative"
        height={`${height}px`}
        bg="rgba(31, 31, 31, 0.8)"
        borderRadius="8px"
        border="1px solid rgba(255, 255, 255, 0.1)"
        cursor="crosshair"
        overflow="hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
      >
        {/* Protocol bands */}
        {showProtocolBands && (
          <Box position="absolute" top="0" left="0" right="0" bottom="0">
            {timelineSegments.map((segment, index) => (
              <TimelineSegment key={segment.index} segment={segment} index={index} />
            ))}
          </Box>
        )}

        {/* Selection overlay */}
        {selectedRange && (
          <Box
            position="absolute"
            left={`${((selectedRange.start - offset) * zoom / duration) * 100}%`}
            width={`${((selectedRange.end - selectedRange.start) * zoom / duration) * 100}%`}
            top="0"
            bottom="0"
            bg="rgba(6, 182, 212, 0.3)"
            border="2px solid #06B6D4"
            borderRadius="4px"
            pointerEvents="none"
          />
        )}

        {/* Current selection (while selecting) */}
        {isSelecting && selectionStart !== null && selectionEnd !== null && (
          <Box
            position="absolute"
            left={`${((Math.min(selectionStart, selectionEnd) - offset) * zoom / duration) * 100}%`}
            width={`${((Math.abs(selectionEnd - selectionStart)) * zoom / duration) * 100}%`}
            top="0"
            bottom="0"
            bg="rgba(6, 182, 212, 0.2)"
            border="1px dashed #06B6D4"
            borderRadius="4px"
            pointerEvents="none"
          />
        )}

        {/* Bookmarks */}
        {showBookmarks && bookmarks.map((bookmark, index) => (
          <BookmarkMarker key={index} bookmark={bookmark} />
        ))}

        {/* Current time indicator */}
        <AnimatePresence>
          <MotionBox
            position="absolute"
            left={`${currentPosition}%`}
            top="0"
            bottom="0"
            w="2px"
            bg="netflix.red"
            boxShadow="0 0 8px rgba(229, 9, 20, 0.8)"
            transform="translateX(-50%)"
            variants={scaleAnimations}
            initial="initial"
            animate="animate"
          >
            {/* Playhead */}
            <Box
              position="absolute"
              top="-6px"
              left="50%"
              transform="translateX(-50%)"
              w="12px"
              h="12px"
              bg="netflix.red"
              borderRadius="50%"
              border="2px solid white"
              cursor="grab"
              _active={{ cursor: 'grabbing' }}
            />
          </MotionBox>
        </AnimatePresence>

        {/* Hover indicator */}
        {hoveredTime !== null && hoveredPacket && (
          <Tooltip
            label={
              <VStack spacing={1} align="start">
                <Text fontSize="xs" fontWeight="bold">
                  {hoveredPacket.proto} Packet
                </Text>
                <Text fontSize="xs">
                  {hoveredPacket.src} → {hoveredPacket.dst}
                </Text>
                <Text fontSize="xs">
                  Time: {formatTime(hoveredTime)}
                </Text>
                <Text fontSize="xs">
                  Size: {hoveredPacket.length}B
                </Text>
              </VStack>
            }
            placement="top"
            hasArrow
            isOpen={true}
          >
            <Box
              position="absolute"
              left={`${((hoveredTime - offset) * zoom / duration) * 100}%`}
              top="0"
              bottom="0"
              w="1px"
              bg="rgba(255, 255, 255, 0.6)"
              transform="translateX(-50%)"
              pointerEvents="none"
            />
          </Tooltip>
        )}

        {/* Time ruler */}
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          height="20px"
          bg="rgba(0, 0, 0, 0.5)"
          borderTop="1px solid rgba(255, 255, 255, 0.2)"
        >
          {/* Time markers */}
          {Array.from({ length: 11 }, (_, i) => {
            const time = (i / 10) * (duration / zoom) + offset
            return (
              <Box
                key={i}
                position="absolute"
                left={`${i * 10}%`}
                top="0"
                bottom="0"
                borderLeft="1px solid rgba(255, 255, 255, 0.3)"
              >
                <Text
                  position="absolute"
                  left="4px"
                  top="2px"
                  fontSize="10px"
                  color="netflix.silver"
                  whiteSpace="nowrap"
                >
                  {formatTime(time)}
                </Text>
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Timeline Controls */}
      <HStack spacing={4} justify="center">
        <Text fontSize="xs" color="netflix.silver" w="60px">
          {formatTime(currentTime)}
        </Text>
        
        <Box flex={1} px={4}>
          <Slider
            value={(currentTime / duration) * 100 || 0}
            onChange={(value) => seekTo((value / 100) * duration)}
            size="sm"
          >
            <SliderTrack bg="rgba(255, 255, 255, 0.2)">
              <SliderFilledTrack bg="netflix.red" />
            </SliderTrack>
            <SliderThumb
              boxSize={4}
              bg="netflix.red"
              border="2px solid white"
              _focus={{ boxShadow: '0 0 0 3px rgba(229, 9, 20, 0.3)' }}
            />
          </Slider>
        </Box>
        
        <Text fontSize="xs" color="netflix.silver" w="60px" textAlign="right">
          {formatTime(duration)}
        </Text>
      </HStack>
    </MotionVStack>
  )
}

export default PacketTimeline