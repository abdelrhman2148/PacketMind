// Chat management utility for AI Shark
class ChatManager {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.conversations = new Map()
    this.currentConversationId = null
    this.maxHistoryLength = 100
    this.storageKey = 'ai-shark-chat-history'
    this.contextWindow = 10 // Number of recent messages to include in context
    
    // Load existing conversations from storage
    this.loadConversations()
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate unique conversation ID
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Create a new conversation
  createConversation(title = null, context = {}) {
    const conversationId = this.generateConversationId()
    const conversation = {
      id: conversationId,
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      created: Date.now(),
      updated: Date.now(),
      messages: [],
      context: {
        sessionId: this.sessionId,
        packets: [],
        filters: {},
        analysis: {},
        ...context
      },
      metadata: {
        messageCount: 0,
        lastActivity: Date.now(),
        tags: [],
        starred: false,
        archived: false
      }
    }

    this.conversations.set(conversationId, conversation)
    this.currentConversationId = conversationId
    this.saveConversations()
    
    return conversation
  }

  // Get conversation by ID
  getConversation(conversationId) {
    return this.conversations.get(conversationId)
  }

  // Get current conversation
  getCurrentConversation() {
    if (!this.currentConversationId) {
      return this.createConversation()
    }
    return this.conversations.get(this.currentConversationId)
  }

  // Switch to a different conversation
  switchConversation(conversationId) {
    if (this.conversations.has(conversationId)) {
      this.currentConversationId = conversationId
      return this.conversations.get(conversationId)
    }
    return null
  }

  // Add message to current conversation
  addMessage(message) {
    const conversation = this.getCurrentConversation()
    if (!conversation) return null

    const messageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: message.content || '',
      type: message.type || 'text', // text, code, analysis, system, error
      role: message.role || 'user', // user, assistant, system
      timestamp: Date.now(),
      metadata: {
        packetIds: message.packetIds || [],
        analysis: message.analysis || null,
        quickActions: message.quickActions || [],
        attachments: message.attachments || [],
        reactions: [],
        edited: false,
        editHistory: []
      },
      ...message
    }

    conversation.messages.push(messageObj)
    conversation.updated = Date.now()
    conversation.metadata.messageCount = conversation.messages.length
    conversation.metadata.lastActivity = Date.now()

    // Trim conversation if it gets too long
    if (conversation.messages.length > this.maxHistoryLength) {
      conversation.messages = conversation.messages.slice(-this.maxHistoryLength)
    }

    this.saveConversations()
    return messageObj
  }

  // Update message
  updateMessage(messageId, updates) {
    const conversation = this.getCurrentConversation()
    if (!conversation) return null

    const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return null

    const originalMessage = conversation.messages[messageIndex]
    
    // Track edit history
    if (updates.content && updates.content !== originalMessage.content) {
      if (!originalMessage.metadata.editHistory) {
        originalMessage.metadata.editHistory = []
      }
      originalMessage.metadata.editHistory.push({
        content: originalMessage.content,
        timestamp: originalMessage.timestamp,
        editedAt: Date.now()
      })
      originalMessage.metadata.edited = true
    }

    // Apply updates
    conversation.messages[messageIndex] = {
      ...originalMessage,
      ...updates,
      metadata: {
        ...originalMessage.metadata,
        ...updates.metadata
      }
    }

    conversation.updated = Date.now()
    this.saveConversations()
    
    return conversation.messages[messageIndex]
  }

  // Delete message
  deleteMessage(messageId) {
    const conversation = this.getCurrentConversation()
    if (!conversation) return false

    const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return false

    conversation.messages.splice(messageIndex, 1)
    conversation.metadata.messageCount = conversation.messages.length
    conversation.updated = Date.now()
    
    this.saveConversations()
    return true
  }

  // Get conversation context for AI
  getConversationContext(includePackets = true, includeAnalysis = true) {
    const conversation = this.getCurrentConversation()
    if (!conversation) return {}

    // Get recent messages for context
    const recentMessages = conversation.messages
      .slice(-this.contextWindow)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        type: msg.type,
        timestamp: msg.timestamp,
        packetIds: msg.metadata.packetIds || []
      }))

    const context = {
      conversationId: conversation.id,
      sessionId: this.sessionId,
      messageCount: conversation.metadata.messageCount,
      recentMessages,
      timestamp: Date.now()
    }

    if (includePackets && conversation.context.packets) {
      context.packets = conversation.context.packets
    }

    if (includeAnalysis && conversation.context.analysis) {
      context.analysis = conversation.context.analysis
    }

    return context
  }

  // Update conversation context
  updateConversationContext(updates) {
    const conversation = this.getCurrentConversation()
    if (!conversation) return false

    conversation.context = {
      ...conversation.context,
      ...updates
    }

    conversation.updated = Date.now()
    this.saveConversations()
    return true
  }

  // Add packets to conversation context
  addPacketsToContext(packets) {
    const conversation = this.getCurrentConversation()
    if (!conversation) return false

    if (!conversation.context.packets) {
      conversation.context.packets = []
    }

    // Add new packets, avoiding duplicates
    const existingIds = new Set(conversation.context.packets.map(p => p.id || p.ts))
    const newPackets = packets.filter(p => !existingIds.has(p.id || p.ts))
    
    conversation.context.packets = [...conversation.context.packets, ...newPackets]
    
    // Limit packet context size
    if (conversation.context.packets.length > 50) {
      conversation.context.packets = conversation.context.packets.slice(-50)
    }

    this.saveConversations()
    return true
  }

  // Get all conversations
  getAllConversations() {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updated - a.updated)
  }

  // Search conversations
  searchConversations(query, filters = {}) {
    const conversations = this.getAllConversations()
    const lowercaseQuery = query.toLowerCase()

    return conversations.filter(conversation => {
      // Text search
      const titleMatch = conversation.title.toLowerCase().includes(lowercaseQuery)
      const messageMatch = conversation.messages.some(msg => 
        msg.content.toLowerCase().includes(lowercaseQuery)
      )

      let matches = titleMatch || messageMatch

      // Apply filters
      if (filters.starred !== undefined) {
        matches = matches && conversation.metadata.starred === filters.starred
      }

      if (filters.archived !== undefined) {
        matches = matches && conversation.metadata.archived === filters.archived
      }

      if (filters.tags && filters.tags.length > 0) {
        matches = matches && filters.tags.some(tag => 
          conversation.metadata.tags.includes(tag)
        )
      }

      if (filters.dateFrom) {
        matches = matches && conversation.created >= filters.dateFrom
      }

      if (filters.dateTo) {
        matches = matches && conversation.created <= filters.dateTo
      }

      return matches
    })
  }

  // Export conversation
  exportConversation(conversationId, format = 'json') {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return null

    const exportData = {
      conversation,
      exportedAt: Date.now(),
      exportedBy: this.sessionId,
      format
    }

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2)
      
      case 'markdown':
        return this.conversationToMarkdown(conversation)
      
      case 'text':
        return this.conversationToText(conversation)
      
      default:
        return exportData
    }
  }

  // Convert conversation to markdown
  conversationToMarkdown(conversation) {
    let markdown = `# ${conversation.title}\n\n`
    markdown += `**Created:** ${new Date(conversation.created).toLocaleString()}\n`
    markdown += `**Messages:** ${conversation.metadata.messageCount}\n\n`

    conversation.messages.forEach(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString()
      const role = msg.role === 'user' ? '👤 User' : '🤖 AI Assistant'
      
      markdown += `## ${role} (${timestamp})\n\n`
      
      if (msg.type === 'code') {
        markdown += '```\n' + msg.content + '\n```\n\n'
      } else {
        markdown += msg.content + '\n\n'
      }
    })

    return markdown
  }

  // Convert conversation to plain text
  conversationToText(conversation) {
    let text = `${conversation.title}\n`
    text += `Created: ${new Date(conversation.created).toLocaleString()}\n`
    text += `Messages: ${conversation.metadata.messageCount}\n\n`

    conversation.messages.forEach(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString()
      const role = msg.role === 'user' ? 'User' : 'AI Assistant'
      
      text += `[${timestamp}] ${role}: ${msg.content}\n\n`
    })

    return text
  }

  // Delete conversation
  deleteConversation(conversationId) {
    if (this.conversations.has(conversationId)) {
      this.conversations.delete(conversationId)
      
      // Switch to another conversation if current one was deleted
      if (this.currentConversationId === conversationId) {
        const conversations = this.getAllConversations()
        this.currentConversationId = conversations.length > 0 ? conversations[0].id : null
      }
      
      this.saveConversations()
      return true
    }
    return false
  }

  // Archive/unarchive conversation
  toggleConversationArchive(conversationId) {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return false

    conversation.metadata.archived = !conversation.metadata.archived
    conversation.updated = Date.now()
    this.saveConversations()
    
    return conversation.metadata.archived
  }

  // Star/unstar conversation
  toggleConversationStar(conversationId) {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return false

    conversation.metadata.starred = !conversation.metadata.starred
    conversation.updated = Date.now()
    this.saveConversations()
    
    return conversation.metadata.starred
  }

  // Add tags to conversation
  addConversationTags(conversationId, tags) {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return false

    const newTags = Array.isArray(tags) ? tags : [tags]
    conversation.metadata.tags = [...new Set([...conversation.metadata.tags, ...newTags])]
    conversation.updated = Date.now()
    this.saveConversations()
    
    return true
  }

  // Remove tags from conversation
  removeConversationTags(conversationId, tags) {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return false

    const tagsToRemove = Array.isArray(tags) ? tags : [tags]
    conversation.metadata.tags = conversation.metadata.tags.filter(tag => 
      !tagsToRemove.includes(tag)
    )
    conversation.updated = Date.now()
    this.saveConversations()
    
    return true
  }

  // Get conversation statistics
  getStatistics() {
    const conversations = this.getAllConversations()
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.metadata.messageCount, 0)
    
    return {
      totalConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0,
      oldestConversation: conversations.length > 0 ? Math.min(...conversations.map(c => c.created)) : null,
      newestConversation: conversations.length > 0 ? Math.max(...conversations.map(c => c.created)) : null,
      starredConversations: conversations.filter(c => c.metadata.starred).length,
      archivedConversations: conversations.filter(c => c.metadata.archived).length,
      allTags: [...new Set(conversations.flatMap(c => c.metadata.tags))]
    }
  }

  // Clear all conversations
  clearAllConversations() {
    this.conversations.clear()
    this.currentConversationId = null
    this.saveConversations()
  }

  // Save conversations to localStorage
  saveConversations() {
    try {
      const data = {
        conversations: Array.from(this.conversations.entries()),
        currentConversationId: this.currentConversationId,
        sessionId: this.sessionId,
        lastSaved: Date.now()
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save chat conversations:', error)
    }
  }

  // Load conversations from localStorage
  loadConversations() {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        
        if (parsed.conversations) {
          this.conversations = new Map(parsed.conversations)
        }
        
        if (parsed.currentConversationId) {
          this.currentConversationId = parsed.currentConversationId
        }
        
        console.log(`Loaded ${this.conversations.size} chat conversations`)
      }
    } catch (error) {
      console.warn('Failed to load chat conversations:', error)
      this.conversations = new Map()
    }
  }
}

// Export singleton instance
export const chatManager = new ChatManager()
export default chatManager