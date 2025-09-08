import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for managing real-time network statistics
 * Provides optimized state management and calculations for the hero section
 */
const useRealTimeStats = (packets = [], connectionStatus = 'disconnected') => {
  const [stats, setStats] = useState({
    packetCount: 0,
    currentRate: 0,
    averageRate: 0,
    peakRate: 0,
    trafficHistory: [],
    uptime: 0,
    throughputMBps: 0,
    protocolDistribution: {},
    recentAlerts: []
  })

  const [isCapturing, setIsCapturing] = useState(false)
  
  // Refs for performance optimization
  const packetCountRef = useRef(0)
  const lastUpdateTimeRef = useRef(Date.now())
  const connectionStartTimeRef = useRef(null)
  const intervalRef = useRef(null)
  const historyBufferRef = useRef([])
  const protocolCounterRef = useRef({})

  // Calculate packet rate with smoothing
  const calculateRate = useCallback((newPacketCount) => {
    const now = Date.now()
    const timeDiff = now - lastUpdateTimeRef.current
    
    if (timeDiff >= 1000) { // Update every second
      const packetsInInterval = newPacketCount - packetCountRef.current
      const rate = Math.round((packetsInInterval * 1000) / timeDiff)
      
      // Update refs
      packetCountRef.current = newPacketCount
      lastUpdateTimeRef.current = now
      
      // Add to history buffer (keep last 60 seconds)
      const historyEntry = { time: now, rate, count: newPacketCount }
      historyBufferRef.current = [...historyBufferRef.current, historyEntry].slice(-60)
      
      return {
        rate,
        history: [...historyBufferRef.current]
      }
    }
    
    return null
  }, [])

  // Calculate protocol distribution
  const updateProtocolDistribution = useCallback((newPackets) => {
    const protocols = {}
    
    newPackets.forEach(packet => {
      const proto = packet.proto || 'Unknown'
      protocols[proto] = (protocols[proto] || 0) + 1
    })
    
    // Merge with existing counts
    Object.keys(protocols).forEach(proto => {
      protocolCounterRef.current[proto] = (protocolCounterRef.current[proto] || 0) + protocols[proto]
    })
    
    return { ...protocolCounterRef.current }
  }, [])

  // Calculate throughput in MB/s
  const calculateThroughput = useCallback((packets) => {
    const totalBytes = packets.reduce((sum, packet) => sum + (packet.length || 0), 0)
    const timeSpanMs = historyBufferRef.current.length > 1 
      ? historyBufferRef.current[historyBufferRef.current.length - 1].time - historyBufferRef.current[0].time
      : 1000
    
    const bytesPerSecond = (totalBytes * 1000) / timeSpanMs
    const mbps = bytesPerSecond / (1024 * 1024)
    
    return Math.round(mbps * 100) / 100 // Round to 2 decimal places
  }, [])

  // Update uptime
  const updateUptime = useCallback(() => {
    if (connectionStatus === 'connected' && connectionStartTimeRef.current) {
      const now = Date.now()
      const uptimeSeconds = Math.floor((now - connectionStartTimeRef.current) / 1000)
      return uptimeSeconds
    }
    return 0
  }, [connectionStatus])

  // Main effect for packet updates
  useEffect(() => {
    if (!packets.length) return

    const newPacketCount = packets.length
    const rateUpdate = calculateRate(newPacketCount)
    
    if (rateUpdate) {
      const { rate, history } = rateUpdate
      const protocols = updateProtocolDistribution(packets.slice(-10)) // Last 10 packets for recent distribution
      const throughput = calculateThroughput(packets.slice(-30)) // Last 30 packets for throughput
      
      // Calculate stats from history
      const rates = history.map(h => h.rate)
      const averageRate = rates.length > 0 
        ? Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length)
        : 0
      const peakRate = rates.length > 0 ? Math.max(...rates) : 0
      
      setStats(prevStats => ({
        ...prevStats,
        packetCount: newPacketCount,
        currentRate: rate,
        averageRate,
        peakRate,
        trafficHistory: history,
        throughputMBps: throughput,
        protocolDistribution: protocols
      }))
    }
  }, [packets, calculateRate, updateProtocolDistribution, calculateThroughput])

  // Connection status effect
  useEffect(() => {
    if (connectionStatus === 'connected') {
      if (!connectionStartTimeRef.current) {
        connectionStartTimeRef.current = Date.now()
      }
      
      // Start uptime counter
      intervalRef.current = setInterval(() => {
        const uptime = updateUptime()
        setStats(prevStats => ({
          ...prevStats,
          uptime
        }))
      }, 1000)
      
      setIsCapturing(true)
    } else {
      // Reset on disconnect
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      if (connectionStatus === 'disconnected') {
        connectionStartTimeRef.current = null
        setStats(prevStats => ({
          ...prevStats,
          uptime: 0,
          currentRate: 0
        }))
        setIsCapturing(false)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [connectionStatus, updateUptime])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Helper functions
  const resetStats = useCallback(() => {
    packetCountRef.current = 0
    lastUpdateTimeRef.current = Date.now()
    connectionStartTimeRef.current = null
    historyBufferRef.current = []
    protocolCounterRef.current = {}
    
    setStats({
      packetCount: 0,
      currentRate: 0,
      averageRate: 0,
      peakRate: 0,
      trafficHistory: [],
      uptime: 0,
      throughputMBps: 0,
      protocolDistribution: {},
      recentAlerts: []
    })
    
    setIsCapturing(false)
  }, [])

  const addAlert = useCallback((alert) => {
    setStats(prevStats => ({
      ...prevStats,
      recentAlerts: [alert, ...prevStats.recentAlerts].slice(0, 10) // Keep last 10 alerts
    }))
  }, [])

  const clearAlerts = useCallback(() => {
    setStats(prevStats => ({
      ...prevStats,
      recentAlerts: []
    }))
  }, [])

  // Format helpers
  const formatUptime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }, [])

  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }, [])

  const getTrafficIntensity = useCallback(() => {
    const { currentRate, peakRate } = stats
    if (peakRate === 0) return 'low'
    
    const intensity = currentRate / peakRate
    if (intensity > 0.8) return 'high'
    if (intensity > 0.5) return 'medium'
    return 'low'
  }, [stats])

  return {
    // Current stats
    ...stats,
    isCapturing,
    
    // Calculated values
    trafficIntensity: getTrafficIntensity(),
    formattedUptime: formatUptime(stats.uptime),
    
    // Actions
    resetStats,
    addAlert,
    clearAlerts,
    
    // Utilities
    formatUptime,
    formatBytes
  }
}

export default useRealTimeStats