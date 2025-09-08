import React, { useState, useMemo } from 'react'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react'
import { SearchIcon, ChevronDownIcon } from '@chakra-ui/icons'

const PremiumPacketTable = ({
  packets = [],
  onRowClick,
  selectedRow,
  connectionStatus = 'disconnected',
  packetRate = 0,
  totalPackets = 0,
  columns = [],
  onColumnResize,
  ...props
}) => {
  const { colorMode } = useColorMode()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('ts')
  const [sortDirection, setSortDirection] = useState('desc')
  const [hoveredRow, setHoveredRow] = useState(null)

  // Default columns if none provided
  const defaultColumns = [
    { id: 'ts', label: 'Time', width: 120, visible: true },
    { id: 'src', label: 'Source', width: 150, visible: true },
    { id: 'dst', label: 'Destination', width: 150, visible: true },
    { id: 'protocol', label: 'Protocol', width: 100, visible: true },
    { id: 'length', label: 'Length', width: 80, visible: true },
    { id: 'info', label: 'Info', width: 300, visible: true },
  ]

  const activeColumns = columns.length > 0 ? columns : defaultColumns

  // Filter and sort packets
  const processedPackets = useMemo(() => {
    let filtered = packets

    // Apply search filter
    if (searchTerm) {
      filtered = packets.filter(packet => 
        Object.values(packet).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [packets, searchTerm, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const formatTimestamp = (ts) => {
    return new Date(ts * 1000).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const getProtocolColor = (protocol) => {
    const colors = {
      'TCP': 'wireshark.blue',
      'UDP': 'wireshark.green',
      'HTTP': 'wireshark.orange',
      'HTTPS': 'wireshark.yellow',
      'DNS': 'wireshark.quantum',
      'ARP': 'wireshark.plasma',
      'ICMP': 'wireshark.error',
    }
    return colors[protocol?.toUpperCase()] || 'netflix.silver'
  }

  const getRowAnimation = (index) => ({
    css: {
      '@keyframes slideInUp': {
        '0%': { transform: 'translateY(20px)', opacity: 0 },
        '100%': { transform: 'translateY(0)', opacity: 1 }
      },
      animation: `slideInUp 0.3s ease-out ${index * 0.05}s both`
    }
  })

  return (
    <Box
      bg="rgba(20, 20, 20, 0.95)"
      borderRadius="20px"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
      boxShadow="netflix"
      backdropFilter="blur(25px)"
      overflow="hidden"
      position="relative"
      {...props}
    >
      {/* Header */}
      <Box
        p={6}
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        bg="rgba(255, 255, 255, 0.02)"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <HStack spacing={4}>
            <Box
              w="48px"
              h="48px"
              bg="linear-gradient(135deg, #10B981 0%, #06B6D4 100%)"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="wiresharkGlow"
              css={connectionStatus === 'connected' ? {
              '@keyframes glow': {
                '0%, 100%': { boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)' },
                '50%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)' }
              },
              animation: 'glow 3s ease-in-out infinite'
            } : {}}
            >
              <Text fontSize="xl" color="white">📡</Text>
            </Box>
            
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color="netflix.white">
                Live Packet Stream
              </Text>
              <Text fontSize="sm" color="netflix.silver">
                Real-time network analysis
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={4}>
            {/* Stats */}
            <VStack spacing={0} align="center">
              <Text fontSize="lg" fontWeight="bold" color="wireshark.neon">
                {processedPackets.length.toLocaleString()}
              </Text>
              <Text fontSize="xs" color="netflix.silver" textTransform="uppercase">
                Visible
              </Text>
            </VStack>
            
            <VStack spacing={0} align="center">
              <Text fontSize="lg" fontWeight="bold" color="wireshark.success">
                {packetRate}
              </Text>
              <Text fontSize="xs" color="netflix.silver" textTransform="uppercase">
                Packets/s
              </Text>
            </VStack>

            {/* Connection Status */}
            <Badge
              bg={connectionStatus === 'connected' ? 'wireshark.success' : 'wireshark.error'}
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
              css={connectionStatus === 'connected' ? {
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 }
                },
                animation: 'pulse 2s infinite'
              } : {}}
            >
              {connectionStatus === 'connected' ? '🔴 LIVE' : '⚫ OFFLINE'}
            </Badge>
          </HStack>
        </Flex>

        {/* Search and Controls */}
        <Flex gap={4} align="center">
          <InputGroup flex={1} maxW="400px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="netflix.silver" />
            </InputLeftElement>
            <Input
              placeholder="Search packets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="netflix.white"
              _placeholder={{ color: 'netflix.silver' }}
              _hover={{ borderColor: 'wireshark.neon' }}
              _focus={{ 
                borderColor: 'wireshark.neon',
                boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.5)'
              }}
            />
          </InputGroup>

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              size="sm"
              color="netflix.silver"
              _hover={{ color: 'wireshark.neon', bg: 'rgba(255, 255, 255, 0.1)' }}
            >
              Sort: {sortField} {sortDirection === 'asc' ? '↑' : '↓'}
            </MenuButton>
            <MenuList bg="netflix.darkGray" borderColor="rgba(255, 255, 255, 0.1)">
              {activeColumns.filter(col => col.visible).map(col => (
                <MenuItem
                  key={col.id}
                  onClick={() => handleSort(col.id)}
                  bg="transparent"
                  color="netflix.white"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                >
                  {col.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      {/* Table */}
      <Box
        maxH="600px"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
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
        <Table variant="unstyled" size="sm">
          <Thead position="sticky" top={0} zIndex={1}>
            <Tr bg="rgba(255, 255, 255, 0.05)" backdropFilter="blur(10px)">
              {activeColumns.filter(col => col.visible).map(col => (
                <Th
                  key={col.id}
                  color="netflix.white"
                  fontWeight="bold"
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.1em"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  cursor="pointer"
                  onClick={() => handleSort(col.id)}
                  _hover={{ color: 'wireshark.neon' }}
                  position="relative"
                  width={col.width}
                >
                  <HStack spacing={2}>
                    <Text>{col.label}</Text>
                    {sortField === col.id && (
                      <Text color="wireshark.neon">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </Text>
                    )}
                  </HStack>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {processedPackets.length === 0 ? (
              <Tr>
                <Td colSpan={activeColumns.filter(col => col.visible).length} textAlign="center" py={8}>
                  <VStack spacing={3}>
                    <Text fontSize="4xl" opacity={0.3}>📡</Text>
                    <Text color="netflix.silver" fontSize="lg">
                      {searchTerm ? 'No packets match your search' : 'No packets captured yet'}
                    </Text>
                    <Text color="netflix.silver" fontSize="sm">
                      {connectionStatus === 'connected' 
                        ? 'Waiting for network traffic...' 
                        : 'Connect to start capturing packets'
                      }
                    </Text>
                  </VStack>
                </Td>
              </Tr>
            ) : (
              processedPackets.map((packet, index) => (
                <Tr
                  key={`${packet.ts}-${index}`}
                  cursor="pointer"
                  onClick={() => onRowClick?.(packet)}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  bg={selectedRow === packet ? 'rgba(6, 182, 212, 0.2)' : 'transparent'}
                  borderColor="rgba(255, 255, 255, 0.05)"
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    bg: selectedRow === packet 
                      ? 'rgba(6, 182, 212, 0.3)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    transform: 'translateX(4px)',
                  }}
                  {...getRowAnimation(index)}
                >
                  {activeColumns.filter(col => col.visible).map(col => (
                    <Td
                      key={col.id}
                      color="netflix.white"
                      fontSize="sm"
                      borderColor="rgba(255, 255, 255, 0.05)"
                      py={3}
                    >
                      {col.id === 'ts' && (
                        <Text fontFamily="mono" color="wireshark.neon">
                          {formatTimestamp(packet.ts)}
                        </Text>
                      )}
                      {col.id === 'src' && (
                        <Text fontFamily="mono" color="netflix.white">
                          {packet.src}
                        </Text>
                      )}
                      {col.id === 'dst' && (
                        <Text fontFamily="mono" color="netflix.white">
                          {packet.dst}
                        </Text>
                      )}
                      {col.id === 'protocol' && (
                        <Badge
                          bg={getProtocolColor(packet.protocol)}
                          color="white"
                          fontSize="xs"
                          px={2}
                          py={1}
                          borderRadius="full"
                          fontWeight="bold"
                        >
                          {packet.protocol}
                        </Badge>
                      )}
                      {col.id === 'length' && (
                        <Text color="wireshark.success" fontWeight="semibold">
                          {packet.length}
                        </Text>
                      )}
                      {col.id === 'info' && (
                        <Tooltip label={packet.summary} placement="top" hasArrow>
                          <Text 
                            color="netflix.silver" 
                            noOfLines={1}
                            maxW="280px"
                          >
                            {packet.summary || 'No additional info'}
                          </Text>
                        </Tooltip>
                      )}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Footer Stats */}
      <Box
        p={4}
        borderTop="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        bg="rgba(255, 255, 255, 0.02)"
      >
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="netflix.silver">
            Showing {processedPackets.length} of {totalPackets} packets
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </Text>
          <HStack spacing={4}>
            <Text fontSize="xs" color="netflix.silver">
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </HStack>
        </Flex>
      </Box>
    </Box>
  )
}

export default PremiumPacketTable