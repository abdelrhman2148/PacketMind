# Design Document

## Overview

Wireshark+ Web is a single-host web application that provides real-time network packet analysis with AI-powered insights. The system uses a FastAPI backend with Scapy for packet capture, WebSocket streaming for real-time data delivery, and a React frontend for visualization. The architecture prioritizes rapid development and demo capability while maintaining the core functionality of packet capture, live streaming, and intelligent analysis.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    WebSocket (ws://localhost:8000/ws/packets)    ┌─────────────────┐
│   React Frontend│◄──────────────────────────────────────────────►│  FastAPI Backend│
│   (Port 5173)   │                                                 │   (Port 8000)   │
└─────────────────┘    HTTP POST /ai/explain                        └─────────────────┘
                                                                              │
                                                                              ▼
                                                                     ┌─────────────────┐
                                                                     │ Scapy Sniffer   │
                                                                     │ (Background     │
                                                                     │  Thread)        │
                                                                     └─────────────────┘
                                                                              │
                                                                              ▼
                                                                     ┌─────────────────┐
                                                                     │ Network         │
                                                                     │ Interface       │
                                                                     └─────────────────┘
```

### Component Interaction Flow

1. **Packet Capture**: Scapy sniffer runs in background thread, captures packets from network interface
2. **Data Processing**: Raw packets normalized to JSON format with essential fields
3. **Queue Management**: Thread-safe queue bridges synchronous capture with async WebSocket broadcasting
4. **Real-time Streaming**: AsyncIO broadcaster sends packets to all connected WebSocket clients
5. **AI Analysis**: REST endpoint processes packet summaries through OpenAI API or mock responses
6. **Anomaly Detection**: Rolling window statistics detect traffic spikes using z-score analysis

## Components and Interfaces

### Backend Components

#### 1. FastAPI Application (`main.py`)
- **Purpose**: HTTP/WebSocket server, API endpoints, CORS handling
- **Key Endpoints**:
  - `GET /interfaces` - List available network interfaces
  - `POST /capture/settings` - Configure interface and BPF filters
  - `WebSocket /ws/packets` - Real-time packet streaming
  - `POST /ai/explain` - AI packet analysis
- **Dependencies**: FastAPI, uvicorn, CORS middleware

#### 2. Packet Capture Engine (`capture.py`)
- **Purpose**: Network packet capture and normalization
- **Key Classes**:
  - `PacketStreamer`: Manages Scapy sniffing in background thread
  - Methods: `start()`, `stop()`, `restart(iface, bpf)`
- **Packet Processing**: Extracts IP, TCP/UDP headers, normalizes to JSON
- **Thread Safety**: Uses Queue for communication with async components

#### 3. Data Models (`packet_model.py`)
- **Purpose**: Pydantic models for type safety and validation
- **Key Models**:
  - `PacketOut`: Standardized packet representation
  - `ExplainIn`: AI analysis request format
- **Fields**: timestamp, source/dest IPs, protocol, ports, length, summary

#### 4. Anomaly Detection
- **Purpose**: Real-time traffic spike detection
- **Algorithm**: Rolling window z-score analysis
- **Configuration**: Window size (60s), threshold (3.0 std deviations)
- **Output**: Alert messages via WebSocket with metadata

### Frontend Components

#### 1. React Application (`App.jsx`)
- **Purpose**: Main UI component with packet table and analysis panel
- **State Management**: React hooks for packets, selection, AI responses
- **Real-time Updates**: WebSocket connection with automatic reconnection
- **UI Sections**:
  - Live packet table with sortable columns
  - Packet detail panel with summary display
  - AI analysis section with explain button
  - Alert notifications for anomalies

#### 2. API Client (`api.js`)
- **Purpose**: HTTP client for backend communication
- **Functions**: `explain(summary)` for AI analysis requests
- **Error Handling**: Proper error propagation to UI components

#### 3. WebSocket Management
- **Connection**: Automatic connection on component mount
- **Message Handling**: JSON parsing, packet updates, alert processing
- **Cleanup**: Connection closure on component unmount

## Data Models

### Packet Data Structure
```json
{
  "ts": 1640995200.123,
  "src": "192.168.1.100",
  "dst": "8.8.8.8", 
  "proto": "TCP",
  "length": 1500,
  "sport": 443,
  "dport": 80,
  "summary": "TCP 192.168.1.100:443 -> 8.8.8.8:80 len=1500 payload_hex64=..."
}
```

### Alert Message Structure
```json
{
  "type": "alert",
  "level": "warning", 
  "message": "Suspicious burst detected",
  "meta": {
    "window_start": 1640995200,
    "packet_count": 150,
    "z_score": 3.2,
    "threshold": 3.0
  }
}
```

### Configuration Structure
```json
{
  "iface": "eth0",
  "bpf": "port 53 or tcp",
  "anomaly_window": 60,
  "anomaly_threshold": 3.0
}
```

## Error Handling

### Packet Capture Errors
- **Privilege Issues**: Clear error messages about sudo/capabilities requirements
- **Interface Problems**: Validation of interface availability before capture start
- **BPF Filter Errors**: Syntax validation and user-friendly error messages
- **Capture Failures**: Graceful degradation, continue streaming available data

### WebSocket Error Handling
- **Connection Failures**: Automatic client removal from broadcast list
- **Message Errors**: Individual packet errors don't stop the stream
- **Reconnection**: Frontend implements automatic reconnection logic

### AI Service Errors
- **API Failures**: Fallback to mock responses or error messages
- **Timeout Handling**: 20-second timeout with proper error propagation
- **Rate Limiting**: Graceful handling of OpenAI API limits

### System Resource Management
- **Memory Limits**: Packet buffer capped at 500 items in frontend
- **Queue Management**: Backend queue limited to 1000 items with overflow handling
- **Thread Management**: Proper cleanup of background threads on shutdown

## Testing Strategy

### Unit Testing
- **Packet Processing**: Test packet normalization with various protocol types
- **Data Models**: Validate Pydantic model serialization/deserialization
- **Anomaly Detection**: Test z-score calculations with known data sets
- **API Endpoints**: Test all REST endpoints with mock data

### Integration Testing
- **WebSocket Flow**: End-to-end packet capture to frontend display
- **AI Integration**: Test both OpenAI API and mock response paths
- **Configuration Changes**: Test interface/filter changes with active capture
- **Error Scenarios**: Test privilege failures, invalid filters, API errors

### Performance Testing
- **Latency Requirements**: Verify <2 second WebSocket latency under load
- **Memory Usage**: Monitor memory consumption during extended capture
- **Concurrent Clients**: Test multiple WebSocket connections
- **High Traffic**: Test system behavior with packet bursts

### Security Testing
- **Privilege Escalation**: Verify proper capability handling
- **Input Validation**: Test BPF filter injection attempts
- **Data Sanitization**: Ensure no sensitive data in AI requests
- **CORS Configuration**: Validate cross-origin request handling

### Demo Validation
- **Quick Setup**: Verify <2 minute setup time with provided scripts
- **Traffic Generation**: Test with provided traffic generation scripts
- **Visual Feedback**: Confirm real-time updates and anomaly alerts
- **Cross-Platform**: Test on Linux and macOS with different permission models