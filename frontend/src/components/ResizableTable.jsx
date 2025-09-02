import { useState, useRef, useCallback } from 'react'
import { 
  Box, 
  Text, 
  Badge, 
  Icon, 
  HStack, 
  VStack,
  useColorModeValue,
  Tooltip
} from '@chakra-ui/react'
import { ProtocolTooltip, FieldHelpTooltip } from './HelpTooltip'

const ResizableTable = ({ 
  columns, 
  data, 
  onRowClick, 
  selectedRow, 
  formatTimestamp,
  onColumnResize 
}) => {
  const [resizing, setResizing] = useState(null)
  const tableRef = useRef(null)

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((columnId, e) => {
    e.preventDefault()
    setResizing({ columnId, startX: e.clientX })
    
    const handleMouseMove = (e) => {
      if (resizing) {
        const deltaX = e.clientX - resizing.startX
        const column = columns.find(col => col.id === columnId)
        const newWidth = Math.max(50, column.width + deltaX) // Minimum width of 50px
        
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

  // Enhanced protocol badge with icons
  const getProtocolBadge = (protocol) => {
    const protocolConfig = {
      TCP: { 
        colorScheme: 'blue', 
        icon: '🔗',
        description: 'Transmission Control Protocol'
      },
      UDP: { 
        colorScheme: 'green', 
        icon: '📡',
        description: 'User Datagram Protocol'
      },
      ICMP: { 
        colorScheme: 'orange', 
        icon: '📶',
        description: 'Internet Control Message Protocol'
      },
      HTTP: { 
        colorScheme: 'purple', 
        icon: '🌐',
        description: 'HyperText Transfer Protocol'
      },
      HTTPS: { 
        colorScheme: 'green', 
        icon: '🔒',
        description: 'HTTP Secure'
      },
      DNS: { 
        colorScheme: 'cyan', 
        icon: '🔍',
        description: 'Domain Name System'
      }
    }

    const config = protocolConfig[protocol] || { 
      colorScheme: 'gray', 
      icon: '📦',
      description: 'Unknown Protocol'
    }

    return (
      <Tooltip label={config.description} hasArrow placement="top">
        <Badge 
          colorScheme={config.colorScheme}
          fontSize="xs"
          fontWeight="600"
          px={2}
          py={1}
          borderRadius="md"
          display="flex"
          alignItems="center"
          gap={1}
          cursor="help"
        >
          <Text as="span" fontSize="10px">{config.icon}</Text>
          {protocol}
        </Badge>
      </Tooltip>
    )
  }

  // Enhanced length formatting
  const formatLength = (length) => {
    if (length > 1024) {
      return `${(length / 1024).toFixed(1)}KB`
    }
    return `${length}B`
  }

  // Enhanced port display
  const formatPorts = (sport, dport) => {
    if (!sport || !dport) return '-'
    
    return (
      <HStack spacing={1} fontSize="xs">
        <Text fontWeight="500" color="blue.600">{sport}</Text>
        <Icon viewBox="0 0 24 24" boxSize={3} color="gray.400">
          <path fill="currentColor" d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.42Z"/>
        </Icon>
        <Text fontWeight="500" color="green.600">{dport}</Text>
      </HStack>
    )
  }

  // Enhanced time formatting
  const formatTimeWithTooltip = (timestamp) => {
    const date = new Date(timestamp * 1000)
    const timeString = formatTimestamp(timestamp)
    const fullDate = date.toLocaleString()
    
    return (
      <Tooltip label={fullDate} hasArrow placement="top">
        <Text 
          fontSize="xs" 
          fontFamily="mono" 
          cursor="help"
          _hover={{ color: 'blue.600' }}
        >
          {timeString}
        </Text>
      </Tooltip>
    )
  }

  // Render cell content based on column type
  const renderCellContent = (packet, column) => {
    switch (column.id) {
      case 'time':
        return formatTimeWithTooltip(packet.ts)
      case 'source':
        return (
          <Tooltip label={`Source: ${packet.src}`} hasArrow>
            <Text 
              fontSize="xs" 
              fontFamily="mono"
              color="blue.700"
              fontWeight="500"
              cursor="help"
            >
              {packet.src}
            </Text>
          </Tooltip>
        )
      case 'destination':
        return (
          <Tooltip label={`Destination: ${packet.dst}`} hasArrow>
            <Text 
              fontSize="xs" 
              fontFamily="mono"
              color="green.700"
              fontWeight="500"
              cursor="help"
            >
              {packet.dst}
            </Text>
          </Tooltip>
        )
      case 'protocol':
        return (
          <ProtocolTooltip protocol={packet.proto} port={packet.dport}>
            {getProtocolBadge(packet.proto)}
          </ProtocolTooltip>
        )
      case 'length':
        return (
          <Tooltip label={`${packet.length} bytes`} hasArrow>
            <Text 
              fontSize="xs" 
              fontWeight="500"
              color="purple.600"
              cursor="help"
            >
              {formatLength(packet.length)}
            </Text>
          </Tooltip>
        )
      case 'ports':
        return formatPorts(packet.sport, packet.dport)
      default:
        return '-'
    }
  }

  // Get responsive display for columns
  const getColumnDisplay = (columnId) => {
    const responsiveMap = {
      source: { base: 'none', md: 'table-cell' },
      destination: { base: 'none', md: 'table-cell' },
      length: { base: 'none', sm: 'table-cell' },
      ports: { base: 'none', lg: 'table-cell' }
    }
    return responsiveMap[columnId] || 'table-cell'
  }

  const tableBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBg = useColorModeValue('blue.50', 'blue.900')
  const selectedHoverBg = useColorModeValue('blue.100', 'blue.800')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  return (
    <Box 
      ref={tableRef}
      maxH="600px" 
      overflowY="auto"
      overflowX="auto"
      role="table"
      aria-label="Network packets table"
      aria-describedby="packets-description"
      bg={tableBg}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      shadow="sm"
    >
      <Box as="table" w="100%" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        {/* Enhanced Table Header */}
        <Box 
          as="thead" 
          position="sticky" 
          top={0} 
          zIndex={10}
          bg={headerBg}
          borderTopRadius="lg"
        >
          <Box as="tr">
            {visibleColumns.map((column, index) => (
              <Box 
                key={column.id}
                as="th" 
                p={4} 
                textAlign="left" 
                borderBottom="2px solid" 
                borderColor="blue.200" 
                fontSize="sm" 
                fontWeight="700"
                display={getColumnDisplay(column.id)}
                width={`${column.width}px`}
                minWidth={`${column.width}px`}
                maxWidth={`${column.width}px`}
                position="relative"
                color="gray.700"
                textTransform="uppercase"
                letterSpacing="0.5px"
                borderTopLeftRadius={index === 0 ? "lg" : 0}
                borderTopRightRadius={index === visibleColumns.length - 1 ? "lg" : 0}
              >
                <FieldHelpTooltip field={column.id}>
                  <HStack spacing={2}>
                    <Text isTruncated fontSize="xs">{column.label}</Text>
                    {column.resizable && (
                      <Icon viewBox="0 0 24 24" boxSize={3} color="gray.400">
                        <path fill="currentColor" d="M8 18h8v-2H8v2zM8 13h8v-2H8v2zM8 6v2h8V6H8z"/>
                      </Icon>
                    )}
                  </HStack>
                </FieldHelpTooltip>
                
                {/* Enhanced resize handle */}
                {column.resizable && index < visibleColumns.length - 1 && (
                  <Tooltip label="Drag to resize column" placement="top">
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
                        shadow: '0 0 8px rgba(59, 130, 246, 0.5)'
                      }}
                      onMouseDown={(e) => handleMouseDown(column.id, e)}
                      zIndex={20}
                      borderRadius="sm"
                      transition="all 0.2s"
                    />
                  </Tooltip>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Enhanced Table Body */}
        <Box as="tbody">
          {data.map((packet, index) => (
            <Box
              key={`${packet.ts}-${index}`}
              as="tr"
              role="button"
              tabIndex={0}
              cursor="pointer"
              bg={selectedRow === packet ? selectedBg : 'transparent'}
              _hover={{
                bg: selectedRow === packet ? selectedHoverBg : hoverBg,
                transform: 'translateX(2px)',
                shadow: 'md'
              }}
              _focus={{
                bg: selectedBg,
                outline: '2px solid',
                outlineColor: 'blue.500',
                outlineOffset: '-2px'
              }}
              onClick={() => onRowClick(packet)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onRowClick(packet)
                }
              }}
              transition="all 0.2s ease"
              aria-label={`Packet from ${packet.src} to ${packet.dst}, protocol ${packet.proto}, ${packet.length} bytes`}
              aria-selected={selectedRow === packet}
              borderLeft={selectedRow === packet ? "4px solid" : "4px solid transparent"}
              borderLeftColor={selectedRow === packet ? "blue.400" : "transparent"}
            >
              {visibleColumns.map((column, colIndex) => (
                <Box 
                  key={column.id}
                  as="td" 
                  p={4} 
                  borderBottom="1px solid" 
                  borderColor={borderColor} 
                  fontSize="sm"
                  display={getColumnDisplay(column.id)}
                  width={`${column.width}px`}
                  minWidth={`${column.width}px`}
                  maxWidth={`${column.width}px`}
                  overflow="hidden"
                  position="relative"
                >
                  <Box isTruncated>
                    {renderCellContent(packet, column)}
                  </Box>
                  
                  {/* Subtle column separator */}
                  {colIndex < visibleColumns.length - 1 && (
                    <Box
                      position="absolute"
                      right="0"
                      top="20%"
                      bottom="20%"
                      width="1px"
                      bg="gray.200"
                      opacity={0.5}
                    />
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
      
      {/* Enhanced empty states */}
      {data.length === 0 && (
        <VStack spacing={4} p={12} textAlign="center">
          <Icon viewBox="0 0 24 24" boxSize={12} color="gray.300">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5l5-5v3h4v4h-4v3z"/>
          </Icon>
          <VStack spacing={2}>
            <Text color="gray.500" fontSize="lg" fontWeight="600">
              No packets to display
            </Text>
            <Text color="gray.400" fontSize="sm">
              Packets will appear here when network traffic is captured
            </Text>
          </VStack>
        </VStack>
      )}
    </Box>
  )
}

export default ResizableTable