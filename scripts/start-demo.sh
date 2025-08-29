#!/bin/bash

# Wireshark+ Web Dashboard - Demo Startup Script
# This script starts both backend and frontend services for the demo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8000
FRONTEND_PORT=5173
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
PID_FILE="/tmp/wireshark-web-demo.pids"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down services..."
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                print_status "Stopping process $pid"
                kill $pid 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    print_success "Demo stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check system requirements
print_status "Checking system requirements..."

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi

# Check if running as root or with sudo (required for packet capture)
if [ "$EUID" -ne 0 ]; then
    print_warning "This script requires sudo privileges for packet capture"
    print_status "Please run: sudo make start-demo"
    exit 1
fi

# Check if ports are available
if ! check_port $BACKEND_PORT; then
    print_error "Port $BACKEND_PORT is already in use"
    exit 1
fi

if ! check_port $FRONTEND_PORT; then
    print_error "Port $FRONTEND_PORT is already in use"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "$BACKEND_DIR/venv" ] && ! python3 -c "import fastapi" 2>/dev/null; then
    print_warning "Backend dependencies may not be installed"
    print_status "Run 'make install-backend' first"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    print_warning "Frontend dependencies may not be installed"
    print_status "Run 'make install-frontend' first"
fi

print_success "System requirements check passed"

# Start backend service
print_status "Starting backend service on port $BACKEND_PORT..."
cd $BACKEND_DIR

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
fi

# Start backend with uvicorn
python3 -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
BACKEND_PID=$!
echo $BACKEND_PID >> "../$PID_FILE"

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Failed to start backend service"
    cleanup
    exit 1
fi

print_success "Backend service started (PID: $BACKEND_PID)"
cd ..

# Start frontend service
print_status "Starting frontend service on port $FRONTEND_PORT..."
cd $FRONTEND_DIR

# Start frontend with Vite
npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT &
FRONTEND_PID=$!
echo $FRONTEND_PID >> "../$PID_FILE"

# Wait for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Failed to start frontend service"
    cleanup
    exit 1
fi

print_success "Frontend service started (PID: $FRONTEND_PID)"
cd ..

# Display startup information
echo ""
print_success "🚀 Wireshark+ Web Dashboard is now running!"
echo ""
echo -e "${GREEN}Services:${NC}"
echo -e "  Backend API: ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "  Frontend UI: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  WebSocket:   ${BLUE}ws://localhost:$BACKEND_PORT/ws/packets${NC}"
echo ""
echo -e "${GREEN}Available endpoints:${NC}"
echo -e "  GET  /interfaces     - List network interfaces"
echo -e "  POST /capture/settings - Configure capture settings"
echo -e "  POST /ai/explain     - AI packet analysis"
echo -e "  WS   /ws/packets     - Real-time packet stream"
echo ""
echo -e "${YELLOW}Usage:${NC}"
echo -e "  1. Open ${BLUE}http://localhost:$FRONTEND_PORT${NC} in your browser"
echo -e "  2. Select a network interface from the dropdown"
echo -e "  3. Optionally set a BPF filter (e.g., 'port 80')"
echo -e "  4. Watch live packets appear in the table"
echo -e "  5. Click on packets to see details and AI analysis"
echo ""
echo -e "${YELLOW}Generate test traffic:${NC}"
echo -e "  Run 'make generate-traffic' in another terminal"
echo ""
print_warning "Press Ctrl+C to stop both services"

# Keep script running and wait for signals
while true; do
    sleep 1
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend service died unexpectedly"
        cleanup
        exit 1
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend service died unexpectedly"
        cleanup
        exit 1
    fi
done