import type { Meta, StoryObj } from '@storybook/react'
import { Box, Grid, Text, Stack, Flex } from '@chakra-ui/react'
import typography from '../typography'

const meta: Meta = {
  title: 'Design System/Typography',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Netflix-inspired typography system with carefully crafted font hierarchies, weights, and spacing for the AI Shark application.'
      }
    }
  }
}

export default meta

// Typography example component
const TypographyExample = ({ title, styles, sampleText = "The quick brown fox jumps over the lazy dog" }) => (
  <Box marginBottom={8}>
    <Text fontSize="xl" fontWeight="semibold" color="white" marginBottom={4}>
      {title}
    </Text>
    <Stack spacing={4}>
      {Object.entries(styles).map(([key, style]) => (
        <Box
          key={key}
          padding={4}
          bg="gray.800"
          borderRadius="lg"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="sm" color="gray.400" marginBottom={2}>
            {key}
          </Text>
          <Text
            fontSize={style.fontSize}
            fontWeight={style.fontWeight}
            lineHeight={style.lineHeight}
            letterSpacing={style.letterSpacing}
            fontFamily={style.fontFamily}
            color="white"
            marginBottom={2}
          >
            {sampleText}
          </Text>
          <Box color="gray.500" fontSize="xs" fontFamily="mono">
            <Text>fontSize: {style.fontSize}</Text>
            <Text>fontWeight: {style.fontWeight}</Text>
            <Text>lineHeight: {style.lineHeight}</Text>
            <Text>letterSpacing: {style.letterSpacing}</Text>
            <Text>fontFamily: {style.fontFamily}</Text>
          </Box>
        </Box>
      ))}
    </Stack>
  </Box>
)

// Font weight showcase
const FontWeightShowcase = ({ family, weights }) => (
  <Box
    padding={6}
    bg="gray.800"
    borderRadius="lg"
    border="1px solid"
    borderColor="whiteAlpha.200"
  >
    <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
      {family}
    </Text>
    <Stack spacing={3}>
      {Object.entries(weights).map(([name, weight]) => (
        <Box key={name}>
          <Text
            fontSize="lg"
            fontWeight={weight}
            fontFamily={typography.families[family.toLowerCase()]}
            color="white"
            marginBottom={1}
          >
            The quick brown fox jumps over the lazy dog
          </Text>
          <Text fontSize="xs" color="gray.400">
            {name} ({weight})
          </Text>
        </Box>
      ))}
    </Stack>
  </Box>
)

export const TypeScale: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Typography Scale
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Comprehensive typography system with display, heading, body, and specialized text styles.
          </Text>

          <TypographyExample
            title="Display Styles"
            styles={typography.scale.display}
            sampleText="AI Shark Network Analyzer"
          />

          <TypographyExample
            title="Heading Styles"
            styles={typography.scale.heading}
            sampleText="Packet Analysis Dashboard"
          />

          <TypographyExample
            title="Body Text Styles"
            styles={typography.scale.body}
            sampleText="Monitor network traffic and analyze packet data in real-time with advanced filtering and visualization tools."
          />

          <TypographyExample
            title="Label Styles"
            styles={typography.scale.label}
            sampleText="Protocol Type"
          />

          <TypographyExample
            title="Code Styles"
            styles={typography.scale.code}
            sampleText="192.168.1.1:80 -> 192.168.1.100:8080"
          />

          <TypographyExample
            title="Caption Styles"
            styles={typography.scale.caption}
            sampleText="Last updated 2 minutes ago"
          />
        </Box>
      </Stack>
    </Box>
  )
}

export const FontFamilies: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Font Families
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Netflix Sans is the primary font family, with system fonts as fallbacks and monospace for code.
          </Text>

          <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Display & Body Font
              </Text>
              <Text
                fontSize="2xl"
                fontFamily={typography.families.display}
                color="white"
                marginBottom={3}
              >
                Netflix Sans
              </Text>
              <Text
                fontSize="md"
                fontFamily={typography.families.display}
                color="gray.300"
                marginBottom={4}
              >
                The quick brown fox jumps over the lazy dog
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                {typography.families.display}
              </Text>
            </Box>

            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Monospace Font
              </Text>
              <Text
                fontSize="2xl"
                fontFamily={typography.families.mono}
                color="white"
                marginBottom={3}
              >
                SF Mono
              </Text>
              <Text
                fontSize="md"
                fontFamily={typography.families.mono}
                color="gray.300"
                marginBottom={4}
              >
                192.168.1.1 TCP:443 SSL/TLS
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                {typography.families.mono}
              </Text>
            </Box>

            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                System Font
              </Text>
              <Text
                fontSize="2xl"
                fontFamily={typography.families.system}
                color="white"
                marginBottom={3}
              >
                System Default
              </Text>
              <Text
                fontSize="md"
                fontFamily={typography.families.system}
                color="gray.300"
                marginBottom={4}
              >
                Fallback for better performance
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                {typography.families.system}
              </Text>
            </Box>
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const FontWeights: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Font Weights
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Available font weights for creating hierarchy and emphasis.
          </Text>

          <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
            <FontWeightShowcase
              family="Display"
              weights={typography.weights}
            />
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const NetflixStyles: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Netflix-Specific Styles
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Pre-configured typography styles that capture the Netflix aesthetic.
          </Text>

          <Grid templateColumns="1fr" gap={6}>
            {/* Hero Style */}
            <Box
              padding={8}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
              backgroundImage="linear-gradient(135deg, rgba(229, 9, 20, 0.1), rgba(0, 0, 0, 0.8))"
            >
              <Text fontSize="sm" color="gray.400" marginBottom={3}>
                Hero Style
              </Text>
              <Text
                fontSize={typography.netflix.hero.fontSize}
                lineHeight={typography.netflix.hero.lineHeight}
                fontWeight={typography.netflix.hero.fontWeight}
                letterSpacing={typography.netflix.hero.letterSpacing}
                fontFamily={typography.netflix.hero.fontFamily}
                color={typography.netflix.hero.color}
                textShadow={typography.netflix.hero.textShadow}
                marginBottom={3}
              >
                AI Shark Network Analyzer
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Used for main hero headings with dramatic text shadow
              </Text>
            </Box>

            {/* Subtitle Style */}
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="gray.400" marginBottom={3}>
                Subtitle Style
              </Text>
              <Text
                fontSize={typography.netflix.subtitle.fontSize}
                lineHeight={typography.netflix.subtitle.lineHeight}
                fontWeight={typography.netflix.subtitle.fontWeight}
                letterSpacing={typography.netflix.subtitle.letterSpacing}
                fontFamily={typography.netflix.subtitle.fontFamily}
                color={typography.netflix.subtitle.color}
                textShadow={typography.netflix.subtitle.textShadow}
                marginBottom={3}
              >
                Professional network packet analysis and real-time monitoring
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Used for subtitles and descriptions below hero content
              </Text>
            </Box>

            {/* Card Title & Description */}
            <Flex gap={6}>
              <Box
                padding={6}
                bg="gray.800"
                borderRadius="lg"
                border="1px solid"
                borderColor="whiteAlpha.200"
                flex={1}
              >
                <Text fontSize="sm" color="gray.400" marginBottom={3}>
                  Card Title Style
                </Text>
                <Text
                  fontSize={typography.netflix.cardTitle.fontSize}
                  lineHeight={typography.netflix.cardTitle.lineHeight}
                  fontWeight={typography.netflix.cardTitle.fontWeight}
                  letterSpacing={typography.netflix.cardTitle.letterSpacing}
                  fontFamily={typography.netflix.cardTitle.fontFamily}
                  color={typography.netflix.cardTitle.color}
                  marginBottom={3}
                >
                  Network Interface Monitor
                </Text>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  Used for card and component titles
                </Text>
              </Box>

              <Box
                padding={6}
                bg="gray.800"
                borderRadius="lg"
                border="1px solid"
                borderColor="whiteAlpha.200"
                flex={1}
              >
                <Text fontSize="sm" color="gray.400" marginBottom={3}>
                  Card Description Style
                </Text>
                <Text
                  fontSize={typography.netflix.cardDescription.fontSize}
                  lineHeight={typography.netflix.cardDescription.lineHeight}
                  fontWeight={typography.netflix.cardDescription.fontWeight}
                  letterSpacing={typography.netflix.cardDescription.letterSpacing}
                  fontFamily={typography.netflix.cardDescription.fontFamily}
                  color={typography.netflix.cardDescription.color}
                  marginBottom={3}
                >
                  Monitor active network interfaces and capture packet data in real-time
                </Text>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  Used for descriptions and secondary content
                </Text>
              </Box>
            </Flex>

            {/* Navigation & Button Text */}
            <Flex gap={6}>
              <Box
                padding={6}
                bg="gray.800"
                borderRadius="lg"
                border="1px solid"
                borderColor="whiteAlpha.200"
                flex={1}
              >
                <Text fontSize="sm" color="gray.400" marginBottom={3}>
                  Navigation Text Style
                </Text>
                <Text
                  fontSize={typography.netflix.navText.fontSize}
                  lineHeight={typography.netflix.navText.lineHeight}
                  fontWeight={typography.netflix.navText.fontWeight}
                  letterSpacing={typography.netflix.navText.letterSpacing}
                  fontFamily={typography.netflix.navText.fontFamily}
                  color={typography.netflix.navText.color}
                  textTransform={typography.netflix.navText.textTransform}
                  marginBottom={3}
                >
                  DASHBOARD
                </Text>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  Used for navigation items with uppercase transform
                </Text>
              </Box>

              <Box
                padding={6}
                bg="gray.800"
                borderRadius="lg"
                border="1px solid"
                borderColor="whiteAlpha.200"
                flex={1}
              >
                <Text fontSize="sm" color="gray.400" marginBottom={3}>
                  Button Text Style
                </Text>
                <Text
                  fontSize={typography.netflix.buttonText.fontSize}
                  lineHeight={typography.netflix.buttonText.lineHeight}
                  fontWeight={typography.netflix.buttonText.fontWeight}
                  letterSpacing={typography.netflix.buttonText.letterSpacing}
                  fontFamily={typography.netflix.buttonText.fontFamily}
                  textTransform={typography.netflix.buttonText.textTransform}
                  color="white"
                  marginBottom={3}
                >
                  START CAPTURE
                </Text>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  Used for button labels with uppercase transform
                </Text>
              </Box>
            </Flex>
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const WiresharkStyles: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Wireshark-Specific Styles
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Typography styles optimized for network analysis and data display.
          </Text>

          <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
            {/* Protocol Label */}
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="gray.400" marginBottom={3}>
                Protocol Label Style
              </Text>
              <Text
                fontSize={typography.wireshark.protocolLabel.fontSize}
                lineHeight={typography.wireshark.protocolLabel.lineHeight}
                fontWeight={typography.wireshark.protocolLabel.fontWeight}
                letterSpacing={typography.wireshark.protocolLabel.letterSpacing}
                fontFamily={typography.wireshark.protocolLabel.fontFamily}
                textTransform={typography.wireshark.protocolLabel.textTransform}
                color="cyan.400"
                marginBottom={3}
              >
                TCP
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Used for protocol type indicators
              </Text>
            </Box>

            {/* Packet Data */}
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="gray.400" marginBottom={3}>
                Packet Data Style
              </Text>
              <Text
                fontSize={typography.wireshark.packetData.fontSize}
                lineHeight={typography.wireshark.packetData.lineHeight}
                fontWeight={typography.wireshark.packetData.fontWeight}
                letterSpacing={typography.wireshark.packetData.letterSpacing}
                fontFamily={typography.wireshark.packetData.fontFamily}
                color="white"
                marginBottom={3}
              >
                45 00 00 3c 1c 46 40 00
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Used for displaying raw packet data
              </Text>
            </Box>

            {/* IP Address */}
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="gray.400" marginBottom={3}>
                IP Address Style
              </Text>
              <Text
                fontSize={typography.wireshark.ipAddress.fontSize}
                lineHeight={typography.wireshark.ipAddress.lineHeight}
                fontWeight={typography.wireshark.ipAddress.fontWeight}
                letterSpacing={typography.wireshark.ipAddress.letterSpacing}
                fontFamily={typography.wireshark.ipAddress.fontFamily}
                color={typography.wireshark.ipAddress.color}
                marginBottom={3}
              >
                192.168.1.100
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Used for IP addresses with cyan accent
              </Text>
            </Box>

            {/* Port Number */}
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="gray.400" marginBottom={3}>
                Port Number Style
              </Text>
              <Text
                fontSize={typography.wireshark.portNumber.fontSize}
                lineHeight={typography.wireshark.portNumber.lineHeight}
                fontWeight={typography.wireshark.portNumber.fontWeight}
                letterSpacing={typography.wireshark.portNumber.letterSpacing}
                fontFamily={typography.wireshark.portNumber.fontFamily}
                color={typography.wireshark.portNumber.color}
                marginBottom={3}
              >
                :8080
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Used for port numbers with muted color
              </Text>
            </Box>

            {/* Timestamp */}
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="gray.400" marginBottom={3}>
                Timestamp Style
              </Text>
              <Text
                fontSize={typography.wireshark.timestamp.fontSize}
                lineHeight={typography.wireshark.timestamp.lineHeight}
                fontWeight={typography.wireshark.timestamp.fontWeight}
                letterSpacing={typography.wireshark.timestamp.letterSpacing}
                fontFamily={typography.wireshark.timestamp.fontFamily}
                color={typography.wireshark.timestamp.color}
                marginBottom={3}
              >
                14:23:45.123456
              </Text>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                Used for packet timestamps
              </Text>
            </Box>

            {/* Status Messages */}
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="sm" color="gray.400" marginBottom={3}>
                Status Message Styles
              </Text>
              <Stack spacing={2}>
                <Text
                  fontSize={typography.wireshark.successMessage.fontSize}
                  lineHeight={typography.wireshark.successMessage.lineHeight}
                  fontWeight={typography.wireshark.successMessage.fontWeight}
                  letterSpacing={typography.wireshark.successMessage.letterSpacing}
                  fontFamily={typography.wireshark.successMessage.fontFamily}
                  color={typography.wireshark.successMessage.color}
                >
                  ✓ Connection established
                </Text>
                <Text
                  fontSize={typography.wireshark.errorMessage.fontSize}
                  lineHeight={typography.wireshark.errorMessage.lineHeight}
                  fontWeight={typography.wireshark.errorMessage.fontWeight}
                  letterSpacing={typography.wireshark.errorMessage.letterSpacing}
                  fontFamily={typography.wireshark.errorMessage.fontFamily}
                  color={typography.wireshark.errorMessage.color}
                >
                  ✗ Connection timeout
                </Text>
              </Stack>
              <Text fontSize="xs" color="gray.500" fontFamily="mono" marginTop={2}>
                Used for success and error states
              </Text>
            </Box>
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}

export const ResponsiveTypography: StoryObj = {
  render: () => (
    <Box padding={6} bg="gray.900" minHeight="100vh">
      <Stack spacing={8}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color="white" marginBottom={4}>
            Responsive Typography
          </Text>
          <Text fontSize="lg" color="gray.400" marginBottom={8}>
            Typography that adapts to different screen sizes for optimal readability.
          </Text>

          <Stack spacing={6}>
            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Responsive Scaling Example
              </Text>
              <Text fontSize="sm" color="gray.400" marginBottom={4}>
                This text will scale down on mobile devices. Resize your browser to see the effect.
              </Text>
              
              <Box
                fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
                fontWeight="semibold"
                color="white"
                marginBottom={4}
              >
                Responsive Heading Text
              </Box>
              
              <Text
                fontSize={{ base: "sm", md: "md", lg: "lg" }}
                color="gray.300"
                lineHeight="relaxed"
              >
                This paragraph demonstrates responsive typography. On mobile devices (base), 
                it uses smaller font sizes for better readability on small screens. On tablet 
                (md) and desktop (lg) sizes, it scales up appropriately.
              </Text>
            </Box>

            <Box
              padding={6}
              bg="gray.800"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" fontWeight="semibold" color="white" marginBottom={4}>
                Breakpoint Guidelines
              </Text>
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="cyan.400" marginBottom={2}>
                    Mobile (base)
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    0px - 767px<br/>
                    Smaller fonts<br/>
                    Tighter spacing<br/>
                    Single column
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="cyan.400" marginBottom={2}>
                    Tablet (md)
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    768px - 1023px<br/>
                    Medium fonts<br/>
                    Normal spacing<br/>
                    Two columns
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="cyan.400" marginBottom={2}>
                    Desktop (lg)
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    1024px+<br/>
                    Larger fonts<br/>
                    Generous spacing<br/>
                    Multiple columns
                  </Text>
                </Box>
              </Grid>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}