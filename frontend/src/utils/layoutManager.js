// Layout Management Utility for Drag and Drop Interfaces

export class LayoutManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'ai-shark-layouts'
    this.version = options.version || '1.0.0'
    this.compression = options.compression || false
    this.encryption = options.encryption || false
    this.validateLayouts = options.validateLayouts || true
    this.autoSave = options.autoSave !== false
    this.debounceTime = options.debounceTime || 500
    this.maxHistorySize = options.maxHistorySize || 20
    
    this.layouts = new Map()
    this.history = []
    this.currentHistoryIndex = -1
    this.saveTimeout = null
    this.subscribers = new Set()
    
    this.loadLayouts()
  }

  // Core layout operations
  saveLayout(name, layout, metadata = {}) {
    try {
      const layoutData = {
        name,
        layout: this.validateLayouts ? this.validateLayout(layout) : layout,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          version: this.version,
          id: this.generateId()
        },
        timestamp: Date.now()
      }

      this.layouts.set(name, layoutData)
      
      if (this.autoSave) {
        this.debouncedSave()
      }

      // Add to history
      this.addToHistory({
        action: 'save',
        layout: name,
        data: layoutData,
        timestamp: Date.now()
      })

      this.notifySubscribers('layoutSaved', { name, layout: layoutData })
      
      return layoutData
    } catch (error) {
      console.error('Failed to save layout:', error)
      throw new Error(`Failed to save layout "${name}": ${error.message}`)
    }
  }

  loadLayout(name) {
    const layout = this.layouts.get(name)
    if (!layout) {
      throw new Error(`Layout "${name}" not found`)
    }

    this.addToHistory({
      action: 'load',
      layout: name,
      data: layout,
      timestamp: Date.now()
    })

    this.notifySubscribers('layoutLoaded', { name, layout })
    return layout
  }

  deleteLayout(name) {
    const layout = this.layouts.get(name)
    if (!layout) {
      throw new Error(`Layout "${name}" not found`)
    }

    this.layouts.delete(name)
    
    if (this.autoSave) {
      this.debouncedSave()
    }

    this.addToHistory({
      action: 'delete',
      layout: name,
      data: layout,
      timestamp: Date.now()
    })

    this.notifySubscribers('layoutDeleted', { name, layout })
    return layout
  }

  // Layout listing and management
  listLayouts(filter = {}) {
    const layouts = Array.from(this.layouts.values())
    
    let filtered = layouts
    
    if (filter.tags) {
      filtered = filtered.filter(layout => 
        filter.tags.every(tag => layout.metadata.tags?.includes(tag))
      )
    }
    
    if (filter.createdAfter) {
      filtered = filtered.filter(layout => 
        new Date(layout.metadata.createdAt) > new Date(filter.createdAfter)
      )
    }
    
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase()
      filtered = filtered.filter(layout => 
        layout.name.toLowerCase().includes(searchTerm) ||
        layout.metadata.description?.toLowerCase().includes(searchTerm)
      )
    }
    
    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Layout duplication and templating
  duplicateLayout(sourceName, newName, modifications = {}) {
    const sourceLayout = this.loadLayout(sourceName)
    
    const duplicatedLayout = {
      ...JSON.parse(JSON.stringify(sourceLayout.layout)),
      ...modifications
    }
    
    return this.saveLayout(newName, duplicatedLayout, {
      ...sourceLayout.metadata,
      duplicatedFrom: sourceName,
      description: `Copy of ${sourceName}`
    })
  }

  createTemplate(name, layout, metadata = {}) {
    return this.saveLayout(name, layout, {
      ...metadata,
      isTemplate: true,
      description: metadata.description || `Template: ${name}`
    })
  }

  applyTemplate(templateName, targetName, customizations = {}) {
    const template = this.loadLayout(templateName)
    
    if (!template.metadata.isTemplate) {
      console.warn(`Layout "${templateName}" is not marked as a template`)
    }
    
    const appliedLayout = {
      ...JSON.parse(JSON.stringify(template.layout)),
      ...customizations
    }
    
    return this.saveLayout(targetName, appliedLayout, {
      appliedTemplate: templateName,
      description: `Applied template: ${templateName}`
    })
  }

  // Layout validation
  validateLayout(layout) {
    if (!layout || typeof layout !== 'object') {
      throw new Error('Layout must be an object')
    }

    // Validate required properties
    const requiredFields = ['items', 'config']
    for (const field of requiredFields) {
      if (!(field in layout)) {
        throw new Error(`Layout missing required field: ${field}`)
      }
    }

    // Validate items array
    if (!Array.isArray(layout.items)) {
      throw new Error('Layout items must be an array')
    }

    // Validate each item
    layout.items.forEach((item, index) => {
      this.validateLayoutItem(item, index)
    })

    // Validate config
    this.validateLayoutConfig(layout.config)

    return layout
  }

  validateLayoutItem(item, index) {
    const requiredFields = ['id', 'x', 'y', 'w', 'h']
    for (const field of requiredFields) {
      if (!(field in item)) {
        throw new Error(`Layout item ${index} missing required field: ${field}`)
      }
    }

    // Validate coordinates and dimensions
    if (typeof item.x !== 'number' || item.x < 0) {
      throw new Error(`Layout item ${index} has invalid x coordinate`)
    }
    if (typeof item.y !== 'number' || item.y < 0) {
      throw new Error(`Layout item ${index} has invalid y coordinate`)
    }
    if (typeof item.w !== 'number' || item.w <= 0) {
      throw new Error(`Layout item ${index} has invalid width`)
    }
    if (typeof item.h !== 'number' || item.h <= 0) {
      throw new Error(`Layout item ${index} has invalid height`)
    }

    // Check for overlaps
    const conflicts = this.findConflicts(item, index)
    if (conflicts.length > 0) {
      console.warn(`Layout item ${index} conflicts with items: ${conflicts.join(', ')}`)
    }
  }

  validateLayoutConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Layout config must be an object')
    }

    // Validate breakpoints if present
    if (config.breakpoints) {
      for (const [breakpoint, width] of Object.entries(config.breakpoints)) {
        if (typeof width !== 'number' || width < 0) {
          throw new Error(`Invalid breakpoint width for ${breakpoint}`)
        }
      }
    }
  }

  // Conflict detection
  findConflicts(item, itemIndex, layout = null) {
    const items = layout?.items || Array.from(this.layouts.values())[0]?.layout?.items || []
    const conflicts = []

    items.forEach((otherItem, otherIndex) => {
      if (otherIndex === itemIndex) return

      if (this.itemsOverlap(item, otherItem)) {
        conflicts.push(otherIndex)
      }
    })

    return conflicts
  }

  itemsOverlap(item1, item2) {
    return !(
      item1.x + item1.w <= item2.x ||
      item2.x + item2.w <= item1.x ||
      item1.y + item1.h <= item2.y ||
      item2.y + item2.h <= item1.y
    )
  }

  // Layout optimization
  optimizeLayout(layout, options = {}) {
    const {
      compactType = 'vertical',
      preventCollision = false,
      allowOverlap = false
    } = options

    const optimized = JSON.parse(JSON.stringify(layout))
    
    if (compactType === 'vertical') {
      this.compactVertical(optimized.items, allowOverlap)
    } else if (compactType === 'horizontal') {
      this.compactHorizontal(optimized.items, allowOverlap)
    }

    if (!allowOverlap && !preventCollision) {
      this.resolveCollisions(optimized.items)
    }

    return optimized
  }

  compactVertical(items, allowOverlap = false) {
    const sorted = items.sort((a, b) => a.y - b.y || a.x - b.x)
    
    sorted.forEach(item => {
      if (allowOverlap) {
        item.y = this.findLowestYPosition(item, sorted)
      } else {
        item.y = this.findSafeYPosition(item, sorted)
      }
    })
  }

  compactHorizontal(items, allowOverlap = false) {
    const sorted = items.sort((a, b) => a.x - b.x || a.y - b.y)
    
    sorted.forEach(item => {
      if (allowOverlap) {
        item.x = this.findLowestXPosition(item, sorted)
      } else {
        item.x = this.findSafeXPosition(item, sorted)
      }
    })
  }

  findSafeYPosition(item, items) {
    let y = 0
    const conflictingItems = items.filter(other => 
      other !== item && 
      !(item.x + item.w <= other.x || other.x + other.w <= item.x)
    )

    conflictingItems.forEach(other => {
      if (other.y + other.h > y) {
        y = other.y + other.h
      }
    })

    return y
  }

  findSafeXPosition(item, items) {
    let x = 0
    const conflictingItems = items.filter(other => 
      other !== item && 
      !(item.y + item.h <= other.y || other.y + other.h <= item.y)
    )

    conflictingItems.forEach(other => {
      if (other.x + other.w > x) {
        x = other.x + other.w
      }
    })

    return x
  }

  resolveCollisions(items) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (this.itemsOverlap(items[i], items[j])) {
          // Move the second item down
          items[j].y = items[i].y + items[i].h
        }
      }
    }
  }

  // History management
  addToHistory(action) {
    // Remove any history after current index
    this.history = this.history.slice(0, this.currentHistoryIndex + 1)
    
    // Add new action
    this.history.push(action)
    this.currentHistoryIndex++
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
      this.currentHistoryIndex--
    }
    
    this.notifySubscribers('historyUpdated', { 
      history: this.history, 
      currentIndex: this.currentHistoryIndex 
    })
  }

  undo() {
    if (this.currentHistoryIndex <= 0) {
      throw new Error('Nothing to undo')
    }
    
    this.currentHistoryIndex--
    const action = this.history[this.currentHistoryIndex]
    
    this.notifySubscribers('undo', action)
    return action
  }

  redo() {
    if (this.currentHistoryIndex >= this.history.length - 1) {
      throw new Error('Nothing to redo')
    }
    
    this.currentHistoryIndex++
    const action = this.history[this.currentHistoryIndex]
    
    this.notifySubscribers('redo', action)
    return action
  }

  // Persistence
  debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    
    this.saveTimeout = setTimeout(() => {
      this.persistLayouts()
    }, this.debounceTime)
  }

  persistLayouts() {
    try {
      const data = {
        version: this.version,
        timestamp: Date.now(),
        layouts: Object.fromEntries(this.layouts),
        history: this.history.slice(-10) // Only save last 10 history items
      }

      let serialized = JSON.stringify(data)
      
      if (this.compression) {
        serialized = this.compress(serialized)
      }
      
      if (this.encryption) {
        serialized = this.encrypt(serialized)
      }

      localStorage.setItem(this.storageKey, serialized)
      this.notifySubscribers('layoutsPersisted', { layouts: this.layouts.size })
    } catch (error) {
      console.error('Failed to persist layouts:', error)
      this.notifySubscribers('persistError', error)
    }
  }

  loadLayouts() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return

      let data = stored
      
      if (this.encryption) {
        data = this.decrypt(data)
      }
      
      if (this.compression) {
        data = this.decompress(data)
      }

      const parsed = JSON.parse(data)
      
      // Handle version migration if needed
      if (parsed.version !== this.version) {
        this.migrateLayouts(parsed)
      }

      this.layouts = new Map(Object.entries(parsed.layouts || {}))
      this.history = parsed.history || []
      this.currentHistoryIndex = this.history.length - 1

      this.notifySubscribers('layoutsLoaded', { 
        layouts: this.layouts.size,
        version: parsed.version 
      })
    } catch (error) {
      console.error('Failed to load layouts:', error)
      this.notifySubscribers('loadError', error)
    }
  }

  // Migration support
  migrateLayouts(oldData) {
    console.log(`Migrating layouts from version ${oldData.version} to ${this.version}`)
    
    // Add migration logic here based on version differences
    switch (oldData.version) {
      case '0.9.0':
        // Migration from v0.9.0 to current version
        this.migrateFromV09(oldData)
        break
      default:
        console.warn(`No migration path from version ${oldData.version}`)
    }
  }

  migrateFromV09(oldData) {
    // Example migration logic
    if (oldData.layouts) {
      for (const [name, layout] of Object.entries(oldData.layouts)) {
        // Add new fields, transform structure, etc.
        layout.metadata = layout.metadata || {}
        layout.metadata.version = this.version
      }
    }
  }

  // Event subscription
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        console.error('Subscriber callback error:', error)
      }
    })
  }

  // Utility methods
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  compress(data) {
    // Simple compression - in real implementation, use a proper compression library
    return btoa(data)
  }

  decompress(data) {
    return atob(data)
  }

  encrypt(data) {
    // Simple encryption - in real implementation, use proper encryption
    return btoa(data)
  }

  decrypt(data) {
    return atob(data)
  }

  // Export/Import
  exportLayout(name, format = 'json') {
    const layout = this.loadLayout(name)
    
    switch (format) {
      case 'json':
        return JSON.stringify(layout, null, 2)
      case 'yaml':
        // Would use a YAML library in real implementation
        return this.toYAML(layout)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  importLayout(data, format = 'json', name = null) {
    let layout
    
    switch (format) {
      case 'json':
        layout = JSON.parse(data)
        break
      case 'yaml':
        layout = this.fromYAML(data)
        break
      default:
        throw new Error(`Unsupported import format: ${format}`)
    }
    
    const layoutName = name || layout.name || `imported-${Date.now()}`
    return this.saveLayout(layoutName, layout.layout, layout.metadata)
  }

  toYAML(obj) {
    // Simplified YAML serialization
    return JSON.stringify(obj, null, 2).replace(/"/g, '').replace(/,/g, '')
  }

  fromYAML(yaml) {
    // Simplified YAML parsing - use proper YAML library in production
    try {
      return JSON.parse(yaml.replace(/(\w+):/g, '"$1":'))
    } catch {
      throw new Error('Invalid YAML format')
    }
  }

  // Statistics and analytics
  getStatistics() {
    const layouts = Array.from(this.layouts.values())
    
    return {
      totalLayouts: layouts.length,
      templates: layouts.filter(l => l.metadata.isTemplate).length,
      mostRecentlyUsed: layouts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5),
      averageItems: layouts.reduce((sum, l) => sum + (l.layout.items?.length || 0), 0) / layouts.length,
      creationDates: layouts.map(l => l.metadata.createdAt),
      tags: this.getAllTags(),
      historySize: this.history.length
    }
  }

  getAllTags() {
    const tags = new Set()
    Array.from(this.layouts.values()).forEach(layout => {
      if (layout.metadata.tags) {
        layout.metadata.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags)
  }

  // Cleanup
  cleanup() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.subscribers.clear()
  }
}

// Default instance
export const defaultLayoutManager = new LayoutManager()

// Helper functions
export const createLayoutManager = (options) => new LayoutManager(options)

export const saveLayout = (name, layout, metadata) => 
  defaultLayoutManager.saveLayout(name, layout, metadata)

export const loadLayout = (name) => 
  defaultLayoutManager.loadLayout(name)

export const deleteLayout = (name) => 
  defaultLayoutManager.deleteLayout(name)

export const listLayouts = (filter) => 
  defaultLayoutManager.listLayouts(filter)

export const optimizeLayout = (layout, options) => 
  defaultLayoutManager.optimizeLayout(layout, options)

export default LayoutManager