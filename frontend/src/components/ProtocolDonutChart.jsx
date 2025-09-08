import { Box, VStack, HStack, Text, Heading, Badge, Tooltip } from '@chakra-ui/react'
import { Doughnut } from 'react-chartjs-2'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  Title
} from 'chart.js'

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend, Title)

const MotionBox = motion(Box)

const ProtocolDonutChart = ({ 
  data, 
  title = "Protocol Distribution",
  height = 400,
  showLegend = true,
  showStats = true,
  onProtocolClick,
  isLoading = false
}) => {
  const [hoveredSegment, setHoveredSegment] = useState(null)
  const [animationComplete, setAnimationComplete] = useState(false)

  // Netflix-inspired color palette for protocols
  const protocolColors = {
    'TCP': ['#E50914', '#DC143C'],
    'UDP': ['#06B6D4', '#0891B2'],
    'HTTP': ['#10B981', '#059669'],
    'HTTPS': ['#F59E0B', '#D97706'],
    'DNS': ['#8B5CF6', '#7C3AED'],
    'ICMP': ['#EF4444', '#DC2626'],
    'SSH': ['#3B82F6', '#2563EB'],
    'FTP': ['#F97316', '#EA580C'],
    'SMTP': ['#84CC16', '#65A30D'],
    'Unknown': ['#6B7280', '#4B5563']
  }

  // Enhanced chart configuration
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right',
        align: 'center',
        labels: {
          color: '#FFFFFF',
          font: {
            family: '"SF Pro Text", system-ui, sans-serif',
            size: 12,
            weight: '500'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0]
                const value = dataset.data[i]
                const percentage = data.metadata?.percentages?.[label] || '0'
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor,
                  lineWidth: dataset.borderWidth,
                  index: i,
                  hidden: false
                }
              })
            }
            return []
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#B3B3B3',
        borderColor: 'rgba(229, 9, 20, 0.5)',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          family: '"SF Pro Text", system-ui, sans-serif',
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          family: '"SF Pro Text", system-ui, sans-serif',
          size: 12
        },
        callbacks: {
          title: (context) => {
            return `${context[0].label} Protocol`
          },
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const percentage = data.metadata?.percentages?.[label] || '0'
            const bytes = data.metadata?.bytes?.[label] || 0
            
            return [
              `Packets: ${value.toLocaleString()}`,
              `Percentage: ${percentage}%`,
              `Bytes: ${bytes.toLocaleString()}`
            ]
          }
        }
      }
    },
    cutout: '65%',
    radius: '90%',
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: 'rgba(10, 10, 10, 0.8)',
        hoverBorderWidth: 4,
        hoverBorderColor: '#FFFFFF'
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
      easing: 'easeInOutCubic',
      onComplete: () => setAnimationComplete(true)
    },
    onHover: (event, elements, chart) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index
        setHoveredSegment(elementIndex)
      } else {
        setHoveredSegment(null)
      }
    },
    onClick: (event, elements, chart) => {
      if (elements.length > 0 && onProtocolClick) {
        const elementIndex = elements[0].index
        const protocol = data.labels[elementIndex]
        onProtocolClick(protocol)
      }
    }
  }), [data, showLegend, onProtocolClick])

  // Enhanced chart data with gradients
  const enhancedData = useMemo(() => {
    if (!data || !data.labels) return null

    return {
      ...data,
      datasets: data.datasets.map(dataset => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor.map((color, index) => {
          const protocol = data.labels[index]
          const [primary, secondary] = protocolColors[protocol] || protocolColors['Unknown']
          
          // Create gradient effect for better visual appeal
          return hoveredSegment === index ? secondary : primary
        }),
        borderColor: 'rgba(10, 10, 10, 0.8)',
        borderWidth: 3,
        hoverBackgroundColor: dataset.backgroundColor.map((color, index) => {
          const protocol = data.labels[index]
          const [, secondary] = protocolColors[protocol] || protocolColors['Unknown']
          return secondary
        }),
        hoverBorderColor: '#FFFFFF',
        hoverBorderWidth: 4
      }))
    }
  }, [data, hoveredSegment])

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Box
      width="100%"
      height={height}
      bg="rgba(31, 31, 31, 0.8)"
      borderRadius="50%"
      position="relative"
      overflow="hidden"
    >
      <MotionBox
        position="absolute"
        top="0"
        left="-100%"
        width="100%"
        height="100%"
        bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)"
        animate={{ left: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </Box>
  )

  // Statistics display
  const StatsDisplay = () => {
    if (!data?.metadata) return null

    const { total, percentages } = data.metadata
    const topProtocols = Object.entries(percentages)
      .sort(([,a], [,b]) => parseFloat(b) - parseFloat(a))
      .slice(0, 3)

    return (
      <VStack spacing={4} align="stretch">
        <VStack spacing={2}>
          <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
            Total Packets
          </Text>
          <Text color="netflix.white" fontSize="2xl" fontWeight="bold">
            {total.toLocaleString()}
          </Text>
        </VStack>
        
        <VStack spacing={2} align="stretch">
          <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
            Top Protocols
          </Text>
          {topProtocols.map(([protocol, percentage], index) => (
            <HStack key={protocol} justify="space-between">
              <HStack spacing={2}>
                <Box
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={protocolColors[protocol]?.[0] || protocolColors['Unknown'][0]}
                />
                <Text color="netflix.white" fontSize="sm" fontWeight="medium">
                  {protocol}
                </Text>
              </HStack>
              <Badge
                bg="rgba(229, 9, 20, 0.2)"
                color="netflix.red"
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
              >
                {percentage}%
              </Badge>
            </HStack>
          ))}
        </VStack>
      </VStack>
    )
  }

  return (
    <Box
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
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="md" color="netflix.white" fontWeight="bold">
              {title}
            </Heading>
            <Text color="netflix.silver" fontSize="sm">
              Real-time protocol analysis
            </Text>
          </VStack>
          
          {animationComplete && data?.metadata?.total > 0 && (
            <MotionBox
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Badge
                bg="wireshark.success"
                color="netflix.black"
                px={3}
                py={1}
                borderRadius="full"
                fontWeight="bold"
                fontSize="xs"
              >
                LIVE
              </Badge>
            </MotionBox>
          )}
        </HStack>

        {/* Chart Container */}
        <HStack spacing={6} align="stretch">
          {/* Chart */}
          <Box flex={showStats ? 2 : 1} height={height}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <MotionBox
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  height="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <LoadingSkeleton />
                </MotionBox>
              ) : !enhancedData ? (
                <MotionBox
                  key="no-data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  height="100%"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                >
                  <Text fontSize="4xl" opacity={0.3} mb={4}>📊</Text>
                  <Text color="netflix.white" fontSize="lg" fontWeight="bold" mb={2}>
                    No Protocol Data
                  </Text>
                  <Text color="netflix.silver" fontSize="sm">
                    Waiting for network traffic...
                  </Text>
                </MotionBox>
              ) : (
                <MotionBox
                  key="chart"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  height="100%"
                  position="relative"
                >
                  <Doughnut data={enhancedData} options={chartOptions} />
                  
                  {/* Center content */}
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    textAlign="center"
                    pointerEvents="none"
                  >
                    <Text color="netflix.silver" fontSize="xs" mb={1}>
                      PROTOCOLS
                    </Text>
                    <Text color="netflix.white" fontSize="2xl" fontWeight="bold">
                      {data?.labels?.length || 0}
                    </Text>
                  </Box>
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>

          {/* Statistics */}
          {showStats && enhancedData && (
            <MotionBox
              flex={1}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <StatsDisplay />
            </MotionBox>
          )}
        </HStack>

        {/* Protocol Legend (if not shown in chart) */}
        {!showLegend && enhancedData && (
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <VStack spacing={2} align="stretch">
              <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                Active Protocols
              </Text>
              <HStack spacing={4} flexWrap="wrap">
                {enhancedData.labels.map((protocol, index) => (
                  <Tooltip
                    key={protocol}
                    label={`${protocol}: ${data.metadata?.percentages?.[protocol] || '0'}%`}
                    placement="top"
                  >
                    <HStack
                      spacing={2}
                      cursor="pointer"
                      onClick={() => onProtocolClick?.(protocol)}
                      _hover={{ opacity: 0.7 }}
                      transition="opacity 0.2s ease"
                    >
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={enhancedData.datasets[0].backgroundColor[index]}
                      />
                      <Text color="netflix.white" fontSize="sm" fontWeight="medium">
                        {protocol}
                      </Text>
                    </HStack>
                  </Tooltip>
                ))}
              </HStack>
            </VStack>
          </MotionBox>
        )}
      </VStack>
    </Box>
  )
}

export default ProtocolDonutChart