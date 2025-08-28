# Alert and Traffic Visualization Features

This document describes the implementation of Task 10: "Add anomaly alerts and traffic visualization" for the Wireshark+ Web Dashboard.

## Features Implemented

### 1. Alert Notification System

**Location**: `src/App.jsx` - Alert handling in WebSocket message processing

**Functionality**:
- Displays recent alerts in a dedicated alerts section
- Shows alert metadata (Z-score, packet count, timestamp)
- Clickable alerts for filtering packets
- Visual highlighting of active alerts
- Clear filter functionality

**Requirements Satisfied**:
- Requirement 5.4: Anomaly alerts sent to connected clients via WebSocket
- Requirement 5.5: Users can click on alerts to filter packet view

### 2. Sparkline Visualization

**Location**: `src/App.jsx` - Sparkline component and traffic history tracking

**Functionality**:
- Real-time sparkline chart showing packet rate over time
- Displays in the header status bar
- Shows maximum packet rate (pps - packets per second)
- Maintains 60 seconds of traffic history
- Gradient fill for visual appeal

**Requirements Satisfied**:
- Requirement 7.2: Simple sparkline visualization of traffic over time
- Requirement 7.3: Visual indicators update in real-time

### 3. Packet Rate Display

**Location**: `src/App.jsx` - Status bar in header

**Functionality**:
- Shows current packet rate in packets per second (pps)
- Updates every second based on received packets
- Displayed prominently in the header status bar

**Requirements Satisfied**:
- Requirement 7.1: Display current packet rate in the interface

### 4. Alert Filtering

**Location**: `src/App.jsx` - Alert click handling and packet filtering

**Functionality**:
- Click alerts to filter packets by time window
- Shows only packets within the alert's time window (1 minute)
- Clear filter button to return to all packets
- Filter status indicator
- Handles empty filter results gracefully

**Requirements Satisfied**:
- Requirement 5.5: Frontend filters packet view when alerts are clicked

### 5. Visual Anomaly Indicators

**Location**: `src/App.css` - Alert styling and visual feedback

**Functionality**:
- Color-coded alerts (warning/critical levels)
- Hover effects on clickable alerts
- Active alert highlighting when filter is applied
- Visual feedback for user interactions

**Requirements Satisfied**:
- Requirement 7.4: Anomalies are visually highlighted in the interface

## Technical Implementation Details

### State Management

New state variables added to `App.jsx`:
```javascript
const [packetRate, setPacketRate] = useState(0)
const [trafficHistory, setTrafficHistory] = useState([])
const [alertFilter, setAlertFilter] = useState(null)
const [filteredPackets, setFilteredPackets] = useState([])
```

### Packet Rate Calculation

```javascript
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
```

### Alert Filtering Logic

```javascript
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
```

### Sparkline Component

```javascript
function Sparkline({ data, width = 200, height = 40 }) {
  if (!data || data.length === 0) {
    return <div className="sparkline-empty">No data</div>
  }

  const maxRate = Math.max(...data.map(d => d.rate), 1)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.rate / maxRate) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="sparkline-container">
      <svg width={width} height={height} className="sparkline">
        <polyline points={points} fill="none" stroke="#61dafb" strokeWidth="2" />
        <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#sparklineGradient)" />
      </svg>
      <div className="sparkline-info">
        <span className="sparkline-max">{maxRate} pps</span>
      </div>
    </div>
  )
}
```

## CSS Styling

### New CSS Classes Added

- `.traffic-sparkline` - Container for sparkline in header
- `.sparkline-container` - Sparkline component container
- `.sparkline` - SVG sparkline element
- `.sparkline-empty` - Empty state for sparkline
- `.sparkline-info` - Rate display overlay
- `.alerts-header` - Alert section header with clear button
- `.clear-filter-button` - Button to clear alert filter
- `.alert-meta` - Alert metadata display
- `.alert-active` - Active alert highlighting
- `.filter-info` - Filter status indicator

### Visual Design

- Sparkline uses the app's primary color (#61dafb)
- Gradient fill for visual appeal
- Hover effects on interactive elements
- Consistent spacing and typography
- Responsive design considerations

## Testing

### Test Files Created

1. `src/Sparkline.test.jsx` - Unit tests for Sparkline component
2. `src/AlertFiltering.test.jsx` - Logic tests for alert filtering
3. `demo-alert-visualization.js` - Manual testing utilities

### Test Coverage

- Sparkline rendering with and without data
- Alert filtering logic
- Packet rate calculations
- Traffic history management
- Edge cases (empty data, single data points)

## Usage Instructions

### For Users

1. **Viewing Packet Rate**: Check the header status bar for "Rate: X pps"
2. **Traffic Visualization**: Observe the sparkline chart in the header
3. **Alert Interaction**: Click on alerts to filter packets by time window
4. **Clear Filters**: Use the "Clear Filter" button to show all packets

### For Developers

1. **Alert Format**: Alerts must include `meta.window_start` for filtering
2. **Rate Updates**: Packet rate updates every 1000ms
3. **History Limit**: Traffic history is limited to 60 data points
4. **Filtering**: Filtered packets replace the main packet list

## Performance Considerations

- Traffic history is limited to 60 data points to prevent memory issues
- Packet rate calculation uses efficient counting with periodic updates
- Sparkline rendering is optimized with SVG
- Alert filtering uses efficient array filtering

## Future Enhancements

Potential improvements for future iterations:
- Configurable time windows for alerts
- Multiple alert types with different colors
- Zoom functionality for sparkline
- Export functionality for traffic data
- Advanced filtering options