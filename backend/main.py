"""
FastAPI main application with WebSocket streaming for real-time packet data.
Implements requirements 2.1, 2.2, 2.3, 2.4, 2.5 for WebSocket packet streaming.
"""

import asyncio
import json
import logging
import os
import time
from typing import List, Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import PacketOut, NetworkInterface, SystemStatus, CaptureSettings, ExplainIn, ExplainOut, AnomalyAlert
from capture import PacketStreamer
from anomaly import AnomalyDetector, AnomalyConfig
from privileges import (
    check_packet_capture_privileges, 
    get_privilege_status, 
    get_setup_instructions,
    PrivilegeError
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AI service configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
USE_MOCK_AI = os.getenv("USE_MOCK_AI", "true").lower() == "true"
AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", "20"))  # 20 second timeout

# Initialize OpenAI client if API key is available
openai_client = None
if OPENAI_API_KEY and not USE_MOCK_AI:
    try:
        import openai
        openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized successfully")
    except ImportError:
        logger.warning("OpenAI package not available, falling back to mock responses")
    except Exception as e:
        logger.warning(f"Failed to initialize OpenAI client: {e}, falling back to mock responses")
else:
    logger.info("Using mock AI responses (no API key provided or USE_MOCK_AI=true)")

# Global packet streamer instance
packet_streamer = PacketStreamer()

# Global anomaly detector instance
anomaly_detector = None

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

# AI Analysis Functions
async def get_mock_ai_explanation(packet_summary: str) -> str:
    """
    Generate mock AI explanation for development purposes.
    Implements requirement 3.4 for mock responses without API keys.
    """
    # Simple pattern matching for common packet types
    summary_lower = packet_summary.lower()
    
    if "tcp" in summary_lower and "443" in packet_summary:
        return ("This appears to be HTTPS traffic on port 443. This is normal encrypted web traffic, "
                "commonly used for secure web browsing. The TCP protocol ensures reliable delivery of data. "
                "No security concerns detected.")
    
    elif "tcp" in summary_lower and "80" in packet_summary:
        return ("This is HTTP traffic on port 80. This is unencrypted web traffic which could potentially "
                "expose sensitive information. Consider using HTTPS (port 443) for better security. "
                "The TCP protocol ensures reliable delivery.")
    
    elif "udp" in summary_lower and "53" in packet_summary:
        return ("This is DNS traffic on port 53 using UDP protocol. DNS queries are used to resolve "
                "domain names to IP addresses. This is normal network behavior, though DNS queries "
                "can sometimes reveal browsing patterns.")
    
    elif "icmp" in summary_lower:
        return ("This is an ICMP packet, commonly used for network diagnostics like ping commands. "
                "ICMP packets are generally harmless but can sometimes be used for network reconnaissance. "
                "Monitor for unusual ICMP patterns.")
    
    elif "udp" in summary_lower:
        return ("This is UDP traffic. UDP is a connectionless protocol often used for streaming, "
                "gaming, or real-time applications. Unlike TCP, UDP doesn't guarantee delivery. "
                "Check the destination port to understand the specific service.")
    
    elif "tcp" in summary_lower:
        return ("This is TCP traffic. TCP is a reliable, connection-oriented protocol used for most "
                "web services and applications. The specific port number can help identify the service. "
                "Generally safe unless communicating with suspicious destinations.")
    
    else:
        return ("This packet uses a protocol that requires further analysis. Check the source and "
                "destination addresses for any suspicious patterns. Monitor for unusual traffic volumes "
                "or connections to unknown hosts. Consider the context of your network environment.")

async def get_openai_explanation(packet_summary: str, context: str = None) -> str:
    """
    Get AI explanation from OpenAI API.
    Implements requirements 3.1, 3.2, 3.3 for OpenAI integration.
    """
    if not openai_client:
        raise HTTPException(status_code=503, detail="OpenAI service not available")
    
    try:
        # Construct the prompt
        prompt = f"""Analyze this network packet and provide a concise, actionable explanation:

Packet Summary: {packet_summary}
{f"Additional Context: {context}" if context else ""}

Please provide:
1. What type of traffic this is
2. Whether it's normal or potentially suspicious
3. Any security implications
4. Brief explanation of the protocol used

Keep the response under 200 words and focus on practical insights for network monitoring."""

        # Make API call with timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(
                openai_client.chat.completions.create,
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a network security expert helping analyze network packets."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.3
            ),
            timeout=AI_TIMEOUT
        )
        
        return response.choices[0].message.content.strip()
        
    except asyncio.TimeoutError:
        logger.error("OpenAI API request timed out")
        raise HTTPException(status_code=504, detail="AI analysis request timed out")
    
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        # Fall back to mock response on API error
        logger.info("Falling back to mock AI response due to API error")
        return await get_mock_ai_explanation(packet_summary)

# Anomaly alert callback
async def handle_anomaly_alert(alert: AnomalyAlert):
    """
    Handle anomaly alerts by broadcasting to connected clients.
    Implements requirement 5.4 for alert broadcasting via WebSocket.
    """
    try:
        alert_json = alert.model_dump_json()
        await manager.broadcast(alert_json)
        logger.info(f"Broadcasted anomaly alert: {alert.message}")
    except Exception as e:
        logger.error(f"Failed to broadcast anomaly alert: {e}")

# Background task for packet broadcasting
async def packet_broadcaster():
    """
    Background task that reads packets from streamer and broadcasts to clients.
    Implements requirement 2.1 for real-time streaming with <2 second latency.
    Also handles anomaly detection per requirements 5.1, 5.2.
    """
    logger.info("Starting packet broadcaster")
    
    while True:
        try:
            # Get packet from streamer (non-blocking with short timeout)
            packet = packet_streamer.get_packet(timeout=0.1)
            
            if packet:
                # Add packet to anomaly detector
                if anomaly_detector:
                    alert = anomaly_detector.add_packet(packet.ts)
                    if alert:
                        await handle_anomaly_alert(alert)
                
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
    Starts packet capture, anomaly detection, and broadcaster on startup.
    """
    global anomaly_detector
    
    # Startup
    logger.info("Starting Wireshark+ Web API")
    
    # Initialize anomaly detector with configuration from environment
    anomaly_config = AnomalyConfig(
        window_size=int(os.getenv("ANOMALY_WINDOW_SIZE", "60")),
        threshold=float(os.getenv("ANOMALY_THRESHOLD", "3.0")),
        min_samples=int(os.getenv("ANOMALY_MIN_SAMPLES", "10")),
        alert_cooldown=int(os.getenv("ANOMALY_ALERT_COOLDOWN", "30"))
    )
    
    # Create anomaly detector (alert callback will be handled in broadcaster)
    anomaly_detector = AnomalyDetector(config=anomaly_config)
    logger.info("Initialized anomaly detection system")
    
    # Check privileges before starting packet capture
    if not check_packet_capture_privileges():
        privilege_status = get_privilege_status()
        logger.warning(f"Insufficient privileges for packet capture on {privilege_status['platform']}")
        logger.warning("Application will start but packet capture will be disabled")
        logger.warning("See /privileges endpoint for setup instructions")
    else:
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
    
    # Reset anomaly detector
    if anomaly_detector:
        anomaly_detector.reset()

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
        # Check privileges first
        if not check_packet_capture_privileges():
            privilege_status = get_privilege_status()
            setup_instructions = get_setup_instructions()
            
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Insufficient privileges for packet capture",
                    "platform": privilege_status["platform"],
                    "message": setup_instructions["error_message"],
                    "suggestions": setup_instructions["suggestions"][:3]
                }
            )
        
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
            # Provide more detailed error information
            privilege_status = get_privilege_status()
            if not privilege_status["has_privileges"]:
                setup_instructions = get_setup_instructions()
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Packet capture failed due to insufficient privileges",
                        "platform": privilege_status["platform"],
                        "message": setup_instructions["error_message"],
                        "suggestions": setup_instructions["suggestions"][:3]
                    }
                )
            else:
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

@app.get("/privileges")
async def get_privileges():
    """
    Get privilege status and setup instructions for packet capture.
    Implements requirements 1.5, 6.2, 6.5 for privilege validation and guidance.
    """
    try:
        privilege_status = get_privilege_status()
        setup_instructions = get_setup_instructions()
        
        return {
            "status": "success",
            "privilege_status": privilege_status,
            "setup_instructions": setup_instructions
        }
        
    except Exception as e:
        logger.error(f"Failed to get privilege information: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve privilege information")

@app.get("/privileges/check")
async def check_privileges():
    """
    Check if current process has packet capture privileges.
    Returns simple boolean result for quick privilege validation.
    """
    try:
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
            response["suggestions"] = setup_instructions["suggestions"][:3]  # Top 3 suggestions
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to check privileges: {e}")
        raise HTTPException(status_code=500, detail="Failed to check privileges")

@app.get("/anomaly/stats")
async def get_anomaly_stats():
    """
    Get current anomaly detection statistics.
    Provides insights into traffic patterns and detection parameters.
    """
    try:
        if not anomaly_detector:
            raise HTTPException(status_code=503, detail="Anomaly detection not initialized")
        
        stats = anomaly_detector.get_stats()
        return {
            "status": "active",
            "statistics": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get anomaly stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve anomaly statistics")

@app.post("/anomaly/config")
async def update_anomaly_config(
    window_size: int = 60,
    threshold: float = 3.0,
    min_samples: int = 10,
    alert_cooldown: int = 30
):
    """
    Update anomaly detection configuration parameters.
    Implements requirement 5.4 for configurable anomaly detection.
    """
    try:
        if not anomaly_detector:
            raise HTTPException(status_code=503, detail="Anomaly detection not initialized")
        
        # Validate parameters
        if window_size < 10 or window_size > 300:
            raise HTTPException(status_code=400, detail="Window size must be between 10 and 300 seconds")
        
        if threshold < 1.0 or threshold > 10.0:
            raise HTTPException(status_code=400, detail="Threshold must be between 1.0 and 10.0")
        
        if min_samples < 5 or min_samples > window_size:
            raise HTTPException(status_code=400, detail="Min samples must be between 5 and window_size")
        
        if alert_cooldown < 5 or alert_cooldown > 300:
            raise HTTPException(status_code=400, detail="Alert cooldown must be between 5 and 300 seconds")
        
        # Update configuration
        new_config = AnomalyConfig(
            window_size=window_size,
            threshold=threshold,
            min_samples=min_samples,
            alert_cooldown=alert_cooldown
        )
        
        anomaly_detector.update_config(new_config)
        
        # Notify connected clients of configuration change
        config_message = {
            "type": "anomaly_config_change",
            "window_size": window_size,
            "threshold": threshold,
            "min_samples": min_samples,
            "alert_cooldown": alert_cooldown,
            "timestamp": time.time()
        }
        await manager.broadcast(json.dumps(config_message))
        
        return {
            "status": "success",
            "message": "Anomaly detection configuration updated",
            "config": {
                "window_size": window_size,
                "threshold": threshold,
                "min_samples": min_samples,
                "alert_cooldown": alert_cooldown
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update anomaly config: {e}")
        raise HTTPException(status_code=500, detail="Failed to update anomaly configuration")

@app.post("/ai/explain", response_model=ExplainOut)
async def explain_packet(request: ExplainIn):
    """
    Analyze a packet using AI and provide explanation.
    Implements requirements 3.1, 3.2, 3.3, 3.4, 3.5 for AI packet analysis.
    """
    try:
        # Validate input
        if not request.summary or not request.summary.strip():
            raise HTTPException(status_code=400, detail="Packet summary is required")
        
        # Determine whether to use OpenAI or mock response
        use_mock = USE_MOCK_AI or not openai_client
        
        if use_mock:
            # Use mock AI response
            explanation = await get_mock_ai_explanation(request.summary)
            is_mock = True
            logger.info("Generated mock AI explanation for packet analysis")
        else:
            # Use OpenAI API
            explanation = await get_openai_explanation(request.summary, request.context)
            is_mock = False
            logger.info("Generated OpenAI explanation for packet analysis")
        
        return ExplainOut(
            explanation=explanation,
            is_mock=is_mock
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to explain packet: {e}")
        # Fall back to mock response on unexpected errors
        try:
            explanation = await get_mock_ai_explanation(request.summary)
            return ExplainOut(
                explanation=explanation,
                is_mock=True
            )
        except Exception as fallback_error:
            logger.error(f"Fallback explanation also failed: {fallback_error}")
            raise HTTPException(status_code=500, detail="Failed to generate packet explanation")

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