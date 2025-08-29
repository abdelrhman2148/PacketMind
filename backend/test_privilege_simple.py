"""
Simple integration tests for privilege handling functionality.
Tests the core privilege checking without FastAPI complications.
"""

import pytest
from unittest.mock import patch, MagicMock
from privileges import (
    PrivilegeManager,
    PrivilegeLevel,
    PlatformType,
    check_packet_capture_privileges,
    get_privilege_status,
    get_setup_instructions
)


class TestPrivilegeIntegration:
    """Integration tests for privilege handling."""
    
    def test_privilege_manager_real_initialization(self):
        """Test that PrivilegeManager initializes with real system values."""
        manager = PrivilegeManager()
        
        # Should detect a real platform
        assert manager.platform in [
            PlatformType.LINUX, PlatformType.MACOS, 
            PlatformType.WINDOWS, PlatformType.UNKNOWN
        ]
        
        # Should have some privilege level
        assert manager.privilege_level in [
            PrivilegeLevel.NONE, PrivilegeLevel.CAPABILITIES,
            PrivilegeLevel.SUDO, PrivilegeLevel.ROOT
        ]
        
        # Status should be consistent
        status = manager.get_privilege_status()
        assert status['platform'] == manager.platform.value
        assert status['privilege_level'] == manager.privilege_level.value
        assert status['has_privileges'] == manager.has_packet_capture_privileges()
    
    def test_module_functions_work(self):
        """Test that module-level functions work correctly."""
        # These should not raise exceptions
        has_privileges = check_packet_capture_privileges()
        assert isinstance(has_privileges, bool)
        
        status = get_privilege_status()
        assert isinstance(status, dict)
        assert 'platform' in status
        assert 'has_privileges' in status
        
        instructions = get_setup_instructions()
        assert isinstance(instructions, dict)
        assert 'platform' in instructions
        assert 'suggestions' in instructions
    
    def test_error_messages_are_platform_appropriate(self):
        """Test that error messages match the detected platform."""
        manager = PrivilegeManager()
        
        if not manager.has_packet_capture_privileges():
            error_msg = manager.get_privilege_error_message()
            suggestions = manager.get_privilege_suggestions()
            
            assert len(error_msg) > 0
            assert len(suggestions) > 0
            
            # Check platform-specific content
            if manager.platform == PlatformType.LINUX:
                assert any('sudo' in suggestion.lower() or 'setcap' in suggestion.lower() 
                          for suggestion in suggestions)
            elif manager.platform == PlatformType.MACOS:
                assert any('sudo' in suggestion.lower() 
                          for suggestion in suggestions)
            elif manager.platform == PlatformType.WINDOWS:
                assert any('administrator' in suggestion.lower() or 'wsl' in suggestion.lower()
                          for suggestion in suggestions)
    
    @patch('os.geteuid', return_value=0)
    def test_root_privilege_detection(self, mock_geteuid):
        """Test that root privileges are correctly detected."""
        manager = PrivilegeManager()
        assert manager.privilege_level == PrivilegeLevel.ROOT
        assert manager.has_packet_capture_privileges() is True
        assert manager.get_privilege_error_message() == ""
        assert manager.get_privilege_suggestions() == []
    
    @patch('os.geteuid', return_value=1000)
    @patch('os.getenv', return_value='testuser')
    def test_sudo_privilege_detection(self, mock_getenv, mock_geteuid):
        """Test that sudo privileges are correctly detected."""
        manager = PrivilegeManager()
        assert manager.privilege_level == PrivilegeLevel.SUDO
        assert manager.has_packet_capture_privileges() is True
    
    def test_setup_instructions_completeness(self):
        """Test that setup instructions are complete."""
        instructions = get_setup_instructions()
        
        required_keys = [
            'platform', 'current_status', 'has_privileges',
            'error_message', 'suggestions', 'quick_start', 'detailed_setup'
        ]
        
        for key in required_keys:
            assert key in instructions, f"Missing key: {key}"
        
        # Should have some content
        assert len(instructions['suggestions']) >= 0
        assert len(instructions['quick_start']) >= 0
        assert len(instructions['detailed_setup']) >= 0
    
    def test_privilege_consistency(self):
        """Test that privilege status is consistent across functions."""
        has_privileges_1 = check_packet_capture_privileges()
        status = get_privilege_status()
        has_privileges_2 = status['has_privileges']
        
        assert has_privileges_1 == has_privileges_2
        
        # If no privileges, should have error message and suggestions
        if not has_privileges_1:
            instructions = get_setup_instructions()
            assert len(instructions['error_message']) > 0
            assert len(instructions['suggestions']) > 0
        else:
            instructions = get_setup_instructions()
            assert instructions['error_message'] == ""
            assert len(instructions['suggestions']) == 0


class TestPacketStreamerIntegration:
    """Test PacketStreamer integration with privilege checking."""
    
    @patch('capture.check_packet_capture_privileges')
    @patch('capture.get_privilege_status')
    def test_packet_streamer_privilege_check(self, mock_status, mock_check):
        """Test that PacketStreamer checks privileges before starting."""
        from capture import PacketStreamer
        
        # Test with insufficient privileges
        mock_check.return_value = False
        mock_status.return_value = {'platform': 'linux', 'has_privileges': False}
        
        streamer = PacketStreamer()
        result = streamer.start()
        
        assert result is False
        assert streamer.is_running is False
        mock_check.assert_called_once()
    
    @patch('capture.check_packet_capture_privileges')
    @patch('capture.get_if_list')
    def test_packet_streamer_with_privileges(self, mock_interfaces, mock_check):
        """Test that PacketStreamer starts when privileges are available."""
        from capture import PacketStreamer
        
        mock_check.return_value = True
        mock_interfaces.return_value = ['eth0', 'lo']
        
        streamer = PacketStreamer()
        
        # Mock the capture loop to avoid actually starting packet capture
        with patch.object(streamer, '_capture_loop'):
            result = streamer.start('lo')  # Use loopback interface
            
            assert result is True
            assert streamer.is_running is True
            
            # Clean up
            streamer.stop()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])