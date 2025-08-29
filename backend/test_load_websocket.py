"""
Load testing for WebSocket connections.
Tests concurrent client handling and broadcasting performance.
Implements requirement 2.3 for efficient WebSocket broadcasting.
"""

import asyncio
import time
import json
import statistics
import websockets
import requests
from typing import List, Dict, Any
import argparse


class WebSocketLoadTester:
    """Load tester for WebSocket connections."""
    
    def __init__(self, base_url: str = "http://localhost:8000", ws_url: str = "ws://localhost:8000/ws/packets"):
        self.base_url = base_url
        self.ws_url = ws_url
        self.results: List[Dict[str, Any]] = []
    
    async def single_client_test(self, client_id: int, duration: int = 30) -> Dict[str, Any]:
        """Test a single WebSocket client."""
        result = {
            "client_id": client_id,
            "connected": False,
            "connection_time": 0,
            "packets_received": 0,
            "messages_received": 0,
            "errors": 0,
            "disconnections": 0,
            "latencies": [],
            "start_time": time.time()
        }
        
        try:
            # Measure connection time
            connect_start = time.time()
            async with websockets.connect(self.ws_url) as websocket:
                result["connection_time"] = time.time() - connect_start
                result["connected"] = True
                
                print(f"Client {client_id}: Connected in {result['connection_time']:.3f}s")
                
                # Send initial ping
                await websocket.send("ping")
                
                test_start = time.time()
                while time.time() - test_start < duration:
                    try:
                        # Receive message with timeout
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        receive_time = time.time()
                        result["messages_received"] += 1
                        
                        # Handle different message types
                        if message == "pong":
                            continue
                        
                        try:
                            data = json.loads(message)
                            
                            # Track packet messages
                            if "ts" in data and "src" in data:
                                result["packets_received"] += 1
                                # Calculate latency (rough estimate)
                                packet_time = data.get("ts", 0)
                                if packet_time > 0:
                                    latency = receive_time - packet_time
                                    if 0 < latency < 10:  # Reasonable latency range
                                        result["latencies"].append(latency)
                            
                        except json.JSONDecodeError:
                            result["errors"] += 1
                            
                    except asyncio.TimeoutError:
                        # Send periodic ping to keep connection alive
                        try:
                            await websocket.send("ping")
                        except Exception:
                            result["disconnections"] += 1
                            break
                    except websockets.exceptions.ConnectionClosed:
                        result["disconnections"] += 1
                        break
                    except Exception as e:
                        result["errors"] += 1
                        print(f"Client {client_id}: Error receiving message: {e}")
                        
        except Exception as e:
            result["errors"] += 1
            print(f"Client {client_id}: Connection failed: {e}")
        
        result["duration"] = time.time() - result["start_time"]
        return result
    
    async def run_load_test(self, num_clients: int, duration: int = 30) -> Dict[str, Any]:
        """Run load test with multiple concurrent clients."""
        print(f"Starting load test with {num_clients} clients for {duration} seconds...")
        
        # Start all clients concurrently
        tasks = [
            self.single_client_test(i, duration) 
            for i in range(num_clients)
        ]
        
        start_time = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = time.time() - start_time
        
        # Process results
        successful_results = [r for r in results if isinstance(r, dict)]
        failed_results = [r for r in results if not isinstance(r, dict)]
        
        # Calculate statistics
        stats = self._calculate_stats(successful_results, total_time, num_clients)
        
        return {
            "test_config": {
                "num_clients": num_clients,
                "duration": duration,
                "total_time": total_time
            },
            "results": {
                "successful_clients": len(successful_results),
                "failed_clients": len(failed_results),
                "client_results": successful_results
            },
            "statistics": stats
        }
    
    def _calculate_stats(self, results: List[Dict[str, Any]], total_time: float, num_clients: int) -> Dict[str, Any]:
        """Calculate test statistics."""
        if not results:
            return {"error": "No successful client connections"}
        
        # Connection statistics
        connected_clients = [r for r in results if r["connected"]]
        connection_times = [r["connection_time"] for r in connected_clients]
        
        # Message statistics
        total_packets = sum(r["packets_received"] for r in results)
        total_messages = sum(r["messages_received"] for r in results)
        total_errors = sum(r["errors"] for r in results)
        total_disconnections = sum(r["disconnections"] for r in results)
        
        # Latency statistics
        all_latencies = []
        for r in results:
            all_latencies.extend(r["latencies"])
        
        stats = {
            "connection": {
                "success_rate": len(connected_clients) / num_clients,
                "avg_connection_time": statistics.mean(connection_times) if connection_times else 0,
                "max_connection_time": max(connection_times) if connection_times else 0,
                "min_connection_time": min(connection_times) if connection_times else 0
            },
            "throughput": {
                "total_packets": total_packets,
                "total_messages": total_messages,
                "packets_per_second": total_packets / total_time,
                "messages_per_second": total_messages / total_time,
                "packets_per_client": total_packets / len(connected_clients) if connected_clients else 0
            },
            "reliability": {
                "total_errors": total_errors,
                "total_disconnections": total_disconnections,
                "error_rate": total_errors / max(1, total_messages),
                "disconnection_rate": total_disconnections / num_clients
            }
        }
        
        # Add latency statistics if available
        if all_latencies:
            stats["latency"] = {
                "count": len(all_latencies),
                "mean": statistics.mean(all_latencies),
                "median": statistics.median(all_latencies),
                "min": min(all_latencies),
                "max": max(all_latencies),
                "p95": statistics.quantiles(all_latencies, n=20)[18] if len(all_latencies) >= 20 else max(all_latencies),
                "p99": statistics.quantiles(all_latencies, n=100)[98] if len(all_latencies) >= 100 else max(all_latencies)
            }
        
        return stats
    
    def print_results(self, test_results: Dict[str, Any]):
        """Print formatted test results."""
        config = test_results["test_config"]
        results = test_results["results"]
        stats = test_results["statistics"]
        
        print("\n" + "="*60)
        print("WEBSOCKET LOAD TEST RESULTS")
        print("="*60)
        
        print(f"\nTest Configuration:")
        print(f"  Clients: {config['num_clients']}")
        print(f"  Duration: {config['duration']}s")
        print(f"  Total Time: {config['total_time']:.2f}s")
        
        print(f"\nConnection Results:")
        print(f"  Successful: {results['successful_clients']}")
        print(f"  Failed: {results['failed_clients']}")
        print(f"  Success Rate: {stats['connection']['success_rate']:.1%}")
        print(f"  Avg Connection Time: {stats['connection']['avg_connection_time']:.3f}s")
        print(f"  Max Connection Time: {stats['connection']['max_connection_time']:.3f}s")
        
        print(f"\nThroughput:")
        print(f"  Total Packets: {stats['throughput']['total_packets']}")
        print(f"  Total Messages: {stats['throughput']['total_messages']}")
        print(f"  Packets/sec: {stats['throughput']['packets_per_second']:.1f}")
        print(f"  Messages/sec: {stats['throughput']['messages_per_second']:.1f}")
        print(f"  Packets/client: {stats['throughput']['packets_per_client']:.1f}")
        
        print(f"\nReliability:")
        print(f"  Total Errors: {stats['reliability']['total_errors']}")
        print(f"  Total Disconnections: {stats['reliability']['total_disconnections']}")
        print(f"  Error Rate: {stats['reliability']['error_rate']:.2%}")
        print(f"  Disconnection Rate: {stats['reliability']['disconnection_rate']:.2%}")
        
        if "latency" in stats:
            lat = stats["latency"]
            print(f"\nLatency (seconds):")
            print(f"  Samples: {lat['count']}")
            print(f"  Mean: {lat['mean']:.3f}s")
            print(f"  Median: {lat['median']:.3f}s")
            print(f"  Min: {lat['min']:.3f}s")
            print(f"  Max: {lat['max']:.3f}s")
            print(f"  95th percentile: {lat['p95']:.3f}s")
            print(f"  99th percentile: {lat['p99']:.3f}s")
        
        # Performance assessment
        print(f"\nPerformance Assessment:")
        self._assess_performance(stats)
    
    def _assess_performance(self, stats: Dict[str, Any]):
        """Assess performance against requirements."""
        issues = []
        
        # Check connection success rate
        if stats["connection"]["success_rate"] < 0.95:
            issues.append(f"Low connection success rate: {stats['connection']['success_rate']:.1%}")
        
        # Check connection time
        if stats["connection"]["avg_connection_time"] > 2.0:
            issues.append(f"Slow connection time: {stats['connection']['avg_connection_time']:.3f}s")
        
        # Check error rate
        if stats["reliability"]["error_rate"] > 0.05:
            issues.append(f"High error rate: {stats['reliability']['error_rate']:.2%}")
        
        # Check disconnection rate
        if stats["reliability"]["disconnection_rate"] > 0.10:
            issues.append(f"High disconnection rate: {stats['reliability']['disconnection_rate']:.2%}")
        
        # Check latency if available
        if "latency" in stats:
            if stats["latency"]["p95"] > 2.0:
                issues.append(f"High 95th percentile latency: {stats['latency']['p95']:.3f}s")
        
        if issues:
            print("  ❌ Issues found:")
            for issue in issues:
                print(f"    - {issue}")
        else:
            print("  ✅ All performance requirements met!")


async def main():
    """Main function for running load tests."""
    parser = argparse.ArgumentParser(description="WebSocket Load Tester")
    parser.add_argument("--clients", type=int, default=10, help="Number of concurrent clients")
    parser.add_argument("--duration", type=int, default=30, help="Test duration in seconds")
    parser.add_argument("--url", default="ws://localhost:8000/ws/packets", help="WebSocket URL")
    
    args = parser.parse_args()
    
    # Check if server is running
    base_url = "http://localhost:8000"
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code != 200:
            print("ERROR: Server not running or not responding")
            return
    except requests.RequestException as e:
        print(f"ERROR: Cannot connect to server: {e}")
        return
    
    # Run load test
    tester = WebSocketLoadTester(base_url, args.url)
    results = await tester.run_load_test(args.clients, args.duration)
    tester.print_results(results)


if __name__ == "__main__":
    asyncio.run(main())