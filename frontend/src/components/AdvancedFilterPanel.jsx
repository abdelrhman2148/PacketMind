import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Collapse,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Switch,
  Badge,
  Divider,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback, useMemo } from 'react'
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdSettings,
  MdClose,
  MdAdd,
  MdSearch,
  MdAccessTime,
  MdVisibility,
  MdStar
} from 'react-icons/md'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)
const MotionHStack = motion(HStack)

const AdvancedFilterPanel = ({
  isOpen = false,
  onToggle,
  activeFilters = {},
  onAddFilter,
  onRemoveFilter,
  onClearAllFilters,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  quickFilters = {},
  packets = [],
  variant = 'netflix'
}) => {
  const [filterName, setFilterName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState(null)
  const [packetSizeRange, setPacketSizeRange] = useState([0, 1500])
  const [customFilter, setCustomFilter] = useState('')

  // Animation variants
  const panelVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      height: 0
    },
    visible: {
      opacity: 1,
      y: 0,
      height: 'auto',
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      height: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 1, 1]
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  // Time range options
  const timeRanges = [
    { label: 'Last 5 minutes', value: 300 },
    { label: 'Last 15 minutes', value: 900 },
    { label: 'Last 30 minutes', value: 1800 },
    { label: 'Last hour', value: 3600 },
    { label: 'Last 6 hours', value: 21600 },
    { label: 'Last 24 hours', value: 86400 }
  ]

  // Protocol colors for visual distinction
  const protocolColors = {
    TCP: '#E50914',
    UDP: '#06B6D4',
    HTTP: '#10B981',
    HTTPS: '#F59E0B',
    DNS: '#8B5CF6',
    ICMP: '#EF4444',
    SSH: '#3B82F6',
    FTP: '#F97316'
  }

  // Handle time range filter
  const handleTimeRangeChange = useCallback((range) => {
    setSelectedTimeRange(range)
    if (range) {
      onAddFilter('timeRange', range)
    } else {
      onRemoveFilter('timeRange')
    }
  }, [onAddFilter, onRemoveFilter])

  // Handle packet size filter
  const handlePacketSizeChange = useCallback((values) => {
    setPacketSizeRange(values)
    if (values[0] > 0 || values[1] < 1500) {
      onAddFilter('packetSize', { min: values[0], max: values[1] })
    } else {
      onRemoveFilter('packetSize')
    }
  }, [onAddFilter, onRemoveFilter])

  // Handle custom filter
  const handleCustomFilter = useCallback(() => {
    if (customFilter.trim()) {
      onAddFilter('custom', customFilter.trim())
      setCustomFilter('')
    }
  }, [customFilter, onAddFilter])

  // Save current filter set
  const handleSaveFilter = useCallback(() => {
    if (filterName.trim()) {
      onSaveFilter(filterName.trim())
      setFilterName('')
      setShowSaveDialog(false)
    }
  }, [filterName, onSaveFilter])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((count, filter) => {
      if (Array.isArray(filter)) {
        return count + filter.length
      } else if (filter !== null && filter !== undefined) {
        return count + 1
      }
      return count
    }, 0)
  }, [activeFilters])

  // Quick filter button component
  const QuickFilterButton = ({ type, value, count = 0 }) => {
    const isActive = activeFilters[type]?.includes(value)
    const color = protocolColors[value] || (variant === 'netflix' ? '#E50914' : '#06B6D4')

    return (
      <MotionBox
        as="button"
        px={3}
        py={2}
        borderRadius="8px"
        border="1px solid"
        borderColor={isActive ? color : 'rgba(255, 255, 255, 0.2)'}
        bg={isActive ? `${color}20` : 'rgba(255, 255, 255, 0.05)'}
        color={isActive ? color : 'rgba(255, 255, 255, 0.8)'}
        fontSize="sm"
        fontWeight="medium"
        cursor="pointer"
        transition="all 0.2s ease"
        onClick={() => {
          if (isActive) {
            onRemoveFilter(type, value)
          } else {
            onAddFilter(type, value)
          }
        }}
        whileHover={{
          scale: 1.02,
          borderColor: color,
          backgroundColor: `${color}30`
        }}
        whileTap={{ scale: 0.98 }}
        variants={itemVariants}
      >
        <HStack spacing={2}>
          <Text>{value}</Text>
          {count > 0 && (
            <Badge
              size="sm"
              bg={isActive ? color : 'rgba(255, 255, 255, 0.2)'}
              color={isActive ? 'white' : 'rgba(255, 255, 255, 0.8)'}
              borderRadius="full"
            >
              {count}
            </Badge>
          )}
        </HStack>
      </MotionBox>
    )
  }

  return (
    <Box w="100%">
      {/* Filter Toggle Button */}
      <MotionBox
        as="button"
        w="100%"
        p={4}
        bg="rgba(31, 31, 31, 0.95)"
        borderRadius="12px"
        border="1px solid rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(20px)"
        cursor="pointer"
        onClick={onToggle}
        whileHover={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: variant === 'netflix' ? '#E50914' : '#06B6D4'
        }}
        whileTap={{ scale: 0.99 }}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <MdSettings 
              color={variant === 'netflix' ? '#E50914' : '#06B6D4'} 
              size={20}
            />
            <VStack align="start" spacing={0}>
              <Text color="netflix.white" fontWeight="semibold" fontSize="md">
                Advanced Filters
              </Text>
              <Text color="netflix.silver" fontSize="sm">
                {activeFilterCount > 0 
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                  : 'Customize your search criteria'
                }
              </Text>
            </VStack>
          </HStack>
          
          <HStack spacing={2}>
            {activeFilterCount > 0 && (
              <Badge
                bg={variant === 'netflix' ? 'netflix.red' : 'wireshark.accent'}
                color="netflix.white"
                borderRadius="full"
                px={2}
                py={1}
              >
                {activeFilterCount}
              </Badge>
            )}
            <MotionBox
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <MdKeyboardArrowDown color="white" size={20} />
            </MotionBox>
          </HStack>
        </HStack>
      </MotionBox>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <MotionBox
            mt={4}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            bg="rgba(31, 31, 31, 0.98)"
            borderRadius="16px"
            border="1px solid rgba(255, 255, 255, 0.1)"
            backdropFilter="blur(20px)"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.6)"
            overflow="hidden"
          >
            <VStack spacing={6} p={6} align="stretch">
              {/* Filter Actions */}
              <MotionHStack 
                justify="space-between" 
                variants={itemVariants}
              >
                <Text color="netflix.white" fontSize="lg" fontWeight="bold">
                  Filter Options
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={onClearAllFilters}
                    isDisabled={activeFilterCount === 0}
                    leftIcon={<MdClose />}
                  >
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    colorScheme={variant === 'netflix' ? 'red' : 'blue'}
                    onClick={() => setShowSaveDialog(!showSaveDialog)}
                    leftIcon={<MdStar />}
                  >
                    Save
                  </Button>
                </HStack>
              </MotionHStack>

              {/* Save Filter Dialog */}
              <Collapse in={showSaveDialog}>
                <MotionBox
                  p={4}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderRadius="12px"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  variants={itemVariants}
                >
                  <VStack spacing={3}>
                    <Input
                      placeholder="Enter filter name..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      bg="rgba(255, 255, 255, 0.1)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      color="netflix.white"
                      _placeholder={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    />
                    <HStack spacing={2} w="100%">
                      <Button
                        size="sm"
                        colorScheme={variant === 'netflix' ? 'red' : 'blue'}
                        onClick={handleSaveFilter}
                        isDisabled={!filterName.trim()}
                        flex={1}
                      >
                        Save Filter
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowSaveDialog(false)}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                </MotionBox>
              </Collapse>

              <Divider borderColor="rgba(255, 255, 255, 0.1)" />

              {/* Accordion for organized filters */}
              <Accordion allowMultiple defaultIndex={[0, 1]}>
                {/* Quick Filters */}
                <AccordionItem border="none">
                  <AccordionButton px={0} py={2}>
                    <Box flex="1" textAlign="left">
                      <Text color="netflix.white" fontWeight="semibold">
                        Quick Filters
                      </Text>
                    </Box>
                    <AccordionIcon color="netflix.silver" />
                  </AccordionButton>
                  <AccordionPanel px={0}>
                    <MotionVStack spacing={4} variants={itemVariants}>
                      {/* Protocol Filters */}
                      {quickFilters.protocols?.length > 0 && (
                        <VStack align="stretch" spacing={3}>
                          <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                            Protocols
                          </Text>
                          <Box>
                            <HStack spacing={2} flexWrap="wrap">
                              {quickFilters.protocols.map(protocol => (
                                <QuickFilterButton
                                  key={protocol}
                                  type="protocol"
                                  value={protocol}
                                  count={packets.filter(p => p.proto === protocol).length}
                                />
                              ))}
                            </HStack>
                          </Box>
                        </VStack>
                      )}

                      {/* Source IP Filters */}
                      {quickFilters.sources?.length > 0 && (
                        <VStack align="stretch" spacing={3}>
                          <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                            Source IPs
                          </Text>
                          <Box>
                            <HStack spacing={2} flexWrap="wrap">
                              {quickFilters.sources.slice(0, 8).map(source => (
                                <QuickFilterButton
                                  key={source}
                                  type="source"
                                  value={source}
                                  count={packets.filter(p => p.src === source).length}
                                />
                              ))}
                            </HStack>
                          </Box>
                        </VStack>
                      )}

                      {/* Port Filters */}
                      {quickFilters.ports?.length > 0 && (
                        <VStack align="stretch" spacing={3}>
                          <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                            Common Ports
                          </Text>
                          <Box>
                            <HStack spacing={2} flexWrap="wrap">
                              {quickFilters.ports.slice(0, 10).map(port => (
                                <QuickFilterButton
                                  key={port}
                                  type="port"
                                  value={port}
                                  count={packets.filter(p => 
                                    p.sport === port || p.dport === port
                                  ).length}
                                />
                              ))}
                            </HStack>
                          </Box>
                        </VStack>
                      )}
                    </MotionVStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* Advanced Filters */}
                <AccordionItem border="none">
                  <AccordionButton px={0} py={2}>
                    <Box flex="1" textAlign="left">
                      <Text color="netflix.white" fontWeight="semibold">
                        Advanced Options
                      </Text>
                    </Box>
                    <AccordionIcon color="netflix.silver" />
                  </AccordionButton>
                  <AccordionPanel px={0}>
                    <MotionVStack spacing={6} variants={itemVariants}>
                      {/* Time Range Filter */}
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                            Time Range
                          </Text>
                          {selectedTimeRange && (
                            <IconButton
                              size="xs"
                              variant="ghost"
                              icon={<MdClose />}
                              onClick={() => handleTimeRangeChange(null)}
                            />
                          )}
                        </HStack>
                        <HStack spacing={2} flexWrap="wrap">
                          {timeRanges.map(range => (
                            <Button
                              key={range.value}
                              size="sm"
                              variant={selectedTimeRange === range.value ? 'solid' : 'outline'}
                              colorScheme={variant === 'netflix' ? 'red' : 'blue'}
                              onClick={() => handleTimeRangeChange(range.value)}
                            >
                              {range.label}
                            </Button>
                          ))}
                        </HStack>
                      </VStack>

                      {/* Packet Size Filter */}
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                            Packet Size Range (bytes)
                          </Text>
                          <Text color="netflix.white" fontSize="sm">
                            {packetSizeRange[0]} - {packetSizeRange[1]}
                          </Text>
                        </HStack>
                        <Box px={3}>
                          <Slider
                            min={0}
                            max={1500}
                            step={10}
                            value={packetSizeRange}
                            onChange={handlePacketSizeChange}
                            colorScheme={variant === 'netflix' ? 'red' : 'blue'}
                          >
                            <SliderTrack bg="rgba(255, 255, 255, 0.2)">
                              <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb index={0} />
                            <SliderThumb index={1} />
                          </Slider>
                        </Box>
                      </VStack>

                      {/* Custom Filter */}
                      <VStack align="stretch" spacing={3}>
                        <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
                          Custom Filter Expression
                        </Text>
                        <InputGroup>
                          <InputLeftElement>
                            <MdSearch color="rgba(255, 255, 255, 0.5)" />
                          </InputLeftElement>
                          <Input
                            placeholder="e.g., tcp.port == 80"
                            value={customFilter}
                            onChange={(e) => setCustomFilter(e.target.value)}
                            bg="rgba(255, 255, 255, 0.1)"
                            border="1px solid rgba(255, 255, 255, 0.2)"
                            color="netflix.white"
                            _placeholder={{ color: 'rgba(255, 255, 255, 0.5)' }}
                            onKeyPress={(e) => e.key === 'Enter' && handleCustomFilter()}
                          />
                        </InputGroup>
                        <Button
                          size="sm"
                          colorScheme={variant === 'netflix' ? 'red' : 'blue'}
                          onClick={handleCustomFilter}
                          isDisabled={!customFilter.trim()}
                          leftIcon={<MdAdd />}
                        >
                          Add Custom Filter
                        </Button>
                      </VStack>
                    </MotionVStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* Saved Filters */}
                {savedFilters.length > 0 && (
                  <AccordionItem border="none">
                    <AccordionButton px={0} py={2}>
                      <Box flex="1" textAlign="left">
                        <Text color="netflix.white" fontWeight="semibold">
                          Saved Filters ({savedFilters.length})
                        </Text>
                      </Box>
                      <AccordionIcon color="netflix.silver" />
                    </AccordionButton>
                    <AccordionPanel px={0}>
                      <MotionVStack spacing={3} variants={itemVariants}>
                        {savedFilters.map(filter => (
                          <MotionBox
                            key={filter.id}
                            p={3}
                            bg="rgba(255, 255, 255, 0.05)"
                            borderRadius="8px"
                            border="1px solid rgba(255, 255, 255, 0.1)"
                            w="100%"
                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text color="netflix.white" fontWeight="medium" fontSize="sm">
                                  {filter.name}
                                </Text>
                                <Text color="netflix.silver" fontSize="xs">
                                  {new Date(filter.timestamp).toLocaleDateString()}
                                </Text>
                              </VStack>
                              <HStack spacing={1}>
                                <IconButton
                                  size="sm"
                                  variant="ghost"
                                  icon={<MdVisibility />}
                                  onClick={() => onLoadFilter(filter)}
                                  colorScheme={variant === 'netflix' ? 'red' : 'blue'}
                                />
                                <IconButton
                                  size="sm"
                                  variant="ghost"
                                  icon={<MdClose />}
                                  onClick={() => onDeleteFilter(filter.id)}
                                  colorScheme="red"
                                />
                              </HStack>
                            </HStack>
                          </MotionBox>
                        ))}
                      </MotionVStack>
                    </AccordionPanel>
                  </AccordionItem>
                )}
              </Accordion>
            </VStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default AdvancedFilterPanel