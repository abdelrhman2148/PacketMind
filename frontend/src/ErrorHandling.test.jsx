/**
 * Tests for comprehensive error handling in frontend components.
 * Tests requirements 2.5, 3.5, 4.5 for frontend error scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import * as api from './api'

// Mock the API module
vi.mock('./api', () => ({
  explainPacket: vi.fn(),
  getInterfaces: vi.fn(),
  updateCaptureSettings: vi.fn()
}))

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) this.onopen()
    }, 10)
  }
  
  send(data) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  }
  
  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose({ code: 1000, reason: 'Normal closure' })
  }
  
  // Helper method to simulate errors
  simulateError(error) {
    if (this.onerror) this.onerror(error)
  }
  
  // Helper method to simulate disconnection
  simulateDisconnect(code = 1006, reason = 'Abnormal closure') {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose({ code, reason })
  }
  
  // Helper method to simulate message
  simulateMessage(data) {
    if (this.onmessage) this.onmessage({ data })
  }
}

global.WebSocket = MockWebSocket

describe('WebSocket Error Handling (Requirement 2.5)', () => {
  let mockWebSocket
  
  beforeEach(() => {
    vi.clearAllMocks()
    api.getInterfaces.mockResolvedValue([
      { name: 'eth0', description: 'Ethernet' }
    ])
  })
  
  afterEach(() => {
    vi.clearAllTimers()
  })
  
  it('should handle WebSocket connection errors gracefully', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })
    
    // Find the WebSocket instance and simulate error
    const wsInstance = global.WebSocket.mock?.instances?.[0]
    if (wsInstance) {
      wsInstance.simulateError(new Error('Connection failed'))
    }
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
  
  it('should attempt automatic reconnection on disconnect', async () => {
    vi.useFakeTimers()
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })
    
    // Simulate disconnect
    const wsInstance = global.WebSocket.mock?.instances?.[0]
    if (wsInstance) {
      wsInstance.simulateDisconnect()
    }
    
    await waitFor(() => {
      expect(screen.getByText(/disconnected/i)).toBeInTheDocument()
    })
    
    // Fast-forward time to trigger reconnection
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument()
    })
    
    vi.useRealTimers()
  })
  
  it('should handle malformed WebSocket messages gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })
    
    // Send malformed JSON
    const wsInstance = global.WebSocket.mock?.instances?.[0]
    if (wsInstance) {
      wsInstance.simulateMessage('invalid json')
    }
    
    // Should log error but not crash
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error parsing WebSocket message'),
      expect.any(Error),
      expect.stringContaining('invalid json')
    )
    
    consoleSpy.mockRestore()
  })
  
  it('should handle different WebSocket close codes appropriately', async () => {
    vi.useFakeTimers()
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })
    
    // Test abnormal closure (should reconnect quickly)
    const wsInstance = global.WebSocket.mock?.instances?.[0]
    if (wsInstance) {
      wsInstance.simulateDisconnect(1006, 'Abnormal closure')
    }
    
    vi.advanceTimersByTime(1000) // Should reconnect after 1 second
    
    await waitFor(() => {
      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument()
    })
    
    vi.useRealTimers()
  })
})

describe('AI Analysis Error Handling (Requirement 3.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getInterfaces.mockResolvedValue([
      { name: 'eth0', description: 'Ethernet' }
    ])
  })
  
  it('should handle AI service timeout errors', async () => {
    api.explainPacket.mockRejectedValue(new Error('Request timeout - AI service took too long to respond'))
    
    render(<App />)
    
    // Wait for component to load and add a mock packet
    await waitFor(() => {
      expect(screen.getByText(/Live Packets/i)).toBeInTheDocument()
    })
    
    // Simulate receiving a packet via WebSocket
    const wsInstance = global.WebSocket.mock?.instances?.[0]
    if (wsInstance) {
      wsInstance.simulateMessage(JSON.stringify({
        ts: Date.now() / 1000,
        src: '1.1.1.1',
        dst: '2.2.2.2',
        proto: 'TCP',
        length: 100,
        sport: 443,
        dport: 80,
        summary: 'TCP 1.1.1.1:443 -> 2.2.2.2:80 len=100'
      }))
    }
    
    // Click on the packet to select it
    await waitFor(() => {
      const packetRow = screen.getByText('1.1.1.1')
      fireEvent.click(packetRow.closest('tr'))
    })
    
    // Click explain button
    const explainButton = screen.getByText(/Explain Packet/i)
    fireEvent.click(explainButton)
    
    // Should show timeout error message
    await waitFor(() => {
      expect(screen.getByText(/timeout/i)).toBeInTheDocument()
      expect(screen.getByText(/took too long/i)).toBeInTheDocument()
    })
  })
  
  it('should handle AI service network errors', async () => {
    api.explainPacket.mockRejectedValue(new Error('Network error - unable to connect to AI service'))
    
    render(<App />)
    
    // Add a mock packet and select it
    const wsInstance = global.WebSocket.mock?.instances?.[0]
    if (wsInstance) {
      wsInstance.simulateMessage(JSON.stringify({
        ts: Date.now() / 1000,
        src: '1.1.1.1',
        dst: '2.2.2.2',
        proto: 'TCP',
        length: 100,
        summary: 'TCP 1.1.1.1:443 -> 2.2.2.2:80 len=100'
      }))
    }
    
    await waitFor(() => {
      const packetRow = screen.getByText('1.1.1.1')
      fireEvent.click(packetRow.closest('tr'))
    })
    
    const explainButton = screen.getByText(/Explain Packet/i)
    fireEvent.click(explainButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Network connection error/i)).toBeInTheDocument()
    })
  })
  
  it('should handle AI service authentication errors', async () => {
    api.explainPacket.mockRejectedValue(new Error('HTTP 401: Unauthorized'))
    
    render(<App />)
    
    // Add and select packet
    const wsInstance = global.WebSocket.mock?.instances?.[0]
    if (wsInstance) {
      wsInstance.simulateMessage(JSON.stringify({
        ts: Date.now() / 1000,
        src: '1.1.1.1',
        dst: '2.2.2.2',
        proto: 'TCP',
        length: 100,
        summary: 'TCP test packet'
      }))
    }
    
    await waitFor(() => {
      const packetRow = screen.getByText('1.1.1.1')
      fireEvent.click(packetRow.closest('tr'))
    })
    
    const explainButton = screen.getByText(/Explain Packet/i)
    fireEvent.click(explainButton)
    
    await waitFor(() => {
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument()
      expect(screen.getByText(/API key/i)).toBeInTheDocument()
    })
  })
  
  it('should show error help text for AI failures', async () => {
    api.explainPacket.mockRejectedValue(new Error('Service unavailable'))
    
    render(<App />)
    
    // Add and select packet
    const wsInstance = global.WebSocket.mock?.instances?.[0]
    if (wsInstance) {
      wsInstance.simulateMessage(JSON.stringify({
        ts: Date.now() / 1000,
        src: '1.1.1.1',
        dst: '2.2.2.2',
        proto: 'TCP',
        length: 100,
        summary: 'TCP test packet'
      }))
    }
    
    await waitFor(() => {
      const packetRow = screen.getByText('1.1.1.1')
      fireEvent.click(packetRow.closest('tr'))
    })
    
    const explainButton = screen.getByText(/Explain Packet/i)
    fireEvent.click(explainButton)
    
    await waitFor(() => {
      expect(screen.getByText(/If this error persists/i)).toBeInTheDocument()
    })
  })
})

describe('Capture Settings Error Handling (Requirement 4.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getInterfaces.mockResolvedValue([
      { name: 'eth0', description: 'Ethernet' },
      { name: 'lo', description: 'Loopback' }
    ])
  })
  
  it('should handle privilege errors for capture settings', async () => {
    api.updateCaptureSettings.mockRejectedValue(new Error('HTTP 403: Insufficient privileges'))
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('eth0')).toBeInTheDocument()
    })
    
    const applyButton = screen.getByText(/Apply Settings/i)
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Insufficient privileges/i)).toBeInTheDocument()
      expect(screen.getByText(/sudo/i)).toBeInTheDocument()
    })
  })
  
  it('should handle invalid BPF filter errors', async () => {
    api.updateCaptureSettings.mockRejectedValue(new Error('HTTP 400: Invalid BPF filter'))
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('eth0')).toBeInTheDocument()
    })
    
    // Enter invalid BPF filter
    const bpfInput = screen.getByPlaceholderText(/e.g., port 80/i)
    fireEvent.change(bpfInput, { target: { value: 'invalid filter' } })
    
    const applyButton = screen.getByText(/Apply Settings/i)
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid BPF filter/i)).toBeInTheDocument()
      expect(screen.getByText(/check the syntax/i)).toBeInTheDocument()
    })
  })
  
  it('should handle interface not available errors', async () => {
    api.updateCaptureSettings.mockRejectedValue(new Error('HTTP 400: Interface not found'))
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('eth0')).toBeInTheDocument()
    })
    
    const applyButton = screen.getByText(/Apply Settings/i)
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/not available/i)).toBeInTheDocument()
      expect(screen.getByText(/choose a different interface/i)).toBeInTheDocument()
    })
  })
  
  it('should handle server errors for capture settings', async () => {
    api.updateCaptureSettings.mockRejectedValue(new Error('HTTP 500: Internal server error'))
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('eth0')).toBeInTheDocument()
    })
    
    const applyButton = screen.getByText(/Apply Settings/i)
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument()
      expect(screen.getByText(/try again/i)).toBeInTheDocument()
    })
  })
  
  it('should handle interface loading errors', async () => {
    api.getInterfaces.mockRejectedValue(new Error('Network error - unable to connect'))
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/check if the backend server is running/i)).toBeInTheDocument()
    })
  })
  
  it('should clear errors on successful settings update', async () => {
    // First fail, then succeed
    api.updateCaptureSettings
      .mockRejectedValueOnce(new Error('HTTP 400: Invalid settings'))
      .mockResolvedValueOnce({ status: 'success' })
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('eth0')).toBeInTheDocument()
    })
    
    const applyButton = screen.getByText(/Apply Settings/i)
    
    // First attempt - should show error
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid settings/i)).toBeInTheDocument()
    })
    
    // Second attempt - should clear error
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(screen.queryByText(/Invalid settings/i)).not.toBeInTheDocument()
    })
  })
})

describe('General Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getInterfaces.mockResolvedValue([
      { name: 'eth0', description: 'Ethernet' }
    ])
  })
  
  it('should handle missing packet selection for AI analysis', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/Explain Packet/i)).toBeInTheDocument()
    })
    
    // Try to explain without selecting a packet
    const explainButton = screen.getByText(/Explain Packet/i)
    fireEvent.click(explainButton)
    
    // Should log warning and not make API call
    expect(consoleSpy).toHaveBeenCalledWith('No packet selected for AI explanation')
    expect(api.explainPacket).not.toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })
  
  it('should handle interface selection validation', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('eth0')).toBeInTheDocument()
    })
    
    // Clear interface selection
    const interfaceSelect = screen.getByDisplayValue('eth0')
    fireEvent.change(interfaceSelect, { target: { value: '' } })
    
    const applyButton = screen.getByText(/Apply Settings/i)
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Please select a network interface/i)).toBeInTheDocument()
    })
    
    // Should not have called the API
    expect(api.updateCaptureSettings).not.toHaveBeenCalled()
  })
})