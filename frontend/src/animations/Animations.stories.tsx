import type { Meta, StoryObj } from '@storybook/react'
import { Box, Grid, Text, Stack, Button, Flex } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import animations from '../animations'

const meta: Meta = {
  title: 'Design System/Animations',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Netflix-inspired animation library with carefully crafted timing and easing functions. All animations support reduced motion preferences and are built with Framer Motion.'
      }
    }
  }
}

export default meta

const MotionBox = motion(Box)

// Animation demo component
const AnimationDemo = ({ title, variants, children, triggerKey = 'demo' }) => {
  const [isVisible, setIsVisible] = useState(true)
  
  const toggleAnimation = () => {
    setIsVisible(false)
    setTimeout(() => setIsVisible(true), 100)
  }

  return (
    <Box
      padding={6}
      bg="gray.800"
      borderRadius="lg"
      border="1px solid"
      borderColor="whiteAlpha.200"
    >
      <Flex justify="space-between" align="center" marginBottom={4}>
        <Text fontSize="lg" fontWeight="semibold" color="white">
          {title}
        </Text>
        <Button size="sm" onClick={toggleAnimation} variant="outline" colorScheme="cyan">
          Replay
        </Button>
      </Flex>
      
      <Box height="150px" display="flex" alignItems="center" justifyContent="center">
        <AnimatePresence mode="wait">
          {isVisible && (
            <MotionBox
              key={`${triggerKey}-${Date.now()}`}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              {...children}
            >
              <Box
                width="80px"
                height="80px"
                bg="cyan.500"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="sm" fontWeight="bold" color="white">
                  Demo
                </Text>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  )
}

// Card animation demo
const CardDemo = ({ title, variants }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Box
      padding={6}
      bg="gray.800"
      borderRadius="lg"
      border="1px solid"
      borderColor="whiteAlpha.200"
    >
      <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
        {title}
      </Text>
      
      <Box height="200px" display="flex" alignItems="center" justifyContent="center">
        <MotionBox
          variants={variants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          width="120px"
          height="120px"
          bg="gray.700"
          borderRadius="lg"
          border="1px solid"
          borderColor="whiteAlpha.300"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
        >
          <Text fontSize="sm" color="white" textAlign="center">
            {isHovered ? 'Hovered!' : 'Hover me'}
          </Text>
        </MotionBox>
      </Box>
    </Box>
  )
}

// List animation demo
const ListDemo = () => {
  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3'])
  
  const addItem = () => {
    setItems([...items, `Item ${items.length + 1}`])
  }
  
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  return (
    <Box
      padding={6}
      bg="gray.800"
      borderRadius="lg"
      border="1px solid"
      borderColor="whiteAlpha.200"
    >
      <Flex justify="space-between" align="center" marginBottom={4}>
        <Text fontSize="lg" fontWeight="semibold" color="white">
          Staggered List Animation
        </Text>
        <Button size="sm" onClick={addItem} variant="outline" colorScheme="cyan">
          Add Item
        </Button>
      </Flex>
      
      <MotionBox variants={animations.variants.stagger} initial="initial" animate="animate">
        <Stack spacing={2}>
          <AnimatePresence>
            {items.map((item, index) => (
              <MotionBox
                key={item}
                variants={animations.variants.listItem}
                initial="initial"
                animate="animate"
                exit="exit"
                custom={index}
                padding={3}
                bg="gray.700"
                borderRadius="md"
                cursor="pointer"
                onClick={() => removeItem(index)}
                _hover={{ bg: 'gray.600' }}
              >
                <Text color="white" fontSize="sm">
                  {item} (click to remove)
                </Text>
              </MotionBox>
            ))}
          </AnimatePresence>
        </Stack>
      </MotionBox>
    </Box>
  )
}

export const BasicAnimations: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Basic Animations
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Fundamental animation patterns used throughout the application.
          </Text>
          
          <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
            <AnimationDemo
              title="Fade In"
              variants={animations.variants.fade}
              triggerKey="fade"
            />
            
            <AnimationDemo
              title="Slide Up"
              variants={animations.variants.slideUp}
              triggerKey="slideUp"
            />
            
            <AnimationDemo
              title="Slide Down"
              variants={animations.variants.slideDown}
              triggerKey="slideDown"
            />
            
            <AnimationDemo
              title="Slide Left"
              variants={animations.variants.slideLeft}
              triggerKey="slideLeft"
            />
            
            <AnimationDemo
              title="Slide Right"
              variants={animations.variants.slideRight}
              triggerKey="slideRight"
            />
            
            <AnimationDemo
              title="Scale"
              variants={animations.variants.scale}
              triggerKey="scale"
            />
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const NetflixAnimations: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Netflix-Style Animations
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Premium animations inspired by Netflix's interface design.
          </Text>
          
          <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
            <CardDemo
              title="Netflix Card Hover"
              variants={animations.variants.netflixCard}
            />
            
            <AnimationDemo
              title="Modal Animation"
              variants={animations.variants.modal}
              triggerKey="modal"
            />
            
            <AnimationDemo
              title="Page Transition"
              variants={animations.variants.page}
              triggerKey="page"
            />
            
            <AnimationDemo
              title="Drawer Slide"
              variants={animations.variants.drawer}
              triggerKey="drawer"
            />
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const LoadingAnimations: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Loading Animations
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Smooth loading states and progress indicators.
          </Text>
          
          <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Spin Animation
              </Text>
              <Box height="150px" display="flex" alignItems="center" justifyContent="center">
                <MotionBox
                  variants={animations.variants.spin}
                  animate="animate"
                  width="40px"
                  height="40px"
                  border="3px solid"
                  borderColor="transparent"
                  borderTopColor="cyan.500"
                  borderRadius="full"
                />
              </Box>
            </Box>
            
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Pulse Animation
              </Text>
              <Box height="150px" display="flex" alignItems="center" justifyContent="center">
                <MotionBox
                  variants={animations.variants.pulse}
                  animate="animate"
                  width="60px"
                  height="60px"
                  bg="cyan.500"
                  borderRadius="full"
                />
              </Box>
            </Box>
            
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Wave Animation
              </Text>
              <Box height="150px" display="flex" alignItems="center" justifyContent="center">
                <Flex gap={1}>
                  {[0, 1, 2].map((i) => (
                    <MotionBox
                      key={i}
                      variants={animations.variants.wave}
                      animate="animate"
                      style={{ animationDelay: `${i * 0.1}s` }}
                      width="8px"
                      height="40px"
                      bg="cyan.500"
                      borderRadius="full"
                    />
                  ))}
                </Flex>
              </Box>
            </Box>
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const InteractiveAnimations: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Interactive Animations
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Animations triggered by user interactions like hover, click, and focus.
          </Text>
          
          <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Button Interactions
              </Text>
              <Box height="150px" display="flex" alignItems="center" justifyContent="center">
                <MotionBox
                  variants={animations.variants.button}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  as="button"
                  padding={4}
                  bg="cyan.600"
                  color="white"
                  borderRadius="md"
                  fontWeight="semibold"
                  border="none"
                  cursor="pointer"
                >
                  Interactive Button
                </MotionBox>
              </Box>
            </Box>
            
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Icon Hover
              </Text>
              <Box height="150px" display="flex" alignItems="center" justifyContent="center">
                <MotionBox
                  variants={animations.variants.icon}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  width="60px"
                  height="60px"
                  bg="gray.700"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  fontSize="2xl"
                >
                  ⚙️
                </MotionBox>
              </Box>
            </Box>
            
            <ListDemo />
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const Easing: StoryObj = {
  render: () => {
    const easingFunctions = [
      { name: 'ease', value: 'ease' },
      { name: 'ease-in-out', value: 'ease-in-out' },
      { name: 'netflix', value: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
      { name: 'sharp', value: 'cubic-bezier(0.4, 0, 0.6, 1)' },
      { name: 'smooth', value: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
      { name: 'bounce', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' }
    ]

    return (
      <Box padding={6} bg="gray.900" minHeight="100vh">
        <Stack spacing={8}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
              Easing Functions
            </Text>
            <Text fontSize="lg" color="gray.400" marginBottom={8}>
              Different easing curves for various animation feels and personalities.
            </Text>
            
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
              {easingFunctions.map(({ name, value }) => {
                const [isAnimating, setIsAnimating] = useState(false)
                
                const triggerAnimation = () => {
                  setIsAnimating(true)
                  setTimeout(() => setIsAnimating(false), 1000)
                }

                return (
                  <Box
                    key={name}
                    padding={6}
                    bg="gray.800"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Flex justify="space-between" align="center" marginBottom={4}>
                      <Stack spacing={1}>
                        <Text fontSize="lg" fontWeight="semibold" color="white">
                          {name}
                        </Text>
                        <Text fontSize="xs" color="gray.400" fontFamily="mono">
                          {value}
                        </Text>
                      </Stack>
                      <Button size="sm" onClick={triggerAnimation} variant="outline" colorScheme="cyan">
                        Play
                      </Button>
                    </Flex>
                    
                    <Box height="100px" bg="gray.700" borderRadius="md" position="relative" overflow="hidden">
                      <MotionBox
                        width="20px"
                        height="20px"
                        bg="cyan.500"
                        borderRadius="full"
                        position="absolute"
                        top="40px"
                        left="10px"
                        animate={isAnimating ? { x: 250 } : { x: 0 }}
                        transition={{ duration: 1, ease: value }}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Grid>
          </Box>
        </Stack>
      </Box>
    )
  }
}

export const Timing: StoryObj = {
  render: () => {
    const durations = [
      { name: 'Fast', value: 150 },
      { name: 'Normal', value: 300 },
      { name: 'Netflix', value: 400 },
      { name: 'Slow', value: 500 }
    ]

    return (
      <Box padding={6} bg="gray.900" minHeight="100vh">
        <Stack spacing={8}>
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
              Animation Timing
            </Text>
            <Text fontSize="lg" color="gray.400" marginBottom={8}>
              Standard duration values for consistent timing across the application.
            </Text>
            
            <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
              {durations.map(({ name, value }) => {
                const [isAnimating, setIsAnimating] = useState(false)
                
                const triggerAnimation = () => {
                  setIsAnimating(true)
                  setTimeout(() => setIsAnimating(false), value + 100)
                }

                return (
                  <Box
                    key={name}
                    padding={6}
                    bg="gray.800"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Flex justify="space-between" align="center" marginBottom={4}>
                      <Stack spacing={1}>
                        <Text fontSize="lg" fontWeight="semibold" color="white">
                          {name}
                        </Text>
                        <Text fontSize="sm" color="gray.400">
                          {value}ms
                        </Text>
                      </Stack>
                      <Button size="sm" onClick={triggerAnimation} variant="outline" colorScheme="cyan">
                        Play
                      </Button>
                    </Flex>
                    
                    <Box height="80px" display="flex" alignItems="center" justifyContent="center">
                      <MotionBox
                        width="40px"
                        height="40px"
                        bg="cyan.500"
                        borderRadius="lg"
                        animate={isAnimating ? { scale: [1, 1.2, 1], rotate: 360 } : {}}
                        transition={{ duration: value / 1000, ease: 'easeInOut' }}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Grid>
          </Box>
        </Stack>
      </Box>
    )
  }
}