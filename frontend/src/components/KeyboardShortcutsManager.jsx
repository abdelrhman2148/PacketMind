import React, { useState, useCallback } from 'react'
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Grid,
  useDisclosure,
  IconButton
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useKeyboardShortcuts } from '../hooks/useFocusManagement'

const MotionBox = motion(Box)

// Default keyboard shortcuts
const DEFAULT_SHORTCUTS = {
  'ctrl+/': { action: 'toggleHelp', description: 'Show shortcuts', category: 'Global' },
  'ctrl+k': { action: 'openSearch', description: 'Open search', category: 'Global' },
  'escape': { action: 'closeModal', description: 'Close modal', category: 'Global' },
  'ctrl+1': { action: 'goToDashboard', description: 'Dashboard', category: 'Navigation' },
  'ctrl+2': { action: 'goToPackets', description: 'Live Packets', category: 'Navigation' },
  'spacebar': { action: 'toggleCapture', description: 'Start/Stop capture', category: 'Capture' },
  'ctrl+f': { action: 'openFilter', description: 'Open filters', category: 'Filter' },
  'ctrl+s': { action: 'savePackets', description: 'Save packets', category: 'Export' }
}

// Format shortcut key for display
const formatKey = (key) => {
  return key
    .split('+')
    .map(part => {
      switch (part.toLowerCase()) {
        case 'ctrl': return '⌘'
        case 'shift': return '⇧'
        case 'alt': return '⌥'
        case 'spacebar': return 'Space'
        case 'escape': return 'Esc'
        default: return part.charAt(0).toUpperCase() + part.slice(1)
      }
    })
    .join(' + ')
}

const KeyboardShortcutsManager = ({
  shortcuts = DEFAULT_SHORTCUTS,
  onShortcutAction = () => {},
  enabled = true,
  ...props
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [currentCategory, setCurrentCategory] = useState('All')
  
  // Handle shortcut actions
  const handleShortcutAction = useCallback((action, event) => {
    switch (action) {
      case 'toggleHelp':
        onOpen()
        break
      case 'closeModal':
        if (isOpen) onClose()
        else onShortcutAction(action, event)
        break
      default:
        onShortcutAction(action, event)
    }
  }, [isOpen, onOpen, onClose, onShortcutAction])
  
  // Create shortcuts map
  const shortcutsMap = Object.entries(shortcuts).reduce((acc, [key, config]) => {
    acc[key] = (event) => handleShortcutAction(config.action, event)
    return acc
  }, {})
  
  useKeyboardShortcuts(shortcutsMap, { enabled })
  
  // Group by category
  const categorizedShortcuts = Object.entries(shortcuts).reduce((acc, [key, config]) => {
    const category = config.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push({ key, ...config })
    return acc
  }, {})
  
  const categories = ['All', ...Object.keys(categorizedShortcuts)]
  const filteredShortcuts = currentCategory === 'All' 
    ? Object.entries(shortcuts).map(([key, config]) => ({ key, ...config }))
    : categorizedShortcuts[currentCategory] || []
  
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">\n        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg="netflix.black" border="2px solid" borderColor="wireshark.accent">
          <ModalHeader color="netflix.white">
            <Text fontSize="xl" fontWeight="bold">Keyboard Shortcuts</Text>
          </ModalHeader>
          <ModalCloseButton color="netflix.white" />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              {/* Categories */}
              <HStack spacing={2} flexWrap="wrap">
                {categories.map(category => (
                  <Badge
                    key={category}
                    colorScheme={currentCategory === category ? 'blue' : 'gray'}
                    cursor="pointer"
                    onClick={() => setCurrentCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </HStack>
              
              {/* Shortcuts grid */}
              <Grid templateColumns="1fr 1fr" gap={3}>
                {filteredShortcuts.map((shortcut, index) => (
                  <MotionBox
                    key={shortcut.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <HStack
                      justify="space-between"
                      p={3}
                      bg="rgba(255, 255, 255, 0.05)"
                      borderRadius="8px"
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.1)"
                    >
                      <Text fontSize="sm" color="netflix.white">
                        {shortcut.description}
                      </Text>
                      <Text
                        fontSize="xs"
                        fontFamily="monospace"
                        bg="rgba(255, 255, 255, 0.1)"
                        px={2}
                        py={1}
                        borderRadius="4px"
                        color="netflix.white"
                        fontWeight="bold"
                      >
                        {formatKey(shortcut.key)}
                      </Text>
                    </HStack>
                  </MotionBox>
                ))}
              </Grid>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Help button */}
      <IconButton
        aria-label="Show keyboard shortcuts"
        icon={<Text fontSize="lg">⌨️</Text>}
        variant="ghost"
        size="sm"
        onClick={onOpen}
        position="fixed"
        bottom={4}
        right={4}
        zIndex={999}
        bg="rgba(0, 0, 0, 0.8)"
        color="netflix.white"
        _hover={{ bg: 'rgba(6, 182, 212, 0.2)' }}
        {...props}
      />
    </>
  )
}

export default KeyboardShortcutsManager
export { DEFAULT_SHORTCUTS, formatKey }