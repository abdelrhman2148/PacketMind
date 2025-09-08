import { useState, useRef, useEffect, useCallback } from 'react'
import { chatManager } from '../utils/chatManager'
import { explainPacket } from '../api'

// Custom hook for AI chat functionality
export const useAIChat = (options = {}) => {
  const {
    autoFocus = false,
    enableTypingIndicator = true,
    typingTimeout = 3000,
    maxRetries = 3,
    onError = () => {},
    onMessageSent = () => {},
    onMessageReceived = () => {},
    enableContextAwareness = true
  } = options

  // Chat state
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connected')

  // Input state
  const [inputValue, setInputValue] = useState('')
  const [inputHistory, setInputHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // References
  const typingTimeoutRef = useRef(null)
  const retryCountRef = useRef(0)
  const abortControllerRef = useRef(null)

  // Initialize conversation
  useEffect(() => {
    const conversation = chatManager.getCurrentConversation()
    setCurrentConversation(conversation)
    setMessages(conversation?.messages || [])
  }, [])

  // Auto-save conversation context
  useEffect(() => {
    if (currentConversation && enableContextAwareness) {
      chatManager.updateConversationContext({
        lastActivity: Date.now(),
        messageCount: messages.length
      })
    }
  }, [messages, currentConversation, enableContextAwareness])

  // Simulate typing indicator
  const simulateTyping = useCallback((duration = 2000) => {
    if (!enableTypingIndicator) return

    setIsTyping(true)
    setTypingUsers(['AI Assistant'])

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      setTypingUsers([])
    }, duration)
  }, [enableTypingIndicator])

  // Send message to AI
  const sendMessage = useCallback(async (content, options = {}) => {
    if (!content.trim()) return null

    const {
      type = 'text',
      packetIds = [],
      attachments = [],
      quickActions = [],
      skipHistory = false
    } = options

    setError(null)
    setIsLoading(true)

    try {
      // Add user message
      const userMessage = chatManager.addMessage({
        content: content.trim(),
        type,
        role: 'user',
        packetIds,
        attachments,
        quickActions
      })

      // Update local state
      const updatedConversation = chatManager.getCurrentConversation()
      setCurrentConversation(updatedConversation)
      setMessages(updatedConversation.messages)

      // Add to input history
      if (!skipHistory) {
        setInputHistory(prev => {
          const newHistory = [content, ...prev.filter(item => item !== content)]
          return newHistory.slice(0, 50) // Keep last 50 items
        })
        setHistoryIndex(-1)
      }

      // Clear input
      setInputValue('')

      // Trigger callback
      onMessageSent(userMessage)

      // Simulate typing
      simulateTyping()

      // Prepare context for AI
      const context = chatManager.getConversationContext(true, true)
      
      // Create abort controller for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // Call AI API
      let aiResponse
      try {
        // Use existing explainPacket API for now, can be extended
        if (type === 'packet-analysis' && packetIds.length > 0) {
          // Get packet data from context
          const packets = context.packets?.filter(p => packetIds.includes(p.id || p.ts))
          if (packets && packets.length > 0) {
            aiResponse = await explainPacket(packets[0])
          } else {
            throw new Error('Packet data not found for analysis')
          }
        } else {
          // Generic chat - simulate AI response for now
          aiResponse = await simulateAIResponse(content, context)
        }

        // Stop typing indicator
        setIsTyping(false)
        setTypingUsers([])

        // Add AI response
        const assistantMessage = chatManager.addMessage({
          content: aiResponse.explanation || aiResponse.response || aiResponse,
          type: aiResponse.type || 'text',
          role: 'assistant',
          analysis: aiResponse.analysis || null,
          quickActions: generateQuickActions(aiResponse, context),
          metadata: {
            confidence: aiResponse.confidence || null,
            processingTime: aiResponse.processingTime || null,
            tokens: aiResponse.tokens || null
          }
        })

        // Update local state
        const finalConversation = chatManager.getCurrentConversation()
        setCurrentConversation(finalConversation)
        setMessages(finalConversation.messages)

        // Trigger callback
        onMessageReceived(assistantMessage)

        // Reset retry counter
        retryCountRef.current = 0

        return assistantMessage

      } catch (apiError) {
        console.error('AI API error:', apiError)
        
        // Stop typing indicator
        setIsTyping(false)
        setTypingUsers([])

        // Handle retries
        if (retryCountRef.current < maxRetries && !abortControllerRef.current?.signal.aborted) {
          retryCountRef.current++
          console.log(`Retrying AI request (${retryCountRef.current}/${maxRetries})...`)
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current))
          
          // Retry
          return sendMessage(content, options)
        }

        // Add error message
        const errorMessage = chatManager.addMessage({
          content: `I apologize, but I'm having trouble processing your request right now. ${apiError.message || 'Please try again later.'}`,
          type: 'error',
          role: 'system',
          metadata: {
            error: apiError.message,
            retryCount: retryCountRef.current
          }
        })

        const errorConversation = chatManager.getCurrentConversation()
        setCurrentConversation(errorConversation)
        setMessages(errorConversation.messages)

        setError(apiError)
        onError(apiError)

        return errorMessage
      }

    } catch (error) {
      console.error('Send message error:', error)
      setError(error)
      onError(error)
      
      setIsTyping(false)
      setTypingUsers([])
      
      return null
    } finally {
      setIsLoading(false)
    }
  }, [maxRetries, onError, onMessageSent, onMessageReceived, simulateTyping])

  // Simulate AI response (replace with actual AI integration)
  const simulateAIResponse = async (message, context) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const lowerMessage = message.toLowerCase()
    
    // Context-aware responses
    if (lowerMessage.includes('packet') || lowerMessage.includes('traffic')) {
      return {
        response: `I can help you analyze network packets. I see you have ${context.packets?.length || 0} packets in the current context. You can ask me to explain specific packets, identify anomalies, or provide insights about traffic patterns.`,
        type: 'analysis',
        confidence: 0.9
      }
    }
    
    if (lowerMessage.includes('anomaly') || lowerMessage.includes('suspicious')) {
      return {
        response: 'I can help identify potential security threats and anomalies in your network traffic. Share some packet data with me, and I\'ll analyze it for unusual patterns, potential attacks, or suspicious behavior.',
        type: 'analysis',
        confidence: 0.85
      }
    }

    if (lowerMessage.includes('protocol')) {
      return {
        response: 'I can explain various network protocols including TCP, UDP, HTTP, DNS, and many others. I can also help you understand protocol-specific behaviors and potential issues in your packet captures.',
        type: 'analysis',
        confidence: 0.9
      }
    }

    // Generic responses
    const responses = [
      'I\'m here to help you analyze network traffic and understand packet data. What would you like to explore?',
      'I can provide insights into network protocols, security analysis, and traffic patterns. How can I assist you today?',
      'Feel free to ask me about packet analysis, network troubleshooting, or security concerns. I\'m here to help!',
      'I specialize in network packet analysis and can help explain complex network behaviors. What would you like to know?'
    ]

    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      type: 'text',
      confidence: 0.7
    }
  }

  // Generate quick action buttons based on response
  const generateQuickActions = (response, context) => {
    const actions = []

    if (response.type === 'analysis') {
      actions.push(
        { id: 'explain-more', label: '📊 Explain More', action: 'explain-details' },
        { id: 'show-examples', label: '💡 Show Examples', action: 'show-examples' }
      )
    }

    if (context.packets && context.packets.length > 0) {
      actions.push(
        { id: 'analyze-packets', label: '🔍 Analyze Packets', action: 'analyze-packets' },
        { id: 'find-anomalies', label: '⚠️ Find Anomalies', action: 'find-anomalies' }
      )
    }

    actions.push(
      { id: 'new-topic', label: '💬 New Topic', action: 'new-topic' },
      { id: 'export-chat', label: '📥 Export Chat', action: 'export-chat' }
    )

    return actions
  }

  // Handle quick actions
  const handleQuickAction = useCallback(async (actionId, actionData = {}) => {
    switch (actionId) {
      case 'explain-details':
        return sendMessage('Can you provide more detailed information about this?', { skipHistory: true })
      
      case 'show-examples':
        return sendMessage('Can you show me some examples?', { skipHistory: true })
      
      case 'analyze-packets':
        const context = chatManager.getConversationContext()
        if (context.packets && context.packets.length > 0) {
          return sendMessage(`Please analyze these ${context.packets.length} packets`, {
            type: 'packet-analysis',
            packetIds: context.packets.map(p => p.id || p.ts),
            skipHistory: true
          })
        }
        break
      
      case 'find-anomalies':
        return sendMessage('Please scan the current packets for any anomalies or suspicious activity', { skipHistory: true })
      
      case 'new-topic':
        return sendMessage('Let\'s start a new discussion. What would you like to explore?', { skipHistory: true })
      
      case 'export-chat':
        return exportConversation()
      
      default:
        console.log('Unknown quick action:', actionId)
    }
  }, [sendMessage])

  // Input change handler
  const handleInputChange = useCallback((value) => {
    setInputValue(value)
    setHistoryIndex(-1)
  }, [])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (inputValue.trim()) {
        sendMessage(inputValue)
      }
    } else if (event.key === 'ArrowUp' && inputHistory.length > 0) {
      event.preventDefault()
      const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1)
      setHistoryIndex(newIndex)
      setInputValue(inputHistory[newIndex])
    } else if (event.key === 'ArrowDown' && historyIndex > -1) {
      event.preventDefault()
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInputValue(newIndex >= 0 ? inputHistory[newIndex] : '')
    } else if (event.key === 'Escape') {
      setInputValue('')
      setHistoryIndex(-1)
    }
  }, [inputValue, inputHistory, historyIndex, sendMessage])

  // Create new conversation
  const createNewConversation = useCallback((title, context = {}) => {
    const conversation = chatManager.createConversation(title, context)
    setCurrentConversation(conversation)
    setMessages(conversation.messages)
    return conversation
  }, [])

  // Switch conversation
  const switchConversation = useCallback((conversationId) => {
    const conversation = chatManager.switchConversation(conversationId)
    if (conversation) {
      setCurrentConversation(conversation)
      setMessages(conversation.messages)
    }
    return conversation
  }, [])

  // Add packets to conversation context
  const addPacketsToContext = useCallback((packets) => {
    return chatManager.addPacketsToContext(packets)
  }, [])

  // Export current conversation
  const exportConversation = useCallback((format = 'json') => {
    if (!currentConversation) return null

    const exportData = chatManager.exportConversation(currentConversation.id, format)
    
    // Create download
    const filename = `chat_${currentConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`
    const blob = new Blob([exportData], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return exportData
  }, [currentConversation])

  // Get conversation list
  const getAllConversations = useCallback(() => {
    return chatManager.getAllConversations()
  }, [])

  // Search conversations
  const searchConversations = useCallback((query, filters) => {
    return chatManager.searchConversations(query, filters)
  }, [])

  // Delete conversation
  const deleteConversation = useCallback((conversationId) => {
    const result = chatManager.deleteConversation(conversationId)
    
    // If current conversation was deleted, update state
    if (result && conversationId === currentConversation?.id) {
      const conversations = chatManager.getAllConversations()
      if (conversations.length > 0) {
        const newConversation = conversations[0]
        setCurrentConversation(newConversation)
        setMessages(newConversation.messages)
      } else {
        setCurrentConversation(null)
        setMessages([])
      }
    }
    
    return result
  }, [currentConversation])

  // Clear input
  const clearInput = useCallback(() => {
    setInputValue('')
    setHistoryIndex(-1)
  }, [])

  // Retry last message
  const retryLastMessage = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find(msg => msg.role === 'user')
      
      if (lastUserMessage) {
        return sendMessage(lastUserMessage.content, {
          type: lastUserMessage.type,
          packetIds: lastUserMessage.metadata?.packetIds || [],
          skipHistory: true
        })
      }
    }
    return null
  }, [messages, sendMessage])

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    currentConversation,
    messages,
    isLoading,
    isTyping,
    typingUsers,
    error,
    connectionStatus,
    inputValue,
    inputHistory,

    // Actions
    sendMessage,
    handleQuickAction,
    handleInputChange,
    handleKeyDown,
    clearInput,
    retryLastMessage,

    // Conversation management
    createNewConversation,
    switchConversation,
    deleteConversation,
    exportConversation,
    getAllConversations,
    searchConversations,

    // Context management
    addPacketsToContext,

    // Utilities
    chatManager
  }
}

export default useAIChat