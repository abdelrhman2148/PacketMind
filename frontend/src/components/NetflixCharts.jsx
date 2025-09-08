import { 
  Box, 
  VStack, 
  HStack, 
  Grid, 
  GridItem,
  Heading, 
  Text, 
  Button,
  ButtonGroup,
  Badge,
  useDisclosure,
  Collapse,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react'
import { Line, Bar } from 'react-chartjs-2'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js'
import 'chartjs-adapter-date-fns'

import ProtocolDonutChart from './ProtocolDonutChart'
import TrafficHeatMap from './TrafficHeatMap'
import useChartData from '../hooks/useChartData'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
)

const MotionBox = motion(Box)
const MotionGridItem = motion(GridItem)

const NetflixCharts = ({ 
  packets = [], 
  isCapturing = false,
  timeRange = '5m',
  autoRefresh = true
}) => {
  const [activeView, setActiveView] = useState('overview') // 'overview', 'detailed', 'heatmap'
  const [expandedCharts, setExpandedCharts] = useState(new Set(['traffic', 'protocols']))
  const { isOpen: showControls, onToggle: toggleControls } = useDisclosure({ defaultIsOpen: true })

  // Chart data hook
  const {
    chartData,
    statistics,
    forceUpdate,
    getChartConfig,
    isRealTime,
    lastUpdate
  } = useChartData(packets, {
    timeRange,
    enableRealTime: autoRefresh,
    updateInterval: 2000,
    maxDataPoints: 50
  })

  // Traffic rate chart configuration
  const trafficRateConfig = useMemo(() => {
    if (!chartData.trafficRates?.length) return null

    return {
      labels: chartData.trafficRates.map(point => point.time),
      datasets: [
        {
          label: 'Packets/sec',
          data: chartData.trafficRates.map(point => point.packetsPerSecond),
          borderColor: '#E50914',
          backgroundColor: 'rgba(229, 9, 20, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#E50914',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Bytes/sec',
          data: chartData.trafficRates.map(point => point.bytesPerSecond / 1000), // Convert to KB/s
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#06B6D4',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y1',
        }
      ]
    }
  }, [chartData.trafficRates])

  const trafficRateOptions = useMemo(() => ({
    ...getChartConfig('line'),
    scales: {
      x: {
        type: 'category',
        ticks: {
          color: '#B3B3B3',
          font: { family: '"SF Pro Text", system-ui, sans-serif' }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: '#B3B3B3',
          font: { family: '"SF Pro Text", system-ui, sans-serif' },
          callback: (value) => `${value} pkt/s`
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: '#B3B3B3',
          font: { family: '"SF Pro Text", system-ui, sans-serif' },
          callback: (value) => `${value} KB/s`
        },
        grid: { drawOnChartArea: false }
      }
    },
    plugins: {
      ...getChartConfig('line').plugins,
      legend: {
        labels: {
          color: '#FFFFFF',
          font: { family: '"SF Pro Text", system-ui, sans-serif' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#B3B3B3',
        borderColor: 'rgba(229, 9, 20, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (context) => `Time: ${context[0].label}`,
          label: (context) => {
            const label = context.dataset.label
            const value = context.parsed.y
            return label.includes('Bytes') 
              ? `${label}: ${value.toFixed(1)} KB/s`
              : `${label}: ${value} packets/s`
          }
        }
      }
    }
  }), [getChartConfig])

  // Packet size distribution chart
  const packetSizeConfig = useMemo(() => chartData.packetSizes, [chartData.packetSizes])

  const packetSizeOptions = useMemo(() => ({
    ...getChartConfig('bar'),
    indexAxis: 'x',
    plugins: {
      ...getChartConfig('bar').plugins,
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#B3B3B3',
        borderColor: 'rgba(229, 9, 20, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (context) => `Size Range: ${context[0].label}`,
          label: (context) => `Packets: ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#B3B3B3',
          font: { family: '"SF Pro Text", system-ui, sans-serif' }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: {
          color: '#B3B3B3',
          font: { family: '"SF Pro Text", system-ui, sans-serif' }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  }), [getChartConfig])

  // Toggle chart expansion
  const toggleChart = (chartId) => {
    setExpandedCharts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(chartId)) {
        newSet.delete(chartId)
      } else {
        newSet.add(chartId)
      }
      return newSet
    })
  }

  // Chart container component
  const ChartContainer = ({ 
    title, 
    chartId, 
    children, 
    stats = null,
    height = 300,
    isExpanded = true,
    showToggle = true
  }) => (
    <MotionBox
      layout
      p={6}
      bg="rgba(31, 31, 31, 0.95)"
      borderRadius="16px"
      border="1px solid rgba(255, 255, 255, 0.1)"
      backdropFilter="blur(20px)"
      boxShadow="netflix"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'netflixHover'
      }}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Heading size="md" color="netflix.white" fontWeight="bold">
              {title}
            </Heading>
            {isRealTime && (
              <Badge
                bg="wireshark.success"
                color="netflix.black"
                px={2}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="bold"
                animation="pulse 2s ease-in-out infinite"
              >
                LIVE
              </Badge>
            )}
          </HStack>
          
          <HStack spacing={2}>
            {stats && (
              <Text color="netflix.silver" fontSize="xs">
                {stats}
              </Text>
            )}
            {showToggle && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleChart(chartId)}
                color="netflix.silver"
                _hover={{ color: 'netflix.white' }}
              >
                {isExpanded ? '−' : '+'}
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Chart Content */}
        <Collapse in={isExpanded} animateOpacity>
          <Box height={height}>
            {children}
          </Box>
        </Collapse>
      </VStack>
    </MotionBox>
  )

  // Overview layout
  const OverviewLayout = () => (
    <Grid templateColumns="repeat(auto-fit, minmax(500px, 1fr))" gap={6}>
      {/* Traffic Rate Chart */}
      <MotionGridItem
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ChartContainer
          title="Real-time Traffic"
          chartId="traffic"
          isExpanded={expandedCharts.has('traffic')}
          stats={statistics ? `${statistics.totalPackets.toLocaleString()} packets` : null}
          height={400}
        >
          {trafficRateConfig ? (
            <Line data={trafficRateConfig} options={trafficRateOptions} />
          ) : (
            <Box
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
            >
              <Text fontSize="4xl" opacity={0.3} mb={4}>📈</Text>
              <Text color="netflix.white" fontSize="lg" fontWeight="bold" mb={2}>
                No Traffic Data
              </Text>
              <Text color="netflix.silver" fontSize="sm">
                Start packet capture to see real-time traffic
              </Text>
            </Box>
          )}
        </ChartContainer>
      </MotionGridItem>

      {/* Protocol Distribution */}
      <MotionGridItem
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ProtocolDonutChart
          data={chartData.protocolDistribution}
          title="Protocol Distribution"
          height={400}
          showStats={true}
          isLoading={!chartData.protocolDistribution.labels}
        />
      </MotionGridItem>

      {/* Packet Size Distribution */}
      <MotionGridItem
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        gridColumn="span 2"
      >
        <ChartContainer
          title="Packet Size Distribution"
          chartId="sizes"
          isExpanded={expandedCharts.has('sizes')}
          height={300}
        >
          {packetSizeConfig?.labels ? (
            <Bar data={packetSizeConfig} options={packetSizeOptions} />
          ) : (
            <Box
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
            >
              <Text fontSize="4xl" opacity={0.3} mb={4}>📊</Text>
              <Text color="netflix.white" fontSize="lg" fontWeight="bold" mb={2}>
                No Size Data
              </Text>
              <Text color="netflix.silver" fontSize="sm">
                Packet size analysis will appear here
              </Text>
            </Box>
          )}
        </ChartContainer>
      </MotionGridItem>
    </Grid>
  )

  // Detailed layout with tabs
  const DetailedLayout = () => (
    <Tabs variant="enclosed" colorScheme="red">
      <TabList
        bg="rgba(20, 20, 20, 0.9)"
        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
      >
        <Tab color="netflix.silver" _selected={{ color: 'netflix.white', borderColor: 'netflix.red' }}>
          📈 Traffic Analysis
        </Tab>
        <Tab color="netflix.silver" _selected={{ color: 'netflix.white', borderColor: 'netflix.red' }}>
          🔄 Protocol Breakdown
        </Tab>
        <Tab color="netflix.silver" _selected={{ color: 'netflix.white', borderColor: 'netflix.red' }}>
          📦 Packet Analysis
        </Tab>
        <Tab color="netflix.silver" _selected={{ color: 'netflix.white', borderColor: 'netflix.red' }}>
          🔥 Heat Map
        </Tab>
      </TabList>

      <TabPanels pt={6}>
        <TabPanel p={0}>
          <ChartContainer
            title="Detailed Traffic Analysis"
            chartId="detailed-traffic"
            showToggle={false}
            height={500}
          >
            {trafficRateConfig ? (
              <Line data={trafficRateConfig} options={trafficRateOptions} />
            ) : (
              <Box height="100%" display="flex" alignItems="center" justifyContent="center">
                <Text color="netflix.silver">No traffic data available</Text>
              </Box>
            )}
          </ChartContainer>
        </TabPanel>

        <TabPanel p={0}>
          <ProtocolDonutChart
            data={chartData.protocolDistribution}
            title="Detailed Protocol Analysis"
            height={500}
            showStats={true}
            showLegend={true}
          />
        </TabPanel>

        <TabPanel p={0}>
          <ChartContainer
            title="Packet Size Analysis"
            chartId="detailed-packets"
            showToggle={false}
            height={500}
          >
            {packetSizeConfig?.labels ? (
              <Bar data={packetSizeConfig} options={packetSizeOptions} />
            ) : (
              <Box height="100%" display="flex" alignItems="center" justifyContent="center">
                <Text color="netflix.silver">No packet data available</Text>
              </Box>
            )}
          </ChartContainer>
        </TabPanel>

        <TabPanel p={0}>
          <TrafficHeatMap
            data={chartData.trafficPatterns}
            title="Network Traffic Heat Map"
            height={500}
            timeRange={timeRange}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header and Controls */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="xl" color="netflix.white" fontWeight="bold">
              📊 Network Analytics Dashboard
            </Heading>
            <Text color="netflix.silver" fontSize="lg">
              Real-time traffic visualization and analysis
            </Text>
          </VStack>

          <VStack spacing={3} align="end">
            {/* View Mode Toggle */}
            <ButtonGroup size="sm" variant="outline">
              <Button
                variant={activeView === 'overview' ? 'netflix' : 'netflixSecondary'}
                onClick={() => setActiveView('overview')}
              >
                Overview
              </Button>
              <Button
                variant={activeView === 'detailed' ? 'netflix' : 'netflixSecondary'}
                onClick={() => setActiveView('detailed')}
              >
                Detailed
              </Button>
              <Button
                variant={activeView === 'heatmap' ? 'netflix' : 'netflixSecondary'}
                onClick={() => setActiveView('heatmap')}
              >
                Heat Map
              </Button>
            </ButtonGroup>

            {/* Status and Controls */}
            <HStack spacing={3}>
              <Badge
                bg={isCapturing ? 'wireshark.success' : 'wireshark.error'}
                color="netflix.black"
                px={3}
                py={1}
                borderRadius="full"
                fontWeight="bold"
              >
                {isCapturing ? 'CAPTURING' : 'STOPPED'}
              </Badge>
              
              <Button
                size="sm"
                variant="netflixSecondary"
                onClick={forceUpdate}
              >
                Refresh
              </Button>
            </HStack>
          </VStack>
        </HStack>

        {/* Statistics Summary */}
        {statistics && (
          <HStack
            spacing={8}
            p={4}
            bg="rgba(31, 31, 31, 0.8)"
            borderRadius="12px"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <VStack spacing={0} align="start">
              <Text color="netflix.silver" fontSize="sm">Total Packets</Text>
              <Text color="netflix.white" fontSize="xl" fontWeight="bold">
                {statistics.totalPackets.toLocaleString()}
              </Text>
            </VStack>
            
            <VStack spacing={0} align="start">
              <Text color="netflix.silver" fontSize="sm">Total Bytes</Text>
              <Text color="wireshark.accent" fontSize="xl" fontWeight="bold">
                {(statistics.totalBytes / 1024).toFixed(1)}K
              </Text>
            </VStack>
            
            <VStack spacing={0} align="start">
              <Text color="netflix.silver" fontSize="sm">Protocols</Text>
              <Text color="wireshark.success" fontSize="xl" fontWeight="bold">
                {statistics.uniqueProtocols}
              </Text>
            </VStack>
            
            <VStack spacing={0} align="start">
              <Text color="netflix.silver" fontSize="sm">Avg Rate</Text>
              <Text color="netflix.red" fontSize="xl" fontWeight="bold">
                {statistics.avgPacketsPerSecond}/s
              </Text>
            </VStack>

            <VStack spacing={0} align="start">
              <Text color="netflix.silver" fontSize="sm">Time Range</Text>
              <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                {statistics.timeRange}
              </Text>
            </VStack>
          </HStack>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <MotionBox
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <OverviewLayout />
            </MotionBox>
          )}

          {activeView === 'detailed' && (
            <MotionBox
              key="detailed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <DetailedLayout />
            </MotionBox>
          )}

          {activeView === 'heatmap' && (
            <MotionBox
              key="heatmap"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <TrafficHeatMap
                data={chartData.trafficPatterns}
                title="Interactive Network Traffic Heat Map"
                height={600}
                timeRange={timeRange}
                maxConnections={100}
              />
            </MotionBox>
          )}
        </AnimatePresence>
      </VStack>
    </Box>
  )
}

export default NetflixCharts