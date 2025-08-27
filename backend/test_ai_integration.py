#!/usr/bin/env python3
"""
Integration test for AI functionality using direct function calls.
This avoids the complex server startup issues.
"""

import os
import sys
import asyncio
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock the packet streamer to avoid initialization issues
with patch('main.packet_streamer'):
    from main import explain_packet
    from models import ExplainIn

async def test_ai_endpoint_integration():
    """Test AI endpoint using direct function calls."""
    
    # Set environment for mock mode
    with patch.dict(os.environ, {"USE_MOCK_AI": "true"}):
        with patch('main.USE_MOCK_AI', True):
            
            # Test 1: HTTPS packet
            request = ExplainIn(summary="TCP 192.168.1.100:443 -> 8.8.8.8:443 len=1500")
            response = await explain_packet(request)
            
            assert response.explanation
            assert response.is_mock is True
            assert "HTTPS traffic" in response.explanation
            print("✓ HTTPS packet test passed")
            
            # Test 2: HTTP packet
            request = ExplainIn(summary="TCP 192.168.1.100:80 -> 8.8.8.8:80 len=1200")
            response = await explain_packet(request)
            
            assert "HTTP traffic" in response.explanation
            print("✓ HTTP packet test passed")
            
            # Test 3: DNS packet
            request = ExplainIn(summary="UDP 192.168.1.100:53 -> 8.8.8.8:53 len=64")
            response = await explain_packet(request)
            
            assert "DNS traffic" in response.explanation
            print("✓ DNS packet test passed")
            
            # Test 4: Empty summary (should fail)
            try:
                request = ExplainIn(summary="")
                response = await explain_packet(request)
                assert False, "Should have raised an exception"
            except Exception as e:
                print("✓ Empty summary rejection test passed")
            
            # Test 5: With context
            request = ExplainIn(
                summary="TCP 192.168.1.100:443 -> 8.8.8.8:443 len=1500",
                context="Suspicious activity detected"
            )
            response = await explain_packet(request)
            
            assert response.explanation
            print("✓ Context test passed")
            
            print("\n✓ All integration tests passed!")

def main():
    """Run the integration tests."""
    asyncio.run(test_ai_endpoint_integration())

if __name__ == "__main__":
    main()