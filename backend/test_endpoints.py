"""
Integration tests for API endpoints related to interface and BPF filter management.
Tests requirements 4.1, 4.2, 4.3, 4.4, 4.5 for API endpoint functionality.
"""

import pytest
import json
import asyncio
from unittest.mock import patch, Mock, AsyncMock
from fastapi import HTTPException

from capture import PacketStreamer
from models import CaptureSettings


class TestInterfacesEndpoint:
    """Test cases for GET /interfaces endpoint."""
    
    @patch.object(PacketStreamer, 'get_interfaces')
    def test_get_interfaces_success(self, mock_get_interfaces):
        """Test successful interface listing via API."""
        from main import get_interfaces
        
        mock_get_interfaces.return_value = ['eth0', 'lo', 'wlan0']
        
        result = asyncio.run(get_interfaces())
        
        assert len(result) == 3
        
        # Check interface structure
        interface_names = [iface.name for iface in result]
        assert 'eth0' in interface_names
        assert 'lo' in interface_names
        assert 'wlan0' in interface_names
        
        # Check interface model structure
        for iface in result:
            assert hasattr(iface, 'name')
            assert hasattr(iface, 'description')
            assert hasattr(iface, 'is_up')
            assert isinstance(iface.is_up, bool)
    
    @patch.object(PacketStreamer, 'get_interfaces')
    def test_get_interfaces_empty(self, mock_get_interfaces):
        """Test interface listing when no interfaces available."""
        from main import get_interfaces
        
        mock_get_interfaces.return_value = []
        
        result = asyncio.run(get_interfaces())
        
        assert len(result) == 0
    
    @patch.object(PacketStreamer, 'get_interfaces')
    def test_get_interfaces_error(self, mock_get_interfaces):
        """Test interface listing with error."""
        from main import get_interfaces
        
        mock_get_interfaces.side_effect = Exception("Network error")
        
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(get_interfaces())
        
        assert exc_info.value.status_code == 500
        assert "Failed to retrieve network interfaces" in str(exc_info.value.detail)


class TestCaptureSettingsEndpoint:
    """Test cases for POST /capture/settings endpoint."""
    
    @patch.object(PacketStreamer, 'get_interfaces')
    @patch.object(PacketStreamer, 'validate_bpf_filter')
    @patch('main.packet_streamer')
    @patch('main.manager')
    def test_update_settings_success(self, mock_manager, mock_streamer, 
                                   mock_validate, mock_get_interfaces):
        """Test successful capture settings update."""
        from main import update_capture_settings
        
        mock_get_interfaces.return_value = ['eth0', 'lo']
        mock_validate.return_value = None  # Valid filter
        mock_streamer.restart.return_value = True
        mock_manager.broadcast = AsyncMock()
        
        settings = CaptureSettings(iface="eth0", bpf="tcp port 80")
        
        result = asyncio.run(update_capture_settings(settings))
        
        assert result['status'] == 'success'
        assert result['interface'] == 'eth0'
        assert result['bpf_filter'] == 'tcp port 80'
        
        # Verify restart was called with correct parameters
        mock_streamer.restart.assert_called_once_with('eth0', 'tcp port 80')
    
    @patch.object(PacketStreamer, 'get_interfaces')
    def test_update_settings_invalid_interface(self, mock_get_interfaces):
        """Test settings update with invalid interface."""
        from main import update_capture_settings
        
        mock_get_interfaces.return_value = ['eth0', 'lo']
        
        settings = CaptureSettings(iface="invalid_interface", bpf="tcp port 80")
        
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(update_capture_settings(settings))
        
        assert exc_info.value.status_code == 400
        assert "Interface 'invalid_interface' not found" in str(exc_info.value.detail)
    
    @patch.object(PacketStreamer, 'get_interfaces')
    @patch.object(PacketStreamer, 'validate_bpf_filter')
    def test_update_settings_invalid_bpf(self, mock_validate, mock_get_interfaces):
        """Test settings update with invalid BPF filter."""
        from main import update_capture_settings
        
        mock_get_interfaces.return_value = ['eth0', 'lo']
        mock_validate.return_value = "Invalid BPF syntax"
        
        settings = CaptureSettings(iface="eth0", bpf="invalid filter syntax")
        
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(update_capture_settings(settings))
        
        assert exc_info.value.status_code == 400
        assert "Invalid BPF filter" in str(exc_info.value.detail)
    
    @patch.object(PacketStreamer, 'get_interfaces')
    @patch.object(PacketStreamer, 'validate_bpf_filter')
    @patch('main.packet_streamer')
    def test_update_settings_restart_failure(self, mock_streamer, mock_validate, 
                                           mock_get_interfaces):
        """Test settings update when restart fails."""
        from main import update_capture_settings
        
        mock_get_interfaces.return_value = ['eth0', 'lo']
        mock_validate.return_value = None  # Valid filter
        mock_streamer.restart.return_value = False  # Restart fails
        
        settings = CaptureSettings(iface="eth0", bpf="tcp port 80")
        
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(update_capture_settings(settings))
        
        assert exc_info.value.status_code == 500
        assert "Failed to restart packet capture" in str(exc_info.value.detail)
    
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
    
    @patch.object(PacketStreamer, 'get_interfaces')
    @patch('main.packet_streamer')
    @patch('main.manager')
    def test_update_settings_without_bpf(self, mock_manager, mock_streamer, 
                                       mock_get_interfaces):
        """Test settings update without BPF filter."""
        from main import update_capture_settings
        
        mock_get_interfaces.return_value = ['eth0', 'lo']
        mock_streamer.restart.return_value = True
        mock_manager.broadcast = AsyncMock()
        
        settings = CaptureSettings(iface="eth0")
        
        result = asyncio.run(update_capture_settings(settings))
        
        assert result['status'] == 'success'
        assert result['interface'] == 'eth0'
        assert result['bpf_filter'] is None
        
        # Verify restart was called with None for BPF filter
        mock_streamer.restart.assert_called_once_with('eth0', None)


class TestStatusEndpoint:
    """Test cases for GET /status endpoint."""
    
    @patch('main.packet_streamer')
    @patch('main.manager')
    def test_get_status_healthy(self, mock_manager, mock_streamer):
        """Test status endpoint when system is healthy."""
        from main import get_status
        
        mock_streamer.get_status.return_value = {
            'is_running': True,
            'interface': 'eth0',
            'bpf_filter': 'tcp port 80',
            'queue_size': 10,
            'max_queue_size': 1000
        }
        mock_manager.get_connection_count.return_value = 2
        
        result = asyncio.run(get_status())
        
        assert result.status == 'healthy'
        assert result.capture_active is True
        assert result.current_interface == 'eth0'
        assert result.current_filter == 'tcp port 80'
        assert result.connected_clients == 2
    
    @patch('main.packet_streamer')
    @patch('main.manager')
    def test_get_status_degraded(self, mock_manager, mock_streamer):
        """Test status endpoint when capture is not running."""
        from main import get_status
        
        mock_streamer.get_status.return_value = {
            'is_running': False,
            'interface': None,
            'bpf_filter': None,
            'queue_size': 0,
            'max_queue_size': 1000
        }
        mock_manager.get_connection_count.return_value = 1
        
        result = asyncio.run(get_status())
        
        assert result.status == 'degraded'
        assert result.capture_active is False
        assert result.current_interface is None
        assert result.current_filter is None
        assert result.connected_clients == 1


if __name__ == "__main__":
    pytest.main([__file__])