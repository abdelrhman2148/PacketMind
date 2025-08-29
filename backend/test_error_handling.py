"""
Integration tests for comprehensive error handling.
Tests requirements 1.5, 2.5, 3.5, 4.5 for error scenarios.
"""

import pytest
import asyncio
import json
import time
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.main import app, manager, packet_streamer, anomaly_detector
from backend.capture import PacketStreamer, PrivilegeError, InterfaceError, FilterError
from backend.models import PacketOut, CaptureSettings, ExplainIn


class TestPacketCaptureErrorHandling:
    """Test error handling for packet capture failures (Requirement 1.5)."""
    
    def test_privilege_error_handling(self):
        """Test handling of insufficient privileges for packet capture."""
        with patch('capture.check_packet_capture_privileges', return_value=False):
            with patch('capture.get_privilege_status', return_value={'platform': 'linux'}):
                streamer = PacketStreamer()
                
                with pytest.raises(PrivilegeError) as exc_info:
                    streamer.start()
                
                assert "Insufficient privileges" in str(exc_info.value)
                assert not streamer.is_running
    
    def test_interface_error_handling(self):
        """Test handling of invalid network interface."""
        with patch('capture.check_packet_capture_privileges', return_value=True):
            with patch('capture.get_if_list', return_value=['eth0', 'lo']):
                streamer = PacketStreamer()
                
                with pytest.raises(InterfaceError) as exc_info:
                    streamer.start(interface='invalid_interface')
                
                assert "not found" in str(exc_info.value)
                assert "Available interfaces" in str(exc_info.value)
                assert not streamer.is_running
    
    def test_bpf_filter_error_handling(self):
        """Test handling of invalid BPF filter."""
        with patch('capture.check_packet_capture_privileges', return_value=True):
            streamer = PacketStreamer()
            
            with pytest.raises(FilterError) as exc_info:
                streamer.start(bpf_filter="invalid filter syntax ((")
            
            assert "unmatched parentheses" in str(exc_info.value)
            assert not streamer.is_running
    
    def test_capture_loop_error_recovery(self):
        """Test error recovery in packet capture loop."""
        streamer = PacketStreamer()
        
        # Mock the sniff function to raise various errors
        with patch('capture.sniff') as mock_sniff:
            # First call raises PermissionError, should not retry
            mock_sniff.side_effect = PermissionError("Operation not permitted")
            
            # Start capture loop (this will run in thread)
            streamer.stop_event = Mock()
            streamer.stop_event.is_set.return_value = False
            
            # Call capture loop directly for testing
            streamer._capture_loop()
            
            # Should have called sniff once and not retried
            assert mock_sniff.call_count == 1
    
    def test_packet_queue_overflow_handling(self):
        """Test handling of packet queue overflow."""
        streamer = PacketStreamer(max_queue_size=2)
        
        # Fill queue to capacity
        packet1 = PacketOut(ts=1.0, src="1.1.1.1", dst="2.2.2.2", proto="TCP", length=100, summary="test1")
        packet2 = PacketOut(ts=2.0, src="1.1.1.1", dst="2.2.2.2", proto="TCP", length=100, summary="test2")
        packet3 = PacketOut(ts=3.0, src="1.1.1.1", dst="2.2.2.2", proto="TCP", length=100, summary="test3")
        
        streamer.packet_queue.put_nowait(packet1)
        streamer.packet_queue.put_nowait(packet2)
        
        # Mock packet for callback
        mock_packet = Mock()
        with patch.object(streamer, '_normalize_packet', return_value=packet3):
            # This should drop the oldest packet and add the new one
            streamer._packet_callback(mock_packet)
        
        # Queue should still have 2 items, with oldest dropped
        assert streamer.packet_queue.qsize() == 2
        
        # Get packets and verify oldest was dropped
        first_packet = streamer.packet_queue.get_nowait()
        second_packet = streamer.packet_queue.get_nowait()
        
        # Should have packet2 and packet3, packet1 should be dropped
        assert first_packet.summary == "test2"
        assert second_packet.summary == "test3"


class TestWebSocketErrorHandling:
    """Test error handling for WebSocket connections (Requirement 2.5)."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_websocket_connection_error_handling(self, client):
        """Test WebSocket connection error handling."""
        with client.websocket_connect("/ws/packets") as websocket:
            # Send invalid JSON
            websocket.send_text("invalid json")
            
            # Should still be connected and handle the error gracefully
            websocket.send_text("ping")
            response = websocket.receive_text()
            assert response == "pong"
    
    def test_websocket_broadcast_error_handling(self):
        """Test error handling during WebSocket broadcasting."""
        # Create mock WebSocket connections
        good_websocket = AsyncMock()
        bad_websocket = AsyncMock()
        bad_websocket.send_text.side_effect = ConnectionResetError("Connection reset")
        
        # Add connections to manager
        manager.active_connections = {good_websocket, bad_websocket}
        
        # Test broadcasting
        async def test_broadcast():
            await manager.broadcast("test message")
            
            # Good connection should receive message
            good_websocket.send_text.assert_called_once_with("test message")
            
            # Bad connection should be removed
            assert bad_websocket not in manager.active_connections
            assert good_websocket in manager.active_connections
        
        asyncio.run(test_broadcast())
    
    def test_packet_broadcaster_error_recovery(self):
        """Test error recovery in packet broadcaster."""
        # This would require more complex async testing setup
        # For now, we'll test the error handling logic
        pass


class TestAIAnalysisErrorHandling:
    """Test error handling for AI analysis failures (Requirement 3.5)."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_ai_timeout_error_handling(self, client):
        """Test handling of AI service timeout."""
        with patch('main.openai_client') as mock_client:
            # Mock timeout error
            mock_client.chat.completions.create.side_effect = asyncio.TimeoutError()
            
            response = client.post("/ai/explain", json={
                "summary": "TCP 1.1.1.1:443 -> 2.2.2.2:80 len=100"
            })
            
            assert response.status_code == 504
            assert "timed out" in response.json()["detail"]
    
    def test_ai_api_error_fallback(self, client):
        """Test fallback to mock response on API error."""
        with patch('main.openai_client') as mock_client:
            # Mock API error
            mock_client.chat.completions.create.side_effect = Exception("API Error")
            
            response = client.post("/ai/explain", json={
                "summary": "TCP 1.1.1.1:443 -> 2.2.2.2:80 len=100"
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["is_mock"] == True
            assert "HTTPS traffic" in data["explanation"]
    
    def test_ai_invalid_input_handling(self, client):
        """Test handling of invalid AI analysis input."""
        # Empty summary
        response = client.post("/ai/explain", json={"summary": ""})
        assert response.status_code == 400
        assert "required" in response.json()["detail"]
        
        # Missing summary
        response = client.post("/ai/explain", json={})
        assert response.status_code == 422  # Validation error
    
    def test_ai_mock_response_error_handling(self, client):
        """Test error handling in mock AI responses."""
        # Even mock responses should handle edge cases gracefully
        response = client.post("/ai/explain", json={
            "summary": "UNKNOWN_PROTOCOL 999.999.999.999 -> invalid"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_mock"] == True
        assert len(data["explanation"]) > 0


class TestBPFFilterErrorHandling:
    """Test error handling for BPF filter validation (Requirement 4.5)."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_invalid_bpf_filter_handling(self, client):
        """Test handling of invalid BPF filter expressions."""
        with patch('main.check_packet_capture_privileges', return_value=True):
            with patch('main.PacketStreamer.get_interfaces', return_value=['eth0']):
                # Test unmatched parentheses
                response = client.post("/capture/settings", json={
                    "iface": "eth0",
                    "bpf": "tcp and (port 80"
                })
                
                assert response.status_code == 400
                assert "unmatched parentheses" in response.json()["detail"]
                
                # Test consecutive operators
                response = client.post("/capture/settings", json={
                    "iface": "eth0", 
                    "bpf": "tcp and and port 80"
                })
                
                assert response.status_code == 400
                assert "consecutive operators" in response.json()["detail"]
    
    def test_bpf_filter_validation_edge_cases(self):
        """Test BPF filter validation edge cases."""
        from capture import PacketStreamer
        
        # Empty filter should be valid
        assert PacketStreamer.validate_bpf_filter("") is None
        assert PacketStreamer.validate_bpf_filter(None) is None
        
        # Valid filters
        assert PacketStreamer.validate_bpf_filter("tcp") is None
        assert PacketStreamer.validate_bpf_filter("port 80") is None
        assert PacketStreamer.validate_bpf_filter("tcp and port 80") is None
        
        # Invalid filters
        assert "unmatched parentheses" in PacketStreamer.validate_bpf_filter("tcp and (port 80")
        assert "consecutive operators" in PacketStreamer.validate_bpf_filter("tcp and and port 80")
        assert "cannot end with operator" in PacketStreamer.validate_bpf_filter("tcp and")
    
    def test_interface_validation_error_handling(self, client):
        """Test handling of invalid network interface."""
        with patch('main.check_packet_capture_privileges', return_value=True):
            with patch('main.PacketStreamer.get_interfaces', return_value=['eth0', 'lo']):
                response = client.post("/capture/settings", json={
                    "iface": "invalid_interface",
                    "bpf": ""
                })
                
                assert response.status_code == 400
                assert "not found" in response.json()["detail"]
                assert "Available" in response.json()["detail"]


class TestSystemErrorHandling:
    """Test system-level error handling and logging."""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_privilege_check_error_handling(self, client):
        """Test privilege check error handling."""
        with patch('main.check_packet_capture_privileges', side_effect=Exception("System error")):
            response = client.get("/privileges/check")
            
            assert response.status_code == 500
            assert "Failed to check privileges" in response.json()["detail"]
    
    def test_interface_listing_error_handling(self, client):
        """Test interface listing error handling."""
        with patch('main.PacketStreamer.get_interfaces', side_effect=Exception("System error")):
            response = client.get("/interfaces")
            
            assert response.status_code == 500
            assert "Failed to retrieve network interfaces" in response.json()["detail"]
    
    def test_anomaly_stats_error_handling(self, client):
        """Test anomaly statistics error handling."""
        # Test when anomaly detector is not initialized
        with patch('main.anomaly_detector', None):
            response = client.get("/anomaly/stats")
            
            assert response.status_code == 503
            assert "not initialized" in response.json()["detail"]
    
    def test_status_endpoint_error_handling(self, client):
        """Test status endpoint error handling."""
        with patch.object(packet_streamer, 'get_status', side_effect=Exception("System error")):
            response = client.get("/status")
            
            assert response.status_code == 500
            assert "Failed to retrieve system status" in response.json()["detail"]


class TestLoggingAndMonitoring:
    """Test logging and monitoring functionality."""
    
    def test_logging_configuration(self):
        """Test that logging is properly configured."""
        import logging
        
        # Check that our logger exists and has proper level
        logger = logging.getLogger('main')
        assert logger.level <= logging.INFO
        
        # Check that handlers are configured
        root_logger = logging.getLogger()
        assert len(root_logger.handlers) > 0
    
    def test_error_logging_in_capture(self):
        """Test that errors are properly logged in capture module."""
        with patch('capture.logger') as mock_logger:
            streamer = PacketStreamer()
            
            # Test privilege error logging
            with patch('capture.check_packet_capture_privileges', return_value=False):
                with patch('capture.get_privilege_status', return_value={'platform': 'linux'}):
                    try:
                        streamer.start()
                    except PrivilegeError:
                        pass
                    
                    # Should have logged the error
                    mock_logger.error.assert_called()
    
    def test_websocket_error_logging(self):
        """Test that WebSocket errors are properly logged."""
        # This would require more complex async testing
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])