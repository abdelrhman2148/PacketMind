"""
Performance tests for Wireshark+ Web application.
Tests latency requirements, memory usage, and concurrent client handling.
Implements requirement 2.1, 2.3, 7.5 for performance validation.
"""

import asyncio
import time
import json
import statistics
import pytest
import websockets
import requests
from concurrent.futures import ThreadPoolExecutor
import psutil
import os
from typing import List, Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws/packets"
LATENCY_THRESHOLD = 2.0  # seconds (requirement 2.1)
MEMORY_THRESHOLD_MB = 200  # MB
MAX_CONCURRENT_CLIENTS = 10


class PerformanceTestError(Exception):
    """Custom exception for performance test failures."""
    pass


@pytest.fixture(scope="module")
def server_running():
    """Ensure server is running before tests."""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code != 200:
            pytest.skip("Server not running or not responding")
    except requests.RequestException:
        pytest.skip("Server not accessible")


class LatencyMeasurement:
    """Helper class for measuring WebSocket latency."""
    
    def __init__(self):
        self.measurements: List[float] = []
        self.start_time: float = 0
        self.packet_count: int = 0
    
    def start_measurement(self):
        """Start latency measurement."""
        self.start_time = time.time()
        self.measurements.clear()
        self.packet_count = 0
    
    def record_packet(self):
        """Record packet arrival time."""
        if self.start_time > 0:
            latency = time.time() - self.start_time
            self.measurements.append(latency)
            self.packet_count += 1
    
    def get_stats(self) -> Dict[str, float]:
        """Get latency statistics."""
        if not self.measurements:
            return {"count": 0}
        
        return {
            "count": len(self.measurements),
            "min": min(self.measurements),
            "max": max(self.measurements),
            "mean": statistics.mean(self.measurements),
            "median": statistics.median(self.measurements),
            "p95": statistics.quantiles(self.measurements, n=20)[18] if len(self.measurements) >= 20 else max(self.measurements),
            "p99": statistics.quantiles(self.measurements, n=100)[98] if len(self.measurements) >= 100 else max(self.measurements)
        }


@pytest.mark.asyncio
async def test_websocket_latency(server_running):
    """
    Test WebSocket packet streaming latency.
    Requirement 2.1: Packets should be streamed with less than 2 second latency.
    """
    latency_tracker = LatencyMeasurement()
    packets_received = 0
    test_duration = 10  # seconds
    
    async def packet_receiver():
        nonlocal packets_received
        try:
            async with websockets.connect(WS_URL) as websocket:
                latency_tracker.start_measurement()
                start_time = time.time()
                
                while time.time() - start_time < test_duration:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        
                        # Only measure packet data, not control messages
                        if "ts" in data and "src" in data:
                            latency_tracker.record_packet()
                            packets_received += 1
                            
                    except asyncio.TimeoutError:
                        continue
                    except json.JSONDecodeError:
                        continue
                        
        except Exception as e:
            raise PerformanceTestError(f"WebSocket connection failed: {e}")
    
    # Run the test
    await packet_receiver()
    
    # Analyze results
    stats = latency_tracker.get_stats()
    
    print(f"\nLatency Test Results:")
    print(f"Packets received: {packets_received}")
    print(f"Latency stats: {stats}")
    
    # Verify requirements
    if packets_received == 0:
        pytest.skip("No packets received during test - capture may not be active")
    
    assert stats["max"] < LATENCY_THRESHOLD, f"Maximum latency {stats['max']:.2f}s exceeds threshold {LATENCY_THRESHOLD}s"
    assert stats["p95"] < LATENCY_THRESHOLD * 0.8, f"95th percentile latency {stats['p95']:.2f}s too high"
    
    print("✓ Latency requirements met")


@pytest.mark.asyncio
async def test_concurrent_websocket_clients(server_running):
    """
    Test multiple concurrent WebSocket clients.
    Requirement 2.3: System should handle multiple concurrent clients efficiently.
    """
    client_results = []
    test_duration = 15  # seconds
    
    async def single_client(client_id: int):
        """Single client connection handler."""
        packets_received = 0
        connection_time = 0
        errors = 0
        
        try:
            start_connect = time.time()
            async with websockets.connect(WS_URL) as websocket:
                connection_time = time.time() - start_connect
                start_time = time.time()
                
                while time.time() - start_time < test_duration:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        
                        if "ts" in data and "src" in data:
                            packets_received += 1
                            
                    except asyncio.TimeoutError:
                        continue
                    except json.JSONDecodeError:
                        errors += 1
                        continue
                        
        except Exception as e:
            errors += 1
            print(f"Client {client_id} error: {e}")
        
        return {
            "client_id": client_id,
            "packets_received": packets_received,
            "connection_time": connection_time,
            "errors": errors
        }
    
    # Create concurrent clients
    print(f"\nTesting {MAX_CONCURRENT_CLIENTS} concurrent clients...")
    tasks = [single_client(i) for i in range(MAX_CONCURRENT_CLIENTS)]
    client_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Analyze results
    successful_clients = [r for r in client_results if isinstance(r, dict)]
    failed_clients = [r for r in client_results if not isinstance(r, dict)]
    
    print(f"Successful clients: {len(successful_clients)}")
    print(f"Failed clients: {len(failed_clients)}")
    
    if successful_clients:
        total_packets = sum(r["packets_received"] for r in successful_clients)
        avg_connection_time = statistics.mean(r["connection_time"] for r in successful_clients)
        total_errors = sum(r["errors"] for r in successful_clients)
        
        print(f"Total packets received: {total_packets}")
        print(f"Average connection time: {avg_connection_time:.3f}s")
        print(f"Total errors: {total_errors}")
        
        # Verify requirements
        assert len(successful_clients) >= MAX_CONCURRENT_CLIENTS * 0.8, "Too many client connection failures"
        assert avg_connection_time < 5.0, "Connection time too slow"
        assert total_errors < total_packets * 0.05, "Too many message errors"
        
        print("✓ Concurrent client requirements met")
    else:
        pytest.fail("No clients connected successfully")


def test_memory_usage_monitoring(server_running):
    """
    Test memory usage monitoring and limits.
    Requirement 2.3: System should monitor and limit memory usage.
    """
    # Get initial memory usage
    response = requests.get(f"{BASE_URL}/performance/stats")
    assert response.status_code == 200
    
    initial_stats = response.json()
    initial_memory = initial_stats["system"]["process_memory_mb"]
    
    print(f"\nInitial memory usage: {initial_memory:.2f} MB")
    
    # Generate some load by making multiple requests
    for _ in range(50):
        try:
            requests.get(f"{BASE_URL}/interfaces", timeout=1)
            requests.get(f"{BASE_URL}/status", timeout=1)
        except requests.RequestException:
            continue
    
    # Check memory usage after load
    response = requests.get(f"{BASE_URL}/performance/stats")
    assert response.status_code == 200
    
    final_stats = response.json()
    final_memory = final_stats["system"]["process_memory_mb"]
    memory_increase = final_memory - initial_memory
    
    print(f"Final memory usage: {final_memory:.2f} MB")
    print(f"Memory increase: {memory_increase:.2f} MB")
    
    # Verify memory constraints
    assert final_memory < MEMORY_THRESHOLD_MB, f"Memory usage {final_memory:.2f} MB exceeds threshold {MEMORY_THRESHOLD_MB} MB"
    assert memory_increase < 50, f"Memory increase {memory_increase:.2f} MB too high for light load"
    
    # Check capture statistics
    capture_stats = final_stats["capture"]
    print(f"Capture queue utilization: {capture_stats['queue_utilization']:.2%}")
    print(f"Capture memory utilization: {capture_stats['memory_utilization']:.2%}")
    
    assert capture_stats["queue_utilization"] < 0.9, "Capture queue utilization too high"
    assert capture_stats["memory_utilization"] < 0.9, "Capture memory utilization too high"
    
    print("✓ Memory usage requirements met")


def test_websocket_broadcasting_efficiency(server_running):
    """
    Test WebSocket broadcasting efficiency.
    Requirement 2.3: WebSocket broadcasting should be efficient.
    """
    # Get initial WebSocket stats
    response = requests.get(f"{BASE_URL}/performance/stats")
    assert response.status_code == 200
    
    initial_stats = response.json()
    initial_ws_stats = initial_stats["websocket"]
    
    print(f"\nInitial WebSocket stats:")
    print(f"Messages sent: {initial_ws_stats['messages_sent']}")
    print(f"Messages failed: {initial_ws_stats['messages_failed']}")
    print(f"Success rate: {initial_ws_stats['success_rate']:.2%}")
    
    # Wait for some activity
    time.sleep(5)
    
    # Get final stats
    response = requests.get(f"{BASE_URL}/performance/stats")
    assert response.status_code == 200
    
    final_stats = response.json()
    final_ws_stats = final_stats["websocket"]
    
    print(f"Final WebSocket stats:")
    print(f"Messages sent: {final_ws_stats['messages_sent']}")
    print(f"Messages failed: {final_ws_stats['messages_failed']}")
    print(f"Success rate: {final_ws_stats['success_rate']:.2%}")
    
    # Verify broadcasting efficiency
    if final_ws_stats["messages_sent"] > initial_ws_stats["messages_sent"]:
        success_rate = final_ws_stats["success_rate"]
        assert success_rate > 0.95, f"WebSocket success rate {success_rate:.2%} too low"
        
        queue_size = final_ws_stats["broadcast_queue_size"]
        assert queue_size < 100, f"Broadcast queue size {queue_size} too high"
        
        print("✓ WebSocket broadcasting efficiency requirements met")
    else:
        print("No WebSocket activity detected during test")


@pytest.mark.asyncio
async def test_load_stress_test(server_running):
    """
    Stress test with high load.
    Tests system behavior under heavy concurrent load.
    """
    concurrent_requests = 20
    requests_per_client = 10
    
    async def stress_client(client_id: int):
        """Generate load from a single client."""
        results = {"requests": 0, "errors": 0, "timeouts": 0}
        
        for i in range(requests_per_client):
            try:
                start_time = time.time()
                response = requests.get(f"{BASE_URL}/status", timeout=5)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    results["requests"] += 1
                else:
                    results["errors"] += 1
                
                # Check response time
                if response_time > 2.0:
                    results["timeouts"] += 1
                    
            except requests.RequestException:
                results["errors"] += 1
            
            # Small delay between requests
            await asyncio.sleep(0.1)
        
        return results
    
    print(f"\nRunning stress test with {concurrent_requests} concurrent clients...")
    
    # Run stress test
    tasks = [stress_client(i) for i in range(concurrent_requests)]
    results = await asyncio.gather(*tasks)
    
    # Analyze results
    total_requests = sum(r["requests"] for r in results)
    total_errors = sum(r["errors"] for r in results)
    total_timeouts = sum(r["timeouts"] for r in results)
    
    success_rate = total_requests / (total_requests + total_errors) if (total_requests + total_errors) > 0 else 0
    timeout_rate = total_timeouts / total_requests if total_requests > 0 else 0
    
    print(f"Total requests: {total_requests}")
    print(f"Total errors: {total_errors}")
    print(f"Total timeouts: {total_timeouts}")
    print(f"Success rate: {success_rate:.2%}")
    print(f"Timeout rate: {timeout_rate:.2%}")
    
    # Verify stress test requirements
    assert success_rate > 0.90, f"Success rate {success_rate:.2%} too low under load"
    assert timeout_rate < 0.10, f"Timeout rate {timeout_rate:.2%} too high under load"
    
    # Check final system state
    response = requests.get(f"{BASE_URL}/performance/stats")
    if response.status_code == 200:
        stats = response.json()
        memory_mb = stats["system"]["process_memory_mb"]
        cpu_percent = stats["system"]["cpu_percent"]
        
        print(f"Final memory usage: {memory_mb:.2f} MB")
        print(f"CPU usage: {cpu_percent:.1f}%")
        
        assert memory_mb < MEMORY_THRESHOLD_MB * 1.5, "Memory usage too high after stress test"
    
    print("✓ Stress test requirements met")


if __name__ == "__main__":
    # Run performance tests directly
    import sys
    
    print("Running Wireshark+ Web Performance Tests")
    print("=" * 50)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code != 200:
            print("ERROR: Server not running or not responding")
            sys.exit(1)
    except requests.RequestException as e:
        print(f"ERROR: Cannot connect to server: {e}")
        sys.exit(1)
    
    print("Server is running, starting performance tests...")
    
    # Run tests
    pytest.main([__file__, "-v", "-s"])