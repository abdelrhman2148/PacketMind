#!/usr/bin/env python3
"""
Performance monitoring script for Wireshark+ Web.
Continuously monitors system performance and alerts on issues.
"""

import time
import requests
import json
import argparse
from datetime import datetime
from typing import Dict, Any, List


class PerformanceMonitor:
    """Monitor system performance and generate alerts."""
    
    def __init__(self, base_url: str = "http://localhost:8000", interval: int = 5):
        self.base_url = base_url
        self.interval = interval
        self.history: List[Dict[str, Any]] = []
        self.alerts: List[str] = []
        
        # Thresholds
        self.thresholds = {
            "memory_mb": 200,
            "cpu_percent": 80,
            "queue_utilization": 0.8,
            "error_rate": 0.05,
            "connection_utilization": 0.9,
            "latency_p95": 2.0
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current performance statistics."""
        try:
            response = requests.get(f"{self.base_url}/performance/stats", timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
        except requests.RequestException as e:
            return {"error": str(e)}
    
    def check_thresholds(self, stats: Dict[str, Any]) -> List[str]:
        """Check performance thresholds and return alerts."""
        alerts = []
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        try:
            # Memory usage
            memory_mb = stats["system"]["process_memory_mb"]
            if memory_mb > self.thresholds["memory_mb"]:
                alerts.append(f"[{timestamp}] HIGH MEMORY: {memory_mb:.1f} MB (threshold: {self.thresholds['memory_mb']} MB)")
            
            # CPU usage
            cpu_percent = stats["system"]["cpu_percent"]
            if cpu_percent > self.thresholds["cpu_percent"]:
                alerts.append(f"[{timestamp}] HIGH CPU: {cpu_percent:.1f}% (threshold: {self.thresholds['cpu_percent']}%)")
            
            # Queue utilization
            queue_util = stats["capture"]["queue_utilization"]
            if queue_util > self.thresholds["queue_utilization"]:
                alerts.append(f"[{timestamp}] HIGH QUEUE: {queue_util:.1%} (threshold: {self.thresholds['queue_utilization']:.1%})")
            
            # WebSocket error rate
            ws_stats = stats["websocket"]
            if ws_stats["messages_sent"] > 0:
                error_rate = ws_stats["messages_failed"] / (ws_stats["messages_sent"] + ws_stats["messages_failed"])
                if error_rate > self.thresholds["error_rate"]:
                    alerts.append(f"[{timestamp}] HIGH ERROR RATE: {error_rate:.2%} (threshold: {self.thresholds['error_rate']:.2%})")
            
            # Connection utilization
            conn_util = ws_stats["connection_utilization"]
            if conn_util > self.thresholds["connection_utilization"]:
                alerts.append(f"[{timestamp}] HIGH CONNECTIONS: {conn_util:.1%} (threshold: {self.thresholds['connection_utilization']:.1%})")
            
        except KeyError as e:
            alerts.append(f"[{timestamp}] STATS ERROR: Missing key {e}")
        except Exception as e:
            alerts.append(f"[{timestamp}] CHECK ERROR: {e}")
        
        return alerts
    
    def print_stats(self, stats: Dict[str, Any]):
        """Print formatted statistics."""
        if "error" in stats:
            print(f"ERROR: {stats['error']}")
            return
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"\n[{timestamp}] Performance Statistics")
        print("-" * 50)
        
        try:
            # System stats
            sys_stats = stats["system"]
            print(f"Memory: {sys_stats['process_memory_mb']:.1f} MB ({sys_stats['memory_percent']:.1f}% system)")
            print(f"CPU: {sys_stats['cpu_percent']:.1f}%")
            
            # Capture stats
            cap_stats = stats["capture"]
            print(f"Capture Queue: {cap_stats['queue_size']}/{cap_stats['max_queue_size']} ({cap_stats['queue_utilization']:.1%})")
            print(f"Capture Memory: {cap_stats['memory_usage_mb']:.1f}/{cap_stats['max_memory_mb']:.1f} MB")
            
            # WebSocket stats
            ws_stats = stats["websocket"]
            print(f"WebSocket Connections: {ws_stats['active_connections']}/{ws_stats['max_connections']}")
            print(f"Messages: {ws_stats['messages_sent']} sent, {ws_stats['messages_failed']} failed")
            if ws_stats["messages_sent"] > 0:
                success_rate = ws_stats["success_rate"]
                print(f"Success Rate: {success_rate:.2%}")
            
            # Capture performance
            if "stats" in cap_stats:
                cap_perf = cap_stats["stats"]
                print(f"Packets: {cap_perf['packets_captured']} captured, {cap_perf['packets_dropped']} dropped")
                if cap_perf["packets_captured"] > 0:
                    drop_rate = cap_perf["packets_dropped"] / cap_perf["packets_captured"]
                    print(f"Drop Rate: {drop_rate:.2%}")
            
        except KeyError as e:
            print(f"Error displaying stats: Missing key {e}")
    
    def run_continuous(self, duration: int = None):
        """Run continuous monitoring."""
        print(f"Starting performance monitoring (interval: {self.interval}s)")
        if duration:
            print(f"Duration: {duration}s")
        print("Press Ctrl+C to stop")
        
        start_time = time.time()
        
        try:
            while True:
                # Get current stats
                stats = self.get_stats()
                
                # Print stats
                self.print_stats(stats)
                
                # Check thresholds
                if "error" not in stats:
                    new_alerts = self.check_thresholds(stats)
                    for alert in new_alerts:
                        print(f"🚨 ALERT: {alert}")
                        self.alerts.append(alert)
                    
                    # Store history
                    stats["timestamp"] = time.time()
                    self.history.append(stats)
                    
                    # Keep only recent history
                    if len(self.history) > 100:
                        self.history = self.history[-100:]
                
                # Check duration
                if duration and (time.time() - start_time) >= duration:
                    break
                
                # Wait for next interval
                time.sleep(self.interval)
                
        except KeyboardInterrupt:
            print("\nMonitoring stopped by user")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print monitoring summary."""
        print("\n" + "="*50)
        print("MONITORING SUMMARY")
        print("="*50)
        
        if self.alerts:
            print(f"Total Alerts: {len(self.alerts)}")
            print("\nRecent Alerts:")
            for alert in self.alerts[-10:]:  # Show last 10 alerts
                print(f"  {alert}")
        else:
            print("No alerts generated ✅")
        
        if self.history:
            print(f"\nData Points Collected: {len(self.history)}")
            
            # Calculate averages
            try:
                avg_memory = sum(s["system"]["process_memory_mb"] for s in self.history) / len(self.history)
                avg_cpu = sum(s["system"]["cpu_percent"] for s in self.history) / len(self.history)
                avg_queue = sum(s["capture"]["queue_utilization"] for s in self.history) / len(self.history)
                
                print(f"Average Memory: {avg_memory:.1f} MB")
                print(f"Average CPU: {avg_cpu:.1f}%")
                print(f"Average Queue Utilization: {avg_queue:.1%}")
                
            except (KeyError, ZeroDivisionError):
                print("Could not calculate averages")


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Performance Monitor for Wireshark+ Web")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL of the server")
    parser.add_argument("--interval", type=int, default=5, help="Monitoring interval in seconds")
    parser.add_argument("--duration", type=int, help="Monitoring duration in seconds (default: continuous)")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    
    args = parser.parse_args()
    
    monitor = PerformanceMonitor(args.url, args.interval)
    
    if args.once:
        # Single measurement
        stats = monitor.get_stats()
        monitor.print_stats(stats)
        if "error" not in stats:
            alerts = monitor.check_thresholds(stats)
            for alert in alerts:
                print(f"🚨 ALERT: {alert}")
    else:
        # Continuous monitoring
        monitor.run_continuous(args.duration)


if __name__ == "__main__":
    main()