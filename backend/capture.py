"""
Packet capture engine using Scapy for network packet sniffing.
Implements PacketStreamer class with thread-safe queue communication.
Based on requirements 1.1, 1.2, 1.3, 1.4 for packet capture and normalization.
"""

import time
import threading
import queue
import logging
from typing import Optional, Callable, Dict, Any
from scapy.all import sniff, get_if_list, Packet
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.inet6 import IPv6
from models import PacketOut

logger = logging.getLogger(__name__)


class PacketStreamer:
    """
    Thread-safe packet capture engine using Scapy.
    Captures packets in background thread and provides normalized packet data
    through a queue for async components.
    """
    
    def __init__(self, max_queue_size: int = 1000):
        """
        Initialize PacketStreamer.
        
        Args:
            max_queue_size: Maximum number of packets to buffer in queue
        """
        self.max_queue_size = max_queue_size
        self.packet_queue = queue.Queue(maxsize=max_queue_size)
        self.capture_thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()
        self.current_interface: Optional[str] = None
        self.current_bpf: Optional[str] = None
        self.is_running = False
        self._lock = threading.Lock()
        
    def start(self, interface: str = None, bpf_filter: str = None) -> bool:
        """
        Start packet capture in background thread.
        
        Args:
            interface: Network interface to capture on (None for default)
            bpf_filter: Berkeley Packet Filter expression
            
        Returns:
            bool: True if capture started successfully, False otherwise
        """
        with self._lock:
            if self.is_running:
                logger.warning("Packet capture already running")
                return False
                
            try:
                # Validate interface if specified
                if interface and interface not in get_if_list():
                    logger.error(f"Interface {interface} not found")
                    return False
                    
                self.current_interface = interface
                self.current_bpf = bpf_filter
                self.stop_event.clear()
                
                # Start capture thread
                self.capture_thread = threading.Thread(
                    target=self._capture_loop,
                    daemon=True
                )
                self.capture_thread.start()
                self.is_running = True
                
                logger.info(f"Started packet capture on interface {interface or 'default'}")
                return True
                
            except Exception as e:
                logger.error(f"Failed to start packet capture: {e}")
                return False
    
    def stop(self) -> bool:
        """
        Stop packet capture and cleanup resources.
        
        Returns:
            bool: True if stopped successfully, False otherwise
        """
        with self._lock:
            if not self.is_running:
                return True
                
            try:
                self.stop_event.set()
                
                if self.capture_thread and self.capture_thread.is_alive():
                    self.capture_thread.join(timeout=5.0)
                    
                self.is_running = False
                self.current_interface = None
                self.current_bpf = None
                
                logger.info("Stopped packet capture")
                return True
                
            except Exception as e:
                logger.error(f"Error stopping packet capture: {e}")
                return False
    
    def restart(self, interface: str = None, bpf_filter: str = None) -> bool:
        """
        Restart packet capture with new settings.
        
        Args:
            interface: Network interface to capture on
            bpf_filter: Berkeley Packet Filter expression
            
        Returns:
            bool: True if restarted successfully, False otherwise
        """
        logger.info(f"Restarting capture with interface={interface}, filter={bpf_filter}")
        
        if not self.stop():
            return False
            
        # Brief pause to ensure cleanup
        time.sleep(0.1)
        
        return self.start(interface, bpf_filter)
    
    def get_packet(self, timeout: float = 1.0) -> Optional[PacketOut]:
        """
        Get next normalized packet from queue.
        
        Args:
            timeout: Maximum time to wait for packet
            
        Returns:
            PacketOut: Normalized packet data or None if timeout
        """
        try:
            return self.packet_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current capture status information.
        
        Returns:
            dict: Status information including interface, filter, queue size
        """
        return {
            "is_running": self.is_running,
            "interface": self.current_interface,
            "bpf_filter": self.current_bpf,
            "queue_size": self.packet_queue.qsize(),
            "max_queue_size": self.max_queue_size
        }
    
    @staticmethod
    def get_interfaces() -> list[str]:
        """
        Get list of available network interfaces.
        
        Returns:
            list: Available interface names
        """
        try:
            return get_if_list()
        except Exception as e:
            logger.error(f"Failed to get interface list: {e}")
            return []
    
    def _capture_loop(self):
        """
        Main packet capture loop running in background thread.
        Uses Scapy sniff with packet callback for processing.
        """
        try:
            logger.info(f"Starting capture loop on {self.current_interface or 'default'}")
            
            # Configure sniff parameters
            sniff_kwargs = {
                "prn": self._packet_callback,
                "stop_filter": lambda p: self.stop_event.is_set(),
                "store": False,  # Don't store packets in memory
            }
            
            if self.current_interface:
                sniff_kwargs["iface"] = self.current_interface
            if self.current_bpf:
                sniff_kwargs["filter"] = self.current_bpf
                
            # Start sniffing
            sniff(**sniff_kwargs)
            
        except Exception as e:
            logger.error(f"Capture loop error: {e}")
        finally:
            logger.info("Capture loop ended")
    
    def _packet_callback(self, packet: Packet):
        """
        Process captured packet and add to queue.
        
        Args:
            packet: Raw Scapy packet object
        """
        try:
            normalized_packet = self._normalize_packet(packet)
            if normalized_packet:
                # Add to queue, drop oldest if full
                try:
                    self.packet_queue.put_nowait(normalized_packet)
                except queue.Full:
                    # Remove oldest packet and add new one
                    try:
                        self.packet_queue.get_nowait()
                        self.packet_queue.put_nowait(normalized_packet)
                    except queue.Empty:
                        pass  # Queue was emptied by another thread
                        
        except Exception as e:
            logger.error(f"Error processing packet: {e}")
    
    def _normalize_packet(self, packet: Packet) -> Optional[PacketOut]:
        """
        Normalize Scapy packet to standardized format.
        Handles IPv4/IPv6, TCP/UDP protocols as per requirements 1.2, 1.3.
        
        Args:
            packet: Raw Scapy packet
            
        Returns:
            PacketOut: Normalized packet data or None if unsupported
        """
        try:
            # Extract timestamp
            timestamp = time.time()
            
            # Initialize packet data
            src_ip = None
            dst_ip = None
            protocol = "Unknown"
            src_port = None
            dst_port = None
            length = len(packet)
            
            # Handle IPv4 packets
            if packet.haslayer(IP):
                ip_layer = packet[IP]
                src_ip = ip_layer.src
                dst_ip = ip_layer.dst
                protocol = ip_layer.proto
                
                # Convert protocol number to name
                if protocol == 6:
                    protocol = "TCP"
                elif protocol == 17:
                    protocol = "UDP"
                elif protocol == 1:
                    protocol = "ICMP"
                else:
                    protocol = f"IP({protocol})"
            
            # Handle IPv6 packets
            elif packet.haslayer(IPv6):
                ipv6_layer = packet[IPv6]
                src_ip = ipv6_layer.src
                dst_ip = ipv6_layer.dst
                protocol = ipv6_layer.nh
                
                # Convert protocol number to name
                if protocol == 6:
                    protocol = "TCP"
                elif protocol == 17:
                    protocol = "UDP"
                elif protocol == 58:
                    protocol = "ICMPv6"
                else:
                    protocol = f"IPv6({protocol})"
            
            # Skip packets without IP layer
            if not src_ip or not dst_ip:
                return None
            
            # Extract port information for TCP/UDP
            if packet.haslayer(TCP):
                tcp_layer = packet[TCP]
                src_port = tcp_layer.sport
                dst_port = tcp_layer.dport
                protocol = "TCP"
            elif packet.haslayer(UDP):
                udp_layer = packet[UDP]
                src_port = udp_layer.sport
                dst_port = udp_layer.dport
                protocol = "UDP"
            
            # Generate summary
            summary = self._generate_summary(
                src_ip, dst_ip, protocol, src_port, dst_port, length
            )
            
            return PacketOut(
                ts=timestamp,
                src=src_ip,
                dst=dst_ip,
                proto=protocol,
                length=length,
                sport=src_port,
                dport=dst_port,
                summary=summary
            )
            
        except Exception as e:
            logger.error(f"Error normalizing packet: {e}")
            return None
    
    def _generate_summary(self, src: str, dst: str, proto: str, 
                         sport: Optional[int], dport: Optional[int], 
                         length: int) -> str:
        """
        Generate human-readable packet summary.
        
        Args:
            src: Source IP address
            dst: Destination IP address
            proto: Protocol name
            sport: Source port (optional)
            dport: Destination port (optional)
            length: Packet length
            
        Returns:
            str: Human-readable summary
        """
        if sport and dport:
            return f"{proto} {src}:{sport} -> {dst}:{dport} len={length}"
        else:
            return f"{proto} {src} -> {dst} len={length}"