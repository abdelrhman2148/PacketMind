#!/usr/bin/env python3
"""
Configuration system demonstration script.
Shows how the configuration system loads and validates settings.
"""

import os
import tempfile
from config import init_config, reset_config, get_config


def demo_default_config():
    """Demonstrate default configuration loading."""
    print("=== Default Configuration Demo ===")
    
    # Clear environment and reset config
    reset_config()
    
    # Load default configuration
    config = init_config()
    
    print(f"AI Configuration:")
    print(f"  - API Key: {'Set' if config.ai.api_key else 'Not set'}")
    print(f"  - Use Mock: {config.ai.use_mock}")
    print(f"  - Timeout: {config.ai.timeout}s")
    
    print(f"Server Configuration:")
    print(f"  - Host: {config.server.host}")
    print(f"  - Port: {config.server.port}")
    
    print(f"Logging Configuration:")
    print(f"  - Level: {config.logging.level}")
    
    print(f"Development Mode: {config.dev_mode}")
    print()


def demo_env_config():
    """Demonstrate configuration loading from environment variables."""
    print("=== Environment Variables Demo ===")
    
    # Set environment variables
    os.environ.update({
        "OPENAI_API_KEY": "demo-api-key",
        "USE_MOCK_AI": "false",
        "AI_TIMEOUT": "30",
        "HOST": "0.0.0.0",
        "PORT": "9000",
        "LOG_LEVEL": "DEBUG",
        "DEV_MODE": "true"
    })
    
    # Reset and reload configuration
    reset_config()
    config = init_config()
    
    print(f"AI Configuration:")
    print(f"  - API Key: {'Set' if config.ai.api_key else 'Not set'}")
    print(f"  - Use Mock: {config.ai.use_mock}")
    print(f"  - Timeout: {config.ai.timeout}s")
    
    print(f"Server Configuration:")
    print(f"  - Host: {config.server.host}")
    print(f"  - Port: {config.server.port}")
    
    print(f"Logging Configuration:")
    print(f"  - Level: {config.logging.level}")
    
    print(f"Development Mode: {config.dev_mode}")
    print()


def demo_env_file_config():
    """Demonstrate configuration loading from .env file."""
    print("=== .env File Demo ===")
    
    # Create temporary .env file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False) as f:
        f.write("# Demo configuration file\n")
        f.write("OPENAI_API_KEY=file-api-key\n")
        f.write("USE_MOCK_AI=false\n")
        f.write("DEFAULT_INTERFACE=eth0\n")
        f.write("DEFAULT_BPF_FILTER=port 80\n")
        f.write("ANOMALY_THRESHOLD=2.5\n")
        f.write("DEV_MODE=true\n")
        f.flush()
        
        try:
            # Clear environment and load from file
            for key in ["OPENAI_API_KEY", "USE_MOCK_AI", "DEFAULT_INTERFACE", 
                       "DEFAULT_BPF_FILTER", "ANOMALY_THRESHOLD", "DEV_MODE"]:
                os.environ.pop(key, None)
            
            reset_config()
            config = init_config(f.name)
            
            print(f"AI Configuration:")
            print(f"  - API Key: {'Set' if config.ai.api_key else 'Not set'}")
            print(f"  - Use Mock: {config.ai.use_mock}")
            
            print(f"Capture Configuration:")
            print(f"  - Default Interface: {config.capture.default_interface}")
            print(f"  - Default BPF Filter: {config.capture.default_bpf_filter}")
            
            print(f"Anomaly Configuration:")
            print(f"  - Threshold: {config.anomaly.threshold}")
            
            print(f"Development Mode: {config.dev_mode}")
            print()
            
        finally:
            os.unlink(f.name)


def demo_validation_errors():
    """Demonstrate configuration validation errors."""
    print("=== Validation Error Demo ===")
    
    try:
        # Set invalid configuration
        os.environ["AI_TIMEOUT"] = "0"  # Invalid timeout
        reset_config()
        config = init_config()
        print("ERROR: Should have failed validation!")
    except ValueError as e:
        print(f"✓ Caught validation error: {e}")
    
    try:
        # Set another invalid configuration
        os.environ.pop("AI_TIMEOUT", None)
        os.environ["PORT"] = "99999"  # Invalid port
        reset_config()
        config = init_config()
        print("ERROR: Should have failed validation!")
    except ValueError as e:
        print(f"✓ Caught validation error: {e}")
    
    # Clean up
    os.environ.pop("PORT", None)
    print()


def demo_global_config():
    """Demonstrate global configuration access."""
    print("=== Global Configuration Demo ===")
    
    # Initialize configuration
    reset_config()
    config = init_config()
    
    # Access global configuration
    global_config = get_config()
    
    print(f"Global config is same instance: {config is global_config}")
    print(f"AI timeout from global config: {global_config.ai.timeout}s")
    print()


if __name__ == "__main__":
    print("Wireshark+ Web Configuration System Demo")
    print("=" * 50)
    print()
    
    demo_default_config()
    demo_env_config()
    demo_env_file_config()
    demo_validation_errors()
    demo_global_config()
    
    print("Demo completed successfully!")