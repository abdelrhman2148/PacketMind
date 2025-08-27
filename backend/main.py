"""
FastAPI main application with WebSocket streaming for real-time packet data.
Implements requirements 2.1, 2.2, 2.3, 2.4, 2.5 for WebSocket packet streaming.
"""

import asyncio
import json
import logging
import time
from typing import List, Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import PacketOut, NetworkInterface, SystemStatus, CaptureSettings
from capture import PacketStreamer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global packet streamer instance
packet_streamer = PacketStreamer()

# WebSocket connection manager
class ConnectionManager:
    """
    Manages WebSocket connections for packet broadcasting.
    Implements requirements 2.2, 2.4 for client management and cleanup.
    """
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection and add to active list."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")
    
    async def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection from active list."""
        async with self._lock:
            self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: str):
        """
        Broadcast message to all connected clients.
        Automatically removes disconnected clients.
        """
        if not self.active_connections:
            return
            
        # Create copy of connections to avoid modification during iteration
        async with self._lock:
            connections = self.active_connections.copy()
        
        disconnected = set()
        
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.add(connection)
        
        # Remove disconnected clients
        if disconnected:
            async with self._lock:
                self.active_connections -= disconnected
            logger.info(f"Removed {len(disconnected)} disconnected clients")
    
    def get_connection_count(self) -> int:
        """Get current number of active connections."""
        return len(self.active_connections)

# Global connection manager
manager = ConnectionManager()

# Background task for packet broadcasting
async def packet_broadcaster():
    """
    Background task that reads packets from streamer and broadcasts to clients.
    Implements requirement 2.1 for real-time streaming with <2 second latency.
    """
    logger.info("Starting packet broadcaster")
    
    while True:
        try:
            # Get packet from streamer (non-blocking with short timeout)
            packet = packet_streamer.get_packet(timeout=0.1)
            
            if packet:
                # Convert to JSON and broadcast
                packet_json = packet.model_dump_json()
                await manager.broadcast(packet_json)
            
            # Small delay to prevent CPU spinning
            await asyncio.sleep(0.01)
            
        except Exception as e:
            logger.error(f"Error in packet broadcaster: {e}")
            await asyncio.sleep(1.0)  # Longer delay on error

# Application lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown.
    Starts packet capture and broadcaster on startup.
    """
    # Startup
    logger.info("Starting Wireshark+ Web API")
    
    # Start packet capture on default interface
    if not packet_streamer.start():
        logger.warning("Failed to start packet capture - continuing without capture")
    
    # Start packet broadcaster task
    broadcaster_task = asyncio.create_task(packet_broadcaster())
    
    yield
    
    # Shutdown
    logger.info("Shutting down Wireshark+ Web API")
    
    # Cancel broadcaster task
    broadcaster_task.cancel()
    try:
        await broadcaster_task
    except asyncio.CancelledError:
        pass
    
    # Stop packet capture
    packet_streamer.stop()

# Create FastAPI application
app = FastAPI(
    title="Wireshark+ Web API",
    version="0.1.0",
    description="Real-time network packet analysis with AI-powered insights",
    lifespan=lifespan
)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Wireshark+ Web API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/interfaces", response_model=List[NetworkInterface])
async def get_interfaces():
    """
    Get list of available network interfaces.
    Implements requirement 4.1 for interface listing.
    """
    try:
        interface_names = PacketStreamer.get_interfaces()
        interfaces = []
        
        for name in interface_names:
            # For now, assume all interfaces are up (would need platform-specific code for real status)
            interfaces.append(NetworkInterface(
                name=name,
                description=f"Network interface {name}",
                is_up=True
            ))
        
        return interfaces
        
    except Exception as e:
        logger.error(f"Failed to get interfaces: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve network interfaces")

@app.post("/capture/settings")
async def update_capture_settings(settings: CaptureSettings):
    """
    Update packet capture settings (interface and BPF filter).
    Implements requirements 4.2, 4.3, 4.4 for dynamic configuration.
    """
    try:
        # Validate interface exists
        available_interfaces = PacketStreamer.get_interfaces()
        if settings.iface not in available_interfaces:
            raise HTTPException(
                status_code=400, 
                detail=f"Interface '{settings.iface}' not found. Available: {available_interfaces}"
            )
        
        # Validate BPF filter if provided
        if settings.bpf:
            validation_error = PacketStreamer.validate_bpf_filter(settings.bpf)
            if validation_error:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid BPF filter: {validation_error}"
                )
        
        # Restart capture with new settings
        success = packet_streamer.restart(settings.iface, settings.bpf)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to restart packet capture with new settings"
            )
        
        # Notify connected clients of configuration change
        config_message = {
            "type": "config_change",
            "interface": settings.iface,
            "bpf_filter": settings.bpf or "",
            "timestamp": time.time()
        }
        await manager.broadcast(json.dumps(config_message))
        
        return {
            "status": "success",
            "message": "Capture settings updated successfully",
            "interface": settings.iface,
            "bpf_filter": settings.bpf
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update capture settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update capture settings")

@app.get("/status", response_model=SystemStatus)
async def get_status():
    """Get current system status and capture information."""
    try:
        capture_status = packet_streamer.get_status()
        
        return SystemStatus(
            status="healthy" if capture_status["is_running"] else "degraded",
            capture_active=capture_status["is_running"],
            current_interface=capture_status["interface"],
            current_filter=capture_status["bpf_filter"],
            connected_clients=manager.get_connection_count()
        )
        
    except Exception as e:
        logger.error(f"Failed to get status: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve system status")

@app.websocket("/ws/packets")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time packet streaming.
    Implements requirements 2.1, 2.2, 2.3, 2.5 for WebSocket communication.
    """
    await manager.connect(websocket)
    
    try:
        # Keep connection alive and handle client messages
        while True:
            try:
                # Wait for client message (ping/pong or commands)
                data = await websocket.receive_text()
                
                # Handle ping messages for connection keepalive
                if data == "ping":
                    await websocket.send_text("pong")
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
                
    finally:
        await manager.disconnect(websocket)