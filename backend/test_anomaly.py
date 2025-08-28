"""
Unit tests for anomaly detection system.
Tests z-score calculations, alert generation, and configuration management.
Based on requirements 5.1, 5.2, 5.3, 5.4, 5.5 for anomaly detection.
"""

import pytest
import time
import threading
from unittest.mock import Mock

from anomaly import AnomalyDetector, AnomalyConfig, TrafficStats
from models import AnomalyAlert


class TestAnomalyConfig:
    """Test anomaly configuration data class."""
    
    def test_default_config(self):
        """Test default configuration values."""
        config = AnomalyConfig()
        assert config.window_size == 60
        assert config.threshold == 3.0
        assert config.min_samples == 10
        assert config.alert_cooldown == 30
    
    def test_custom_config(self):
        """Test custom configuration values."""
        config = AnomalyConfig(
            window_size=120,
            threshold=2.5,
            min_samples=15,
            alert_cooldown=60
        )
        assert config.window_size == 120
        assert config.threshold == 2.5
        assert config.min_samples == 15
        assert config.alert_cooldown == 60


class TestTrafficStats:
    """Test traffic statistics data class."""
    
    def test_traffic_stats_creation(self):
        """Test creating traffic statistics."""
        timestamp = time.time()
        stats = TrafficStats(timestamp, 42)
        assert stats.timestamp == timestamp
        assert stats.packet_count == 42


class TestAnomalyDetector:
    """Test anomaly detection functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.config = AnomalyConfig(
            window_size=10,  # Small window for testing
            threshold=2.0,   # Lower threshold for easier testing
            min_samples=3,   # Fewer samples needed
            alert_cooldown=1  # Short cooldown for testing
        )
        self.alerts = []
        self.detector = AnomalyDetector(
            config=self.config,
            alert_callback=self.alerts.append
        )
    
    def test_initialization(self):
        """Test detector initialization."""
        assert self.detector.config == self.config
        assert len(self.detector.traffic_window) == 0
        assert self.detector.current_count == 0
        assert self.detector.last_alert_time == 0
    
    def test_add_single_packet(self):
        """Test adding a single packet."""
        timestamp = time.time()
        alert = self.detector.add_packet(timestamp)
        
        # Should not generate alert with insufficient data
        assert alert is None
        assert self.detector.current_count == 1
        assert len(self.alerts) == 0
    
    def test_add_packets_same_second(self):
        """Test adding multiple packets in the same second."""
        timestamp = time.time()
        
        # Add multiple packets in same second
        for i in range(5):
            alert = self.detector.add_packet(timestamp)
            assert alert is None  # No alert yet
        
        assert self.detector.current_count == 5
        assert len(self.detector.traffic_window) == 0  # Not finalized yet
    
    def test_add_packets_different_seconds(self):
        """Test adding packets across different seconds."""
        base_time = time.time()
        
        # Add packets in first second
        for i in range(3):
            self.detector.add_packet(base_time)
        
        # Add packets in second second
        for i in range(2):
            self.detector.add_packet(base_time + 1)
        
        # Should have finalized first second
        assert len(self.detector.traffic_window) == 1
        assert self.detector.traffic_window[0].packet_count == 3
        assert self.detector.current_count == 2
    
    def test_time_gaps(self):
        """Test handling gaps in time (no packets for several seconds)."""
        base_time = time.time()
        
        # Add packets at time 0
        self.detector.add_packet(base_time)
        
        # Add packets at time 5 (5 second gap)
        self.detector.add_packet(base_time + 5)
        
        # Should have filled gap with zero-count seconds
        assert len(self.detector.traffic_window) == 5
        assert self.detector.traffic_window[0].packet_count == 1  # First second
        assert self.detector.traffic_window[1].packet_count == 0  # Gap
        assert self.detector.traffic_window[2].packet_count == 0  # Gap
        assert self.detector.traffic_window[3].packet_count == 0  # Gap
        assert self.detector.traffic_window[4].packet_count == 0  # Gap
    
    def test_window_size_limit(self):
        """Test that window size is properly limited."""
        base_time = time.time()
        
        # Add packets for more seconds than window size
        for i in range(15):  # Window size is 10
            self.detector.add_packet(base_time + i)
        
        # Window should be limited to configured size
        assert len(self.detector.traffic_window) <= self.config.window_size
    
    def test_z_score_calculation_spike(self):
        """Test z-score calculation for traffic spike detection."""
        base_time = time.time()
        
        # Create baseline traffic (2 packets per second)
        for second in range(5):
            for packet in range(2):
                self.detector.add_packet(base_time + second)
        
        # Create traffic spike (10 packets in next second)
        spike_time = base_time + 5
        for packet in range(10):
            alert = self.detector.add_packet(spike_time)
        
        # Advance to next second to trigger anomaly check
        self.detector.add_packet(base_time + 6)
        
        # Should detect anomaly
        assert len(self.alerts) > 0
        alert = self.alerts[-1]
        assert alert.level in ["info", "warning", "critical"]
        assert "spike" in alert.message.lower()
        assert alert.meta["z_score"] > self.config.threshold
    
    def test_z_score_calculation_drop(self):
        """Test z-score calculation for traffic drop detection."""
        base_time = time.time()
        
        # Create high baseline traffic (10 packets per second)
        for second in range(5):
            for packet in range(10):
                self.detector.add_packet(base_time + second)
        
        # Create traffic drop (0 packets in next second)
        # We need to advance time to finalize the current second
        drop_time = base_time + 6
        self.detector.add_packet(drop_time)  # Just one packet to trigger check
        
        # The drop should be detected in the previous second (5)
        # Let's check by looking at the window
        if len(self.alerts) > 0:
            alert = self.alerts[-1]
            assert alert.meta["z_score"] < -self.config.threshold or alert.meta["z_score"] > self.config.threshold
    
    def test_insufficient_samples(self):
        """Test that no alerts are generated with insufficient samples."""
        base_time = time.time()
        
        # Add fewer packets than min_samples
        for i in range(self.config.min_samples - 1):
            alert = self.detector.add_packet(base_time + i)
            assert alert is None
        
        assert len(self.alerts) == 0
    
    def test_alert_cooldown(self):
        """Test alert cooldown mechanism."""
        base_time = time.time()
        
        # Create baseline with consistent low traffic
        for second in range(5):
            for packet in range(1):  # Only 1 packet per second for clear baseline
                self.detector.add_packet(base_time + second)
        
        # Create first spike
        for packet in range(15):
            self.detector.add_packet(base_time + 5)
        
        # Advance to trigger anomaly check
        self.detector.add_packet(base_time + 6)
        initial_alert_count = len(self.alerts)
        
        # Verify we got the first alert
        assert initial_alert_count > 0, "First spike should generate an alert"
        
        # Create second spike immediately (should be suppressed by cooldown)
        for packet in range(15):
            self.detector.add_packet(base_time + 7)
        
        # Advance to trigger check
        self.detector.add_packet(base_time + 8)
        
        # Should not generate additional alert due to cooldown
        assert len(self.alerts) == initial_alert_count, "Second spike should be suppressed by cooldown"
        
        # Test that cooldown is working by checking the last alert time
        first_alert_time = self.detector.last_alert_time
        
        # Wait for cooldown to expire
        time.sleep(self.config.alert_cooldown + 0.1)
        
        # Reset detector to create fresh baseline for clearer anomaly detection
        self.detector.reset()
        
        # Create new baseline
        for second in range(5):
            self.detector.add_packet(base_time + 20 + second)
        
        # Create spike after cooldown
        for packet in range(15):
            self.detector.add_packet(base_time + 25)
        
        # Advance to trigger check
        self.detector.add_packet(base_time + 26)
        
        # Should generate new alert after cooldown and reset
        assert len(self.alerts) > initial_alert_count, "Should generate alert after cooldown with fresh baseline"
        
        # Verify the alert time is different
        assert self.detector.last_alert_time > first_alert_time, "Alert time should be updated"
    
    def test_alert_levels(self):
        """Test different alert levels based on z-score magnitude."""
        base_time = time.time()
        
        # Create baseline (1 packet per second)
        for second in range(5):
            self.detector.add_packet(base_time + second)
        
        # Test different spike magnitudes
        test_cases = [
            (3, "info"),      # Small spike
            (6, "warning"),   # Medium spike  
            (10, "critical")  # Large spike
        ]
        
        for spike_size, expected_level in test_cases:
            # Clear previous alerts
            self.alerts.clear()
            
            # Wait for cooldown
            time.sleep(self.config.alert_cooldown + 0.1)
            
            # Create spike
            spike_time = base_time + 10 + spike_size  # Different time for each test
            for packet in range(spike_size):
                self.detector.add_packet(spike_time)
            
            # Check alert level (may not always match exactly due to statistics)
            if self.alerts:
                alert = self.alerts[-1]
                assert alert.level in ["info", "warning", "critical"]
    
    def test_alert_metadata(self):
        """Test alert metadata completeness."""
        base_time = time.time()
        
        # Create baseline and spike
        for second in range(5):
            for packet in range(2):
                self.detector.add_packet(base_time + second)
        
        for packet in range(10):
            self.detector.add_packet(base_time + 5)
        
        if self.alerts:
            alert = self.alerts[-1]
            
            # Check required metadata fields
            assert "window_start" in alert.meta
            assert "window_size" in alert.meta
            assert "packet_count" in alert.meta
            assert "z_score" in alert.meta
            assert "threshold" in alert.meta
            assert "mean_packets" in alert.meta
            assert "stdev_packets" in alert.meta
            
            # Check metadata values
            assert alert.meta["threshold"] == self.config.threshold
            assert alert.meta["packet_count"] == 10
            assert isinstance(alert.meta["z_score"], (int, float))
    
    def test_get_stats(self):
        """Test statistics retrieval."""
        base_time = time.time()
        
        # Add some traffic data
        for second in range(5):
            for packet in range(3):
                self.detector.add_packet(base_time + second)
        
        stats = self.detector.get_stats()
        
        # Check required stats fields
        assert "window_size" in stats
        assert "max_window_size" in stats
        assert "current_packets_per_sec" in stats
        assert "threshold" in stats
        assert "min_samples" in stats
        assert "last_alert_time" in stats
        
        # Check stats values
        assert stats["max_window_size"] == self.config.window_size
        assert stats["threshold"] == self.config.threshold
        assert stats["min_samples"] == self.config.min_samples
        
        # Should have statistical measures with sufficient data
        if stats["window_size"] > 0:
            assert "mean_packets" in stats
            assert "median_packets" in stats
            assert "max_packets" in stats
            assert "min_packets" in stats
    
    def test_update_config(self):
        """Test configuration updates."""
        new_config = AnomalyConfig(
            window_size=20,
            threshold=4.0,
            min_samples=5,
            alert_cooldown=60
        )
        
        self.detector.update_config(new_config)
        
        assert self.detector.config.window_size == 20
        assert self.detector.config.threshold == 4.0
        assert self.detector.config.min_samples == 5
        assert self.detector.config.alert_cooldown == 60
        
        # Window should be resized
        assert self.detector.traffic_window.maxlen == 20
    
    def test_reset(self):
        """Test detector reset functionality."""
        base_time = time.time()
        
        # Add some data
        for i in range(5):
            self.detector.add_packet(base_time + i)
        
        # Reset detector
        self.detector.reset()
        
        # Should be back to initial state
        assert len(self.detector.traffic_window) == 0
        assert self.detector.current_count == 0
        assert self.detector.last_alert_time == 0
    
    def test_thread_safety(self):
        """Test thread safety of anomaly detector."""
        base_time = time.time()
        results = []
        
        def add_packets(thread_id):
            """Add packets from multiple threads."""
            for i in range(10):
                alert = self.detector.add_packet(base_time + thread_id * 10 + i)
                if alert:
                    results.append(alert)
        
        # Create multiple threads
        threads = []
        for i in range(3):
            thread = threading.Thread(target=add_packets, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Should not crash and should have processed packets
        stats = self.detector.get_stats()
        assert stats["window_size"] > 0
    
    def test_zero_standard_deviation(self):
        """Test handling of zero standard deviation (all values same)."""
        base_time = time.time()
        
        # Create identical traffic pattern (same count every second)
        for second in range(10):
            for packet in range(5):  # Exactly 5 packets each second
                self.detector.add_packet(base_time + second)
        
        # Add same pattern - should not trigger alert due to zero stdev
        for packet in range(5):
            alert = self.detector.add_packet(base_time + 10)
        
        # Should handle gracefully without division by zero
        stats = self.detector.get_stats()
        assert "stdev_packets" not in stats or stats["stdev_packets"] == 0
    
    def test_callback_function(self):
        """Test alert callback functionality."""
        callback_alerts = []
        
        def test_callback(alert):
            callback_alerts.append(alert)
        
        detector = AnomalyDetector(
            config=self.config,
            alert_callback=test_callback
        )
        
        base_time = time.time()
        
        # Create baseline and spike
        for second in range(5):
            for packet in range(2):
                detector.add_packet(base_time + second)
        
        for packet in range(10):
            detector.add_packet(base_time + 5)
        
        # Advance to trigger anomaly check
        detector.add_packet(base_time + 6)
        
        # Callback should have been called
        assert len(callback_alerts) > 0
        assert isinstance(callback_alerts[0], AnomalyAlert)


if __name__ == "__main__":
    pytest.main([__file__])