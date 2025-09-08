import React, { useEffect, useState } from 'react'
import { Box, VStack, HStack, Text, Button, Badge, Alert, AlertIcon } from '@chakra-ui/react'

// Import performance optimization utilities
import { useIntegratedPerformanceMonitoring, initializeMemoryLeakDetection } from '../utils/memoryLeakPrevention'
import { optimizedMemo, packetComparison } from '../utils/optimization'
import { LazyComponents, initializePreloading } from '../utils/lazyComponents'
import VirtualizedPacketTable from '../components/VirtualizedPacketTable'

// Optimized packet component example
const OptimizedPacketItem = optimizedMemo(({ packet, onSelect }) => {
  return (
    <Box
      p={3}
      bg="rgba(31, 31, 31, 0.8)"
      borderRadius="8px"
      border="1px solid rgba(255, 255, 255, 0.1)"
      cursor="pointer"
      onClick={() => onSelect(packet)}
      _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
    >
      <HStack justify="space-between">
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" color="netflix.white">
            {packet.src} → {packet.dst}
          </Text>
          <Text fontSize="xs" color="netflix.silver">
            {packet.proto} | {packet.length}B
          </Text>
        </VStack>
        {packet.isAnomaly && (
          <Badge colorScheme="red" size="sm">Anomaly</Badge>
        )}
      </HStack>
    </Box>
  )
}, (prevProps, nextProps) => {
  return packetComparison.arePacketsEqual([prevProps.packet], [nextProps.packet]) &&
         prevProps.onSelect === nextProps.onSelect
})

// Main performance optimization example component
const PerformanceOptimizationExample = () => {
  const [packets, setPackets] = useState([])
  const [selectedPacket, setSelectedPacket] = useState(null)
  const [showVirtualized, setShowVirtualized] = useState(false)
  const [performanceReport, setPerformanceReport] = useState(null)

  // Initialize performance monitoring and memory leak detection
  const {
    metrics,
    generateReport,
    mark,
    measure,
    safeSetTimeout,
    safeSetInterval,
    getCombinedStats,
    forceCleanup
  } = useIntegratedPerformanceMonitoring({
    enabled: true,
    trackRenders: true,
    trackMemory: true,
    trackFPS: true,
    onReport: (report) => {
      setPerformanceReport(report)
      console.log('Performance Report:', report)
    }
  })

  // Initialize optimization systems
  useEffect(() => {
    // Initialize memory leak detection
    initializeMemoryLeakDetection({
      autoStart: true,
      enableWarnings: true
    })

    // Initialize lazy loading
    initializePreloading()

    // Generate sample packets for demonstration
    const generateSamplePackets = () => {
      const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS']
      const samplePackets = Array.from({ length: 1000 }, (_, index) => ({
        id: index,
        ts: Date.now() / 1000 + index,
        src: `192.168.1.${Math.floor(Math.random() * 255)}`,
        dst: `10.0.0.${Math.floor(Math.random() * 255)}`,
        sport: Math.floor(Math.random() * 65535),
        dport: Math.floor(Math.random() * 65535),
        proto: protocols[Math.floor(Math.random() * protocols.length)],
        length: Math.floor(Math.random() * 1500) + 64,
        summary: `Sample packet ${index + 1}`,
        isAnomaly: Math.random() < 0.1, // 10% chance of anomaly
        isBookmarked: Math.random() < 0.05 // 5% chance of bookmark
      }))
      
      setPackets(samplePackets)
    }

    // Use safe timer to prevent memory leaks
    const timerId = safeSetTimeout(generateSamplePackets, 1000)

    // Setup performance markers
    mark('component-init-start')
    
    return () => {
      mark('component-init-end')
      measure('component-init-time', 'component-init-start', 'component-init-end')
    }
  }, [safeSetTimeout, mark, measure])

  // Generate performance report
  const handleGenerateReport = () => {
    const report = generateReport()
    const combinedStats = getCombinedStats()
    
    console.log('Generated Report:', report)
    console.log('Combined Stats:', combinedStats)
    
    setPerformanceReport({
      ...report,
      memoryLeaks: combinedStats.memoryLeaks
    })
  }

  // Handle packet selection with performance tracking
  const handlePacketSelect = (packet) => {
    mark('packet-select-start')
    setSelectedPacket(packet)
    mark('packet-select-end')
    measure('packet-select-time', 'packet-select-start', 'packet-select-end')
  }

  // Force cleanup and garbage collection
  const handleForceCleanup = () => {
    forceCleanup()
    setPerformanceReport(null)
  }

  return (
    <VStack spacing={6} align="stretch" p={6}>
      {/* Header */}
      <VStack align="start" spacing={2}>
        <Text fontSize="2xl" fontWeight="bold" color="netflix.white">
          Performance Optimization Demo
        </Text>
        <Text color="netflix.silver">
          Demonstrating virtualization, memory leak prevention, and performance monitoring
        </Text>
      </VStack>

      {/* Performance Metrics */}
      <Box
        p={4}
        bg="rgba(31, 31, 31, 0.8)"
        borderRadius="12px"
        border="1px solid rgba(255, 255, 255, 0.1)"
      >
        <VStack align="start" spacing={3}>
          <Text fontSize="lg" fontWeight="bold" color="netflix.white">
            Real-time Performance Metrics
          </Text>
          
          <HStack spacing={6} flexWrap="wrap">
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color="netflix.silver">Render Count</Text>
              <Text fontSize="lg" color="wireshark.accent" fontWeight="bold">
                {metrics.renderCount}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color="netflix.silver">Average Render Time</Text>
              <Text fontSize="lg" color="wireshark.accent" fontWeight="bold">
                {metrics.averageRenderTime.toFixed(2)}ms
              </Text>
            </VStack>
            
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color="netflix.silver">Memory Usage</Text>
              <Text fontSize="lg" color="wireshark.accent" fontWeight="bold">
                {metrics.memoryUsage}MB
              </Text>
            </VStack>
            
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color="netflix.silver">FPS</Text>
              <Text fontSize="lg" color="wireshark.accent" fontWeight="bold">
                {metrics.fps}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      {/* Controls */}
      <HStack spacing={4} flexWrap="wrap">
        <Button
          variant="netflixPrimary"
          onClick={() => setShowVirtualized(!showVirtualized)}
        >
          {showVirtualized ? 'Show Standard List' : 'Show Virtualized Table'}
        </Button>
        
        <Button
          variant="netflixSecondary"
          onClick={handleGenerateReport}
        >
          Generate Performance Report
        </Button>
        
        <Button
          variant="netflixSecondary"
          onClick={handleForceCleanup}
        >
          Force Cleanup & GC
        </Button>
      </HStack>

      {/* Packet Display */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" color="netflix.white" mb={4}>
          Packet List ({packets.length} packets)
        </Text>
        
        {showVirtualized ? (
          // Virtualized table for large lists
          <VirtualizedPacketTable
            packets={packets}
            selectedPacket={selectedPacket}
            onPacketSelect={handlePacketSelect}
            onPacketDoubleClick={handlePacketSelect}
            height={400}
            searchQuery=""
            isCapturing={false}
          />
        ) : (
          // Standard list (performance comparison)
          <Box
            maxH="400px"
            overflowY="auto"
            bg="rgba(31, 31, 31, 0.8)"
            borderRadius="12px"
            border="1px solid rgba(255, 255, 255, 0.1)"
            p={4}
          >
            <VStack spacing={2} align="stretch">
              {packets.slice(0, 50).map((packet) => (
                <OptimizedPacketItem
                  key={packet.id}
                  packet={packet}
                  onSelect={handlePacketSelect}
                />
              ))}
              {packets.length > 50 && (
                <Text fontSize="sm" color="netflix.silver" textAlign="center" py={2}>
                  Showing 50 of {packets.length} packets (for performance)
                </Text>
              )}
            </VStack>
          </Box>
        )}
      </Box>

      {/* Selected Packet Info */}
      {selectedPacket && (
        <Box
          p={4}
          bg="rgba(6, 182, 212, 0.1)"
          borderRadius="12px"
          border="1px solid rgba(6, 182, 212, 0.3)"
        >
          <VStack align="start" spacing={2}>
            <Text fontSize="lg" fontWeight="bold" color="wireshark.accent">
              Selected Packet
            </Text>
            <Text fontSize="sm" color="netflix.white">
              {selectedPacket.src}:{selectedPacket.sport} → {selectedPacket.dst}:{selectedPacket.dport}
            </Text>
            <Text fontSize="sm" color="netflix.silver">
              Protocol: {selectedPacket.proto} | Size: {selectedPacket.length} bytes
            </Text>
          </VStack>
        </Box>
      )}

      {/* Performance Report */}
      {performanceReport && (
        <Box
          p={4}
          bg="rgba(31, 31, 31, 0.8)"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <VStack align="start" spacing={3}>
            <Text fontSize="lg" fontWeight="bold" color="netflix.white">
              Performance Report
            </Text>
            
            <HStack spacing={6} flexWrap="wrap">
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color="netflix.silver">Uptime</Text>
                <Text fontSize="sm" color="netflix.white">
                  {performanceReport.uptime}s
                </Text>
              </VStack>
              
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color="netflix.silver">Frame Count</Text>
                <Text fontSize="sm" color="netflix.white">
                  {performanceReport.frameCount}
                </Text>
              </VStack>
              
              {performanceReport.memory && (
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="netflix.silver">Memory Peak</Text>
                  <Text fontSize="sm" color="netflix.white">
                    {performanceReport.memory.peak}MB
                  </Text>
                </VStack>
              )}
            </HStack>

            {performanceReport.memoryLeaks && (
              <Alert status="info" bg="rgba(6, 182, 212, 0.1)" border="1px solid rgba(6, 182, 212, 0.3)">
                <AlertIcon color="blue.400" />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="netflix.white">Memory Leak Detection</Text>
                  <Text fontSize="xs" color="netflix.silver">
                    Observers: {performanceReport.memoryLeaks.observers} | 
                    Timers: {performanceReport.memoryLeaks.timers} | 
                    Listeners: {performanceReport.memoryLeaks.listeners}
                  </Text>
                </VStack>
              </Alert>
            )}
          </VStack>
        </Box>
      )}

      {/* Lazy Components Demo */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" color="netflix.white" mb={4}>
          Lazy Loaded Components
        </Text>
        
        <VStack spacing={4} align="stretch">
          {/* This would normally be loaded lazily */}
          <Box
            p={4}
            bg="rgba(31, 31, 31, 0.5)"
            borderRadius="8px"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <Text fontSize="sm" color="netflix.silver">
              🚀 LazyComponents.AIChatInterface - Loaded on demand
            </Text>
          </Box>
          
          <Box
            p={4}
            bg="rgba(31, 31, 31, 0.5)"
            borderRadius="8px"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <Text fontSize="sm" color="netflix.silver">
              📊 LazyComponents.NetflixCharts - Preloaded on idle
            </Text>
          </Box>
          
          <Box
            p={4}
            bg="rgba(31, 31, 31, 0.5)"
            borderRadius="8px"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <Text fontSize="sm" color="netflix.silver">
              ⏱️ LazyComponents.TimelineView - Preloaded after 2s
            </Text>
          </Box>
        </VStack>
      </Box>
    </VStack>
  )
}

export default optimizedMemo(PerformanceOptimizationExample)