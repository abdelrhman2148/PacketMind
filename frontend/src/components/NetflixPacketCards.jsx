import { Box, Heading, HStack, VStack, Text, Button, Spinner } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import ProtocolCard from './ProtocolCard'
import usePacketCategories from '../hooks/usePacketCategories'

const MotionBox = motion(Box)

const NetflixPacketCards = ({ 
  packets = [], 
  isCapturing = false, 
  searchQuery = '',
  activeFilters = {}
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const scrollContainerRef = useRef(null)
  
  const {
    categories,
    filteredCategories,
    totalPackets,
    isLoading,
    filterByCategory,
    getTopCategories,
    getCategoryTrend
  } = usePacketCategories(packets)

  // Auto-scroll functionality for Netflix-style horizontal scrolling
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320, // Card width + gap
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320, // Card width + gap
        behavior: 'smooth'
      })
    }
  }

  // Get top categories for featured section
  const topCategories = getTopCategories(6)
  const recentCategories = filteredCategories.slice(0, 8)

  // Handle category selection
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName === selectedCategory ? 'all' : categoryName)
    filterByCategory(categoryName === selectedCategory ? null : categoryName)
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <HStack spacing={6} overflowX="hidden" py={4}>
      {[...Array(4)].map((_, index) => (
        <Box
          key={index}
          w="280px"
          h="380px"
          bg="rgba(31, 31, 31, 0.5)"
          borderRadius="16px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          position="relative"
          overflow="hidden"
        >
          <Box
            h="200px"
            bg="rgba(255, 255, 255, 0.05)"
            position="relative"
          >
            <Box
              position="absolute"
              top="0"
              left="-100%"
              w="100%"
              h="100%"
              bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)"
              animation="shimmer 2s ease-in-out infinite"
            />
          </Box>
          <VStack p={6} align="stretch" spacing={4}>
            <Box h="24px" bg="rgba(255, 255, 255, 0.1)" borderRadius="4px" />
            <Box h="48px" bg="rgba(255, 255, 255, 0.05)" borderRadius="4px" />
            <Box h="4px" bg="rgba(255, 255, 255, 0.05)" borderRadius="2px" />
          </VStack>
        </Box>
      ))}
    </HStack>
  )

  // Featured categories section
  const FeaturedSection = ({ title, categories, showScrollButtons = true }) => (
    <VStack align="stretch" spacing={4} mb={8}>
      <HStack justify="space-between" align="center">
        <Heading
          size="lg"
          color="netflix.white"
          fontWeight="bold"
          letterSpacing="-0.025em"
        >
          {title}
        </Heading>
        
        {showScrollButtons && categories.length > 3 && (
          <HStack spacing={2}>
            <Button
              variant="netflixSecondary"
              size="sm"
              onClick={scrollLeft}
              borderRadius="full"
              w="40px"
              h="40px"
              minW="40px"
              p={0}
            >
              ←
            </Button>
            <Button
              variant="netflixSecondary"
              size="sm"
              onClick={scrollRight}
              borderRadius="full"
              w="40px"
              h="40px"
              minW="40px"
              p={0}
            >
              →
            </Button>
          </HStack>
        )}
      </HStack>

      <Box
        ref={showScrollButtons ? scrollContainerRef : null}
        overflowX="auto"
        overflowY="hidden"
        pb={4}
        css={{
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(10, 10, 10, 0.3)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        <HStack spacing={6} align="stretch" minW="max-content">
          {categories.map((category) => (
            <ProtocolCard
              key={category.name}
              protocol={category.name}
              count={category.count}
              percentage={((category.count / totalPackets) * 100).toFixed(1)}
              color={category.color}
              icon={category.icon}
              isActive={selectedCategory === category.name}
              onClick={() => handleCategorySelect(category.name)}
              trend={getCategoryTrend(category.name)}
            />
          ))}
        </HStack>
      </Box>
    </VStack>
  )

  return (
    <Box>
      {/* Header section */}
      <VStack align="stretch" spacing={6} mb={8}>
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading
              size="xl"
              color="netflix.white"
              fontWeight="bold"
              letterSpacing="-0.025em"
            >
              Network Traffic Categories
            </Heading>
            <Text color="netflix.silver" fontSize="lg">
              Real-time packet analysis by protocol type
              {searchQuery && (
                <Text as="span" color="wireshark.accent" ml={2}>
                  • Searching: "{searchQuery}"
                </Text>
              )}
              {Object.values(activeFilters).some(f => Array.isArray(f) ? f.length > 0 : f) && (
                <Text as="span" color="wireshark.accent" ml={2}>
                  • {Object.values(activeFilters).reduce((count, filter) => {
                    if (Array.isArray(filter)) return count + filter.length
                    return filter ? count + 1 : count
                  }, 0)} active filters
                </Text>
              )}
            </Text>
          </VStack>

          <HStack spacing={4}>
            {/* Capture status indicator */}
            <HStack spacing={2}>
              {isCapturing ? (
                <>
                  <Spinner size="sm" color="wireshark.success" />
                  <Text color="wireshark.success" fontSize="sm" fontWeight="medium">
                    Live Capture
                  </Text>
                </>
              ) : (
                <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                  Capture Stopped
                </Text>
              )}
            </HStack>

            {/* View mode toggle */}
            <HStack spacing={1} bg="rgba(255, 255, 255, 0.05)" borderRadius="8px" p={1}>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'netflix' : 'ghost'}
                onClick={() => setViewMode('grid')}
                borderRadius="6px"
              >
                Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'netflix' : 'ghost'}
                onClick={() => setViewMode('list')}
                borderRadius="6px"
              >
                List
              </Button>
            </HStack>
          </HStack>
        </HStack>

        {/* Stats summary */}
        <HStack
          spacing={8}
          p={6}
          bg="rgba(31, 31, 31, 0.95)"
          borderRadius="16px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          backdropFilter="blur(20px)"
        >
          <VStack align="start" spacing={1}>
            <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
              Total Packets
            </Text>
            <Text color="netflix.white" fontSize="2xl" fontWeight="bold">
              {totalPackets.toLocaleString()}
            </Text>
          </VStack>
          
          <VStack align="start" spacing={1}>
            <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
              Categories Active
            </Text>
            <Text color="wireshark.accent" fontSize="2xl" fontWeight="bold">
              {Object.keys(categories).length}
            </Text>
          </VStack>
          
          <VStack align="start" spacing={1}>
            <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
              Selected Filter
            </Text>
            <Text color="netflix.red" fontSize="lg" fontWeight="semibold">
              {selectedCategory === 'all' ? 'All Traffic' : selectedCategory}
            </Text>
          </VStack>
        </HStack>
      </VStack>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <MotionBox
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSkeleton />
          </MotionBox>
        ) : totalPackets === 0 ? (
          <MotionBox
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <VStack
              spacing={6}
              py={16}
              bg="rgba(31, 31, 31, 0.95)"
              borderRadius="16px"
              border="1px solid rgba(255, 255, 255, 0.1)"
            >
              <Text fontSize="6xl" opacity={0.3}>📊</Text>
              <VStack spacing={2}>
                <Text color="netflix.white" fontSize="xl" fontWeight="bold">
                  No Network Traffic Detected
                </Text>
                <Text color="netflix.silver" fontSize="md" textAlign="center" maxW="400px">
                  {isCapturing 
                    ? "Monitoring network activity... Traffic analysis will appear here."
                    : "Start packet capture to begin analyzing network traffic."
                  }
                </Text>
              </VStack>
            </VStack>
          </MotionBox>
        ) : (
          <MotionBox
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Top Categories */}
            <FeaturedSection
              title="🔥 Top Traffic Categories"
              categories={topCategories}
              showScrollButtons={true}
            />

            {/* Recent Activity */}
            <FeaturedSection
              title="📈 Recent Activity"
              categories={recentCategories}
              showScrollButtons={true}
            />

            {/* All Categories Grid/List View */}
            <VStack align="stretch" spacing={4}>
              <Heading
                size="lg"
                color="netflix.white"
                fontWeight="bold"
                letterSpacing="-0.025em"
              >
                All Categories
              </Heading>

              {viewMode === 'grid' ? (
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
                  gap={6}
                  py={4}
                >
                  {filteredCategories.map((category, index) => (
                    <MotionBox
                      key={category.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                      <ProtocolCard
                        protocol={category.name}
                        count={category.count}
                        percentage={((category.count / totalPackets) * 100).toFixed(1)}
                        color={category.color}
                        icon={category.icon}
                        isActive={selectedCategory === category.name}
                        onClick={() => handleCategorySelect(category.name)}
                        trend={getCategoryTrend(category.name)}
                      />
                    </MotionBox>
                  ))}
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {filteredCategories.map((category, index) => (
                    <MotionBox
                      key={category.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      p={4}
                      bg="rgba(31, 31, 31, 0.95)"
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={selectedCategory === category.name ? category.color : 'rgba(255, 255, 255, 0.1)'}
                      cursor="pointer"
                      onClick={() => handleCategorySelect(category.name)}
                      _hover={{
                        bg: 'rgba(255, 255, 255, 0.05)',
                        borderColor: category.color,
                        transform: 'translateX(4px)'
                      }}
                    >
                      <HStack justify="space-between">
                        <HStack spacing={4}>
                          <Box
                            w="12px"
                            h="12px"
                            bg={category.color}
                            borderRadius="full"
                            boxShadow={`0 0 10px ${category.color}60`}
                          />
                          <Text color="netflix.white" fontWeight="semibold">
                            {category.name}
                          </Text>
                        </HStack>
                        <HStack spacing={4}>
                          <Text color="netflix.silver" fontSize="sm">
                            {((category.count / totalPackets) * 100).toFixed(1)}%
                          </Text>
                          <Text color={category.color} fontWeight="bold">
                            {category.count.toLocaleString()}
                          </Text>
                        </HStack>
                      </HStack>
                    </MotionBox>
                  ))}
                </VStack>
              )}
            </VStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default NetflixPacketCards