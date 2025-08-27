"""
Pydantic models for packet data and API requests.
Defines the data structures used throughout the Wireshark+ Web application.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Union
from datetime import datetime


class PacketOut(BaseModel):
    """
    Standardized packet representation for API responses and WebSocket streaming.
    Based on requirements 1.2, 1.3 for packet normalization.
    """
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.timestamp()
        }
    )
    
    ts: float = Field(..., description="Unix timestamp when packet was captured")
    src: str = Field(..., description="Source IP address (IPv4 or IPv6)")
    dst: str = Field(..., description="Destination IP address (IPv4 or IPv6)")
    proto: str = Field(..., description="Protocol (TCP, UDP, ICMP, etc.)")
    length: int = Field(..., description="Packet length in bytes")
    sport: Optional[int] = Field(None, description="Source port (TCP/UDP only)")
    dport: Optional[int] = Field(None, description="Destination port (TCP/UDP only)")
    summary: str = Field(..., description="Human-readable packet summary")


class ExplainIn(BaseModel):
    """
    Request model for AI packet analysis endpoint.
    Based on requirement 3.2 for AI analysis requests.
    """
    summary: str = Field(..., description="Packet summary to be analyzed by AI")
    context: Optional[str] = Field(None, description="Additional context for analysis")


class ExplainOut(BaseModel):
    """
    Response model for AI packet analysis.
    Based on requirement 3.3 for AI analysis responses.
    """
    explanation: str = Field(..., description="AI-generated explanation of the packet")
    is_mock: bool = Field(False, description="Whether this is a mock response")


class CaptureSettings(BaseModel):
    """
    Configuration model for packet capture settings.
    Based on requirements 4.2, 4.3 for interface and filter management.
    """
    iface: str = Field(..., description="Network interface name")
    bpf: Optional[str] = Field(None, description="Berkeley Packet Filter expression")


class NetworkInterface(BaseModel):
    """
    Model representing an available network interface.
    Based on requirement 4.1 for interface listing.
    """
    name: str = Field(..., description="Interface name (e.g., eth0, wlan0)")
    description: Optional[str] = Field(None, description="Human-readable interface description")
    is_up: bool = Field(..., description="Whether the interface is currently up")


class AnomalyAlert(BaseModel):
    """
    Model for anomaly detection alerts.
    Based on requirements 5.3, 5.4 for alert generation and broadcasting.
    """
    type: str = Field(default="alert", description="Message type identifier")
    level: str = Field(..., description="Alert level (info, warning, critical)")
    message: str = Field(..., description="Human-readable alert message")
    timestamp: float = Field(..., description="Unix timestamp when alert was generated")
    meta: dict = Field(default_factory=dict, description="Additional alert metadata")


class SystemStatus(BaseModel):
    """
    Model for system status information.
    Used for health checks and system monitoring.
    """
    status: str = Field(..., description="System status (healthy, degraded, error)")
    capture_active: bool = Field(..., description="Whether packet capture is active")
    current_interface: Optional[str] = Field(None, description="Currently active interface")
    current_filter: Optional[str] = Field(None, description="Currently active BPF filter")
    connected_clients: int = Field(0, description="Number of connected WebSocket clients")