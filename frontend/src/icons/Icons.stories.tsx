import type { Meta, StoryObj } from '@storybook/react'
import { Box, Grid, Text, Stack, Flex, Input, Icon } from '@chakra-ui/react'
import { useState } from 'react'
import * as Icons from '../icons'

const meta: Meta = {
  title: 'Design System/Icon Library',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive icon library with network/packet themes for the AI Shark application. Icons are built using Chakra UI\'s createIcon utility and are fully customizable.'
      }
    }
  }
}

export default meta

// Icon display component
const IconDisplay = ({ name, IconComponent, category }) => (
  <Flex
    direction="column"
    align="center"
    padding={4}
    borderRadius="lg"
    bg="gray.800"
    border="1px solid"
    borderColor="whiteAlpha.200"
    _hover={{
      borderColor: 'cyan.500',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
    }}
    transition="all 0.2s"
    cursor="pointer"
    height="120px"
    justify="center"
  >
    <Icon as={IconComponent} boxSize={8} color="cyan.400" marginBottom={2} />
    <Text
      fontSize="xs"
      color="white"
      textAlign="center"
      fontWeight="medium"
      noOfLines={2}
    >
      {name}
    </Text>
    <Text fontSize="xs" color="gray.500" marginTop={1}>
      {category}
    </Text>
  </Flex>
)

// Categorize icons
const categorizeIcons = () => {
  const categories = {
    Protocol: [],
    Infrastructure: [],
    Status: [],
    Control: [],
    Navigation: [],
    Data: [],
    Security: [],
    Other: []
  }

  Object.entries(Icons).forEach(([name, IconComponent]) => {
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes('tcp') || lowerName.includes('udp') || 
        lowerName.includes('http') || lowerName.includes('dns') ||
        lowerName.includes('protocol')) {
      categories.Protocol.push({ name, IconComponent })
    } else if (lowerName.includes('server') || lowerName.includes('router') ||
               lowerName.includes('interface') || lowerName.includes('network')) {
      categories.Infrastructure.push({ name, IconComponent })
    } else if (lowerName.includes('connect') || lowerName.includes('status') ||
               lowerName.includes('error') || lowerName.includes('success')) {
      categories.Status.push({ name, IconComponent })
    } else if (lowerName.includes('play') || lowerName.includes('pause') ||
               lowerName.includes('stop') || lowerName.includes('capture')) {
      categories.Control.push({ name, IconComponent })
    } else if (lowerName.includes('arrow') || lowerName.includes('chevron') ||
               lowerName.includes('menu') || lowerName.includes('close')) {
      categories.Navigation.push({ name, IconComponent })
    } else if (lowerName.includes('packet') || lowerName.includes('data') ||
               lowerName.includes('analytics') || lowerName.includes('chart')) {
      categories.Data.push({ name, IconComponent })
    } else if (lowerName.includes('shield') || lowerName.includes('lock') ||
               lowerName.includes('security') || lowerName.includes('vpn')) {
      categories.Security.push({ name, IconComponent })
    } else {
      categories.Other.push({ name, IconComponent })
    }
  })

  return categories
}

export const AllIcons: StoryObj = {
  render: () => {
    const [searchTerm, setSearchTerm] = useState('')
    const categories = categorizeIcons()
    
    const filteredCategories = Object.entries(categories).reduce((acc, [category, icons]) => {
      const filtered = icons.filter(({ name }) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (filtered.length > 0) {
        acc[category] = filtered
      }
      return acc
    }, {})

    return (
      <Box padding={6} bg="gray.900" minHeight="100vh">
        <Stack spacing={8}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={2}>
              Icon Library
            </Text>
            <Text fontSize="lg" color="gray.400" marginBottom={6}>
              Network-themed icons designed for packet analysis and network monitoring applications.
            </Text>
            
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxWidth="400px"
              marginBottom={8}
              bg="gray.800"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _focus={{
                borderColor: 'cyan.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-cyan-500)'
              }}
            />

            {Object.entries(filteredCategories).map(([category, icons]) => (
              <Box key={category} marginBottom={8}>
                <Flex align="center" marginBottom={4}>
                  <Text fontSize="xl" fontWeight="semibold" color="white">
                    {category}
                  </Text>
                  <Text fontSize="sm" color="gray.500" marginLeft={3}>
                    ({icons.length} icons)
                  </Text>
                </Flex>
                
                <Grid 
                  templateColumns="repeat(auto-fill, minmax(140px, 1fr))" 
                  gap={4}
                >
                  {icons.map(({ name, IconComponent }) => (
                    <IconDisplay
                      key={name}
                      name={name}
                      IconComponent={IconComponent}
                      category={category}
                    />
                  ))}
                </Grid>
              </Box>
            ))}

            {Object.keys(filteredCategories).length === 0 && (
              <Box textAlign="center" padding={8}>
                <Text color="gray.500" fontSize="lg">
                  No icons found matching "{searchTerm}"
                </Text>
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    )
  }
}

export const ProtocolIcons: StoryObj = {
  render: () => {
    const protocolIcons = [
      { name: 'TCPIcon', IconComponent: Icons.TCPIcon, description: 'Transmission Control Protocol' },
      { name: 'UDPIcon', IconComponent: Icons.UDPIcon, description: 'User Datagram Protocol' },
      { name: 'HTTPIcon', IconComponent: Icons.HTTPIcon, description: 'HyperText Transfer Protocol' },
      { name: 'HTTPSIcon', IconComponent: Icons.HTTPSIcon, description: 'HTTP Secure' },
      { name: 'DNSIcon', IconComponent: Icons.DNSIcon, description: 'Domain Name System' }
    ]

    return (
      <Box padding={6} bg="gray.900" minHeight="100vh">
        <Stack spacing={8}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
              Protocol Icons
            </Text>
            <Text fontSize="lg" color="gray.400" marginBottom={8}>
              Icons representing different network protocols with distinct visual characteristics.
            </Text>
            
            <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
              {protocolIcons.map(({ name, IconComponent, description }) => (
                <Box
                  key={name}
                  padding={6}
                  bg="gray.800"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  textAlign="center"
                >
                  <Icon as={IconComponent} boxSize={12} color="cyan.400" marginBottom={4} />
                  <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={2}>
                    {name}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {description}
                  </Text>
                </Box>
              ))}
            </Grid>
          </Box>
        </Stack>
      </Box>
    )
  }
}

export const IconSizes: StoryObj = {
  render: () => {
    const sizes = [
      { name: 'xs', size: 3 },
      { name: 'sm', size: 4 },
      { name: 'md', size: 6 },
      { name: 'lg', size: 8 },
      { name: 'xl', size: 12 },
      { name: '2xl', size: 16 }
    ]

    return (
      <Box padding={6} bg="gray.900" minHeight="100vh">
        <Stack spacing={8}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
              Icon Sizes
            </Text>
            <Text fontSize="lg" color="gray.400" marginBottom={8}>
              Icons can be rendered at different sizes using Chakra UI's size props.
            </Text>
            
            <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
              {sizes.map(({ name, size }) => (
                <Box
                  key={name}
                  padding={6}
                  bg="gray.800"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  textAlign="center"
                >
                  <Icon as={Icons.TCPIcon} boxSize={size} color="cyan.400" marginBottom={4} />
                  <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={1}>
                    {name}
                  </Text>
                  <Text fontSize="sm" color="gray.400" fontFamily="mono">
                    boxSize={size}
                  </Text>
                </Box>
              ))}
            </Grid>
          </Box>
        </Stack>
      </Box>
    )
  }
}

export const IconColors: StoryObj = {
  render: () => {
    const colors = [
      { name: 'Default', color: 'currentColor' },
      { name: 'Cyan', color: 'cyan.400' },
      { name: 'Green', color: 'green.400' },
      { name: 'Yellow', color: 'yellow.400' },
      { name: 'Red', color: 'red.400' },
      { name: 'Purple', color: 'purple.400' },
      { name: 'Gray', color: 'gray.400' },
      { name: 'White', color: 'white' }
    ]

    return (
      <Box padding={6} bg="gray.900" minHeight="100vh">
        <Stack spacing={8}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
              Icon Colors
            </Text>
            <Text fontSize="lg" color="gray.400" marginBottom={8}>
              Icons inherit text color by default but can be customized with any Chakra UI color.
            </Text>
            
            <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={6}>
              {colors.map(({ name, color }) => (
                <Box
                  key={name}
                  padding={6}
                  bg="gray.800"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  textAlign="center"
                >
                  <Icon as={Icons.NetworkIcon} boxSize={10} color={color} marginBottom={4} />
                  <Text fontSize="sm" fontWeight="semibold" color="white" marginBottom={1}>
                    {name}
                  </Text>
                  <Text fontSize="xs" color="gray.400" fontFamily="mono">
                    {color}
                  </Text>
                </Box>
              ))}
            </Grid>
          </Box>
        </Stack>
      </Box>
    )
  }
}

export const UsageExamples: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Usage Examples
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Common patterns for using icons in the AI Shark application.
          </Text>

          {/* In Buttons */}
          <Box marginBottom={8}>
            <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={4}>
              In Buttons
            </Text>
            <Flex gap={4} wrap="wrap">
              <Box as="button" display="flex" alignItems="center" gap={2} padding={3} bg="cyan.600" color="white" borderRadius="md" _hover={{ bg: 'cyan.700' }}>
                <Icon as={Icons.PlayIcon} boxSize={4} />
                <Text>Start Capture</Text>
              </Box>
              <Box as="button" display="flex" alignItems="center" gap={2} padding={3} bg="red.600" color="white" borderRadius="md" _hover={{ bg: 'red.700' }}>
                <Icon as={Icons.StopIcon} boxSize={4} />
                <Text>Stop Capture</Text>
              </Box>
              <Box as="button" display="flex" alignItems="center" gap={2} padding={3} bg="gray.600" color="white" borderRadius="md" _hover={{ bg: 'gray.700' }}>
                <Icon as={Icons.SettingsIcon} boxSize={4} />
                <Text>Settings</Text>
              </Box>
            </Flex>
          </Box>

          {/* In Status Indicators */}
          <Box marginBottom={8}>
            <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={4}>
              Status Indicators
            </Text>
            <Stack spacing={3}>
              <Flex align="center" gap={3}>
                <Icon as={Icons.ConnectedIcon} boxSize={5} color="green.400" />
                <Text color="white">Connected to network interface</Text>
              </Flex>
              <Flex align="center" gap={3}>
                <Icon as={Icons.DisconnectedIcon} boxSize={5} color="red.400" />
                <Text color="white">Disconnected from server</Text>
              </Flex>
              <Flex align="center" gap={3}>
                <Icon as={Icons.LoadingIcon} boxSize={5} color="yellow.400" />
                <Text color="white">Processing packets...</Text>
              </Flex>
            </Stack>
          </Box>

          {/* In Data Tables */}
          <Box marginBottom={8}>
            <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={4}>
              Protocol Indicators
            </Text>
            <Box bg="gray.800" borderRadius="lg" padding={4}>
              <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                <Flex align="center" gap={2}>
                  <Icon as={Icons.TCPIcon} boxSize={4} color="cyan.400" />
                  <Text color="white" fontSize="sm">TCP</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={Icons.UDPIcon} boxSize={4} color="green.400" />
                  <Text color="white" fontSize="sm">UDP</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={Icons.HTTPIcon} boxSize={4} color="yellow.400" />
                  <Text color="white" fontSize="sm">HTTP</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={Icons.HTTPSIcon} boxSize={4} color="green.600" />
                  <Text color="white" fontSize="sm">HTTPS</Text>
                </Flex>
              </Grid>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}