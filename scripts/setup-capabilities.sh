#!/bin/bash

# Wireshark+ Web Dashboard - Linux Capabilities Setup Script
# This script sets up packet capture capabilities for Python on Linux systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_error "This script is only for Linux systems"
    print_status "For other platforms, see the setup documentation"
    exit 1
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "This script should not be run as root"
    print_status "Run as a regular user - it will use sudo when needed"
    exit 1
fi

print_status "Setting up Linux capabilities for packet capture..."
echo ""

# Find Python executable
PYTHON_PATH=$(which python3)
if [ -z "$PYTHON_PATH" ]; then
    print_error "Python 3 not found in PATH"
    exit 1
fi

print_status "Python executable: $PYTHON_PATH"

# Check if setcap is available
if ! command -v setcap &> /dev/null; then
    print_error "setcap command not found"
    print_status "Installing libcap2-bin package..."
    
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install -y libcap2-bin
    elif command -v yum &> /dev/null; then
        sudo yum install -y libcap
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y libcap
    elif command -v pacman &> /dev/null; then
        sudo pacman -S libcap
    else
        print_error "Could not install libcap2-bin automatically"
        print_status "Please install the libcap development package for your distribution"
        exit 1
    fi
    
    print_success "Installed libcap2-bin package"
fi

# Check current capabilities
print_status "Checking current capabilities..."
CURRENT_CAPS=$(getcap "$PYTHON_PATH" 2>/dev/null || echo "none")
print_status "Current capabilities: $CURRENT_CAPS"

# Set capabilities
print_status "Setting packet capture capabilities..."
print_warning "This will require sudo privileges"

if sudo setcap cap_net_raw,cap_net_admin=eip "$PYTHON_PATH"; then
    print_success "Successfully set capabilities on $PYTHON_PATH"
else
    print_error "Failed to set capabilities"
    exit 1
fi

# Verify capabilities were set
print_status "Verifying capabilities..."
NEW_CAPS=$(getcap "$PYTHON_PATH" 2>/dev/null || echo "none")
print_status "New capabilities: $NEW_CAPS"

if echo "$NEW_CAPS" | grep -q "cap_net_raw\|cap_net_admin"; then
    print_success "Capabilities verified successfully!"
else
    print_error "Capability verification failed"
    exit 1
fi

echo ""
print_success "🎉 Setup complete!"
echo ""
echo -e "${GREEN}What this means:${NC}"
echo -e "  ✓ Python can now capture packets without sudo"
echo -e "  ✓ You can run 'make start-demo' without sudo"
echo -e "  ✓ The application will have packet capture privileges"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Run 'make start-demo' (no sudo needed)"
echo -e "  2. Open http://localhost:5173 in your browser"
echo -e "  3. Select a network interface and start capturing"
echo ""
echo -e "${BLUE}Note:${NC} If you update Python, you'll need to run this script again"
echo ""

# Test the setup
print_status "Testing packet capture privileges..."
cd "$(dirname "$0")/.."

if python3 -c "
import sys
sys.path.append('backend')
from privileges import check_packet_capture_privileges
if check_packet_capture_privileges():
    print('✓ Packet capture privileges confirmed')
    exit(0)
else:
    print('✗ Packet capture privileges not working')
    exit(1)
" 2>/dev/null; then
    print_success "Privilege test passed!"
else
    print_warning "Privilege test failed - you may still need sudo for some operations"
fi

echo ""
print_status "Setup script completed successfully"