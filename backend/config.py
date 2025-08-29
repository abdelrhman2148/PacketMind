"""
Configuration management for Wireshark+ Web backend.
Implements requirements 3.4, 6.3 for environment variable loading and validation.
"""

import os
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from pathlib import Path

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class AIConfig:
    """AI service configuration."""
    api_key: Optional[str] = None
    use_mock: bool = True
    timeout: int = 20
    
    def __post_init__(self):
        """Validate AI configuration."""
        if self.timeout < 1 or self.timeout > 300:
            raise ValueError("AI timeout must be between 1 and 300 seconds")


@dataclass
class CaptureConfig:
    """Packet capture configuration."""
    default_interface: Optional[str] = None
    default_bpf_filter: Optional[str] = None
    
    def __post_init__(self):
        """Validate capture configuration."""
        # BPF filter validation would be done by Scapy at runtime
        pass


@dataclass
class ServerConfig:
    """Server configuration."""
    host: str = "127.0.0.1"
    port: int = 8000
    
    def __post_init__(self):
        """Validate server configuration."""
        if self.port < 1 or self.port > 65535:
            raise ValueError("Server port must be between 1 and 65535")


@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str = "INFO"
    
    def __post_init__(self):
        """Validate logging configuration."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.level.upper() not in valid_levels:
            raise ValueError(f"Log level must be one of: {valid_levels}")
        self.level = self.level.upper()


@dataclass
class AnomalyConfig:
    """Anomaly detection configuration."""
    window_size: int = 60
    threshold: float = 3.0
    min_samples: int = 10
    alert_cooldown: int = 30
    
    def __post_init__(self):
        """Validate anomaly detection configuration."""
        if self.window_size < 10 or self.window_size > 300:
            raise ValueError("Anomaly window size must be between 10 and 300 seconds")
        
        if self.threshold < 1.0 or self.threshold > 10.0:
            raise ValueError("Anomaly threshold must be between 1.0 and 10.0")
        
        if self.min_samples < 5 or self.min_samples > self.window_size:
            raise ValueError("Anomaly min samples must be between 5 and window_size")
        
        if self.alert_cooldown < 5 or self.alert_cooldown > 300:
            raise ValueError("Anomaly alert cooldown must be between 5 and 300 seconds")


@dataclass
class AppConfig:
    """Main application configuration."""
    ai: AIConfig = field(default_factory=AIConfig)
    capture: CaptureConfig = field(default_factory=CaptureConfig)
    server: ServerConfig = field(default_factory=ServerConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    anomaly: AnomalyConfig = field(default_factory=AnomalyConfig)
    dev_mode: bool = False
    
    def __post_init__(self):
        """Validate overall configuration."""
        # All sub-configurations are validated in their own __post_init__ methods
        pass


def load_env_file(env_path: Optional[str] = None) -> Dict[str, str]:
    """
    Load environment variables from .env file.
    
    Args:
        env_path: Path to .env file. If None, looks for .env in current directory.
        
    Returns:
        Dictionary of environment variables from file.
    """
    if env_path is None:
        env_path = ".env"
    
    env_vars = {}
    env_file = Path(env_path)
    
    if not env_file.exists():
        logger.info(f"No .env file found at {env_file.absolute()}")
        return env_vars
    
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                
                # Parse KEY=VALUE format
                if '=' not in line:
                    logger.warning(f"Invalid line {line_num} in {env_file}: {line}")
                    continue
                
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                
                env_vars[key] = value
        
        logger.info(f"Loaded {len(env_vars)} environment variables from {env_file}")
        
    except Exception as e:
        logger.error(f"Failed to load .env file {env_file}: {e}")
    
    return env_vars


def get_env_bool(key: str, default: bool = False) -> bool:
    """Get boolean environment variable."""
    value = os.getenv(key, str(default)).lower()
    return value in ('true', '1', 'yes', 'on')


def get_env_int(key: str, default: int) -> int:
    """Get integer environment variable with validation."""
    try:
        return int(os.getenv(key, str(default)))
    except ValueError as e:
        logger.warning(f"Invalid integer value for {key}: {os.getenv(key)}, using default {default}")
        return default


def get_env_float(key: str, default: float) -> float:
    """Get float environment variable with validation."""
    try:
        return float(os.getenv(key, str(default)))
    except ValueError as e:
        logger.warning(f"Invalid float value for {key}: {os.getenv(key)}, using default {default}")
        return default


def load_config(env_file_path: Optional[str] = None) -> AppConfig:
    """
    Load application configuration from environment variables and .env file.
    
    Args:
        env_file_path: Path to .env file. If None, looks for .env in current directory.
        
    Returns:
        AppConfig instance with loaded configuration.
        
    Raises:
        ValueError: If configuration validation fails.
    """
    # Load .env file using python-dotenv if available, otherwise use custom loader
    if DOTENV_AVAILABLE:
        if env_file_path:
            load_dotenv(env_file_path, override=False)
        else:
            load_dotenv(override=False)  # Looks for .env in current directory
        logger.info("Loaded environment variables using python-dotenv")
    else:
        # Fallback to custom .env file loader
        env_vars = load_env_file(env_file_path)
        
        # Update os.environ with .env file variables (only if not already set)
        for key, value in env_vars.items():
            if key not in os.environ:
                os.environ[key] = value
        logger.info("Loaded environment variables using custom loader")
    
    try:
        # Load AI configuration
        ai_config = AIConfig(
            api_key=os.getenv("OPENAI_API_KEY"),
            use_mock=get_env_bool("USE_MOCK_AI", True),
            timeout=get_env_int("AI_TIMEOUT", 20)
        )
        
        # Load capture configuration
        capture_config = CaptureConfig(
            default_interface=os.getenv("DEFAULT_INTERFACE") or None,
            default_bpf_filter=os.getenv("DEFAULT_BPF_FILTER") or None
        )
        
        # Load server configuration
        server_config = ServerConfig(
            host=os.getenv("HOST", "127.0.0.1"),
            port=get_env_int("PORT", 8000)
        )
        
        # Load logging configuration
        logging_config = LoggingConfig(
            level=os.getenv("LOG_LEVEL", "INFO")
        )
        
        # Load anomaly detection configuration
        anomaly_config = AnomalyConfig(
            window_size=get_env_int("ANOMALY_WINDOW_SIZE", 60),
            threshold=get_env_float("ANOMALY_THRESHOLD", 3.0),
            min_samples=get_env_int("ANOMALY_MIN_SAMPLES", 10),
            alert_cooldown=get_env_int("ANOMALY_ALERT_COOLDOWN", 30)
        )
        
        # Load general configuration
        dev_mode = get_env_bool("DEV_MODE", False)
        
        # Create main configuration
        config = AppConfig(
            ai=ai_config,
            capture=capture_config,
            server=server_config,
            logging=logging_config,
            anomaly=anomaly_config,
            dev_mode=dev_mode
        )
        
        logger.info("Configuration loaded successfully")
        return config
        
    except ValueError as e:
        logger.error(f"Configuration validation failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        raise ValueError(f"Configuration loading failed: {e}")


def get_default_config() -> AppConfig:
    """
    Get default configuration for development mode.
    
    Returns:
        AppConfig with development-friendly defaults.
    """
    return AppConfig(
        ai=AIConfig(
            api_key=None,
            use_mock=True,
            timeout=20
        ),
        capture=CaptureConfig(
            default_interface=None,
            default_bpf_filter=None
        ),
        server=ServerConfig(
            host="127.0.0.1",
            port=8000
        ),
        logging=LoggingConfig(
            level="INFO"
        ),
        anomaly=AnomalyConfig(
            window_size=60,
            threshold=3.0,
            min_samples=10,
            alert_cooldown=30
        ),
        dev_mode=True
    )


def validate_config(config: AppConfig) -> None:
    """
    Validate configuration at startup.
    
    Args:
        config: Configuration to validate.
        
    Raises:
        ValueError: If configuration is invalid.
    """
    try:
        # Validation is done in __post_init__ methods of dataclasses
        # This function can be extended for cross-field validation
        
        # Example: Warn if using mock AI in production
        if not config.dev_mode and config.ai.use_mock:
            logger.warning("Using mock AI responses in non-development mode")
        
        # Example: Warn if no API key is set and not using mock
        if not config.ai.use_mock and not config.ai.api_key:
            logger.warning("No OpenAI API key set, will fall back to mock responses")
        
        logger.info("Configuration validation passed")
        
    except Exception as e:
        logger.error(f"Configuration validation failed: {e}")
        raise ValueError(f"Invalid configuration: {e}")


def setup_logging(config: AppConfig) -> None:
    """
    Setup logging based on configuration.
    
    Args:
        config: Application configuration.
    """
    log_level = getattr(logging, config.logging.level)
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('wireshark_web.log', mode='a')
        ],
        force=True  # Override any existing configuration
    )
    
    logger.info(f"Logging configured with level: {config.logging.level}")


# Global configuration instance
_config: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """
    Get the global configuration instance.
    
    Returns:
        Global AppConfig instance.
        
    Raises:
        RuntimeError: If configuration hasn't been initialized.
    """
    global _config
    if _config is None:
        raise RuntimeError("Configuration not initialized. Call init_config() first.")
    return _config


def init_config(env_file_path: Optional[str] = None) -> AppConfig:
    """
    Initialize global configuration.
    
    Args:
        env_file_path: Path to .env file.
        
    Returns:
        Initialized AppConfig instance.
    """
    global _config
    _config = load_config(env_file_path)
    validate_config(_config)
    setup_logging(_config)
    return _config


def reset_config() -> None:
    """Reset global configuration (mainly for testing)."""
    global _config
    _config = None