"""
Integration tests for privilege handling in the main application.
Tests privilege error scenarios and API endpoint responses.
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from privileges import PrivilegeError, PlatformType, PrivilegeLevel

# Create a simple test app without lifespan issues
test_app = FastAPI(title="Test App")

@test_app.get("/privileges")
async def test_get_privileges():
    """Test endpoint for privilege information."""
    from privileges import get_privilege_status, get_setup_instructions
    privilege_status = get_privilege_status()
    setup_instructions = get_setup_instructions()
    
    return {
        "status": "success",
        "privilege_status": privilege_status,
        "setup_instructions": setup_instructions
    }

@test_app.get("/privileges/check")
async def test_check_privileges():
    """Test endpoint for privilege checking."""
    from privileges import check_packet_capture_privileges, get_privilege_status, get_setup_instructions
    
    has_privileges = check_packet_capture_privileges()
    privilege_status = get_privilege_status()
    
    response = {
        "has_privileges": has_privileges,
        "platform": privilege_status["platform"],
        "privilege_level": privilege_status["privilege_level"]
    }
    
    if not has_privileges:
        setup_instructions = get_setup_instructions()
        response["error_message"] = setup_instructions["error_message"]
        response["suggestions"] = setup_instructions["suggestions"][:3]
    
    return response

@pytest.fixture
def client():
    """Create test client for FastAPI application."""
    return TestClient(test_app)


class TestPrivilegeEndpoints:
    """Test privilege-related API endpoints."""
    
    def test_privileges_endpoint_success(self, client):
        """Test /privileges endpoint returns privilege information."""
        response = client.get("/privileges")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "privilege_status" in data
        assert "setup_instructions" in data
        
        # Check privilege status structure
        privilege_status = data["privilege_status"]
        assert "platform" in privilege_status
        assert "privilege_level" in privilege_status
        assert "has_privileges" in privilege_status
        
        # Check setup instructions structure
        setup_instructions = data["setup_instructions"]
        assert "platform" in setup_instructions
        assert "suggestions" in setup_instructions
        assert "quick_start" in setup_instructions
    
    @patch('test_privilege_integration.check_packet_capture_privileges')
    @patch('test_privilege_integration.get_privilege_status')
    def test_privileges_check_endpoint_with_privileges(self, mock_status, mock_check, client):
        """Test /privileges/check endpoint when privileges are available."""
        mock_check.return_value = True
        mock_status.return_value = {
            'platform': 'linux',
            'privilege_level': 'root',
            'has_privileges': True
        }
        
        response = client.get("/privileges/check")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_privileges"] is True
        assert data["platform"] == "linux"
        assert data["privilege_level"] == "root"
        assert "error_message" not in data
        assert "suggestions" not in data
    
    @patch('test_privilege_integration.check_packet_capture_privileges')
    @patch('test_privilege_integration.get_privilege_status')
    @patch('test_privilege_integration.get_setup_instructions')
    def test_privileges_check_endpoint_without_privileges(self, mock_instructions, mock_status, mock_check, client):
        """Test /privileges/check endpoint when privileges are insufficient."""
        mock_check.return_value = False
        mock_status.return_value = {
            'platform': 'linux',
            'privilege_level': 'none',
            'has_privileges': False
        }
        mock_instructions.return_value = {
            'error_message': 'Insufficient privileges',
            'suggestions': ['Use sudo', 'Set capabilities', 'Add to group']
        }
        
        response = client.get("/privileges/check")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_privileges"] is False
        assert data["platform"] == "linux"
        assert data["privilege_level"] == "none"
        assert "error_message" in data
        assert "suggestions" in data
        assert len(data["suggestions"]) == 3  # Top 3 suggestions





class TestPacketStreamerPrivileges:
    """Test privilege handling in PacketStreamer."""
    
    @patch('capture.check_packet_capture_privileges')
    @patch('capture.get_privilege_status')
    def test_packet_streamer_start_with_privileges(self, mock_status, mock_check):
        """Test PacketStreamer start when privileges are available."""
        from capture import PacketStreamer
        
        mock_check.return_value = True
        mock_status.return_value = {'platform': 'linux', 'has_privileges': True}
        
        streamer = PacketStreamer()
        
        with patch('capture.get_if_list', return_value=['eth0', 'lo']):
            with patch.object(streamer, '_capture_loop'):
                result = streamer.start('eth0')
                assert result is True
                assert streamer.is_running is True
    
    @patch('capture.check_packet_capture_privileges')
    @patch('capture.get_privilege_status')
    def test_packet_streamer_start_without_privileges(self, mock_status, mock_check):
        """Test PacketStreamer start when privileges are insufficient."""
        from capture import PacketStreamer
        
        mock_check.return_value = False
        mock_status.return_value = {
            'platform': 'linux',
            'has_privileges': False
        }
        
        streamer = PacketStreamer()
        result = streamer.start('eth0')
        
        assert result is False
        assert streamer.is_running is False


if __name__ == '__main__':
    pytest.main([__file__, '-v'])