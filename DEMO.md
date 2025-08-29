# Demo Guide - Wireshark+ Web Dashboard

This guide provides step-by-step instructions for demonstrating the Wireshark+ Web Dashboard.

## 🎯 Demo Overview

The Wireshark+ Web Dashboard demonstrates:
- **Real-time packet capture** from network interfaces
- **Live streaming** of packets to a web browser
- **AI-powered packet analysis** with explanations
- **Anomaly detection** for traffic spikes
- **Interactive filtering** with BPF expressions

**Demo Duration**: 10-15 minutes  
**Audience**: Network administrators, security analysts, developers

## 🚀 Quick Demo (5 minutes)

### 1. Setup and Start (2 minutes)

```bash
# Clone and setup (if not done already)
git clone <repository-url>
cd wireshark-web-dashboard
make setup

# Start the demo
sudo make start-demo
```

**Expected Output**: Both backend and frontend services start successfully

### 2. Basic Packet Capture (2 minutes)

1. **Open Browser**: Navigate to http://localhost:5173
2. **Select Interface**: Choose your active network interface (e.g., `en0`, `eth0`)
3. **Start Capture**: Click "Apply" to begin packet capture
4. **Observe Traffic**: Watch live packets populate the table

**Key Points to Highlight**:
- Real-time updates (< 2 second latency)
- Packet details: timestamp, source/destination, protocol, ports
- Automatic scrolling with latest packets

### 3. Generate Test Traffic (1 minute)

```bash
# In a new terminal
make generate-traffic
```

**Expected Results**:
- Increased packet activity in the dashboard
- Various protocol types (HTTP, DNS, TCP, ICMP)
- Anomaly alerts for traffic bursts

## 🎪 Full Demo (15 minutes)

### Phase 1: Introduction and Setup (3 minutes)

#### Explain the Problem
- Traditional packet analysis requires command-line tools
- Difficult to share insights with non-technical stakeholders
- No real-time visualization or intelligent analysis

#### Show the Solution
- Web-based interface accessible to anyone
- Real-time streaming with modern UI
- AI-powered explanations for complex packets

#### Quick Setup Demo
```bash
# Show how easy setup is
make setup          # Install dependencies
sudo make start-demo # Start services
```

### Phase 2: Core Features (8 minutes)

#### 2.1 Real-time Packet Capture (2 minutes)

1. **Interface Selection**:
   ```bash
   # Show available interfaces
   curl http://localhost:8000/interfaces
   ```
   - Demonstrate interface dropdown
   - Explain different interface types

2. **Live Packet Stream**:
   - Show packets appearing in real-time
   - Highlight key packet information
   - Demonstrate automatic scrolling

#### 2.2 BPF Filtering (2 minutes)

1. **Basic Filters**:
   - `port 80` - Show only HTTP traffic
   - `tcp` - Show only TCP packets
   - `host google.com` - Show traffic to/from Google

2. **Advanced Filters**:
   - `tcp and port 443` - HTTPS traffic
   - `port 53` - DNS queries
   - `icmp` - Ping packets

**Demo Script**:
```bash
# Generate specific traffic for filtering demo
curl http://google.com &
ping -c 5 google.com &
nslookup github.com &
```

#### 2.3 AI Packet Analysis (2 minutes)

1. **Select Interesting Packet**:
   - Click on an HTTP request
   - Click on a DNS query
   - Click on an encrypted packet

2. **Get AI Explanation**:
   - Click "Explain Packet" button
   - Show AI analysis results
   - Highlight security insights

**Example AI Responses**:
- HTTP: "This is an HTTP GET request to google.com. Normal web browsing traffic."
- DNS: "DNS query for github.com. Standard domain name resolution."
- Encrypted: "TLS handshake packet. Secure connection establishment."

#### 2.4 Anomaly Detection (2 minutes)

1. **Generate Traffic Burst**:
   ```bash
   # Create anomaly
   ./scripts/generate-traffic.sh --intensity high --duration 30
   ```

2. **Show Alert System**:
   - Anomaly alert appears in UI
   - Explain z-score calculation
   - Show alert filtering functionality

### Phase 3: Advanced Features (3 minutes)

#### 3.1 Traffic Visualization

1. **Sparkline Chart**:
   - Show packet rate over time
   - Highlight traffic patterns
   - Demonstrate real-time updates

2. **Traffic Statistics**:
   - Current packet rate
   - Protocol distribution
   - Alert history

#### 3.2 Configuration Management

1. **Dynamic Reconfiguration**:
   ```bash
   # Change settings via API
   curl -X POST http://localhost:8000/capture/settings \
     -H "Content-Type: application/json" \
     -d '{"interface": "lo", "bpf_filter": "port 22"}'
   ```

2. **Environment Configuration**:
   - Show `.env` file options
   - Explain OpenAI API integration
   - Demonstrate mock vs real AI responses

### Phase 4: Wrap-up (1 minute)

#### Stop the Demo
```bash
make stop-demo
```

#### Summary Points
- **Easy Setup**: One command to start
- **Real-time**: Sub-2-second latency
- **Intelligent**: AI-powered analysis
- **Flexible**: BPF filtering and interface selection
- **Secure**: Proper privilege handling

## 🎨 Demo Scenarios

### Scenario 1: Network Troubleshooting

**Setup**: Simulate network connectivity issues
```bash
# Generate failed connections
for i in {1..10}; do
    timeout 1 nc -z unreachable-host.com 80 2>/dev/null &
done
```

**Demo Points**:
- Show failed connection attempts
- Use BPF filter: `tcp[tcpflags] & tcp-rst != 0`
- Explain packet analysis for troubleshooting

### Scenario 2: Security Monitoring

**Setup**: Generate suspicious traffic patterns
```bash
# Port scanning simulation
for port in {20..30}; do
    timeout 1 nc -z target-host.com $port 2>/dev/null &
done
```

**Demo Points**:
- Show anomaly detection alerts
- Demonstrate AI analysis of suspicious packets
- Explain security implications

### Scenario 3: Application Monitoring

**Setup**: Monitor specific application traffic
```bash
# Web application traffic
curl -H "User-Agent: MyApp/1.0" http://httpbin.org/user-agent
curl -X POST http://httpbin.org/post -d '{"test": "data"}'
```

**Demo Points**:
- Use BPF filter: `port 80 and host httpbin.org`
- Show HTTP request/response analysis
- Demonstrate application-specific insights

## 🛠 Demo Preparation Checklist

### Before the Demo

- [ ] **System Requirements**: Verify Python 3.8+, Node.js 16+
- [ ] **Permissions**: Ensure sudo access for packet capture
- [ ] **Network**: Confirm active network interface
- [ ] **Dependencies**: Run `make setup` and `./scripts/verify-setup.sh`
- [ ] **Test Run**: Do a quick test of all features

### Demo Environment

- [ ] **Clean Terminal**: Clear terminal history
- [ ] **Browser Setup**: Open browser to localhost:5173
- [ ] **Backup Plan**: Have screenshots ready if live demo fails
- [ ] **Network Activity**: Ensure some background network traffic

### During the Demo

- [ ] **Explain Context**: Set up the problem before showing solution
- [ ] **Show, Don't Tell**: Let the audience see the features working
- [ ] **Handle Questions**: Be prepared for technical questions
- [ ] **Time Management**: Keep to allocated time slots

## 🔧 Troubleshooting Demo Issues

### Common Demo Problems

#### No Packets Captured
```bash
# Check interface is active
ip link show  # Linux
ifconfig      # macOS

# Test with tcpdump
sudo tcpdump -i eth0 -c 5

# Verify permissions
sudo ./scripts/verify-setup.sh
```

#### Services Won't Start
```bash
# Check ports are free
make stop-demo
lsof -i :8000
lsof -i :5173

# Restart services
sudo make start-demo
```

#### AI Analysis Not Working
```bash
# Check .env configuration
cat backend/.env

# Test with mock responses
echo "USE_MOCK_AI=true" >> backend/.env
```

### Backup Demo Data

If live capture fails, use pre-recorded data:

```bash
# Create sample packets file
echo '[
  {"ts": 1640995200, "src": "192.168.1.100", "dst": "8.8.8.8", "proto": "TCP", "sport": 443, "dport": 80},
  {"ts": 1640995201, "src": "192.168.1.100", "dst": "1.1.1.1", "proto": "UDP", "sport": 53, "dport": 53}
]' > demo-packets.json
```

## 📊 Demo Metrics

### Success Indicators

- **Setup Time**: < 2 minutes from clone to running
- **Packet Latency**: < 2 seconds from capture to display
- **AI Response Time**: < 10 seconds for analysis
- **Anomaly Detection**: Alerts within 5 seconds of traffic spike

### Audience Engagement

- **Interactive Elements**: Let audience suggest BPF filters
- **Q&A Moments**: Pause for questions after each major feature
- **Real-world Examples**: Use scenarios relevant to audience

## 🎯 Key Takeaways

### For Network Administrators
- **Simplified Monitoring**: Web interface vs command-line tools
- **Real-time Visibility**: Immediate insight into network activity
- **Collaborative Analysis**: Shareable interface for team troubleshooting

### For Security Analysts
- **Anomaly Detection**: Automated identification of suspicious patterns
- **AI-Powered Analysis**: Intelligent explanations of complex packets
- **Rapid Response**: Quick identification and analysis of threats

### For Developers
- **Easy Integration**: Simple API for custom applications
- **Modern Architecture**: FastAPI + React + WebSocket stack
- **Extensible Design**: Plugin architecture for custom features

---

**Ready to demo? Run `sudo make start-demo` and show the world! 🚀**