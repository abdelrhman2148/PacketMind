import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
  Kbd,
  Divider
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { slideAnimations, scaleAnimations } from '../animations/transitions'

const MotionBox = motion(Box)

// Accessibility announcer for screen readers
export const DragDropAnnouncer = ({ 
  announcements = [],
  position = 'sr-only' 
}) => {
  const [currentAnnouncement, setCurrentAnnouncement] = useState('')
  const announcerRef = useRef(null)

  useEffect(() => {
    if (announcements.length > 0) {
      const latest = announcements[announcements.length - 1]
      setCurrentAnnouncement(latest.message)
      
      // Clear after announcement to allow re-announcing same message
      setTimeout(() => {
        setCurrentAnnouncement('')
      }, 100)
    }
  }, [announcements])

  if (position === 'sr-only') {
    return (
      <Box
        ref={announcerRef}
        position="absolute"
        width="1px"
        height="1px"
        padding="0"
        margin="-1px"
        overflow="hidden"
        clip="rect(0, 0, 0, 0)"
        whiteSpace="nowrap"
        border="0"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        {currentAnnouncement}
      </Box>
    )
  }

  return (
    <AnimatePresence>
      {currentAnnouncement && (
        <MotionBox
          position="fixed"
          bottom={4}
          left={4}
          right={4}
          zIndex={9999}
          variants={slideAnimations.slideInUp}
          initial="initial"
          animate="animate"
          exit="initial"
        >
          <Alert
            status="info"
            bg="rgba(6, 182, 212, 0.9)"
            color="white"
            borderRadius="8px"
            backdropFilter="blur(10px)"
          >
            <AlertIcon color="white" />
            <AlertDescription fontSize="sm">
              {currentAnnouncement}
            </AlertDescription>
          </Alert>
        </MotionBox>
      )}
    </AnimatePresence>
  )
}

// Keyboard instructions modal
export const KeyboardInstructionsModal = ({ isOpen, onClose }) => {
  const keyboardShortcuts = [
    {
      category: 'Drag and Drop',
      shortcuts: [
        { keys: ['Space', 'Enter'], description: 'Start drag mode' },
        { keys: ['Arrow Keys'], description: 'Move item (1px)' },
        { keys: ['Shift', '+', 'Arrow Keys'], description: 'Move item (10px)' },
        { keys: ['Ctrl', '+', 'Arrow Keys'], description: 'Move item (1px precise)' },
        { keys: ['Tab'], description: 'Cycle through drop zones' },
        { keys: ['Space', 'Enter'], description: 'Drop item' },
        { keys: ['Escape'], description: 'Cancel drag' }
      ]
    },
    {
      category: 'Table Columns',
      shortcuts: [
        { keys: ['Space'], description: 'Start column reorder' },
        { keys: ['←', '→'], description: 'Move column left/right' },
        { keys: ['Ctrl', '+', '←/→'], description: 'Move to start/end' },
        { keys: ['Enter'], description: 'Confirm position' },
        { keys: ['Escape'], description: 'Cancel reorder' }
      ]
    },
    {
      category: 'Dashboard Widgets',
      shortcuts: [
        { keys: ['Space'], description: 'Start widget move' },
        { keys: ['Arrow Keys'], description: 'Move widget' },
        { keys: ['Shift', '+', 'Arrow Keys'], description: 'Resize widget' },
        { keys: ['Delete'], description: 'Remove widget' },
        { keys: ['F2'], description: 'Edit widget' }
      ]
    },
    {
      category: 'Navigation',
      shortcuts: [
        { keys: ['Tab'], description: 'Navigate between elements' },
        { keys: ['Shift', '+', 'Tab'], description: 'Navigate backwards' },
        { keys: ['Enter'], description: 'Activate element' },
        { keys: ['Space'], description: 'Select/activate' },
        { keys: ['?'], description: 'Show this help' }
      ]
    }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent bg="netflix.black" border="1px solid rgba(255, 255, 255, 0.1)">
        <ModalHeader color="netflix.white">
          <HStack spacing={2}>
            <Text>⌨️</Text>
            <Text>Keyboard Shortcuts</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="netflix.white" />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {keyboardShortcuts.map((category, categoryIndex) => (
              <Box key={categoryIndex}>
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color="wireshark.accent"
                  mb={3}
                >
                  {category.category}
                </Text>
                
                <List spacing={2}>
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <ListItem key={shortcutIndex}>
                      <HStack justify="space-between" align="center">
                        <HStack spacing={1}>
                          {shortcut.keys.map((key, keyIndex) => (
                            <HStack key={keyIndex} spacing={1}>
                              {keyIndex > 0 && (
                                <Text color="netflix.silver" fontSize="xs">
                                  +
                                </Text>
                              )}
                              <Kbd
                                bg="rgba(255, 255, 255, 0.1)"
                                color="netflix.white"
                                fontSize="xs"
                                px={2}
                                py={1}
                              >
                                {key}
                              </Kbd>
                            </HStack>
                          ))}
                        </HStack>
                        
                        <Text
                          color="netflix.silver"
                          fontSize="sm"
                          textAlign="right"
                          flex={1}
                          ml={4}
                        >
                          {shortcut.description}
                        </Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
                
                {categoryIndex < keyboardShortcuts.length - 1 && (
                  <Divider my={4} borderColor="rgba(255, 255, 255, 0.1)" />
                )}
              </Box>
            ))}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="netflixPrimary" onClick={onClose}>
            Got it!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Accessible drag handle
export const AccessibleDragHandle = ({
  onDragStart = () => {},
  onDragEnd = () => {},
  disabled = false,
  dragInstructions = "Press space or enter to start dragging. Use arrow keys to move. Press space or enter to drop.",
  children,
  itemName = "item",
  ...props
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [announcements, setAnnouncements] = useState([])

  const announce = (message) => {
    setAnnouncements(prev => [...prev, { 
      message, 
      timestamp: Date.now() 
    }])
  }

  const handleKeyDown = (event) => {
    if (disabled) return

    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault()
        if (!isDragging) {
          setIsDragging(true)
          announce(`Started dragging ${itemName}. Use arrow keys to move, space or enter to drop, escape to cancel.`)
          onDragStart({ event, keyboardMode: true })
        } else {
          setIsDragging(false)
          announce(`Dropped ${itemName}.`)
          onDragEnd({ event, keyboardMode: true, dropped: true })
        }
        break

      case 'Escape':
        if (isDragging) {
          event.preventDefault()
          setIsDragging(false)
          announce(`Cancelled dragging ${itemName}.`)
          onDragEnd({ event, keyboardMode: true, cancelled: true })
        }
        break

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (isDragging) {
          event.preventDefault()
          const direction = event.key.replace('Arrow', '').toLowerCase()
          const distance = event.shiftKey ? 10 : event.ctrlKey ? 1 : 5
          announce(`Moving ${itemName} ${direction} by ${distance} pixels.`)
          // Movement logic would be handled by parent component
        }
        break
    }
  }

  return (
    <>
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Draggable ${itemName}. ${dragInstructions}`}
        aria-describedby="drag-instructions"
        aria-pressed={isDragging}
        onKeyDown={handleKeyDown}
        cursor={disabled ? 'not-allowed' : 'grab'}
        outline="none"
        _focus={{
          boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.6)',
          borderRadius: '4px'
        }}
        _focusVisible={{
          boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.6)',
          borderRadius: '4px'
        }}
        position="relative"
        {...props}
      >
        {children}
        
        {/* Drag state indicator */}
        {isDragging && (
          <MotionBox
            position="absolute"
            top="-4px"
            left="-4px"
            right="-4px"
            bottom="-4px"
            border="2px dashed #06B6D4"
            borderRadius="6px"
            pointerEvents="none"
            variants={scaleAnimations}
            initial="initial"
            animate="animate"
          />
        )}
      </Box>

      {/* Hidden instructions */}
      <Box
        id="drag-instructions"
        position="absolute"
        width="1px"
        height="1px"
        padding="0"
        margin="-1px"
        overflow="hidden"
        clip="rect(0, 0, 0, 0)"
        whiteSpace="nowrap"
        border="0"
      >
        {dragInstructions}
      </Box>

      {/* Announcements */}
      <DragDropAnnouncer announcements={announcements} />
    </>
  )
}

// Accessible drop zone
export const AccessibleDropZone = ({
  onDrop = () => {},
  disabled = false,
  acceptMessage = "Drop zone active. Press enter to drop here.",
  rejectMessage = "Cannot drop here.",
  dropInstructions = "Navigate with tab. Press enter to drop item here.",
  children,
  canAcceptDrop = true,
  zoneName = "drop zone",
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [announcements, setAnnouncements] = useState([])

  const announce = (message) => {
    setAnnouncements(prev => [...prev, { 
      message, 
      timestamp: Date.now() 
    }])
  }

  const handleKeyDown = (event) => {
    if (disabled) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (canAcceptDrop) {
        announce(`Dropped in ${zoneName}.`)
        onDrop({ event, keyboardMode: true })
      } else {
        announce(`Cannot drop in ${zoneName}.`)
      }
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (canAcceptDrop) {
      announce(acceptMessage)
    } else {
      announce(rejectMessage)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  return (
    <>
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${zoneName}. ${dropInstructions}`}
        aria-describedby="drop-instructions"
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        outline="none"
        _focus={{
          boxShadow: canAcceptDrop 
            ? '0 0 0 3px rgba(16, 185, 129, 0.6)'
            : '0 0 0 3px rgba(239, 68, 68, 0.6)',
          borderRadius: '4px'
        }}
        _focusVisible={{
          boxShadow: canAcceptDrop 
            ? '0 0 0 3px rgba(16, 185, 129, 0.6)'
            : '0 0 0 3px rgba(239, 68, 68, 0.6)',
          borderRadius: '4px'
        }}
        position="relative"
        {...props}
      >
        {children}
        
        {/* Focus indicator */}
        {(isFocused || isHovered) && (
          <MotionBox
            position="absolute"
            top="8px"
            right="8px"
            px={2}
            py={1}
            bg={canAcceptDrop ? 'green.500' : 'red.500'}
            color="white"
            fontSize="xs"
            borderRadius="4px"
            pointerEvents="none"
            variants={scaleAnimations}
            initial="initial"
            animate="animate"
          >
            {canAcceptDrop ? '✓' : '✗'}
          </MotionBox>
        )}
      </Box>

      {/* Hidden instructions */}
      <Box
        id="drop-instructions"
        position="absolute"
        width="1px"
        height="1px"
        padding="0"
        margin="-1px"
        overflow="hidden"
        clip="rect(0, 0, 0, 0)"
        whiteSpace="nowrap"
        border="0"
      >
        {dropInstructions}
      </Box>

      {/* Announcements */}
      <DragDropAnnouncer announcements={announcements} />
    </>
  )
}

// Help button for keyboard shortcuts
export const KeyboardHelpButton = ({ position = 'fixed', ...props }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Button
        position={position}
        bottom={4}
        right={4}
        size="sm"
        variant="netflixSecondary"
        borderRadius="full"
        w="40px"
        h="40px"
        minW="40px"
        onClick={onOpen}
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (Press ? for help)"
        zIndex={1000}
        {...props}
      >
        <Text fontSize="lg">?</Text>
      </Button>

      <KeyboardInstructionsModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

// Global keyboard event handler
export const useKeyboardShortcuts = (handlers = {}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.isContentEditable) {
        return
      }

      const key = event.key.toLowerCase()
      const modifiers = {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey
      }

      // Check for registered handlers
      Object.entries(handlers).forEach(([shortcut, handler]) => {
        const [keys, requiredModifiers = {}] = shortcut.split('+').reduce((acc, part) => {
          const trimmed = part.trim().toLowerCase()
          if (['ctrl', 'shift', 'alt', 'meta'].includes(trimmed)) {
            acc[1][trimmed] = true
          } else {
            acc[0] = trimmed
          }
          return acc
        }, ['', {}])

        // Check if key matches
        if (keys === key) {
          // Check if modifiers match
          const modifiersMatch = Object.entries(requiredModifiers).every(
            ([mod, required]) => modifiers[mod] === required
          )

          if (modifiersMatch) {
            event.preventDefault()
            handler(event)
          }
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}

// High contrast mode detector
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      const testDiv = document.createElement('div')
      testDiv.style.border = '1px solid'
      testDiv.style.borderColor = 'rgb(31, 31, 31)'
      testDiv.style.position = 'absolute'
      testDiv.style.height = '5px'
      testDiv.style.left = '-999px'
      testDiv.style.width = '5px'
      
      document.body.appendChild(testDiv)
      
      const computedStyle = window.getComputedStyle(testDiv)
      const borderColor = computedStyle.borderTopColor
      
      document.body.removeChild(testDiv)
      
      // In high contrast mode, the border color will be different
      setIsHighContrast(borderColor !== 'rgb(31, 31, 31)')
    }

    checkHighContrast()
    
    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    const handleChange = () => checkHighContrast()
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isHighContrast
}

// Reduced motion detector
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

export default {
  DragDropAnnouncer,
  KeyboardInstructionsModal,
  AccessibleDragHandle,
  AccessibleDropZone,
  KeyboardHelpButton,
  useKeyboardShortcuts,
  useHighContrastMode,
  useReducedMotion
}