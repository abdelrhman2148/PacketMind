"""
Tests for WebSocket connection handling and packet broadcasting.
Tests requirements 2.1, 2.2, 2.3, 2.4, 2.5 for WebSocket functionality.
"""

import asyncio
import json
import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from unittest.mock import Mock, patch, AsyncMock
import httpx

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from main import app, manager, packet_broadcaster, ConnectionManager
from models import PacketOut
from capture import PacketStreamer


class TestConnectionManager:
    """Test WebSocket connection management."""
    
    @pytest.fixture
    def connection_manager(self):
        """Create fresh connection manager for each test."""
        return ConnectionManager()
    
    @pytest.mark.asyncio
    async def test_connect_websocket(self, connection_manager):
        """Test WebSocket connection acceptance."""
        # Mock WebSocket
        mock_websocket = AsyncMock(spec=WebSocket)
        
        # Test connection
        await connection_manager.connect(mock_websocket)
        
        # Verify WebSocket was accepted and added to connections
        mock_websocket.accept.assert_called_once()
        assert mock_websocket in connection_manager.active_connections
        assert connection_manager.get_connection_count() == 1
    
    @pytest.mark.asyncio
    async def test_disconnect_websocket(self, connection_manager):
        """Test WebSocket disconnection cleanup."""
        # Mock WebSocket
        mock_websocket = AsyncMock(spec=WebSocket)
        
        # Connect then disconnect
        await connection_manager.connect(mock_websocket)
        assert connection_manager.get_connection_count() == 1
        
        await connection_manager.disconnect(mock_websocket)
        assert connection_manager.get_connection_count() == 0
        assert mock_websocket not in connection_manager.active_connections
    
    @pytest.mark.asyncio
    async def test_broadcast_to_multiple_clients(self, connection_manager):
        """Test broadcasting message to multiple connected clients."""
        # Create mock WebSockets
        mock_ws1 = AsyncMock(spec=WebSocket)
        mock_ws2 = AsyncMock(spec=WebSocket)
        mock_ws3 = AsyncMock(spec=WebSocket)
        
        # Connect all clients
        await connection_manager.connect(mock_ws1)
        await connection_manager.connect(mock_ws2)
        await connection_manager.connect(mock_ws3)
        
        # Broadcast message
        test_message = "test broadcast message"
        await connection_manager.broadcast(test_message)
        
        # Verify all clients received message
        mock_ws1.send_text.assert_called_once_with(test_message)
        mock_ws2.send_text.assert_called_once_with(test_message)
        mock_ws3.send_text.assert_called_once_with(test_message)
    
    @pytest.mark.asyncio
    async def test_broadcast_handles_disconnected_clients(self, connection_manager):
        """Test that broadcast removes disconnected clients automatically."""
        # Create mock WebSockets
        mock_ws_good = AsyncMock(spec=WebSocket)
        mock_ws_bad = AsyncMock(spec=WebSocket)
        
        # Make one WebSocket fail on send
        mock_ws_bad.send_text.side_effect = Exception("Connection closed")
        
        # Connect both clients
        await connection_manager.connect(mock_ws_good)
        await connection_manager.connect(mock_ws_bad)
        assert connection_manager.get_connection_count() == 2
        
        # Broadcast message
        await connection_manager.broadcast("test message")
        
        # Verify good client received message, bad client was removed
        mock_ws_good.send_text.assert_called_once()
        assert connection_manager.get_connection_count() == 1
        assert mock_ws_bad not in connection_manager.active_connections
    
    @pytest.mark.asyncio
    async def test_broadcast_empty_connections(self, connection_manager):
        """Test broadcast with no connected clients."""
        # Should not raise exception
        await connection_manager.broadcast("test message")
        assert connection_manager.get_connection_count() == 0


class TestWebSocketEndpoint:
    """Test WebSocket endpoint functionality."""
    
    @pytest.mark.asyncio
    async def test_websocket_endpoint_exists(self):
        """Test that WebSocket endpoint is properly configured."""
        # Test that the endpoint exists in the app routes
        websocket_routes = [route for route in app.routes if hasattr(route, 'path') and route.path == "/ws/packets"]
        assert len(websocket_routes) == 1
        assert websocket_routes[0].path == "/ws/packets"
    
    @pytest.mark.asyncio
    async def test_websocket_connection_manager_integration(self):
        """Test WebSocket connection manager integration with mock WebSocket."""
        # Create mock WebSocket
        mock_websocket = AsyncMock(spec=WebSocket)
        
        # Test connection flow
        await manager.connect(mock_websocket)
        assert manager.get_connection_count() == 1
        
        # Test broadcast to connected client
        test_message = "test message"
        await manager.broadcast(test_message)
        mock_websocket.send_text.assert_called_once_with(test_message)
        
        # Test disconnection
        await manager.disconnect(mock_websocket)
        assert manager.get_connection_count() == 0


class TestPacketBroadcaster:
    """Test packet broadcaster background task."""
    
    @pytest.mark.asyncio
    @patch('main.packet_streamer')
    @patch('main.manager')
    async def test_packet_broadcaster_processes_packets(self, mock_manager, mock_streamer):
        """Test that broadcaster reads packets and broadcasts them."""
        # Create test packet
        test_packet = PacketOut(
            ts=1640995200.123,
            src="10.0.0.1",
            dst="10.0.0.2",
            proto="UDP",
            length=512,
            sport=53,
            dport=12345,
            summary="UDP 10.0.0.1:53 -> 10.0.0.2:12345 len=512"
        )
        
        # Mock packet streamer to return packet then None
        mock_streamer.get_packet.side_effect = [test_packet, None, None]
        
        # Mock manager broadcast
        mock_manager.broadcast = AsyncMock()
        
        # Run broadcaster for short time
        broadcaster_task = asyncio.create_task(packet_broadcaster())
        await asyncio.sleep(0.1)
        broadcaster_task.cancel()
        
        try:
            await broadcaster_task
        except asyncio.CancelledError:
            pass
        
        # Verify packet was processed and broadcast
        mock_streamer.get_packet.assert_called()
        mock_manager.broadcast.assert_called()
        
        # Check broadcast was called with correct JSON
        call_args = mock_manager.broadcast.call_args
        if call_args:
            broadcast_data = call_args[0][0]
            packet_data = json.loads(broadcast_data)
            assert packet_data["src"] == "10.0.0.1"
            assert packet_data["proto"] == "UDP"
    
    @pytest.mark.asyncio
    @patch('main.packet_streamer')
    @patch('main.manager')
    async def test_packet_broadcaster_handles_errors(self, mock_manager, mock_streamer):
        """Test that broadcaster handles errors gracefully."""
        # Mock packet streamer to raise exception
        mock_streamer.get_packet.side_effect = Exception("Test error")
        
        # Mock manager
        mock_manager.broadcast = AsyncMock()
        
        # Run broadcaster for short time
        broadcaster_task = asyncio.create_task(packet_broadcaster())
        await asyncio.sleep(0.1)
        broadcaster_task.cancel()
        
        try:
            await broadcaster_task
        except asyncio.CancelledError:
            pass
        
        # Should not crash, should continue running
        mock_streamer.get_packet.assert_called()


class TestAPIEndpoints:
    """Test REST API endpoints."""
    
    def test_app_configuration(self):
        """Test that FastAPI app is properly configured."""
        assert app.title == "Wireshark+ Web API"
        assert app.version == "0.1.0"
        
        # Check that CORS middleware is configured
        cors_middleware = None
        for middleware in app.user_middleware:
            if "CORSMiddleware" in str(middleware.cls):
                cors_middleware = middleware
                break
        assert cors_middleware is not None
    
    def test_route_configuration(self):
        """Test that all required routes are configured."""
        route_paths = [route.path for route in app.routes if hasattr(route, 'path')]
        
        # Check required endpoints exist
        assert "/" in route_paths
        assert "/interfaces" in route_paths
        assert "/status" in route_paths
        assert "/ws/packets" in route_paths
    
    @patch('main.PacketStreamer.get_interfaces')
    def test_interfaces_endpoint_logic(self, mock_get_interfaces):
        """Test interfaces endpoint logic without TestClient."""
        from main import get_interfaces
        
        # Mock interface list
        mock_get_interfaces.return_value = ["eth0", "wlan0", "lo"]
        
        # Test the endpoint function directly
        import asyncio
        result = asyncio.run(get_interfaces())
        
        assert len(result) == 3
        assert result[0].name == "eth0"
        assert result[1].name == "wlan0"
        assert result[2].name == "lo"
        
        for interface in result:
            assert interface.is_up is True
            assert "Network interface" in interface.description
    
    @patch('main.packet_streamer')
    @patch('main.manager')
    def test_status_endpoint_logic(self, mock_manager, mock_streamer):
        """Test status endpoint logic without TestClient."""
        from main import get_status
        
        # Mock capture status
        mock_streamer.get_status.return_value = {
            "is_running": True,
            "interface": "eth0",
            "bpf_filter": "port 80",
            "queue_size": 10,
            "max_queue_size": 1000
        }
        
        # Mock connection count
        mock_manager.get_connection_count.return_value = 2
        
        # Test the endpoint function directly
        import asyncio
        result = asyncio.run(get_status())
        
        assert result.status == "healthy"
        assert result.capture_active is True
        assert result.current_interface == "eth0"
        assert result.current_filter == "port 80"
        assert result.connected_clients == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])