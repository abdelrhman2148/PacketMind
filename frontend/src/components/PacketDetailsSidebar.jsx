import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Button, 
  Badge, 
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon, CopyIcon, FilterIcon, DownloadIcon } from '@chakra-ui/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useCallback } from 'react'
import SyntaxHighlighter from './SyntaxHighlighter'

const MotionBox = motion(Box)

const PacketDetailsSidebar = ({ 
  packet, 
  isOpen, 
  onClose, 
  onExplain,
  onFilter,
  onExport,
  aiResponse = null,
  aiLoading = false,
  relatedPackets = []
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSection, setActiveSection] = useState(['summary'])
  const { isOpen: isSearchOpen, onToggle: toggleSearch } = useDisclosure()

  // Parse packet layers for display
  const packetLayers = useMemo(() => {
    if (!packet) return []

    const layers = []

    // Summary layer
    layers.push({
      name: 'Summary',
      type: 'summary',
      data: {
        timestamp: new Date(packet.ts * 1000).toISOString(),
        source: packet.src,
        destination: packet.dst,
        protocol: packet.proto,
        length: packet.length,
        sourcePort: packet.sport,
        destinationPort: packet.dport,
        summary: packet.summary
      }
    })

    // Ethernet layer (simulated)
    layers.push({
      name: 'Ethernet II',
      type: 'ethernet',
      data: {
        destinationMAC: '00:11:22:33:44:55',
        sourceMAC: '66:77:88:99:aa:bb',
        etherType: packet.proto === 'TCP' || packet.proto === 'UDP' ? '0x0800 (IPv4)' : '0x86dd (IPv6)'
      }
    })

    // IP layer
    if (packet.src && packet.dst) {
      layers.push({
        name: packet.src.includes(':') ? 'IPv6' : 'IPv4',
        type: 'ip',
        data: {
          version: packet.src.includes(':') ? 6 : 4,
          source: packet.src,
          destination: packet.dst,
          protocol: packet.proto,
          length: packet.length,
          TTL: 64,
          identification: Math.floor(Math.random() * 65536)
        }
      })
    }

    // Transport layer
    if (packet.proto === 'TCP' || packet.proto === 'UDP') {
      layers.push({
        name: packet.proto,
        type: 'transport',
        data: {
          sourcePort: packet.sport,
          destinationPort: packet.dport,
          protocol: packet.proto,
          ...(packet.proto === 'TCP' && {
            sequenceNumber: Math.floor(Math.random() * 4294967295),
            acknowledgmentNumber: Math.floor(Math.random() * 4294967295),
            flags: ['ACK', 'PSH'],
            windowSize: 65535
          })
        }
      })
    }

    // Application layer (simulated based on ports)
    if (packet.dport || packet.sport) {
      const port = packet.dport || packet.sport
      let appLayer = null

      if ([80, 443].includes(port)) {
        appLayer = {
          name: port === 443 ? 'HTTPS' : 'HTTP',
          type: 'application',
          data: {
            method: 'GET',
            uri: '/',
            version: 'HTTP/1.1',
            headers: {
              'Host': 'example.com',
              'User-Agent': 'Mozilla/5.0',
              'Accept': 'text/html,application/xhtml+xml'
            }
          }
        }
      } else if (port === 53) {
        appLayer = {
          name: 'DNS',
          type: 'application',
          data: {
            transactionID: Math.floor(Math.random() * 65536),
            flags: '0x0100 (Standard query)',
            questions: 1,
            answerRRs: 0,
            queries: ['example.com: type A, class IN']
          }
        }
      }

      if (appLayer) {
        layers.push(appLayer)
      }
    }

    // Raw data layer
    layers.push({
      name: 'Raw Data',
      type: 'raw',
      data: generateHexData(packet.length || 64)
    })

    return layers
  }, [packet])

  // Generate simulated hex data
  const generateHexData = useCallback((length) => {
    const bytes = []
    for (let i = 0; i < length; i++) {
      bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
    }
    return bytes.join('')
  }, [])

  // Filter search results
  const filteredLayers = useMemo(() => {
    if (!searchTerm) return packetLayers

    return packetLayers.filter(layer => {
      const searchLower = searchTerm.toLowerCase()
      return (
        layer.name.toLowerCase().includes(searchLower) ||
        JSON.stringify(layer.data).toLowerCase().includes(searchLower)
      )
    })
  }, [packetLayers, searchTerm])

  // Handle copy action
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  // Format data for display
  const formatLayerData = (layer) => {
    if (layer.type === 'raw') {
      return layer.data
    }
    return JSON.stringify(layer.data, null, 2)
  }

  // Get layer icon
  const getLayerIcon = (type) => {
    switch (type) {
      case 'summary': return '📋'
      case 'ethernet': return '🔗'
      case 'ip': return '🌐'
      case 'transport': return '🚚'
      case 'application': return '📱'
      case 'raw': return '🔢'
      default: return '📦'
    }
  }

  if (!isOpen || !packet) return null

  return (
    <AnimatePresence>
      <MotionBox
        position="fixed"
        right={0}
        top={0}
        bottom={0}
        w="600px"
        bg="rgba(10, 10, 10, 0.98)"
        backdropFilter="blur(30px)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRight="none"
        boxShadow="netflix"
        zIndex={1000}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <VStack spacing={0} align="stretch">
          <HStack
            p={6}
            bg="rgba(31, 31, 31, 0.9)"
            borderBottom="1px solid rgba(255, 255, 255, 0.1)"
            justify="space-between"
          >
            <VStack align="start" spacing={1}>
              <Heading size="lg" color="netflix.white" fontWeight="bold">
                Packet Details
              </Heading>
              <Text color="netflix.silver" fontSize="sm">
                {packet.src} → {packet.dst} ({packet.proto})
              </Text>
            </VStack>
            
            <HStack spacing={2}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSearch}
                colorScheme={isSearchOpen ? 'red' : 'gray'}
              >
                <SearchIcon />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                color="netflix.silver"
                _hover={{ color: 'netflix.red' }}
              >
                <CloseIcon />
              </Button>
            </HStack>
          </HStack>

          {/* Search Bar */}
          <AnimatePresence>
            {isSearchOpen && (
              <MotionBox
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                overflow="hidden"
              >
                <Box p={4} bg="rgba(20, 20, 20, 0.9)">
                  <InputGroup>
                    <InputLeftElement>
                      <SearchIcon color="netflix.silver" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search in packet data..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      color="netflix.white"
                      _placeholder={{ color: 'netflix.silver' }}
                      _focus={{
                        borderColor: 'wireshark.accent',
                        boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.5)'
                      }}
                    />
                  </InputGroup>
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <HStack
            p={4}
            bg="rgba(20, 20, 20, 0.9)"
            borderBottom="1px solid rgba(255, 255, 255, 0.1)"
            spacing={3}
            wrap="wrap"
          >
            <Button
              variant="netflix"
              size="sm"
              onClick={() => onExplain(packet)}
              isLoading={aiLoading}
              loadingText="Analyzing..."
              leftIcon={aiLoading ? <Spinner size="xs" /> : undefined}
            >
              🤖 AI Explain
            </Button>
            
            <Button
              variant="netflixSecondary"
              size="sm"
              onClick={() => onFilter(packet)}
              leftIcon={<FilterIcon />}
            >
              Filter
            </Button>
            
            <Button
              variant="netflixSecondary"
              size="sm"
              onClick={() => onExport(packet)}
              leftIcon={<DownloadIcon />}
            >
              Export
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(JSON.stringify(packet, null, 2))}
              leftIcon={<CopyIcon />}
            >
              Copy
            </Button>
          </HStack>
        </VStack>

        {/* Content */}
        <Box
          flex={1}
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(10, 10, 10, 0.3)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <VStack spacing={6} p={6} align="stretch">
            {/* AI Analysis Section */}
            {(aiResponse || aiLoading) && (
              <Box>
                <Heading size="md" color="netflix.white" mb={4} display="flex" alignItems="center">
                  🤖 AI Analysis
                  {aiLoading && <Spinner size="sm" ml={2} color="wireshark.accent" />}
                </Heading>
                
                {aiLoading ? (
                  <Box
                    p={6}
                    bg="rgba(31, 31, 31, 0.8)"
                    borderRadius="12px"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                  >
                    <VStack spacing={3}>
                      <Text color="netflix.silver">Analyzing packet with AI...</Text>
                      <Box w="100%" h="4px" bg="rgba(255, 255, 255, 0.1)" borderRadius="2px" overflow="hidden">
                        <MotionBox
                          h="100%"
                          bg="linear-gradient(90deg, #E50914, #06B6D4)"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                      </Box>
                    </VStack>
                  </Box>
                ) : aiResponse && (
                  <Alert
                    status={aiResponse.error ? 'error' : 'info'}
                    bg="rgba(31, 31, 31, 0.8)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    borderRadius="12px"
                    flexDirection="column"
                    alignItems="start"
                  >
                    <HStack mb={2}>
                      <AlertIcon color={aiResponse.error ? 'wireshark.error' : 'wireshark.accent'} />
                      <AlertTitle color="netflix.white">
                        {aiResponse.error ? 'Analysis Error' : 'AI Analysis'}
                      </AlertTitle>
                    </HStack>
                    <AlertDescription color="netflix.silver" whiteSpace="pre-wrap">
                      {aiResponse.explanation}
                    </AlertDescription>
                    {aiResponse.is_mock && (
                      <Badge mt={2} bg="wireshark.warning" color="netflix.black">
                        Mock Response
                      </Badge>
                    )}
                  </Alert>
                )}
              </Box>
            )}

            {/* Packet Layers */}
            <Box>
              <Heading size="md" color="netflix.white" mb={4}>
                Protocol Layers
              </Heading>
              
              <Accordion 
                allowMultiple 
                defaultIndex={[0]}
                bg="rgba(31, 31, 31, 0.8)"
                borderRadius="12px"
                border="1px solid rgba(255, 255, 255, 0.1)"
                overflow="hidden"
              >
                {filteredLayers.map((layer, index) => (
                  <AccordionItem key={index} border="none">
                    <AccordionButton
                      py={4}
                      _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                      _expanded={{ bg: 'rgba(255, 255, 255, 0.08)' }}
                    >
                      <HStack flex={1} justify="space-between" textAlign="left">
                        <HStack spacing={3}>
                          <Text fontSize="lg">{getLayerIcon(layer.type)}</Text>
                          <VStack align="start" spacing={0}>
                            <Text color="netflix.white" fontWeight="semibold">
                              {layer.name}
                            </Text>
                            <Text color="netflix.silver" fontSize="xs">
                              {layer.type} layer
                            </Text>
                          </VStack>
                        </HStack>
                        <AccordionIcon color="netflix.silver" />
                      </HStack>
                    </AccordionButton>
                    
                    <AccordionPanel pb={4}>
                      <SyntaxHighlighter
                        data={formatLayerData(layer)}
                        type={layer.type === 'raw' ? 'hex' : 'json'}
                        searchTerm={searchTerm}
                        maxHeight="300px"
                      />
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </Box>

            {/* Related Packets */}
            {relatedPackets.length > 0 && (
              <Box>
                <Heading size="md" color="netflix.white" mb={4}>
                  Related Packets
                </Heading>
                
                <VStack spacing={3} align="stretch">
                  {relatedPackets.slice(0, 5).map((relatedPacket, index) => (
                    <Box
                      key={index}
                      p={4}
                      bg="rgba(31, 31, 31, 0.8)"
                      borderRadius="8px"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      cursor="pointer"
                      _hover={{
                        bg: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'wireshark.accent'
                      }}
                      transition="all 0.3s ease"
                    >
                      <VStack align="start" spacing={1}>
                        <Text color="netflix.white" fontSize="sm" fontWeight="medium">
                          {relatedPacket.src} → {relatedPacket.dst}
                        </Text>
                        <Text color="netflix.silver" fontSize="xs">
                          {relatedPacket.proto} • {relatedPacket.length} bytes
                        </Text>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>
      </MotionBox>
    </AnimatePresence>
  )
}

export default PacketDetailsSidebar