#!/usr/bin/env python3
"""
Comprehensive performance test runner for Wireshark+ Web.
Runs all performance tests and generates a detailed report.
"""

import subprocess
import sys
import time
import requests
import json
import os
from datetime import datetime
from typing import Dict, Any, List


class PerformanceTestRunner:
    """Runs and manages performance tests."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results: Dict[str, Any] = {}
        self.start_time = time.time()
    
    def check_server(self) -> bool:
        """Check if server is running."""
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            return response.status_code == 200
        except requests.RequestException:
            return False
    
    def get_initial_stats(self) -> Dict[str, Any]:
        """Get initial system statistics."""
        try:
            response = requests.get(f"{self.base_url}/performance/stats", timeout=5)
            if response.status_code == 200:
                return response.json()
            return {}
        except requests.RequestException:
            return {}
    
    def run_pytest_tests(self) -> Dict[str, Any]:
        """Run pytest performance tests."""
        print("Running pytest performance tests...")
        
        try:
            result = subprocess.run([
                sys.executable, "-m", "pytest", 
                "test_performance.py", 
                "-v", "--tb=short", "--json-report", "--json-report-file=performance_results.json"
            ], capture_output=True, text=True, timeout=300)
            
            # Try to load JSON results
            json_results = {}
            try:
                if os.path.exists("performance_results.json"):
                    with open("performance_results.json", "r") as f:
                        json_results = json.load(f)
            except Exception:
                pass
            
            return {
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "json_results": json_results,
                "success": result.returncode == 0
            }
            
        except subprocess.TimeoutExpired:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": "Test timeout after 300 seconds",
                "success": False
            }
        except Exception as e:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": str(e),
                "success": False
            }
    
    def run_websocket_load_test(self, clients: int = 10, duration: int = 30) -> Dict[str, Any]:
        """Run WebSocket load test."""
        print(f"Running WebSocket load test ({clients} clients, {duration}s)...")
        
        try:
            result = subprocess.run([
                sys.executable, "test_load_websocket.py",
                "--clients", str(clients),
                "--duration", str(duration)
            ], capture_output=True, text=True, timeout=duration + 60)
            
            return {
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
        except subprocess.TimeoutExpired:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": f"Load test timeout after {duration + 60} seconds",
                "success": False
            }
        except Exception as e:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": str(e),
                "success": False
            }
    
    def run_memory_stress_test(self, duration: int = 60) -> Dict[str, Any]:
        """Run memory stress test by monitoring during high load."""
        print(f"Running memory stress test ({duration}s)...")
        
        initial_stats = self.get_initial_stats()
        memory_samples = []
        
        try:
            # Generate load while monitoring memory
            start_time = time.time()
            while time.time() - start_time < duration:
                # Make multiple concurrent requests
                import threading
                import requests
                
                def make_requests():
                    for _ in range(10):
                        try:
                            requests.get(f"{self.base_url}/status", timeout=1)
                            requests.get(f"{self.base_url}/interfaces", timeout=1)
                            requests.get(f"{self.base_url}/performance/stats", timeout=1)
                        except:
                            pass
                
                # Start multiple threads
                threads = []
                for _ in range(5):
                    t = threading.Thread(target=make_requests)
                    t.start()
                    threads.append(t)
                
                # Monitor memory
                stats = self.get_initial_stats()
                if stats and "system" in stats:
                    memory_samples.append({
                        "timestamp": time.time(),
                        "memory_mb": stats["system"]["process_memory_mb"],
                        "memory_percent": stats["system"]["memory_percent"]
                    })
                
                # Wait for threads
                for t in threads:
                    t.join(timeout=1)
                
                time.sleep(2)
            
            final_stats = self.get_initial_stats()
            
            # Analyze memory usage
            if memory_samples:
                max_memory = max(s["memory_mb"] for s in memory_samples)
                min_memory = min(s["memory_mb"] for s in memory_samples)
                avg_memory = sum(s["memory_mb"] for s in memory_samples) / len(memory_samples)
                
                return {
                    "success": True,
                    "initial_memory": initial_stats.get("system", {}).get("process_memory_mb", 0),
                    "final_memory": final_stats.get("system", {}).get("process_memory_mb", 0),
                    "max_memory": max_memory,
                    "min_memory": min_memory,
                    "avg_memory": avg_memory,
                    "memory_increase": max_memory - min_memory,
                    "samples": len(memory_samples),
                    "duration": duration
                }
            else:
                return {
                    "success": False,
                    "error": "No memory samples collected"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all performance tests."""
        print("="*60)
        print("WIRESHARK+ WEB PERFORMANCE TEST SUITE")
        print("="*60)
        print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Server URL: {self.base_url}")
        
        # Check server
        if not self.check_server():
            print("❌ Server is not running or not accessible")
            return {"error": "Server not accessible"}
        
        print("✅ Server is running")
        
        # Get initial stats
        initial_stats = self.get_initial_stats()
        print(f"Initial memory usage: {initial_stats.get('system', {}).get('process_memory_mb', 'unknown')} MB")
        
        results = {
            "start_time": self.start_time,
            "initial_stats": initial_stats,
            "tests": {}
        }
        
        # Run pytest tests
        print("\n" + "-"*40)
        results["tests"]["pytest"] = self.run_pytest_tests()
        
        # Run WebSocket load test
        print("\n" + "-"*40)
        results["tests"]["websocket_load"] = self.run_websocket_load_test(clients=15, duration=30)
        
        # Run memory stress test
        print("\n" + "-"*40)
        results["tests"]["memory_stress"] = self.run_memory_stress_test(duration=45)
        
        # Get final stats
        results["final_stats"] = self.get_initial_stats()
        results["end_time"] = time.time()
        results["total_duration"] = results["end_time"] - results["start_time"]
        
        return results
    
    def print_summary(self, results: Dict[str, Any]):
        """Print test summary."""
        print("\n" + "="*60)
        print("PERFORMANCE TEST SUMMARY")
        print("="*60)
        
        if "error" in results:
            print(f"❌ Test suite failed: {results['error']}")
            return
        
        total_duration = results.get("total_duration", 0)
        print(f"Total duration: {total_duration:.1f} seconds")
        
        # Test results
        tests = results.get("tests", {})
        passed = 0
        failed = 0
        
        for test_name, test_result in tests.items():
            success = test_result.get("success", False)
            if success:
                print(f"✅ {test_name}: PASSED")
                passed += 1
            else:
                print(f"❌ {test_name}: FAILED")
                failed += 1
                if "stderr" in test_result and test_result["stderr"]:
                    print(f"   Error: {test_result['stderr'][:200]}...")
        
        print(f"\nResults: {passed} passed, {failed} failed")
        
        # Memory analysis
        initial_stats = results.get("initial_stats", {})
        final_stats = results.get("final_stats", {})
        
        if initial_stats and final_stats:
            initial_mem = initial_stats.get("system", {}).get("process_memory_mb", 0)
            final_mem = final_stats.get("system", {}).get("process_memory_mb", 0)
            mem_change = final_mem - initial_mem
            
            print(f"\nMemory Analysis:")
            print(f"  Initial: {initial_mem:.1f} MB")
            print(f"  Final: {final_mem:.1f} MB")
            print(f"  Change: {mem_change:+.1f} MB")
            
            if abs(mem_change) > 50:
                print(f"  ⚠️  Large memory change detected")
            else:
                print(f"  ✅ Memory usage stable")
        
        # Memory stress test details
        if "memory_stress" in tests:
            mem_test = tests["memory_stress"]
            if mem_test.get("success"):
                print(f"\nMemory Stress Test:")
                print(f"  Max memory: {mem_test.get('max_memory', 0):.1f} MB")
                print(f"  Average memory: {mem_test.get('avg_memory', 0):.1f} MB")
                print(f"  Memory increase: {mem_test.get('memory_increase', 0):.1f} MB")
                print(f"  Samples: {mem_test.get('samples', 0)}")
        
        # Overall assessment
        print(f"\nOverall Assessment:")
        if failed == 0:
            print("🎉 All performance tests passed!")
        elif failed <= passed:
            print("⚠️  Some performance issues detected")
        else:
            print("❌ Significant performance problems found")
    
    def save_results(self, results: Dict[str, Any], filename: str = None):
        """Save results to JSON file."""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"performance_results_{timestamp}.json"
        
        try:
            with open(filename, "w") as f:
                json.dump(results, f, indent=2, default=str)
            print(f"\nResults saved to: {filename}")
        except Exception as e:
            print(f"Failed to save results: {e}")


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Performance Test Runner")
    parser.add_argument("--url", default="http://localhost:8000", help="Server URL")
    parser.add_argument("--save", help="Save results to file")
    parser.add_argument("--no-summary", action="store_true", help="Skip summary output")
    
    args = parser.parse_args()
    
    runner = PerformanceTestRunner(args.url)
    results = runner.run_all_tests()
    
    if not args.no_summary:
        runner.print_summary(results)
    
    if args.save:
        runner.save_results(results, args.save)
    elif not args.no_summary:
        runner.save_results(results)


if __name__ == "__main__":
    main()