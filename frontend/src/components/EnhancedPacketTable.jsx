import React, { useState, useRef, useCallback } from 'react'
import {
  Box,
  Text,
  Badge,
  Icon,
  HStack,
  VStack,
  useColorModeValue,
  Tooltip,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  useDisclosure,
  Collapse,
  ScaleFade,
  Fade,
  keyframes,
  chakra,
  shouldForwardProp
} from '@chakra-ui/react'
import { motion, isValidMotionProp } from 'framer-motion'
import ColumnConfig from './ColumnConfig'

// Create motion components
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
})

const MotionFlex = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
})

// Animated gradient background
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

// Enhanced protocol configurations with more details
const PROTOCOL_CONFIG = {
  TCP: {
    colorScheme: 'blue',
    gradient: 'linear(to-r, blue.400, blue.600)',
    icon: '🔗',
    description: 'Transmission Control Protocol - Reliable connection-oriented protocol',
    category: 'Transport Layer'
  },
  UDP: {
    colorScheme: 'green',
    gradient: 'linear(to-r, green.400, green.600)',
    icon: '📡',
    description: 'User Datagram Protocol - Fast connectionless protocol',
    category: 'Transport Layer'
  },
  ICMP: {
    colorScheme: 'orange',
    gradient: 'linear(to-r, orange.400, orange.600)',
    icon: '📶',
    description: 'Internet Control Message Protocol - Network diagnostics',
    category: 'Network Layer'
  },
  HTTP: {
    colorScheme: 'purple',
    gradient: 'linear(to-r, purple.400, purple.600)',
    icon: '🌐',
    description: 'HyperText Transfer Protocol - Web communication',
    category: 'Application Layer'
  },
  HTTPS: {
    colorScheme: 'teal',
    gradient: 'linear(to-r, teal.400, teal.600)',
    icon: '🔒',
    description: 'HTTP Secure - Encrypted web communication',
    category: 'Application Layer'
  },
  DNS: {
    colorScheme: 'cyan',
    gradient: 'linear(to-r, cyan.400, cyan.600)',
    icon: '🔍',
    description: 'Domain Name System - Name resolution service',
    category: 'Application Layer'
  },
  SSH: {
    colorScheme: 'gray',
    gradient: 'linear(to-r, gray.600, gray.800)',
    icon: '🔐',
    description: 'Secure Shell - Encrypted remote access',
    category: 'Application Layer'
  },
  FTP: {
    colorScheme: 'yellow',
    gradient: 'linear(to-r, yellow.400, yellow.600)',
    icon: '📁',
    description: 'File Transfer Protocol - File sharing service',
    category: 'Application Layer'
  }
}

const EnhancedPacketTable = ({
  columns = [],
  data = [],
  onRowClick,
  selectedRow,
  formatTimestamp,
  onColumnResize,
  connectionStatus = 'disconnected',
  packetRate = 0,
  totalPackets = 0
}) => {
  const [resizing, setResizing] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const tableRef = useRef(null)
  const { isOpen: isStatsOpen, onToggle: onStatsToggle } = useDisclosure({ defaultIsOpen: true })

  // Color mode values
  const tableBg = useColorModeValue('white', 'gray.900')
  const headerBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)'
  )
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const selectedBg = useColorModeValue('blue.50', 'blue.900')
  const hoverBg = useColorModeValue('gray.50', 'gray.800')
  const cardBg = useColorModeValue('white', 'gray.800')

  // Enhanced mouse down handler for resizing
  const handleMouseDown = useCallback((columnId, e) => {
    e.preventDefault()
    setResizing({ columnId, startX: e.clientX })
    
    const handleMouseMove = (e) => {
      if (resizing) {
        const deltaX = e.clientX - resizing.startX
        const column = columns.find(col => col.id === columnId)
        const newWidth = Math.max(80, column.width + deltaX)
        onColumnResize(columnId, newWidth)
      }
    }

    const handleMouseUp = () => {
      setResizing(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [resizing, columns, onColumnResize])

  // Get visible columns
  const visibleColumns = columns.filter(col => col.visible)

  // Enhanced protocol badge component
  const ProtocolBadge = ({ protocol }) => {
    const config = PROTOCOL_CONFIG[protocol] || {
      colorScheme: 'gray',
      gradient: 'linear(to-r, gray.400, gray.600)',
      icon: '📦',
      description: 'Unknown Protocol',
      category: 'Unknown'
    }

    return (
      <Tooltip
        label={
          <VStack spacing={1} align="start" p={2}>
            <Text fontWeight="bold">{protocol}</Text>
            <Text fontSize="xs">{config.description}</Text>
            <Badge size="xs" colorScheme={config.colorScheme}>
              {config.category}
            </Badge>
          </VStack>
        }
        hasArrow
        placement="top"
        bg="gray.800"
        color="white"
      >
        <MotionBox
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Badge
            bgGradient={config.gradient}
            color="white"
            fontSize="xs"
            fontWeight="700"
            px={3}
            py={1}
            borderRadius="full"
            display="flex"
            alignItems="center"
            gap={1}
            cursor="help"
            shadow="md"
            _hover={{ shadow: 'lg' }}
            transition="all 0.2s"
          >
            <Text as="span" fontSize="10px">{config.icon}</Text>
            {protocol}
          </Badge>
        </MotionBox>
      </Tooltip>
    )
  }

  // Enhanced cell content renderer
  const renderCellContent = (packet, column) => {
    switch (column.id) {
      case 'time':
        const date = new Date(packet.ts * 1000)
        return (
          <Tooltip label={date.toLocaleString()} hasArrow>
            <VStack spacing={0} align="start">
              <Text fontSize="xs" fontFamily="mono" fontWeight="600" color="blue.600">
                {formatTimestamp(packet.ts)}
              </Text>
              <Text fontSize="10px" color="gray.500">
                {date.toLocaleDateString()}
              </Text>
            </VStack>
          </Tooltip>
        )
      
      case 'source':
        return (
          <Tooltip label={`Source IP: ${packet.src}`} hasArrow>
            <VStack spacing={0} align="start">
              <Text fontSize="xs" fontFamily="mono" fontWeight="600" color="blue.700">
                {packet.src}
              </Text>
              <Text fontSize="10px" color="gray.500">
                Source
              </Text>
            </VStack>
          </Tooltip>
        )
      
      case 'destination':
        return (
          <Tooltip label={`Destination IP: ${packet.dst}`} hasArrow>
            <VStack spacing={0} align="start">
              <Text fontSize="xs" fontFamily="mono" fontWeight="600" color="green.700">
                {packet.dst}
              </Text>
              <Text fontSize="10px" color="gray.500">
                Destination
              </Text>
            </VStack>
          </Tooltip>
        )
      
      case 'protocol':
        return <ProtocolBadge protocol={packet.proto} />
      
      case 'length':
        const sizeInKB = packet.length > 1024 ? (packet.length / 1024).toFixed(1) : null
        return (
          <Tooltip label={`${packet.length} bytes`} hasArrow>
            <VStack spacing={0} align="start">
              <Text fontSize="xs" fontWeight="600" color="purple.600">
                {sizeInKB ? `${sizeInKB}KB` : `${packet.length}B`}
              </Text>
              <Progress
                value={(packet.length / 1500) * 100}
                size="xs"
                colorScheme="purple"
                w="40px"
                borderRadius="full"
              />
            </VStack>
          </Tooltip>
        )
      
      case 'ports':
        if (!packet.sport || !packet.dport) return <Text color="gray.400">-</Text>
        return (
          <HStack spacing={1} fontSize="xs">
            <Badge colorScheme="blue" variant="subtle" fontSize="10px">
              {packet.sport}
            </Badge>
            <Icon viewBox="0 0 24 24" boxSize={3} color="gray.400">
              <path fill="currentColor" d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.42Z"/>
            </Icon>
            <Badge colorScheme="green" variant="subtle" fontSize="10px">
              {packet.dport}
            </Badge>
          </HStack>
        )
      
      default:
        return <Text color="gray.400">-</Text>
    }
  }

  // Connection status indicator
  const ConnectionStatus = () => {
    const statusConfig = {
      connected: { color: 'green', icon: '🟢', text: 'Connected', pulse: true },
      disconnected: { color: 'red', icon: '🔴', text: 'Disconnected', pulse: false },
      reconnecting: { color: 'yellow', icon: '🟡', text: 'Reconnecting...', pulse: true },
      error: { color: 'red', icon: '❌', text: 'Error', pulse: false }
    }

    const config = statusConfig[connectionStatus] || statusConfig.disconnected

    return (
      <HStack spacing={2}>
        <MotionBox
          animate={config.pulse ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Text fontSize="sm">{config.icon}</Text>
        </MotionBox>
        <Text fontSize="sm" fontWeight="600" color={`${config.color}.600`}>
          {config.text}
        </Text>
      </HStack>
    )
  }

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="2xl" overflow="hidden">
      {/* Enhanced Header */}
      <CardHeader bg={headerBg} color="white" p={6}>
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <HStack spacing={4}>
              <Text fontSize="2xl" fontWeight="800" letterSpacing="tight">
                📊 Live Network Analysis
              </Text>
              <ConnectionStatus />
            </HStack>
            <Text fontSize="sm" opacity={0.9}>
              Real-time packet capture and analysis dashboard
            </Text>
          </VStack>
          
          <HStack spacing={4}>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              onClick={onStatsToggle}
              _hover={{ bg: 'whiteAlpha.200' }}
            >
              {isStatsOpen ? '📊 Hide Stats' : '📈 Show Stats'}
            </Button>
            <ColumnConfig onColumnChange={() => {}} />
          </HStack>
        </Flex>

        {/* Stats Panel */}
        <Collapse in={isStatsOpen} animateOpacity>
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            mt={4}
          >
            <HStack spacing={8} justify="center">
              <Stat textAlign="center">
                <StatLabel color="whiteAlpha.800" fontSize="xs">Total Packets</StatLabel>
                <StatNumber fontSize="2xl">{totalPackets.toLocaleString()}</StatNumber>
              </Stat>
              <Stat textAlign="center">
                <StatLabel color="whiteAlpha.800" fontSize="xs">Packet Rate</StatLabel>
                <StatNumber fontSize="2xl">{packetRate}</StatNumber>
                <StatHelpText color="whiteAlpha.700" fontSize="xs">packets/sec</StatHelpText>
              </Stat>
              <Stat textAlign="center">
                <StatLabel color="whiteAlpha.800" fontSize="xs">Visible Columns</StatLabel>
                <StatNumber fontSize="2xl">{visibleColumns.length}</StatNumber>
                <StatHelpText color="whiteAlpha.700" fontSize="xs">of {columns.length}</StatHelpText>
              </Stat>
            </HStack>
          </MotionBox>
        </Collapse>
      </CardHeader>

      {/* Enhanced Table */}
      <CardBody p={0}>
        <Box
          ref={tableRef}
          maxH="600px"
          overflowY="auto"
          overflowX="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          }}
        >
          <Box as="table" w="100%" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            {/* Enhanced Table Header */}
            <Box as="thead" position="sticky" top={0} zIndex={10}>
              <Box as="tr">
                {visibleColumns.map((column, index) => (
                  <MotionBox
                    key={column.id}
                    as="th"
                    p={4}
                    textAlign="left"
                    bg="gray.100"
                    borderBottom="3px solid"
                    borderColor="blue.400"
                    fontSize="sm"
                    fontWeight="700"
                    width={`${column.width}px`}
                    minWidth={`${column.width}px`}
                    maxWidth={`${column.width}px`}
                    position="relative"
                    color="gray.700"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    whileHover={{ backgroundColor: '#E2E8F0' }}
                    transition={{ duration: 0.2 }}
                  >
                    <HStack spacing={2} justify="space-between">
                      <Text fontSize="xs">{column.label}</Text>
                      {column.resizable && (
                        <Icon viewBox="0 0 24 24" boxSize={3} color="gray.500">
                          <path fill="currentColor" d="M8 18h8v-2H8v2zM8 13h8v-2H8v2zM8 6v2h8V6H8z"/>
                        </Icon>
                      )}
                    </HStack>

                    {/* Enhanced resize handle */}
                    {column.resizable && index < visibleColumns.length - 1 && (
                      <Box
                        position="absolute"
                        right="-2px"
                        top="0"
                        bottom="0"
                        width="4px"
                        cursor="col-resize"
                        bg="transparent"
                        _hover={{
                          bg: 'blue.400',
                          shadow: '0 0 10px rgba(59, 130, 246, 0.6)'
                        }}
                        onMouseDown={(e) => handleMouseDown(column.id, e)}
                        zIndex={20}
                        borderRadius="sm"
                        transition="all 0.2s"
                      />
                    )}
                  </MotionBox>
                ))}
              </Box>
            </Box>

            {/* Enhanced Table Body */}
            <Box as="tbody">
              {data.map((packet, index) => (
                <MotionFlex
                  key={`${packet.ts}-${index}`}
                  as="tr"
                  role="button"
                  tabIndex={0}
                  cursor="pointer"
                  bg={selectedRow === packet ? selectedBg : 'transparent'}
                  onHoverStart={() => setHoveredRow(index)}
                  onHoverEnd={() => setHoveredRow(null)}
                  whileHover={{
                    backgroundColor: selectedRow === packet ? selectedBg : hoverBg,
                    x: 4,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => onRowClick(packet)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(packet)
                    }
                  }}
                  borderLeft={selectedRow === packet ? "4px solid" : "4px solid transparent"}
                  borderLeftColor={selectedRow === packet ? "blue.400" : "transparent"}
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: selectedRow === packet ? '4px' : '0px',
                    bg: 'blue.400',
                    transition: 'width 0.2s ease'
                  }}
                >
                  {visibleColumns.map((column, colIndex) => (
                    <MotionBox
                      key={column.id}
                      as="td"
                      p={4}
                      borderBottom="1px solid"
                      borderColor={borderColor}
                      fontSize="sm"
                      width={`${column.width}px`}
                      minWidth={`${column.width}px`}
                      maxWidth={`${column.width}px`}
                      overflow="hidden"
                      position="relative"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                    >
                      {renderCellContent(packet, column)}

                      {/* Subtle column separator */}
                      {colIndex < visibleColumns.length - 1 && (
                        <Box
                          position="absolute"
                          right="0"
                          top="25%"
                          bottom="25%"
                          width="1px"
                          bg="gray.200"
                          opacity={hoveredRow === index ? 0.8 : 0.3}
                          transition="opacity 0.2s"
                        />
                      )}
                    </MotionBox>
                  ))}
                </MotionFlex>
              ))}
            </Box>
          </Box>

          {/* Enhanced empty state */}
          {data.length === 0 && (
            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <VStack spacing={6} p={16} textAlign="center">
                <Box
                  animation={`${gradientAnimation} 3s ease infinite`}
                  bgGradient="linear(45deg, blue.400, purple.500, pink.500, blue.400)"
                  bgSize="400% 400%"
                  borderRadius="full"
                  p={6}
                >
                  <Icon viewBox="0 0 24 24" boxSize={16} color="white">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5l5-5v3h4v4h-4v3z"/>
                  </Icon>
                </Box>
                <VStack spacing={3}>
                  <Text fontSize="2xl" fontWeight="700" color="gray.600">
                    🔍 No Packets Detected
                  </Text>
                  <Text color="gray.500" fontSize="lg" maxW="md" textAlign="center">
                    Network packets will appear here in real-time once traffic is detected
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {connectionStatus === 'connected' 
                      ? '✅ Connected and monitoring...' 
                      : '❌ Not connected to packet stream'
                    }
                  </Text>
                </VStack>
              </VStack>
            </MotionBox>
          )}
        </Box>
      </CardBody>
    </Card>
  )
}

export default EnhancedPacketTable