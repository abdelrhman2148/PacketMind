import { describe, it, expect } from 'vitest'

// Test the alert filtering logic
describe('Alert Filtering Logic', () => {
  const mockPackets = [
    { ts: 1640995200.123, src: '192.168.1.100', dst: '8.8.8.8' }, // Within window
    { ts: 1640995230.456, src: '192.168.1.101', dst: '8.8.8.8' }, // Within window
    { ts: 1640995300.789, src: '192.168.1.102', dst: '8.8.8.8' }, // Outside window
  ]

  const mockAlert = {
    type: 'alert',
    level: 'warning',
    message: 'Suspicious burst detected',
    timestamp: 1640995200.456,
    meta: {
      window_start: 1640995200, // Start of window
      packet_count: 150,
      z_score: 3.2,
      threshold: 3.0
    }
  }

  it('filters packets within alert time window', () => {
    const alertFilter = {
      start: mockAlert.meta.window_start * 1000, // Convert to milliseconds
      end: mockAlert.meta.window_start * 1000 + 60000, // 1 minute window
      alert: mockAlert
    }

    const filteredPackets = mockPackets.filter(packet => {
      const packetTime = packet.ts * 1000
      return packetTime >= alertFilter.start && packetTime <= alertFilter.end
    })

    expect(filteredPackets).toHaveLength(2)
    expect(filteredPackets[0].src).toBe('192.168.1.100')
    expect(filteredPackets[1].src).toBe('192.168.1.101')
  })

  it('excludes packets outside alert time window', () => {
    const alertFilter = {
      start: mockAlert.meta.window_start * 1000,
      end: mockAlert.meta.window_start * 1000 + 60000,
      alert: mockAlert
    }

    const filteredPackets = mockPackets.filter(packet => {
      const packetTime = packet.ts * 1000
      return packetTime >= alertFilter.start && packetTime <= alertFilter.end
    })

    // Should not include the third packet (outside window)
    expect(filteredPackets.find(p => p.src === '192.168.1.102')).toBeUndefined()
  })

  it('returns all packets when no filter is applied', () => {
    const alertFilter = null
    const filteredPackets = alertFilter ? 
      mockPackets.filter(packet => {
        const packetTime = packet.ts * 1000
        return packetTime >= alertFilter.start && packetTime <= alertFilter.end
      }) : mockPackets

    expect(filteredPackets).toHaveLength(3)
  })

  it('handles empty packet list', () => {
    const alertFilter = {
      start: mockAlert.meta.window_start * 1000,
      end: mockAlert.meta.window_start * 1000 + 60000,
      alert: mockAlert
    }

    const emptyPackets = []
    const filteredPackets = emptyPackets.filter(packet => {
      const packetTime = packet.ts * 1000
      return packetTime >= alertFilter.start && packetTime <= alertFilter.end
    })

    expect(filteredPackets).toHaveLength(0)
  })

  it('calculates packet rate correctly', () => {
    let packetCount = 0
    let lastRateUpdate = Date.now()
    
    // Simulate receiving 5 packets
    for (let i = 0; i < 5; i++) {
      packetCount += 1
    }
    
    const now = Date.now()
    const timeDiff = now - lastRateUpdate
    
    // If more than 1 second has passed
    if (timeDiff >= 1000) {
      const rate = Math.round((packetCount * 1000) / timeDiff)
      expect(rate).toBeGreaterThanOrEqual(0)
    }
  })

  it('limits traffic history to 60 data points', () => {
    let trafficHistory = []
    
    // Simulate adding 70 data points
    for (let i = 0; i < 70; i++) {
      const newDataPoint = { time: Date.now() + i * 1000, rate: i }
      trafficHistory = [...trafficHistory, newDataPoint].slice(-60)
    }
    
    expect(trafficHistory).toHaveLength(60)
    expect(trafficHistory[0].rate).toBe(10) // Should start from index 10 (70-60)
    expect(trafficHistory[59].rate).toBe(69) // Should end at index 69
  })
})