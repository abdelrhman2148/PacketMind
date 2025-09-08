import type { Meta, StoryObj } from '@storybook/react'
import { Box, Grid, Text, Stack, Flex } from '@chakra-ui/react'
import { designTokens } from '../tokens/designTokens'

const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Netflix-inspired design tokens for the AI Shark application. These tokens provide consistent colors, spacing, typography, and other design properties throughout the application.'
      }
    }
  }
}

export default meta

// Color token display component
const ColorSwatch = ({ name, value, description }) => (
  <Flex align="center" gap={3} padding={3} borderRadius="md" bg="gray.800">
    <Box
      width="40px"
      height="40px"
      borderRadius="md"
      backgroundColor={value}
      border="1px solid"
      borderColor="whiteAlpha.200"
    />
    <Stack spacing={0}>
      <Text fontSize="sm" fontWeight="semibold" color="white">
        {name}
      </Text>
      <Text fontSize="xs" color="gray.400" fontFamily="mono">
        {value}
      </Text>
      {description && (
        <Text fontSize="xs" color="gray.500">
          {description}
        </Text>
      )}
    </Stack>
  </Flex>
)

// Spacing token display component
const SpacingToken = ({ name, value }) => (
  <Flex align="center" gap={3} padding={3} borderRadius="md" bg="gray.800">
    <Box
      width={value}
      height="20px"
      backgroundColor="cyan.500"
      borderRadius="sm"
    />
    <Stack spacing={0}>
      <Text fontSize="sm" fontWeight="semibold" color="white">
        {name}
      </Text>
      <Text fontSize="xs" color="gray.400" fontFamily="mono">
        {value}
      </Text>
    </Stack>
  </Flex>
)

// Typography token display component
const TypographyToken = ({ name, style }) => (
  <Box padding={4} borderRadius="md" bg="gray.800" marginBottom={2}>
    <Text fontSize="sm" color="gray.400" marginBottom={2}>
      {name}
    </Text>
    <Text
      fontSize={style.fontSize}
      fontWeight={style.fontWeight}
      lineHeight={style.lineHeight}
      letterSpacing={style.letterSpacing}
      fontFamily={style.fontFamily}
      color="white"
    >
      The quick brown fox jumps over the lazy dog
    </Text>
    <Text fontSize="xs" color="gray.500" fontFamily="mono" marginTop={2}>
      fontSize: {style.fontSize} | fontWeight: {style.fontWeight} | lineHeight: {style.lineHeight}
    </Text>
  </Box>
)

export const Colors: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Color Palette
          </Text>
          
          {/* Primary Colors */}
          <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={3}>
            Primary (Netflix Red)
          </Text>
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3} marginBottom={6}>
            {Object.entries(designTokens.colors.primary).map(([key, value]) => (
              <ColorSwatch
                key={key}
                name={`primary.${key}`}
                value={value}
                description={key === '500' ? 'Main Netflix brand color' : ''}
              />
            ))}
          </Grid>

          {/* Accent Colors */}
          <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={3}>
            Accent (Wireshark Cyan)
          </Text>
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3} marginBottom={6}>
            {Object.entries(designTokens.colors.accent).map(([key, value]) => (
              <ColorSwatch
                key={key}
                name={`accent.${key}`}
                value={value}
                description={key === '500' ? 'Network analysis accent color' : ''}
              />
            ))}
          </Grid>

          {/* Neutral Colors */}
          <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={3}>
            Neutral (Grays)
          </Text>
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3} marginBottom={6}>
            {Object.entries(designTokens.colors.neutral).map(([key, value]) => (
              <ColorSwatch
                key={key}
                name={`neutral.${key}`}
                value={value}
              />
            ))}
          </Grid>

          {/* Protocol Colors */}
          <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={3}>
            Protocol Colors
          </Text>
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3} marginBottom={6}>
            {Object.entries(designTokens.colors.protocol).map(([key, value]) => (
              <ColorSwatch
                key={key}
                name={`protocol.${key}`}
                value={value}
                description={`Color for ${key.toUpperCase()} protocol`}
              />
            ))}
          </Grid>

          {/* Semantic Colors */}
          <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={3}>
            Semantic Colors
          </Text>
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3}>
            {Object.entries(designTokens.colors.semantic).map(([key, value]) => (
              <ColorSwatch
                key={key}
                name={`semantic.${key}`}
                value={value}
                description={`${key.charAt(0).toUpperCase() + key.slice(1)} state color`}
              />
            ))}
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const Spacing: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Spacing Scale
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={6}>
            Based on a 4px grid system for consistent spacing throughout the application.
          </Text>
          
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
            {Object.entries(designTokens.spacing).map(([key, value]) => (
              <SpacingToken
                key={key}
                name={`spacing.${key}`}
                value={value}
              />
            ))}
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const Typography: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Typography Scale
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={6}>
            Netflix Sans font family with carefully crafted size and weight combinations.
          </Text>

          {/* Display Styles */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={4}>
            Display Styles
          </Text>
          {Object.entries(designTokens.typography.display).map(([key, style]) => (
            <TypographyToken
              key={key}
              name={`display.${key}`}
              style={style}
            />
          ))}

          {/* Heading Styles */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={4} marginTop={8}>
            Heading Styles
          </Text>
          {Object.entries(designTokens.typography.heading).map(([key, style]) => (
            <TypographyToken
              key={key}
              name={`heading.${key}`}
              style={style}
            />
          ))}

          {/* Body Styles */}
          <Text fontSize="2xl" fontWeight="semibold" color="white" marginBottom={4} marginTop={8}>
            Body Text Styles
          </Text>
          {Object.entries(designTokens.typography.body).map(([key, style]) => (
            <TypographyToken
              key={key}
              name={`body.${key}`}
              style={style}
            />
          ))}
        </Box>
      </Stack>
    </Box>
  )
}

export const Shadows: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Shadow System
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={6}>
            Netflix-inspired shadow depths for creating visual hierarchy and depth.
          </Text>
          
          <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
            {Object.entries(designTokens.shadows).map(([key, value]) => (
              <Box key={key} padding={4}>
                <Box
                  width="100%"
                  height="120px"
                  backgroundColor="gray.800"
                  borderRadius="lg"
                  boxShadow={value}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Stack spacing={1} textAlign="center">
                    <Text fontSize="sm" fontWeight="semibold" color="white">
                      {key}
                    </Text>
                    <Text fontSize="xs" color="gray.400" fontFamily="mono">
                      {value}
                    </Text>
                  </Stack>
                </Box>
              </Box>
            ))}
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const BorderRadius: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Border Radius Scale
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={6}>
            Consistent border radius values for UI elements.
          </Text>
          
          <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
            {Object.entries(designTokens.borderRadius).map(([key, value]) => (
              <Box key={key} padding={3}>
                <Box
                  width="120px"
                  height="80px"
                  backgroundColor="cyan.500"
                  borderRadius={value}
                  marginBottom={2}
                />
                <Stack spacing={0}>
                  <Text fontSize="sm" fontWeight="semibold" color="white">
                    {key}
                  </Text>
                  <Text fontSize="xs" color="gray.400" fontFamily="mono">
                    {value}
                  </Text>
                </Stack>
              </Box>
            ))}
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}