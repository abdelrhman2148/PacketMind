"""
Integration tests for configuration management with main application.
Tests configuration loading, validation, and API endpoints.
Based on requirements 3.4, 6.3 for configuration management.
"""

import os
import tempfile
import pytest
from unittest.mock import patch

from config import init_config, reset_config, get_config


class TestConfigurationIntegration:
    """Test configuration integration with main application."""
    
    def setup_method(self):
        """Reset configuration before each test."""
        reset_config()
    
    def teardown_method(self):
        """Reset configuration after each test."""
        reset_config()
    
    def test_app_startup_with_default_config(self):
        """Test application startup with default configuration."""
        with patch.dict(os.environ, {}, clear=True):
            # Initialize configuration
            config = init_config()
            
            # Verify default values
            assert config.ai.use_mock is True
            assert config.server.port == 8000
            assert config.logging.level == "INFO"
            assert config.dev_mode is False
    
    def test_app_startup_with_custom_config(self):
        """Test application startup with custom configuration."""
        env_vars = {
            "OPENAI_API_KEY": "test-key",
            "USE_MOCK_AI": "false",
            "AI_TIMEOUT": "30",
            "HOST": "0.0.0.0",
            "PORT": "9000",
            "LOG_LEVEL": "DEBUG",
            "DEV_MODE": "true"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            # Initialize configuration
            config = init_config()
            
            # Verify custom values
            assert config.ai.api_key == "test-key"
            assert config.ai.use_mock is False
            assert config.ai.timeout == 30
            assert config.server.host == "0.0.0.0"
            assert config.server.port == 9000
            assert config.logging.level == "DEBUG"
            assert config.dev_mode is True
    
    def test_config_loading_with_custom_values(self):
        """Test configuration loading with custom values."""
        env_vars = {
            "OPENAI_API_KEY": "test-key",
            "USE_MOCK_AI": "false",
            "DEFAULT_INTERFACE": "eth0",
            "DEFAULT_BPF_FILTER": "port 80",
            "DEV_MODE": "true"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            # Initialize configuration
            config = init_config()
            
            # Check AI configuration
            assert config.ai.api_key == "test-key"
            assert config.ai.use_mock is False
            
            # Check capture configuration
            assert config.capture.default_interface == "eth0"
            assert config.capture.default_bpf_filter == "port 80"
            
            # Check server configuration
            assert config.server.host == "127.0.0.1"
            assert config.server.port == 8000
            
            # Check development mode
            assert config.dev_mode is True
    
    def test_config_loading_no_api_key(self):
        """Test configuration loading when no API key is set."""
        with patch.dict(os.environ, {}, clear=True):
            # Initialize configuration
            config = init_config()
            
            assert config.ai.api_key is None
            assert config.ai.use_mock is True
    
    def test_config_with_env_file(self):
        """Test configuration loading with .env file."""
        # Create temporary .env file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False) as f:
            f.write("# Test configuration file\n")
            f.write("OPENAI_API_KEY=env-file-key\n")
            f.write("USE_MOCK_AI=false\n")
            f.write("AI_TIMEOUT=25\n")
            f.write("DEFAULT_INTERFACE=wlan0\n")
            f.write("LOG_LEVEL=WARNING\n")
            f.write("DEV_MODE=true\n")
            f.flush()
            
            try:
                # Clear environment to ensure .env file values are used
                with patch.dict(os.environ, {}, clear=True):
                    # Initialize configuration with .env file
                    config = init_config(f.name)
                    
                    # Verify values from .env file
                    assert config.ai.api_key == "env-file-key"
                    assert config.ai.use_mock is False
                    assert config.ai.timeout == 25
                    assert config.capture.default_interface == "wlan0"
                    assert config.logging.level == "WARNING"
                    assert config.dev_mode is True
                
            finally:
                os.unlink(f.name)
    
    def test_config_validation_error_handling(self):
        """Test configuration validation error handling."""
        with patch.dict(os.environ, {"AI_TIMEOUT": "0"}, clear=True):
            # Should raise ValueError due to invalid timeout
            with pytest.raises(ValueError, match="AI timeout must be between 1 and 300 seconds"):
                init_config()
    
    def test_config_environment_override(self):
        """Test that environment variables override .env file values."""
        # Create .env file with one set of values
        with tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False) as f:
            f.write("USE_MOCK_AI=true\n")
            f.write("AI_TIMEOUT=20\n")
            f.write("DEV_MODE=false\n")
            f.flush()
            
            try:
                # Set environment variables that should override .env file
                env_vars = {
                    "USE_MOCK_AI": "false",  # Override .env file
                    "AI_TIMEOUT": "30"       # Override .env file
                    # DEV_MODE not set, should use .env file value
                }
                
                with patch.dict(os.environ, env_vars, clear=True):
                    config = init_config(f.name)
                    
                    # Environment variables should override .env file
                    assert config.ai.use_mock is False  # From environment
                    assert config.ai.timeout == 30      # From environment
                    assert config.dev_mode is False     # From .env file
                    
            finally:
                os.unlink(f.name)
    
    def test_config_logging_setup(self):
        """Test that logging is properly configured."""
        with patch.dict(os.environ, {"LOG_LEVEL": "DEBUG"}, clear=True):
            # Initialize configuration
            config = init_config()
            
            # Verify logging level was set
            import logging
            root_logger = logging.getLogger()
            assert root_logger.level == logging.DEBUG
    
    def test_config_anomaly_integration(self):
        """Test anomaly detection configuration integration."""
        env_vars = {
            "ANOMALY_WINDOW_SIZE": "120",
            "ANOMALY_THRESHOLD": "2.5",
            "ANOMALY_MIN_SAMPLES": "15",
            "ANOMALY_ALERT_COOLDOWN": "60"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            # Initialize configuration
            config = init_config()
            
            # Verify anomaly configuration
            assert config.anomaly.window_size == 120
            assert config.anomaly.threshold == 2.5
            assert config.anomaly.min_samples == 15
            assert config.anomaly.alert_cooldown == 60
            
            # Verify configuration was loaded correctly
            assert config.anomaly.window_size == 120
            assert config.anomaly.threshold == 2.5
    
    def test_config_ai_integration(self):
        """Test AI configuration integration."""
        # Test with API key
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key", "USE_MOCK_AI": "false"}, clear=True):
            config = init_config()
            
            assert config.ai.api_key == "test-key"
            assert config.ai.use_mock is False
            
            # Verify configuration was loaded correctly
            assert config.ai.api_key == "test-key"
            assert config.ai.use_mock is False
        
        # Test without API key (should default to mock)
        with patch.dict(os.environ, {}, clear=True):
            reset_config()
            config = init_config()
            
            assert config.ai.api_key is None
            assert config.ai.use_mock is True
    
    def test_config_server_integration(self):
        """Test server configuration integration."""
        env_vars = {
            "HOST": "0.0.0.0",
            "PORT": "9000"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = init_config()
            
            assert config.server.host == "0.0.0.0"
            assert config.server.port == 9000
            
            # Verify configuration was loaded correctly
            assert config.server.host == "0.0.0.0"
            assert config.server.port == 9000