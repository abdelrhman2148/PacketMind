#!/bin/bash

# Wireshark+ Web Dashboard - Traffic Generation Script
# This script generates various types of network traffic for testing the dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DURATION=60  # Default duration in seconds
INTENSITY="medium"  # low, medium, high

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --duration SECONDS    Duration to generate traffic (default: 60)"
    echo "  -i, --intensity LEVEL     Traffic intensity: low, medium, high (default: medium)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                       # Generate medium traffic for 60 seconds"
    echo "  $0 -d 120 -i high       # Generate high traffic for 2 minutes"
    echo "  $0 --duration 30 --intensity low"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--duration)
            DURATION="$2"
            shift 2
            ;;
        -i|--intensity)
            INTENSITY="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate intensity
case $INTENSITY in
    low|medium|high)
        ;;
    *)
        print_error "Invalid intensity: $INTENSITY. Must be low, medium, or high"
        exit 1
        ;;
esac

# Set traffic parameters based on intensity
case $INTENSITY in
    low)
        HTTP_REQUESTS=5
        DNS_QUERIES=3
        PING_COUNT=10
        CONCURRENT_JOBS=2
        ;;
    medium)
        HTTP_REQUESTS=15
        DNS_QUERIES=8
        PING_COUNT=20
        CONCURRENT_JOBS=4
        ;;
    high)
        HTTP_REQUESTS=30
        DNS_QUERIES=15
        PING_COUNT=50
        CONCURRENT_JOBS=8
        ;;
esac

print_status "Starting traffic generation..."
print_status "Duration: ${DURATION}s, Intensity: $INTENSITY"
print_status "This will generate HTTP, DNS, ICMP, and TCP traffic"

# Function to generate HTTP traffic
generate_http_traffic() {
    local requests=$1
    print_status "Generating HTTP traffic ($requests requests)..."
    
    local urls=(
        "http://httpbin.org/get"
        "http://httpbin.org/json"
        "http://httpbin.org/user-agent"
        "http://httpbin.org/headers"
        "http://example.com"
        "http://httpbin.org/status/200"
        "http://httpbin.org/delay/1"
    )
    
    for ((i=1; i<=requests; i++)); do
        local url=${urls[$((RANDOM % ${#urls[@]}))]}
        curl -s -m 5 "$url" > /dev/null 2>&1 &
        sleep 0.5
    done
}

# Function to generate DNS queries
generate_dns_traffic() {
    local queries=$1
    print_status "Generating DNS traffic ($queries queries)..."
    
    local domains=(
        "google.com"
        "github.com"
        "stackoverflow.com"
        "reddit.com"
        "wikipedia.org"
        "cloudflare.com"
        "amazon.com"
        "microsoft.com"
    )
    
    for ((i=1; i<=queries; i++)); do
        local domain=${domains[$((RANDOM % ${#domains[@]}))]}
        nslookup "$domain" > /dev/null 2>&1 &
        sleep 0.3
    done
}

# Function to generate ICMP traffic
generate_icmp_traffic() {
    local count=$1
    print_status "Generating ICMP traffic ($count pings)..."
    
    local hosts=(
        "8.8.8.8"
        "1.1.1.1"
        "google.com"
        "github.com"
    )
    
    for host in "${hosts[@]}"; do
        ping -c $((count/4)) "$host" > /dev/null 2>&1 &
    done
}

# Function to generate TCP connection attempts
generate_tcp_traffic() {
    print_status "Generating TCP connection attempts..."
    
    local ports=(22 80 443 8080 3000 5432 3306)
    local hosts=("google.com" "github.com" "stackoverflow.com")
    
    for host in "${hosts[@]}"; do
        for port in "${ports[@]}"; do
            timeout 2 nc -z "$host" "$port" > /dev/null 2>&1 &
            sleep 0.1
        done
    done
}

# Function to generate anomaly traffic (burst)
generate_anomaly_traffic() {
    print_status "Generating traffic burst for anomaly detection..."
    
    # Generate a burst of requests
    for ((i=1; i<=50; i++)); do
        curl -s -m 2 "http://httpbin.org/get?burst=$i" > /dev/null 2>&1 &
        nslookup "test$i.example.com" > /dev/null 2>&1 &
    done
    
    print_warning "Traffic burst generated - should trigger anomaly detection!"
}

# Function to cleanup background jobs
cleanup() {
    print_status "Cleaning up background processes..."
    jobs -p | xargs -r kill 2>/dev/null || true
    wait 2>/dev/null || true
    print_success "Traffic generation stopped"
}

# Set up signal handler
trap cleanup SIGINT SIGTERM

# Check if required tools are available
print_status "Checking required tools..."
for tool in curl nslookup ping nc; do
    if ! command -v $tool &> /dev/null; then
        print_error "$tool is required but not installed"
        exit 1
    fi
done
print_success "All required tools are available"

# Start traffic generation
start_time=$(date +%s)
end_time=$((start_time + DURATION))

print_success "Starting traffic generation for ${DURATION} seconds..."
echo ""

# Generate initial burst of different traffic types
generate_http_traffic $HTTP_REQUESTS &
generate_dns_traffic $DNS_QUERIES &
generate_icmp_traffic $PING_COUNT &
generate_tcp_traffic &

# Continue generating traffic until duration expires
while [ $(date +%s) -lt $end_time ]; do
    remaining=$((end_time - $(date +%s)))
    print_status "Traffic generation in progress... ${remaining}s remaining"
    
    # Generate continuous traffic
    generate_http_traffic $((HTTP_REQUESTS/4)) &
    generate_dns_traffic $((DNS_QUERIES/2)) &
    
    # Occasionally generate anomaly traffic
    if [ $((RANDOM % 10)) -eq 0 ]; then
        generate_anomaly_traffic &
    fi
    
    sleep 5
done

print_success "Traffic generation duration completed"

# Generate one final anomaly burst
print_status "Generating final anomaly burst..."
generate_anomaly_traffic

# Wait a bit for final traffic to complete
sleep 5

# Cleanup
cleanup

print_success "Traffic generation complete!"
print_status "Check your Wireshark+ Web Dashboard to see the captured packets"
print_status "Look for anomaly alerts from the traffic bursts"