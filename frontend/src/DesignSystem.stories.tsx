import type { Meta, StoryObj } from '@storybook/react'
import { Box, Text, Stack, Flex, Grid, Button, Icon } from '@chakra-ui/react'
import { designTokens } from '../tokens/designTokens'
import typography from '../typography'
import animations from '../animations'
import { NetflixCard, DataCard, NetflixContainer, AnimatedStack } from '../composition'
import * as Icons from '../icons'

const meta: Meta = {
  title: 'Design System/Overview',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete overview of the AI Shark Design System - a Netflix-inspired design system for network packet analysis applications.'
      }
    }
  }
}

export default meta

// Quick showcase component
const QuickShowcase = ({ title, description, children }) => (
  <Box
    padding={6}
    bg="gray.800"
    borderRadius="lg"
    border="1px solid"
    borderColor="whiteAlpha.200"
    height="100%"
  >
    <Stack spacing={4}>
      <Box>
        <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={2}>
          {title}
        </Text>
        <Text fontSize="sm" color="gray.400">
          {description}
        </Text>
      </Box>
      <Box flex={1}>
        {children}
      </Box>
    </Stack>
  </Box>
)

export const SystemOverview: StoryObj = {
  render: () => (
    <Box bg="gray.900" minHeight="100vh">
      {/* Hero Section */}
      <Box
        background="linear-gradient(135deg, rgba(229, 9, 20, 0.8), rgba(6, 182, 212, 0.6))"
        padding={16}
        textAlign="center"
      >
        <NetflixContainer size="xl">
          <Stack spacing={6}>
            <Text
              fontSize="5xl"
              fontWeight="bold"
              color="white"
              textShadow="2px 2px 4px rgba(0, 0, 0, 0.8)"
            >
              AI Shark Design System
            </Text>
            <Text
              fontSize="xl"
              color="white"
              maxWidth="600px"
              margin="0 auto"
              textShadow="1px 1px 2px rgba(0, 0, 0, 0.6)"
            >
              A Netflix-inspired design system for network packet analysis applications
            </Text>
            <Flex gap={4} justify="center">
              <Button colorScheme="whiteAlpha" size="lg" variant="solid">
                Explore Components
              </Button>
              <Button colorScheme="whiteAlpha" size="lg" variant="outline">
                View Documentation
              </Button>
            </Flex>
          </Stack>
        </NetflixContainer>
      </Box>

      {/* Quick Overview */}
      <NetflixContainer size="xl" paddingY={16}>
        <Stack spacing={12}>
          {/* System Components */}
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={8} textAlign="center">
              System Components
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
              <QuickShowcase
                title="Design Tokens"
                description="Consistent colors, spacing, typography, and other design properties"
              >
                <Flex gap={2} wrap="wrap">
                  <Box width="40px" height="40px" bg={designTokens.colors.primary[500]} borderRadius="md" />
                  <Box width="40px" height="40px" bg={designTokens.colors.accent[500]} borderRadius="md" />
                  <Box width="40px" height="40px" bg={designTokens.colors.semantic.success} borderRadius="md" />
                  <Box width="40px" height="40px" bg={designTokens.colors.semantic.warning} borderRadius="md" />
                </Flex>
                <Text fontSize="xs" color="gray.500" marginTop={2}>
                  Netflix Red, Wireshark Cyan, and semantic colors
                </Text>
              </QuickShowcase>

              <QuickShowcase
                title="Icon Library"
                description="Network-themed icons for packet analysis and monitoring"
              >
                <Flex gap={3} wrap="wrap">
                  <Icon as={Icons.TCPIcon} boxSize={8} color="cyan.400" />
                  <Icon as={Icons.UDPIcon} boxSize={8} color="green.400" />
                  <Icon as={Icons.NetworkIcon} boxSize={8} color="blue.400" />
                  <Icon as={Icons.PacketIcon} boxSize={8} color="purple.400" />
                </Flex>
                <Text fontSize="xs" color="gray.500" marginTop={2}>
                  Protocol icons, infrastructure, and status indicators
                </Text>
              </QuickShowcase>

              <QuickShowcase
                title="Typography"
                description="Netflix Sans font hierarchy with network-specific styles"
              >
                <Stack spacing={2}>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    Heading Style
                  </Text>
                  <Text fontSize="sm" color="gray.300">
                    Body text for descriptions
                  </Text>
                  <Text fontSize="xs" fontFamily="mono" color="cyan.400">
                    192.168.1.1:8080
                  </Text>
                </Stack>
              </QuickShowcase>

              <QuickShowcase
                title="Animations"
                description="Netflix-inspired motion design with Framer Motion"
              >
                <Box
                  width="60px"
                  height="60px"
                  bg="cyan.500"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  animation="pulse 2s infinite"
                >
                  <Text fontSize="xs" fontWeight="bold" color="white">
                    Motion
                  </Text>
                </Box>
                <Text fontSize="xs" color="gray.500" marginTop={2}>
                  Smooth transitions and micro-interactions
                </Text>
              </QuickShowcase>

              <QuickShowcase
                title="Composition Patterns"
                description="Layout patterns and component compositions"
              >
                <Box bg="gray.700" borderRadius="md" padding={3}>
                  <Box bg="gray.600" height="20px" borderRadius="sm" marginBottom={2} />
                  <Flex gap={2}>
                    <Box bg="gray.600" height="40px" borderRadius="sm" flex={2} />
                    <Box bg="gray.600" height="40px" borderRadius="sm" flex={1} />
                  </Flex>
                </Box>
                <Text fontSize="xs" color="gray.500" marginTop={2}>
                  Page layouts, cards, and dashboard patterns
                </Text>
              </QuickShowcase>

              <QuickShowcase
                title="Accessibility"
                description="WCAG 2.1 AA compliance with reduced motion support"
              >
                <Stack spacing={2}>
                  <Flex align="center" gap={2}>
                    <Box width="12px" height="12px" bg="green.400" borderRadius="full" />
                    <Text fontSize="xs" color="white">High contrast</Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Box width="12px" height="12px" bg="green.400" borderRadius="full" />
                    <Text fontSize="xs" color="white">Keyboard navigation</Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Box width="12px" height="12px" bg="green.400" borderRadius="full" />
                    <Text fontSize="xs" color="white">Screen reader support</Text>
                  </Flex>
                </Stack>
              </QuickShowcase>
            </Grid>
          </Box>

          {/* Key Features */}
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={8} textAlign="center">
              Key Features
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
              <NetflixCard
                title="Netflix-Inspired Aesthetic"
                subtitle="Premium dark theme with red and cyan accents"
              >
                <Text color="gray.300" fontSize="sm">
                  Captures the premium feel of Netflix's interface while adapting it for 
                  technical network analysis applications.
                </Text>
              </NetflixCard>

              <NetflixCard
                title="Network Analysis Focus"
                subtitle="Purpose-built for packet analysis"
              >
                <Text color="gray.300" fontSize="sm">
                  Specialized components and patterns designed specifically for network 
                  monitoring, packet capture, and protocol analysis.
                </Text>
              </NetflixCard>

              <NetflixCard
                title="Responsive Design"
                subtitle="Mobile-first approach with adaptive layouts"
              >
                <Text color="gray.300" fontSize="sm">
                  Fully responsive components that work seamlessly across desktop, 
                  tablet, and mobile devices.
                </Text>
              </NetflixCard>

              <NetflixCard
                title="Performance Optimized"
                subtitle="Efficient animations and lazy loading"
              >
                <Text color="gray.300" fontSize="sm">
                  Built with performance in mind, including optimized animations, 
                  virtual scrolling, and code splitting.
                </Text>
              </NetflixCard>

              <NetflixCard
                title="Developer Experience"
                subtitle="Comprehensive Storybook documentation"
              >
                <Text color="gray.300" fontSize="sm">
                  Detailed documentation, live examples, and interactive controls 
                  for all components and patterns.
                </Text>
              </NetflixCard>

              <NetflixCard
                title="Accessibility First"
                subtitle="WCAG 2.1 AA compliant components"
              >
                <Text color="gray.300" fontSize="sm">
                  All components include proper ARIA labels, keyboard navigation, 
                  and support for reduced motion preferences.
                </Text>
              </NetflixCard>
            </Grid>
          </Box>

          {/* Usage Examples */}
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={8} textAlign="center">
              Real-World Examples
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
              <DataCard
                title="Live Packet Count"
                value="24.8K"
                subtitle="Packets captured"
                trend={{ positive: true, value: '+15%' }}
                icon={<Icon as={Icons.PacketIcon} />}
                color="accent"
              />
              
              <DataCard
                title="Active Connections"
                value="1,247"
                subtitle="TCP connections"
                trend={{ positive: false, value: '-3%' }}
                icon={<Icon as={Icons.ConnectedIcon} />}
                color="success"
              />
              
              <DataCard
                title="Bandwidth Usage"
                value="156 MB/s"
                subtitle="Current throughput"
                trend={{ positive: true, value: '+8%' }}
                icon={<Icon as={Icons.NetworkIcon} />}
                color="warning"
              />
              
              <DataCard
                title="Security Alerts"
                value="3"
                subtitle="Requires attention"
                icon={<Icon as={Icons.AlertIcon} />}
                color="error"
              />
            </Grid>
          </Box>

          {/* Technology Stack */}
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={8} textAlign="center">
              Technology Stack
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
              {[
                { name: 'React', description: 'Component framework' },
                { name: 'Chakra UI', description: 'Base component library' },
                { name: 'Framer Motion', description: 'Animation library' },
                { name: 'Storybook', description: 'Component documentation' },
                { name: 'TypeScript', description: 'Type safety' },
                { name: 'Vite', description: 'Build tool' }
              ].map((tech) => (
                <Box
                  key={tech.name}
                  padding={4}
                  bg="gray.800"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  <Text fontSize="md" fontWeight="semibold" color="white" marginBottom={1}>
                    {tech.name}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {tech.description}
                  </Text>
                </Box>
              ))}
            </Grid>
          </Box>

          {/* Getting Started */}
          <Box
            background="linear-gradient(135deg, rgba(229, 9, 20, 0.1), rgba(6, 182, 212, 0.1))"
            padding={8}
            borderRadius="lg"
            border="1px solid"
            borderColor="whiteAlpha.200"
            textAlign="center"
          >
            <Stack spacing={6}>
              <Text fontSize="2xl" fontWeight="bold" color="white">
                Start Building with AI Shark Design System
              </Text>
              <Text fontSize="lg" color="gray.300" maxWidth="600px" margin="0 auto">
                Explore the complete component library, design tokens, and patterns to build 
                consistent network analysis interfaces.
              </Text>
              <Flex gap={4} justify="center" wrap="wrap">
                <Button colorScheme="red" size="lg" leftIcon={<Icon as={Icons.PlayIcon} />}>
                  View Components
                </Button>
                <Button colorScheme="cyan" variant="outline" size="lg" leftIcon={<Icon as={Icons.BookIcon} />}>
                  Read Documentation
                </Button>
                <Button colorScheme="gray" variant="ghost" size="lg" leftIcon={<Icon as={Icons.DownloadIcon} />}>
                  Download Assets
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Stack>
      </NetflixContainer>
    </Box>
  )
}

export const ColorPalette: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={8} textAlign="center">
        Complete Color Palette
      </Text>
      
      <NetflixContainer size="xl">
        <Stack spacing={8}>
          {/* Brand Colors */}
          <Box>
            <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={4}>
              Brand Colors
            </Text>
            <Flex gap={4} wrap="wrap">
              <Box textAlign="center">
                <Box
                  width="100px"
                  height="100px"
                  bg={designTokens.colors.primary[500]}
                  borderRadius="lg"
                  marginBottom={2}
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                />
                <Text fontSize="sm" fontWeight="semibold" color="white">Netflix Red</Text>
                <Text fontSize="xs" color="gray.400" fontFamily="mono">{designTokens.colors.primary[500]}</Text>
              </Box>
              <Box textAlign="center">
                <Box
                  width="100px"
                  height="100px"
                  bg={designTokens.colors.accent[500]}
                  borderRadius="lg"
                  marginBottom={2}
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                />
                <Text fontSize="sm" fontWeight="semibold" color="white">Wireshark Cyan</Text>
                <Text fontSize="xs" color="gray.400" fontFamily="mono">{designTokens.colors.accent[500]}</Text>
              </Box>
            </Flex>
          </Box>

          {/* Protocol Colors */}
          <Box>
            <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={4}>
              Protocol Colors
            </Text>
            <Flex gap={4} wrap="wrap">
              {Object.entries(designTokens.colors.protocol).map(([protocol, color]) => (
                <Box key={protocol} textAlign="center">
                  <Box
                    width="80px"
                    height="80px"
                    bg={color}
                    borderRadius="lg"
                    marginBottom={2}
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                  />
                  <Text fontSize="sm" fontWeight="semibold" color="white">{protocol.toUpperCase()}</Text>
                  <Text fontSize="xs" color="gray.400" fontFamily="mono">{color}</Text>
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Semantic Colors */}
          <Box>
            <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={4}>
              Semantic Colors
            </Text>
            <Flex gap={4} wrap="wrap">
              {Object.entries(designTokens.colors.semantic).map(([type, color]) => (
                <Box key={type} textAlign="center">
                  <Box
                    width="80px"
                    height="80px"
                    bg={color}
                    borderRadius="lg"
                    marginBottom={2}
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                  />
                  <Text fontSize="sm" fontWeight="semibold" color="white">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  <Text fontSize="xs" color="gray.400" fontFamily="mono">{color}</Text>
                </Box>
              ))}
            </Flex>
          </Box>
        </Stack>
      </NetflixContainer>
    </Box>
  )
}