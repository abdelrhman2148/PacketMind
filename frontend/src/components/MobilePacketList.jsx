import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  Collapse,
  useDisclosure,
  Skeleton,
  SkeletonText
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useSwipeNavigation, 
  usePullToRefresh, 
  useLongPress, 
  useMobileDetection 
} from '../hooks/useMobileGestures'
import { 
  listItemAnimations, 
  slideAnimations, 
  scaleAnimations,
  buttonAnimations 
} from '../animations/transitions'

const MotionBox = motion(Box)
const MotionButton = motion(Button)

const MobilePacketList = ({
  packets = [],
  isCapturing = false,
  searchQuery = '',
  activeFilters = {},
  onPacketSelect = () => {},
  onPacketFilter = () => {},
  onPacketExport = () => {},
  onRefresh = () => {},
  maxDisplayPackets = 50,
  autoScroll = true,
  enableVirtualization = true
}) => {
  const [selectedPackets, setSelectedPackets] = useState(new Set())
  const [expandedPacket, setExpandedPacket] = useState(null)
  const [viewMode, setViewMode] = useState('compact') // 'compact', 'detailed', 'minimal'
  const { isOpen: isSelectionMode, onToggle: toggleSelectionMode } = useDisclosure()
  
  const { isMobile, orientation, screenSize } = useMobileDetection()
  const listRef = useRef(null)
  const virtualScrollRef = useRef({
    startIndex: 0,
    endIndex: 50,
    itemHeight: 80,
    containerHeight: 0
  })

  // Pull to refresh functionality
  const {
    touchHandlers: refreshHandlers,
    isRefreshing,
    pullDistance,
    canRefresh,
    progress
  } = usePullToRefresh(onRefresh, {
    threshold: 80,
    maxDistance: 120,
    refreshThreshold: 60
  })

  // Format timestamp for mobile display
  const formatMobileTimestamp = useCallback((ts) => {
    const date = new Date(ts * 1000)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) { // Less than 1 minute
      return `${Math.floor(diff / 1000)}s ago`
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`
    } else if (date.toDateString() === now.toDateString()) { // Same day
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }, [])

  // Get protocol color and icon
  const getProtocolStyle = useCallback((protocol) => {
    const styles = {
      'TCP': { color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.2)', icon: '🔗' },
      'UDP': { color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)', icon: '📡' },
      'HTTP': { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)', icon: '🌐' },
      'HTTPS': { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)', icon: '🔒' },
      'DNS': { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.2)', icon: '🔍' },
      'ICMP': { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.2)', icon: '📍' },
      'ARP': { color: '#84CC16', bg: 'rgba(132, 204, 22, 0.2)', icon: '🎯' }
    }
    return styles[protocol] || { 
      color: '#9CA3AF', 
      bg: 'rgba(156, 163, 175, 0.2)', 
      icon: '📦' 
    }
  }, [])

  // Handle packet selection
  const handlePacketSelect = useCallback((packet, isLongPress = false) => {
    if (isSelectionMode || isLongPress) {
      setSelectedPackets(prev => {
        const newSelection = new Set(prev)
        const packetId = packet.ts || packet.id
        
        if (newSelection.has(packetId)) {
          newSelection.delete(packetId)
        } else {
          newSelection.add(packetId)
        }
        
        return newSelection
      })
      
      // Haptic feedback
      if (navigator.vibrate && isMobile) {
        navigator.vibrate(25)
      }
    } else {
      onPacketSelect(packet)
    }
  }, [isSelectionMode, isMobile, onPacketSelect])

  // Handle packet expansion
  const handlePacketExpand = useCallback((packetId) => {
    setExpandedPacket(expandedPacket === packetId ? null : packetId)
  }, [expandedPacket])

  // Long press handler
  const { touchHandlers: longPressHandlers } = useLongPress(
    (event) => {
      const packetElement = event.target.closest('[data-packet-id]')
      if (packetElement) {
        const packetId = packetElement.dataset.packetId
        const packet = packets.find(p => (p.ts || p.id) === packetId)
        if (packet) {
          toggleSelectionMode()
          handlePacketSelect(packet, true)
        }
      }
    },
    { delay: 500, moveThreshold: 15 }
  )

  // Virtual scrolling optimization for large packet lists
  const visiblePackets = useMemo(() => {
    if (!enableVirtualization || packets.length <= maxDisplayPackets) {
      return packets.slice(0, maxDisplayPackets)
    }
    
    const { startIndex, endIndex } = virtualScrollRef.current
    return packets.slice(startIndex, Math.min(endIndex, packets.length))
  }, [packets, enableVirtualization, maxDisplayPackets])

  // Packet item component
  const PacketItem = ({ packet, index, isSelected = false, isExpanded = false }) => {
    const protocolStyle = getProtocolStyle(packet.proto)
    const packetId = packet.ts || packet.id
    const timestamp = formatMobileTimestamp(packet.ts)

    return (
      <MotionBox
        data-packet-id={packetId}
        variants={listItemAnimations}
        initial="hidden"
        animate="visible"
        exit="exit"
        custom={index}
        layout
      >
        <Box
          p={viewMode === 'minimal' ? 3 : 4}
          bg={isSelected ? 'rgba(229, 9, 20, 0.2)' : 'rgba(31, 31, 31, 0.8)'}
          borderRadius="12px"
          border="1px solid"
          borderColor={isSelected ? 'rgba(229, 9, 20, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
          cursor="pointer"
          onClick={() => handlePacketSelect(packet)}
          {...longPressHandlers}
          _active={{
            transform: 'scale(0.98)',
            bg: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <VStack align="stretch" spacing={viewMode === 'minimal' ? 2 : 3}>
            {/* Header Row */}
            <HStack justify="space-between" align="center">
              <HStack spacing={3} flex={1} minW={0}>
                {/* Protocol Badge */}
                <Badge
                  bg={protocolStyle.bg}
                  color={protocolStyle.color}
                  px={2}
                  py={1}
                  borderRadius="6px"
                  fontSize="xs"
                  fontWeight="bold"
                  flexShrink={0}
                >
                  {protocolStyle.icon} {packet.proto}
                </Badge>
                
                {/* Source and Destination */}
                <VStack align="start" spacing={0} flex={1} minW={0}>
                  <HStack spacing={2} w="100%" minW={0}>
                    <Text
                      fontSize="sm"
                      color="netflix.white"
                      fontWeight="medium"
                      noOfLines={1}
                      flex={1}
                      minW={0}
                    >
                      {packet.src}
                    </Text>
                    <Text fontSize="xs" color="netflix.silver">
                      →
                    </Text>
                    <Text
                      fontSize="sm"
                      color="wireshark.accent"
                      fontWeight="medium"
                      noOfLines={1}
                      flex={1}
                      minW={0}
                    >
                      {packet.dst}
                    </Text>
                  </HStack>
                  
                  {/* Ports */}
                  {(packet.sport || packet.dport) && (
                    <HStack spacing={2} fontSize="xs" color="netflix.silver">
                      {packet.sport && <Text>:{packet.sport}</Text>}
                      {packet.sport && packet.dport && <Text>→</Text>}
                      {packet.dport && <Text>:{packet.dport}</Text>}
                    </HStack>
                  )}
                </VStack>
              </HStack>
              
              {/* Timestamp and Actions */}
              <VStack align="end" spacing={1} flexShrink={0}>
                <Text fontSize="xs" color="netflix.silver">
                  {timestamp}
                </Text>
                {packet.length && (
                  <Text fontSize="xs" color="netflix.silver">
                    {packet.length}B
                  </Text>
                )}
              </VStack>
            </HStack>

            {/* Detailed view content */}
            {viewMode === 'detailed' && (
              <VStack align="stretch" spacing={2}>
                {/* Packet Summary */}
                <Text
                  fontSize="sm"
                  color="netflix.silver"
                  noOfLines={isExpanded ? undefined : 2}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePacketExpand(packetId)
                  }}
                >
                  {packet.summary}
                </Text>
                
                {/* Quick Actions */}
                <HStack spacing={2} pt={2}>
                  <Button
                    size="xs"
                    variant="netflixSecondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPacketFilter(packet)
                    }}
                  >
                    Filter
                  </Button>
                  <Button
                    size="xs"
                    variant="netflixSecondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPacketExport(packet)
                    }}
                  >
                    Export
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePacketExpand(packetId)
                    }}
                  >
                    {isExpanded ? 'Less' : 'More'}
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>

          {/* Selection indicator */}
          {isSelected && (
            <Box
              position="absolute"
              top={2}
              right={2}
              w={4}
              h={4}
              bg="netflix.red"
              borderRadius="50%"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="xs" color="white">
                ✓
              </Text>
            </Box>
          )}
        </Box>
      </MotionBox>
    )
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <VStack spacing={3}>
      {[...Array(5)].map((_, index) => (
        <Box
          key={index}
          p={4}
          bg="rgba(31, 31, 31, 0.5)"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          w="100%"
        >
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <HStack spacing={3} flex={1}>
                <Skeleton height="20px" width="60px" borderRadius="6px" />
                <VStack align="start" spacing={1} flex={1}>
                  <Skeleton height="14px" width="80%" />
                  <Skeleton height="12px" width="60%" />
                </VStack>
              </HStack>
              <VStack align="end" spacing={1}>
                <Skeleton height="12px" width="50px" />
                <Skeleton height="12px" width="40px" />
              </VStack>
            </HStack>
          </VStack>
        </Box>
      ))}
    </VStack>
  )

  // Pull to refresh indicator
  const PullToRefreshIndicator = () => (
    <MotionBox
      position="absolute"
      top={0}
      left="50%"
      transform="translateX(-50%)"
      zIndex={10}
      variants={scaleAnimations.scaleIn}
      initial="initial"
      animate={pullDistance > 20 ? "animate" : "initial"}
    >
      <VStack spacing={2} py={4}>
        <Box
          w="40px"
          h="40px"
          borderRadius="50%"
          bg={canRefresh ? 'green.500' : 'netflix.silver'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          transform={`rotate(${progress * 360}deg)`}
          transition="all 0.3s ease"
        >
          <Text color="white" fontSize="lg">
            {canRefresh ? '✓' : '↻'}
          </Text>
        </Box>
        <Text fontSize="sm" color="netflix.silver">
          {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
        </Text>
      </VStack>
    </MotionBox>
  )

  return (
    <Box position="relative" h="100%" overflow="hidden">
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {pullDistance > 0 && <PullToRefreshIndicator />}
      </AnimatePresence>

      {/* View mode and selection controls */}
      <HStack
        justify="space-between"
        align="center"
        p={4}
        bg="rgba(10, 10, 10, 0.9)"
        backdropFilter="blur(10px)"
        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
        position="sticky"
        top={0}
        zIndex={5}
      >
        <HStack spacing={2}>
          <Text fontSize="sm" color="netflix.silver">
            {packets.length} packets
            {selectedPackets.size > 0 && ` • ${selectedPackets.size} selected`}
          </Text>
        </HStack>
        
        <HStack spacing={2}>
          {/* View mode toggle */}
          <Button
            size="sm"
            variant="netflixSecondary"
            onClick={() => {
              const modes = ['minimal', 'compact', 'detailed']
              const currentIndex = modes.indexOf(viewMode)
              const nextMode = modes[(currentIndex + 1) % modes.length]
              setViewMode(nextMode)
            }}
          >
            {viewMode === 'minimal' ? '▫️' : viewMode === 'compact' ? '▪️' : '◼️'}
          </Button>
          
          {/* Selection mode toggle */}
          {selectedPackets.size > 0 || isSelectionMode ? (
            <Button
              size="sm"
              variant="netflixPrimary"
              onClick={() => {
                setSelectedPackets(new Set())
                toggleSelectionMode()
              }}
            >
              Cancel ({selectedPackets.size})
            </Button>
          ) : (
            <Button
              size="sm"
              variant="netflixSecondary"
              onClick={toggleSelectionMode}
            >
              Select
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Packet list */}
      <Box
        ref={listRef}
        h="calc(100% - 80px)"
        overflowY="auto"
        p={4}
        {...refreshHandlers}
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '2px',
          },
        }}
        style={{
          transform: `translateY(${Math.min(pullDistance, 80)}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none'
        }}
      >
        {isRefreshing ? (
          <LoadingSkeleton />
        ) : packets.length === 0 ? (
          <Box
            textAlign="center"
            py={12}
            color="netflix.silver"
          >
            <Text fontSize="lg" mb={2}>
              No packets to display
            </Text>
            <Text fontSize="sm">
              {isCapturing ? 'Waiting for network traffic...' : 'Start capturing to see packets'}
            </Text>
          </Box>
        ) : (
          <VStack spacing={3} pb={4}>
            <AnimatePresence>
              {visiblePackets.map((packet, index) => {
                const packetId = packet.ts || packet.id
                return (
                  <PacketItem
                    key={packetId}
                    packet={packet}
                    index={index}
                    isSelected={selectedPackets.has(packetId)}
                    isExpanded={expandedPacket === packetId}
                  />
                )
              })}
            </AnimatePresence>
            
            {/* Load more indicator */}
            {packets.length > visiblePackets.length && (
              <Button
                variant="netflixSecondary"
                size="sm"
                onClick={() => {
                  virtualScrollRef.current.endIndex += 25
                }}
              >
                Load more ({packets.length - visiblePackets.length} remaining)
              </Button>
            )}
          </VStack>
        )}
      </Box>
    </Box>
  )
}

export default MobilePacketList