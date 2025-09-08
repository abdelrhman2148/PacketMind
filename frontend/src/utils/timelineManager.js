// Timeline Manager for Packet History Playback
// Handles data buffering, segmentation, and timeline operations for captured packets

export class TimelineManager {
  constructor(options = {}) {
    this.maxBufferSize = options.maxBufferSize || 10000 // Maximum packets in buffer
    this.segmentDuration = options.segmentDuration || 60000 // 1 minute segments (ms)
    this.compressionRatio = options.compressionRatio || 0.1 // For old data compression
    this.anomalyThreshold = options.anomalyThreshold || 2.0 // Z-score threshold
    this.autoCleanup = options.autoCleanup !== false
    this.storageKey = options.storageKey || 'ai-shark-timeline'
    
    // Data structures
    this.packets = new Map() // timestamp -> packet data
    this.segments = new Map() // segmentId -> segment metadata
    this.anomalies = new Map() // timestamp -> anomaly data
    this.bookmarks = new Map() // timestamp -> bookmark data
    this.markers = new Map() // timestamp -> marker data
    
    // Timeline bounds
    this.startTime = null
    this.endTime = null
    this.currentTime = null
    
    // Statistics tracking
    this.stats = {
      totalPackets: 0,
      packetsPerSecond: [],
      protocolDistribution: new Map(),
      sizeDistribution: [],
      anomalyCount: 0
    }
    
    // Event subscribers
    this.subscribers = new Set()
    
    // Cleanup timer
    this.cleanupInterval = null
    
    this.initialize()
  }

  // Initialize timeline manager
  initialize() {
    this.loadFromStorage()
    
    if (this.autoCleanup) {
      this.cleanupInterval = setInterval(() => {
        this.performCleanup()
      }, 60000) // Cleanup every minute
    }
  }

  // Add packet to timeline
  addPacket(packet) {
    try {
      const timestamp = this.normalizeTimestamp(packet.ts || Date.now() / 1000)
      
      // Ensure packet has required fields
      const normalizedPacket = {
        ...packet,
        ts: timestamp,
        id: packet.id || `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        size: packet.length || 0,
        protocol: packet.proto || 'UNKNOWN'
      }

      // Add to packets map
      this.packets.set(timestamp, normalizedPacket)
      
      // Update timeline bounds
      if (!this.startTime || timestamp < this.startTime) {
        this.startTime = timestamp
      }
      if (!this.endTime || timestamp > this.endTime) {
        this.endTime = timestamp
      }
      
      // Update current time if this is the latest packet
      if (!this.currentTime || timestamp > this.currentTime) {
        this.currentTime = timestamp
      }

      // Update segments
      this.updateSegment(timestamp, normalizedPacket)
      
      // Update statistics
      this.updateStats(normalizedPacket)
      
      // Check for anomalies
      this.checkForAnomalies(timestamp, normalizedPacket)
      
      // Enforce buffer size limits
      this.enforceBufferLimits()
      
      // Notify subscribers
      this.notifySubscribers('packetAdded', { 
        packet: normalizedPacket, 
        timestamp,
        totalPackets: this.packets.size
      })
      
      return normalizedPacket
    } catch (error) {
      console.error('Error adding packet to timeline:', error)
      throw new Error(`Failed to add packet: ${error.message}`)
    }
  }

  // Add multiple packets efficiently
  addPackets(packets) {
    const addedPackets = []
    
    packets.forEach(packet => {
      try {
        const normalizedPacket = this.addPacket(packet)
        addedPackets.push(normalizedPacket)
      } catch (error) {
        console.warn('Failed to add packet to timeline:', error)
      }
    })
    
    // Single notification for batch operation
    if (addedPackets.length > 0) {
      this.notifySubscribers('packetsAdded', { 
        packets: addedPackets,
        count: addedPackets.length,
        totalPackets: this.packets.size
      })
    }
    
    return addedPackets
  }

  // Get packets within time range
  getPacketsInRange(startTime, endTime, options = {}) {
    const {
      maxResults = 1000,
      sortOrder = 'asc',
      includeMetadata = false
    } = options

    const packets = []
    const normalizedStart = this.normalizeTimestamp(startTime)
    const normalizedEnd = this.normalizeTimestamp(endTime)
    
    for (const [timestamp, packet] of this.packets) {
      if (timestamp >= normalizedStart && timestamp <= normalizedEnd) {
        packets.push(includeMetadata ? {
          packet,
          timestamp,
          segment: this.getSegmentForTime(timestamp),
          hasAnomaly: this.anomalies.has(timestamp),
          hasBookmark: this.bookmarks.has(timestamp),
          hasMarker: this.markers.has(timestamp)
        } : packet)
        
        if (packets.length >= maxResults) break
      }
    }
    
    // Sort packets
    packets.sort((a, b) => {
      const timeA = includeMetadata ? a.timestamp : a.ts
      const timeB = includeMetadata ? b.timestamp : b.ts
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
    })
    
    return packets
  }

  // Get packet at specific time
  getPacketAtTime(timestamp) {
    const normalizedTime = this.normalizeTimestamp(timestamp)
    return this.packets.get(normalizedTime) || null
  }

  // Get nearest packet to timestamp
  getNearestPacket(timestamp, tolerance = 1.0) {
    const normalizedTime = this.normalizeTimestamp(timestamp)
    let nearestPacket = null
    let minDistance = Infinity

    for (const [packetTime, packet] of this.packets) {
      const distance = Math.abs(packetTime - normalizedTime)
      if (distance <= tolerance && distance < minDistance) {
        minDistance = distance
        nearestPacket = packet
      }
    }

    return nearestPacket
  }

  // Update segment information
  updateSegment(timestamp, packet) {
    const segmentId = this.getSegmentId(timestamp)
    
    if (!this.segments.has(segmentId)) {
      this.segments.set(segmentId, {
        id: segmentId,
        startTime: Math.floor(timestamp / (this.segmentDuration / 1000)) * (this.segmentDuration / 1000),
        endTime: Math.floor(timestamp / (this.segmentDuration / 1000)) * (this.segmentDuration / 1000) + (this.segmentDuration / 1000),
        packetCount: 0,
        totalSize: 0,
        protocols: new Set(),
        anomalies: [],
        bookmarks: [],
        markers: []
      })
    }

    const segment = this.segments.get(segmentId)
    segment.packetCount++
    segment.totalSize += packet.size || 0
    segment.protocols.add(packet.protocol)
  }

  // Get segment ID for timestamp
  getSegmentId(timestamp) {
    return Math.floor(timestamp / (this.segmentDuration / 1000))
  }

  // Get segment for timestamp
  getSegmentForTime(timestamp) {
    const segmentId = this.getSegmentId(timestamp)
    return this.segments.get(segmentId) || null
  }

  // Update statistics
  updateStats(packet) {
    this.stats.totalPackets++
    
    // Protocol distribution
    const protocol = packet.protocol
    const currentCount = this.stats.protocolDistribution.get(protocol) || 0
    this.stats.protocolDistribution.set(protocol, currentCount + 1)
    
    // Size distribution (for histogram)
    this.stats.sizeDistribution.push({
      timestamp: packet.ts,
      size: packet.size || 0
    })
    
    // Keep only recent size data (last 1000 packets)
    if (this.stats.sizeDistribution.length > 1000) {
      this.stats.sizeDistribution = this.stats.sizeDistribution.slice(-1000)
    }
    
    // Packets per second calculation
    const currentSecond = Math.floor(packet.ts)
    const lastEntry = this.stats.packetsPerSecond[this.stats.packetsPerSecond.length - 1]
    
    if (lastEntry && lastEntry.timestamp === currentSecond) {
      lastEntry.count++
    } else {
      this.stats.packetsPerSecond.push({
        timestamp: currentSecond,
        count: 1
      })
      
      // Keep only recent data (last 300 seconds = 5 minutes)
      if (this.stats.packetsPerSecond.length > 300) {
        this.stats.packetsPerSecond = this.stats.packetsPerSecond.slice(-300)
      }
    }
  }

  // Anomaly detection using z-score
  checkForAnomalies(timestamp, packet) {
    const currentSecond = Math.floor(timestamp)
    const recentData = this.stats.packetsPerSecond.slice(-30) // Last 30 seconds
    
    if (recentData.length < 10) return // Need enough data for meaningful analysis
    
    // Calculate mean and standard deviation
    const values = recentData.map(d => d.count)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    // Check current packet rate
    const currentRate = this.stats.packetsPerSecond[this.stats.packetsPerSecond.length - 1]?.count || 0
    const zScore = stdDev > 0 ? Math.abs((currentRate - mean) / stdDev) : 0
    
    if (zScore > this.anomalyThreshold) {
      const anomaly = {
        timestamp,
        type: 'traffic_spike',
        severity: zScore > 3 ? 'high' : 'medium',
        description: `Traffic spike detected: ${currentRate} packets/sec (${zScore.toFixed(2)}σ above normal)`,
        zScore,
        currentRate,
        averageRate: mean.toFixed(2),
        packet
      }
      
      this.anomalies.set(timestamp, anomaly)
      this.stats.anomalyCount++
      
      // Update segment
      const segmentId = this.getSegmentId(timestamp)
      const segment = this.segments.get(segmentId)
      if (segment) {
        segment.anomalies.push(anomaly)
      }
      
      this.notifySubscribers('anomalyDetected', anomaly)
    }
  }

  // Bookmark management
  addBookmark(timestamp, label, description = '', category = 'user') {
    const normalizedTime = this.normalizeTimestamp(timestamp)
    const bookmark = {
      timestamp: normalizedTime,
      label,
      description,
      category,
      createdAt: Date.now(),
      id: `bookmark-${normalizedTime}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    this.bookmarks.set(normalizedTime, bookmark)
    
    // Update segment
    const segmentId = this.getSegmentId(normalizedTime)
    const segment = this.segments.get(segmentId)
    if (segment) {
      segment.bookmarks.push(bookmark)
    }
    
    this.notifySubscribers('bookmarkAdded', bookmark)
    this.saveToStorage()
    
    return bookmark
  }

  removeBookmark(timestamp) {
    const normalizedTime = this.normalizeTimestamp(timestamp)
    const bookmark = this.bookmarks.get(normalizedTime)
    
    if (bookmark) {
      this.bookmarks.delete(normalizedTime)
      
      // Update segment
      const segmentId = this.getSegmentId(normalizedTime)
      const segment = this.segments.get(segmentId)
      if (segment) {
        segment.bookmarks = segment.bookmarks.filter(b => b.timestamp !== normalizedTime)
      }
      
      this.notifySubscribers('bookmarkRemoved', bookmark)
      this.saveToStorage()
    }
    
    return bookmark
  }

  // Marker management (for events, alerts, etc.)
  addMarker(timestamp, type, data = {}) {
    const normalizedTime = this.normalizeTimestamp(timestamp)
    const marker = {
      timestamp: normalizedTime,
      type,
      data,
      id: `marker-${normalizedTime}-${type}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    this.markers.set(normalizedTime, marker)
    
    // Update segment
    const segmentId = this.getSegmentId(normalizedTime)
    const segment = this.segments.get(segmentId)
    if (segment) {
      segment.markers.push(marker)
    }
    
    this.notifySubscribers('markerAdded', marker)
    
    return marker
  }

  // Export timeline segment
  exportSegment(startTime, endTime, format = 'json') {
    const packets = this.getPacketsInRange(startTime, endTime, { 
      includeMetadata: true,
      maxResults: Infinity 
    })
    
    const exportData = {
      metadata: {
        startTime,
        endTime,
        totalPackets: packets.length,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      },
      packets,
      anomalies: Array.from(this.anomalies.entries())
        .filter(([ts]) => ts >= startTime && ts <= endTime)
        .map(([timestamp, anomaly]) => ({ timestamp, ...anomaly })),
      bookmarks: Array.from(this.bookmarks.entries())
        .filter(([ts]) => ts >= startTime && ts <= endTime)
        .map(([timestamp, bookmark]) => ({ timestamp, ...bookmark })),
      markers: Array.from(this.markers.entries())
        .filter(([ts]) => ts >= startTime && ts <= endTime)
        .map(([timestamp, marker]) => ({ timestamp, ...marker })),
      stats: this.getStatsForRange(startTime, endTime)
    }
    
    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2)
      case 'csv':
        return this.convertToCSV(exportData.packets)
      case 'pcap':
        // Would require backend support for actual PCAP export
        throw new Error('PCAP export requires backend implementation')
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  // Convert packets to CSV format
  convertToCSV(packets) {
    if (packets.length === 0) return ''
    
    const headers = ['timestamp', 'source', 'destination', 'protocol', 'size', 'summary']
    const rows = packets.map(item => {
      const packet = item.packet || item
      return [
        new Date(packet.ts * 1000).toISOString(),
        packet.src || '',
        packet.dst || '',
        packet.protocol || '',
        packet.size || 0,
        (packet.summary || '').replace(/"/g, '""') // Escape quotes
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    return csvContent
  }

  // Get statistics for time range
  getStatsForRange(startTime, endTime) {
    const packets = this.getPacketsInRange(startTime, endTime)
    const protocolCounts = new Map()
    let totalSize = 0
    
    packets.forEach(packet => {
      const protocol = packet.protocol || 'UNKNOWN'
      protocolCounts.set(protocol, (protocolCounts.get(protocol) || 0) + 1)
      totalSize += packet.size || 0
    })
    
    return {
      totalPackets: packets.length,
      totalSize,
      averageSize: packets.length > 0 ? totalSize / packets.length : 0,
      protocolDistribution: Object.fromEntries(protocolCounts),
      duration: endTime - startTime
    }
  }

  // Buffer management
  enforceBufferLimits() {
    if (this.packets.size <= this.maxBufferSize) return
    
    // Remove oldest packets
    const sortedEntries = Array.from(this.packets.entries()).sort((a, b) => a[0] - b[0])
    const packetsToRemove = sortedEntries.slice(0, this.packets.size - this.maxBufferSize)
    
    packetsToRemove.forEach(([timestamp]) => {
      this.packets.delete(timestamp)
    })
    
    // Update start time
    if (this.packets.size > 0) {
      const remainingTimes = Array.from(this.packets.keys()).sort((a, b) => a - b)
      this.startTime = remainingTimes[0]
    }
    
    this.notifySubscribers('bufferCleaned', { 
      removedCount: packetsToRemove.length,
      remainingCount: this.packets.size 
    })
  }

  // Cleanup old segments and data
  performCleanup() {
    const cutoffTime = Date.now() / 1000 - (24 * 60 * 60) // 24 hours ago
    
    // Cleanup old segments
    for (const [segmentId, segment] of this.segments) {
      if (segment.endTime < cutoffTime) {
        this.segments.delete(segmentId)
      }
    }
    
    // Cleanup old anomalies
    for (const [timestamp] of this.anomalies) {
      if (timestamp < cutoffTime) {
        this.anomalies.delete(timestamp)
      }
    }
    
    // Cleanup old stats
    this.stats.packetsPerSecond = this.stats.packetsPerSecond.filter(
      item => item.timestamp > cutoffTime
    )
    
    this.saveToStorage()
  }

  // Persistence
  saveToStorage() {
    try {
      const data = {
        bookmarks: Array.from(this.bookmarks.entries()),
        markers: Array.from(this.markers.entries()),
        stats: {
          totalPackets: this.stats.totalPackets,
          anomalyCount: this.stats.anomalyCount
        },
        timelineBounds: {
          startTime: this.startTime,
          endTime: this.endTime,
          currentTime: this.currentTime
        },
        savedAt: Date.now()
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save timeline data to storage:', error)
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return
      
      const data = JSON.parse(stored)
      
      // Restore bookmarks and markers
      this.bookmarks = new Map(data.bookmarks || [])
      this.markers = new Map(data.markers || [])
      
      // Restore timeline bounds
      if (data.timelineBounds) {
        this.startTime = data.timelineBounds.startTime
        this.endTime = data.timelineBounds.endTime
        this.currentTime = data.timelineBounds.currentTime
      }
      
      // Restore basic stats
      if (data.stats) {
        this.stats.totalPackets = data.stats.totalPackets || 0
        this.stats.anomalyCount = data.stats.anomalyCount || 0
      }
    } catch (error) {
      console.warn('Failed to load timeline data from storage:', error)
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
        console.error('Timeline subscriber error:', error)
      }
    })
  }

  // Utility methods
  normalizeTimestamp(timestamp) {
    // Ensure timestamp is a number and reasonable
    const ts = typeof timestamp === 'number' ? timestamp : parseFloat(timestamp)
    
    if (isNaN(ts)) {
      throw new Error('Invalid timestamp')
    }
    
    // Convert to seconds if it looks like milliseconds
    return ts > 1e12 ? ts / 1000 : ts
  }

  // Get timeline bounds
  getTimelineBounds() {
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      currentTime: this.currentTime,
      duration: this.endTime && this.startTime ? this.endTime - this.startTime : 0
    }
  }

  // Get current statistics
  getStats() {
    return {
      ...this.stats,
      segments: this.segments.size,
      bookmarks: this.bookmarks.size,
      markers: this.markers.size,
      timelineDuration: this.getTimelineBounds().duration
    }
  }

  // Clear timeline data
  clear() {
    this.packets.clear()
    this.segments.clear()
    this.anomalies.clear()
    this.bookmarks.clear()
    this.markers.clear()
    
    this.startTime = null
    this.endTime = null
    this.currentTime = null
    
    this.stats = {
      totalPackets: 0,
      packetsPerSecond: [],
      protocolDistribution: new Map(),
      sizeDistribution: [],
      anomalyCount: 0
    }
    
    this.saveToStorage()
    this.notifySubscribers('timelineCleared')
  }

  // Cleanup resources
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    this.subscribers.clear()
    this.saveToStorage()
  }
}

// Default instance
export const defaultTimelineManager = new TimelineManager()

// Helper functions
export const createTimelineManager = (options) => new TimelineManager(options)

export const formatTimelineTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString()
}

export const calculateTimelineDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0
  return Math.max(0, endTime - startTime)
}

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

export default TimelineManager