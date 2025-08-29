"""
Tests for privilege handling and platform support.
Implements requirement testing for privilege error scenarios.
"""

import os
import sys
import platform
import pytest
from unittest.mock import patch, MagicMock
from privileges import (
    PrivilegeManager,
    PrivilegeLevel,
    PlatformType,
    PrivilegeError,
    check_packet_capture_privileges,
    get_privilege_status,
    get_setup_instructions,
    validate_privileges_or_raise
)


class TestPrivilegeManager:
    """Test cases for PrivilegeManager class."""
    
    def test_platform_detection_linux(self):
        """Test platform detection for Linux."""
        with patch('platform.system', return_value='Linux'):
            manager = PrivilegeManager()
            assert manager.platform == PlatformType.LINUX
    
    def test_platform_detection_macos(self):
        """Test platform detection for macOS."""
        with patch('platform.system', return_value='Darwin'):
            manager = PrivilegeManager()
            assert manager.platform == PlatformType.MACOS
    
    def test_platform_detection_windows(self):
        """Test platform detection for Windows."""
        with patch('platform.system', return_value='Windows'):
            manager = PrivilegeManager()
            assert manager.platform == PlatformType.WINDOWS
    
    def test_platform_detection_unknown(self):
        """Test platform detection for unknown systems."""
        with patch('platform.system', return_value='FreeBSD'):
            manager = PrivilegeManager()
            assert manager.platform == PlatformType.UNKNOWN
    
    @patch('os.geteuid', return_value=0)
    def test_root_privileges_detected(self, mock_geteuid):
        """Test detection of root privileges."""
        manager = PrivilegeManager()
        assert manager.privilege_level == PrivilegeLevel.ROOT
        assert manager.has_packet_capture_privileges() is True
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv')
    def test_sudo_privileges_detected(self, mock_getenv, mock_geteuid):
        """Test detection of sudo privileges."""
        mock_getenv.return_value = 'testuser'  # SUDO_USER
        manager = PrivilegeManager()
        assert manager.privilege_level == PrivilegeLevel.SUDO
        assert manager.has_packet_capture_privileges() is True
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    @patch('platform.system', return_value='Linux')
    @patch('subprocess.run')
    def test_linux_capabilities_detected(self, mock_run, mock_system, mock_getenv, mock_geteuid):
        """Test detection of Linux capabilities."""
        # Mock successful getcap output
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = '/usr/bin/python3 = cap_net_raw,cap_net_admin+eip'
        mock_run.return_value = mock_result
        
        manager = PrivilegeManager()
        assert manager.privilege_level == PrivilegeLevel.CAPABILITIES
        assert manager.has_packet_capture_privileges() is True
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    @patch('platform.system', return_value='Linux')
    @patch('subprocess.run')
    def test_no_privileges_detected(self, mock_run, mock_system, mock_getenv, mock_geteuid):
        """Test detection when no privileges are available."""
        # Mock failed getcap output
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_result.stdout = ''
        mock_run.return_value = mock_result
        
        manager = PrivilegeManager()
        assert manager.privilege_level == PrivilegeLevel.NONE
        assert manager.has_packet_capture_privileges() is False
    
    def test_privilege_status_information(self):
        """Test privilege status information gathering."""
        manager = PrivilegeManager()
        status = manager.get_privilege_status()
        
        assert 'platform' in status
        assert 'privilege_level' in status
        assert 'has_privileges' in status
        assert 'user_id' in status
        assert 'effective_user_id' in status
        assert 'is_root' in status
        assert 'python_path' in status
        
        assert status['user_id'] == os.getuid()
        assert status['effective_user_id'] == os.geteuid()
        assert status['is_root'] == (os.geteuid() == 0)
        assert status['python_path'] == sys.executable
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    @patch('platform.system', return_value='Linux')
    def test_linux_error_message(self, mock_system, mock_getenv, mock_geteuid):
        """Test Linux-specific error messages."""
        with patch.object(PrivilegeManager, '_check_linux_capabilities', return_value=False):
            manager = PrivilegeManager()
            error_msg = manager.get_privilege_error_message()
            
            assert "Linux requires root privileges or NET_ADMIN/NET_RAW capabilities" in error_msg
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    @patch('platform.system', return_value='Darwin')
    def test_macos_error_message(self, mock_system, mock_getenv, mock_geteuid):
        """Test macOS-specific error messages."""
        manager = PrivilegeManager()
        error_msg = manager.get_privilege_error_message()
        
        assert "macOS requires administrator privileges" in error_msg
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    @patch('platform.system', return_value='Windows')
    def test_windows_error_message(self, mock_system, mock_getenv, mock_geteuid):
        """Test Windows-specific error messages."""
        manager = PrivilegeManager()
        error_msg = manager.get_privilege_error_message()
        
        assert "Windows requires administrator privileges and Npcap installation" in error_msg
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    @patch('platform.system', return_value='Linux')
    def test_linux_suggestions(self, mock_system, mock_getenv, mock_geteuid):
        """Test Linux-specific privilege suggestions."""
        with patch.object(PrivilegeManager, '_check_linux_capabilities', return_value=False):
            manager = PrivilegeManager()
            suggestions = manager.get_privilege_suggestions()
            
            assert any('sudo' in suggestion for suggestion in suggestions)
            assert any('setcap' in suggestion for suggestion in suggestions)
            assert any('netdev' in suggestion for suggestion in suggestions)
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    @patch('platform.system', return_value='Darwin')
    def test_macos_suggestions(self, mock_system, mock_getenv, mock_geteuid):
        """Test macOS-specific privilege suggestions."""
        manager = PrivilegeManager()
        suggestions = manager.get_privilege_suggestions()
        
        assert any('sudo' in suggestion for suggestion in suggestions)
        assert any('administrator' in suggestion.lower() for suggestion in suggestions)
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    @patch('platform.system', return_value='Windows')
    def test_windows_suggestions(self, mock_system, mock_getenv, mock_geteuid):
        """Test Windows-specific privilege suggestions."""
        manager = PrivilegeManager()
        suggestions = manager.get_privilege_suggestions()
        
        assert any('Administrator' in suggestion for suggestion in suggestions)
        assert any('Npcap' in suggestion for suggestion in suggestions)
        assert any('WSL2' in suggestion for suggestion in suggestions)
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value=None)
    def test_privilege_error_raised(self, mock_getenv, mock_geteuid):
        """Test that PrivilegeError is raised when privileges are insufficient."""
        with patch.object(PrivilegeManager, '_check_linux_capabilities', return_value=False):
            manager = PrivilegeManager()
            
            with pytest.raises(PrivilegeError) as exc_info:
                manager.raise_privilege_error()
            
            assert "Insufficient privileges" in str(exc_info.value)
            assert exc_info.value.platform is not None
            assert len(exc_info.value.suggestions) > 0
    
    @patch('os.geteuid', return_value=0)
    def test_no_error_with_privileges(self, mock_geteuid):
        """Test that no error is raised when privileges are sufficient."""
        manager = PrivilegeManager()
        # Should not raise an exception
        manager.raise_privilege_error()
    
    @patch('platform.system', return_value='Linux')
    @patch('subprocess.run')
    def test_linux_capability_setup_success(self, mock_run, mock_system):
        """Test successful Linux capability setup."""
        # Mock successful setcap command
        mock_run.side_effect = [
            MagicMock(returncode=0),  # which setcap
            MagicMock(returncode=0, stderr=''),  # setcap command
        ]
        
        with patch.object(PrivilegeManager, '_check_linux_capabilities', return_value=True):
            manager = PrivilegeManager()
            success, message = manager.setup_linux_capabilities()
            
            assert success is True
            assert "Successfully set capabilities" in message
    
    @patch('platform.system', return_value='Linux')
    @patch('subprocess.run')
    def test_linux_capability_setup_failure(self, mock_run, mock_system):
        """Test failed Linux capability setup."""
        with patch.object(PrivilegeManager, '_check_linux_capabilities', return_value=False):
            # Mock failed setcap command
            mock_run.side_effect = [
                MagicMock(returncode=0),  # which setcap
                MagicMock(returncode=1, stderr='Permission denied'),  # setcap command
            ]
            
            manager = PrivilegeManager()
            success, message = manager.setup_linux_capabilities()
            
            assert success is False
            assert "Failed to set capabilities" in message
    
    @patch('platform.system', return_value='Darwin')
    def test_capability_setup_non_linux(self, mock_system):
        """Test capability setup on non-Linux platforms."""
        manager = PrivilegeManager()
        success, message = manager.setup_linux_capabilities()
        
        assert success is False
        assert "only available on Linux" in message
    
    def test_setup_instructions_structure(self):
        """Test that setup instructions have the expected structure."""
        manager = PrivilegeManager()
        instructions = manager.get_setup_instructions()
        
        required_keys = [
            'platform', 'current_status', 'has_privileges',
            'error_message', 'suggestions', 'quick_start', 'detailed_setup'
        ]
        
        for key in required_keys:
            assert key in instructions
        
        assert isinstance(instructions['suggestions'], list)
        assert isinstance(instructions['quick_start'], list)
        assert isinstance(instructions['detailed_setup'], list)


class TestModuleFunctions:
    """Test cases for module-level functions."""
    
    @patch('privileges.privilege_manager')
    def test_check_packet_capture_privileges(self, mock_manager):
        """Test check_packet_capture_privileges function."""
        mock_manager.has_packet_capture_privileges.return_value = True
        
        result = check_packet_capture_privileges()
        assert result is True
        mock_manager.has_packet_capture_privileges.assert_called_once()
    
    @patch('privileges.privilege_manager')
    def test_get_privilege_status(self, mock_manager):
        """Test get_privilege_status function."""
        expected_status = {'platform': 'linux', 'has_privileges': True}
        mock_manager.get_privilege_status.return_value = expected_status
        
        result = get_privilege_status()
        assert result == expected_status
        mock_manager.get_privilege_status.assert_called_once()
    
    @patch('privileges.privilege_manager')
    def test_validate_privileges_or_raise_success(self, mock_manager):
        """Test validate_privileges_or_raise when privileges are sufficient."""
        mock_manager.raise_privilege_error.return_value = None
        
        # Should not raise an exception
        validate_privileges_or_raise()
        mock_manager.raise_privilege_error.assert_called_once()
    
    @patch('privileges.privilege_manager')
    def test_validate_privileges_or_raise_failure(self, mock_manager):
        """Test validate_privileges_or_raise when privileges are insufficient."""
        mock_manager.raise_privilege_error.side_effect = PrivilegeError(
            "Test error", "linux", ["suggestion1", "suggestion2"]
        )
        
        with pytest.raises(PrivilegeError):
            validate_privileges_or_raise()
    
    @patch('privileges.privilege_manager')
    def test_get_setup_instructions(self, mock_manager):
        """Test get_setup_instructions function."""
        expected_instructions = {
            'platform': 'linux',
            'quick_start': ['sudo make start-demo'],
            'detailed_setup': ['step 1', 'step 2']
        }
        mock_manager.get_setup_instructions.return_value = expected_instructions
        
        result = get_setup_instructions()
        assert result == expected_instructions
        mock_manager.get_setup_instructions.assert_called_once()


class TestPrivilegeError:
    """Test cases for PrivilegeError exception."""
    
    def test_privilege_error_creation(self):
        """Test PrivilegeError creation with all parameters."""
        message = "Test error message"
        platform = "linux"
        suggestions = ["suggestion1", "suggestion2"]
        
        error = PrivilegeError(message, platform, suggestions)
        
        assert str(error) == message
        assert error.message == message
        assert error.platform == platform
        assert error.suggestions == suggestions
    
    def test_privilege_error_without_suggestions(self):
        """Test PrivilegeError creation without suggestions."""
        message = "Test error message"
        platform = "linux"
        
        error = PrivilegeError(message, platform)
        
        assert str(error) == message
        assert error.message == message
        assert error.platform == platform
        assert error.suggestions == []


class TestIntegration:
    """Integration tests for privilege handling."""
    
    def test_privilege_manager_initialization(self):
        """Test that PrivilegeManager initializes correctly."""
        manager = PrivilegeManager()
        
        # Should detect platform
        assert manager.platform in [
            PlatformType.LINUX, PlatformType.MACOS, 
            PlatformType.WINDOWS, PlatformType.UNKNOWN
        ]
        
        # Should have a privilege level
        assert manager.privilege_level in [
            PrivilegeLevel.NONE, PrivilegeLevel.CAPABILITIES,
            PrivilegeLevel.SUDO, PrivilegeLevel.ROOT
        ]
    
    def test_error_message_consistency(self):
        """Test that error messages are consistent with privilege level."""
        manager = PrivilegeManager()
        
        if manager.has_packet_capture_privileges():
            # Should not have error message when privileges are available
            assert manager.get_privilege_error_message() == ""
            assert manager.get_privilege_suggestions() == []
        else:
            # Should have error message and suggestions when privileges are missing
            assert len(manager.get_privilege_error_message()) > 0
            assert len(manager.get_privilege_suggestions()) > 0
    
    def test_setup_instructions_completeness(self):
        """Test that setup instructions are complete and platform-appropriate."""
        manager = PrivilegeManager()
        instructions = manager.get_setup_instructions()
        
        # Should have platform-specific content
        if manager.platform == PlatformType.LINUX:
            quick_start = ' '.join(instructions['quick_start'])
            assert 'setcap' in quick_start or 'sudo' in quick_start
        elif manager.platform == PlatformType.MACOS:
            quick_start = ' '.join(instructions['quick_start'])
            assert 'sudo' in quick_start
        elif manager.platform == PlatformType.WINDOWS:
            detailed = ' '.join(instructions['detailed_setup'])
            assert 'Administrator' in detailed or 'WSL2' in detailed


if __name__ == '__main__':
    pytest.main([__file__, '-v'])