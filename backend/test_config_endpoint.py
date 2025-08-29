"""
Simple test for configuration endpoint functionality.
Tests the /config API endpoint without TestClient issues.
"""

import os
import pytest
from unittest.mock import patch
import asyncio

from config import init_config, reset_config
from main import get_configuration


class TestConfigurationEndpoint:
    """Test configuration API endpoint functionality."""
    
    def setup_method(self):
        """Reset configuration before each test."""
        reset_config()
    
    def teardown_method(self):
        """Reset configuration after each test."""
        reset_config()
    
    @pytest.mark.asyncio
    async def test_get_configuration_default(self):
        """Test configuration endpoint with default values."""
        with patch.dict(os.environ, {}, clear=True):
            # Initialize configuration
            init_config()
            
            # Call the endpoint function directly
            result = await get_configuration()
            
            # Verify response structure
            assert "ai" in result
            assert "capture" in result
            assert "server" in result
            assert "logging" in result
            assert "anomaly" in result
            assert "dev_mode" in result
            
            # Verify AI configuration
            assert result["ai"]["has_api_key"] is False
            assert result["ai"]["use_mock"] is True
            assert result["ai"]["timeout"] == 20
            assert "api_key" not in result["ai"]  # Should not expose actual key
            
            # Verify server configuration
            assert result["server"]["host"] == "127.0.0.1"
            assert result["server"]["port"] == 8000
            
            # Verify logging configuration
            assert result["logging"]["level"] == "INFO"
            
            # Verify anomaly configuration
            assert result["anomaly"]["window_size"] == 60
            assert result["anomaly"]["threshold"] == 3.0
            
            # Verify development mode
            assert result["dev_mode"] is False
    
    @pytest.mark.asyncio
    async def test_get_configuration_with_api_key(self):
        """Test configuration endpoint with API key set."""
        env_vars = {
            "OPENAI_API_KEY": "test-api-key",
            "USE_MOCK_AI": "false",
            "AI_TIMEOUT": "30",
            "DEV_MODE": "true"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            # Initialize configuration
            init_config()
            
            # Call the endpoint function directly
            result = await get_configuration()
            
            # Verify AI configuration with API key
            assert result["ai"]["has_api_key"] is True
            assert result["ai"]["use_mock"] is False
            assert result["ai"]["timeout"] == 30
            assert "api_key" not in result["ai"]  # Should not expose actual key
            
            # Verify development mode
            assert result["dev_mode"] is True
    
    @pytest.mark.asyncio
    async def test_get_configuration_with_custom_values(self):
        """Test configuration endpoint with custom values."""
        env_vars = {
            "DEFAULT_INTERFACE": "eth0",
            "DEFAULT_BPF_FILTER": "port 80",
            "HOST": "0.0.0.0",
            "PORT": "9000",
            "LOG_LEVEL": "DEBUG",
            "ANOMALY_WINDOW_SIZE": "120",
            "ANOMALY_THRESHOLD": "2.5",
            "ANOMALY_MIN_SAMPLES": "15",
            "ANOMALY_ALERT_COOLDOWN": "60"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            # Initialize configuration
            init_config()
            
            # Call the endpoint function directly
            result = await get_configuration()
            
            # Verify capture configuration
            assert result["capture"]["default_interface"] == "eth0"
            assert result["capture"]["default_bpf_filter"] == "port 80"
            
            # Verify server configuration
            assert result["server"]["host"] == "0.0.0.0"
            assert result["server"]["port"] == 9000
            
            # Verify logging configuration
            assert result["logging"]["level"] == "DEBUG"
            
            # Verify anomaly configuration
            assert result["anomaly"]["window_size"] == 120
            assert result["anomaly"]["threshold"] == 2.5
            assert result["anomaly"]["min_samples"] == 15
            assert result["anomaly"]["alert_cooldown"] == 60
    
    @pytest.mark.asyncio
    async def test_get_configuration_no_sensitive_data(self):
        """Test that configuration endpoint doesn't expose sensitive data."""
        env_vars = {
            "OPENAI_API_KEY": "super-secret-api-key"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            # Initialize configuration
            init_config()
            
            # Call the endpoint function directly
            result = await get_configuration()
            
            # Convert to string to check for sensitive data
            result_str = str(result)
            
            # Verify sensitive data is not exposed
            assert "super-secret-api-key" not in result_str
            assert result["ai"]["has_api_key"] is True  # But indicates presence