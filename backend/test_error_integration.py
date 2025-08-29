#!/usr/bin/env python3
"""
Simple integration test script to verify error handling works.
This can be run manually to test error scenarios.
"""

import asyncio
import json
from fastapi.testclient import TestClient
from unittest.mock import patch
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app

def test_error_handling_integration():
    """Test various error handling scenarios."""
    client = TestClient(app)
    
    print("Testing error handling integration...")
    
    # Test 1: Invalid BPF filter (Requirement 4.5)
    print("\n1. Testing invalid BPF filter handling...")
    with patch('main.check_packet_capture_privileges', return_value=True):
        with patch('main.PacketStreamer.get_interfaces', return_value=['eth0']):
            response = client.post("/capture/settings", json={
                "iface": "eth0",
                "bpf": "tcp and (port 80"  # Missing closing parenthesis
            })
            
            assert response.status_code == 400
            assert "unmatched parentheses" in response.json()["detail"]
            print("✓ Invalid BPF filter properly rejected")
    
    # Test 2: AI service error handling (Requirement 3.5)
    print("\n2. Testing AI service error handling...")
    response = client.post("/ai/explain", json={
        "summary": ""  # Empty summary should be rejected
    })
    
    assert response.status_code == 400
    assert "required" in response.json()["detail"]
    print("✓ Empty AI summary properly rejected")
    
    # Test 3: AI timeout simulation
    print("\n3. Testing AI timeout handling...")
    with patch('main.openai_client') as mock_client:
        mock_client.chat.completions.create.side_effect = asyncio.TimeoutError()
        
        response = client.post("/ai/explain", json={
            "summary": "TCP 1.1.1.1:443 -> 2.2.2.2:80 len=100"
        })
        
        assert response.status_code == 504
        assert "timed out" in response.json()["detail"]
        print("✓ AI timeout properly handled")
    
    # Test 4: Interface validation (Requirement 4.5)
    print("\n4. Testing interface validation...")
    with patch('main.check_packet_capture_privileges', return_value=True):
        with patch('main.PacketStreamer.get_interfaces', return_value=['eth0', 'lo']):
            response = client.post("/capture/settings", json={
                "iface": "nonexistent_interface",
                "bpf": ""
            })
            
            assert response.status_code == 400
            assert "not found" in response.json()["detail"]
            print("✓ Invalid interface properly rejected")
    
    # Test 5: Privilege error handling (Requirement 1.5)
    print("\n5. Testing privilege error handling...")
    with patch('main.check_packet_capture_privileges', return_value=False):
        with patch('main.get_privilege_status', return_value={'platform': 'linux'}):
            with patch('main.get_setup_instructions', return_value={
                'error_message': 'Insufficient privileges',
                'suggestions': ['Run with sudo', 'Set capabilities']
            }):
                response = client.post("/capture/settings", json={
                    "iface": "eth0",
                    "bpf": ""
                })
                
                assert response.status_code == 403
                error_detail = response.json()["detail"]
                assert "Insufficient privileges" in error_detail["error"]
                print("✓ Privilege error properly handled")
    
    # Test 6: System status error handling
    print("\n6. Testing system status error handling...")
    with patch('main.packet_streamer.get_status', side_effect=Exception("System error")):
        response = client.get("/status")
        
        assert response.status_code == 500
        assert "Failed to retrieve system status" in response.json()["detail"]
        print("✓ System status error properly handled")
    
    print("\n✅ All error handling tests passed!")

if __name__ == "__main__":
    test_error_handling_integration()