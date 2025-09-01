import { Box, Text } from '@chakra-ui/react'

function Sparkline({ data, width = 200, height = 40 }) {
  // Use static colors for now - in a real implementation these would come from theme context
  const strokeColor = '#61dafb'
  const fillColor = 'rgba(97, 218, 251, 0.1)'
  const textColor = '#61dafb'
  
  if (!data || data.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={`${width}px`}
        height={`${height}px`}
        bg={{ base: 'gray.50', _dark: 'rgba(97, 218, 251, 0.1)' }}
        borderRadius="md"
        border="1px solid"
        borderColor={{ base: 'gray.200', _dark: '#404040' }}
      >
        <Text fontSize="xs" color="gray.500">
          No data
        </Text>
      </Box>
    )
  }

  const maxRate = Math.max(...data.map(d => d.rate), 1)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.rate / maxRate) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <Box
      position="relative"
      display="inline-block"
      width={`${width}px`}
      height={`${height}px`}
      bg={{ base: 'gray.50', _dark: 'rgba(97, 218, 251, 0.1)' }}
      borderRadius="md"
      border="1px solid"
      borderColor={{ base: 'gray.200', _dark: '#404040' }}
      p={1}
    >
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#sparklineGradient)"
        />
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <Box
        position="absolute"
        top="2px"
        right="4px"
        fontSize="xs"
        color={textColor}
        fontWeight="500"
        textShadow="0 0 2px rgba(0, 0, 0, 0.8)"
      >
        {maxRate} pps
      </Box>
    </Box>
  )
}

export default Sparkline