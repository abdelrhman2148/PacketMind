#!/bin/bash

# Wireshark+ Web Dashboard - Setup Verification Script
# This script verifies that all components are properly installed and configured

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
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Track overall status
ERRORS=0
WARNINGS=0

# Function to check command availability
check_command() {
    local cmd=$1
    local name=$2
    local required=$3
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1 || echo "unknown")
        print_success "$name is installed: $version"
        return 0
    else
        if [ "$required" = "true" ]; then
            print_error "$name is required but not installed"
            ERRORS=$((ERRORS + 1))
        else
            print_warning "$name is not installed (optional)"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

# Function to check Python package
check_python_package() {
    local package=$1
    local location=$2
    
    if [ -n "$location" ]; then
        cd "$location"
    fi
    
    if python3 -c "import $package" 2>/dev/null; then
        print_success "Python package '$package' is available"
        return 0
    else
        print_error "Python package '$package' is not installed"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    if [ -n "$location" ]; then
        cd - > /dev/null
    fi
}

# Function to check Node.js package
check_node_package() {
    local package=$1
    local location=$2
    
    if [ -n "$location" ]; then
        cd "$location"
    fi
    
    if [ -f "node_modules/$package/package.json" ]; then
        print_success "Node.js package '$package' is installed"
        return 0
    else
        print_error "Node.js package '$package' is not installed"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    if [ -n "$location" ]; then
        cd - > /dev/null
    fi
}

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        print_success "$description exists: $file"
        return 0
    else
        print_error "$description not found: $file"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check directory exists
check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        print_success "$description exists: $dir"
        return 0
    else
        print_error "$description not found: $dir"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check port availability
check_port() {
    local port=$1
    local description=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "$description port $port is in use"
        WARNINGS=$((WARNINGS + 1))
        return 1
    else
        print_success "$description port $port is available"
        return 0
    fi
}

# Function to check network interfaces
check_interfaces() {
    print_status "Checking network interfaces..."
    
    if command -v ip &> /dev/null; then
        local interfaces=$(ip link show | grep -E '^[0-9]+:' | cut -d: -f2 | tr -d ' ' | grep -v lo)
    elif command -v ifconfig &> /dev/null; then
        local interfaces=$(ifconfig | grep -E '^[a-zA-Z0-9]+:' | cut -d: -f1 | grep -v lo)
    else
        print_error "Cannot check network interfaces (no ip or ifconfig command)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    if [ -n "$interfaces" ]; then
        print_success "Network interfaces found: $(echo $interfaces | tr '\n' ' ')"
        return 0
    else
        print_error "No network interfaces found"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check permissions
check_permissions() {
    print_status "Checking packet capture permissions..."
    
    if [ "$EUID" -eq 0 ]; then
        print_success "Running as root - packet capture will work"
        return 0
    fi
    
    # Check for capabilities on Linux
    if command -v getcap &> /dev/null; then
        local caps=$(getcap $(which python3) 2>/dev/null || echo "")
        if echo "$caps" | grep -q "cap_net_raw\|cap_net_admin"; then
            print_success "Python has packet capture capabilities"
            return 0
        fi
    fi
    
    print_warning "Not running as root and no capabilities set"
    print_warning "Packet capture will require sudo privileges"
    WARNINGS=$((WARNINGS + 1))
    return 1
}

echo "🔍 Wireshark+ Web Dashboard - Setup Verification"
echo "================================================"
echo ""

# Check system requirements
print_status "Checking system requirements..."
check_command "python3" "Python 3" true
check_command "pip3" "pip3" true
check_command "node" "Node.js" true
check_command "npm" "npm" true

# Check optional tools
print_status "Checking optional tools..."
check_command "curl" "curl" false
check_command "nc" "netcat" false
check_command "nslookup" "nslookup" false
check_command "ping" "ping" false

# Check project structure
print_status "Checking project structure..."
check_directory "backend" "Backend directory"
check_directory "frontend" "Frontend directory"
check_directory "scripts" "Scripts directory"
check_file "Makefile" "Makefile"
check_file "README.md" "README.md"

# Check configuration files
print_status "Checking configuration files..."
check_file "backend/requirements.txt" "Backend requirements.txt"
check_file "frontend/package.json" "Frontend package.json"
check_file "backend/.env.example" "Backend .env.example"

# Check if .env exists, create if not
if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found, creating from template..."
    cp backend/.env.example backend/.env
    print_success "Created backend/.env from template"
fi

# Check Python dependencies
print_status "Checking Python dependencies..."
check_python_package "fastapi" "backend"
check_python_package "uvicorn" "backend"
check_python_package "scapy" "backend"
check_python_package "pydantic" "backend"

# Check Node.js dependencies
print_status "Checking Node.js dependencies..."
if [ -d "frontend/node_modules" ]; then
    check_node_package "react" "frontend"
    check_node_package "vite" "frontend"
else
    print_error "Frontend node_modules not found - run 'make install-frontend'"
    ERRORS=$((ERRORS + 1))
fi

# Check ports
print_status "Checking port availability..."
check_port 8000 "Backend"
check_port 5173 "Frontend"

# Check network interfaces
check_interfaces

# Check permissions
check_permissions

# Check script permissions
print_status "Checking script permissions..."
for script in scripts/*.sh; do
    if [ -x "$script" ]; then
        print_success "Script is executable: $script"
    else
        print_error "Script is not executable: $script"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "================================================"
echo "📊 Verification Summary"
echo "================================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "All checks passed! ✨"
    echo ""
    echo "🚀 Ready to start the demo:"
    echo "   sudo make start-demo"
elif [ $ERRORS -eq 0 ]; then
    print_warning "Setup is mostly ready with $WARNINGS warnings"
    echo ""
    echo "🚀 You can try starting the demo:"
    echo "   sudo make start-demo"
else
    print_error "Found $ERRORS errors and $WARNINGS warnings"
    echo ""
    echo "🔧 Fix the errors above, then run:"
    echo "   make setup"
    echo "   ./scripts/verify-setup.sh"
fi

echo ""
echo "📚 For detailed setup instructions, see:"
echo "   - README.md (quick start)"
echo "   - SETUP.md (detailed guide)"

exit $ERRORS