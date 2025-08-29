#!/bin/bash

# Wireshark+ Web Dashboard - Demo Stop Script
# This script stops all demo services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PID_FILE="/tmp/wireshark-web-demo.pids"
BACKEND_PORT=8000
FRONTEND_PORT=5173

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

# Function to kill process by PID
kill_process() {
    local pid=$1
    local name=$2
    
    if kill -0 $pid 2>/dev/null; then
        print_status "Stopping $name (PID: $pid)"
        kill $pid 2>/dev/null || true
        
        # Wait up to 5 seconds for graceful shutdown
        for i in {1..5}; do
            if ! kill -0 $pid 2>/dev/null; then
                print_success "$name stopped gracefully"
                return 0
            fi
            sleep 1
        done
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            print_warning "Force killing $name (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
            sleep 1
            if kill -0 $pid 2>/dev/null; then
                print_error "Failed to stop $name (PID: $pid)"
                return 1
            else
                print_success "$name force stopped"
            fi
        fi
    else
        print_status "$name (PID: $pid) was not running"
    fi
    return 0
}

# Function to kill processes by port
kill_by_port() {
    local port=$1
    local name=$2
    
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        print_status "Found $name processes on port $port: $pids"
        for pid in $pids; do
            kill_process $pid "$name"
        done
    else
        print_status "No processes found on port $port"
    fi
}

print_status "Stopping Wireshark+ Web Dashboard services..."

# Stop processes from PID file if it exists
if [ -f "$PID_FILE" ]; then
    print_status "Stopping services from PID file..."
    while read pid; do
        if [ -n "$pid" ]; then
            kill_process $pid "demo service"
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
    print_success "PID file cleaned up"
else
    print_warning "PID file not found, searching by port..."
fi

# Also check for any remaining processes on the demo ports
print_status "Checking for remaining processes on demo ports..."
kill_by_port $BACKEND_PORT "backend"
kill_by_port $FRONTEND_PORT "frontend"

# Clean up any Python processes running uvicorn with our app
print_status "Cleaning up any remaining uvicorn processes..."
pkill -f "uvicorn.*main:app" 2>/dev/null || true

# Clean up any Node processes running Vite dev server
print_status "Cleaning up any remaining Vite processes..."
pkill -f "vite.*dev" 2>/dev/null || true

print_success "All demo services have been stopped"

# Check if ports are now free
sleep 1
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port $BACKEND_PORT may still be in use"
else
    print_success "Port $BACKEND_PORT is now free"
fi

if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port $FRONTEND_PORT may still be in use"
else
    print_success "Port $FRONTEND_PORT is now free"
fi

print_success "Demo shutdown complete"