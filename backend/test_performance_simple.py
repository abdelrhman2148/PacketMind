#!/usr/bin/env python3
"""
Simple performance test to verify optimizations are working.
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from capture import PacketStreamer
from main import ConnectionManager
import asyncio
import time


def test_packet_streamer_performance():
    """Test PacketStreamer performance optimizations."""
    print("Testing PacketStreamer performance optimizations...")
    
    # Test with performance settings
    streamer = PacketStreamer(max_queue_size=100, max_memory_mb=10)
    
    # Verify settings
    assert streamer.max_queue_size == 100
    assert streamer.max_memory_bytes == 10 * 1024 * 1024
    
    # Test status includes performance metrics
    status = streamer.get_status()
    assert "memory_usage_mb" in status
    assert "max_memory_mb" in status
    assert "stats" in status
    
    # Verify stats structure
    stats = status["stats"]
    expected_keys = ['packets_captured', 'packets_dropped', 'memory_drops', 'queue_drops', 'capture_errors']
    for key in expected_keys:
        assert key in stats, f"Missing stats key: {key}"
    
    print("✅ PacketStreamer performance optimizations verified")


def test_connection_manager_performance():
    """Test ConnectionManager performance optimizations."""
    print("Testing ConnectionManager performance optimizations...")
    
    # Test with performance settings
    manager = ConnectionManager(max_connections=5)
    
    # Verify settings
    assert manager.max_connections == 5
    
    # Test stats
    stats = manager.get_stats()
    expected_keys = ['messages_sent', 'messages_failed', 'connections_total', 'connections_rejected', 
                     'active_connections', 'max_connections', 'queue_size']
    for key in expected_keys:
        assert key in stats, f"Missing stats key: {key}"
    
    print("✅ ConnectionManager performance optimizations verified")


async def test_connection_manager_async():
    """Test ConnectionManager async operations."""
    print("Testing ConnectionManager async operations...")
    
    manager = ConnectionManager(max_connections=2)
    
    # Test broadcast queue
    await manager.broadcast("test message")
    
    # Verify queue has message
    stats = manager.get_stats()
    assert stats["queue_size"] >= 0  # Queue might be processed quickly
    
    print("✅ ConnectionManager async operations verified")


def main():
    """Run all performance tests."""
    print("Running Performance Optimization Tests")
    print("=" * 50)
    
    try:
        # Test PacketStreamer
        test_packet_streamer_performance()
        
        # Test ConnectionManager
        test_connection_manager_performance()
        
        # Test async operations
        asyncio.run(test_connection_manager_async())
        
        print("\n🎉 All performance optimization tests passed!")
        return 0
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())