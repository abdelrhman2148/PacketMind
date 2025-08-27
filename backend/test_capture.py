"""
Unit tests for packet capture engine.
Tests packet normalization with various protocol types as per requirements.
"""

import pytest
import time
import threading
from unittest.mock import Mock, patch, MagicMock
from scapy.all import IP, IPv6, TCP, UDP, ICMP, Ether
from scapy.layers.inet6 import ICMPv6EchoRequest

from capture import PacketStreamer
from models import PacketOut


class TestPacketStreamer:
    """Test cases for PacketStreamer class."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.streamer = PacketStreamer(max_queue_size=10)
    
    def teardown_method(self):
        """Cleanup after tests."""
        if self.streamer.is_running:
            self.streamer.stop()
    
    def test_init(self):
        """Test PacketStreamer initialization."""
        assert self.streamer.max_queue_size == 10
        assert not self.streamer.is_running
        assert self.streamer.current_interface is None
        assert self.streamer.current_bpf is None
        assert self.streamer.packet_queue.qsize() == 0
    
    @patch('capture.get_if_list')
    def test_start_success(self, mock_get_if_list):
        """Test successful packet capture start."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        
        with patch.object(self.streamer, '_capture_loop'):
            result = self.streamer.start(interface='eth0', bpf_filter='tcp')
            
            assert result is True
            assert self.streamer.is_running is True
            assert self.streamer.current_interface == 'eth0'
            assert self.streamer.current_bpf == 'tcp'
    
    @patch('capture.get_if_list')
    def test_start_invalid_interface(self, mock_get_if_list):
        """Test start with invalid interface."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        
        result = self.streamer.start(interface='invalid')
        
        assert result is False
        assert self.streamer.is_running is False
    
    def test_start_already_running(self):
        """Test start when already running."""
        self.streamer.is_running = True
        
        result = self.streamer.start()
        
        assert result is False
    
    def test_stop_success(self):
        """Test successful packet capture stop."""
        # Mock running state
        self.streamer.is_running = True
        self.streamer.current_interface = 'eth0'
        mock_thread = Mock()
        mock_thread.is_alive.return_value = False
        self.streamer.capture_thread = mock_thread
        
        result = self.streamer.stop()
        
        assert result is True
        assert self.streamer.is_running is False
        assert self.streamer.current_interface is None
    
    def test_stop_not_running(self):
        """Test stop when not running."""
        result = self.streamer.stop()
        assert result is True
    
    @patch.object(PacketStreamer, 'stop')
    @patch.object(PacketStreamer, 'start')
    def test_restart(self, mock_start, mock_stop):
        """Test packet capture restart."""
        mock_stop.return_value = True
        mock_start.return_value = True
        
        result = self.streamer.restart('eth0', 'udp')
        
        assert result is True
        mock_stop.assert_called_once()
        mock_start.assert_called_once_with('eth0', 'udp')
    
    def test_get_packet_timeout(self):
        """Test get_packet with timeout."""
        result = self.streamer.get_packet(timeout=0.1)
        assert result is None
    
    def test_get_packet_success(self):
        """Test get_packet with available packet."""
        test_packet = PacketOut(
            ts=time.time(),
            src="192.168.1.1",
            dst="192.168.1.2",
            proto="TCP",
            length=100,
            sport=80,
            dport=443,
            summary="TCP 192.168.1.1:80 -> 192.168.1.2:443 len=100"
        )
        
        self.streamer.packet_queue.put(test_packet)
        result = self.streamer.get_packet(timeout=0.1)
        
        assert result == test_packet
    
    def test_get_status(self):
        """Test get_status method."""
        self.streamer.is_running = True
        self.streamer.current_interface = 'eth0'
        self.streamer.current_bpf = 'tcp'
        
        status = self.streamer.get_status()
        
        assert status['is_running'] is True
        assert status['interface'] == 'eth0'
        assert status['bpf_filter'] == 'tcp'
        assert status['queue_size'] == 0
        assert status['max_queue_size'] == 10
    
    @patch('capture.get_if_list')
    def test_get_interfaces(self, mock_get_if_list):
        """Test get_interfaces static method."""
        mock_get_if_list.return_value = ['eth0', 'lo', 'wlan0']
        
        interfaces = PacketStreamer.get_interfaces()
        
        assert interfaces == ['eth0', 'lo', 'wlan0']
    
    @patch('capture.get_if_list')
    def test_get_interfaces_error(self, mock_get_if_list):
        """Test get_interfaces with error."""
        mock_get_if_list.side_effect = Exception("Network error")
        
        interfaces = PacketStreamer.get_interfaces()
        
        assert interfaces == []


class TestPacketNormalization:
    """Test cases for packet normalization functionality."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.streamer = PacketStreamer()
    
    def test_normalize_ipv4_tcp_packet(self):
        """Test normalization of IPv4 TCP packet."""
        # Create test packet
        packet = Ether() / IP(src="192.168.1.1", dst="10.0.0.1") / TCP(sport=80, dport=443)
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is not None
        assert result.src == "192.168.1.1"
        assert result.dst == "10.0.0.1"
        assert result.proto == "TCP"
        assert result.sport == 80
        assert result.dport == 443
        assert result.length == len(packet)
        assert "TCP 192.168.1.1:80 -> 10.0.0.1:443" in result.summary
    
    def test_normalize_ipv4_udp_packet(self):
        """Test normalization of IPv4 UDP packet."""
        packet = Ether() / IP(src="8.8.8.8", dst="192.168.1.100") / UDP(sport=53, dport=12345)
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is not None
        assert result.src == "8.8.8.8"
        assert result.dst == "192.168.1.100"
        assert result.proto == "UDP"
        assert result.sport == 53
        assert result.dport == 12345
        assert "UDP 8.8.8.8:53 -> 192.168.1.100:12345" in result.summary
    
    def test_normalize_ipv4_icmp_packet(self):
        """Test normalization of IPv4 ICMP packet."""
        packet = Ether() / IP(src="192.168.1.1", dst="8.8.8.8") / ICMP()
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is not None
        assert result.src == "192.168.1.1"
        assert result.dst == "8.8.8.8"
        assert result.proto == "ICMP"
        assert result.sport is None
        assert result.dport is None
        assert "ICMP 192.168.1.1 -> 8.8.8.8" in result.summary
    
    def test_normalize_ipv6_tcp_packet(self):
        """Test normalization of IPv6 TCP packet."""
        packet = Ether() / IPv6(src="2001:db8::1", dst="2001:db8::2") / TCP(sport=443, dport=80)
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is not None
        assert result.src == "2001:db8::1"
        assert result.dst == "2001:db8::2"
        assert result.proto == "TCP"
        assert result.sport == 443
        assert result.dport == 80
        assert "TCP 2001:db8::1:443 -> 2001:db8::2:80" in result.summary
    
    def test_normalize_ipv6_udp_packet(self):
        """Test normalization of IPv6 UDP packet."""
        packet = Ether() / IPv6(src="::1", dst="2001:db8::1") / UDP(sport=1234, dport=5678)
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is not None
        assert result.src == "::1"
        assert result.dst == "2001:db8::1"
        assert result.proto == "UDP"
        assert result.sport == 1234
        assert result.dport == 5678
    
    def test_normalize_ipv6_icmp_packet(self):
        """Test normalization of IPv6 ICMPv6 packet."""
        packet = Ether() / IPv6(src="::1", dst="2001:db8::1") / ICMPv6EchoRequest()
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is not None
        assert result.src == "::1"
        assert result.dst == "2001:db8::1"
        assert result.proto == "ICMPv6"
        assert result.sport is None
        assert result.dport is None
    
    def test_normalize_unknown_protocol(self):
        """Test normalization of packet with unknown protocol."""
        # Create IP packet with custom protocol number
        packet = Ether() / IP(src="1.1.1.1", dst="2.2.2.2", proto=99)
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is not None
        assert result.src == "1.1.1.1"
        assert result.dst == "2.2.2.2"
        assert result.proto == "IP(99)"
    
    def test_normalize_non_ip_packet(self):
        """Test normalization of non-IP packet (should return None)."""
        packet = Ether()  # Just Ethernet frame, no IP
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is None
    
    def test_normalize_packet_error_handling(self):
        """Test error handling in packet normalization."""
        # Create malformed packet that might cause errors
        packet = Mock()
        packet.haslayer.side_effect = Exception("Packet error")
        
        result = self.streamer._normalize_packet(packet)
        
        assert result is None
    
    def test_generate_summary_with_ports(self):
        """Test summary generation with port information."""
        summary = self.streamer._generate_summary(
            "192.168.1.1", "10.0.0.1", "TCP", 80, 443, 1500
        )
        
        assert summary == "TCP 192.168.1.1:80 -> 10.0.0.1:443 len=1500"
    
    def test_generate_summary_without_ports(self):
        """Test summary generation without port information."""
        summary = self.streamer._generate_summary(
            "192.168.1.1", "8.8.8.8", "ICMP", None, None, 64
        )
        
        assert summary == "ICMP 192.168.1.1 -> 8.8.8.8 len=64"


class TestPacketCallback:
    """Test cases for packet callback functionality."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.streamer = PacketStreamer(max_queue_size=2)
    
    def test_packet_callback_success(self):
        """Test successful packet callback processing."""
        packet = Ether() / IP(src="1.1.1.1", dst="2.2.2.2") / TCP(sport=80, dport=443)
        
        self.streamer._packet_callback(packet)
        
        assert self.streamer.packet_queue.qsize() == 1
        result = self.streamer.packet_queue.get_nowait()
        assert result.src == "1.1.1.1"
        assert result.dst == "2.2.2.2"
    
    def test_packet_callback_queue_full(self):
        """Test packet callback with full queue (should drop oldest)."""
        # Fill queue to capacity
        packet1 = Ether() / IP(src="1.1.1.1", dst="2.2.2.2") / TCP(sport=80, dport=443)
        packet2 = Ether() / IP(src="3.3.3.3", dst="4.4.4.4") / TCP(sport=80, dport=443)
        packet3 = Ether() / IP(src="5.5.5.5", dst="6.6.6.6") / TCP(sport=80, dport=443)
        
        self.streamer._packet_callback(packet1)
        self.streamer._packet_callback(packet2)
        assert self.streamer.packet_queue.qsize() == 2
        
        # This should drop the oldest packet
        self.streamer._packet_callback(packet3)
        assert self.streamer.packet_queue.qsize() == 2
        
        # First packet should be the second one we added (first was dropped)
        result = self.streamer.packet_queue.get_nowait()
        assert result.src == "3.3.3.3"
    
    def test_packet_callback_normalization_error(self):
        """Test packet callback with normalization error."""
        # Mock _normalize_packet to raise exception
        with patch.object(self.streamer, '_normalize_packet', side_effect=Exception("Test error")):
            packet = Ether() / IP(src="1.1.1.1", dst="2.2.2.2")
            
            # Should not raise exception, just log error
            self.streamer._packet_callback(packet)
            
            assert self.streamer.packet_queue.qsize() == 0
    
    def test_packet_callback_none_result(self):
        """Test packet callback when normalization returns None."""
        with patch.object(self.streamer, '_normalize_packet', return_value=None):
            packet = Ether()
            
            self.streamer._packet_callback(packet)
            
            assert self.streamer.packet_queue.qsize() == 0


class TestBPFValidation:
    """Test cases for BPF filter validation functionality."""
    
    def test_validate_bpf_filter_valid_filters(self):
        """Test validation of valid BPF filters."""
        valid_filters = [
            "tcp",
            "udp",
            "icmp",
            "port 80",
            "host 192.168.1.1",
            "tcp and port 443",
            "udp or icmp",
            "src host 10.0.0.1",
            "dst port 53",
            "tcp port 80 or tcp port 443"
        ]
        
        for filter_expr in valid_filters:
            result = PacketStreamer.validate_bpf_filter(filter_expr)
            assert result is None, f"Filter '{filter_expr}' should be valid but got error: {result}"
    
    def test_validate_bpf_filter_invalid_filters(self):
        """Test validation of invalid BPF filters."""
        invalid_filters = [
            "tcp and and port 80",  # consecutive operators
            "port 80 and",          # ending with operator
            "((tcp)",               # unmatched parentheses
            "tcp))",                # unmatched closing parenthesis
        ]
        
        for filter_expr in invalid_filters:
            result = PacketStreamer.validate_bpf_filter(filter_expr)
            assert result is not None, f"Filter '{filter_expr}' should be invalid but validation passed"
            assert isinstance(result, str), "Error message should be a string"
    
    def test_validate_bpf_filter_empty(self):
        """Test validation of empty/None BPF filters."""
        assert PacketStreamer.validate_bpf_filter("") is None
        assert PacketStreamer.validate_bpf_filter("   ") is None
        assert PacketStreamer.validate_bpf_filter(None) is None
    
    def test_validate_bpf_filter_exception_handling(self):
        """Test BPF validation exception handling."""
        # Test with a filter that might cause internal errors
        # For now, our basic validation shouldn't throw exceptions
        result = PacketStreamer.validate_bpf_filter("tcp port 80")
        assert result is None  # Should be valid
        
        # Test edge case that might cause issues
        result = PacketStreamer.validate_bpf_filter("tcp and or udp")
        assert result is not None  # Should catch consecutive operators


class TestEnhancedRestart:
    """Test cases for enhanced restart functionality."""
    
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
    def test_restart_success(self, mock_start, mock_stop, mock_validate, mock_get_if_list):
        """Test successful restart with new settings."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        mock_validate.return_value = None  # Valid filter
        mock_stop.return_value = True
        mock_start.return_value = True
        
        result = self.streamer.restart('eth0', 'tcp port 80')
        
        assert result is True
        mock_validate.assert_called_once_with('tcp port 80')
        mock_stop.assert_called_once()
        mock_start.assert_called_once_with('eth0', 'tcp port 80')
    
    @patch('capture.get_if_list')
    def test_restart_invalid_interface(self, mock_get_if_list):
        """Test restart with invalid interface."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        
        result = self.streamer.restart('invalid_interface', None)
        
        assert result is False
    
    @patch('capture.get_if_list')
    @patch.object(PacketStreamer, 'validate_bpf_filter')
    def test_restart_invalid_bpf_filter(self, mock_validate, mock_get_if_list):
        """Test restart with invalid BPF filter."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        mock_validate.return_value = "Invalid filter syntax"
        
        result = self.streamer.restart('eth0', 'invalid filter')
        
        assert result is False
        mock_validate.assert_called_once_with('invalid filter')
    
    @patch('capture.get_if_list')
    @patch.object(PacketStreamer, 'validate_bpf_filter')
    @patch.object(PacketStreamer, 'stop')
    @patch.object(PacketStreamer, 'start')
    def test_restart_stop_failure(self, mock_start, mock_stop, mock_validate, mock_get_if_list):
        """Test restart when stop fails."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        mock_validate.return_value = None
        mock_stop.return_value = False
        
        result = self.streamer.restart('eth0', 'tcp')
        
        assert result is False
        mock_stop.assert_called_once()
        mock_start.assert_not_called()
    
    @patch('capture.get_if_list')
    @patch.object(PacketStreamer, 'validate_bpf_filter')
    @patch.object(PacketStreamer, 'stop')
    @patch.object(PacketStreamer, 'start')
    def test_restart_start_failure_with_rollback(self, mock_start, mock_stop, mock_validate, mock_get_if_list):
        """Test restart with start failure and successful rollback."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        mock_validate.return_value = None
        mock_stop.return_value = True
        
        # Set up initial state
        self.streamer.current_interface = 'lo'
        self.streamer.current_bpf = 'udp'
        self.streamer.is_running = True
        
        # First start call (new settings) fails, second call (rollback) succeeds
        mock_start.side_effect = [False, True]
        
        result = self.streamer.restart('eth0', 'tcp')
        
        assert result is False
        assert mock_start.call_count == 2
        # First call with new settings
        mock_start.assert_any_call('eth0', 'tcp')
        # Second call with rollback settings
        mock_start.assert_any_call('lo', 'udp')
    
    @patch('capture.get_if_list')
    @patch.object(PacketStreamer, 'validate_bpf_filter')
    @patch.object(PacketStreamer, 'stop')
    @patch.object(PacketStreamer, 'start')
    def test_restart_start_failure_rollback_failure(self, mock_start, mock_stop, mock_validate, mock_get_if_list):
        """Test restart with start failure and rollback failure."""
        mock_get_if_list.return_value = ['eth0', 'lo']
        mock_validate.return_value = None
        mock_stop.return_value = True
        
        # Set up initial state
        self.streamer.current_interface = 'lo'
        self.streamer.current_bpf = 'udp'
        self.streamer.is_running = True
        
        # Both start calls fail
        mock_start.return_value = False
        
        result = self.streamer.restart('eth0', 'tcp')
        
        assert result is False
        assert mock_start.call_count == 2


if __name__ == "__main__":
    pytest.main([__file__])