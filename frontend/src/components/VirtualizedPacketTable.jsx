import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Badge,
  IconButton,
  Input,
  Select,
  useTheme
} from '@chakra-ui/react'
import { FixedSizeList as List } from 'react-window'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  optimizedMemo, 
  packetComparison, 
  useStableCallback,
  optimizeListRendering
} from '../utils/optimization'
import { useMobileDetection } from '../hooks/useMobileGestures'
import { useAccessibility } from '../hooks/useAccessibility'
import { useFocusManagement } from '../hooks/useFocusManagement'
import { slideAnimations, scaleAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionTr = motion(Tr)

// Virtual list item height
const ITEM_HEIGHT = 64
const HEADER_HEIGHT = 48
const OVERSCAN_COUNT = 5

// Optimized packet row component
const PacketRow = optimizedMemo(({ 
  index, 
  style, 
  data: { 
    packets, 
    selectedPacket, 
    onPacketSelect, 
    onPacketDoubleClick, 
    visibleColumns, 
    formatTimestamp,
    isMobile 
  } 
}) => {
  const packet = packets[index]
  const isSelected = selectedPacket && selectedPacket.ts === packet.ts
  const theme = useTheme()

  const handleClick = useStableCallback(() => {
    onPacketSelect(packet)
  }, [packet, onPacketSelect])

  const handleDoubleClick = useStableCallback(() => {
    onPacketDoubleClick(packet)
  }, [packet, onPacketDoubleClick])

  if (!packet) {
    return (
      <div style={style}>
        <Box h={ITEM_HEIGHT} display="flex" alignItems="center" px={4}>
          <Text color="netflix.silver">Loading...</Text>
        </Box>
      </div>
    )
  }

  const getProtocolColor = (protocol) => {
    const colors = {
      'TCP': theme.colors.blue[400],
      'UDP': theme.colors.green[400],
      'HTTP': theme.colors.orange[400],
      'HTTPS': theme.colors.red[400],
      'DNS': theme.colors.purple[400],
      'ICMP': theme.colors.pink[400],
      'ARP': theme.colors.yellow[400]
    }
    return colors[protocol] || theme.colors.gray[400]
  }

  return (
    <div style={style}>
      <MotionBox
        h={ITEM_HEIGHT}
        px={4}
        py={2}
        bg={isSelected ? 'rgba(6, 182, 212, 0.1)' : 'transparent'}
        borderY="1px solid"
        borderColor={isSelected ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.05)'}
        cursor="pointer"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        whileHover={{
          backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(6, 182, 212, 0.4)'
        }}
        transition={{ duration: 0.2 }}
        display="flex"
        alignItems="center"
        gap={4}
      >
        {/* Index */}
        {visibleColumns.index && (
          <Text fontSize="xs" color="netflix.silver" minW="40px">
            {index + 1}
          </Text>
        )}

        {/* Timestamp */}
        {visibleColumns.timestamp && (
          <Text fontSize="xs" color="netflix.white" minW={isMobile ? "80px" : "120px"}>
            {formatTimestamp(packet.ts)}
          </Text>
        )}

        {/* Source */}
        {visibleColumns.source && (
          <Tooltip label={`Source: ${packet.src}:${packet.sport || ''}`} placement="top">
            <Text fontSize="xs" color="netflix.white" minW={isMobile ? "60px" : "120px"} noOfLines={1}>
              {packet.src}{packet.sport ? `:${packet.sport}` : ''}
            </Text>
          </Tooltip>
        )}

        {/* Destination */}
        {visibleColumns.destination && (
          <Tooltip label={`Destination: ${packet.dst}:${packet.dport || ''}`} placement="top">
            <Text fontSize="xs" color="netflix.white" minW={isMobile ? "60px" : "120px"} noOfLines={1}>
              {packet.dst}{packet.dport ? `:${packet.dport}` : ''}
            </Text>
          </Tooltip>
        )}

        {/* Protocol */}
        {visibleColumns.protocol && (
          <Badge 
            colorScheme="blue" 
            size="sm" 
            bg={getProtocolColor(packet.proto)}
            color="white"
            minW="50px"
            textAlign="center"
          >
            {packet.proto}
          </Badge>
        )}

        {/* Length */}
        {visibleColumns.length && (
          <Text fontSize="xs" color="netflix.silver" minW="50px">
            {packet.length}B
          </Text>
        )}

        {/* Summary */}
        {visibleColumns.summary && !isMobile && (
          <Tooltip label={packet.summary} placement="top">
            <Text fontSize="xs" color="netflix.silver" flex={1} noOfLines={1}>
              {packet.summary}
            </Text>
          </Tooltip>
        )}

        {/* Actions */}
        <HStack spacing={1} minW="60px">
          {packet.isAnomaly && (
            <Tooltip label="Anomaly detected">
              <Text fontSize="xs" color="red.400">⚠️</Text>
            </Tooltip>
          )}
          {packet.isBookmarked && (
            <Tooltip label="Bookmarked">
              <Text fontSize="xs" color="yellow.400">🔖</Text>
            </Tooltip>
          )}
        </HStack>
      </MotionBox>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for optimal performance
  const prevPacket = prevProps.data.packets[prevProps.index]
  const nextPacket = nextProps.data.packets[nextProps.index]
  
  return (
    prevProps.index === nextProps.index &&
    prevProps.style === nextProps.style &&
    packetComparison.arePacketsEqual([prevPacket], [nextPacket]) &&
    prevProps.data.selectedPacket === nextProps.data.selectedPacket &&
    prevProps.data.visibleColumns === nextProps.data.visibleColumns
  )
})

// Table header component
const VirtualTableHeader = optimizedMemo(({ 
  visibleColumns, 
  onColumnToggle, 
  onSort, 
  sortColumn, 
  sortDirection,
  isMobile 
}) => {
  const columns = [
    { key: 'index', label: '#', width: '40px' },
    { key: 'timestamp', label: 'Time', width: isMobile ? '80px' : '120px' },
    { key: 'source', label: 'Source', width: isMobile ? '60px' : '120px' },
    { key: 'destination', label: 'Destination', width: isMobile ? '60px' : '120px' },
    { key: 'protocol', label: 'Protocol', width: '70px' },
    { key: 'length', label: 'Length', width: '60px' },
    { key: 'summary', label: 'Summary', width: 'auto', mobileHidden: true }
  ]

  return (
    <Box
      h={HEADER_HEIGHT}
      bg="rgba(31, 31, 31, 0.95)"
      borderBottom="2px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
      px={4}
      display="flex"
      alignItems="center"
      gap={4}
      position="sticky"
      top={0}
      zIndex={10}
    >
      {columns.map((column) => {
        if (column.mobileHidden && isMobile) return null
        if (!visibleColumns[column.key]) return null
        
        return (
          <Box
            key={column.key}
            minW={column.width}
            flex={column.width === 'auto' ? 1 : 'none'}
          >
            <HStack spacing={1}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="netflix.white"
                textTransform="uppercase"
                letterSpacing="0.5px"
                cursor="pointer"
                onClick={() => onSort(column.key)}
                _hover={{ color: 'wireshark.accent' }}
              >
                {column.label}
              </Text>
              {sortColumn === column.key && (
                <Text fontSize="xs" color="wireshark.accent">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </HStack>
          </Box>
        )
      })}
      
      {/* Actions column */}
      <Box minW="60px">
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="netflix.white"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          Actions
        </Text>
      </Box>
    </Box>
  )
})

// Main virtualized packet table component
const VirtualizedPacketTable = ({
  packets = [],
  selectedPacket = null,
  onPacketSelect = () => {},
  onPacketDoubleClick = () => {},
  height = 400,
  searchQuery = '',
  isCapturing = false,
  className = '',
  ...props
}) => {
  const { isMobile } = useMobileDetection()
  const [visibleColumns, setVisibleColumns] = useState({
    index: true,
    timestamp: true,
    source: true,
    destination: true,
    protocol: true,
    length: true,
    summary: !isMobile
  })
  const [sortColumn, setSortColumn] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')
  const [scrollToIndex, setScrollToIndex] = useState(-1)
  
  const listRef = useRef()
  const tableRef = useRef()
  
  // Accessibility features
  const {
    announceToScreenReader,
    enhanceForScreenReader,
    keyboardNavigation
  } = useAccessibility({
    enableKeyboardTraps: false,
    enableFocusManagement: true,
    enableScreenReaderSupport: true
  })
  
  const {
    focusManagerRef,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  } = useFocusManagement({
    containerRef: tableRef,
    enableArrowKeys: true,
    enableEscapeKey: true,
    roving: true
  })

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp * 1000)
    if (isMobile) {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    }
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }, [isMobile])

  // Sorted and filtered packets
  const processedPackets = useMemo(() => {
    let filtered = packets

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = packets.filter(packet => 
        packet.src?.toLowerCase().includes(query) ||
        packet.dst?.toLowerCase().includes(query) ||
        packet.proto?.toLowerCase().includes(query) ||
        packet.summary?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue

      switch (sortColumn) {
        case 'timestamp':
          aValue = a.ts
          bValue = b.ts
          break
        case 'source':
          aValue = a.src
          bValue = b.src
          break
        case 'destination':
          aValue = a.dst
          bValue = b.dst
          break
        case 'protocol':
          aValue = a.proto
          bValue = b.proto
          break
        case 'length':
          aValue = a.length
          bValue = b.length
          break
        default:
          return 0
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [packets, searchQuery, sortColumn, sortDirection])

  // Handle column sorting
  const handleSort = useStableCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }, [sortColumn])

  // Handle column visibility toggle
  const handleColumnToggle = useStableCallback((column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }, [])

  // Scroll to selected packet
  useEffect(() => {
    if (selectedPacket && listRef.current) {
      const index = processedPackets.findIndex(packet => 
        packet.ts === selectedPacket.ts
      )
      if (index !== -1) {
        listRef.current.scrollToItem(index, 'center')
      }
    }
  }, [selectedPacket, processedPackets])

  // Auto-scroll to bottom when capturing new packets
  useEffect(() => {
    if (isCapturing && listRef.current && sortColumn === 'timestamp' && sortDirection === 'desc') {
      listRef.current.scrollToItem(0, 'start')
    }
  }, [packets.length, isCapturing, sortColumn, sortDirection])

  // Row data for virtual list
  const itemData = useMemo(() => ({
    packets: processedPackets,
    selectedPacket,
    onPacketSelect,
    onPacketDoubleClick,
    visibleColumns,
    formatTimestamp,
    isMobile
  }), [
    processedPackets, 
    selectedPacket, 
    onPacketSelect, 
    onPacketDoubleClick, 
    visibleColumns, 
    formatTimestamp,
    isMobile
  ])

  // Column controls
  const ColumnControls = () => (
    <HStack spacing={2} mb={4} flexWrap="wrap">
      <Text fontSize="sm" color="netflix.silver">Columns:</Text>
      {Object.entries(visibleColumns).map(([key, visible]) => (
        <Box
          key={key}
          as="button"
          onClick={() => handleColumnToggle(key)}
          px={2}
          py={1}
          borderRadius="4px"
          bg={visible ? 'wireshark.accent' : 'rgba(255, 255, 255, 0.1)'}
          color={visible ? 'white' : 'netflix.silver'}
          fontSize="xs"
          border="1px solid"
          borderColor={visible ? 'wireshark.accent' : 'rgba(255, 255, 255, 0.2)'}
          _hover={{
            bg: visible ? 'rgba(6, 182, 212, 0.8)' : 'rgba(255, 255, 255, 0.15)'
          }}
          transition="all 0.2s"
        >
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </Box>
      ))}
    </HStack>
  )

  if (processedPackets.length === 0) {
    return (
      <MotionBox
        className={className}
        variants={slideAnimations.slideInUp}
        initial="initial"
        animate="animate"
        {...props}
      >
        <ColumnControls />
        <Box
          h={height}
          bg="rgba(31, 31, 31, 0.95)"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={4}>
            <Text fontSize="4xl">📡</Text>
            <Text color="netflix.silver" textAlign="center">
              {searchQuery ? 'No packets match your search' : 'No packets captured yet'}
            </Text>
            {isCapturing && (
              <Text fontSize="sm" color="wireshark.accent">
                Listening for packets...
              </Text>
            )}
          </VStack>
        </Box>
      </MotionBox>
    )
  }

  return (
    <MotionBox
      className={className}
      variants={slideAnimations.slideInUp}
      initial="initial"
      animate="animate"
      {...props}
    >
      <ColumnControls />
      
      {/* Statistics */}
      <HStack justify="space-between" mb={4}>
        <HStack spacing={4}>
          <Text fontSize="sm" color="netflix.white">
            <Text as="span" fontWeight="bold">{processedPackets.length}</Text> packets
            {searchQuery && (
              <Text as="span" color="netflix.silver"> (filtered from {packets.length})</Text>
            )}
          </Text>
          {isCapturing && (
            <Badge colorScheme="green" size="sm">
              Live
            </Badge>
          )}
        </HStack>
        
        <HStack spacing={2}>
          <Text fontSize="xs" color="netflix.silver">
            Sorted by {sortColumn} ({sortDirection})
          </Text>
        </HStack>
      </HStack>

      {/* Virtual table */}
      <Box
        h={height}
        bg="rgba(31, 31, 31, 0.95)"
        borderRadius="12px"
        border="1px solid rgba(255, 255, 255, 0.1)"
        overflow="hidden"
        position="relative"
      >
        <VirtualTableHeader
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          isMobile={isMobile}
        />
        
        <List
          ref={listRef}
          height={height - HEADER_HEIGHT}
          itemCount={processedPackets.length}
          itemSize={ITEM_HEIGHT}
          itemData={itemData}
          overscanCount={OVERSCAN_COUNT}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
          }}
        >
          {PacketRow}
        </List>
      </Box>
      
      {/* Performance info */}
      <HStack justify="space-between" mt={2} fontSize="xs" color="netflix.silver">
        <Text>
          Virtual scrolling: rendering {Math.min(Math.ceil(height / ITEM_HEIGHT) + OVERSCAN_COUNT * 2, processedPackets.length)} / {processedPackets.length} rows
        </Text>
        <Text>
          Performance: {processedPackets.length > 1000 ? 'Optimized' : 'Standard'} rendering
        </Text>
      </HStack>
    </MotionBox>
  )
}

export default optimizedMemo(VirtualizedPacketTable, (prevProps, nextProps) => {
  return (
    packetComparison.arePacketsEqual(prevProps.packets, nextProps.packets) &&
    prevProps.selectedPacket === nextProps.selectedPacket &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.height === nextProps.height &&
    prevProps.isCapturing === nextProps.isCapturing
  )
})