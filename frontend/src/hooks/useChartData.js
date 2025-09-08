import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { format, subMinutes, subHours, subDays } from 'date-fns'

const useChartData = (packets = [], options = {}) => {
  const {
    timeRange = '5m', // '5m', '1h', '24h', '7d'
    updateInterval = 1000,
    maxDataPoints = 100,
    enableRealTime = true
  } = options

  const [chartData, setChartData] = useState({
    trafficRates: [],
    protocolDistribution: {},
    trafficPatterns: [],
    packetSizes: [],
    connectionHeatmap: [],
    timeline: []
  })

  const intervalRef = useRef(null)
  const lastUpdateRef = useRef(Date.now())

  // Calculate time range bounds
  const getTimeRange = useCallback(() => {
    const now = new Date()
    let startTime
    
    switch (timeRange) {
      case '5m':
        startTime = subMinutes(now, 5)
        break
      case '1h':
        startTime = subHours(now, 1)
        break
      case '24h':
        startTime = subDays(now, 1)
        break
      case '7d':
        startTime = subDays(now, 7)
        break
      default:
        startTime = subMinutes(now, 5)
    }
    
    return { startTime, endTime: now }
  }, [timeRange])

  // Process traffic rate data
  const processTrafficRates = useCallback((packetsData) => {
    const { startTime, endTime } = getTimeRange()
    const bucketSize = Math.max(1000, (endTime - startTime) / maxDataPoints) // minimum 1 second buckets
    const buckets = new Map()

    // Filter packets within time range
    const filteredPackets = packetsData.filter(packet => {
      const packetTime = new Date(packet.ts * 1000)
      return packetTime >= startTime && packetTime <= endTime
    })

    // Group packets into time buckets
    filteredPackets.forEach(packet => {
      const packetTime = new Date(packet.ts * 1000)
      const bucketKey = Math.floor(packetTime.getTime() / bucketSize) * bucketSize
      
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          timestamp: bucketKey,
          count: 0,
          bytes: 0,
          protocols: new Set()
        })
      }
      
      const bucket = buckets.get(bucketKey)
      bucket.count++
      bucket.bytes += packet.length || 0
      bucket.protocols.add(packet.proto)
    })

    // Convert to array and fill gaps
    const sortedBuckets = Array.from(buckets.keys()).sort((a, b) => a - b)
    const result = []
    
    for (let time = startTime.getTime(); time <= endTime.getTime(); time += bucketSize) {
      const bucket = buckets.get(time) || {
        timestamp: time,
        count: 0,
        bytes: 0,
        protocols: new Set()
      }
      
      result.push({
        timestamp: time,
        time: format(new Date(time), timeRange === '5m' || timeRange === '1h' ? 'HH:mm:ss' : 'HH:mm'),
        packetsPerSecond: Math.round(bucket.count / (bucketSize / 1000)),
        bytesPerSecond: Math.round(bucket.bytes / (bucketSize / 1000)),
        protocolCount: bucket.protocols.size,
        totalPackets: bucket.count,
        totalBytes: bucket.bytes
      })
    }

    return result.slice(-maxDataPoints)
  }, [getTimeRange, maxDataPoints, timeRange])

  // Process protocol distribution
  const processProtocolDistribution = useCallback((packetsData) => {
    const { startTime, endTime } = getTimeRange()
    const protocolCounts = {}
    const protocolBytes = {}
    
    const filteredPackets = packetsData.filter(packet => {
      const packetTime = new Date(packet.ts * 1000)
      return packetTime >= startTime && packetTime <= endTime
    })

    filteredPackets.forEach(packet => {
      const protocol = packet.proto || 'Unknown'
      protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1
      protocolBytes[protocol] = (protocolBytes[protocol] || 0) + (packet.length || 0)
    })

    // Convert to chart format
    const protocols = Object.keys(protocolCounts)
    const total = Object.values(protocolCounts).reduce((sum, count) => sum + count, 0)
    
    return {
      labels: protocols,
      datasets: [{
        data: protocols.map(proto => protocolCounts[proto]),
        backgroundColor: protocols.map((_, index) => {
          const colors = [
            '#E50914', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899'
          ]
          return colors[index % colors.length]
        }),
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
      }],
      metadata: {
        total,
        percentages: protocols.reduce((acc, proto) => {
          acc[proto] = ((protocolCounts[proto] / total) * 100).toFixed(1)
          return acc
        }, {}),
        bytes: protocolBytes
      }
    }
  }, [getTimeRange])

  // Process packet size distribution
  const processPacketSizes = useCallback((packetsData) => {
    const { startTime, endTime } = getTimeRange()
    const sizeBuckets = {
      'Tiny (0-64)': 0,
      'Small (65-256)': 0,
      'Medium (257-512)': 0,
      'Large (513-1024)': 0,
      'Jumbo (1025+)': 0
    }

    const filteredPackets = packetsData.filter(packet => {
      const packetTime = new Date(packet.ts * 1000)
      return packetTime >= startTime && packetTime <= endTime
    })

    filteredPackets.forEach(packet => {
      const size = packet.length || 0
      if (size <= 64) sizeBuckets['Tiny (0-64)']++
      else if (size <= 256) sizeBuckets['Small (65-256)']++
      else if (size <= 512) sizeBuckets['Medium (257-512)']++
      else if (size <= 1024) sizeBuckets['Large (513-1024)']++
      else sizeBuckets['Jumbo (1025+)']++
    })

    return {
      labels: Object.keys(sizeBuckets),
      datasets: [{
        label: 'Packet Count',
        data: Object.values(sizeBuckets),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(229, 9, 20, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(229, 9, 20, 1)'
        ],
        borderWidth: 2,
      }]
    }
  }, [getTimeRange])

  // Process traffic patterns for heatmap
  const processTrafficPatterns = useCallback((packetsData) => {
    const { startTime, endTime } = getTimeRange()
    const patterns = {}
    
    const filteredPackets = packetsData.filter(packet => {
      const packetTime = new Date(packet.ts * 1000)
      return packetTime >= startTime && packetTime <= endTime
    })

    // Create source-destination matrix
    filteredPackets.forEach(packet => {
      const source = packet.src || 'Unknown'
      const dest = packet.dst || 'Unknown'
      const key = `${source}->${dest}`
      
      if (!patterns[key]) {
        patterns[key] = {
          source,
          destination: dest,
          count: 0,
          bytes: 0,
          protocols: new Set()
        }
      }
      
      patterns[key].count++
      patterns[key].bytes += packet.length || 0
      patterns[key].protocols.add(packet.proto)
    })

    // Convert to heatmap format
    const connections = Object.values(patterns)
    const maxCount = Math.max(...connections.map(c => c.count), 1)
    
    return connections.map(conn => ({
      ...conn,
      intensity: conn.count / maxCount,
      protocolList: Array.from(conn.protocols)
    })).sort((a, b) => b.count - a.count).slice(0, 50) // Top 50 connections
  }, [getTimeRange])

  // Generate timeline data
  const generateTimeline = useCallback((packetsData) => {
    const { startTime, endTime } = getTimeRange()
    const events = []
    
    const filteredPackets = packetsData.filter(packet => {
      const packetTime = new Date(packet.ts * 1000)
      return packetTime >= startTime && packetTime <= endTime
    })

    // Group by significant events
    const significantPorts = [22, 23, 53, 80, 443, 993, 995, 3389]
    const protocolEvents = {}

    filteredPackets.forEach(packet => {
      const timestamp = Math.floor(packet.ts)
      const isSignificant = significantPorts.includes(packet.dport) || 
                           significantPorts.includes(packet.sport)
      
      if (isSignificant || Math.random() < 0.1) { // Sample 10% of normal traffic
        events.push({
          timestamp: packet.ts * 1000,
          time: format(new Date(packet.ts * 1000), 'HH:mm:ss'),
          type: isSignificant ? 'significant' : 'normal',
          protocol: packet.proto,
          source: packet.src,
          destination: packet.dst,
          port: packet.dport || packet.sport,
          size: packet.length
        })
      }
    })

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100)
  }, [getTimeRange])

  // Update chart data
  const updateChartData = useCallback(() => {
    if (!packets.length) return

    const newData = {
      trafficRates: processTrafficRates(packets),
      protocolDistribution: processProtocolDistribution(packets),
      packetSizes: processPacketSizes(packets),
      trafficPatterns: processTrafficPatterns(packets),
      timeline: generateTimeline(packets)
    }

    setChartData(newData)
    lastUpdateRef.current = Date.now()
  }, [packets, processTrafficRates, processProtocolDistribution, processPacketSizes, processTrafficPatterns, generateTimeline])

  // Setup real-time updates
  useEffect(() => {
    if (!enableRealTime) return

    const startRealTimeUpdates = () => {
      intervalRef.current = setInterval(() => {
        updateChartData()
      }, updateInterval)
    }

    // Initial update
    updateChartData()
    
    // Start interval
    startRealTimeUpdates()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enableRealTime, updateInterval, updateChartData])

  // Manual update function
  const forceUpdate = useCallback(() => {
    updateChartData()
  }, [updateChartData])

  // Chart configuration helpers
  const getChartConfig = useCallback((type) => {
    const baseConfig = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          labels: {
            color: '#FFFFFF',
            font: {
              family: '"SF Pro Text", system-ui, sans-serif'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          titleColor: '#FFFFFF',
          bodyColor: '#B3B3B3',
          borderColor: 'rgba(229, 9, 20, 0.5)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          titleFont: {
            family: '"SF Pro Text", system-ui, sans-serif',
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            family: '"SF Pro Text", system-ui, sans-serif',
            size: 12
          }
        }
      },
      scales: type === 'line' ? {
        x: {
          type: 'category',
          ticks: {
            color: '#B3B3B3',
            font: {
              family: '"SF Pro Text", system-ui, sans-serif'
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: '#B3B3B3',
            font: {
              family: '"SF Pro Text", system-ui, sans-serif'
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      } : undefined,
      elements: {
        point: {
          radius: 3,
          hoverRadius: 6,
          borderWidth: 2
        },
        line: {
          tension: 0.3,
          borderWidth: 3
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutCubic'
      }
    }

    return baseConfig
  }, [])

  // Statistics
  const statistics = useMemo(() => {
    if (!packets.length) return {}

    const { startTime, endTime } = getTimeRange()
    const filteredPackets = packets.filter(packet => {
      const packetTime = new Date(packet.ts * 1000)
      return packetTime >= startTime && packetTime <= endTime
    })

    const totalPackets = filteredPackets.length
    const totalBytes = filteredPackets.reduce((sum, p) => sum + (p.length || 0), 0)
    const uniqueProtocols = new Set(filteredPackets.map(p => p.proto)).size
    const uniqueIPs = new Set([
      ...filteredPackets.map(p => p.src),
      ...filteredPackets.map(p => p.dst)
    ].filter(Boolean)).size

    const timeSpan = (endTime - startTime) / 1000 // seconds
    const avgPacketsPerSecond = totalPackets / timeSpan
    const avgBytesPerSecond = totalBytes / timeSpan

    return {
      totalPackets,
      totalBytes,
      uniqueProtocols,
      uniqueIPs,
      avgPacketsPerSecond: Math.round(avgPacketsPerSecond),
      avgBytesPerSecond: Math.round(avgBytesPerSecond),
      timeRange: `${format(startTime, 'HH:mm:ss')} - ${format(endTime, 'HH:mm:ss')}`
    }
  }, [packets, getTimeRange])

  return {
    chartData,
    statistics,
    forceUpdate,
    getChartConfig,
    timeRange,
    isRealTime: enableRealTime,
    lastUpdate: lastUpdateRef.current
  }
}

export default useChartData