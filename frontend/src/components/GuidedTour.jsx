import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
  Progress,
  useDisclosure,
  Kbd,
  Code,
  Divider,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  // InfoIcon,
  // CheckCircleIcon
// } from '@chakra-ui/icons'

// Tour steps configuration
const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Wireshark+ Web',
    content: (
      <VStack align="start" spacing={4}>
        <Text>
          Welcome to Wireshark+ Web Dashboard! This tool provides real-time network packet 
          analysis with AI-powered insights directly in your browser.
        </Text>
        <Box p={3} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="blue.400">
          <Text fontSize="sm" fontWeight="semibold" color="blue.700">
            What you can do:
          </Text>
          <List spacing={1} mt={2}>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              Capture network packets in real-time
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              Filter traffic with BPF expressions
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              Get AI explanations for suspicious packets
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              Detect traffic anomalies automatically
            </ListItem>
          </List>
        </Box>
      </VStack>
    )
  },
  {
    id: 'capture-settings',
    title: 'Capture Settings',
    content: (
      <VStack align="start" spacing={4}>
        <Text>
          Start by configuring your packet capture settings. You'll need to select a network 
          interface and optionally apply a BPF filter.
        </Text>
        <Box p={3} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="orange.400">
          <Text fontSize="sm" fontWeight="semibold" color="orange.700" mb={2}>
            Network Interface:
          </Text>
          <Text fontSize="sm">
            Choose the network interface you want to monitor (e.g., eth0, wlan0). 
            This determines which network traffic will be captured.
          </Text>
        </Box>
        <Box p={3} bg="green.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="green.400">
          <Text fontSize="sm" fontWeight="semibold" color="green.700" mb={2}>
            BPF Filter (Optional):
          </Text>
          <Text fontSize="sm" mb={2}>
            Use Berkeley Packet Filter expressions to focus on specific traffic:
          </Text>
          <VStack align="start" spacing={1}>
            <HStack>
              <Code fontSize="xs">port 80</Code>
              <Text fontSize="xs">- HTTP traffic only</Text>
            </HStack>
            <HStack>
              <Code fontSize="xs">host 192.168.1.1</Code>
              <Text fontSize="xs">- Traffic to/from specific IP</Text>
            </HStack>
            <HStack>
              <Code fontSize="xs">tcp and port 443</Code>
              <Text fontSize="xs">- HTTPS traffic only</Text>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    )
  },
  {
    id: 'packet-table',
    title: 'Live Packet Table',
    content: (
      <VStack align="start" spacing={4}>
        <Text>
          Once capture starts, packets will appear in real-time in the main table. 
          Each row represents a captured network packet.
        </Text>
        <Box p={3} bg="purple.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="purple.400">
          <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={2}>
            Table Columns:
          </Text>
          <VStack align="start" spacing={1}>
            <HStack>
              <Badge colorScheme="blue" size="sm">Timestamp</Badge>
              <Text fontSize="xs">When the packet was captured</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="green" size="sm">Source</Badge>
              <Text fontSize="xs">Origin IP address</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="orange" size="sm">Destination</Badge>
              <Text fontSize="xs">Target IP address</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="red" size="sm">Protocol</Badge>
              <Text fontSize="xs">Network protocol (TCP, UDP, etc.)</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="teal" size="sm">Ports</Badge>
              <Text fontSize="xs">Source and destination ports</Text>
            </HStack>
          </VStack>
        </Box>
        <Text fontSize="sm" color="gray.600">
          💡 Click on any packet row to see detailed information and get AI analysis.
        </Text>
      </VStack>
    )
  },
  {
    id: 'ai-analysis',
    title: 'AI Packet Analysis',
    content: (
      <VStack align="start" spacing={4}>
        <Text>
          Select any packet to view its details and get AI-powered explanations. 
          This helps you understand what the traffic means and identify potential security issues.
        </Text>
        <Box p={3} bg="cyan.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="cyan.400">
          <Text fontSize="sm" fontWeight="semibold" color="cyan.700" mb={2}>
            AI Analysis Features:
          </Text>
          <List spacing={1}>
            <ListItem fontSize="sm">
              <span style={{ color: '#0bc5ea', marginRight: '8px' }}>ℹ️</span>
              Protocol explanation and purpose
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#0bc5ea', marginRight: '8px' }}>ℹ️</span>
              Security assessment and risk level
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#0bc5ea', marginRight: '8px' }}>ℹ️</span>
              Recommendations for investigation
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#0bc5ea', marginRight: '8px' }}>ℹ️</span>
              Context about source/destination
            </ListItem>
          </List>
        </Box>
        <Text fontSize="sm" color="gray.600">
          🤖 The AI analysis works with both real OpenAI API and mock responses for development.
        </Text>
      </VStack>
    )
  },
  {
    id: 'anomaly-alerts',
    title: 'Anomaly Detection',
    content: (
      <VStack align="start" spacing={4}>
        <Text>
          The system automatically detects unusual traffic patterns and generates alerts. 
          These help you spot potential security incidents or network issues.
        </Text>
        <Box p={3} bg="red.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="red.400">
          <Text fontSize="sm" fontWeight="semibold" color="red.700" mb={2}>
            Alert Types:
          </Text>
          <VStack align="start" spacing={1}>
            <HStack>
              <Badge colorScheme="orange" size="sm">Traffic Spike</Badge>
              <Text fontSize="xs">Sudden increase in packet rate</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="red" size="sm">Anomaly</Badge>
              <Text fontSize="xs">Unusual traffic patterns detected</Text>
            </HStack>
          </VStack>
        </Box>
        <Text fontSize="sm" color="gray.600">
          🔍 Click on any alert to filter the packet table to show traffic from that time period.
        </Text>
      </VStack>
    )
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Navigation',
    content: (
      <VStack align="start" spacing={4}>
        <Text>
          Use keyboard shortcuts for efficient navigation and accessibility.
        </Text>
        <Box p={3} bg="gray.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="gray.400">
          <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
            Keyboard Shortcuts:
          </Text>
          <VStack align="start" spacing={2}>
            <HStack>
              <Kbd>Tab</Kbd>
              <Text fontSize="sm">Navigate between elements</Text>
            </HStack>
            <HStack>
              <Kbd>Enter</Kbd>
              <Text fontSize="sm">Select packet or activate button</Text>
            </HStack>
            <HStack>
              <Kbd>Space</Kbd>
              <Text fontSize="sm">Activate buttons and checkboxes</Text>
            </HStack>
            <HStack>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <Text fontSize="sm">Navigate packet table rows</Text>
            </HStack>
            <HStack>
              <Kbd>Esc</Kbd>
              <Text fontSize="sm">Close modals and panels</Text>
            </HStack>
          </VStack>
        </Box>
        <Text fontSize="sm" color="gray.600">
          ♿ The interface is fully accessible with screen readers and keyboard navigation.
        </Text>
      </VStack>
    )
  },
  {
    id: 'getting-started',
    title: 'Ready to Start!',
    content: (
      <VStack align="start" spacing={4}>
        <Text>
          You're all set! Here's a quick checklist to get started with packet analysis:
        </Text>
        <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
          <Text fontSize="sm" fontWeight="semibold" color="green.700" mb={3}>
            Quick Start Checklist:
          </Text>
          <List spacing={2}>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              <strong>1.</strong> Select a network interface from the dropdown
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              <strong>2.</strong> Optionally add a BPF filter (or leave empty for all traffic)
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              <strong>3.</strong> Click "Apply Settings" to start capturing
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              <strong>4.</strong> Watch packets appear in real-time
            </ListItem>
            <ListItem fontSize="sm">
              <span style={{ color: '#38a169', marginRight: '8px' }}>✅</span>
              <strong>5.</strong> Click any packet for detailed analysis
            </ListItem>
          </List>
        </Box>
        <Text fontSize="sm" color="gray.600" fontStyle="italic">
          💡 Hover over any field or button to see helpful tooltips with more information!
        </Text>
      </VStack>
    )
  }
]

/**
 * Guided tour component for new users
 */
const GuidedTour = ({ isOpen, onClose, autoStart = false }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTour, setHasSeenTour] = useState(false)

  // Check if user has seen the tour before
  useEffect(() => {
    const tourSeen = localStorage.getItem('wireshark-web-tour-seen')
    setHasSeenTour(!!tourSeen)
  }, [])

  // Auto-start tour for new users
  useEffect(() => {
    if (autoStart && !hasSeenTour && !isOpen) {
      // Small delay to let the app load
      const timer = setTimeout(() => {
        onOpen()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoStart, hasSeenTour, isOpen])

  const { isOpen: modalIsOpen, onOpen, onClose: modalOnClose } = useDisclosure({
    isOpen,
    onClose
  })

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    // Mark tour as seen
    localStorage.setItem('wireshark-web-tour-seen', 'true')
    setHasSeenTour(true)
    setCurrentStep(0)
    modalOnClose()
  }

  const handleSkip = () => {
    handleClose()
  }

  const currentStepData = TOUR_STEPS[currentStep]
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100

  return (
    <Modal 
      isOpen={modalIsOpen} 
      onClose={handleClose}
      size="xl"
      closeOnOverlayClick={false}
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="600px">
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text>{currentStepData.title}</Text>
              <Badge colorScheme="blue" variant="subtle">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </Badge>
            </HStack>
            <Progress 
              value={progress} 
              size="sm" 
              colorScheme="blue" 
              w="full"
              borderRadius="full"
            />
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          {currentStepData.content}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full" justify="space-between">
            <Button
              variant="ghost"
              onClick={handleSkip}
              size="sm"
            >
              Skip Tour
            </Button>
            
            <HStack spacing={2}>
              <Button
                leftIcon={<ChevronLeftIcon />}
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              
              {currentStep < TOUR_STEPS.length - 1 ? (
                <Button
                  rightIcon={<ChevronRightIcon />}
                  onClick={handleNext}
                  colorScheme="blue"
                  size="sm"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleClose}
                  colorScheme="green"
                  size="sm"
                >
                  Get Started!
                </Button>
              )}
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

/**
 * Hook to manage guided tour state
 */
export const useGuidedTour = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const startTour = () => {
    onOpen()
  }
  
  const resetTour = () => {
    localStorage.removeItem('wireshark-web-tour-seen')
    onOpen()
  }
  
  return {
    isOpen,
    onClose,
    startTour,
    resetTour
  }
}

export default GuidedTour