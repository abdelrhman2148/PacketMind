import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Text,
  HStack,
  VStack,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Code,
  Pre,
  useClipboard,
  Collapse,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { slideAnimations, scaleAnimations, buttonAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)
const MotionButton = motion(Button)

const ChatMessage = ({
  message,
  onQuickAction = () => {},
  onReaction = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onRetry = () => {},
  showAvatar = true,
  showTimestamp = true,
  isEditable = false,
  isDeletable = false,
  enableReactions = true,
  enableQuickActions = true,
  isMobile = false,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const { isOpen: isExpanded, onToggle: toggleExpanded } = useDisclosure()
  const { hasCopied, onCopy } = useClipboard(message.content)
  const messageRef = useRef(null)

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get message style based on role and type
  const getMessageStyle = () => {
    const baseStyle = {
      borderRadius: '16px',
      p: 4,
      maxW: isMobile ? '85%' : '70%',
      position: 'relative',
      wordBreak: 'break-word',
      border: '1px solid'
    }

    switch (message.role) {
      case 'user':
        return {
          ...baseStyle,
          bg: 'linear-gradient(135deg, #E50914 0%, #DC143C 50%, #B20710 100%)',
          color: 'white',
          borderColor: 'rgba(229, 9, 20, 0.3)',
          alignSelf: 'flex-end',
          ml: 'auto',
          mr: 0
        }
      
      case 'assistant':
        return {
          ...baseStyle,
          bg: 'rgba(31, 31, 31, 0.95)',
          color: 'netflix.white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          alignSelf: 'flex-start',
          mr: 'auto',
          ml: 0
        }
      
      case 'system':
        return {
          ...baseStyle,
          bg: message.type === 'error' 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgba(6, 182, 212, 0.1)',
          color: message.type === 'error' ? 'red.300' : 'cyan.300',
          borderColor: message.type === 'error' 
            ? 'rgba(239, 68, 68, 0.3)' 
            : 'rgba(6, 182, 212, 0.3)',
          alignSelf: 'center',
          maxW: '90%',
          textAlign: 'center'
        }
      
      default:
        return baseStyle
    }
  }

  // Get avatar for role
  const getAvatar = () => {
    switch (message.role) {
      case 'user':
        return '👤'
      case 'assistant':
        return '🤖'
      case 'system':
        return '⚙️'
      default:
        return '💬'
    }
  }

  // Render message content based on type
  const renderMessageContent = () => {
    switch (message.type) {
      case 'code':
        return (
          <Box position="relative">
            <Pre
              bg="rgba(0, 0, 0, 0.3)"
              borderRadius="8px"
              p={3}
              fontSize="sm"
              overflowX="auto"
              border="1px solid rgba(255, 255, 255, 0.1)"
            >
              <Code color="inherit" bg="transparent">
                {message.content}
              </Code>
            </Pre>
            <IconButton
              size="xs"
              variant="ghost"
              icon={<Text fontSize="xs">{hasCopied ? '✓' : '📋'}</Text>}
              onClick={onCopy}
              position="absolute"
              top={2}
              right={2}
              color="netflix.silver"
              _hover={{ color: 'netflix.white' }}
            />
          </Box>
        )
      
      case 'analysis':
        return (
          <VStack align="stretch" spacing={3}>
            <Text lineHeight={1.6}>{message.content}</Text>
            
            {message.analysis && (
              <Box
                bg="rgba(6, 182, 212, 0.1)"
                borderRadius="8px"
                p={3}
                border="1px solid rgba(6, 182, 212, 0.2)"
              >
                <Text fontSize="sm" color="cyan.300" fontWeight="bold" mb={2}>
                  📊 Analysis Results
                </Text>
                <Text fontSize="sm" color="netflix.silver">
                  {typeof message.analysis === 'string' 
                    ? message.analysis 
                    : JSON.stringify(message.analysis, null, 2)
                  }
                </Text>
              </Box>
            )}
          </VStack>
        )
      
      case 'error':
        return (
          <Alert status="error" bg="transparent" p={0}>
            <AlertIcon color="red.400" />
            <AlertDescription color="red.300">
              {message.content}
            </AlertDescription>
          </Alert>
        )
      
      default:
        return (
          <Text lineHeight={1.6} whiteSpace="pre-wrap">
            {message.content}
          </Text>
        )
    }
  }

  // Render quick action buttons
  const renderQuickActions = () => {
    if (!enableQuickActions || !message.metadata?.quickActions?.length) return null

    return (
      <HStack spacing={2} mt={3} flexWrap="wrap">
        {message.metadata.quickActions.map((action, index) => (
          <MotionButton
            key={action.id || index}
            size="xs"
            variant="netflixSecondary"
            onClick={() => onQuickAction(action.id || action.action, action)}
            variants={buttonAnimations}
            whileHover="hover"
            whileTap="tap"
            bg="rgba(255, 255, 255, 0.1)"
            borderColor="rgba(255, 255, 255, 0.2)"
            color="netflix.silver"
            _hover={{
              bg: 'rgba(255, 255, 255, 0.2)',
              color: 'netflix.white'
            }}
          >
            {action.label}
          </MotionButton>
        ))}
      </HStack>
    )
  }

  // Render message metadata
  const renderMetadata = () => {
    if (!message.metadata) return null

    const { confidence, processingTime, tokens, editHistory } = message.metadata

    return (
      <Collapse in={isExpanded}>
        <Box
          mt={3}
          p={3}
          bg="rgba(0, 0, 0, 0.2)"
          borderRadius="8px"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <VStack align="stretch" spacing={2}>
            <Text fontSize="xs" color="netflix.silver" fontWeight="bold">
              Message Details
            </Text>
            
            {confidence && (
              <HStack justify="space-between">
                <Text fontSize="xs" color="netflix.silver">Confidence:</Text>
                <Badge colorScheme={confidence > 0.8 ? 'green' : confidence > 0.6 ? 'yellow' : 'red'}>
                  {(confidence * 100).toFixed(0)}%
                </Badge>
              </HStack>
            )}
            
            {processingTime && (
              <HStack justify="space-between">
                <Text fontSize="xs" color="netflix.silver">Processing Time:</Text>
                <Text fontSize="xs" color="netflix.white">{processingTime}ms</Text>
              </HStack>
            )}
            
            {tokens && (
              <HStack justify="space-between">
                <Text fontSize="xs" color="netflix.silver">Tokens:</Text>
                <Text fontSize="xs" color="netflix.white">{tokens}</Text>
              </HStack>
            )}
            
            {editHistory && editHistory.length > 0 && (
              <Box>
                <Text fontSize="xs" color="netflix.silver" mb={1}>Edit History:</Text>
                {editHistory.map((edit, index) => (
                  <Text key={index} fontSize="xs" color="netflix.silver" opacity={0.7}>
                    {new Date(edit.editedAt).toLocaleTimeString()} - Edited
                  </Text>
                ))}
              </Box>
            )}
          </VStack>
        </Box>
      </Collapse>
    )
  }

  // Render message reactions
  const renderReactions = () => {
    if (!enableReactions || !message.metadata?.reactions?.length) return null

    return (
      <HStack spacing={1} mt={2}>
        {message.metadata.reactions.map((reaction, index) => (
          <Button
            key={index}
            size="xs"
            variant="ghost"
            onClick={() => onReaction(reaction.emoji, message.id)}
            bg="rgba(255, 255, 255, 0.1)"
            borderRadius="full"
            minW="auto"
            h="24px"
            px={2}
          >
            <Text fontSize="xs">{reaction.emoji}</Text>
            {reaction.count > 1 && (
              <Text fontSize="xs" ml={1} color="netflix.silver">
                {reaction.count}
              </Text>
            )}
          </Button>
        ))}
      </HStack>
    )
  }

  // Render message actions menu
  const renderMessageActions = () => {
    if (!isHovered && !isMobile) return null

    return (
      <Box
        position="absolute"
        top={2}
        right={message.role === 'user' ? 'auto' : 2}
        left={message.role === 'user' ? 2 : 'auto'}
        opacity={isHovered ? 1 : 0.7}
        transition="opacity 0.2s"
      >
        <Menu>
          <MenuButton
            as={IconButton}
            size="xs"
            variant="ghost"
            icon={<Text fontSize="xs">⋯</Text>}
            color="rgba(255, 255, 255, 0.6)"
            _hover={{ color: 'netflix.white' }}
          />
          <MenuList bg="netflix.black" borderColor="rgba(255, 255, 255, 0.1)">
            <MenuItem
              icon={<Text fontSize="sm">📋</Text>}
              onClick={onCopy}
              color="netflix.white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            >
              {hasCopied ? 'Copied!' : 'Copy'}
            </MenuItem>
            
            {message.metadata && (
              <MenuItem
                icon={<Text fontSize="sm">ℹ️</Text>}
                onClick={toggleExpanded}
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                {isExpanded ? 'Hide Details' : 'Show Details'}
              </MenuItem>
            )}
            
            {isEditable && (
              <MenuItem
                icon={<Text fontSize="sm">✏️</Text>}
                onClick={() => onEdit(message)}
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                Edit
              </MenuItem>
            )}
            
            {message.role === 'assistant' && message.type === 'error' && (
              <MenuItem
                icon={<Text fontSize="sm">🔄</Text>}
                onClick={() => onRetry(message)}
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                Retry
              </MenuItem>
            )}
            
            {isDeletable && (
              <MenuItem
                icon={<Text fontSize="sm">🗑️</Text>}
                onClick={() => onDelete(message)}
                color="red.300"
                _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
              >
                Delete
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </Box>
    )
  }

  const messageStyle = getMessageStyle()

  return (
    <MotionVStack
      ref={messageRef}
      align="stretch"
      spacing={2}
      variants={slideAnimations.slideInUp}
      initial="initial"
      animate="animate"
      w="100%"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Message bubble */}
      <MotionBox
        style={messageStyle}
        variants={scaleAnimations}
        whileHover="hover"
        layout
      >
        {renderMessageActions()}

        {/* Avatar and sender info */}
        {showAvatar && message.role !== 'system' && (
          <HStack spacing={2} mb={2}>
            <Text fontSize="lg">{getAvatar()}</Text>
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="bold" opacity={0.9}>
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </Text>
              {showTimestamp && (
                <Text fontSize="xs" opacity={0.7}>
                  {formatTimestamp(message.timestamp)}
                </Text>
              )}
            </VStack>
          </HStack>
        )}

        {/* Message content */}
        {renderMessageContent()}

        {/* Quick actions */}
        {renderQuickActions()}

        {/* Reactions */}
        {renderReactions()}

        {/* Timestamp for system messages */}
        {message.role === 'system' && showTimestamp && (
          <Text fontSize="xs" opacity={0.5} textAlign="center" mt={2}>
            {formatTimestamp(message.timestamp)}
          </Text>
        )}

        {/* Message metadata */}
        {renderMetadata()}
      </MotionBox>
    </MotionVStack>
  )
}

export default ChatMessage