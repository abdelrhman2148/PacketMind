// Demo script to test alert and visualization functionality
// This can be run in the browser console when the app is running

console.log('Testing Alert and Visualization Features...')

// Test data
const mockPackets = [
  { ts: Date.now() / 1000 - 60, src: '192.168.1.100', dst: '8.8.8.8', proto: 'TCP', length: 1500, sport: 443, dport: 80, summary: 'TCP packet 1' },
  { ts: Date.now() / 1000 - 30, src: '192.168.1.101', dst: '8.8.8.8', proto: 'TCP', length: 1200, sport: 443, dport: 80, summary: 'TCP packet 2' },
  { ts: Date.now() / 1000, src: '192.168.1.102', dst: '8.8.8.8', proto: 'UDP', length: 800, sport: 53, dport: 53, summary: 'UDP packet 3' }
]

const mockAlert = {
  type: 'alert',
  level: 'warning',
  message: 'Suspicious burst detected - High packet rate anomaly',
  timestamp: Date.now() / 1000,
  meta: {
    window_start: Math.floor(Date.now() / 1000) - 60,
    packet_count: 150,
    z_score: 3.2,
    threshold: 3.0
  }
}

// Function to simulate WebSocket messages
function simulateWebSocketMessage(data) {
  const event = new MessageEvent('message', {
    data: JSON.stringify(data)
  })
  
  // Find WebSocket connection (this would need to be adapted based on actual implementation)
  console.log('Simulating WebSocket message:', data)
  return event
}

// Test packet rate calculation
function testPacketRateCalculation() {
  console.log('Testing packet rate calculation...')
  
  let packetCount = 0
  let lastRateUpdate = Date.now()
  
  // Simulate receiving packets
  for (let i = 0; i < 10; i++) {
    packetCount += 1
  }
  
  const now = Date.now()
  const timeDiff = now - lastRateUpdate
  
  if (timeDiff >= 1000) {
    const rate = Math.round((packetCount * 1000) / timeDiff)
    console.log(`Calculated rate: ${rate} pps`)
  }
}

// Test alert filtering logic
function testAlertFiltering() {
  console.log('Testing alert filtering logic...')
  
  const alertFilter = {
    start: mockAlert.meta.window_start * 1000,
    end: mockAlert.meta.window_start * 1000 + 60000,
    alert: mockAlert
  }
  
  const filteredPackets = mockPackets.filter(packet => {
    const packetTime = packet.ts * 1000
    return packetTime >= alertFilter.start && packetTime <= alertFilter.end
  })
  
  console.log(`Original packets: ${mockPackets.length}`)
  console.log(`Filtered packets: ${filteredPackets.length}`)
  console.log('Filtered packets:', filteredPackets)
}

// Test traffic history management
function testTrafficHistory() {
  console.log('Testing traffic history management...')
  
  let trafficHistory = []
  
  // Simulate adding data points
  for (let i = 0; i < 65; i++) {
    const dataPoint = { time: Date.now() + i * 1000, rate: Math.floor(Math.random() * 50) }
    trafficHistory = [...trafficHistory, dataPoint].slice(-60)
  }
  
  console.log(`Traffic history length: ${trafficHistory.length} (should be 60)`)
  console.log('Traffic history sample:', trafficHistory.slice(0, 5))
}

// Test sparkline data processing
function testSparklineData() {
  console.log('Testing sparkline data processing...')
  
  const testData = [
    { time: Date.now() - 5000, rate: 10 },
    { time: Date.now() - 4000, rate: 15 },
    { time: Date.now() - 3000, rate: 8 },
    { time: Date.now() - 2000, rate: 20 },
    { time: Date.now() - 1000, rate: 12 }
  ]
  
  const maxRate = Math.max(...testData.map(d => d.rate), 1)
  console.log(`Max rate: ${maxRate}`)
  
  const width = 200
  const height = 40
  
  const points = testData.map((d, i) => {
    const x = (i / (testData.length - 1)) * width
    const y = height - (d.rate / maxRate) * height
    return `${x},${y}`
  }).join(' ')
  
  console.log('Sparkline points:', points)
}

// Run all tests
function runAllTests() {
  console.log('=== Alert and Visualization Feature Tests ===')
  testPacketRateCalculation()
  testAlertFiltering()
  testTrafficHistory()
  testSparklineData()
  console.log('=== Tests Complete ===')
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testPacketRateCalculation,
    testAlertFiltering,
    testTrafficHistory,
    testSparklineData,
    mockPackets,
    mockAlert
  }
} else {
  // Run tests if in browser
  runAllTests()
}