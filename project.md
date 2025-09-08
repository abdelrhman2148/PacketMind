# AI-Shark Project Overview

**Wireshark+ Web Dashboard - Real-time Network Packet Analysis with AI-Powered Insights**

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Features](#core-features)
5. [Development Status](#development-status)
6. [Getting Started](#getting-started)
7. [Project Structure](#project-structure)
8. [API Reference](#api-reference)
9. [Configuration](#configuration)
10. [Testing Strategy](#testing-strategy)
11. [Performance & Monitoring](#performance--monitoring)
12. [Security & Permissions](#security--permissions)
13. [Deployment](#deployment)
14. [Development Workflow](#development-workflow)
15. [Troubleshooting](#troubleshooting)

## 📖 Project Overview

### Vision & Purpose
AI-Shark modernizes traditional network packet analysis tools like Wireshark by providing a web-based interface for real-time traffic monitoring, intelligent packet explanation, and anomaly detection. The tool bridges the gap between complex command-line network analysis and modern web accessibility.

### Key Value Propositions
- **Accessibility**: Web-based interface accessible from any browser on any platform
- **Intelligence**: AI-powered packet explanations make network analysis accessible to non-experts
- **Real-time**: Sub-2-second latency from packet capture to visualization
- **Cross-platform**: Runs on Linux, macOS, and containerized environments
- **Modern UX**: Intuitive interface with dark/light themes and responsive design

### Target Users
- Network administrators monitoring network health
- Security analysts investigating traffic patterns
- Developers debugging network applications
- IT professionals learning network protocols
- DevOps teams monitoring application traffic

## 🏗️ System Architecture

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

### Design Patterns

1. **Observer Pattern**: Frontend observes real-time packet stream via WebSocket
2. **Singleton Pattern**: Configuration and capture engine management
3. **Factory Pattern**: AI explanation service (OpenAI vs Mock)
4. **Layered Architecture**: Clear separation between API, business logic, and capture layers
5. **Publisher-Subscriber**: Anomaly detection broadcasts alerts to connected clients

### Data Flow

1. **Packet Capture**: Scapy sniffer captures packets from network interface
2. **Normalization**: Raw packets converted to JSON format with essential fields
3. **Queue Management**: Thread-safe queue bridges sync capture with async WebSocket
4. **Real-time Streaming**: AsyncIO broadcaster sends packets to WebSocket clients
5. **AI Analysis**: REST endpoint processes packet summaries through OpenAI or mock AI
6. **Anomaly Detection**: Statistical analysis detects traffic spikes using z-score

## 🔧 Technology Stack

### Backend (Python 3.8+)
- **FastAPI**: Modern async web framework
- **Scapy**: Cross-platform packet capture and analysis
- **WebSockets**: Real-time bidirectional communication
- **Pydantic**: Data validation and serialization
- **OpenAI**: AI-powered packet analysis
- **Uvicorn**: ASGI server
- **Pytest**: Testing framework
- **PSUtil**: System performance monitoring

### Frontend (Node.js 16+)
- **React 18+**: Modern UI framework with hooks
- **Vite**: Fast build tool and development server
- **Chakra UI**: Modern component library
- **Framer Motion**: Smooth animations
- **DnD Kit**: Drag-and-drop functionality
- **WebSocket Client**: Real-time communication
- **Vitest**: Testing framework

### Development Tools
- **Make**: Build automation and task management
- **ESLint**: JavaScript code linting
- **Git**: Version control
- **Docker**: Containerization (optional)

## 🚀 Core Features

### 1. Real-time Packet Capture
- **Live Traffic Monitoring**: Continuous packet capture with minimal latency
- **Interface Selection**: Support for multiple network interfaces
- **BPF Filtering**: Berkeley Packet Filter for targeted traffic analysis
- **Protocol Support**: IPv4/IPv6, TCP/UDP/ICMP, DNS, HTTP/HTTPS
- **Performance**: Sub-2-second latency from capture to UI display

### 2. AI-Powered Analysis
- **Intelligent Explanations**: Click any packet for AI-generated analysis
- **Security Insights**: Automatic detection of potential security issues
- **Protocol Understanding**: Context-aware explanations of network protocols
- **Mock Mode**: Development-friendly mock responses when OpenAI unavailable
- **Timeout Handling**: Graceful degradation for API failures

### 3. Anomaly Detection
- **Statistical Analysis**: Z-score calculation for traffic pattern detection
- **Configurable Thresholds**: Adjustable sensitivity for different environments
- **Real-time Alerts**: Instant notifications for suspicious activity
- **Alert Filtering**: Focus on specific time windows and patterns
- **Historical Tracking**: Rolling window analysis for trend detection

### 4. Modern Web Interface
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Themes**: User preference persistence
- **Accessibility**: WCAG-compliant with keyboard navigation
- **Customizable Columns**: Drag-and-drop table configuration
- **Contextual Help**: Tooltips and guided tours for new users

### 5. Advanced Filtering & Search
- **Multi-field Filtering**: Protocol, IP, port, keyword search
- **Filter History**: Saved and recent filter expressions
- **BPF Validation**: Real-time syntax checking and suggestions
- **Quick Presets**: Common filter patterns for immediate use
- **Export Capabilities**: PCAP, JSON, CSV export formats

## 📊 Development Status

### Phase 1: Core Implementation ✅ (100% Complete)
- [x] **Task 1-15**: All foundational features implemented
- [x] Packet capture engine with Scapy integration
- [x] FastAPI backend with WebSocket streaming
- [x] React frontend with real-time updates
- [x] AI packet analysis (OpenAI + Mock)
- [x] Anomaly detection system
- [x] Modern UI with Chakra UI
- [x] Column customization and responsive design
- [x] Advanced filtering system
- [x] Comprehensive error handling
- [x] Performance optimizations
- [x] Automated setup and demo scripts

### Phase 2: Enhanced Features 🔄 (In Progress)
- [x] **Task 16-19**: Enhanced UI/UX (Complete)
  - Modern component library integration
  - Responsive design and accessibility
  - Column customization with drag-and-drop
  - Contextual tooltips and help system
- [x] **Task 20**: Advanced filtering system (Complete)
- [ ] **Task 21**: Hierarchical packet dissection panel
- [ ] **Task 22**: Packet export functionality
- [ ] **Task 23**: Advanced traffic visualizations
- [ ] **Task 24-27**: Security and authentication system
- [ ] **Task 28-30**: Containerization and deployment

### Upcoming Features
- Role-based access control (RBAC)
- Audit logging and security features
- Docker containerization
- Kubernetes deployment manifests
- Advanced protocol dissection
- Enhanced visualization charts

## 🎮 Getting Started

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Sudo privileges** for packet capture
- **Linux**: NET_ADMIN capability or sudo access
- **macOS**: Admin privileges for network access

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd ai-shark

# One-command setup
make setup

# Start demo (requires sudo for packet capture)
sudo make start-demo

# Open browser
open http://localhost:5173
```

### Development Setup
```bash
# Install dependencies separately
make install-backend   # Python dependencies
make install-frontend  # Node.js dependencies

# Linux capability setup (preferred)
make setup-capabilities

# Start without sudo (after capability setup)
make start-demo
```

### Configuration
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit configuration
nano backend/.env
```

## 📁 Project Structure

```
ai-shark/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # FastAPI app with WebSocket endpoints
│   ├── capture.py             # Scapy packet capture engine
│   ├── models.py              # Pydantic data models
│   ├── anomaly.py             # Anomaly detection system
│   ├── privileges.py          # Permission handling
│   ├── config.py              # Configuration management
│   ├── requirements.txt       # Python dependencies
│   └── test_*.py              # Test files
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── App.jsx           # Main application component
│   │   ├── api.js            # Backend API client
│   │   ├── components/       # Reusable UI components
│   │   │   ├── AdvancedFilter.jsx
│   │   │   ├── ColumnConfig.jsx
│   │   │   ├── PremiumPacketTable.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── ...
│   │   └── test/             # Test utilities
│   ├── package.json          # Node.js dependencies
│   └── vite.config.js        # Vite configuration
├── scripts/                   # Automation scripts
│   ├── start-demo.sh         # Demo startup script
│   ├── stop-demo.sh          # Demo shutdown script
│   ├── setup-capabilities.sh # Linux privilege setup
│   └── generate-traffic.sh   # Test traffic generation
├── .kiro/specs/              # Project specifications
│   └── wireshark-web-dashboard/
│       ├── requirements.md   # Detailed requirements
│       ├── design.md         # Technical design
│       └── tasks.md          # Implementation tasks
├── Makefile                  # Build automation
├── README.md                 # Project documentation
├── SETUP.md                  # Detailed setup guide
└── project.md                # This comprehensive overview
```

## 🌐 API Reference

### REST Endpoints

#### Interface Management
- `GET /interfaces` - List available network interfaces
- `POST /capture/settings` - Configure interface and BPF filter
- `GET /status` - Get current system status

#### AI Analysis
- `POST /ai/explain` - Analyze packet with AI explanation

#### System Information
- `GET /privileges` - Check packet capture privileges
- `GET /config` - Get application configuration
- `GET /performance/stats` - Performance metrics

#### Anomaly Detection
- `GET /anomaly/stats` - Get anomaly detection statistics
- `POST /anomaly/config` - Update anomaly detection parameters

### WebSocket Endpoints

#### Real-time Communication
- `WS /ws/packets` - Real-time packet streaming and alerts

### Data Models

#### Packet Structure
```json
{
  "ts": 1640995200.123,
  "src": "192.168.1.100",
  "dst": "8.8.8.8",
  "proto": "TCP",
  "length": 1500,
  "sport": 443,
  "dport": 80,
  "summary": "TCP 192.168.1.100:443 -> 8.8.8.8:80 len=1500"
}
```

#### Alert Structure
```json
{
  "type": "alert",
  "level": "warning",
  "message": "Suspicious burst detected",
  "timestamp": 1640995200.123,
  "meta": {
    "window_start": 1640995200,
    "packet_count": 150,
    "z_score": 3.2,
    "threshold": 3.0
  }
}
```

## ⚙️ Configuration

### Environment Variables (`backend/.env`)

```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-3.5-turbo
USE_MOCK_AI=true

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Packet Capture
DEFAULT_INTERFACE=eth0
DEFAULT_BPF_FILTER=""

# Anomaly Detection
ANOMALY_WINDOW_SIZE=60
ANOMALY_THRESHOLD=3.0
ANOMALY_MIN_SAMPLES=10
ANOMALY_ALERT_COOLDOWN=30

# Logging
LOG_LEVEL=INFO
LOG_FILE=wireshark_web.log
```

### BPF Filter Examples
- `port 80` - HTTP traffic only
- `tcp` - TCP packets only
- `host google.com` - Traffic to/from Google
- `port 53` - DNS queries
- `tcp and port 443` - HTTPS traffic
- `icmp` - Ping packets

## 🧪 Testing Strategy

### Test Categories

#### Unit Tests
```bash
make test-backend   # Python unit tests
make test-frontend  # React component tests
```

#### Integration Tests
```bash
make test           # All tests
```

#### Performance Tests
```bash
make test-performance  # Latency and throughput tests
make test-load        # WebSocket load testing
```

#### Manual Testing
```bash
# Test backend API
curl http://localhost:8000/interfaces

# Test WebSocket (requires wscat)
wscat -c ws://localhost:8000/ws/packets
```

### Test Coverage
- **Backend**: Unit tests for packet processing, API endpoints, anomaly detection
- **Frontend**: Component tests, integration tests, accessibility tests
- **Integration**: End-to-end WebSocket communication, error scenarios
- **Performance**: Latency requirements, memory usage, concurrent clients

## 📈 Performance & Monitoring

### Performance Requirements
- **Latency**: < 2 seconds from packet capture to UI display
- **Throughput**: Support 20+ concurrent WebSocket clients
- **Memory**: Efficient usage during long-running captures
- **CPU**: Minimal impact on system performance

### Monitoring Tools
```bash
make monitor        # Start performance monitoring
make perf-check     # Quick performance check
```

### Performance Endpoints
- `GET /performance/stats` - Detailed performance metrics
- `GET /anomaly/stats` - Anomaly detection statistics

### Key Metrics
- Packet capture rate and queue utilization
- WebSocket connection count and message throughput
- Memory usage and garbage collection
- CPU utilization and system resources

## 🔐 Security & Permissions

### Packet Capture Privileges

#### Linux (Recommended)
```bash
# Automated capability setup
make setup-capabilities

# Manual capability setup
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)
```

#### macOS
```bash
# Requires sudo for packet capture
sudo make start-demo
```

### Security Features
- **Input Validation**: BPF filter validation prevents injection
- **Privilege Validation**: Runtime checks for packet capture permissions
- **Error Handling**: Graceful degradation without exposing internals
- **Safe Mode**: Optional payload masking for privacy protection

### Security Considerations
- Run with minimal required privileges
- Validate all user inputs and filters
- Monitor for unusual traffic patterns
- Consider legal implications of packet capture
- Secure OpenAI API key storage

## 🐳 Deployment

### Local Development
```bash
make start-demo
```

### Docker (Future)
```bash
docker-compose up --build
```

### Production Considerations
- Reverse proxy (Nginx) for SSL termination
- Systemd service for auto-restart
- Log rotation and monitoring
- Resource limits and monitoring
- Network security policies

## 🔄 Development Workflow

### Daily Development
```bash
# Start development environment
make start-demo

# Run tests during development
make test

# Generate test traffic
make generate-traffic

# Monitor performance
make monitor
```

### Code Quality
- **Python**: PEP8 compliance, type hints
- **JavaScript**: ESLint rules, React best practices
- **Testing**: Comprehensive test coverage
- **Documentation**: Inline comments and README updates

### Git Workflow
1. Create feature branch
2. Implement changes with tests
3. Run full test suite: `make test`
4. Update documentation as needed
5. Submit pull request

## 🔧 Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Linux: Setup capabilities
make setup-capabilities

# macOS: Use sudo
sudo make start-demo
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# Stop services
make stop-demo
```

#### No Packets Captured
- Verify sudo/admin privileges
- Check network interface status
- Validate BPF filter syntax
- Try different network interface

#### WebSocket Connection Issues
- Check backend server status
- Verify firewall settings
- Check browser console for errors
- Test with wscat tool

### Debug Mode
```bash
# Backend debug
DEBUG=true python backend/main.py

# Frontend debug
npm run dev -- --debug
```

### Log Analysis
- Backend logs: Terminal output or log files
- Frontend logs: Browser Developer Tools
- System logs: `journalctl` (Linux) or Console (macOS)

---

## 📞 Support & Contributing

### Getting Help
1. Check troubleshooting section
2. Review log files for errors
3. Test with different configurations
4. Open GitHub issue with details

### Contributing
1. Fork the repository
2. Create feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

### Issue Reporting
Include:
- Operating system and version
- Python and Node.js versions
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

---

**🦈 Happy packet hunting! Transform your network analysis with AI-powered insights.**