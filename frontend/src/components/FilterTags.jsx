import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Tooltip,
  Button,
  useDisclosure,
  Collapse
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloseIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { useMemo } from 'react'

const MotionBox = motion(Box)
const MotionWrapItem = motion(WrapItem)

const FilterTags = ({
  activeFilters = {},
  onRemoveFilter,
  onClearAllFilters,
  searchQuery = '',
  onClearSearch,
  variant = 'netflix',
  showCount = true,
  maxVisible = 10,
  ...props
}) => {
  const { isOpen: showAllTags, onToggle: toggleShowAll } = useDisclosure()

  // Protocol colors for visual distinction
  const protocolColors = {
    TCP: '#E50914',
    UDP: '#06B6D4', 
    HTTP: '#10B981',
    HTTPS: '#F59E0B',
    DNS: '#8B5CF6',
    ICMP: '#EF4444',
    SSH: '#3B82F6',
    FTP: '#F97316',
    SMTP: '#84CC16',
    default: variant === 'netflix' ? '#E50914' : '#06B6D4'
  }

  // Convert filters to tag objects
  const filterTags = useMemo(() => {
    const tags = []

    // Add search query as a tag
    if (searchQuery.trim()) {
      tags.push({
        id: 'search-query',
        type: 'search',
        label: `Search: "${searchQuery}"`,
        value: searchQuery,
        color: variant === 'netflix' ? '#E50914' : '#06B6D4',
        icon: '🔍'
      })
    }

    // Process each filter type
    Object.entries(activeFilters).forEach(([filterType, filterValue]) => {
      if (!filterValue) return

      if (Array.isArray(filterValue)) {
        // Handle array filters (protocols, sources, etc.)
        filterValue.forEach(value => {
          const color = filterType === 'protocol' 
            ? (protocolColors[value] || protocolColors.default)
            : protocolColors.default

          tags.push({
            id: `${filterType}-${value}`,
            type: filterType,
            label: value,
            value: value,
            color: color,
            icon: getFilterIcon(filterType)
          })
        })
      } else if (typeof filterValue === 'object') {
        // Handle object filters (packetSize, timeRange)
        if (filterType === 'packetSize') {
          tags.push({
            id: 'packet-size',
            type: 'packetSize',
            label: `Size: ${filterValue.min}-${filterValue.max} bytes`,
            value: filterValue,
            color: protocolColors.default,
            icon: '📏'
          })
        }
      } else {
        // Handle simple value filters
        if (filterType === 'timeRange') {
          const timeLabel = getTimeRangeLabel(filterValue)
          tags.push({
            id: 'time-range',
            type: 'timeRange', 
            label: `Time: ${timeLabel}`,
            value: filterValue,
            color: protocolColors.default,
            icon: '⏰'
          })
        } else {
          tags.push({
            id: `${filterType}-${filterValue}`,
            type: filterType,
            label: `${filterType}: ${filterValue}`,
            value: filterValue,
            color: protocolColors.default,
            icon: getFilterIcon(filterType)
          })
        }
      }
    })

    return tags
  }, [activeFilters, searchQuery, variant])

  // Get filter type icon
  function getFilterIcon(filterType) {
    const icons = {
      protocol: '🌐',
      source: '📤',
      destination: '📥', 
      port: '🔌',
      custom: '⚙️',
      search: '🔍'
    }
    return icons[filterType] || '🏷️'
  }

  // Get time range label
  function getTimeRangeLabel(seconds) {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  // Remove individual filter
  const handleRemoveTag = (tag) => {
    if (tag.type === 'search') {
      onClearSearch()
    } else if (tag.type === 'packetSize' || tag.type === 'timeRange') {
      onRemoveFilter(tag.type)
    } else {
      onRemoveFilter(tag.type, tag.value)
    }
  }

  // Split tags into visible and hidden
  const visibleTags = filterTags.slice(0, showAllTags ? filterTags.length : maxVisible)
  const hiddenTagsCount = filterTags.length - maxVisible

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  }

  const tagVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 10 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  }

  // Don't render if no filters
  if (filterTags.length === 0) {
    return null
  }

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      <VStack spacing={4} align="stretch">
        {/* Filter Tags Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Text color="netflix.white" fontSize="sm" fontWeight="semibold">
              Active Filters
            </Text>
            {showCount && (
              <Badge
                bg={variant === 'netflix' ? 'netflix.red' : 'wireshark.accent'}
                color="netflix.white"
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
              >
                {filterTags.length}
              </Badge>
            )}
          </HStack>

          <Button
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onClearAllFilters}
            leftIcon={<CloseIcon boxSize={3} />}
            fontSize="xs"
          >
            Clear All
          </Button>
        </HStack>

        {/* Filter Tags */}
        <Box>
          <Wrap spacing={2}>
            <AnimatePresence>
              {visibleTags.map((tag) => (
                <MotionWrapItem
                  key={tag.id}
                  variants={tagVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <Tooltip
                    label={`Remove ${tag.label}`}
                    placement="top"
                    hasArrow
                  >
                    <Tag
                      size="md"
                      borderRadius="full"
                      bg={`${tag.color}20`}
                      border="1px solid"
                      borderColor={`${tag.color}60`}
                      color={tag.color}
                      cursor="pointer"
                      transition="all 0.2s ease"
                      _hover={{
                        bg: `${tag.color}30`,
                        borderColor: tag.color,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${tag.color}40`
                      }}
                      _active={{
                        transform: 'translateY(0)',
                        boxShadow: `0 2px 8px ${tag.color}40`
                      }}
                    >
                      <HStack spacing={1}>
                        <Text fontSize="xs">{tag.icon}</Text>
                        <TagLabel fontSize="sm" fontWeight="medium">
                          {tag.label}
                        </TagLabel>
                      </HStack>
                      <TagCloseButton
                        onClick={() => handleRemoveTag(tag)}
                        ml={1}
                        color={tag.color}
                        _hover={{
                          bg: `${tag.color}40`
                        }}
                      />
                    </Tag>
                  </Tooltip>
                </MotionWrapItem>
              ))}
            </AnimatePresence>

            {/* Show More/Less Button */}
            {hiddenTagsCount > 0 && (
              <WrapItem>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="rgba(255, 255, 255, 0.3)"
                  color="netflix.silver"
                  _hover={{
                    borderColor: variant === 'netflix' ? '#E50914' : '#06B6D4',
                    color: variant === 'netflix' ? '#E50914' : '#06B6D4'
                  }}
                  onClick={toggleShowAll}
                  rightIcon={showAllTags ? <ChevronUpIcon /> : <ChevronDownIcon />}
                >
                  {showAllTags ? 'Show Less' : `+${hiddenTagsCount} More`}
                </Button>
              </WrapItem>
            )}
          </Wrap>
        </Box>

        {/* Filter Summary */}
        <Collapse in={filterTags.length > 3}>
          <Box
            p={3}
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="8px"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <Text color="netflix.silver" fontSize="xs">
              💡 <Text as="span" fontWeight="medium">Tip:</Text> Click any tag to remove it, or use "Clear All" to reset filters
            </Text>
          </Box>
        </Collapse>
      </VStack>
    </MotionBox>
  )
}

// Individual Filter Tag Component for more granular control
export const FilterTag = ({
  label,
  value,
  type,
  color,
  icon,
  onRemove,
  variant = 'netflix',
  size = 'md',
  ...props
}) => {
  const tagColor = color || (variant === 'netflix' ? '#E50914' : '#06B6D4')

  return (
    <MotionBox
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <Tag
        size={size}
        borderRadius="full"
        bg={`${tagColor}20`}
        border="1px solid"
        borderColor={`${tagColor}60`}
        color={tagColor}
        cursor="pointer"
        transition="all 0.2s ease"
        _hover={{
          bg: `${tagColor}30`,
          borderColor: tagColor,
          boxShadow: `0 4px 12px ${tagColor}40`
        }}
      >
        <HStack spacing={1}>
          {icon && <Text fontSize="xs">{icon}</Text>}
          <TagLabel fontSize="sm" fontWeight="medium">
            {label}
          </TagLabel>
        </HStack>
        {onRemove && (
          <TagCloseButton
            onClick={() => onRemove(type, value)}
            ml={1}
            color={tagColor}
            _hover={{
              bg: `${tagColor}40`
            }}
          />
        )}
      </Tag>
    </MotionBox>
  )
}

// Quick Filter Tags for suggestions
export const QuickFilterTags = ({
  suggestions = [],
  onAddFilter,
  variant = 'netflix',
  maxItems = 6,
  ...props
}) => {
  if (suggestions.length === 0) return null

  return (
    <Box {...props}>
      <VStack spacing={3} align="stretch">
        <Text color="netflix.silver" fontSize="sm" fontWeight="medium">
          Quick Filters
        </Text>
        <Wrap spacing={2}>
          {suggestions.slice(0, maxItems).map((suggestion, index) => (
            <WrapItem key={index}>
              <MotionBox
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tag
                  size="sm"
                  borderRadius="full"
                  bg="rgba(255, 255, 255, 0.1)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  color="netflix.silver"
                  cursor="pointer"
                  transition="all 0.2s ease"
                  onClick={() => onAddFilter(suggestion)}
                  _hover={{
                    bg: variant === 'netflix' ? 'rgba(229, 9, 20, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                    borderColor: variant === 'netflix' ? '#E50914' : '#06B6D4',
                    color: variant === 'netflix' ? '#E50914' : '#06B6D4'
                  }}
                >
                  <TagLabel fontSize="xs">+ {suggestion.label}</TagLabel>
                </Tag>
              </MotionBox>
            </WrapItem>
          ))}
        </Wrap>
      </VStack>
    </Box>
  )
}

export default FilterTags