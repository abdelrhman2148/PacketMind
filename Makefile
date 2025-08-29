# Wireshark+ Web Dashboard - Setup and Demo Automation
# Requires: Python 3.8+, Node.js 16+, sudo privileges for packet capture

.PHONY: help setup install-backend install-frontend start-demo stop-demo test clean generate-traffic

# Default target
help:
	@echo "Wireshark+ Web Dashboard - Available Commands:"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make setup           - Complete setup (install all dependencies)"
	@echo "  make install-backend - Install Python backend dependencies"
	@echo "  make install-frontend- Install React frontend dependencies"
	@echo "  make setup-capabilities - Setup Linux capabilities (Linux only)"
	@echo ""
	@echo "Demo Commands:"
	@echo "  make start-demo      - Start both backend and frontend services"
	@echo "  make stop-demo       - Stop all demo services"
	@echo "  make generate-traffic- Generate test network traffic"
	@echo ""
	@echo "Development Commands:"
	@echo "  make test           - Run all tests (backend and frontend)"
	@echo "  make test-backend   - Run backend tests only"
	@echo "  make test-frontend  - Run frontend tests only"
	@echo "  make test-performance - Run comprehensive performance tests"
	@echo "  make test-load      - Run WebSocket load test"
	@echo "  make monitor        - Start performance monitoring"
	@echo "  make perf-check     - Quick performance check"
	@echo "  make clean          - Clean build artifacts and caches"
	@echo ""
	@echo "Platform-Specific Setup:"
	@echo "  Linux:   make setup-capabilities  # Set capabilities, then 'make start-demo'"
	@echo "  macOS:   sudo make start-demo     # Requires sudo"
	@echo "  Windows: Run as Administrator     # See SETUP.md for details"
	@echo ""
	@echo "Requirements:"
	@echo "  - Python 3.8+ with pip"
	@echo "  - Node.js 16+ with npm"
	@echo "  - Packet capture privileges (platform-specific)"

# Complete setup
setup: install-backend install-frontend
	@echo "✅ Setup complete! Run 'make start-demo' to begin."

# Setup Linux capabilities (Linux only)
setup-capabilities:
	@echo "🔧 Setting up Linux capabilities for packet capture..."
	@./scripts/setup-capabilities.sh
	@echo "✅ Capabilities setup complete!"

# Install backend dependencies
install-backend:
	@echo "📦 Installing Python backend dependencies..."
	cd backend && python -m pip install --upgrade pip
	cd backend && pip install -r requirements.txt
	@echo "✅ Backend dependencies installed"

# Install frontend dependencies  
install-frontend:
	@echo "📦 Installing React frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Frontend dependencies installed"

# Start demo services
start-demo:
	@echo "🚀 Starting Wireshark+ Web Dashboard demo..."
	@echo "Backend will start on http://localhost:8000"
	@echo "Frontend will start on http://localhost:5173"
	@echo ""
	@echo "⚠️  This requires sudo privileges for packet capture!"
	@echo "Press Ctrl+C to stop both services"
	@./scripts/start-demo.sh

# Stop demo services
stop-demo:
	@echo "🛑 Stopping demo services..."
	@./scripts/stop-demo.sh
	@echo "✅ Demo services stopped"

# Generate test traffic
generate-traffic:
	@echo "🌐 Generating test network traffic..."
	@echo "This will create various types of network activity for testing"
	@./scripts/generate-traffic.sh

# Run all tests
test: test-backend test-frontend
	@echo "✅ All tests completed"

# Run backend tests
test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && python -m pytest -v

# Run frontend tests  
test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

# Run performance tests
test-performance:
	@echo "⚡ Running performance tests..."
	@echo "This will test latency, memory usage, and concurrent client handling"
	cd backend && python run_performance_tests.py

# Run WebSocket load test
test-load:
	@echo "🔄 Running WebSocket load test..."
	cd backend && python test_load_websocket.py --clients 20 --duration 60

# Monitor performance
monitor:
	@echo "📊 Starting performance monitoring..."
	@echo "Press Ctrl+C to stop monitoring"
	cd backend && python monitor_performance.py

# Quick performance check
perf-check:
	@echo "⚡ Quick performance check..."
	cd backend && python monitor_performance.py --once

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	cd backend && rm -rf __pycache__ .pytest_cache *.pyc
	cd frontend && rm -rf node_modules/.cache dist
	@echo "✅ Cleanup complete"

# Check system requirements
check-requirements:
	@echo "🔍 Checking system requirements..."
	@python3 --version || (echo "❌ Python 3.8+ required" && exit 1)
	@node --version || (echo "❌ Node.js 16+ required" && exit 1)
	@npm --version || (echo "❌ npm required" && exit 1)
	@echo "✅ System requirements met"