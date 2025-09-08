import React from 'react'
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react'
import PremiumNetflixCard, { StatsCard } from './PremiumNetflixCard'

const PremiumDashboard = ({
  packets = [],
  connectionStatus = 'disconnected',
  packetRate = 0,
  children,
  ...props
}) => {
  // Calculate stats
  const totalPackets = packets.length
  const protocolStats = packets.reduce((acc, packet) => {
    acc[packet.protocol] = (acc[packet.protocol] || 0) + 1
    return acc
  }, {})
  
  const topProtocol = Object.entries(protocolStats)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

  const avgPacketSize = packets.length > 0 
    ? Math.round(packets.reduce((sum, p) => sum + (p.length || 0), 0) / packets.length)
    : 0

  return (
    <Box
      minH="100vh"
      bg="netflix.black"
      position="relative"
      {...props}
    >
      {/* Premium Background Effects */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="radial(circle at 20% 80%, rgba(229, 9, 20, 0.12) 0%, transparent 50%), radial(circle at 80% 20%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial(circle at 40% 40%, rgba(157, 78, 221, 0.08) 0%, transparent 50%)"
        zIndex={-2}
      />
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        background="linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)"
        zIndex={-1}
      />

      {/* Main Content */}
      <Container maxW="full" p={0}>
        <VStack spacing={6} align="stretch">
          {/* Stats Overview */}
          <Container maxW="full" px={6} py={4}>
            <Grid
              templateColumns={{
                base: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              }}
              gap={6}
              css={{
                '@keyframes fadeInUp': {
                  '0%': { transform: 'translateY(30px)', opacity: 0 },
                  '100%': { transform: 'translateY(0)', opacity: 1 }
                },
                animation: 'fadeInUp 0.6s ease-out'
              }}
            >
              <GridItem>
                <StatsCard
                  label="Total Packets"
                  value={totalPackets.toLocaleString()}
                  icon="📊"
                  color="wireshark.neon"
                  trend={packetRate > 0 ? 15 : 0}
                />
              </GridItem>
              <GridItem>
                <StatsCard
                  label="Packet Rate"
                  value={`${packetRate}/s`}
                  icon="⚡"
                  color="wireshark.success"
                  trend={packetRate > 10 ? 8 : -3}
                />
              </GridItem>
              <GridItem>
                <StatsCard
                  label="Top Protocol"
                  value={topProtocol}
                  icon="🌐"
                  color="wireshark.quantum"
                />
              </GridItem>
              <GridItem>
                <StatsCard
                  label="Avg Size"
                  value={`${avgPacketSize}B`}
                  icon="📏"
                  color="wireshark.plasma"
                />
              </GridItem>
            </Grid>
          </Container>

          {/* Main Dashboard Content */}
          <Box flex={1}>
            {children}
          </Box>

          {/* Footer Stats */}
          <Container maxW="full" px={6} py={4}>
            <PremiumNetflixCard variant="glass" isHoverable={false}>
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="netflix.white" fontWeight="600">
                    Wireshark+ Network Intelligence Platform
                  </Text>
                  <Text fontSize="xs" color="netflix.silver">
                    Real-time packet analysis • Advanced threat detection • AI-powered insights
                  </Text>
                </VStack>
                <HStack spacing={6}>
                  <VStack spacing={0} align="center">
                    <Text fontSize="xs" color="netflix.silver" textTransform="uppercase">
                      Status
                    </Text>
                    <Text 
                      fontSize="sm" 
                      fontWeight="bold" 
                      color={connectionStatus === 'connected' ? 'wireshark.success' : 'wireshark.error'}
                    >
                      {connectionStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                  </VStack>
                  <VStack spacing={0} align="center">
                    <Text fontSize="xs" color="netflix.silver" textTransform="uppercase">
                      Uptime
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="wireshark.neon">
                      {new Date().toLocaleTimeString()}
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
            </PremiumNetflixCard>
          </Container>
        </VStack>
      </Container>
    </Box>
  )
}

export default PremiumDashboard