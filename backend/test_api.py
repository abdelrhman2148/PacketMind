"""
Tests for interface and BPF filter management functionality.
Tests requirements 4.1, 4.2, 4.3, 4.4, 4.5 for configuration management.
"""

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock

from capture import PacketStreamer
from models import CaptureSettings, NetworkInterface


class TestInterfaceManagement:
    """Test cases for interface management functionality."""
    
    @patch('capture.get_if_list')
    def test_get_interfaces_success(self, mock_get_if_list):
        """Test successful interface listing."""
        mock_get_if_list.return_value = ['eth0', 'lo', 'wlan0']
        
        interfaces = PacketStreamer.get_interfaces()
        
        assert len(interfaces) == 3
        assert 'eth0' in interfaces
        assert 'lo' in interfaces
        assert 'wlan0' in interfaces
    
    @patch('capture.get_if_list')
    def test_get_interfaces_empty(self, mock_get_if_list):
        """Test interface listing when no interfaces available."""
        mock_get_if_list.return_value = []
        
        interfaces = PacketStreamer.get_interfaces()
        
        assert len(interfaces) == 0
    
    @patch('capture.get_if_list')
    def test_get_interfaces_error(self, mock_get_if_list):
        """Test interface listing with error."""
        mock_get_if_list.side_effect = Exception("Network error")
        
        interfaces = PacketStreamer.get_interfaces()
        
        assert len(interfaces) == 0  # Should return empty list on error


class TestCaptureSettingsValidation:
    """Test cases for capture settings validation logic."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.streamer = PacketStreamer()
    
    def teardown_method(self):
        """Cleanup after tests."""
        if self.streamer.is_running:
            self.streamer.stop()
    
    @patch('capture.get_if_list')
    def test_interface_validation_success(self, mock_get_if_list):
        """Test successful interface validation."""
        mock_get_if_list.return_value = ['eth0', 'lo', 'wlan0']
        
        # Test valid interface
        available_interfaces = PacketStreamer.get_interfaces()
        assert 'eth0' in available_interfaces
        
        # Test interface validation in restart
        with patch.object(self.streamer, 'stop', return_value=True), \
             patch.object(self.streamer, 'start', return_value=True):
            result = self.streamer.restart('eth0', None)
            assert result is True
    
    @patch('capture.get_if_list')
    def test_interface_validation_failure(self, mock_get_if_list):
        """Test interface validation failure."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        
        # Test invalid interface in restart
        result = self.streamer.restart('invalid_interface', None)
        assert result is False
    
    def test_bpf_validation_in_restart(self):
        """Test BPF filter validation during restart."""
        with patch.object(PacketStreamer, 'get_interfaces', return_value=['eth0']), \
             patch.object(PacketStreamer, 'validate_bpf_filter', return_value="Invalid filter"):
            
            result = self.streamer.restart('eth0', 'invalid filter')
            assert result is False
    
    def test_settings_model_validation(self):
        """Test CaptureSettings model validation."""
        # Valid settings
        settings = CaptureSettings(iface="eth0", bpf="tcp port 80")
        assert settings.iface == "eth0"
        assert settings.bpf == "tcp port 80"
        
        # Settings without BPF filter
        settings = CaptureSettings(iface="eth0")
        assert settings.iface == "eth0"
        assert settings.bpf is None
        
        # Test validation error for missing interface
        with pytest.raises(Exception):  # Pydantic validation error
            CaptureSettings(bpf="tcp")


class TestStatusReporting:
    """Test cases for status reporting functionality."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.streamer = PacketStreamer()
    
    def teardown_method(self):
        """Cleanup after tests."""
        if self.streamer.is_running:
            self.streamer.stop()
    
    def test_get_status_running(self):
        """Test status when capture is running."""
        # Mock running state
        self.streamer.is_running = True
        self.streamer.current_interface = 'eth0'
        self.streamer.current_bpf = 'tcp port 80'
        
        status = self.streamer.get_status()
        
        assert status['is_running'] is True
        assert status['interface'] == 'eth0'
        assert status['bpf_filter'] == 'tcp port 80'
        assert status['queue_size'] == 0
        assert status['max_queue_size'] == 1000
    
    def test_get_status_stopped(self):
        """Test status when capture is stopped."""
        status = self.streamer.get_status()
        
        assert status['is_running'] is False
        assert status['interface'] is None
        assert status['bpf_filter'] is None
        assert status['queue_size'] == 0


class TestConfigurationIntegration:
    """Test cases for configuration change integration."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.streamer = PacketStreamer()
    
    def teardown_method(self):
        """Cleanup after tests."""
        if self.streamer.is_running:
            self.streamer.stop()
    
    @patch('capture.get_if_list')
    @patch.object(PacketStreamer, 'validate_bpf_filter')
    @patch.object(PacketStreamer, 'stop')
    @patch.object(PacketStreamer, 'start')
    def test_configuration_change_workflow(self, mock_start, mock_stop, mock_validate, mock_get_if_list):
        """Test complete configuration change workflow."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        mock_validate.return_value = None  # Valid filter
        mock_stop.return_value = True
        mock_start.return_value = True
        
        # Test configuration change
        result = self.streamer.restart('eth0', 'tcp port 443')
        
        assert result is True
        mock_validate.assert_called_once_with('tcp port 443')
        mock_stop.assert_called_once()
        mock_start.assert_called_once_with('eth0', 'tcp port 443')
    
    def test_network_interface_model(self):
        """Test NetworkInterface model."""
        interface = NetworkInterface(
            name="eth0",
            description="Ethernet interface",
            is_up=True
        )
        
        assert interface.name == "eth0"
        assert interface.description == "Ethernet interface"
        assert interface.is_up is True


if __name__ == "__main__":
    pytest.main([__file__])