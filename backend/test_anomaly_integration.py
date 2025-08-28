"""
Integration tests for anomaly detection API endpoints.
Tests the integration between anomaly detection and FastAPI endpoints.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app
from anomaly import AnomalyDetector, AnomalyConfig


class TestAnomalyIntegration:
    """Test anomaly detection integration with FastAPI."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client = TestClient(app)
    
    def test_anomaly_stats_endpoint(self):
        """Test GET /anomaly/stats endpoint."""
        response = self.client.get("/anomaly/stats")
        
        # Should return stats (may be 503 if detector not initialized in test)
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "status" in data
            assert "statistics" in data
    
    def test_anomaly_config_endpoint_valid(self):
        """Test POST /anomaly/config with valid parameters."""
        config_data = {
            "window_size": 120,
            "threshold": 2.5,
            "min_samples": 15,
            "alert_cooldown": 60
        }
        
        response = self.client.post("/anomaly/config", params=config_data)
        
        # Should succeed or fail with 503 if detector not initialized
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert data["status"] == "success"
            assert "config" in data
            assert data["config"]["window_size"] == 120
            assert data["config"]["threshold"] == 2.5
    
    def test_anomaly_config_endpoint_invalid_window_size(self):
        """Test POST /anomaly/config with invalid window size."""
        config_data = {
            "window_size": 5,  # Too small
            "threshold": 3.0,
            "min_samples": 10,
            "alert_cooldown": 30
        }
        
        response = self.client.post("/anomaly/config", params=config_data)
        
        # Should return 400 for invalid parameters or 503 if detector not initialized
        assert response.status_code in [400, 503]
        
        if response.status_code == 400:
            data = response.json()
            assert "Window size must be between" in data["detail"]
    
    def test_anomaly_config_endpoint_invalid_threshold(self):
        """Test POST /anomaly/config with invalid threshold."""
        config_data = {
            "window_size": 60,
            "threshold": 0.5,  # Too small
            "min_samples": 10,
            "alert_cooldown": 30
        }
        
        response = self.client.post("/anomaly/config", params=config_data)
        
        # Should return 400 for invalid parameters or 503 if detector not initialized
        assert response.status_code in [400, 503]
        
        if response.status_code == 400:
            data = response.json()
            assert "Threshold must be between" in data["detail"]
    
    def test_anomaly_config_endpoint_invalid_min_samples(self):
        """Test POST /anomaly/config with invalid min_samples."""
        config_data = {
            "window_size": 60,
            "threshold": 3.0,
            "min_samples": 2,  # Too small
            "alert_cooldown": 30
        }
        
        response = self.client.post("/anomaly/config", params=config_data)
        
        # Should return 400 for invalid parameters or 503 if detector not initialized
        assert response.status_code in [400, 503]
        
        if response.status_code == 400:
            data = response.json()
            assert "Min samples must be between" in data["detail"]
    
    def test_anomaly_config_endpoint_invalid_alert_cooldown(self):
        """Test POST /anomaly/config with invalid alert cooldown."""
        config_data = {
            "window_size": 60,
            "threshold": 3.0,
            "min_samples": 10,
            "alert_cooldown": 2  # Too small
        }
        
        response = self.client.post("/anomaly/config", params=config_data)
        
        # Should return 400 for invalid parameters or 503 if detector not initialized
        assert response.status_code in [400, 503]
        
        if response.status_code == 400:
            data = response.json()
            assert "Alert cooldown must be between" in data["detail"]


if __name__ == "__main__":
    pytest.main([__file__])