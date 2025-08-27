#!/usr/bin/env python3
"""
Manual test script to verify WebSocket functionality.
This script can be run to test the WebSocket endpoint manually.
"""

import asyncio
import websockets
import json
import time
from models import PacketOut

async def test_websocket_connection():
    """Test WebSocket connection to the running server."""
    uri = "ws://localhost:8000/ws/packets"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✓ Connected to WebSocket endpoint")
            
            # Send ping
            await websocket.send("ping")
            response = await websocket.recv()
            print(f"✓ Ping response: {response}")
            
            # Wait for potential packet data
            print("Waiting for packet data (5 seconds)...")
            try:
                data = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                packet = json.loads(data)
                print(f"✓ Received packet: {packet['src']} -> {packet['dst']} ({packet['proto']})")
            except asyncio.TimeoutError:
                print("ℹ No packet data received (expected if no capture is active)")
            
    except ConnectionRefusedError:
        print("✗ Could not connect to WebSocket - make sure server is running")
        print("  Start server with: uvicorn main:app --reload")
    except Exception as e:
        print(f"✗ WebSocket test failed: {e}")

def test_packet_serialization():
    """Test that PacketOut model serializes correctly."""
    packet = PacketOut(
        ts=time.time(),
        src="192.168.1.100",
        dst="8.8.8.8",
        proto="TCP",
        length=1500,
        sport=443,
        dport=80,
        summary="TCP 192.168.1.100:443 -> 8.8.8.8:80 len=1500"
    )
    
    json_data = packet.model_dump_json()
    parsed = json.loads(json_data)
    
    print("✓ Packet serialization test passed")
    print(f"  Sample packet: {parsed['src']} -> {parsed['dst']} ({parsed['proto']})")

if __name__ == "__main__":
    print("=== WebSocket Manual Test ===")
    
    # Test packet serialization
    test_packet_serialization()
    
    # Test WebSocket connection
    print("\n=== WebSocket Connection Test ===")
    print("Note: This requires the server to be running on localhost:8000")
    asyncio.run(test_websocket_connection())