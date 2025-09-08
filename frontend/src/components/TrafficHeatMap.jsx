import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Grid, 
  GridItem,
  Tooltip,
  Badge,
  Button,
  ButtonGroup
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)

const TrafficHeatMap = ({ 
  data = [], 
  title = "Network Traffic Heatmap",
  height = 400,
  maxConnections = 50,
  showControls = true,
  onConnectionClick,
  timeRange = '5m'
}) => {
  const [viewMode, setViewMode] = useState('connections') // 'connections', 'protocols', 'ports'
  const [sortBy, setSortBy] = useState('traffic') // 'traffic', 'alphabetical', 'recent'
  const [selectedConnection, setSelectedConnection] = useState(null)

  // Process data based on view mode
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    let processed = [...data]

    switch (viewMode) {
      case 'protocols':
        // Group by protocol
        const protocolGroups = {}
        data.forEach(item => {
          item.protocolList.forEach(protocol => {
            if (!protocolGroups[protocol]) {
              protocolGroups[protocol] = {
                id: protocol,
                label: protocol,
                count: 0,
                bytes: 0,
                connections: [],
                intensity: 0
              }
            }
            protocolGroups[protocol].count += item.count
            protocolGroups[protocol].bytes += item.bytes
            protocolGroups[protocol].connections.push(item)
          })
        })
        
        processed = Object.values(protocolGroups)
        break

      case 'ports':
        // Extract and group by ports
        const portGroups = {}
        data.forEach(item => {
          // Extract ports from source and destination
          const sourceParts = item.source.split(':')
          const destParts = item.destination.split(':')
          const sourcePort = sourceParts[1] || '80'
          const destPort = destParts[1] || '80'
          
          [sourcePort, destPort].forEach(port => {
            if (!portGroups[port]) {
              portGroups[port] = {
                id: port,
                label: `Port ${port}`,
                count: 0,
                bytes: 0,
                connections: [],
                intensity: 0
              }
            }
            portGroups[port].count += item.count
            portGroups[port].bytes += item.bytes
            portGroups[port].connections.push(item)
          })
        })
        
        processed = Object.values(portGroups)
        break

      default:
        // Use connections as-is
        processed = data.map(item => ({
          ...item,
          id: `${item.source}-${item.destination}`,
          label: `${item.source} → ${item.destination}`
        }))
    }

    // Calculate relative intensities
    const maxCount = Math.max(...processed.map(item => item.count), 1)
    processed = processed.map(item => ({
      ...item,
      intensity: item.count / maxCount
    }))

    // Sort data
    switch (sortBy) {
      case 'alphabetical':
        processed.sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id))
        break
      case 'recent':
        processed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        break
      default:
        processed.sort((a, b) => b.count - a.count)
    }

    return processed.slice(0, maxConnections)
  }, [data, viewMode, sortBy, maxConnections])

  // Color intensity calculation
  const getIntensityColor = useCallback((intensity, isHovered = false) => {
    const baseAlpha = Math.max(0.1, intensity)
    const hoverMultiplier = isHovered ? 1.5 : 1
    
    if (intensity > 0.8) {
      return `rgba(229, 9, 20, ${Math.min(1, baseAlpha * hoverMultiplier)})`
    } else if (intensity > 0.6) {
      return `rgba(245, 158, 11, ${Math.min(1, baseAlpha * hoverMultiplier)})`
    } else if (intensity > 0.4) {
      return `rgba(6, 182, 212, ${Math.min(1, baseAlpha * hoverMultiplier)})`
    } else if (intensity > 0.2) {
      return `rgba(16, 185, 129, ${Math.min(1, baseAlpha * hoverMultiplier)})`
    } else {
      return `rgba(107, 114, 128, ${Math.min(1, baseAlpha * hoverMultiplier)})`
    }
  }, [])

  // Get connection details for tooltip
  const getConnectionDetails = useCallback((item) => {
    const details = []
    
    if (viewMode === 'connections') {
      details.push(`Source: ${item.source}`)
      details.push(`Destination: ${item.destination}`)
      details.push(`Packets: ${item.count.toLocaleString()}`)
      details.push(`Bytes: ${item.bytes.toLocaleString()}`)
      details.push(`Protocols: ${item.protocolList.join(', ')}`)
    } else if (viewMode === 'protocols') {
      details.push(`Protocol: ${item.label}`)
      details.push(`Total Packets: ${item.count.toLocaleString()}`)
      details.push(`Total Bytes: ${item.bytes.toLocaleString()}`)
      details.push(`Connections: ${item.connections.length}`)
    } else if (viewMode === 'ports') {
      details.push(`Port: ${item.id}`)
      details.push(`Total Packets: ${item.count.toLocaleString()}`)
      details.push(`Total Bytes: ${item.bytes.toLocaleString()}`)
      details.push(`Connections: ${item.connections.length}`)
    }
    
    return details
  }, [viewMode])

  // Handle cell click
  const handleCellClick = useCallback((item) => {
    setSelectedConnection(item)
    onConnectionClick?.(item)
  }, [onConnectionClick])

  // Calculate grid dimensions
  const gridCols = Math.ceil(Math.sqrt(processedData.length))
  const gridRows = Math.ceil(processedData.length / gridCols)

  // Legend component
  const Legend = () => (
    <VStack spacing={2} align="stretch">
      <Text color="netflix.silver" fontSize="xs" fontWeight="bold">
        INTENSITY
      </Text>
      <VStack spacing={1} align="stretch">
        {[
          { label: 'Very High', color: 'rgba(229, 9, 20, 0.9)', threshold: '80%+' },
          { label: 'High', color: 'rgba(245, 158, 11, 0.8)', threshold: '60-80%' },
          { label: 'Medium', color: 'rgba(6, 182, 212, 0.7)', threshold: '40-60%' },
          { label: 'Low', color: 'rgba(16, 185, 129, 0.6)', threshold: '20-40%' },
          { label: 'Very Low', color: 'rgba(107, 114, 128, 0.5)', threshold: '<20%' }
        ].map((item, index) => (
          <HStack key={index} spacing={2}>
            <Box w={3} h={3} bg={item.color} borderRadius="2px" />
            <Text color="netflix.silver" fontSize="xs">
              {item.label}
            </Text>
            <Text color="netflix.silver" fontSize="xs" opacity={0.7}>
              ({item.threshold})
            </Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  )

  // Statistics
  const statistics = useMemo(() => {
    if (!processedData.length) return null

    const totalPackets = processedData.reduce((sum, item) => sum + item.count, 0)
    const totalBytes = processedData.reduce((sum, item) => sum + item.bytes, 0)
    const avgIntensity = processedData.reduce((sum, item) => sum + item.intensity, 0) / processedData.length

    return {
      totalPackets,
      totalBytes,
      avgIntensity: (avgIntensity * 100).toFixed(1),
      activeConnections: processedData.length
    }
  }, [processedData])

  return (
    <Box
      p={6}
      bg="rgba(31, 31, 31, 0.95)"
      borderRadius="16px"
      border="1px solid rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(20px)"
      boxShadow="netflix"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'netflixHover'
      }}
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <Heading size="md" color="netflix.white" fontWeight="bold">
              {title}
            </Heading>
            <Text color="netflix.silver" fontSize="sm">
              {timeRange} real-time traffic visualization
            </Text>
          </VStack>

          {statistics && (
            <VStack align="end" spacing={1}>
              <Badge
                bg="wireshark.accent"
                color="netflix.black"
                px={3}
                py={1}
                borderRadius="full"
                fontWeight="bold"
                fontSize="xs"
              >
                {statistics.activeConnections} ACTIVE
              </Badge>
              <Text color="netflix.silver" fontSize="xs">
                Avg: {statistics.avgIntensity}%
              </Text>
            </VStack>
          )}
        </HStack>

        {/* Controls */}
        {showControls && (
          <HStack justify="space-between" wrap="wrap" spacing={4}>
            <HStack spacing={2}>
              <Text color="netflix.silver" fontSize="sm">
                View:
              </Text>
              <ButtonGroup size="sm" variant="outline" colorScheme="gray">
                <Button
                  variant={viewMode === 'connections' ? 'netflix' : 'netflixSecondary'}
                  onClick={() => setViewMode('connections')}
                  size="sm"
                >
                  Connections
                </Button>
                <Button
                  variant={viewMode === 'protocols' ? 'netflix' : 'netflixSecondary'}
                  onClick={() => setViewMode('protocols')}
                  size="sm"
                >
                  Protocols
                </Button>
                <Button
                  variant={viewMode === 'ports' ? 'netflix' : 'netflixSecondary'}
                  onClick={() => setViewMode('ports')}
                  size="sm"
                >
                  Ports
                </Button>
              </ButtonGroup>
            </HStack>

            <HStack spacing={2}>
              <Text color="netflix.silver" fontSize="sm">
                Sort:
              </Text>
              <ButtonGroup size="sm" variant="outline" colorScheme="gray">
                <Button
                  variant={sortBy === 'traffic' ? 'netflix' : 'netflixSecondary'}
                  onClick={() => setSortBy('traffic')}
                  size="sm"
                >
                  Traffic
                </Button>
                <Button
                  variant={sortBy === 'alphabetical' ? 'netflix' : 'netflixSecondary'}
                  onClick={() => setSortBy('alphabetical')}
                  size="sm"
                >
                  A-Z
                </Button>
              </ButtonGroup>
            </HStack>
          </HStack>
        )}

        {/* Heatmap Container */}
        <HStack spacing={6} align="start">
          {/* Heatmap Grid */}
          <Box flex={1} minH={height}>
            <AnimatePresence mode="wait">
              {processedData.length === 0 ? (
                <MotionBox
                  key="no-data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  height={height}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                >
                  <Text fontSize="4xl" opacity={0.3} mb={4}>🔥</Text>
                  <Text color="netflix.white" fontSize="lg" fontWeight="bold" mb={2}>
                    No Traffic Data
                  </Text>
                  <Text color="netflix.silver" fontSize="sm">
                    Waiting for network activity...
                  </Text>
                </MotionBox>
              ) : (
                <MotionBox
                  key="heatmap"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Grid
                    templateColumns={`repeat(${gridCols}, 1fr)`}
                    templateRows={`repeat(${gridRows}, 1fr)`}
                    gap={2}
                    w="100%"
                    h={height}
                  >
                    {processedData.map((item, index) => (
                      <Tooltip
                        key={item.id || index}
                        label={
                          <VStack align="start" spacing={1}>
                            {getConnectionDetails(item).map((detail, i) => (
                              <Text key={i} fontSize="xs">
                                {detail}
                              </Text>
                            ))}
                          </VStack>
                        }
                        placement="top"
                        hasArrow
                      >
                        <MotionGridItem
                          bg={getIntensityColor(item.intensity)}
                          borderRadius="4px"
                          cursor="pointer"
                          border="1px solid"
                          borderColor={
                            selectedConnection?.id === item.id
                              ? 'netflix.white'
                              : 'rgba(255, 255, 255, 0.1)'
                          }
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02, duration: 0.3 }}
                          whileHover={{ 
                            scale: 1.05,
                            backgroundColor: getIntensityColor(item.intensity, true),
                            borderColor: 'netflix.white'
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCellClick(item)}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          p={1}
                          minH="40px"
                        >
                          <Text
                            color="netflix.white"
                            fontSize="xs"
                            fontWeight="bold"
                            textAlign="center"
                            textShadow="0 1px 2px rgba(0,0,0,0.8)"
                            noOfLines={2}
                          >
                            {viewMode === 'connections' 
                              ? item.count
                              : viewMode === 'protocols'
                              ? item.label
                              : `P${item.id}`
                            }
                          </Text>
                        </MotionGridItem>
                      </Tooltip>
                    ))}
                  </Grid>
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>

          {/* Legend and Stats */}
          {processedData.length > 0 && (
            <VStack spacing={6} minW="150px">
              <Legend />
              
              {statistics && (
                <VStack spacing={3} align="stretch">
                  <Text color="netflix.silver" fontSize="xs" fontWeight="bold">
                    STATISTICS
                  </Text>
                  <VStack spacing={2} align="stretch">
                    <VStack spacing={0} align="start">
                      <Text color="netflix.silver" fontSize="xs">
                        Total Packets
                      </Text>
                      <Text color="netflix.white" fontSize="sm" fontWeight="bold">
                        {statistics.totalPackets.toLocaleString()}
                      </Text>
                    </VStack>
                    
                    <VStack spacing={0} align="start">
                      <Text color="netflix.silver" fontSize="xs">
                        Total Bytes
                      </Text>
                      <Text color="netflix.white" fontSize="sm" fontWeight="bold">
                        {(statistics.totalBytes / 1024).toFixed(1)}K
                      </Text>
                    </VStack>

                    <VStack spacing={0} align="start">
                      <Text color="netflix.silver" fontSize="xs">
                        Connections
                      </Text>
                      <Text color="netflix.white" fontSize="sm" fontWeight="bold">
                        {statistics.activeConnections}
                      </Text>
                    </VStack>
                  </VStack>
                </VStack>
              )}
            </VStack>
          )}
        </HStack>

        {/* Selected Connection Details */}
        <AnimatePresence>
          {selectedConnection && (
            <MotionBox
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              p={4}
              bg="rgba(229, 9, 20, 0.1)"
              borderRadius="8px"
              border="1px solid rgba(229, 9, 20, 0.3)"
            >
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" w="100%">
                  <Text color="netflix.white" fontWeight="bold" fontSize="sm">
                    Selected: {selectedConnection.label || selectedConnection.id}
                  </Text>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setSelectedConnection(null)}
                    color="netflix.silver"
                  >
                    ✕
                  </Button>
                </HStack>
                <HStack spacing={4} wrap="wrap">
                  {getConnectionDetails(selectedConnection).map((detail, index) => (
                    <Text key={index} color="netflix.silver" fontSize="xs">
                      {detail}
                    </Text>
                  ))}
                </HStack>
              </VStack>
            </MotionBox>
          )}
        </AnimatePresence>
      </VStack>
    </Box>
  )
}

export default TrafficHeatMap