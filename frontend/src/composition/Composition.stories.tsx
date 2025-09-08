import type { Meta, StoryObj } from '@storybook/react'
import { Box, Text, Stack, Button, Icon, Flex } from '@chakra-ui/react'
import { 
  NetflixPageLayout,
  NetflixCardGrid,
  NetflixHeroSection,
  DashboardLayout,
  SidebarLayout,
  ContentSection,
  SplitLayout,
  NetflixCard,
  DataCard,
  NetflixContainer,
  AnimatedStack,
  GlassContainer
} from '../composition'
import * as Icons from '../icons'

const meta: Meta = {
  title: 'Design System/Composition Patterns',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Netflix-inspired layout patterns and component compositions for building consistent interfaces in the AI Shark application.'
      }
    }
  }
}

export default meta

// Sample content components
const SampleHeader = () => (
  <Flex align="center" justify="space-between" padding={4} bg="gray.800">
    <Text fontSize="xl" fontWeight="bold" color="white">AI Shark</Text>
    <Flex gap={4}>
      <Button size="sm" variant="ghost" colorScheme="whiteAlpha">Dashboard</Button>
      <Button size="sm" variant="ghost" colorScheme="whiteAlpha">Analytics</Button>
      <Button size="sm" variant="ghost" colorScheme="whiteAlpha">Settings</Button>
    </Flex>
  </Flex>
)

const SampleSidebar = () => (
  <Stack spacing={2} padding={4}>
    {['Overview', 'Packets', 'Protocols', 'Interfaces', 'Filters'].map((item) => (
      <Button
        key={item}
        variant="ghost"
        colorScheme="whiteAlpha"
        justifyContent="flex-start"
        leftIcon={<Icon as={Icons.NetworkIcon} />}
      >
        {item}
      </Button>
    ))}
  </Stack>
)

const SampleFooter = () => (
  <Flex align="center" justify="center" padding={4} bg="gray.800">
    <Text fontSize="sm" color="gray.400">© 2024 AI Shark Network Analyzer</Text>
  </Flex>
)

export const PageLayouts: StoryObj = {
  render: () => (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" color="white" padding={6} paddingBottom={4}>
        Page Layout Examples
      </Text>
      
      {/* Basic Layout */}
      <Box marginBottom={8} height="400px">
        <Text fontSize="lg" fontWeight="semibold" color="white" paddingX={6} marginBottom={4}>
          Basic Layout (No Sidebar)
        </Text>
        <Box height="300px" border="2px solid" borderColor="gray.600" borderRadius="lg" overflow="hidden">
          <NetflixPageLayout
            header={<SampleHeader />}
            footer={<SampleFooter />}
          >
            <Box padding={6}>
              <Text color="white">Main content area without sidebar</Text>
            </Box>
          </NetflixPageLayout>
        </Box>
      </Box>

      {/* Layout with Sidebar */}
      <Box marginBottom={8} height="400px">
        <Text fontSize="lg" fontWeight="semibold" color="white" paddingX={6} marginBottom={4}>
          Layout with Sidebar
        </Text>
        <Box height="300px" border="2px solid" borderColor="gray.600" borderRadius="lg" overflow="hidden">
          <NetflixPageLayout
            header={<SampleHeader />}
            sidebar={<SampleSidebar />}
            footer={<SampleFooter />}
            sidebarWidth="240px"
          >
            <Box padding={6}>
              <Text color="white">Main content area with navigation sidebar</Text>
            </Box>
          </NetflixPageLayout>
        </Box>
      </Box>
    </Box>
  )
}

export const HeroSections: StoryObj = {
  render: () => (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" color="white" padding={6} paddingBottom={4}>
        Hero Section Examples
      </Text>
      
      {/* Basic Hero */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" paddingX={6} marginBottom={4}>
          Basic Hero Section
        </Text>
        <Box border="2px solid" borderColor="gray.600" borderRadius="lg" overflow="hidden">
          <NetflixHeroSection minHeight="300px">
            <Stack spacing={6} textAlign="center">
              <Text fontSize="4xl" fontWeight="bold" color="white">
                AI Shark Network Analyzer
              </Text>
              <Text fontSize="xl" color="gray.300" maxWidth="600px" margin="0 auto">
                Professional network packet analysis and real-time monitoring for security professionals
              </Text>
              <Flex gap={4} justify="center">
                <Button colorScheme="red" size="lg" leftIcon={<Icon as={Icons.PlayIcon} />}>
                  Start Analysis
                </Button>
                <Button variant="outline" colorScheme="whiteAlpha" size="lg">
                  Learn More
                </Button>
              </Flex>
            </Stack>
          </NetflixHeroSection>
        </Box>
      </Box>

      {/* Hero with Background Gradient */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" paddingX={6} marginBottom={4}>
          Hero with Custom Background
        </Text>
        <Box border="2px solid" borderColor="gray.600" borderRadius="lg" overflow="hidden">
          <NetflixHeroSection 
            minHeight="300px"
            background="linear-gradient(135deg, rgba(229, 9, 20, 0.8), rgba(6, 182, 212, 0.6))"
            overlayOpacity={0.3}
          >
            <Stack spacing={4} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="white">
                Real-Time Network Monitoring
              </Text>
              <Text fontSize="lg" color="white" maxWidth="500px" margin="0 auto">
                Capture and analyze network traffic with enterprise-grade tools
              </Text>
              <Button colorScheme="whiteAlpha" size="lg" variant="solid">
                Get Started
              </Button>
            </Stack>
          </NetflixHeroSection>
        </Box>
      </Box>
    </Box>
  )
}

export const CardGrids: StoryObj = {
  render: () => (
    <Box padding={6}>
      <Text fontSize="2xl" fontWeight="bold" color="white" marginBottom={6}>
        Card Grid Layouts
      </Text>
      
      {/* Netflix Cards */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
          Netflix-Style Cards
        </Text>
        <NetflixCardGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[
            { title: 'Network Monitor', subtitle: 'Real-time packet capture', icon: Icons.NetworkIcon },
            { title: 'Protocol Analysis', subtitle: 'Deep packet inspection', icon: Icons.TCPIcon },
            { title: 'Security Dashboard', subtitle: 'Threat detection', icon: Icons.ShieldIcon },
            { title: 'Performance Metrics', subtitle: 'Network statistics', icon: Icons.ChartIcon },
            { title: 'Alert System', subtitle: 'Automated notifications', icon: Icons.AlertIcon },
            { title: 'Export Tools', subtitle: 'Data export utilities', icon: Icons.DownloadIcon }
          ].map((card, index) => (
            <NetflixCard
              key={index}
              title={card.title}
              subtitle={card.subtitle}
              actions={
                <Button size="sm" colorScheme="cyan" variant="ghost">
                  Open
                </Button>
              }
            >
              <Flex align="center" gap={3} marginY={3}>
                <Icon as={card.icon} boxSize={6} color="cyan.400" />
                <Text color="gray.300" fontSize="sm">
                  Click to explore {card.title.toLowerCase()}
                </Text>
              </Flex>
            </NetflixCard>
          ))}
        </NetflixCardGrid>
      </Box>

      {/* Data Cards */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
          Data Metric Cards
        </Text>
        <NetflixCardGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <DataCard
            title="Active Connections"
            value="1,247"
            subtitle="TCP connections"
            trend={{ positive: true, value: '+12%' }}
            icon={<Icon as={Icons.ConnectedIcon} />}
            color="success"
          />
          <DataCard
            title="Packets/Sec"
            value="8.2K"
            subtitle="Current rate"
            trend={{ positive: false, value: '-3%' }}
            icon={<Icon as={Icons.PacketIcon} />}
            color="accent"
          />
          <DataCard
            title="Bandwidth Usage"
            value="156 MB/s"
            subtitle="Network throughput"
            trend={{ positive: true, value: '+8%' }}
            icon={<Icon as={Icons.NetworkIcon} />}
            color="warning"
          />
          <DataCard
            title="Alerts"
            value="3"
            subtitle="Security warnings"
            icon={<Icon as={Icons.AlertIcon} />}
            color="error"
          />
        </NetflixCardGrid>
      </Box>
    </Box>
  )
}

export const DashboardLayouts: StoryObj = {
  render: () => (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" color="white" padding={6} paddingBottom={4}>
        Dashboard Layout Examples
      </Text>
      
      <Box height="500px" border="2px solid" borderColor="gray.600" borderRadius="lg" overflow="hidden" marginX={6}>
        <DashboardLayout columns={12} spacing={4}>
          {/* Header spanning full width */}
          <Box gridColumn="1 / -1" gridRow="1">
            <Box bg="gray.800" padding={4} borderRadius="lg">
              <Text fontSize="lg" fontWeight="semibold" color="white">
                Network Dashboard Header
              </Text>
            </Box>
          </Box>

          {/* Sidebar */}
          <Box gridColumn="1 / 4" gridRow="2 / 6">
            <Box bg="gray.800" padding={4} borderRadius="lg" height="100%">
              <Text fontSize="md" fontWeight="semibold" color="white" marginBottom={3}>
                Navigation
              </Text>
              <Stack spacing={2}>
                {['Overview', 'Packets', 'Analytics'].map((item) => (
                  <Button key={item} size="sm" variant="ghost" colorScheme="whiteAlpha" justifyContent="flex-start">
                    {item}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Main content area */}
          <Box gridColumn="4 / 10" gridRow="2 / 5">
            <Box bg="gray.800" padding={4} borderRadius="lg" height="100%">
              <Text fontSize="md" fontWeight="semibold" color="white" marginBottom={3}>
                Packet Analysis
              </Text>
              <Text color="gray.400" fontSize="sm">
                Real-time packet data visualization
              </Text>
            </Box>
          </Box>

          {/* Sidebar widgets */}
          <Box gridColumn="10 / -1" gridRow="2 / 4">
            <DataCard
              title="Live Packets"
              value="2.1K"
              subtitle="Last minute"
              icon={<Icon as={Icons.PacketIcon} />}
              color="accent"
            />
          </Box>

          <Box gridColumn="10 / -1" gridRow="4 / 6">
            <DataCard
              title="Bandwidth"
              value="89 MB/s"
              subtitle="Current usage"
              icon={<Icon as={Icons.NetworkIcon} />}
              color="success"
            />
          </Box>

          {/* Footer stats */}
          <Box gridColumn="4 / -1" gridRow="5 / 6">
            <Box bg="gray.800" padding={4} borderRadius="lg">
              <Flex justify="space-between" align="center">
                <Text color="white" fontSize="sm">Status: Monitoring Active</Text>
                <Text color="cyan.400" fontSize="sm">Interface: eth0</Text>
                <Text color="green.400" fontSize="sm">Uptime: 2h 34m</Text>
              </Flex>
            </Box>
          </Box>
        </DashboardLayout>
      </Box>
    </Box>
  )
}

export const SplitLayouts: StoryObj = {
  render: () => (
    <Box padding={6}>
      <Text fontSize="2xl" fontWeight="bold" color="white" marginBottom={6}>
        Split Layout Examples
      </Text>
      
      {/* 50/50 Split */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
          Equal Split Layout (50/50)
        </Text>
        <Box border="2px solid" borderColor="gray.600" borderRadius="lg" padding={4}>
          <SplitLayout
            left={
              <Box bg="gray.800" padding={6} borderRadius="lg" height="200px">
                <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={3}>
                  Packet List
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Real-time packet capture data
                </Text>
              </Box>
            }
            right={
              <Box bg="gray.800" padding={6} borderRadius="lg" height="200px">
                <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={3}>
                  Packet Details
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Selected packet analysis
                </Text>
              </Box>
            }
            ratio={[1, 1]}
            spacing={6}
          />
        </Box>
      </Box>

      {/* 2/3 - 1/3 Split */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
          Asymmetric Split Layout (2:1)
        </Text>
        <Box border="2px solid" borderColor="gray.600" borderRadius="lg" padding={4}>
          <SplitLayout
            left={
              <Box bg="gray.800" padding={6} borderRadius="lg" height="200px">
                <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={3}>
                  Network Visualization
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Interactive network topology and traffic flow visualization
                </Text>
              </Box>
            }
            right={
              <Stack spacing={4}>
                <DataCard
                  title="Active Flows"
                  value="847"
                  icon={<Icon as={Icons.NetworkIcon} />}
                  color="accent"
                />
                <DataCard
                  title="Anomalies"
                  value="2"
                  icon={<Icon as={Icons.AlertIcon} />}
                  color="warning"
                />
              </Stack>
            }
            ratio={[2, 1]}
            spacing={6}
          />
        </Box>
      </Box>
    </Box>
  )
}

export const ContentSections: StoryObj = {
  render: () => (
    <Box padding={6}>
      <Text fontSize="2xl" fontWeight="bold" color="white" marginBottom={6}>
        Content Section Examples
      </Text>
      
      {/* Basic Section */}
      <Box marginBottom={8}>
        <ContentSection
          title="Network Interface Configuration"
          subtitle="Configure and manage network interfaces for packet capture"
          spacing="normal"
          actions={
            <Flex gap={2}>
              <Button size="sm" colorScheme="cyan" variant="outline">
                Add Interface
              </Button>
              <Button size="sm" colorScheme="gray" variant="ghost">
                Refresh
              </Button>
            </Flex>
          }
        >
          <Box bg="gray.800" padding={6} borderRadius="lg">
            <Stack spacing={4}>
              <Flex justify="space-between" align="center">
                <Text color="white">eth0 - Ethernet Interface</Text>
                <Box bg="green.500" width="12px" height="12px" borderRadius="full" />
              </Flex>
              <Flex justify="space-between" align="center">
                <Text color="white">wlan0 - Wireless Interface</Text>
                <Box bg="yellow.500" width="12px" height="12px" borderRadius="full" />
              </Flex>
              <Flex justify="space-between" align="center">
                <Text color="white">lo - Loopback Interface</Text>
                <Box bg="gray.500" width="12px" height="12px" borderRadius="full" />
              </Flex>
            </Stack>
          </Box>
        </ContentSection>
      </Box>

      {/* Tight Spacing Section */}
      <Box marginBottom={8}>
        <ContentSection
          title="Quick Actions"
          spacing="tight"
        >
          <Flex gap={3} wrap="wrap">
            <Button leftIcon={<Icon as={Icons.PlayIcon} />} colorScheme="green">
              Start Capture
            </Button>
            <Button leftIcon={<Icon as={Icons.StopIcon} />} colorScheme="red">
              Stop Capture
            </Button>
            <Button leftIcon={<Icon as={Icons.PauseIcon} />} colorScheme="yellow">
              Pause
            </Button>
            <Button leftIcon={<Icon as={Icons.DownloadIcon} />} colorScheme="blue">
              Export
            </Button>
          </Flex>
        </ContentSection>
      </Box>

      {/* Loose Spacing Section */}
      <Box marginBottom={8}>
        <ContentSection
          title="Protocol Statistics"
          subtitle="Breakdown of captured packets by protocol type"
          spacing="loose"
        >
          <NetflixCardGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <DataCard
              title="TCP Packets"
              value="15.2K"
              subtitle="78% of total"
              icon={<Icon as={Icons.TCPIcon} />}
              color="accent"
            />
            <DataCard
              title="UDP Packets"
              value="3.8K"
              subtitle="19% of total"
              icon={<Icon as={Icons.UDPIcon} />}
              color="success"
            />
            <DataCard
              title="Other Protocols"
              value="612"
              subtitle="3% of total"
              icon={<Icon as={Icons.NetworkIcon} />}
              color="warning"
            />
          </NetflixCardGrid>
        </ContentSection>
      </Box>
    </Box>
  )
}

export const SpecialComponents: StoryObj = {
  render: () => (
    <Box padding={6}>
      <Text fontSize="2xl" fontWeight="bold" color="white" marginBottom={6}>
        Special Composition Components
      </Text>
      
      {/* Animated Stack */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
          Animated Stack
        </Text>
        <Box border="2px solid" borderColor="gray.600" borderRadius="lg" padding={4}>
          <AnimatedStack spacing={4} stagger={0.15}>
            {['First Item', 'Second Item', 'Third Item', 'Fourth Item'].map((item, index) => (
              <Box key={index} bg="gray.800" padding={4} borderRadius="lg">
                <Text color="white">{item} - Animated entrance</Text>
              </Box>
            ))}
          </AnimatedStack>
        </Box>
      </Box>

      {/* Glass Container */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
          Glass Morphism Container
        </Text>
        <Box
          background="linear-gradient(135deg, rgba(229, 9, 20, 0.8), rgba(6, 182, 212, 0.6))"
          padding={8}
          borderRadius="lg"
        >
          <GlassContainer padding={6} borderRadius="lg">
            <Stack spacing={4}>
              <Text fontSize="lg" fontWeight="semibold" color="white">
                Glass Morphism Effect
              </Text>
              <Text color="gray.200">
                This container demonstrates the glass morphism effect with backdrop blur 
                and subtle transparency for a modern, premium feel.
              </Text>
              <Button colorScheme="whiteAlpha" variant="solid">
                Action Button
              </Button>
            </Stack>
          </GlassContainer>
        </Box>
      </Box>

      {/* Netflix Container */}
      <Box marginBottom={8}>
        <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
          Netflix Container Sizes
        </Text>
        <Stack spacing={4}>
          {['sm', 'md', 'lg', 'xl'].map((size) => (
            <Box key={size} border="1px solid" borderColor="gray.600" borderRadius="lg">
              <NetflixContainer size={size} paddingY={4}>
                <Box bg="gray.800" padding={4} borderRadius="lg">
                  <Text color="white">
                    Container size: {size} - Max width adapts to screen size
                  </Text>
                </Box>
              </NetflixContainer>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}