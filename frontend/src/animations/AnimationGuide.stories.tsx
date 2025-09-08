import type { Meta, StoryObj } from '@storybook/react'
import { Box, Text, Stack, Flex, Button, Code, Alert, AlertIcon } from '@chakra-ui/react'
import { AnimatedWrapper, AnimatedList, AnimatedModal, AnimatedLoader } from '../components/AnimatedWrapper'
import { AnimatedBarChart, AnimatedLineChart, AnimatedNetworkDiagram } from './dataVisualization'
import { PageTransitionWrapper, ModalTransition } from './pageTransitions'
import { useState } from 'react'

const meta: Meta = {
  title: 'Design System/Animation Guide',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive guide for using animations in the AI Shark application, including performance guidelines, best practices, and examples.'
      }
    }
  }
}

export default meta

// Code example component
const CodeExample = ({ title, code, description }) => (
  <Box marginBottom={8}>
    <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={2}>
      {title}
    </Text>
    {description && (
      <Text fontSize="sm" color="gray.400" marginBottom={3}>
        {description}
      </Text>
    )}
    <Box
      padding={4}
      bg="gray.800"
      borderRadius="lg"
      border="1px solid"
      borderColor="whiteAlpha.200"
      overflowX="auto"
    >
      <Code
        fontSize="sm"
        color="cyan.300"
        bg="transparent"
        whiteSpace="pre-wrap"
        fontFamily="mono"
      >
        {code}
      </Code>
    </Box>
  </Box>
)

// Performance tip component
const PerformanceTip = ({ type = 'info', title, children }) => {
  const colors = {
    info: 'blue',
    warning: 'orange',
    error: 'red',
    success: 'green'
  }

  return (
    <Alert status={type} bg={`${colors[type]}.900`} border="1px solid" borderColor={`${colors[type]}.500`} borderRadius="lg" marginBottom={4}>
      <AlertIcon />
      <Box>
        <Text fontWeight="bold" marginBottom={1}>{title}</Text>
        <Text fontSize="sm">{children}</Text>
      </Box>
    </Alert>
  )
}

export const GettingStarted: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Animation System Guide
          </Text>
          <Text fontSize="lg" color="gray.300" marginBottom={8}>
            Learn how to use the AI Shark animation system to create smooth, performant, and accessible animations.
          </Text>

          {/* Quick Start */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6}>
            Quick Start
          </Text>

          <CodeExample
            title="Basic Usage with AnimatedWrapper"
            description="The simplest way to add animations to any component"
            code={`import { AnimatedWrapper } from '@/components/AnimatedWrapper'

function MyComponent() {
  return (
    <AnimatedWrapper animation="slideUp" duration={600}>
      <Box padding={4} bg="gray.800">
        This content will slide up with a smooth animation
      </Box>
    </AnimatedWrapper>
  )
}`}
          />

          <CodeExample
            title="Using the useAnimations Hook"
            description="For more control over animation timing and state"
            code={`import { useAnimations } from '@/hooks/useAnimations'

function MyComponent() {
  const { fadeIn, slideIn, getAnimationStats } = useAnimations()
  
  const handleClick = () => {
    fadeIn(null, { duration: 300, delay: 100 })
  }
  
  return (
    <Button onClick={handleClick}>
      Animate Content
    </Button>
  )
}`}
          />

          {/* Performance Guidelines */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
            Performance Guidelines
          </Text>

          <PerformanceTip type="success" title="✅ DO: Use GPU-accelerated properties">
            Prefer animating transform and opacity properties as they trigger GPU acceleration and don't cause layout recalculations.
          </PerformanceTip>

          <PerformanceTip type="warning" title="⚠️ AVOID: Animating layout properties">
            Avoid animating width, height, top, left, margin, and padding as they trigger expensive layout recalculations.
          </PerformanceTip>

          <PerformanceTip type="error" title="❌ DON'T: Run too many concurrent animations">
            Limit concurrent animations to 10 or fewer. Use the animation queue system for managing multiple animations.
          </PerformanceTip>

          <PerformanceTip type="info" title="💡 TIP: Use the performance monitor">
            The system automatically monitors animation performance and can optimize or disable animations on low-end devices.
          </PerformanceTip>

          <CodeExample
            title="Optimized Animation Example"
            description="Use transform and opacity for smooth, GPU-accelerated animations"
            code={`// ✅ Good - GPU accelerated
const optimizedVariants = {
  initial: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
  animate: { opacity: 1, transform: 'translateY(0px) scale(1)' }
}

// ❌ Bad - triggers layout recalculation  
const slowVariants = {
  initial: { height: 0, marginTop: 20 },
  animate: { height: 'auto', marginTop: 0 }
}`}
          />
        </Box>
      </Stack>
    </Box>
  )
}

export const ComponentAnimations: StoryObj = {
  render: () => {
    const [showModal, setShowModal] = useState(false)
    const [showList, setShowList] = useState(true)

    return (
      <Box padding={6} bg="gray.900" minHeight="100vh">
        <Stack spacing={8}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
              Component Animations
            </Text>
            <Text fontSize="lg" color="gray.300" marginBottom={8}>
              Examples of different animation patterns and components.
            </Text>

            {/* Basic Animations */}
            <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6}>
              Basic Entrance Animations
            </Text>

            <Flex gap={6} wrap="wrap" marginBottom={8}>
              <AnimatedWrapper animation="fadeIn" delay={0}>
                <Box padding={4} bg="gray.800" borderRadius="lg" width="150px" textAlign="center">
                  <Text color="white" fontSize="sm">Fade In</Text>
                </Box>
              </AnimatedWrapper>

              <AnimatedWrapper animation="slideUp" delay={200}>
                <Box padding={4} bg="gray.800" borderRadius="lg" width="150px" textAlign="center">
                  <Text color="white" fontSize="sm">Slide Up</Text>
                </Box>
              </AnimatedWrapper>

              <AnimatedWrapper animation="scale" delay={400}>
                <Box padding={4} bg="gray.800" borderRadius="lg" width="150px" textAlign="center">
                  <Text color="white" fontSize="sm">Scale</Text>
                </Box>
              </AnimatedWrapper>

              <AnimatedWrapper animation="netflixCard" delay={600}>
                <Box padding={4} bg="gray.800" borderRadius="lg" width="150px" textAlign="center">
                  <Text color="white" fontSize="sm">Netflix Style</Text>
                </Box>
              </AnimatedWrapper>
            </Flex>

            <CodeExample
              title="Basic Animation Components"
              code={`<AnimatedWrapper animation="fadeIn" delay={0}>
  <Box>Fade In Animation</Box>
</AnimatedWrapper>

<AnimatedWrapper animation="slideUp" delay={200}>
  <Box>Slide Up Animation</Box>
</AnimatedWrapper>

<AnimatedWrapper animation="scale" delay={400}>
  <Box>Scale Animation</Box>
</AnimatedWrapper>`}
            />

            {/* List Animations */}
            <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
              List Animations
            </Text>

            <Flex gap={4} marginBottom={6}>
              <Button colorScheme="cyan" onClick={() => setShowList(!showList)}>
                Toggle List
              </Button>
            </Flex>

            {showList && (
              <AnimatedList staggerDelay={0.1} animation="slideUp">
                {['Network Interface', 'Packet Capture', 'Protocol Analysis', 'Security Monitoring'].map((item, index) => (
                  <Box key={index} padding={3} bg="gray.800" borderRadius="md" marginBottom={2}>
                    <Text color="white">{item}</Text>
                  </Box>
                ))}
              </AnimatedList>
            )}

            <CodeExample
              title="Staggered List Animation"
              code={`<AnimatedList staggerDelay={0.1} animation="slideUp">
  {items.map((item, index) => (
    <Box key={index}>
      {item}
    </Box>
  ))}
</AnimatedList>`}
            />

            {/* Modal Animations */}
            <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
              Modal Animations
            </Text>

            <Button colorScheme="red" onClick={() => setShowModal(true)} marginBottom={6}>
              Show Modal
            </Button>

            <ModalTransition
              isOpen={showModal}
              onClose={() => setShowModal(false)}
            >
              <Box
                bg="gray.800"
                padding={6}
                borderRadius="lg"
                border="1px solid"
                borderColor="whiteAlpha.200"
                maxWidth="400px"
              >
                <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                  Animated Modal
                </Text>
                <Text color="gray.300" marginBottom={4}>
                  This modal uses Netflix-style entrance animations with scale, rotation, and blur effects.
                </Text>
                <Button colorScheme="gray" onClick={() => setShowModal(false)}>
                  Close
                </Button>
              </Box>
            </ModalTransition>

            <CodeExample
              title="Modal with Animation"
              code={`<ModalTransition
  isOpen={isOpen}
  onClose={onClose}
>
  <Box bg="gray.800" padding={6}>
    Modal content with smooth animations
  </Box>
</ModalTransition>`}
            />

            {/* Loading Animations */}
            <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
              Loading Animations
            </Text>

            <Flex gap={6} wrap="wrap" marginBottom={6}>
              <Box textAlign="center">
                <AnimatedLoader type="spin" size={40} color="cyan.500" />
                <Text color="white" fontSize="sm" marginTop={2}>Spin Loader</Text>
              </Box>

              <Box textAlign="center">
                <AnimatedLoader type="pulse" size={40} color="green.500" />
                <Text color="white" fontSize="sm" marginTop={2}>Pulse Loader</Text>
              </Box>

              <Box textAlign="center">
                <AnimatedLoader type="dots" color="red.500" />
                <Text color="white" fontSize="sm" marginTop={2}>Dots Loader</Text>
              </Box>
            </Flex>

            <CodeExample
              title="Loading States"
              code={`<AnimatedLoader type="spin" size={40} color="cyan.500" />
<AnimatedLoader type="pulse" size={40} color="green.500" />
<AnimatedLoader type="dots" color="red.500" />`}
            />
          </Box>
        </Stack>
      </Box>
    )
  }
}

export const DataVisualizationAnimations: StoryObj = {
  render: () => {
    const chartData = [45, 78, 23, 67, 89, 34, 56, 90, 12, 78]
    const lineData = [10, 25, 15, 40, 30, 55, 45, 70, 60, 85]
    const donutData = [
      { label: 'TCP', value: 45, color: '#06B6D4' },
      { label: 'UDP', value: 30, color: '#10B981' },
      { label: 'HTTP', value: 20, color: '#F59E0B' },
      { label: 'Other', value: 5, color: '#EF4444' }
    ]

    return (
      <Box padding={6} bg="gray.900" minHeight="100vh">
        <Stack spacing={8}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
              Data Visualization Animations
            </Text>
            <Text fontSize="lg" color="gray.300" marginBottom={8}>
              Animated charts and graphs for network data visualization.
            </Text>

            {/* Bar Chart */}
            <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6}>
              Animated Bar Chart
            </Text>

            <Box marginBottom={8}>
              <AnimatedBarChart
                data={chartData}
                maxValue={100}
                barColor="cyan.500"
                animationDelay={100}
                duration={800}
              />
            </Box>

            <CodeExample
              title="Bar Chart Animation"
              code={`<AnimatedBarChart
  data={[45, 78, 23, 67, 89]}
  maxValue={100}
  barColor="cyan.500"
  animationDelay={100}
  duration={800}
  onBarClick={(value, index) => console.log('Bar clicked:', value)}
/>`}
            />

            {/* Line Chart */}
            <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
              Animated Line Chart
            </Text>

            <Box marginBottom={8}>
              <AnimatedLineChart
                data={lineData}
                width={400}
                height={200}
                strokeColor="green.500"
                strokeWidth={3}
                showDots={true}
                fillArea={true}
                duration={2000}
              />
            </Box>

            <CodeExample
              title="Line Chart Animation"
              code={`<AnimatedLineChart
  data={[10, 25, 15, 40, 30, 55, 45, 70]}
  width={400}
  height={200}
  strokeColor="green.500"
  strokeWidth={3}
  showDots={true}
  fillArea={true}
  duration={2000}
/>`}
            />

            {/* Donut Chart */}
            <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
              Animated Donut Chart
            </Text>

            <Flex justify="center" marginBottom={8}>
              <AnimatedDonutChart
                data={donutData}
                size={200}
                strokeWidth={30}
                showLabels={true}
                duration={1500}
              />
            </Flex>

            <CodeExample
              title="Donut Chart Animation"
              code={`const data = [
  { label: 'TCP', value: 45, color: '#06B6D4' },
  { label: 'UDP', value: 30, color: '#10B981' },
  { label: 'HTTP', value: 20, color: '#F59E0B' },
  { label: 'Other', value: 5, color: '#EF4444' }
]

<AnimatedDonutChart
  data={data}
  size={200}
  strokeWidth={30}
  showLabels={true}
  duration={1500}
/>`}
            />
          </Box>
        </Stack>
      </Box>
    )
  }
}

export const PerformanceOptimization: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Performance Optimization
          </Text>
          <Text fontSize="lg" color="gray.300" marginBottom={8}>
            Best practices for creating performant animations that work well on all devices.
          </Text>

          {/* Performance Monitoring */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6}>
            Performance Monitoring
          </Text>

          <PerformanceTip type="info" title="Automatic Performance Detection">
            The animation system automatically monitors frame rates and adjusts animation complexity based on device capabilities.
          </PerformanceTip>

          <CodeExample
            title="Using Performance Monitoring"
            code={`import { useAnimations } from '@/hooks/useAnimations'

function MyComponent() {
  const { 
    getAnimationStats, 
    performanceMode, 
    setPerformanceMode 
  } = useAnimations({
    enablePerformanceMonitoring: true,
    onPerformanceWarning: (warning) => {
      console.log('Performance issue:', warning)
    }
  })
  
  const stats = getAnimationStats()
  console.log('Active animations:', stats.activeAnimations)
  console.log('Performance mode:', stats.performanceMode)
}`}
          />

          {/* Reduced Motion */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
            Reduced Motion Support
          </Text>

          <PerformanceTip type="success" title="Accessibility First">
            All animations automatically respect the user's reduced motion preferences for better accessibility.
          </PerformanceTip>

          <CodeExample
            title="Reduced Motion Implementation"
            code={`// Automatically handled by the system
import { useAnimations } from '@/hooks/useAnimations'

function MyComponent() {
  const { isReducedMotion, getOptimizedVariants } = useAnimations()
  
  // Variants are automatically optimized based on motion preferences
  const variants = getOptimizedVariants({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  })
  
  // In reduced motion mode, animations become instant
  return <motion.div variants={variants} />
}`}
          />

          {/* Animation Queue */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
            Animation Queue Management
          </Text>

          <PerformanceTip type="warning" title="Concurrent Animation Limits">
            The system automatically queues animations when too many are running simultaneously to maintain smooth performance.
          </PerformanceTip>

          <CodeExample
            title="Animation Queue Usage"
            code={`import { useAnimations } from '@/hooks/useAnimations'

function MyComponent() {
  const { queueAnimation, parallel, sequence } = useAnimations()
  
  // Queue multiple animations
  const animateElements = async () => {
    // Run animations in parallel (with automatic queuing)
    await parallel([
      () => fadeIn(element1),
      () => slideIn(element2),
      () => scaleIn(element3)
    ])
    
    // Run animations in sequence
    await sequence([
      () => slideUp(element4),
      () => fadeIn(element5)
    ])
  }
}`}
          />

          {/* Memory Management */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
            Memory Management
          </Text>

          <PerformanceTip type="error" title="Prevent Memory Leaks">
            Always clean up animations and event listeners when components unmount to prevent memory leaks.
          </PerformanceTip>

          <CodeExample
            title="Proper Cleanup"
            code={`function MyComponent() {
  const { cancelAllAnimations } = useAnimations()
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      cancelAllAnimations()
    }
  }, [cancelAllAnimations])
  
  // Component code...
}`}
          />

          {/* Browser Compatibility */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
            Browser Compatibility
          </Text>

          <PerformanceTip type="info" title="Automatic Fallbacks">
            The system detects browser capabilities and provides appropriate fallbacks for older browsers.
          </PerformanceTip>

          <CodeExample
            title="Capability Detection"
            code={`import { detectBrowserCapabilities } from '@/utils/animationUtils'

const capabilities = detectBrowserCapabilities()

console.log('Supports transform3d:', capabilities.supportsTransform3d)
console.log('Device memory:', capabilities.memory)
console.log('Hardware concurrency:', capabilities.hardwareConcurrency)

// System automatically optimizes based on these capabilities`}
          />
        </Box>
      </Stack>
    </Box>
  )
}

export const BestPractices: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Animation Best Practices
          </Text>
          <Text fontSize="lg" color="gray.300" marginBottom={8}>
            Guidelines for creating effective and user-friendly animations.
          </Text>

          {/* Timing Guidelines */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6}>
            Timing Guidelines
          </Text>

          <Stack spacing={4} marginBottom={8}>
            <Box padding={4} bg="gray.800" borderRadius="lg">
              <Text fontWeight="semibold" color="cyan.400" marginBottom={2}>Fast (150ms)</Text>
              <Text color="gray.300" fontSize="sm">
                Simple state changes, hover effects, button interactions
              </Text>
            </Box>
            
            <Box padding={4} bg="gray.800" borderRadius="lg">
              <Text fontWeight="semibold" color="green.400" marginBottom={2}>Normal (300ms)</Text>
              <Text color="gray.300" fontSize="sm">
                Component entrance/exit, modal animations, most UI transitions
              </Text>
            </Box>
            
            <Box padding={4} bg="gray.800" borderRadius="lg">
              <Text fontWeight="semibold" color="yellow.400" marginBottom={2}>Netflix (400ms)</Text>
              <Text color="gray.300" fontSize="sm">
                Netflix-style card animations, premium feel transitions
              </Text>
            </Box>
            
            <Box padding={4} bg="gray.800" borderRadius="lg">
              <Text fontWeight="semibold" color="red.400" marginBottom={2}>Slow (500ms+)</Text>
              <Text color="gray.300" fontSize="sm">
                Complex animations, data visualizations, loading sequences
              </Text>
            </Box>
          </Stack>

          {/* Easing Guidelines */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6}>
            Easing Functions
          </Text>

          <CodeExample
            title="Recommended Easing Curves"
            code={`// Netflix easing - for premium feel
cubic-bezier(0.25, 0.46, 0.45, 0.94)

// Sharp easing - for quick interactions  
cubic-bezier(0.4, 0, 0.6, 1)

// Smooth easing - for gentle animations
cubic-bezier(0.25, 0.1, 0.25, 1)

// Bounce easing - for playful effects
cubic-bezier(0.68, -0.55, 0.265, 1.55)`}
          />

          {/* Animation Principles */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
            UI Animation Principles
          </Text>

          <Stack spacing={4} marginBottom={8}>
            <PerformanceTip type="success" title="1. Purpose-Driven">
              Every animation should serve a purpose: guiding attention, providing feedback, or improving perceived performance.
            </PerformanceTip>

            <PerformanceTip type="info" title="2. Consistent Timing">
              Use consistent timing across similar interactions to create a cohesive experience.
            </PerformanceTip>

            <PerformanceTip type="warning" title="3. Respect Context">
              Loading animations can be longer, but interaction feedback should be immediate.
            </PerformanceTip>

            <PerformanceTip type="error" title="4. Avoid Overdoing">
              Too many animations can be distracting and hurt performance. Use them strategically.
            </PerformanceTip>
          </Stack>

          {/* Do's and Don'ts */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6}>
            Do's and Don'ts
          </Text>

          <Flex gap={6} wrap="wrap">
            <Box flex={1} minWidth="300px">
              <Text fontSize="lg" fontWeight="semibold" color="green.400" marginBottom={4}>
                ✅ DO
              </Text>
              <Stack spacing={2}>
                <Text color="gray.300" fontSize="sm">• Use transform and opacity for smooth animations</Text>
                <Text color="gray.300" fontSize="sm">• Provide immediate feedback for user interactions</Text>
                <Text color="gray.300" fontSize="sm">• Test animations on low-end devices</Text>
                <Text color="gray.300" fontSize="sm">• Respect user's motion preferences</Text>
                <Text color="gray.300" fontSize="sm">• Use consistent easing curves</Text>
              </Stack>
            </Box>

            <Box flex={1} minWidth="300px">
              <Text fontSize="lg" fontWeight="semibold" color="red.400" marginBottom={4}>
                ❌ DON'T
              </Text>
              <Stack spacing={2}>
                <Text color="gray.300" fontSize="sm">• Animate layout properties (width, height, margin)</Text>
                <Text color="gray.300" fontSize="sm">• Use animations longer than 1 second for UI interactions</Text>
                <Text color="gray.300" fontSize="sm">• Run many complex animations simultaneously</Text>
                <Text color="gray.300" fontSize="sm">• Ignore accessibility requirements</Text>
                <Text color="gray.300" fontSize="sm">• Use animations just for decoration</Text>
              </Stack>
            </Box>
          </Flex>

          {/* Implementation Checklist */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={6} marginTop={8}>
            Implementation Checklist
          </Text>

          <Box padding={4} bg="gray.800" borderRadius="lg">
            <Stack spacing={2}>
              <Text color="gray.300" fontSize="sm">□ Animation serves a clear purpose</Text>
              <Text color="gray.300" fontSize="sm">□ Timing is appropriate for the interaction type</Text>
              <Text color="gray.300" fontSize="sm">□ Uses GPU-accelerated properties (transform, opacity)</Text>
              <Text color="gray.300" fontSize="sm">□ Respects reduced motion preferences</Text>
              <Text color="gray.300" fontSize="sm">□ Performance tested on low-end devices</Text>
              <Text color="gray.300" fontSize="sm">□ Includes proper cleanup/cancellation</Text>
              <Text color="gray.300" fontSize="sm">□ Consistent with other app animations</Text>
              <Text color="gray.300" fontSize="sm">□ Accessible to screen reader users</Text>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}