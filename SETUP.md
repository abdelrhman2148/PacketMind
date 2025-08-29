# Setup Guide - Wireshark+ Web Dashboard

This guide provides detailed setup instructions for different platforms and scenarios.

## 🖥 Platform-Specific Setup

### Linux (Ubuntu/Debian)

#### Prerequisites Installation
```bash
# Update package list
sudo apt update

# Install Python 3.8+
sudo apt install python3 python3-pip python3-venv

# Install Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Install development tools
sudo apt install build-essential libpcap-dev
```

#### Packet Capture Permissions
```bash
# Option 1: Use sudo (simple but requires password)
sudo make start-demo

# Option 2: Set capabilities (recommended for development)
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)
make start-demo  # No sudo needed after this
```

### macOS

#### Prerequisites Installation
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.8+
brew install python@3.11

# Install Node.js 16+
brew install node

# Install libpcap (usually already available)
brew install libpcap
```

#### Packet Capture Permissions
```bash
# macOS requires sudo for packet capture
sudo make start-demo
```

### Windows (WSL2 Recommended)

#### Using WSL2 (Recommended)
```bash
# Install WSL2 with Ubuntu
wsl --install -d Ubuntu

# Follow Linux setup instructions inside WSL2
```

#### Native Windows (Advanced)
- Install Python 3.8+ from python.org
- Install Node.js 16+ from nodejs.org
- Install Npcap from nmap.org/npcap
- Use PowerShell as Administrator for packet capture

## 🔧 Development Setup

### Virtual Environment Setup (Recommended)

#### Backend Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

#### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Start development server
```

### IDE Configuration

#### VS Code Setup
```json
// .vscode/settings.json
{
    "python.defaultInterpreterPath": "./backend/venv/bin/python",
    "python.terminal.activateEnvironment": true,
    "eslint.workingDirectories": ["frontend"]
}
```

#### PyCharm Setup
1. Open project root directory
2. Configure Python interpreter: `backend/venv/bin/python`
3. Mark `backend` as Sources Root
4. Configure Node.js interpreter for frontend

## 🐳 Docker Setup (Alternative)

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    privileged: true  # Required for packet capture
    network_mode: host
    
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

### Docker Commands
```bash
# Build and start services
docker-compose up --build

# Stop services
docker-compose down
```

## 🔐 Security Considerations

### Packet Capture Privileges

#### Linux Capabilities (Recommended)
```bash
# Set capabilities for Python binary
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)

# Verify capabilities
getcap $(which python3)
```

#### Sudo Configuration
```bash
# Add to /etc/sudoers for passwordless packet capture
username ALL=(ALL) NOPASSWD: /path/to/python3 -m uvicorn main:app*
```

### Network Security
- Only capture on trusted networks
- Be aware of sensitive data in packets
- Use BPF filters to limit captured data
- Consider legal implications of packet capture

## 🧪 Testing Setup

### Backend Testing
```bash
cd backend
python -m pytest -v                    # Run all tests
python -m pytest test_capture.py -v    # Run specific test file
python -m pytest -k "test_packet" -v   # Run tests matching pattern
```

### Frontend Testing
```bash
cd frontend
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
npm test -- --coverage     # Run with coverage report
```

### Integration Testing
```bash
# Start services in test mode
TESTING=true make start-demo

# Run integration tests
python backend/test_integration.py
```

## 🔧 Configuration Options

### Environment Variables

#### Backend Configuration (`backend/.env`)
```bash
# API Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# OpenAI Integration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-3.5-turbo
USE_MOCK_AI=true

# Packet Capture
DEFAULT_INTERFACE=eth0
DEFAULT_BPF_FILTER=""
PACKET_BUFFER_SIZE=1000

# Anomaly Detection
ANOMALY_WINDOW_SIZE=60
ANOMALY_THRESHOLD=3.0
ANOMALY_MIN_PACKETS=10

# Logging
LOG_LEVEL=INFO
LOG_FILE=wireshark_web.log
```

#### Frontend Configuration
```javascript
// frontend/src/config.js
export const config = {
  API_BASE_URL: 'http://localhost:8000',
  WS_URL: 'ws://localhost:8000/ws/packets',
  PACKET_BUFFER_SIZE: 500,
  RECONNECT_INTERVAL: 5000,
  AI_TIMEOUT: 20000
};
```

### Advanced Configuration

#### Custom Packet Processing
```python
# backend/custom_processor.py
def custom_packet_processor(packet):
    """Custom packet processing logic"""
    # Add custom fields or filtering
    return processed_packet
```

#### Custom UI Components
```jsx
// frontend/src/components/CustomPacketView.jsx
export function CustomPacketView({ packet }) {
    // Custom packet visualization
    return <div>{/* Custom UI */}</div>;
}
```

## 🚀 Production Deployment

### Systemd Service (Linux)
```ini
# /etc/systemd/system/wireshark-web.service
[Unit]
Description=Wireshark+ Web Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/wireshark-web
ExecStart=/opt/wireshark-web/scripts/start-demo.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/wireshark-web
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### "Permission denied" errors
```bash
# Solution 1: Use sudo
sudo make start-demo

# Solution 2: Set capabilities (Linux)
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)

# Solution 3: Add user to netdev group (Linux)
sudo usermod -a -G netdev $USER
```

#### "No module named 'scapy'" errors
```bash
# Reinstall backend dependencies
cd backend
pip install --upgrade -r requirements.txt
```

#### "Port already in use" errors
```bash
# Find and kill processes using the ports
sudo lsof -ti:8000 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9

# Or use the stop script
make stop-demo
```

#### No packets captured
```bash
# Check available interfaces
ip link show  # Linux
ifconfig      # macOS

# Test with tcpdump
sudo tcpdump -i eth0 -c 5

# Check BPF filter syntax
tcpdump -d "your filter here"
```

#### Frontend not connecting to backend
```bash
# Check if backend is running
curl http://localhost:8000/interfaces

# Check WebSocket connection
wscat -c ws://localhost:8000/ws/packets

# Check browser console for errors
# Open Developer Tools > Console
```

### Debug Mode

#### Enable Debug Logging
```bash
# Backend debug mode
cd backend
DEBUG=true python -m uvicorn main:app --reload --log-level debug

# Frontend debug mode
cd frontend
npm run dev -- --debug
```

#### Packet Capture Debug
```python
# Add to backend/capture.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable Scapy verbose mode
from scapy.config import conf
conf.verb = 2
```

## 📞 Getting Help

### Log Files
- Backend logs: Check terminal output or `backend/wireshark_web.log`
- Frontend logs: Browser Developer Tools > Console
- System logs: `journalctl -u wireshark-web` (if using systemd)

### Diagnostic Commands
```bash
# System information
uname -a
python3 --version
node --version
npm --version

# Network interfaces
ip addr show    # Linux
ifconfig        # macOS

# Permissions check
id
groups
getcap $(which python3)  # Linux capabilities
```

### Community Support
- GitHub Issues: Report bugs and feature requests
- Discussions: Ask questions and share experiences
- Wiki: Community-maintained documentation and tips

---

**Need more help? Check the main README.md or open an issue on GitHub!**