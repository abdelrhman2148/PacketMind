"""
Anomaly detection system for network traffic analysis.
Implements rolling window statistics and z-score based traffic spike detection.
Based on requirements 5.1, 5.2, 5.3, 5.4, 5.5 for anomaly detection.
"""

import time
import threading
import statistics
from collections import deque
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass
import logging

from models import AnomalyAlert

logger = logging.getLogger(__name__)


@dataclass
class AnomalyConfig:
    """Configuration parameters for anomaly detection."""
    window_size: int = 60  # Rolling window size in seconds
    threshold: float = 3.0  # Z-score threshold for anomaly detection
    min_samples: int = 10  # Minimum samples needed before detection starts
    alert_cooldown: int = 30  # Minimum seconds between similar alerts


class TrafficStats:
    """Statistics for a time window."""
    
    def __init__(self, timestamp: float, packet_count: int):
        self.timestamp = timestamp
        self.packet_count = packet_count


class AnomalyDetector:
    """
    Real-time anomaly detection system using rolling window statistics.
    Implements z-score based traffic spike detection.
    """
    
    def __init__(self, config: AnomalyConfig = None, alert_callback: Callable[[AnomalyAlert], None] = None):
        """
        Initialize anomaly detector.
        
        Args:
            config: Anomaly detection configuration
            alert_callback: Function to call when anomaly is detected
        """
        self.config = config or AnomalyConfig()
        self.alert_callback = alert_callback
        
        # Rolling window for packet counts per second
        self.traffic_window = deque(maxlen=self.config.window_size)
        self.current_second = int(time.time())
        self.current_count = 0
        
        # Alert management
        self.last_alert_time = 0
        
        # Thread safety
        self._lock = threading.Lock()
        
        logger.info(f"Initialized anomaly detector with window_size={self.config.window_size}, "
                   f"threshold={self.config.threshold}")
    
    def add_packet(self, timestamp: float = None) -> Optional[AnomalyAlert]:
        """
        Add a packet observation and check for anomalies.
        Implements requirements 5.1, 5.2 for rolling statistics and z-score calculation.
        
        Args:
            timestamp: Packet timestamp (defaults to current time)
            
        Returns:
            AnomalyAlert: Alert if anomaly detected, None otherwise
        """
        if timestamp is None:
            timestamp = time.time()
        
        with self._lock:
            packet_second = int(timestamp)
            
            # If we're in a new second, finalize the previous second's count
            if packet_second != self.current_second:
                if self.current_count > 0:
                    self.traffic_window.append(TrafficStats(self.current_second, self.current_count))
                    
                    # Check for anomaly on the completed second
                    alert = self._check_anomaly_for_count(self.current_count)
                    if alert:
                        return alert
                
                # Handle gaps in time (e.g., no packets for several seconds)
                while self.current_second < packet_second - 1:
                    self.current_second += 1
                    self.traffic_window.append(TrafficStats(self.current_second, 0))
                    
                    # Check for anomaly on zero-packet seconds (traffic drops)
                    alert = self._check_anomaly_for_count(0)
                    if alert:
                        return alert
                
                self.current_second = packet_second
                self.current_count = 1
            else:
                self.current_count += 1
            
            return None
    
    def _check_anomaly_for_count(self, packet_count: int) -> Optional[AnomalyAlert]:
        """
        Check specific packet count against historical patterns for anomalies.
        Implements requirement 5.2 for z-score calculation.
        
        Args:
            packet_count: Number of packets to check for anomaly
            
        Returns:
            AnomalyAlert: Alert if anomaly detected, None otherwise
        """
        # Need minimum samples for meaningful statistics
        if len(self.traffic_window) < self.config.min_samples:
            return None
        
        # Check alert cooldown
        current_time = time.time()
        if current_time - self.last_alert_time < self.config.alert_cooldown:
            return None
        
        # Calculate statistics from historical data
        packet_counts = [stats.packet_count for stats in self.traffic_window]
        
        try:
            mean_count = statistics.mean(packet_counts)
            
            # Need at least some variation for meaningful z-score
            if len(packet_counts) < 2:
                return None
                
            stdev_count = statistics.stdev(packet_counts)
            
            # Avoid division by zero
            if stdev_count == 0:
                return None
            
            # Calculate z-score for the given packet count
            z_score = (packet_count - mean_count) / stdev_count
            
            # Check if z-score exceeds threshold
            if abs(z_score) >= self.config.threshold:
                alert = self._generate_alert(z_score, mean_count, stdev_count, packet_count)
                self.last_alert_time = current_time
                
                if self.alert_callback:
                    self.alert_callback(alert)
                
                return alert
                
        except statistics.StatisticsError as e:
            logger.warning(f"Statistics calculation error: {e}")
        
        return None
    
    def _generate_alert(self, z_score: float, mean_count: float, stdev_count: float, packet_count: int = None) -> AnomalyAlert:
        """
        Generate anomaly alert with metadata.
        Implements requirement 5.3 for alert message generation.
        
        Args:
            z_score: Calculated z-score for current traffic
            mean_count: Historical mean packet count
            stdev_count: Historical standard deviation
            
        Returns:
            AnomalyAlert: Generated alert with metadata
        """
        # Determine alert level based on z-score magnitude
        if abs(z_score) >= 5.0:
            level = "critical"
        elif abs(z_score) >= 4.0:
            level = "warning"
        else:
            level = "info"
        
        # Use provided packet count or current count
        count_to_report = packet_count if packet_count is not None else self.current_count
        
        # Generate descriptive message
        if z_score > 0:
            message = f"Traffic spike detected: {count_to_report} packets/sec (z-score: {z_score:.2f})"
        else:
            message = f"Traffic drop detected: {count_to_report} packets/sec (z-score: {z_score:.2f})"
        
        # Create alert with metadata
        alert = AnomalyAlert(
            level=level,
            message=message,
            timestamp=time.time(),
            meta={
                "window_start": self.traffic_window[0].timestamp if self.traffic_window else time.time(),
                "window_size": len(self.traffic_window),
                "packet_count": count_to_report,
                "z_score": round(z_score, 3),
                "threshold": self.config.threshold,
                "mean_packets": round(mean_count, 2),
                "stdev_packets": round(stdev_count, 2)
            }
        )
        
        logger.info(f"Generated anomaly alert: {message}")
        return alert
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get current anomaly detection statistics.
        
        Returns:
            dict: Current statistics and configuration
        """
        with self._lock:
            packet_counts = [stats.packet_count for stats in self.traffic_window]
            
            stats = {
                "window_size": len(self.traffic_window),
                "max_window_size": self.config.window_size,
                "current_packets_per_sec": self.current_count,
                "threshold": self.config.threshold,
                "min_samples": self.config.min_samples,
                "last_alert_time": self.last_alert_time
            }
            
            if packet_counts:
                try:
                    stats.update({
                        "mean_packets": round(statistics.mean(packet_counts), 2),
                        "median_packets": round(statistics.median(packet_counts), 2),
                        "max_packets": max(packet_counts),
                        "min_packets": min(packet_counts)
                    })
                    
                    if len(packet_counts) > 1:
                        stats["stdev_packets"] = round(statistics.stdev(packet_counts), 2)
                        
                except statistics.StatisticsError:
                    pass
            
            return stats
    
    def update_config(self, config: AnomalyConfig):
        """
        Update anomaly detection configuration.
        Implements requirement 5.4 for configurable parameters.
        
        Args:
            config: New configuration parameters
        """
        with self._lock:
            old_window_size = self.config.window_size
            self.config = config
            
            # Adjust window size if changed
            if config.window_size != old_window_size:
                # Create new deque with updated max length
                new_window = deque(self.traffic_window, maxlen=config.window_size)
                self.traffic_window = new_window
            
            logger.info(f"Updated anomaly detection config: window_size={config.window_size}, "
                       f"threshold={config.threshold}")
    
    def reset(self):
        """Reset anomaly detection state."""
        with self._lock:
            self.traffic_window.clear()
            self.current_second = int(time.time())
            self.current_count = 0
            self.last_alert_time = 0
            
            logger.info("Reset anomaly detection state")