import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Input,
  InputGroup,
  InputRightElement,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import { useAIChat } from '../hooks/useAIChat'
import { useMobileDetection } from '../hooks/useMobileGestures'
import { slideAnimations, scaleAnimations, buttonAnimations, fadeAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)
const MotionButton = motion(Button)

const AIChatInterface = ({
  packets = [],
  selectedPackets = [],
  onPacketSelect = () => {},
  onAddPacketsToContext = () => {},
  isFullscreen = false,
  onToggleFullscreen = () => {},
  initialMessage = null,
  className = '',
  ...props
}) => {
  const { isMobile } = useMobileDetection()
  const toast = useToast()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure()

  // AI Chat hook
  const {
    currentConversation,
    messages,
    isLoading,
    isTyping,
    typingUsers,
    error,
    inputValue,
    inputHistory,
    sendMessage,
    handleQuickAction,
    handleInputChange,
    handleKeyDown,
    clearInput,
    retryLastMessage,
    createNewConversation,
    switchConversation,
    deleteConversation,
    exportConversation,
    getAllConversations,
    addPacketsToContext
  } = useAIChat({
    autoFocus: true,
    enableTypingIndicator: true,
    enableContextAwareness: true,
    onError: (error) => {
      toast({
        title: 'Chat Error',
        description: error.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    },
    onMessageSent: () => {
      scrollToBottom()
    },
    onMessageReceived: () => {
      scrollToBottom()
    }
  })

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        sendMessage('Welcome to AI Shark! I\'m here to help you analyze network packets and understand traffic patterns. How can I assist you today?', {
          type: 'text',
          skipHistory: true
        })
      }, 1000)
    }
  }, [messages.length, sendMessage])

  // Add initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length <= 1) {
      setTimeout(() => {
        sendMessage(initialMessage, { skipHistory: true })
      }, 1500)
    }
  }, [initialMessage, messages.length, sendMessage])

  // Add packets to context when they change
  useEffect(() => {
    if (packets.length > 0) {
      addPacketsToContext(packets)
      onAddPacketsToContext(packets)
    }
  }, [packets, addPacketsToContext, onAddPacketsToContext])

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (inputValue.trim()) {
      const messageOptions = {}
      
      // If there are selected packets, include them
      if (selectedPackets.length > 0) {
        messageOptions.type = 'packet-analysis'
        messageOptions.packetIds = selectedPackets.map(p => p.id || p.ts)
      }
      
      sendMessage(inputValue, messageOptions)
    }
  }, [inputValue, selectedPackets, sendMessage])

  // Handle packet analysis quick action
  const handleAnalyzePackets = useCallback((packetIds = []) => {
    const ids = packetIds.length > 0 ? packetIds : selectedPackets.map(p => p.id || p.ts)
    if (ids.length > 0) {
      sendMessage(`Please analyze these ${ids.length} packet(s)`, {
        type: 'packet-analysis',
        packetIds: ids,
        skipHistory: true
      })
    } else {
      toast({
        title: 'No Packets Selected',
        description: 'Please select some packets to analyze',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
    }
  }, [selectedPackets, sendMessage, toast])

  // Handle message quick actions
  const handleMessageQuickAction = useCallback((actionId, actionData) => {
    handleQuickAction(actionId, actionData)
  }, [handleQuickAction])

  // Typing indicator component
  const TypingIndicator = () => (
    isTyping && (
      <MotionBox
        variants={fadeAnimations}
        initial="initial"
        animate="animate"
        exit="initial"
        display="flex"
        alignItems="center"
        gap={2}
        p={3}
        bg="rgba(31, 31, 31, 0.8)"
        borderRadius="12px"
        border="1px solid rgba(255, 255, 255, 0.1)"
        maxW="200px"
      >
        <HStack spacing={1}>
          {[0, 1, 2].map((dot) => (
            <MotionBox
              key={dot}
              w="6px"
              h="6px"
              bg="wireshark.accent"
              borderRadius="50%"
              animate={{
                y: [-2, 2, -2],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: dot * 0.2
              }}
            />
          ))}
        </HStack>
        <Text fontSize="sm" color="netflix.silver">
          {typingUsers.join(', ')} typing...
        </Text>
      </MotionBox>
    )
  )

  // Quick actions panel
  const QuickActionsPanel = () => (
    <HStack spacing={2} mb={4} flexWrap="wrap">
      <MotionButton
        size="sm"
        variant="netflixSecondary"
        leftIcon={<Text fontSize="sm">🔍</Text>}
        onClick={() => handleAnalyzePackets()}
        variants={buttonAnimations}
        whileHover="hover"
        whileTap="tap"
        isDisabled={selectedPackets.length === 0}
      >
        Analyze Selected ({selectedPackets.length})
      </MotionButton>
      
      <MotionButton
        size="sm"
        variant="netflixSecondary"
        leftIcon={<Text fontSize="sm">⚠️</Text>}
        onClick={() => sendMessage('Find any anomalies or suspicious activity in the current packets', { skipHistory: true })}
        variants={buttonAnimations}
        whileHover="hover"
        whileTap="tap"
        isDisabled={packets.length === 0}
      >
        Find Anomalies
      </MotionButton>
      
      <MotionButton
        size="sm"
        variant="netflixSecondary"
        leftIcon={<Text fontSize="sm">📊</Text>}
        onClick={() => sendMessage('Provide a summary of the current network traffic patterns', { skipHistory: true })}
        variants={buttonAnimations}
        whileHover="hover"
        whileTap="tap"
        isDisabled={packets.length === 0}
      >
        Traffic Summary
      </MotionButton>
      
      <MotionButton
        size="sm"
        variant="netflixSecondary"
        leftIcon={<Text fontSize="sm">🔒</Text>}
        onClick={() => sendMessage('Check for potential security threats and vulnerabilities', { skipHistory: true })}
        variants={buttonAnimations}
        whileHover="hover"
        whileTap="tap"
        isDisabled={packets.length === 0}
      >
        Security Check
      </MotionButton>
    </HStack>
  )

  // Chat header
  const ChatHeader = () => (
    <HStack justify="space-between" align="center" p={4} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
      <VStack align="start" spacing={1}>
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="bold" color="netflix.white">
            🤖 AI Assistant
          </Text>
          <Badge colorScheme={error ? 'red' : 'green'} size="sm">
            {error ? 'Error' : 'Online'}
          </Badge>
        </HStack>
        <Text fontSize="sm" color="netflix.silver">
          {currentConversation?.title || 'New Conversation'}
        </Text>
      </VStack>

      <HStack spacing={2}>
        {/* Conversation history */}
        <Tooltip label="Chat History">
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Text fontSize="sm">📜</Text>}
            onClick={onHistoryOpen}
            color="netflix.silver"
            _hover={{ color: 'netflix.white' }}
          />
        </Tooltip>

        {/* Export conversation */}
        <Menu>
          <MenuButton
            as={IconButton}
            size="sm"
            variant="ghost"
            icon={<Text fontSize="sm">📥</Text>}
            color="netflix.silver"
            _hover={{ color: 'netflix.white' }}
          />
          <MenuList bg="netflix.black" borderColor="rgba(255, 255, 255, 0.1)">
            <MenuItem onClick={() => exportConversation('json')} color="netflix.white">
              Export as JSON
            </MenuItem>
            <MenuItem onClick={() => exportConversation('markdown')} color="netflix.white">
              Export as Markdown
            </MenuItem>
            <MenuItem onClick={() => exportConversation('text')} color="netflix.white">
              Export as Text
            </MenuItem>
          </MenuList>
        </Menu>

        {/* New conversation */}
        <Tooltip label="New Conversation">
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Text fontSize="sm">💬</Text>}
            onClick={() => createNewConversation()}
            color="netflix.silver"
            _hover={{ color: 'netflix.white' }}
          />
        </Tooltip>

        {/* Fullscreen toggle */}
        {!isMobile && (
          <Tooltip label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Text fontSize="sm">{isFullscreen ? '🗗' : '🗖'}</Text>}
              onClick={onToggleFullscreen}
              color="netflix.silver"
              _hover={{ color: 'netflix.white' }}
            />
          </Tooltip>
        )}
      </HStack>
    </HStack>
  )

  // Input area
  const InputArea = () => (
    <Box p={4} borderTop="1px solid rgba(255, 255, 255, 0.1)">
      <VStack spacing={3}>
        {/* Context indicators */}
        {(packets.length > 0 || selectedPackets.length > 0) && (
          <HStack justify="space-between" w="100%" fontSize="sm">
            {packets.length > 0 && (
              <Badge colorScheme="blue" variant="subtle">
                {packets.length} packets in context
              </Badge>
            )}
            {selectedPackets.length > 0 && (
              <Badge colorScheme="orange" variant="subtle">
                {selectedPackets.length} selected
              </Badge>
            )}
          </HStack>
        )}

        {/* Input field */}
        <InputGroup size="lg">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about network packets..."
            resize="none"
            rows={isMobile ? 2 : 3}
            bg="rgba(255, 255, 255, 0.1)"
            border="1px solid rgba(255, 255, 255, 0.2)"
            borderRadius="12px"
            color="netflix.white"
            _placeholder={{ color: 'netflix.silver' }}
            _focus={{
              borderColor: 'wireshark.accent',
              boxShadow: '0 0 0 1px #06B6D4'
            }}
          />
          <InputRightElement h="100%" pr={2}>
            <VStack spacing={1}>
              <IconButton
                size="sm"
                variant="ghost"
                icon={<Text fontSize="sm">📎</Text>}
                onClick={() => {/* Add attachment functionality */}}
                color="netflix.silver"
                _hover={{ color: 'netflix.white' }}
                isDisabled
              />
              <MotionButton
                size="sm"
                variant="netflixPrimary"
                onClick={handleSendMessage}
                isLoading={isLoading}
                isDisabled={!inputValue.trim()}
                variants={buttonAnimations}
                whileHover="hover"
                whileTap="tap"
                borderRadius="8px"
                minW="60px"
              >
                <Text fontSize="sm">Send</Text>
              </MotionButton>
            </VStack>
          </InputRightElement>
        </InputGroup>

        {/* Input hints */}
        <HStack justify="space-between" w="100%" fontSize="xs" color="netflix.silver">
          <Text>Press Enter to send, Shift+Enter for new line</Text>
          <HStack spacing={2}>
            <Text>↑↓ History</Text>
            <Text>Esc Clear</Text>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  )

  // Messages area
  const MessagesArea = () => (
    <VStack
      flex={1}
      align="stretch"
      spacing={4}
      p={4}
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.5)',
        },
      }}
    >
      {/* Welcome message */}
      {messages.length === 0 && (
        <MotionBox
          variants={fadeAnimations}
          initial="initial"
          animate="animate"
          textAlign="center"
          py={12}
        >
          <Text fontSize="6xl" mb={4}>🤖</Text>
          <Text fontSize="xl" fontWeight="bold" color="netflix.white" mb={2}>
            AI Assistant Ready
          </Text>
          <Text color="netflix.silver" mb={6}>
            I can help you analyze network packets, detect anomalies, and explain complex traffic patterns.
          </Text>
          <QuickActionsPanel />
        </MotionBox>
      )}

      {/* Messages */}
      <AnimatePresence>
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            onQuickAction={handleMessageQuickAction}
            onEdit={() => {/* Add edit functionality */}}
            onDelete={() => {/* Add delete functionality */}}
            onRetry={() => retryLastMessage()}
            showAvatar={!isMobile}
            showTimestamp={true}
            isEditable={false}
            isDeletable={false}
            enableReactions={true}
            enableQuickActions={true}
            isMobile={isMobile}
          />
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        <TypingIndicator />
      </AnimatePresence>

      {/* Error display */}
      {error && (
        <MotionBox
          variants={slideAnimations.slideInUp}
          initial="initial"
          animate="animate"
        >
          <Alert status="error" bg="rgba(239, 68, 68, 0.1)" border="1px solid rgba(239, 68, 68, 0.3)">
            <AlertIcon color="red.400" />
            <AlertDescription color="red.300">
              {error.message || 'Something went wrong with the AI chat'}
            </AlertDescription>
          </Alert>
        </MotionBox>
      )}

      <div ref={messagesEndRef} />
    </VStack>
  )

  // Conversation history drawer
  const ConversationHistory = () => (
    <Drawer isOpen={isHistoryOpen} onClose={onHistoryClose} size="md" placement="left">
      <DrawerOverlay />
      <DrawerContent bg="netflix.black" borderRight="1px solid rgba(255, 255, 255, 0.1)">
        <DrawerCloseButton color="netflix.white" />
        <DrawerHeader color="netflix.white">
          <HStack spacing={2}>
            <Text>📜</Text>
            <Text>Chat History</Text>
          </HStack>
        </DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={3}>
            {getAllConversations().map((conversation) => (
              <Box
                key={conversation.id}
                p={3}
                bg={currentConversation?.id === conversation.id 
                  ? 'rgba(229, 9, 20, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)'
                }
                borderRadius="8px"
                border="1px solid"
                borderColor={currentConversation?.id === conversation.id 
                  ? 'rgba(229, 9, 20, 0.5)' 
                  : 'rgba(255, 255, 255, 0.1)'
                }
                cursor="pointer"
                onClick={() => {
                  switchConversation(conversation.id)
                  onHistoryClose()
                }}
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="bold" color="netflix.white" noOfLines={1}>
                    {conversation.title}
                  </Text>
                  <Text fontSize="xs" color="netflix.silver">
                    {conversation.metadata.messageCount} messages • {new Date(conversation.updated).toLocaleDateString()}
                  </Text>
                </VStack>
              </Box>
            ))}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )

  return (
    <MotionBox
      variants={slideAnimations.slideInUp}
      initial="initial"
      animate="animate"
      className={className}
      h={isFullscreen ? '100vh' : '600px'}
      w="100%"
      bg="rgba(10, 10, 10, 0.95)"
      borderRadius={isFullscreen ? 0 : '16px'}
      border={isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'}
      overflow="hidden"
      display="flex"
      flexDirection="column"
      backdropFilter="blur(20px)"
      {...props}
    >
      <ChatHeader />
      <MessagesArea />
      <InputArea />
      <ConversationHistory />
    </MotionBox>
  )
}

export default AIChatInterface