import { useState, useEffect, useRef } from 'react'
import { explainPacket, getInterfaces, updateCaptureSettings } from './api'
import './App.css'

// Simple Sparkline component for traffic visualization
function Sparkline({ data, width = 200, height = 40 }) {
  if (!data || data.length === 0) {
    return (
      <div className="sparkline-empty" style={{ width, height }}>
        <span>No data</span>
      </div>
    )
  }

  const maxRate = Math.max(...data.map(d => d.rate), 1)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.rate / maxRate) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="sparkline-container" style={{ width, height }}>
      <svg width={width} height={height} className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke="#61dafb"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#61dafb" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#61dafb" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#sparklineGradient)"
        />
      </svg>
      <div className="sparkline-info">
        <span className="sparkline-max">{maxRate} pps</span>
      </div>
    </div>
  )
}

function App() {
  const [packets, setPackets] = useState([])
  const [selectedPacket, setSelectedPacket] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [alerts, setAlerts] = useState([])
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [interfaces, setInterfaces] = useState([])
  const [selectedInterface, setSelectedInterface] = useState('')
  const [bpfFilter, setBpfFilter] = useState('')
  const [currentSettings, setCurrentSettings] = useState({ iface: '', bpf: '' })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState(null)
  const [packetRate, setPacketRate] = useState(0)
  const [trafficHistory, setTrafficHistory] = useState([])
  const [alertFilter, setAlertFilter] = useState(null)
  const [filteredPackets, setFilteredPackets] = useState([])
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const packetCountRef = useRef(0)
  const lastRateUpdateRef = useRef(Date.now())

  // WebSocket connection management with automatic reconnection
  // Enhanced error handling per requirement 2.5
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/packets')
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully')
        setConnectionStatus('connected')
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        
        // Send initial ping to confirm connection
        try {
          wsRef.current.send('ping')
        } catch (error) {
          console.warn('Failed to send initial ping:', error)
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          // Handle pong responses
          if (event.data === 'pong') {
            console.debug('Received pong from server')
            return
          }
          
          const data = JSON.parse(event.data)
          
          if (data.type === 'alert') {
            // Handle anomaly alerts
            setAlerts(prev => [data, ...prev.slice(0, 9)]) // Keep last 10 alerts
          } else if (data.type === 'connection_status') {
            console.log('Connection status:', data.message)
          } else if (data.type === 'error') {
            console.error('Server error:', data.message)
            setConnectionStatus('error')
          } else if (data.type === 'config_change') {
            console.log('Configuration changed:', data)
            // Update current settings display
            setCurrentSettings({
              iface: data.interface || '',
              bpf: data.bpf_filter || ''
            })
          } else {
            // Handle packet data
            setPackets(prev => {
              const newPackets = [data, ...prev.slice(0, 499)] // Keep last 500 packets
              return newPackets
            })
            
            // Update packet rate calculation
            packetCountRef.current += 1
            const now = Date.now()
            const timeDiff = now - lastRateUpdateRef.current
            
            // Update rate every second
            if (timeDiff >= 1000) {
              const rate = Math.round((packetCountRef.current * 1000) / timeDiff)
              setPacketRate(rate)
              
              // Update traffic history for sparkline (keep last 60 seconds)
              setTrafficHistory(prev => {
                const newHistory = [...prev, { time: now, rate }].slice(-60)
                return newHistory
              })
              
              packetCountRef.current = 0
              lastRateUpdateRef.current = now
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setConnectionStatus('disconnected')
        
        // Determine reconnection strategy based on close code
        let reconnectDelay = 3000 // Default 3 seconds
        
        if (event.code === 1006) {
          // Abnormal closure, try reconnecting sooner
          reconnectDelay = 1000
        } else if (event.code === 1000) {
          // Normal closure, wait longer
          reconnectDelay = 5000
        }
        
        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...')
          setConnectionStatus('reconnecting')
          connectWebSocket()
        }, reconnectDelay)
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        
        // Try to reconnect after error
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            console.log('Attempting to reconnect after error...')
            setConnectionStatus('reconnecting')
            connectWebSocket()
          }
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
      
      // Retry connection after error
      setTimeout(() => {
        console.log('Retrying WebSocket connection after creation error...')
        setConnectionStatus('reconnecting')
        connectWebSocket()
      }, 5000)
    }
  }

  // Load available interfaces on component mount
  // Enhanced error handling for interface loading
  const loadInterfaces = async () => {
    try {
      const interfaceList = await getInterfaces()
      setInterfaces(interfaceList)
      // Set default interface if none selected
      if (interfaceList.length > 0 && !selectedInterface) {
        setSelectedInterface(interfaceList[0].name)
        setCurrentSettings(prev => ({ ...prev, iface: interfaceList[0].name }))
      }
      console.log('Loaded network interfaces:', interfaceList.length)
    } catch (error) {
      console.error('Failed to load interfaces:', error)
      
      let errorMessage = 'Failed to load network interfaces'
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Timeout loading network interfaces. Please try refreshing the page.'
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection error. Please check if the backend server is running.'
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error loading interfaces. Please check server logs.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSettingsError(errorMessage)
    }
  }

  // Handle capture settings update
  // Enhanced error handling per requirement 4.5
  const handleSettingsUpdate = async () => {
    if (!selectedInterface) {
      setSettingsError('Please select a network interface')
      return
    }

    setSettingsLoading(true)
    setSettingsError(null)

    try {
      const result = await updateCaptureSettings({
        iface: selectedInterface,
        bpf: bpfFilter
      })
      
      setCurrentSettings({
        iface: selectedInterface,
        bpf: bpfFilter
      })
      
      console.log('Capture settings updated successfully:', result)
      
      // Clear any previous errors on success
      setSettingsError(null)
      
    } catch (error) {
      console.error('Failed to update capture settings:', error)
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Failed to update capture settings'
      
      if (error.message.includes('HTTP 403')) {
        errorMessage = 'Insufficient privileges for packet capture. Please run with sudo or set appropriate capabilities.'
      } else if (error.message.includes('HTTP 400')) {
        if (error.message.includes('BPF filter')) {
          errorMessage = 'Invalid BPF filter expression. Please check the syntax and try again.'
        } else if (error.message.includes('Interface')) {
          errorMessage = 'Selected network interface is not available. Please choose a different interface.'
        } else {
          errorMessage = 'Invalid settings. Please check your input and try again.'
        }
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error while updating settings. Please try again or check server logs.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. The server took too long to respond. Please try again.'
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSettingsError(errorMessage)
    } finally {
      setSettingsLoading(false)
    }
  }

  // Initialize WebSocket connection and load interfaces on component mount
  useEffect(() => {
    connectWebSocket()
    loadInterfaces()

    // Cleanup on component unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Format timestamp for display
  const formatTimestamp = (ts) => {
    return new Date(ts * 1000).toLocaleTimeString()
  }

  // Handle packet selection
  const handlePacketSelect = (packet) => {
    setSelectedPacket(packet)
    setAiResponse(null) // Clear previous AI response
  }

  // Handle AI explanation request
  // Enhanced error handling per requirement 3.5
  const handleExplainPacket = async () => {
    if (!selectedPacket) {
      console.warn('No packet selected for AI explanation')
      return
    }

    setAiLoading(true)
    setAiResponse(null)

    try {
      const data = await explainPacket(selectedPacket.summary)
      setAiResponse(data)
      console.log('AI explanation received:', data.is_mock ? 'mock' : 'real')
    } catch (error) {
      console.error('Error getting AI explanation:', error)
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Failed to get AI explanation. Please try again.'
      
      if (error.message.includes('timeout')) {
        errorMessage = 'AI service timeout. The request took too long to process. Please try again.'
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection error. Please check your connection and try again.'
      } else if (error.message.includes('HTTP 503')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later.'
      } else if (error.message.includes('HTTP 429')) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.'
      } else if (error.message.includes('HTTP 401')) {
        errorMessage = 'AI service authentication failed. Please check API key configuration.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setAiResponse({
        explanation: errorMessage,
        is_mock: false,
        error: true
      })
    } finally {
      setAiLoading(false)
    }
  }

  // Handle alert click for filtering
  const handleAlertClick = (alert) => {
    if (alert.meta && alert.meta.window_start) {
      const windowStart = alert.meta.window_start * 1000 // Convert to milliseconds
      const windowEnd = windowStart + 60000 // 1 minute window
      
      setAlertFilter({
        start: windowStart,
        end: windowEnd,
        alert: alert
      })
    }
  }

  // Clear alert filter
  const clearAlertFilter = () => {
    setAlertFilter(null)
  }

  // Filter packets based on alert filter
  useEffect(() => {
    if (alertFilter) {
      const filtered = packets.filter(packet => {
        const packetTime = packet.ts * 1000
        return packetTime >= alertFilter.start && packetTime <= alertFilter.end
      })
      setFilteredPackets(filtered)
    } else {
      setFilteredPackets(packets)
    }
  }, [packets, alertFilter])

  // Get connection status indicator
  const getConnectionIndicator = () => {
    const statusColors = {
      connected: '#4ade80',
      disconnected: '#ef4444',
      reconnecting: '#f59e0b',
      error: '#ef4444'
    }
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        fontSize: '14px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[connectionStatus]
        }}></div>
        {connectionStatus === 'connected' && 'Connected'}
        {connectionStatus === 'disconnected' && 'Disconnected'}
        {connectionStatus === 'reconnecting' && 'Reconnecting...'}
        {connectionStatus === 'error' && 'Connection Error'}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wireshark+ Web Dashboard</h1>
        <div className="status-bar">
          {getConnectionIndicator()}
          <span>Packets: {packets.length}</span>
          <span>Rate: {packetRate} pps</span>
          <div className="traffic-sparkline">
            <Sparkline data={trafficHistory} width={120} height={30} />
          </div>
        </div>
      </header>

      <div className="capture-controls">
        <h2>Capture Settings</h2>
        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="interface-select">Network Interface:</label>
            <select
              id="interface-select"
              value={selectedInterface}
              onChange={(e) => setSelectedInterface(e.target.value)}
              disabled={settingsLoading}
            >
              <option value="">Select interface...</option>
              {interfaces.map((iface) => (
                <option key={iface.name} value={iface.name}>
                  {iface.name} {iface.description && `(${iface.description})`}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="bpf-filter">BPF Filter:</label>
            <input
              id="bpf-filter"
              type="text"
              value={bpfFilter}
              onChange={(e) => setBpfFilter(e.target.value)}
              placeholder="e.g., port 80 or tcp"
              disabled={settingsLoading}
            />
          </div>

          <button
            className="apply-button"
            onClick={handleSettingsUpdate}
            disabled={settingsLoading || !selectedInterface}
          >
            {settingsLoading ? 'Applying...' : 'Apply Settings'}
          </button>
        </div>

        {currentSettings.iface && (
          <div className="current-settings">
            <strong>Current:</strong> Interface: {currentSettings.iface}
            {currentSettings.bpf && `, Filter: ${currentSettings.bpf}`}
          </div>
        )}

        {settingsError && (
          <div className="settings-error">
            Error: {settingsError}
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="alerts-section">
          <div className="alerts-header">
            <h3>Recent Alerts</h3>
            {alertFilter && (
              <button className="clear-filter-button" onClick={clearAlertFilter}>
                Clear Filter
              </button>
            )}
          </div>
          <div className="alerts-list">
            {alerts.slice(0, 3).map((alert, index) => (
              <div 
                key={index} 
                className={`alert alert-${alert.level} ${alertFilter?.alert === alert ? 'alert-active' : ''}`}
                onClick={() => handleAlertClick(alert)}
                title="Click to filter packets by alert time window"
              >
                <span className="alert-time">{formatTimestamp(alert.timestamp || Date.now() / 1000)}</span>
                <span className="alert-message">{alert.message}</span>
                {alert.meta && (
                  <span className="alert-meta">
                    Z-score: {alert.meta.z_score?.toFixed(2)}, Count: {alert.meta.packet_count}
                  </span>
                )}
              </div>
            ))}
          </div>
          {alertFilter && (
            <div className="filter-info">
              Showing packets from {new Date(alertFilter.start).toLocaleTimeString()} to {new Date(alertFilter.end).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      <div className="main-content">
        <div className="packets-section">
          <h2>Live Packets</h2>
          <div className="packet-table-container">
            <table className="packet-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                  <th>Length</th>
                  <th>Ports</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackets.map((packet, index) => (
                  <tr 
                    key={index}
                    className={selectedPacket === packet ? 'selected' : ''}
                    onClick={() => handlePacketSelect(packet)}
                  >
                    <td>{formatTimestamp(packet.ts)}</td>
                    <td>{packet.src}</td>
                    <td>{packet.dst}</td>
                    <td>{packet.proto}</td>
                    <td>{packet.length}</td>
                    <td>
                      {packet.sport && packet.dport 
                        ? `${packet.sport} → ${packet.dport}` 
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPackets.length === 0 && packets.length > 0 && alertFilter && (
              <div className="no-packets">
                No packets found in the selected time window
              </div>
            )}
            {packets.length === 0 && (
              <div className="no-packets">
                {connectionStatus === 'connected' 
                  ? 'Waiting for packets...' 
                  : 'Not connected to packet stream'
                }
              </div>
            )}
          </div>
        </div>

        {selectedPacket && (
          <div className="packet-detail-section">
            <h2>Packet Details</h2>
            <div className="packet-detail">
              <div className="detail-row">
                <strong>Timestamp:</strong> {formatTimestamp(selectedPacket.ts)}
              </div>
              <div className="detail-row">
                <strong>Source:</strong> {selectedPacket.src}
                {selectedPacket.sport && `:${selectedPacket.sport}`}
              </div>
              <div className="detail-row">
                <strong>Destination:</strong> {selectedPacket.dst}
                {selectedPacket.dport && `:${selectedPacket.dport}`}
              </div>
              <div className="detail-row">
                <strong>Protocol:</strong> {selectedPacket.proto}
              </div>
              <div className="detail-row">
                <strong>Length:</strong> {selectedPacket.length} bytes
              </div>
              <div className="detail-row">
                <strong>Summary:</strong>
                <div className="summary-text">{selectedPacket.summary}</div>
              </div>
            </div>

            <div className="ai-analysis-section">
              <button 
                className="explain-button"
                onClick={handleExplainPacket}
                disabled={aiLoading}
              >
                {aiLoading ? 'Analyzing...' : 'Explain Packet'}
              </button>

              {aiResponse && (
                <div className={`ai-response ${aiResponse.error ? 'error' : ''}`}>
                  <h3>
                    AI Analysis {aiResponse.is_mock && '(Mock)'}
                    {aiResponse.error && ' - Error'}
                  </h3>
                  <div className="ai-explanation">
                    {aiResponse.explanation}
                  </div>
                  {aiResponse.error && (
                    <div className="error-help">
                      <small>
                        If this error persists, try selecting a different packet or check the server logs.
                      </small>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
