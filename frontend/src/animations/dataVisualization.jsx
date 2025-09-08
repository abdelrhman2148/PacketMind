/**
 * AI Shark - Data Visualization Animations
 * Specialized animations for charts, graphs, and network diagrams
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion'
import { Box } from '@chakra-ui/react'
import { useAnimations } from '../hooks/useAnimations'
import { optimizeAnimationVariants, createOptimizedTransition } from '../utils/animationUtils'

// ===== CHART ANIMATION COMPONENTS =====

/**
 * Animated Bar Chart Component
 */
export const AnimatedBarChart = ({ 
  data = [], 
  maxValue = 100, 
  barColor = 'cyan.500',
  animationDelay = 100,
  duration = 800,
  onBarClick,
  ...props 
}) => {
  const { getOptimizedVariants, stagger } = useAnimations()

  const containerVariants = getOptimizedVariants({
    initial: {},
    animate: {
      transition: {
        staggerChildren: animationDelay / 1000,
        delayChildren: 0.2
      }
    }
  })

  const barVariants = getOptimizedVariants({
    initial: { 
      height: 0,
      opacity: 0,
      scale: 0.8
    },
    animate: { 
      height: '100%',
      opacity: 1,
      scale: 1,
      transition: createOptimizedTransition({ duration })
    },
    hover: {
      scale: 1.05,
      filter: 'brightness(1.2)',
      transition: createOptimizedTransition({ duration: 200 })
    }
  })

  return (
    <Box display="flex" alignItems="flex-end" height="200px" gap={2} {...props}>
      <motion.div
        style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100%' }}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {data.map((value, index) => (
          <motion.div
            key={index}
            variants={barVariants}
            whileHover="hover"
            style={{
              backgroundColor: barColor,
              width: '40px',
              height: `${(value / maxValue) * 100}%`,
              minHeight: '4px',
              borderRadius: '4px 4px 0 0',
              cursor: onBarClick ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'flex-end'
            }}
            onClick={() => onBarClick?.(value, index)}
          />
        ))}
      </motion.div>
    </Box>
  )
}

/**
 * Animated Line Chart Component
 */
export const AnimatedLineChart = ({ 
  data = [], 
  width = 300, 
  height = 150,
  strokeColor = 'cyan.500',
  strokeWidth = 2,
  showDots = true,
  fillArea = false,
  duration = 1500,
  ...props 
}) => {
  const pathRef = useRef(null)
  const [pathLength, setPathLength] = useState(0)
  const { getOptimizedVariants } = useAnimations()

  // Calculate path data
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - (value / Math.max(...data)) * height
    return `${x},${y}`
  }).join(' ')

  const pathData = `M ${points.replace(/,/g, ' ').replace(/ /g, ',').split(',').map((point, index) => 
    index % 2 === 0 ? point : point
  ).join(' ')}`

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [data])

  const lineVariants = getOptimizedVariants({
    initial: {
      pathLength: 0,
      opacity: 0
    },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: createOptimizedTransition({ duration, ease: 'easeInOut' })
    }
  })

  const dotVariants = getOptimizedVariants({
    initial: { 
      scale: 0, 
      opacity: 0 
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: createOptimizedTransition({ duration: 300 })
    },
    hover: {
      scale: 1.5,
      transition: createOptimizedTransition({ duration: 150 })
    }
  })

  return (
    <Box width={`${width}px`} height={`${height}px`} {...props}>
      <svg width={width} height={height}>
        {fillArea && (
          <motion.path
            d={`${pathData} L ${width},${height} L 0,${height} Z`}
            fill={strokeColor}
            fillOpacity={0.2}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />
        )}
        
        <motion.path
          ref={pathRef}
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={lineVariants}
          initial="initial"
          animate="animate"
          style={{
            pathLength: pathLength ? useMotionValue(0) : undefined,
            pathOffset: pathLength ? useMotionValue(pathLength) : undefined
          }}
        />

        {showDots && data.map((value, index) => {
          const x = (index / (data.length - 1)) * width
          const y = height - (value / Math.max(...data)) * height
          
          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={strokeColor}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: (index * 0.1) + 0.8 }}
              style={{ cursor: 'pointer' }}
            />
          )
        })}
      </svg>
    </Box>
  )
}

/**
 * Animated Donut Chart Component
 */
export const AnimatedDonutChart = ({ 
  data = [], 
  size = 150,
  strokeWidth = 20,
  colors = ['#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
  showLabels = true,
  duration = 1200,
  ...props 
}) => {
  const { getOptimizedVariants } = useAnimations()
  
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  let currentAngle = 0

  const segmentVariants = getOptimizedVariants({
    initial: { 
      pathLength: 0,
      opacity: 0
    },
    animate: { 
      pathLength: 1,
      opacity: 1,
      transition: createOptimizedTransition({ duration, ease: 'easeInOut' })
    },
    hover: {
      scale: 1.05,
      transition: createOptimizedTransition({ duration: 200 })
    }
  })

  return (
    <Box width={`${size}px`} height={`${size}px`} position="relative" {...props}>
      <svg width={size} height={size}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const angle = (item.value / total) * 360
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const rotation = currentAngle
            
            currentAngle += angle

            return (
              <motion.circle
                key={index}
                cx={0}
                cy={0}
                r={radius}
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={circumference}
                transform={`rotate(${rotation} 0 0)`}
                variants={segmentVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: index * 0.2 }}
                style={{
                  transformOrigin: 'center',
                  cursor: 'pointer'
                }}
              />
            )
          })}
        </g>
      </svg>
      
      {showLabels && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
          pointerEvents="none"
        >
          <Box fontSize="lg" fontWeight="bold" color="white">
            {total}
          </Box>
          <Box fontSize="sm" color="gray.400">
            Total
          </Box>
        </Box>
      )}
    </Box>
  )
}

// ===== NETWORK DIAGRAM ANIMATIONS =====

/**
 * Animated Network Node Component
 */
export const AnimatedNetworkNode = ({ 
  node,
  onNodeClick,
  isConnected = false,
  isHighlighted = false,
  size = 40,
  ...props 
}) => {
  const { getOptimizedVariants } = useAnimations()

  const nodeVariants = getOptimizedVariants({
    initial: { 
      scale: 0,
      opacity: 0
    },
    animate: { 
      scale: 1,
      opacity: 1,
      transition: createOptimizedTransition({ duration: 600, ease: 'backOut' })
    },
    hover: {
      scale: 1.2,
      boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)',
      transition: createOptimizedTransition({ duration: 200 })
    },
    connected: {
      scale: 1.1,
      boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)',
      transition: createOptimizedTransition({ duration: 300 })
    },
    highlighted: {
      scale: 1.3,
      boxShadow: '0 0 25px rgba(229, 9, 20, 0.8)',
      transition: createOptimizedTransition({ duration: 200 })
    }
  })

  const pulseVariants = getOptimizedVariants({
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  })

  return (
    <motion.div
      variants={nodeVariants}
      initial="initial"
      animate={isHighlighted ? "highlighted" : isConnected ? "connected" : "animate"}
      whileHover="hover"
      onClick={() => onNodeClick?.(node)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: node.color || '#06B6D4',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: node.x - size / 2,
        top: node.y - size / 2,
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}
      {...props}
    >
      {node.label}
      
      {isConnected && (
        <motion.div
          variants={pulseVariants}
          animate="animate"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid rgba(16, 185, 129, 0.6)',
            pointerEvents: 'none'
          }}
        />
      )}
    </motion.div>
  )
}

/**
 * Animated Network Connection Component
 */
export const AnimatedNetworkConnection = ({ 
  connection,
  animationSpeed = 2,
  showDataFlow = true,
  ...props 
}) => {
  const { getOptimizedVariants } = useAnimations()
  
  const lineVariants = getOptimizedVariants({
    initial: {
      pathLength: 0,
      opacity: 0
    },
    animate: {
      pathLength: 1,
      opacity: 0.8,
      transition: createOptimizedTransition({ duration: 800, ease: 'easeInOut' })
    }
  })

  const dataFlowVariants = getOptimizedVariants({
    animate: {
      offsetDistance: ['0%', '100%'],
      transition: {
        duration: animationSpeed,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  })

  const pathData = `M ${connection.from.x} ${connection.from.y} L ${connection.to.x} ${connection.to.y}`

  return (
    <g {...props}>
      <motion.path
        d={pathData}
        stroke={connection.color || 'rgba(6, 182, 212, 0.6)'}
        strokeWidth={connection.width || 2}
        fill="none"
        strokeDasharray={connection.dashed ? "5,5" : "none"}
        variants={lineVariants}
        initial="initial"
        animate="animate"
      />
      
      {showDataFlow && (
        <motion.circle
          r="3"
          fill={connection.dataColor || '#06B6D4'}
          variants={dataFlowVariants}
          animate="animate"
          style={{
            offsetPath: `path('${pathData}')`,
            offsetRotate: '0deg'
          }}
        />
      )}
    </g>
  )
}

/**
 * Complete Animated Network Diagram
 */
export const AnimatedNetworkDiagram = ({ 
  nodes = [],
  connections = [],
  width = 600,
  height = 400,
  onNodeClick,
  onConnectionClick,
  highlightedNodeId,
  animateOnMount = true,
  ...props 
}) => {
  const { stagger } = useAnimations()
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    if (animateOnMount) {
      const timer = setTimeout(() => setAnimationStep(1), 500)
      const timer2 = setTimeout(() => setAnimationStep(2), 1000)
      return () => {
        clearTimeout(timer)
        clearTimeout(timer2)
      }
    }
  }, [animateOnMount])

  return (
    <Box width={`${width}px`} height={`${height}px`} position="relative" {...props}>
      <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Render connections first (background layer) */}
        {animationStep >= 1 && connections.map((connection, index) => (
          <AnimatedNetworkConnection
            key={`connection-${index}`}
            connection={connection}
            onClick={() => onConnectionClick?.(connection)}
            style={{ cursor: onConnectionClick ? 'pointer' : 'default' }}
          />
        ))}
      </svg>
      
      {/* Render nodes (foreground layer) */}
      {animationStep >= 0 && nodes.map((node, index) => (
        <AnimatedNetworkNode
          key={`node-${node.id}`}
          node={node}
          onNodeClick={onNodeClick}
          isHighlighted={node.id === highlightedNodeId}
          isConnected={connections.some(conn => 
            conn.from.id === node.id || conn.to.id === node.id
          )}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        />
      ))}
    </Box>
  )
}

// ===== REAL-TIME DATA ANIMATIONS =====

/**
 * Animated Packet Flow Visualization
 */
export const AnimatedPacketFlow = ({ 
  packets = [],
  direction = 'horizontal',
  speed = 1,
  packetSize = 8,
  maxVisible = 20,
  ...props 
}) => {
  const { getOptimizedVariants } = useAnimations()
  const [visiblePackets, setVisiblePackets] = useState([])

  useEffect(() => {
    // Manage visible packets for performance
    const newVisible = packets.slice(-maxVisible)
    setVisiblePackets(newVisible)
  }, [packets, maxVisible])

  const containerVariants = getOptimizedVariants({
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0
      }
    }
  })

  const packetVariants = getOptimizedVariants({
    initial: { 
      x: direction === 'horizontal' ? -20 : 0,
      y: direction === 'vertical' ? -20 : 0,
      opacity: 0,
      scale: 0.5
    },
    animate: { 
      x: direction === 'horizontal' ? 300 : 0,
      y: direction === 'vertical' ? 300 : 0,
      opacity: [0, 1, 1, 0],
      scale: [0.5, 1, 1, 0.5],
      transition: {
        duration: 2 / speed,
        ease: 'linear',
        times: [0, 0.1, 0.9, 1]
      }
    }
  })

  return (
    <Box
      width="320px"
      height={direction === 'horizontal' ? '40px' : '320px'}
      overflow="hidden"
      position="relative"
      {...props}
    >
      <motion.div
        variants={containerVariants}
        animate="animate"
        style={{
          display: 'flex',
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {visiblePackets.map((packet, index) => (
          <motion.div
            key={`${packet.id}-${index}`}
            variants={packetVariants}
            style={{
              width: `${packetSize}px`,
              height: `${packetSize}px`,
              backgroundColor: packet.color || '#06B6D4',
              borderRadius: '2px',
              margin: '2px',
              boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)'
            }}
          />
        ))}
      </motion.div>
    </Box>
  )
}

/**
 * Animated Metrics Counter
 */
export const AnimatedCounter = ({ 
  value,
  format = (v) => v.toString(),
  duration = 800,
  ease = 'easeOut',
  ...props 
}) => {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, latest => Math.round(latest))
  const displayValue = useTransform(rounded, format)

  useEffect(() => {
    const controls = motionValue.animate?.(value, {
      duration: duration / 1000,
      ease
    })
    
    return controls?.stop
  }, [value, duration, ease, motionValue])

  return (
    <motion.span {...props}>
      {displayValue}
    </motion.span>
  )
}

// ===== EXPORTS =====

export {
  AnimatedBarChart,
  AnimatedLineChart,
  AnimatedDonutChart,
  AnimatedNetworkNode,
  AnimatedNetworkConnection,
  AnimatedNetworkDiagram,
  AnimatedPacketFlow,
  AnimatedCounter
}

export default {
  AnimatedBarChart,
  AnimatedLineChart,
  AnimatedDonutChart,
  AnimatedNetworkNode,
  AnimatedNetworkConnection,
  AnimatedNetworkDiagram,
  AnimatedPacketFlow,
  AnimatedCounter
}