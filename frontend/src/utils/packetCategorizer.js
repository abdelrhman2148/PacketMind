/**
 * Packet Categorization Utility
 * Provides functions to categorize and analyze network packets by protocol, port, and behavior
 */

// Protocol mappings and categories
export const PROTOCOL_CATEGORIES = {
  // Web Traffic
  web: {
    name: 'Web Traffic',
    color: '#E50914', // Netflix red
    protocols: ['HTTP', 'HTTPS'],
    ports: [80, 443, 8080, 8443],
    icon: '🌐',
    description: 'HTTP/HTTPS web traffic'
  },
  
  // DNS Traffic
  dns: {
    name: 'DNS',
    color: '#06B6D4', // Cyan
    protocols: ['DNS'],
    ports: [53],
    icon: '🔍',
    description: 'Domain name resolution'
  },
  
  // Email Traffic
  email: {
    name: 'Email',
    color: '#10B981', // Green
    protocols: ['SMTP', 'POP3', 'IMAP'],
    ports: [25, 110, 143, 465, 587, 993, 995],
    icon: '📧',
    description: 'Email protocols'
  },
  
  // File Transfer
  transfer: {
    name: 'File Transfer',
    color: '#F59E0B', // Amber
    protocols: ['FTP', 'SFTP', 'SCP'],
    ports: [20, 21, 22, 69],
    icon: '📁',
    description: 'File transfer protocols'
  },
  
  // Database Traffic
  database: {
    name: 'Database',
    color: '#8B5CF6', // Purple
    protocols: ['SQL'],
    ports: [1433, 3306, 5432, 1521, 27017],
    icon: '🗄️',
    description: 'Database connections'
  },
  
  // Remote Access
  remote: {
    name: 'Remote Access',
    color: '#EF4444', // Red
    protocols: ['SSH', 'RDP', 'VNC', 'Telnet'],
    ports: [22, 23, 3389, 5900],
    icon: '🖥️',
    description: 'Remote access protocols'
  },
  
  // Network Management
  network: {
    name: 'Network Mgmt',
    color: '#6366F1', // Indigo
    protocols: ['SNMP', 'ICMP', 'ARP', 'DHCP'],
    ports: [161, 162, 67, 68],
    icon: '⚙️',
    description: 'Network management and diagnostics'
  },
  
  // Media Streaming
  media: {
    name: 'Media',
    color: '#EC4899', // Pink
    protocols: ['RTP', 'RTSP', 'SIP'],
    ports: [554, 1935, 5060],
    icon: '🎥',
    description: 'Media streaming protocols'
  },
  
  // TCP Traffic (Generic)
  tcp: {
    name: 'TCP',
    color: '#06B6D4', // Cyan
    protocols: ['TCP'],
    ports: [],
    icon: '📡',
    description: 'General TCP traffic'
  },
  
  // UDP Traffic (Generic)
  udp: {
    name: 'UDP',
    color: '#F97316', // Orange
    protocols: ['UDP'],
    ports: [],
    icon: '📤',
    description: 'General UDP traffic'
  },
  
  // Unknown/Other
  other: {
    name: 'Other',
    color: '#6B7280', // Gray
    protocols: [],
    ports: [],
    icon: '❓',
    description: 'Unclassified traffic'
  }
}

/**
 * Categorize a packet based on protocol and port information
 */
export const categorizePacket = (packet) => {
  if (!packet) return 'other'
  
  const protocol = (packet.proto || '').toUpperCase()
  const srcPort = packet.sport
  const dstPort = packet.dport
  
  // Check for specific protocol matches first
  for (const [categoryId, category] of Object.entries(PROTOCOL_CATEGORIES)) {
    if (categoryId === 'other') continue // Skip 'other' category in this loop
    
    // Check protocol match
    if (category.protocols.includes(protocol)) {
      return categoryId
    }
    
    // Check port match
    if (category.ports.length > 0) {
      if (category.ports.includes(srcPort) || category.ports.includes(dstPort)) {
        return categoryId
      }
    }
  }
  
  // Fallback to generic protocol categories
  if (protocol === 'TCP') return 'tcp'
  if (protocol === 'UDP') return 'udp'
  
  return 'other'
}

/**
 * Analyze packets and return category statistics
 */
export const analyzePackets = (packets = []) => {
  const stats = {}
  const recentPackets = {} // Track recent packets per category
  const categoryTrends = {} // Track packet rate trends
  
  // Initialize all categories
  Object.keys(PROTOCOL_CATEGORIES).forEach(categoryId => {
    stats[categoryId] = {
      count: 0,
      percentage: 0,
      totalBytes: 0,
      avgBytes: 0,
      recentCount: 0,
      trend: 'stable', // 'up', 'down', 'stable'
      lastSeen: null,
      topPorts: {},
      topHosts: {}
    }
    recentPackets[categoryId] = []
  })
  
  if (packets.length === 0) {
    return { stats, totalPackets: 0, categories: Object.keys(PROTOCOL_CATEGORIES) }
  }
  
  // Process each packet
  const now = Date.now()
  const recentThreshold = now - 60000 // Last 60 seconds
  
  packets.forEach((packet, index) => {
    const category = categorizePacket(packet)
    const packetTime = (packet.ts || 0) * 1000
    const packetSize = packet.length || 0
    
    // Update basic stats
    stats[category].count++
    stats[category].totalBytes += packetSize
    stats[category].lastSeen = packetTime
    
    // Track recent packets for trend analysis
    if (packetTime > recentThreshold) {
      stats[category].recentCount++
      recentPackets[category].push({
        time: packetTime,
        size: packetSize,
        src: packet.src,
        dst: packet.dst,
        sport: packet.sport,
        dport: packet.dport
      })
    }
    
    // Track top ports
    if (packet.dport) {
      const portKey = packet.dport.toString()
      stats[category].topPorts[portKey] = (stats[category].topPorts[portKey] || 0) + 1
    }
    
    // Track top hosts
    if (packet.dst) {
      stats[category].topHosts[packet.dst] = (stats[category].topHosts[packet.dst] || 0) + 1
    }
  })
  
  // Calculate percentages and averages
  const totalPackets = packets.length
  Object.keys(stats).forEach(categoryId => {
    const categoryStats = stats[categoryId]
    categoryStats.percentage = totalPackets > 0 ? (categoryStats.count / totalPackets) * 100 : 0
    categoryStats.avgBytes = categoryStats.count > 0 ? categoryStats.totalBytes / categoryStats.count : 0
    
    // Calculate trend based on recent activity
    const recentData = recentPackets[categoryId]
    if (recentData.length > 10) {
      const midPoint = Math.floor(recentData.length / 2)
      const firstHalf = recentData.slice(0, midPoint).length
      const secondHalf = recentData.slice(midPoint).length
      
      if (secondHalf > firstHalf * 1.2) {
        categoryStats.trend = 'up'
      } else if (secondHalf < firstHalf * 0.8) {
        categoryStats.trend = 'down'
      } else {
        categoryStats.trend = 'stable'
      }
    }
    
    // Convert maps to sorted arrays for display
    categoryStats.topPorts = Object.entries(categoryStats.topPorts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([port, count]) => ({ port: parseInt(port), count }))
    
    categoryStats.topHosts = Object.entries(categoryStats.topHosts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([host, count]) => ({ host, count }))
  })
  
  return {
    stats,
    totalPackets,
    categories: Object.keys(PROTOCOL_CATEGORIES)
  }
}

/**
 * Get category configuration by ID
 */
export const getCategoryConfig = (categoryId) => {
  return PROTOCOL_CATEGORIES[categoryId] || PROTOCOL_CATEGORIES.other
}

/**
 * Get trending categories based on recent activity
 */
export const getTrendingCategories = (stats, limit = 5) => {
  return Object.entries(stats)
    .filter(([, data]) => data.recentCount > 0)
    .sort(([, a], [, b]) => b.recentCount - a.recentCount)
    .slice(0, limit)
    .map(([categoryId, data]) => ({
      categoryId,
      ...getCategoryConfig(categoryId),
      ...data
    }))
}

/**
 * Filter packets by category
 */
export const filterPacketsByCategory = (packets, categoryId) => {
  if (!categoryId || categoryId === 'all') return packets
  
  return packets.filter(packet => categorizePacket(packet) === categoryId)
}

/**
 * Get category summary for display
 */
export const getCategorySummary = (categoryId, stats) => {
  const config = getCategoryConfig(categoryId)
  const data = stats[categoryId] || {}
  
  return {
    id: categoryId,
    name: config.name,
    color: config.color,
    icon: config.icon,
    description: config.description,
    count: data.count || 0,
    percentage: data.percentage || 0,
    recentCount: data.recentCount || 0,
    trend: data.trend || 'stable',
    totalBytes: data.totalBytes || 0,
    avgBytes: data.avgBytes || 0,
    lastSeen: data.lastSeen,
    topPorts: data.topPorts || [],
    topHosts: data.topHosts || []
  }
}

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Format time ago
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Never'
  
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}