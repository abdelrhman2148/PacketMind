import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Heading,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Grid,
  GridItem
} from '@chakra-ui/react'
import { SearchIcon, CopyIcon, FilterIcon, DownloadIcon, TimeIcon } from '@chakra-ui/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import SyntaxHighlighter from './SyntaxHighlighter'

const MotionBox = motion(Box)

const NetflixPacketModal = ({
  isOpen,
  onClose,
  packet,
  onExplain,
  onFilter,
  onExport,
  aiResponse = null,
  aiLoading = false,
  relatedPackets = []
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState(0)

  // Enhanced packet analysis
  const packetAnalysis = useMemo(() => {
    if (!packet) return null

    return {
      metadata: {
        timestamp: new Date(packet.ts * 1000),
        direction: 'Outbound', // Could be determined from routing table
        size: packet.length,
        captureInterface: 'eth0' // Would come from capture settings
      },
      network: {
        source: packet.src,
        destination: packet.dst,
        protocol: packet.proto,
        sourcePort: packet.sport,
        destinationPort: packet.dport
      },
      security: {
        riskLevel: calculateRiskLevel(packet),
        threats: detectPotentialThreats(packet),
        recommendations: getSecurityRecommendations(packet)
      },
      performance: {
        latency: Math.random() * 50 + 1, // Simulated
        bandwidth: Math.random() * 1000 + 100, // Simulated
        efficiency: Math.random() * 100 // Simulated
      }
    }
  }, [packet])

  // Calculate risk level based on packet characteristics
  const calculateRiskLevel = (pkt) => {
    if (!pkt) return 'low'
    
    // High risk ports
    const highRiskPorts = [21, 22, 23, 135, 139, 445, 1433, 3389]
    if (pkt.dport && highRiskPorts.includes(pkt.dport)) return 'high'
    if (pkt.sport && highRiskPorts.includes(pkt.sport)) return 'high'
    
    // Medium risk for unusual protocols
    if (['ICMP', 'ARP'].includes(pkt.proto)) return 'medium'
    
    return 'low'
  }

  // Detect potential security threats
  const detectPotentialThreats = (pkt) => {
    const threats = []
    
    if (pkt.dport === 22) threats.push('SSH Access Attempt')
    if (pkt.dport === 3389) threats.push('RDP Connection')
    if (pkt.proto === 'ICMP') threats.push('Network Reconnaissance')
    if (pkt.length > 1500) threats.push('Jumbo Frame Detected')
    
    return threats
  }

  // Get security recommendations
  const getSecurityRecommendations = (pkt) => {
    const recommendations = []
    
    if (pkt.dport === 22) recommendations.push('Monitor SSH access logs')
    if (pkt.dport === 80) recommendations.push('Consider HTTPS upgrade')
    if (pkt.proto === 'UDP') recommendations.push('Verify UDP traffic legitimacy')
    
    return recommendations
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      millisecond: 3
    })
  }

  // Get risk color
  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'wireshark.error'
      case 'medium': return 'wireshark.warning'
      case 'low': return 'wireshark.success'
      default: return 'netflix.silver'
    }
  }

  // Handle copy action
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (!packet || !packetAnalysis) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="6xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay 
        bg="rgba(0, 0, 0, 0.8)" 
        backdropFilter="blur(10px)"
      />
      <ModalContent
        bg="rgba(10, 10, 10, 0.98)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        borderRadius="20px"
        boxShadow="netflix"
        maxH="90vh"
      >
        <ModalHeader
          bg="rgba(31, 31, 31, 0.9)"
          borderTopRadius="20px"
          borderBottom="1px solid rgba(255, 255, 255, 0.1)"
          pb={4}
        >
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="100%">
              <Heading size="lg" color="netflix.white" fontWeight="bold">
                🔍 Packet Analysis Dashboard
              </Heading>
              <HStack spacing={2}>
                <Badge 
                  bg={getRiskColor(packetAnalysis.security.riskLevel)}
                  color="netflix.black"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  {packetAnalysis.security.riskLevel} Risk
                </Badge>
                <Badge
                  bg="wireshark.accent"
                  color="netflix.black"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontWeight="bold"
                >
                  {packet.proto}
                </Badge>
              </HStack>
            </HStack>
            
            <Text color="netflix.silver" fontSize="md">
              {packet.src}:{packet.sport || '*'} → {packet.dst}:{packet.dport || '*'}
            </Text>
            
            <HStack spacing={4} fontSize="sm" color="netflix.silver">
              <HStack spacing={1}>
                <TimeIcon />
                <Text>{formatTimestamp(packetAnalysis.metadata.timestamp)}</Text>
              </HStack>
              <Text>•</Text>
              <Text>{packet.length} bytes</Text>
              <Text>•</Text>
              <Text>{packetAnalysis.metadata.direction}</Text>
            </HStack>
          </VStack>
        </ModalHeader>

        <ModalCloseButton 
          color="netflix.silver" 
          _hover={{ color: 'netflix.red' }}
          size="lg"
        />

        <ModalBody p={0}>
          <Tabs 
            index={selectedTab} 
            onChange={setSelectedTab}
            variant="enclosed"
            colorScheme="red"
          >
            <TabList
              bg="rgba(20, 20, 20, 0.9)"
              borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              px={6}
            >
              <Tab 
                color="netflix.silver" 
                _selected={{ 
                  color: 'netflix.white', 
                  borderColor: 'netflix.red',
                  bg: 'rgba(229, 9, 20, 0.1)'
                }}
                _hover={{ color: 'netflix.white' }}
              >
                📊 Overview
              </Tab>
              <Tab 
                color="netflix.silver" 
                _selected={{ 
                  color: 'netflix.white', 
                  borderColor: 'netflix.red',
                  bg: 'rgba(229, 9, 20, 0.1)'
                }}
                _hover={{ color: 'netflix.white' }}
              >
                🔬 Protocol Analysis
              </Tab>
              <Tab 
                color="netflix.silver" 
                _selected={{ 
                  color: 'netflix.white', 
                  borderColor: 'netflix.red',
                  bg: 'rgba(229, 9, 20, 0.1)'
                }}
                _hover={{ color: 'netflix.white' }}
              >
                🛡️ Security
              </Tab>
              <Tab 
                color="netflix.silver" 
                _selected={{ 
                  color: 'netflix.white', 
                  borderColor: 'netflix.red',
                  bg: 'rgba(229, 9, 20, 0.1)'
                }}
                _hover={{ color: 'netflix.white' }}
              >
                🤖 AI Analysis
              </Tab>
              <Tab 
                color="netflix.silver" 
                _selected={{ 
                  color: 'netflix.white', 
                  borderColor: 'netflix.red',
                  bg: 'rgba(229, 9, 20, 0.1)'
                }}
                _hover={{ color: 'netflix.white' }}
              >
                📈 Performance
              </Tab>
            </TabList>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  {/* Quick Stats */}
                  <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                    <GridItem>
                      <Box
                        p={4}
                        bg="rgba(31, 31, 31, 0.8)"
                        borderRadius="12px"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                      >
                        <Text color="netflix.silver" fontSize="sm" mb={1}>Source</Text>
                        <Text color="netflix.white" fontWeight="bold" fontSize="lg">
                          {packet.src}
                        </Text>
                        {packet.sport && (
                          <Text color="wireshark.accent" fontSize="sm">
                            Port {packet.sport}
                          </Text>
                        )}
                      </Box>
                    </GridItem>
                    
                    <GridItem>
                      <Box
                        p={4}
                        bg="rgba(31, 31, 31, 0.8)"
                        borderRadius="12px"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                      >
                        <Text color="netflix.silver" fontSize="sm" mb={1}>Destination</Text>
                        <Text color="netflix.white" fontWeight="bold" fontSize="lg">
                          {packet.dst}
                        </Text>
                        {packet.dport && (
                          <Text color="wireshark.accent" fontSize="sm">
                            Port {packet.dport}
                          </Text>
                        )}
                      </Box>
                    </GridItem>
                    
                    <GridItem>
                      <Box
                        p={4}
                        bg="rgba(31, 31, 31, 0.8)"
                        borderRadius="12px"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                      >
                        <Text color="netflix.silver" fontSize="sm" mb={1}>Protocol</Text>
                        <Text color="netflix.white" fontWeight="bold" fontSize="lg">
                          {packet.proto}
                        </Text>
                        <Text color="netflix.silver" fontSize="sm">
                          Transport Layer
                        </Text>
                      </Box>
                    </GridItem>
                    
                    <GridItem>
                      <Box
                        p={4}
                        bg="rgba(31, 31, 31, 0.8)"
                        borderRadius="12px"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                      >
                        <Text color="netflix.silver" fontSize="sm" mb={1}>Size</Text>
                        <Text color="netflix.white" fontWeight="bold" fontSize="lg">
                          {packet.length}
                        </Text>
                        <Text color="netflix.silver" fontSize="sm">
                          bytes
                        </Text>
                      </Box>
                    </GridItem>
                  </Grid>

                  {/* Packet Summary */}
                  <Box
                    p={6}
                    bg="rgba(31, 31, 31, 0.8)"
                    borderRadius="12px"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                  >
                    <Heading size="md" color="netflix.white" mb={4}>
                      Summary
                    </Heading>
                    <Text color="netflix.silver" fontFamily="mono" fontSize="sm">
                      {packet.summary}
                    </Text>
                  </Box>

                  {/* Related Packets Preview */}
                  {relatedPackets.length > 0 && (
                    <Box
                      p={6}
                      bg="rgba(31, 31, 31, 0.8)"
                      borderRadius="12px"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                    >
                      <Heading size="md" color="netflix.white" mb={4}>
                        Related Traffic
                      </Heading>
                      <VStack spacing={2} align="stretch">
                        {relatedPackets.slice(0, 3).map((related, index) => (
                          <HStack
                            key={index}
                            p={3}
                            bg="rgba(255, 255, 255, 0.03)"
                            borderRadius="8px"
                            justify="space-between"
                          >
                            <Text color="netflix.white" fontSize="sm">
                              {related.src} → {related.dst}
                            </Text>
                            <HStack spacing={2}>
                              <Badge size="sm" bg="wireshark.accent" color="netflix.black">
                                {related.proto}
                              </Badge>
                              <Text color="netflix.silver" fontSize="xs">
                                {related.length}b
                              </Text>
                            </HStack>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* Protocol Analysis Tab */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md" color="netflix.white">
                        Protocol Stack Analysis
                      </Heading>
                      <InputGroup maxW="300px">
                        <InputLeftElement>
                          <SearchIcon color="netflix.silver" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search protocol data..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          bg="rgba(255, 255, 255, 0.05)"
                          border="1px solid rgba(255, 255, 255, 0.1)"
                          color="netflix.white"
                          _placeholder={{ color: 'netflix.silver' }}
                          size="sm"
                        />
                      </InputGroup>
                    </HStack>
                    
                    <SyntaxHighlighter
                      data={JSON.stringify(packet, null, 2)}
                      type="json"
                      searchTerm={searchTerm}
                      maxHeight="500px"
                    />
                  </Box>
                </VStack>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  {/* Security Overview */}
                  <Box
                    p={6}
                    bg="rgba(31, 31, 31, 0.8)"
                    borderRadius="12px"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                  >
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md" color="netflix.white">
                        Security Assessment
                      </Heading>
                      <Badge
                        bg={getRiskColor(packetAnalysis.security.riskLevel)}
                        color="netflix.black"
                        px={4}
                        py={2}
                        borderRadius="full"
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {packetAnalysis.security.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </HStack>

                    {/* Threats */}
                    {packetAnalysis.security.threats.length > 0 && (
                      <Box mb={4}>
                        <Text color="wireshark.error" fontWeight="semibold" mb={2}>
                          🚨 Potential Threats
                        </Text>
                        <VStack spacing={2} align="stretch">
                          {packetAnalysis.security.threats.map((threat, index) => (
                            <Alert
                              key={index}
                              status="warning"
                              bg="rgba(245, 158, 11, 0.1)"
                              border="1px solid rgba(245, 158, 11, 0.3)"
                              borderRadius="8px"
                            >
                              <AlertIcon color="wireshark.warning" />
                              <AlertDescription color="netflix.white">
                                {threat}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Recommendations */}
                    {packetAnalysis.security.recommendations.length > 0 && (
                      <Box>
                        <Text color="wireshark.success" fontWeight="semibold" mb={2}>
                          💡 Security Recommendations
                        </Text>
                        <VStack spacing={2} align="stretch">
                          {packetAnalysis.security.recommendations.map((rec, index) => (
                            <Box
                              key={index}
                              p={3}
                              bg="rgba(16, 185, 129, 0.1)"
                              border="1px solid rgba(16, 185, 129, 0.3)"
                              borderRadius="8px"
                            >
                              <Text color="netflix.white" fontSize="sm">
                                {rec}
                              </Text>
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </Box>
                </VStack>
              </TabPanel>

              {/* AI Analysis Tab */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  {!aiResponse && !aiLoading && (
                    <Box textAlign="center" py={8}>
                      <Text color="netflix.silver" mb={4}>
                        Get AI-powered insights about this packet
                      </Text>
                      <Button
                        variant="netflix"
                        onClick={() => onExplain(packet)}
                        size="lg"
                      >
                        🤖 Analyze with AI
                      </Button>
                    </Box>
                  )}

                  {aiLoading && (
                    <Box
                      p={8}
                      bg="rgba(31, 31, 31, 0.8)"
                      borderRadius="12px"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      textAlign="center"
                    >
                      <VStack spacing={4}>
                        <Spinner size="xl" color="wireshark.accent" thickness="4px" />
                        <Text color="netflix.white" fontSize="lg" fontWeight="semibold">
                          AI is analyzing your packet...
                        </Text>
                        <Text color="netflix.silver">
                          This may take a few moments
                        </Text>
                        <Box w="200px" h="4px" bg="rgba(255, 255, 255, 0.1)" borderRadius="2px" overflow="hidden">
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
                  )}

                  {aiResponse && (
                    <Alert
                      status={aiResponse.error ? 'error' : 'info'}
                      bg="rgba(31, 31, 31, 0.8)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="12px"
                      flexDirection="column"
                      alignItems="start"
                      p={6}
                    >
                      <HStack mb={4} w="100%" justify="space-between">
                        <HStack>
                          <AlertIcon color={aiResponse.error ? 'wireshark.error' : 'wireshark.accent'} />
                          <AlertTitle color="netflix.white" fontSize="lg">
                            {aiResponse.error ? 'Analysis Error' : 'AI Analysis Results'}
                          </AlertTitle>
                        </HStack>
                        {aiResponse.is_mock && (
                          <Badge bg="wireshark.warning" color="netflix.black">
                            Demo Mode
                          </Badge>
                        )}
                      </HStack>
                      <AlertDescription 
                        color="netflix.silver" 
                        whiteSpace="pre-wrap"
                        fontSize="md"
                        lineHeight="1.6"
                      >
                        {aiResponse.explanation}
                      </AlertDescription>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>

              {/* Performance Tab */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                    <GridItem>
                      <Box
                        p={6}
                        bg="rgba(31, 31, 31, 0.8)"
                        borderRadius="12px"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        textAlign="center"
                      >
                        <Text color="netflix.silver" fontSize="sm" mb={2}>
                          Estimated Latency
                        </Text>
                        <Text color="wireshark.accent" fontSize="3xl" fontWeight="bold">
                          {packetAnalysis.performance.latency.toFixed(1)}
                        </Text>
                        <Text color="netflix.silver" fontSize="sm">
                          milliseconds
                        </Text>
                      </Box>
                    </GridItem>
                    
                    <GridItem>
                      <Box
                        p={6}
                        bg="rgba(31, 31, 31, 0.8)"
                        borderRadius="12px"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        textAlign="center"
                      >
                        <Text color="netflix.silver" fontSize="sm" mb={2}>
                          Bandwidth Usage
                        </Text>
                        <Text color="wireshark.success" fontSize="3xl" fontWeight="bold">
                          {packetAnalysis.performance.bandwidth.toFixed(0)}
                        </Text>
                        <Text color="netflix.silver" fontSize="sm">
                          Kbps
                        </Text>
                      </Box>
                    </GridItem>
                    
                    <GridItem>
                      <Box
                        p={6}
                        bg="rgba(31, 31, 31, 0.8)"
                        borderRadius="12px"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        textAlign="center"
                      >
                        <Text color="netflix.silver" fontSize="sm" mb={2}>
                          Efficiency Score
                        </Text>
                        <Text color="netflix.red" fontSize="3xl" fontWeight="bold">
                          {packetAnalysis.performance.efficiency.toFixed(0)}%
                        </Text>
                        <Text color="netflix.silver" fontSize="sm">
                          optimization
                        </Text>
                      </Box>
                    </GridItem>
                  </Grid>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter
          bg="rgba(31, 31, 31, 0.9)"
          borderBottomRadius="20px"
          borderTop="1px solid rgba(255, 255, 255, 0.1)"
        >
          <HStack spacing={3}>
            <Button
              variant="netflix"
              onClick={() => onExplain(packet)}
              isLoading={aiLoading}
              loadingText="Analyzing..."
            >
              🤖 AI Explain
            </Button>
            
            <Button
              variant="netflixSecondary"
              onClick={() => onFilter(packet)}
              leftIcon={<FilterIcon />}
            >
              Create Filter
            </Button>
            
            <Button
              variant="netflixSecondary"
              onClick={() => onExport(packet)}
              leftIcon={<DownloadIcon />}
            >
              Export
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => handleCopy(JSON.stringify(packet, null, 2))}
              leftIcon={<CopyIcon />}
            >
              Copy Data
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              color="netflix.silver"
              _hover={{ color: 'netflix.red' }}
            >
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default NetflixPacketModal