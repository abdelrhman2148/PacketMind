"""
Privilege handling and platform support for packet capture.
Implements requirements 1.5, 6.2, 6.5 for privilege validation and error handling.
"""

import os
import sys
import platform
import subprocess
import logging
from typing import Dict, List, Optional, Tuple
from enum import Enum

logger = logging.getLogger(__name__)


class PrivilegeLevel(Enum):
    """Enumeration of privilege levels for packet capture."""
    NONE = "none"
    CAPABILITIES = "capabilities"
    SUDO = "sudo"
    ROOT = "root"


class PlatformType(Enum):
    """Enumeration of supported platforms."""
    LINUX = "linux"
    MACOS = "darwin"
    WINDOWS = "windows"
    UNKNOWN = "unknown"


class PrivilegeError(Exception):
    """Custom exception for privilege-related errors."""
    
    def __init__(self, message: str, platform: str, suggestions: List[str] = None):
        self.message = message
        self.platform = platform
        self.suggestions = suggestions or []
        super().__init__(self.message)


class PrivilegeManager:
    """
    Manages privilege validation and provides platform-specific guidance.
    Implements requirements 1.5, 6.2, 6.5 for privilege handling.
    """
    
    def __init__(self):
        self.platform = self._detect_platform()
        self.privilege_level = PrivilegeLevel.NONE
        self._validate_privileges()
    
    def _detect_platform(self) -> PlatformType:
        """Detect the current platform."""
        system = platform.system().lower()
        if system == "linux":
            return PlatformType.LINUX
        elif system == "darwin":
            return PlatformType.MACOS
        elif system == "windows":
            return PlatformType.WINDOWS
        else:
            return PlatformType.UNKNOWN
    
    def _validate_privileges(self) -> None:
        """Validate current privilege level for packet capture."""
        if os.geteuid() == 0:
            self.privilege_level = PrivilegeLevel.ROOT
            logger.info("Running as root - packet capture privileges available")
            return
        
        if self.platform == PlatformType.LINUX:
            if self._check_linux_capabilities():
                self.privilege_level = PrivilegeLevel.CAPABILITIES
                logger.info("Linux capabilities detected - packet capture privileges available")
                return
        
        # Check if running under sudo
        if os.getenv('SUDO_USER'):
            self.privilege_level = PrivilegeLevel.SUDO
            logger.info("Running under sudo - packet capture privileges available")
            return
        
        self.privilege_level = PrivilegeLevel.NONE
        logger.warning("No packet capture privileges detected")
    
    def _check_linux_capabilities(self) -> bool:
        """Check if Python binary has required Linux capabilities."""
        try:
            python_path = sys.executable
            result = subprocess.run(
                ['getcap', python_path],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                caps = result.stdout.strip()
                required_caps = ['cap_net_raw', 'cap_net_admin']
                return any(cap in caps for cap in required_caps)
            
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            logger.debug("Failed to check Linux capabilities")
        
        return False
    
    def has_packet_capture_privileges(self) -> bool:
        """Check if current process has packet capture privileges."""
        return self.privilege_level != PrivilegeLevel.NONE
    
    def get_privilege_status(self) -> Dict[str, any]:
        """Get detailed privilege status information."""
        return {
            "platform": self.platform.value,
            "privilege_level": self.privilege_level.value,
            "has_privileges": self.has_packet_capture_privileges(),
            "user_id": os.getuid(),
            "effective_user_id": os.geteuid(),
            "is_root": os.geteuid() == 0,
            "sudo_user": os.getenv('SUDO_USER'),
            "python_path": sys.executable
        }
    
    def get_privilege_error_message(self) -> str:
        """Get platform-specific error message for insufficient privileges."""
        if self.has_packet_capture_privileges():
            return ""
        
        base_message = "Insufficient privileges for packet capture."
        
        if self.platform == PlatformType.LINUX:
            return f"{base_message} Linux requires root privileges or NET_ADMIN/NET_RAW capabilities."
        elif self.platform == PlatformType.MACOS:
            return f"{base_message} macOS requires administrator privileges for network access."
        elif self.platform == PlatformType.WINDOWS:
            return f"{base_message} Windows requires administrator privileges and Npcap installation."
        else:
            return f"{base_message} Platform '{self.platform.value}' may require special privileges."
    
    def get_privilege_suggestions(self) -> List[str]:
        """Get platform-specific suggestions for resolving privilege issues."""
        if self.has_packet_capture_privileges():
            return []
        
        suggestions = []
        
        if self.platform == PlatformType.LINUX:
            suggestions.extend([
                "Run with sudo: 'sudo python -m uvicorn main:app'",
                "Set capabilities: 'sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)'",
                "Add user to netdev group: 'sudo usermod -a -G netdev $USER' (then logout/login)",
                "Use the provided startup script: 'sudo make start-demo'"
            ])
        elif self.platform == PlatformType.MACOS:
            suggestions.extend([
                "Run with sudo: 'sudo python -m uvicorn main:app'",
                "Use the provided startup script: 'sudo make start-demo'",
                "Ensure you have administrator privileges on this system",
                "Consider using a virtual machine for development if admin access is restricted"
            ])
        elif self.platform == PlatformType.WINDOWS:
            suggestions.extend([
                "Run Command Prompt or PowerShell as Administrator",
                "Install Npcap from https://nmap.org/npcap/",
                "Consider using WSL2 with Linux for easier setup",
                "Ensure Windows Defender or antivirus isn't blocking packet capture"
            ])
        else:
            suggestions.extend([
                "Check platform-specific documentation for packet capture requirements",
                "Consider running with elevated privileges",
                "Verify that packet capture libraries are properly installed"
            ])
        
        return suggestions
    
    def raise_privilege_error(self) -> None:
        """Raise a PrivilegeError with platform-specific information."""
        if self.has_packet_capture_privileges():
            return
        
        raise PrivilegeError(
            message=self.get_privilege_error_message(),
            platform=self.platform.value,
            suggestions=self.get_privilege_suggestions()
        )
    
    def setup_linux_capabilities(self, python_path: str = None) -> Tuple[bool, str]:
        """
        Attempt to set up Linux capabilities for packet capture.
        
        Args:
            python_path: Path to Python executable (defaults to current)
            
        Returns:
            Tuple of (success, message)
        """
        if self.platform != PlatformType.LINUX:
            return False, "Capability setup only available on Linux"
        
        if python_path is None:
            python_path = sys.executable
        
        try:
            # Check if setcap is available
            subprocess.run(['which', 'setcap'], check=True, capture_output=True)
            
            # Set capabilities
            cmd = ['sudo', 'setcap', 'cap_net_raw,cap_net_admin=eip', python_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                # Verify capabilities were set
                if self._check_linux_capabilities():
                    self.privilege_level = PrivilegeLevel.CAPABILITIES
                    return True, f"Successfully set capabilities on {python_path}"
                else:
                    return False, "Capabilities were set but verification failed"
            else:
                return False, f"Failed to set capabilities: {result.stderr}"
                
        except subprocess.TimeoutExpired:
            return False, "Timeout while setting capabilities"
        except subprocess.SubprocessError as e:
            return False, f"Error setting capabilities: {e}"
        except FileNotFoundError:
            return False, "setcap command not found - install libcap2-bin package"
    
    def get_setup_instructions(self) -> Dict[str, any]:
        """Get comprehensive setup instructions for the current platform."""
        instructions = {
            "platform": self.platform.value,
            "current_status": self.get_privilege_status(),
            "has_privileges": self.has_packet_capture_privileges(),
            "error_message": self.get_privilege_error_message(),
            "suggestions": self.get_privilege_suggestions(),
            "quick_start": [],
            "detailed_setup": []
        }
        
        if self.platform == PlatformType.LINUX:
            instructions["quick_start"] = [
                "sudo make start-demo",
                "# OR set capabilities once:",
                f"sudo setcap cap_net_raw,cap_net_admin=eip {sys.executable}",
                "make start-demo  # No sudo needed after capabilities"
            ]
            instructions["detailed_setup"] = [
                "# Install required packages:",
                "sudo apt update",
                "sudo apt install libpcap-dev python3-dev",
                "",
                "# Option 1: Use sudo (simple)",
                "sudo python -m uvicorn main:app --host 0.0.0.0 --port 8000",
                "",
                "# Option 2: Set capabilities (recommended for development)",
                f"sudo setcap cap_net_raw,cap_net_admin=eip {sys.executable}",
                "python -m uvicorn main:app --host 0.0.0.0 --port 8000",
                "",
                "# Option 3: Add user to netdev group (requires logout/login)",
                "sudo usermod -a -G netdev $USER"
            ]
        elif self.platform == PlatformType.MACOS:
            instructions["quick_start"] = [
                "sudo make start-demo"
            ]
            instructions["detailed_setup"] = [
                "# macOS requires sudo for packet capture",
                "sudo python -m uvicorn main:app --host 0.0.0.0 --port 8000",
                "",
                "# Ensure you have administrator privileges",
                "# Consider using Homebrew for package management:",
                "brew install libpcap"
            ]
        elif self.platform == PlatformType.WINDOWS:
            instructions["quick_start"] = [
                "# Run PowerShell as Administrator",
                "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
            ]
            instructions["detailed_setup"] = [
                "# Install Npcap (required for packet capture on Windows)",
                "# Download from: https://nmap.org/npcap/",
                "",
                "# Run as Administrator",
                "# Right-click PowerShell/Command Prompt -> 'Run as Administrator'",
                "",
                "# Alternative: Use WSL2 (recommended)",
                "wsl --install -d Ubuntu",
                "# Then follow Linux instructions inside WSL2"
            ]
        
        return instructions


# Global privilege manager instance
privilege_manager = PrivilegeManager()


def check_packet_capture_privileges() -> bool:
    """
    Check if current process has packet capture privileges.
    
    Returns:
        bool: True if privileges are available, False otherwise
    """
    return privilege_manager.has_packet_capture_privileges()


def get_privilege_status() -> Dict[str, any]:
    """
    Get detailed privilege status information.
    
    Returns:
        dict: Privilege status details
    """
    return privilege_manager.get_privilege_status()


def validate_privileges_or_raise() -> None:
    """
    Validate packet capture privileges and raise PrivilegeError if insufficient.
    
    Raises:
        PrivilegeError: If insufficient privileges for packet capture
    """
    privilege_manager.raise_privilege_error()


def get_setup_instructions() -> Dict[str, any]:
    """
    Get platform-specific setup instructions.
    
    Returns:
        dict: Setup instructions for current platform
    """
    return privilege_manager.get_setup_instructions()