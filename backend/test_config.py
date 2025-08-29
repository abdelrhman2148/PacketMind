"""
Unit tests for configuration management system.
Tests environment variable loading, validation, and default configuration.
Based on requirements 3.4, 6.3 for configuration management.
"""

import os
import tempfile
import pytest
from unittest.mock import patch
from pathlib import Path

from config import (
    AIConfig, CaptureConfig, ServerConfig, LoggingConfig, AnomalyConfig, AppConfig,
    load_env_file, get_env_bool, get_env_int, get_env_float,
    load_config, get_default_config, validate_config, setup_logging,
    init_config, get_config, reset_config
)


class TestConfigDataClasses:
    """Test configuration data classes and validation."""
    
    def test_ai_config_defaults(self):
        """Test AI configuration defaults."""
        config = AIConfig()
        assert config.api_key is None
        assert config.use_mock is True
        assert config.timeout == 20
    
    def test_ai_config_validation(self):
        """Test AI configuration validation."""
        # Valid configuration
        config = AIConfig(timeout=30)
        assert config.timeout == 30
        
        # Invalid timeout
        with pytest.raises(ValueError, match="AI timeout must be between 1 and 300 seconds"):
            AIConfig(timeout=0)
        
        with pytest.raises(ValueError, match="AI timeout must be between 1 and 300 seconds"):
            AIConfig(timeout=301)
    
    def test_capture_config_defaults(self):
        """Test capture configuration defaults."""
        config = CaptureConfig()
        assert config.default_interface is None
        assert config.default_bpf_filter is None
    
    def test_server_config_defaults(self):
        """Test server configuration defaults."""
        config = ServerConfig()
        assert config.host == "127.0.0.1"
        assert config.port == 8000
    
    def test_server_config_validation(self):
        """Test server configuration validation."""
        # Valid configuration
        config = ServerConfig(port=9000)
        assert config.port == 9000
        
        # Invalid port
        with pytest.raises(ValueError, match="Server port must be between 1 and 65535"):
            ServerConfig(port=0)
        
        with pytest.raises(ValueError, match="Server port must be between 1 and 65535"):
            ServerConfig(port=65536)
    
    def test_logging_config_defaults(self):
        """Test logging configuration defaults."""
        config = LoggingConfig()
        assert config.level == "INFO"
    
    def test_logging_config_validation(self):
        """Test logging configuration validation."""
        # Valid levels
        for level in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
            config = LoggingConfig(level=level.lower())
            assert config.level == level
        
        # Invalid level
        with pytest.raises(ValueError, match="Log level must be one of"):
            LoggingConfig(level="INVALID")
    
    def test_anomaly_config_defaults(self):
        """Test anomaly configuration defaults."""
        config = AnomalyConfig()
        assert config.window_size == 60
        assert config.threshold == 3.0
        assert config.min_samples == 10
        assert config.alert_cooldown == 30
    
    def test_anomaly_config_validation(self):
        """Test anomaly configuration validation."""
        # Valid configuration
        config = AnomalyConfig(window_size=120, threshold=2.5)
        assert config.window_size == 120
        assert config.threshold == 2.5
        
        # Invalid window size
        with pytest.raises(ValueError, match="Anomaly window size must be between 10 and 300 seconds"):
            AnomalyConfig(window_size=5)
        
        # Invalid threshold
        with pytest.raises(ValueError, match="Anomaly threshold must be between 1.0 and 10.0"):
            AnomalyConfig(threshold=0.5)
        
        # Invalid min samples
        with pytest.raises(ValueError, match="Anomaly min samples must be between 5 and window_size"):
            AnomalyConfig(min_samples=3)
        
        with pytest.raises(ValueError, match="Anomaly min samples must be between 5 and window_size"):
            AnomalyConfig(window_size=30, min_samples=40)
        
        # Invalid alert cooldown
        with pytest.raises(ValueError, match="Anomaly alert cooldown must be between 5 and 300 seconds"):
            AnomalyConfig(alert_cooldown=3)
    
    def test_app_config_defaults(self):
        """Test main application configuration defaults."""
        config = AppConfig()
        assert isinstance(config.ai, AIConfig)
        assert isinstance(config.capture, CaptureConfig)
        assert isinstance(config.server, ServerConfig)
        assert isinstance(config.logging, LoggingConfig)
        assert isinstance(config.anomaly, AnomalyConfig)
        assert config.dev_mode is False


class TestEnvFileLoading:
    """Test .env file loading functionality."""
    
    def test_load_env_file_not_exists(self):
        """Test loading non-existent .env file."""
        env_vars = load_env_file("/nonexistent/.env")
        assert env_vars == {}
    
    def test_load_env_file_valid(self):
        """Test loading valid .env file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False) as f:
            f.write("# Comment line\n")
            f.write("KEY1=value1\n")
            f.write("KEY2=\"quoted value\"\n")
            f.write("KEY3='single quoted'\n")
            f.write("KEY4=\n")  # Empty value
            f.write("\n")  # Empty line
            f.write("INVALID_LINE_NO_EQUALS\n")  # Invalid line
            f.flush()
            
            try:
                env_vars = load_env_file(f.name)
                assert env_vars["KEY1"] == "value1"
                assert env_vars["KEY2"] == "quoted value"
                assert env_vars["KEY3"] == "single quoted"
                assert env_vars["KEY4"] == ""
                assert "INVALID_LINE_NO_EQUALS" not in env_vars
            finally:
                os.unlink(f.name)
    
    def test_load_env_file_malformed(self):
        """Test loading malformed .env file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False) as f:
            f.write("KEY1=value1\n")
            f.write("MALFORMED LINE\n")
            f.write("KEY2=value2\n")
            f.flush()
            
            try:
                env_vars = load_env_file(f.name)
                assert env_vars["KEY1"] == "value1"
                assert env_vars["KEY2"] == "value2"
                assert len(env_vars) == 2
            finally:
                os.unlink(f.name)


class TestEnvHelpers:
    """Test environment variable helper functions."""
    
    def test_get_env_bool(self):
        """Test boolean environment variable parsing."""
        with patch.dict(os.environ, {}, clear=True):
            # Test defaults
            assert get_env_bool("MISSING_KEY") is False
            assert get_env_bool("MISSING_KEY", True) is True
            
            # Test true values
            for true_val in ["true", "True", "TRUE", "1", "yes", "YES", "on", "ON"]:
                os.environ["TEST_BOOL"] = true_val
                assert get_env_bool("TEST_BOOL") is True
            
            # Test false values
            for false_val in ["false", "False", "FALSE", "0", "no", "NO", "off", "OFF"]:
                os.environ["TEST_BOOL"] = false_val
                assert get_env_bool("TEST_BOOL") is False
    
    def test_get_env_int(self):
        """Test integer environment variable parsing."""
        with patch.dict(os.environ, {}, clear=True):
            # Test default
            assert get_env_int("MISSING_KEY", 42) == 42
            
            # Test valid integer
            os.environ["TEST_INT"] = "123"
            assert get_env_int("TEST_INT", 0) == 123
            
            # Test invalid integer (should return default)
            os.environ["TEST_INT"] = "not_a_number"
            assert get_env_int("TEST_INT", 42) == 42
    
    def test_get_env_float(self):
        """Test float environment variable parsing."""
        with patch.dict(os.environ, {}, clear=True):
            # Test default
            assert get_env_float("MISSING_KEY", 3.14) == 3.14
            
            # Test valid float
            os.environ["TEST_FLOAT"] = "2.5"
            assert get_env_float("TEST_FLOAT", 0.0) == 2.5
            
            # Test invalid float (should return default)
            os.environ["TEST_FLOAT"] = "not_a_number"
            assert get_env_float("TEST_FLOAT", 3.14) == 3.14


class TestConfigLoading:
    """Test configuration loading from environment."""
    
    def test_load_config_defaults(self):
        """Test loading configuration with all defaults."""
        with patch.dict(os.environ, {}, clear=True):
            config = load_config()
            
            # Check AI config defaults
            assert config.ai.api_key is None
            assert config.ai.use_mock is True
            assert config.ai.timeout == 20
            
            # Check server config defaults
            assert config.server.host == "127.0.0.1"
            assert config.server.port == 8000
            
            # Check logging config defaults
            assert config.logging.level == "INFO"
            
            # Check anomaly config defaults
            assert config.anomaly.window_size == 60
            assert config.anomaly.threshold == 3.0
            
            # Check general defaults
            assert config.dev_mode is False
    
    def test_load_config_from_env(self):
        """Test loading configuration from environment variables."""
        env_vars = {
            "OPENAI_API_KEY": "test-api-key",
            "USE_MOCK_AI": "false",
            "AI_TIMEOUT": "30",
            "DEFAULT_INTERFACE": "eth0",
            "DEFAULT_BPF_FILTER": "port 80",
            "HOST": "0.0.0.0",
            "PORT": "9000",
            "LOG_LEVEL": "DEBUG",
            "ANOMALY_WINDOW_SIZE": "120",
            "ANOMALY_THRESHOLD": "2.5",
            "ANOMALY_MIN_SAMPLES": "15",
            "ANOMALY_ALERT_COOLDOWN": "60",
            "DEV_MODE": "true"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            config = load_config()
            
            # Check AI config
            assert config.ai.api_key == "test-api-key"
            assert config.ai.use_mock is False
            assert config.ai.timeout == 30
            
            # Check capture config
            assert config.capture.default_interface == "eth0"
            assert config.capture.default_bpf_filter == "port 80"
            
            # Check server config
            assert config.server.host == "0.0.0.0"
            assert config.server.port == 9000
            
            # Check logging config
            assert config.logging.level == "DEBUG"
            
            # Check anomaly config
            assert config.anomaly.window_size == 120
            assert config.anomaly.threshold == 2.5
            assert config.anomaly.min_samples == 15
            assert config.anomaly.alert_cooldown == 60
            
            # Check general config
            assert config.dev_mode is True
    
    def test_load_config_validation_error(self):
        """Test configuration loading with validation errors."""
        with patch.dict(os.environ, {"AI_TIMEOUT": "0"}, clear=True):
            with pytest.raises(ValueError, match="AI timeout must be between 1 and 300 seconds"):
                load_config()
    
    def test_load_config_with_env_file(self):
        """Test loading configuration with .env file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False) as f:
            f.write("OPENAI_API_KEY=file-api-key\n")
            f.write("USE_MOCK_AI=false\n")
            f.write("DEV_MODE=true\n")
            f.flush()
            
            try:
                # Environment variable should override .env file
                with patch.dict(os.environ, {"USE_MOCK_AI": "true"}, clear=True):
                    config = load_config(f.name)
                    assert config.ai.api_key == "file-api-key"  # From .env file
                    assert config.ai.use_mock is True  # From environment (overrides .env)
                    assert config.dev_mode is True  # From .env file
            finally:
                os.unlink(f.name)


class TestDefaultConfig:
    """Test default configuration generation."""
    
    def test_get_default_config(self):
        """Test getting default development configuration."""
        config = get_default_config()
        
        assert config.ai.api_key is None
        assert config.ai.use_mock is True
        assert config.server.host == "127.0.0.1"
        assert config.server.port == 8000
        assert config.logging.level == "INFO"
        assert config.dev_mode is True


class TestConfigValidation:
    """Test configuration validation."""
    
    def test_validate_config_success(self):
        """Test successful configuration validation."""
        config = get_default_config()
        validate_config(config)  # Should not raise
    
    def test_validate_config_warnings(self):
        """Test configuration validation with warnings."""
        config = get_default_config()
        config.dev_mode = False
        config.ai.use_mock = True
        
        # Should log warning but not raise
        validate_config(config)


class TestGlobalConfig:
    """Test global configuration management."""
    
    def setup_method(self):
        """Reset global config before each test."""
        reset_config()
    
    def teardown_method(self):
        """Reset global config after each test."""
        reset_config()
    
    def test_init_config(self):
        """Test global configuration initialization."""
        with patch.dict(os.environ, {"DEV_MODE": "true"}, clear=True):
            config = init_config()
            assert config.dev_mode is True
            
            # Should be able to get the same config
            same_config = get_config()
            assert same_config is config
    
    def test_get_config_not_initialized(self):
        """Test getting config when not initialized."""
        with pytest.raises(RuntimeError, match="Configuration not initialized"):
            get_config()
    
    def test_reset_config(self):
        """Test resetting global configuration."""
        init_config()
        reset_config()
        
        with pytest.raises(RuntimeError, match="Configuration not initialized"):
            get_config()


class TestConfigIntegration:
    """Integration tests for configuration system."""
    
    def test_full_config_cycle(self):
        """Test complete configuration loading and validation cycle."""
        # Create temporary .env file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False) as f:
            f.write("# Test configuration\n")
            f.write("OPENAI_API_KEY=test-key\n")
            f.write("USE_MOCK_AI=false\n")
            f.write("AI_TIMEOUT=25\n")
            f.write("HOST=localhost\n")
            f.write("PORT=8080\n")
            f.write("LOG_LEVEL=WARNING\n")
            f.write("DEV_MODE=true\n")
            f.flush()
            
            try:
                # Load configuration
                config = load_config(f.name)
                
                # Validate configuration
                validate_config(config)
                
                # Check loaded values
                assert config.ai.api_key == "test-key"
                assert config.ai.use_mock is False
                assert config.ai.timeout == 25
                assert config.server.host == "localhost"
                assert config.server.port == 8080
                assert config.logging.level == "WARNING"
                assert config.dev_mode is True
                
            finally:
                os.unlink(f.name)
    
    def test_config_error_handling(self):
        """Test configuration error handling."""
        # Test with invalid port that should cause validation error
        with patch.dict(os.environ, {"PORT": "99999"}, clear=True):
            with pytest.raises(ValueError, match="Server port must be between 1 and 65535"):
                load_config()
        
        # Test with invalid AI timeout that should cause validation error
        with patch.dict(os.environ, {"AI_TIMEOUT": "0"}, clear=True):
            with pytest.raises(ValueError, match="AI timeout must be between 1 and 300 seconds"):
                load_config()