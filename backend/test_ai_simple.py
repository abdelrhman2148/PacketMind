"""
Simplified tests for AI packet analysis functionality.
Tests the core AI functions without complex FastAPI setup.
"""

import os
import pytest
import asyncio
from unittest.mock import patch, MagicMock
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import get_mock_ai_explanation, get_openai_explanation


class TestMockAIExplanation:
    """Test mock AI explanation functionality."""
    
    @pytest.mark.asyncio
    async def test_mock_https_traffic(self):
        """Test mock explanation for HTTPS traffic."""
        summary = "TCP 192.168.1.100:443 -> 8.8.8.8:443 len=1500"
        explanation = await get_mock_ai_explanation(summary)
        
        assert "HTTPS traffic" in explanation
        assert "port 443" in explanation
        assert "encrypted" in explanation
        assert "No security concerns" in explanation
    
    @pytest.mark.asyncio
    async def test_mock_http_traffic(self):
        """Test mock explanation for HTTP traffic."""
        summary = "TCP 192.168.1.100:80 -> 8.8.8.8:80 len=1200"
        explanation = await get_mock_ai_explanation(summary)
        
        assert "HTTP traffic" in explanation
        assert "port 80" in explanation
        assert "unencrypted" in explanation
        assert "HTTPS" in explanation
    
    @pytest.mark.asyncio
    async def test_mock_dns_traffic(self):
        """Test mock explanation for DNS traffic."""
        summary = "UDP 192.168.1.100:53 -> 8.8.8.8:53 len=64"
        explanation = await get_mock_ai_explanation(summary)
        
        assert "DNS traffic" in explanation
        assert "port 53" in explanation
        assert "UDP protocol" in explanation
        assert "domain names" in explanation
    
    @pytest.mark.asyncio
    async def test_mock_icmp_traffic(self):
        """Test mock explanation for ICMP traffic."""
        summary = "ICMP 192.168.1.100 -> 8.8.8.8 ping request"
        explanation = await get_mock_ai_explanation(summary)
        
        assert "ICMP packet" in explanation
        assert "ping" in explanation
        assert "network diagnostics" in explanation
    
    @pytest.mark.asyncio
    async def test_mock_generic_udp(self):
        """Test mock explanation for generic UDP traffic."""
        summary = "UDP 192.168.1.100:12345 -> 8.8.8.8:54321 len=256"
        explanation = await get_mock_ai_explanation(summary)
        
        assert "UDP traffic" in explanation
        assert "connectionless" in explanation
        assert "streaming" in explanation
    
    @pytest.mark.asyncio
    async def test_mock_generic_tcp(self):
        """Test mock explanation for generic TCP traffic."""
        summary = "TCP 192.168.1.100:12345 -> 8.8.8.8:54321 len=1024"
        explanation = await get_mock_ai_explanation(summary)
        
        assert "TCP traffic" in explanation
        assert "reliable" in explanation
        assert "connection-oriented" in explanation
    
    @pytest.mark.asyncio
    async def test_mock_unknown_protocol(self):
        """Test mock explanation for unknown protocol."""
        summary = "UNKNOWN 192.168.1.100 -> 8.8.8.8 len=512"
        explanation = await get_mock_ai_explanation(summary)
        
        assert "requires further analysis" in explanation
        assert "suspicious patterns" in explanation


class TestOpenAIExplanation:
    """Test OpenAI API integration."""
    
    @pytest.mark.asyncio
    async def test_openai_success(self):
        """Test successful OpenAI API call."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a test AI response about the packet."
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        
        with patch('main.openai_client', mock_client):
            explanation = await get_openai_explanation("TCP test packet")
            
            assert explanation == "This is a test AI response about the packet."
            mock_client.chat.completions.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_openai_timeout(self):
        """Test OpenAI API timeout handling."""
        mock_client = MagicMock()
        
        # Mock the API call to raise TimeoutError
        async def mock_timeout(*args, **kwargs):
            await asyncio.sleep(0.1)  # Small delay
            raise asyncio.TimeoutError()
        
        with patch('main.openai_client', mock_client):
            with patch('asyncio.to_thread', side_effect=mock_timeout):
                with pytest.raises(Exception):  # Should raise HTTPException
                    await get_openai_explanation("TCP test packet")
    
    @pytest.mark.asyncio
    async def test_openai_api_error_fallback(self):
        """Test fallback to mock response on OpenAI API error."""
        mock_client = MagicMock()
        
        # Mock the API call to raise an exception
        async def mock_error(*args, **kwargs):
            raise Exception("API Error")
        
        with patch('main.openai_client', mock_client):
            with patch('asyncio.to_thread', side_effect=mock_error):
                explanation = await get_openai_explanation("TCP 192.168.1.100:443 -> 8.8.8.8:443")
                
                # Should fall back to mock response
                assert "HTTPS traffic" in explanation
    
    @pytest.mark.asyncio
    async def test_openai_no_client(self):
        """Test behavior when OpenAI client is not available."""
        with patch('main.openai_client', None):
            with pytest.raises(Exception):  # Should raise HTTPException
                await get_openai_explanation("TCP test packet")


class TestEnvironmentConfiguration:
    """Test environment variable configuration."""
    
    def test_default_configuration(self):
        """Test default configuration values."""
        with patch.dict(os.environ, {}, clear=True):
            # Reload the module to test defaults
            import importlib
            import main
            importlib.reload(main)
            
            # Should default to mock mode when no API key
            assert main.USE_MOCK_AI is True
            assert main.AI_TIMEOUT == 20
    
    def test_custom_configuration(self):
        """Test custom environment configuration."""
        with patch.dict(os.environ, {
            "OPENAI_API_KEY": "test-key",
            "USE_MOCK_AI": "false",
            "AI_TIMEOUT": "30"
        }):
            # Reload the module to test custom config
            import importlib
            import main
            importlib.reload(main)
            
            assert main.OPENAI_API_KEY == "test-key"
            assert main.USE_MOCK_AI is False
            assert main.AI_TIMEOUT == 30


if __name__ == "__main__":
    pytest.main([__file__])