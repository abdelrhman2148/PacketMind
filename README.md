# Wireshark+ Web Dashboard

A real-time network packet analysis dashboard with AI-powered insights. This tool provides a web-based interface for capturing, analyzing, and understanding network traffic with intelligent explanations and anomaly detection.

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm  
- **Sudo privileges** for packet capture
- **Linux**: NET_ADMIN capability or sudo access
- **macOS**: Admin privileges for network access

### One-Command Setup

```bash
# Clone and setup everything
git clone <repository-url>
cd wireshark-web-dashboard
make setup
```

### Start the Demo

```bash
# Start both backend and frontend services
sudo make start-demo
```

Then open your browser to **http://localhost:5173**

## 📋 Features

- **Real-time Packet Capture**: Live network traffic monitoring with <2s latency
- **AI-Powered Analysis**: Click any packet to get intelligent explanations
- **Anomaly Detection**: Automatic detection of traffic spikes and unusual patterns
- **Interactive Filtering**: BPF filters and interface selection
- **Modern Web UI**: React-based dashboard with real-time updates
- **Cross-Platform**: Works on Linux and macOS

## 🛠 Installation

### Automated Setup (Recommended)

```bash
# Complete setup with all dependencies
make setup

# Or install components separately
make install-backend   # Python dependencies
make install-frontend  # Node.js dependencies
```

### Manual Setup

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend Setup
```bash
cd frontend
npm install
```

## 🎮 Usage

### Starting the Demo

```bash
# Start both services (requires sudo for packet capture)
sudo make start-demo
```

This will start:
- **Backend API**: http://localhost:8000
- **Frontend UI**: http://localhost:5173
- **WebSocket**: ws://localhost:8000/ws/packets

### Using the Dashboard

1. **Open the Web Interface**: Navigate to http://localhost:5173
2. **Select Network Interface**: Choose from the dropdown (e.g., eth0, wlan0)
3. **Set BPF Filter** (optional): Filter traffic (e.g., `port 80`, `tcp`, `host google.com`)
4. **Watch Live Packets**: See real-time traffic in the packet table
5. **Analyze Packets**: Click any packet for details and AI analysis
6. **Monitor Alerts**: Watch for anomaly detection notifications

### Generating Test Traffic

```bash
# Generate test traffic for demonstration
make generate-traffic

# Or with custom parameters
./scripts/generate-traffic.sh --duration 120 --intensity high
```

### Stopping the Demo

```bash
# Stop all services
make stop-demo

# Or press Ctrl+C in the terminal running start-demo
```

## 🔧 Configuration

### Environment Variables

Create `backend/.env` file (copied from `.env.example`):

```bash
# OpenAI API Configuration (optional)
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
USE_MOCK_AI=true  # Set to false to use real OpenAI API

# Anomaly Detection Settings
ANOMALY_WINDOW_SIZE=60
ANOMALY_THRESHOLD=3.0

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### BPF Filter Examples

- `port 80` - HTTP traffic only
- `tcp` - TCP packets only
- `host google.com` - Traffic to/from Google
- `port 53` - DNS queries
- `tcp and port 443` - HTTPS traffic
- `icmp` - Ping packets

## 🧪 Testing

### Run All Tests
```bash
make test
```

### Run Specific Tests
```bash
make test-backend   # Python tests
make test-frontend  # React tests
```

### Manual Testing
```bash
# Test backend API
curl http://localhost:8000/interfaces

# Test WebSocket (requires wscat: npm install -g wscat)
wscat -c ws://localhost:8000/ws/packets
```

## 📊 API Endpoints

### REST API

- `GET /interfaces` - List available network interfaces
- `POST /capture/settings` - Configure interface and BPF filter
- `POST /ai/explain` - Get AI analysis of packet data

### WebSocket

- `WS /ws/packets` - Real-time packet stream and alerts

### Example API Usage

```bash
# List interfaces
curl http://localhost:8000/interfaces

# Configure capture
curl -X POST http://localhost:8000/capture/settings \
  -H "Content-Type: application/json" \
  -d '{"interface": "eth0", "bpf_filter": "port 80"}'

# Explain a packet
curl -X POST http://localhost:8000/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"summary": "TCP 192.168.1.100:443 -> 8.8.8.8:80"}'
```

## 🔍 Troubleshooting

### Permission Issues

**Linux:**
```bash
# Option 1: Run with sudo
sudo make start-demo

# Option 2: Set capabilities (preferred)
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)
```

**macOS:**
```bash
# Run with sudo (required for packet capture)
sudo make start-demo
```

### Common Issues

**Port Already in Use:**
```bash
# Stop any existing services
make stop-demo

# Check what's using the ports
lsof -i :8000  # Backend
lsof -i :5173  # Frontend
```

**Dependencies Missing:**
```bash
# Reinstall all dependencies
make clean
make setup
```

**No Packets Captured:**
- Ensure you're running with sudo/admin privileges
- Check that the selected interface is active
- Verify BPF filter syntax
- Try a different network interface

**AI Analysis Not Working:**
- Check if `OPENAI_API_KEY` is set in `backend/.env`
- Verify `USE_MOCK_AI=true` for development mode
- Check backend logs for API errors

## 🏗 Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   React Frontend│◄─────────────────►│  FastAPI Backend│
│   (Port 5173)   │                  │   (Port 8000)   │
└─────────────────┘                  └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ Scapy Sniffer   │
                                     │ (Background     │
                                     │  Thread)        │
                                     └─────────────────┘
```

### Components

- **Frontend**: React + Vite for modern web UI
- **Backend**: FastAPI + WebSocket for real-time API
- **Packet Capture**: Scapy for cross-platform packet sniffing
- **AI Analysis**: OpenAI API integration with mock fallback
- **Anomaly Detection**: Statistical analysis with z-score calculation

## 📝 Development

### Project Structure

```
wireshark-web-dashboard/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI application
│   ├── capture.py          # Packet capture engine
│   ├── models.py           # Pydantic data models
│   ├── anomaly.py          # Anomaly detection
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   └── api.js         # API client
│   └── package.json       # Node.js dependencies
├── scripts/               # Automation scripts
│   ├── start-demo.sh     # Demo startup
│   ├── stop-demo.sh      # Demo shutdown
│   └── generate-traffic.sh # Traffic generation
└── Makefile              # Build automation
```

### Adding Features

1. **Backend**: Add endpoints in `main.py`, models in `models.py`
2. **Frontend**: Add components in `src/`, update `App.jsx`
3. **Tests**: Add tests in `test_*.py` (backend) or `*.test.jsx` (frontend)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `make test`
5. Submit a pull request

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the logs in the terminal
3. Open an issue on GitHub with:
   - Operating system and version
   - Python and Node.js versions
   - Error messages and logs
   - Steps to reproduce

---

**Happy packet hunting! 🦈📊**