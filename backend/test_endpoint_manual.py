#!/usr/bin/env python3
"""
Manual test script for the AI endpoint.
This script tests the /ai/explain endpoint directly.
"""

import requests
import json
import time
import subprocess
import signal
import os
import sys
from threading import Thread

def start_server():
    """Start the FastAPI server in the background."""
    env = os.environ.copy()
    env["USE_MOCK_AI"] = "true"  # Use mock mode for testing
    
    return subprocess.Popen([
        sys.executable, "-m", "uvicorn", "main:app", 
        "--host", "127.0.0.1", "--port", "8000", "--log-level", "error"
    ], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def test_ai_endpoint():
    """Test the AI endpoint functionality."""
    base_url = "http://127.0.0.1:8000"
    
    print("Testing AI endpoint...")
    
    # Test 1: Basic HTTPS packet
    print("\n1. Testing HTTPS packet analysis...")
    response = requests.post(f"{base_url}/ai/explain", json={
        "summary": "TCP 192.168.1.100:443 -> 8.8.8.8:443 len=1500"
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Is Mock: {data['is_mock']}")
        print(f"✓ Explanation: {data['explanation'][:100]}...")
        assert "HTTPS traffic" in data['explanation']
        assert data['is_mock'] is True
    else:
        print(f"✗ Failed with status {response.status_code}: {response.text}")
        return False
    
    # Test 2: HTTP packet
    print("\n2. Testing HTTP packet analysis...")
    response = requests.post(f"{base_url}/ai/explain", json={
        "summary": "TCP 192.168.1.100:80 -> 8.8.8.8:80 len=1200"
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Explanation: {data['explanation'][:100]}...")
        assert "HTTP traffic" in data['explanation']
    else:
        print(f"✗ Failed with status {response.status_code}: {response.text}")
        return False
    
    # Test 3: DNS packet
    print("\n3. Testing DNS packet analysis...")
    response = requests.post(f"{base_url}/ai/explain", json={
        "summary": "UDP 192.168.1.100:53 -> 8.8.8.8:53 len=64"
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Explanation: {data['explanation'][:100]}...")
        assert "DNS traffic" in data['explanation']
    else:
        print(f"✗ Failed with status {response.status_code}: {response.text}")
        return False
    
    # Test 4: Empty summary (should fail)
    print("\n4. Testing empty summary (should fail)...")
    response = requests.post(f"{base_url}/ai/explain", json={
        "summary": ""
    })
    
    if response.status_code == 400:
        print(f"✓ Correctly rejected empty summary with status {response.status_code}")
    else:
        print(f"✗ Expected 400, got {response.status_code}: {response.text}")
        return False
    
    # Test 5: With context
    print("\n5. Testing packet with context...")
    response = requests.post(f"{base_url}/ai/explain", json={
        "summary": "TCP 192.168.1.100:443 -> 8.8.8.8:443 len=1500",
        "context": "This packet was captured during suspicious activity"
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Explanation: {data['explanation'][:100]}...")
    else:
        print(f"✗ Failed with status {response.status_code}: {response.text}")
        return False
    
    print("\n✓ All tests passed!")
    return True

def main():
    """Main test function."""
    print("Starting AI endpoint test...")
    
    # Start the server
    server = start_server()
    
    try:
        # Wait for server to start
        print("Waiting for server to start...")
        time.sleep(3)
        
        # Check if server is running
        try:
            response = requests.get("http://127.0.0.1:8000/")
            if response.status_code != 200:
                print("Server not responding correctly")
                return False
        except requests.exceptions.ConnectionError:
            print("Could not connect to server")
            return False
        
        # Run tests
        success = test_ai_endpoint()
        
        return success
        
    finally:
        # Clean up server
        print("\nShutting down server...")
        server.terminate()
        server.wait()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)