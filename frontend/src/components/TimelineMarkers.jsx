import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Input,
  Textarea,
  Select,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { scaleAnimations, slideAnimations, buttonAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionText = motion(Text)

// Individual timestamp marker component
export const TimestampMarker = ({
  timestamp,
  type = 'major', // major, minor, bookmark, anomaly
  label = '',
  position = 0, // percentage position on timeline
  onClick = () => {},
  onEdit = () => {},
  onDelete = () => {},
  isEditable = false,
  showLabel = true,
  color = '#9CA3AF',
  size = 'md'
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const markerStyles = {
    major: {
      height: '100%',
      width: '2px',
      color: '#E5E7EB',
      labelBg: 'rgba(31, 31, 31, 0.9)',
      zIndex: 3
    },
    minor: {
      height: '60%',
      width: '1px',
      color: '#6B7280',
      labelBg: 'rgba(31, 31, 31, 0.8)',
      zIndex: 2
    },
    bookmark: {
      height: '12px',
      width: '12px',
      color: '#F59E0B',
      labelBg: 'rgba(245, 158, 11, 0.9)',
      zIndex: 5,
      shape: 'bookmark'
    },
    anomaly: {
      height: '16px',
      width: '16px',
      color: '#EF4444',
      labelBg: 'rgba(239, 68, 68, 0.9)',
      zIndex: 4,
      shape: 'warning'
    }
  }

  const style = markerStyles[type] || markerStyles.minor

  const formatTimestamp = (ts) => {
    const date = new Date(ts * 1000)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  return (
    <Box
      position="absolute"
      left={`${position}%`}
      top="0"
      bottom="0"
      transform="translateX(-50%)"
      cursor="pointer"
      zIndex={style.zIndex}
      onClick={() => onClick(timestamp)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Marker line or shape */}
      {type === 'bookmark' ? (
        <MotionBox
          position="absolute"
          top="8px"
          left="50%"
          transform="translateX(-50%)"
          w="12px"
          h="12px"
          bg={style.color}
          clipPath="polygon(50% 0%, 0% 100%, 100% 100%)"
          variants={scaleAnimations}
          initial="initial"
          animate={isHovered ? "hover" : "animate"}
          boxShadow={`0 0 8px ${style.color}40`}
        />
      ) : type === 'anomaly' ? (
        <MotionBox
          position="absolute"
          top="4px"
          left="50%"
          transform="translateX(-50%)"
          w="16px"
          h="16px"
          bg={style.color}
          borderRadius="50%"
          variants={scaleAnimations}
          initial="initial"
          animate={isHovered ? "hover" : "animate"}
          boxShadow={`0 0 12px ${style.color}60`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="white" fontSize="xs" fontWeight="bold">!</Text>
        </MotionBox>
      ) : (
        <Box
          w={style.width}
          h={style.height}
          bg={style.color}
          opacity={isHovered ? 1 : 0.7}
          transition="opacity 0.2s ease"
        />
      )}

      {/* Label tooltip */}
      {(showLabel || isHovered) && (
        <AnimatePresence>
          <MotionBox
            position="absolute"
            bottom="calc(100% + 8px)"
            left="50%"
            transform="translateX(-50%)"
            variants={slideAnimations.slideInDown}
            initial="initial"
            animate="animate"
            exit="initial"
          >
            <Box
              bg={style.labelBg}
              color="white"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="4px"
              border="1px solid rgba(255, 255, 255, 0.2)"
              whiteSpace="nowrap"
              backdropFilter="blur(10px)"
            >
              <VStack spacing={1} align="center">
                <Text fontWeight="bold">
                  {formatTimestamp(timestamp)}
                </Text>
                {label && (
                  <Text color="rgba(255, 255, 255, 0.8)">
                    {label}
                  </Text>
                )}
              </VStack>
            </Box>
          </MotionBox>
        </AnimatePresence>
      )}

      {/* Edit/delete menu for bookmarks */}
      {isEditable && (type === 'bookmark' || type === 'anomaly') && isHovered && (
        <Menu>
          <MenuButton
            as={IconButton}
            size="xs"
            variant="ghost"
            color="white"
            icon={<Text fontSize="xs">⋮</Text>}
            position="absolute"
            top="20px"
            left="50%"
            transform="translateX(-50%)"
            bg="rgba(0, 0, 0, 0.8)"
            _hover={{ bg: 'rgba(0, 0, 0, 0.9)' }}
          />
          <MenuList bg="netflix.black" borderColor="rgba(255, 255, 255, 0.1)">
            <MenuItem
              color="netflix.white"
              onClick={() => onEdit({ timestamp, label, type })}
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            >
              Edit
            </MenuItem>
            <MenuItem
              color="red.400"
              onClick={() => onDelete({ timestamp, label, type })}
              _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </Box>
  )
}

// Bookmark management component
export const BookmarkManager = ({
  bookmarks = [],
  onBookmarkAdd = () => {},
  onBookmarkEdit = () => {},
  onBookmarkDelete = () => {},
  onBookmarkJump = () => {},
  currentTime = 0,
  formatTime = (t) => t.toFixed(2) + 's'
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [newBookmark, setNewBookmark] = useState({
    label: '',
    description: '',
    type: 'user',
    color: '#F59E0B'
  })

  const bookmarkTypes = [
    { value: 'user', label: 'User Bookmark', color: '#F59E0B' },
    { value: 'event', label: 'Event Marker', color: '#8B5CF6' },
    { value: 'anomaly', label: 'Anomaly', color: '#EF4444' },
    { value: 'analysis', label: 'Analysis Point', color: '#06B6D4' },
    { value: 'note', label: 'Note', color: '#10B981' }
  ]

  const handleSaveBookmark = () => {
    const bookmark = {
      timestamp: editingBookmark?.timestamp || currentTime,
      label: newBookmark.label || `Bookmark ${Date.now()}`,
      description: newBookmark.description,
      type: newBookmark.type,
      color: newBookmark.color,
      created: Date.now()
    }

    if (editingBookmark) {
      onBookmarkEdit(bookmark)
    } else {
      onBookmarkAdd(bookmark)
    }

    setNewBookmark({ label: '', description: '', type: 'user', color: '#F59E0B' })
    setEditingBookmark(null)
    onClose()
  }

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark)
    setNewBookmark({
      label: bookmark.label || '',
      description: bookmark.description || '',
      type: bookmark.type || 'user',
      color: bookmark.color || '#F59E0B'
    })
    onOpen()
  }

  return (
    <>
      <VStack spacing={3} align="stretch">
        {/* Add bookmark button */}
        <Button
          size="sm"
          variant="netflixPrimary"
          onClick={onOpen}
          leftIcon={<Text>🔖</Text>}
        >
          Add Bookmark
        </Button>

        {/* Bookmarks list */}
        {bookmarks.length > 0 ? (
          <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
            {bookmarks
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((bookmark, index) => (
                <Box
                  key={index}
                  p={3}
                  bg="rgba(31, 31, 31, 0.8)"
                  borderRadius="8px"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack spacing={2}>
                        <Box
                          w="8px"
                          h="8px"
                          bg={bookmark.color}
                          borderRadius="50%"
                        />
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color="netflix.white"
                          noOfLines={1}
                        >
                          {bookmark.label}
                        </Text>
                        <Badge
                          size="sm"
                          colorScheme="gray"
                          variant="subtle"
                        >
                          {bookmarkTypes.find(t => t.value === bookmark.type)?.label || 'Unknown'}
                        </Badge>
                      </HStack>
                      
                      <Text fontSize="xs" color="wireshark.accent">
                        {formatTime(bookmark.timestamp)}
                      </Text>
                      
                      {bookmark.description && (
                        <Text
                          fontSize="xs"
                          color="netflix.silver"
                          noOfLines={2}
                        >
                          {bookmark.description}
                        </Text>
                      )}
                    </VStack>

                    <HStack spacing={1}>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        color="netflix.silver"
                        icon={<Text fontSize="xs">📍</Text>}
                        onClick={() => onBookmarkJump(bookmark.timestamp)}
                        _hover={{ color: 'netflix.white' }}
                        title="Jump to bookmark"
                      />
                      <IconButton
                        size="xs"
                        variant="ghost"
                        color="netflix.silver"
                        icon={<Text fontSize="xs">✏️</Text>}
                        onClick={() => handleEditBookmark(bookmark)}
                        _hover={{ color: 'netflix.white' }}
                        title="Edit bookmark"
                      />
                      <IconButton
                        size="xs"
                        variant="ghost"
                        color="red.400"
                        icon={<Text fontSize="xs">🗑️</Text>}
                        onClick={() => onBookmarkDelete(bookmark)}
                        _hover={{ color: 'red.300' }}
                        title="Delete bookmark"
                      />
                    </HStack>
                  </HStack>
                </Box>
              ))}
          </VStack>
        ) : (
          <Text fontSize="sm" color="netflix.silver" textAlign="center" py={4}>
            No bookmarks yet. Add one by clicking the button above.
          </Text>
        )}
      </VStack>

      {/* Bookmark editor modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg="netflix.black" border="1px solid rgba(255, 255, 255, 0.1)">
          <ModalHeader color="netflix.white">
            {editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
          </ModalHeader>
          <ModalCloseButton color="netflix.white" />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" color="netflix.silver" mb={2}>
                  Timestamp
                </Text>
                <Text fontSize="md" color="wireshark.accent" fontWeight="bold">
                  {formatTime(editingBookmark?.timestamp || currentTime)}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="netflix.silver" mb={2}>
                  Label *
                </Text>
                <Input
                  value={newBookmark.label}
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Bookmark label"
                  bg="rgba(255, 255, 255, 0.1)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  color="netflix.white"
                  _placeholder={{ color: 'netflix.silver' }}
                  _focus={{ borderColor: 'wireshark.accent' }}
                />
              </Box>

              <Box>
                <Text fontSize="sm" color="netflix.silver" mb={2}>
                  Description
                </Text>
                <Textarea
                  value={newBookmark.description}
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  bg="rgba(255, 255, 255, 0.1)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  color="netflix.white"
                  _placeholder={{ color: 'netflix.silver' }}
                  _focus={{ borderColor: 'wireshark.accent' }}
                  rows={3}
                />
              </Box>

              <Box>
                <Text fontSize="sm" color="netflix.silver" mb={2}>
                  Type
                </Text>
                <Select
                  value={newBookmark.type}
                  onChange={(e) => {
                    const selectedType = bookmarkTypes.find(t => t.value === e.target.value)
                    setNewBookmark(prev => ({
                      ...prev,
                      type: e.target.value,
                      color: selectedType?.color || prev.color
                    }))
                  }}
                  bg="rgba(255, 255, 255, 0.1)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  color="netflix.white"
                  _focus={{ borderColor: 'wireshark.accent' }}
                >
                  {bookmarkTypes.map(type => (
                    <option key={type.value} value={type.value} style={{ backgroundColor: '#1a1a1a' }}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </Box>

              <HStack spacing={3}>
                <Text fontSize="sm" color="netflix.silver">
                  Color
                </Text>
                <HStack spacing={2}>
                  {bookmarkTypes.map(type => (
                    <Box
                      key={type.value}
                      w="24px"
                      h="24px"
                      bg={type.color}
                      borderRadius="50%"
                      cursor="pointer"
                      border={newBookmark.color === type.color ? '2px solid white' : '2px solid transparent'}
                      onClick={() => setNewBookmark(prev => ({ ...prev, color: type.color }))}
                      _hover={{ transform: 'scale(1.1)' }}
                      transition="all 0.2s ease"
                    />
                  ))}
                </HStack>
              </HStack>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} color="netflix.silver">
              Cancel
            </Button>
            <Button
              variant="netflixPrimary"
              onClick={handleSaveBookmark}
              isDisabled={!newBookmark.label.trim()}
            >
              {editingBookmark ? 'Update' : 'Add'} Bookmark
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

// Anomaly indicators component
export const AnomalyIndicators = ({
  anomalies = [],
  onAnomalyClick = () => {},
  onAnomalyDetails = () => {},
  showSeverity = true,
  showCategories = true,
  formatTime = (t) => t.toFixed(2) + 's'
}) => {
  const severityLevels = {
    critical: { color: '#DC2626', icon: '🔴', label: 'Critical' },
    high: { color: '#EF4444', icon: '🟠', label: 'High' },
    medium: { color: '#F59E0B', icon: '🟡', label: 'Medium' },
    low: { color: '#10B981', icon: '🟢', label: 'Low' },
    info: { color: '#06B6D4', icon: '🔵', label: 'Info' }
  }

  const categoryCounts = useMemo(() => {
    const counts = {}
    anomalies.forEach(anomaly => {
      const category = anomaly.category || 'unknown'
      counts[category] = (counts[category] || 0) + 1
    })
    return counts
  }, [anomalies])

  const severityCounts = useMemo(() => {
    const counts = {}
    anomalies.forEach(anomaly => {
      const severity = anomaly.severity || 'medium'
      counts[severity] = (counts[severity] || 0) + 1
    })
    return counts
  }, [anomalies])

  return (
    <VStack spacing={3} align="stretch">
      {/* Anomaly summary */}
      <HStack justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="bold" color="netflix.white">
          Anomalies Detected: {anomalies.length}
        </Text>
        
        {showSeverity && (
          <HStack spacing={2}>
            {Object.entries(severityCounts).map(([severity, count]) => (
              <Badge
                key={severity}
                colorScheme={severity === 'critical' || severity === 'high' ? 'red' : 
                          severity === 'medium' ? 'yellow' : 'green'}
                variant="solid"
                fontSize="xs"
              >
                {severityLevels[severity]?.icon} {count}
              </Badge>
            ))}
          </HStack>
        )}
      </HStack>

      {/* Anomaly list */}
      {anomalies.length > 0 ? (
        <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
          {anomalies
            .sort((a, b) => b.timestamp - a.timestamp) // Latest first
            .map((anomaly, index) => {
              const severity = severityLevels[anomaly.severity] || severityLevels.medium
              
              return (
                <Box
                  key={index}
                  p={3}
                  bg="rgba(31, 31, 31, 0.8)"
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={severity.color + '40'}
                  borderLeft="4px solid"
                  borderLeftColor={severity.color}
                  cursor="pointer"
                  onClick={() => onAnomalyClick(anomaly)}
                  _hover={{
                    bg: 'rgba(255, 255, 255, 0.05)',
                    borderColor: severity.color + '60'
                  }}
                  transition="all 0.2s ease"
                >
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                          <Text fontSize="lg">{severity.icon}</Text>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color="netflix.white"
                            noOfLines={1}
                          >
                            {anomaly.title || 'Anomaly Detected'}
                          </Text>
                          <Badge
                            colorScheme="gray"
                            variant="subtle"
                            size="sm"
                          >
                            {anomaly.category || 'Unknown'}
                          </Badge>
                        </HStack>
                        
                        <Text fontSize="xs" color="wireshark.accent">
                          {formatTime(anomaly.timestamp)}
                        </Text>
                        
                        {anomaly.description && (
                          <Text
                            fontSize="xs"
                            color="netflix.silver"
                            noOfLines={2}
                          >
                            {anomaly.description}
                          </Text>
                        )}
                      </VStack>

                      <HStack spacing={1}>
                        <Badge
                          colorScheme={
                            anomaly.severity === 'critical' || anomaly.severity === 'high' ? 'red' :
                            anomaly.severity === 'medium' ? 'yellow' : 'green'
                          }
                          variant="solid"
                          size="sm"
                        >
                          {severity.label}
                        </Badge>
                        
                        <IconButton
                          size="xs"
                          variant="ghost"
                          color="netflix.silver"
                          icon={<Text fontSize="xs">ℹ️</Text>}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAnomalyDetails(anomaly)
                          }}
                          _hover={{ color: 'netflix.white' }}
                          title="View details"
                        />
                      </HStack>
                    </HStack>

                    {/* Anomaly metrics */}
                    {anomaly.metrics && (
                      <HStack spacing={4} fontSize="xs" color="netflix.silver">
                        {Object.entries(anomaly.metrics).map(([key, value]) => (
                          <Text key={key}>
                            {key}: <Text as="span" color="wireshark.accent">{value}</Text>
                          </Text>
                        ))}
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )
            })}
        </VStack>
      ) : (
        <Alert status="success" bg="rgba(16, 185, 129, 0.1)" border="1px solid rgba(16, 185, 129, 0.3)">
          <AlertIcon color="green.400" />
          <AlertDescription color="netflix.white">
            No anomalies detected in the current timeline.
          </AlertDescription>
        </Alert>
      )}

      {/* Category breakdown */}
      {showCategories && Object.keys(categoryCounts).length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="netflix.white" mb={2}>
            Categories
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <Badge
                key={category}
                colorScheme="blue"
                variant="outline"
                fontSize="xs"
              >
                {category}: {count}
              </Badge>
            ))}
          </HStack>
        </Box>
      )}
    </VStack>
  )
}

export default {
  TimestampMarker,
  BookmarkManager,
  AnomalyIndicators
}