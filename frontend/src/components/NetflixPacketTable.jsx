import React, { useState, useRef, useCallback } from 'react'
import {
  Box,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Button,
  Progress,
  Tooltip,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import NetflixCard from './NetflixCard'

// Motion components
const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

// Enhanced protocol configurations with Netflix styling
const PROTOCOL_CONFIG = {
  TCP: {
    colorScheme: 'blue',
    gradient: 'linear(135deg, #3B82F6 0%, #1E40AF 100%)',
    icon: '🔗',
    description: 'Transmission Control Protocol - Reliable connection-oriented protocol',
    category: 'Transport Layer',
    color: '#3B82F6'
  },
  UDP: {
    colorScheme: 'green',
    gradient: 'linear(135deg, #10B981 0%, #059669 100%)',
    icon: '📡',
    description: 'User Datagram Protocol - Fast connectionless protocol',
    category: 'Transport Layer',
    color: '#10B981'
  },
  ICMP: {
    colorScheme: 'orange',
    gradient: 'linear(135deg, #F59E0B 0%, #D97706 100%)',
    icon: '📶',
    description: 'Internet Control Message Protocol - Network diagnostics',
    category: 'Network Layer',
    color: '#F59E0B'
  },
  HTTP: {
    colorScheme: 'purple',
    gradient: 'linear(135deg, #8B5CF6 0%, #7C3AED 100%)',
    icon: '🌐',
    description: 'HyperText Transfer Protocol - Web communication',
    category: 'Application Layer',
    color: '#8B5CF6'
  },
  HTTPS: {
    colorScheme: 'teal',
    gradient: 'linear(135deg, #06B6D4 0%, #0891B2 100%)',
    icon: '🔒',
    description: 'HTTP Secure - Encrypted web communication',
    category: 'Application Layer',
    color: '#06B6D4'
  },
  DNS: {
    colorScheme: 'cyan',
    gradient: 'linear(135deg, #22D3EE 0%, #0891B2 100%)',
    icon: '🔍',
    description: 'Domain Name System - Name resolution service',
    category: 'Application Layer',
    color: '#22D3EE'
  },
  SSH: {
    colorScheme: 'gray',
    gradient: 'linear(135deg, #6B7280 0%, #374151 100%)',
    icon: '🔐',
    description: 'Secure Shell - Encrypted remote access',
    category: 'Application Layer',
    color: '#6B7280'
  },
  FTP: {
    colorScheme: 'yellow',
    gradient: 'linear(135deg, #FCD34D 0%, #F59E0B 100%)',
    icon: '📁',
    description: 'File Transfer Protocol - File sharing service',
    category: 'Application Layer',
    color: '#FCD34D'
  }
}

const NetflixPacketTable = ({
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
  const [hoveredRow, setHoveredRow] = useState(null)
  const tableRef = useRef(null)

  // Get visible columns
  const visibleColumns = columns.filter(col => col.visible)

  // Enhanced protocol badge component
  const ProtocolBadge = ({ protocol }) => {
    const config = PROTOCOL_CONFIG[protocol] || {
      gradient: 'linear(135deg, #6B7280 0%, #374151 100%)',
      icon: '📦',
      description: 'Unknown Protocol',
      category: 'Unknown',
      color: '#6B7280'
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
        bg="netflix.darkGray"
        color="white"
        borderRadius="md"
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
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
            _hover={{ 
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
              transform: "translateY(-1px)"
            }}
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
              <Text fontSize="xs" fontFamily="mono" fontWeight="600" color="wireshark.accent">
                {formatTimestamp(packet.ts)}
              </Text>
              <Text fontSize="10px" color="netflix.lightGray" opacity={0.7}>
                {date.toLocaleDateString()}
              </Text>
            </VStack>
          </Tooltip>
        )
      
      case 'source':
        return (
          <Tooltip label={`Source IP: ${packet.src}`} hasArrow>
            <VStack spacing={0} align="start">
              <Text fontSize="xs" fontFamily="mono" fontWeight="600" color="netflix.white">
                {packet.src}
              </Text>
              <Text fontSize="10px" color="netflix.lightGray" opacity={0.7}>
                Source
              </Text>
            </VStack>
          </Tooltip>
        )
      
      case 'destination':
        return (
          <Tooltip label={`Destination IP: ${packet.dst}`} hasArrow>
            <VStack spacing={0} align="start">
              <Text fontSize="xs" fontFamily="mono" fontWeight="600" color="netflix.white">
                {packet.dst}
              </Text>
              <Text fontSize="10px" color="netflix.lightGray" opacity={0.7}>
                Destination
              </Text>
            </VStack>
          </Tooltip>
        )
      
      case 'protocol':
        return <ProtocolBadge protocol={packet.proto} />
      
      case 'length':
        const sizeInKB = packet.length > 1024 ? (packet.length / 1024).toFixed(1) : null
        const percentage = Math.min((packet.length / 1500) * 100, 100)
        return (
          <Tooltip label={`${packet.length} bytes`} hasArrow>
            <VStack spacing={1} align="start" minW="60px">
              <Text fontSize="xs" fontWeight="600" color="wireshark.accent">
                {sizeInKB ? `${sizeInKB}KB` : `${packet.length}B`}
              </Text>
              <Progress
                value={percentage}
                size="xs"
                colorScheme="blue"
                w="50px"
                borderRadius="full"
                bg="netflix.mediumGray"
              />
            </VStack>
          </Tooltip>
        )
      
      case 'ports':
        if (!packet.sport || !packet.dport) return <Text color="netflix.lightGray">-</Text>
        return (
          <HStack spacing={1} fontSize="xs">
            <Badge 
              bg="rgba(59, 130, 246, 0.2)" 
              color="wireshark.secondary" 
              variant="subtle" 
              fontSize="10px"
              borderRadius="md"
            >
              {packet.sport}
            </Badge>
            <Text color="netflix.lightGray">→</Text>
            <Badge 
              bg="rgba(16, 185, 129, 0.2)" 
              color="wireshark.success" 
              variant="subtle" 
              fontSize="10px"
              borderRadius="md"
            >
              {packet.dport}
            </Badge>
          </HStack>
        )
      
      default:
        return <Text color="netflix.lightGray">-</Text>
    }
  }

  return (
    <NetflixCard
      title="Live Network Analysis"
      subtitle="Real-time packet capture and analysis"
      icon="📊"
      variant="netflix"
      isHoverable={false}
    >
      {/* Enhanced Table */}
      <Box
        ref={tableRef}
        maxH="600px"
        overflowY="auto"
        overflowX="auto"
        borderRadius="md"
        bg="rgba(0, 0, 0, 0.2)"
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
                  bg="netflix.mediumGray"
                  borderBottom="2px solid"
                  borderColor="wireshark.accent"
                  fontSize="sm"
                  fontWeight="700"
                  width={`${column.width}px`}
                  minWidth={`${column.width}px`}
                  maxWidth={`${column.width}px`}
                  position="relative"
                  color="netflix.white"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  whileHover={{ backgroundColor: 'rgba(47, 47, 47, 0.8)' }}
                  transition={{ duration: 0.2 }}
                >
                  <HStack spacing={2} justify="space-between">
                    <Text fontSize="xs">{column.label}</Text>
                  </HStack>
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
                bg={selectedRow === packet ? "rgba(6, 182, 212, 0.1)" : "transparent"}
                onHoverStart={() => setHoveredRow(index)}
                onHoverEnd={() => setHoveredRow(null)}
                whileHover={{
                  backgroundColor: selectedRow === packet 
                    ? "rgba(6, 182, 212, 0.15)" 
                    : "rgba(255, 255, 255, 0.05)",
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
                borderLeftColor={selectedRow === packet ? "wireshark.accent" : "transparent"}
                position="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                {visibleColumns.map((column, colIndex) => (
                  <MotionBox
                    key={column.id}
                    as="td"
                    p={4}
                    borderBottom="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    fontSize="sm"
                    width={`${column.width}px`}
                    minWidth={`${column.width}px`}
                    maxWidth={`${column.width}px`}
                    overflow="hidden"
                    position="relative"
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
                        bg="rgba(255, 255, 255, 0.1)"
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
              <MotionBox
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                fontSize="6xl"
              >
                🦈
              </MotionBox>
              <VStack spacing={3}>
                <Text fontSize="2xl" fontWeight="700" color="netflix.white">
                  No Packets Detected
                </Text>
                <Text color="netflix.lightGray" fontSize="lg" maxW="md" textAlign="center">
                  Network packets will appear here in real-time once traffic is detected
                </Text>
                <Badge
                  colorScheme={connectionStatus === 'connected' ? 'green' : 'red'}
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {connectionStatus === 'connected' 
                    ? '✅ Connected and monitoring...' 
                    : '❌ Not connected to packet stream'
                  }
                </Badge>
              </VStack>
            </VStack>
          </MotionBox>
        )}
      </Box>
    </NetflixCard>
  )
}

export default NetflixPacketTable