import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock data
const mockPacket = {
  ts: 1640995200.123,
  src: '192.168.1.100',
  dst: '8.8.8.8',
  proto: 'TCP',
  length: 1500,
  sport: 443,
  dport: 80,
  summary: 'TCP 192.168.1.100:443 -> 8.8.8.8:80 len=1500'
}

const mockAlert = {
  type: 'alert',
  level: 'warning',
  message: 'Suspicious burst detected',
  timestamp: 1640995200.456,
  meta: {
    window_start: 1640995200,
    packet_count: 150,
    z_score: 3.2,
    threshold: 3.0
  }
}

describe('App Component', () => {
  let mockWebSocket

  beforeEach(() => {
    // Reset fetch mock
    global.fetch.mockReset()
    
    // Create a more sophisticated WebSocket mock
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: WebSocket.OPEN,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null
    }

    global.WebSocket = vi.fn(() => mockWebSocket)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('renders the main dashboard components', () => {
    render(<App />)
    
    expect(screen.getByText('Wireshark+ Web Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Live Packets')).toBeInTheDocument()
    expect(screen.getByText('Packets: 0')).toBeInTheDocument()
  })

  it('establishes WebSocket connection on mount', () => {
    render(<App />)
    
    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/packets')
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('displays packet data when received via WebSocket', async () => {
    render(<App />)
    
    // Simulate WebSocket message
    const messageEvent = {
      data: JSON.stringify(mockPacket)
    }
    
    mockWebSocket.onmessage(messageEvent)
    
    await waitFor(() => {
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument()
      expect(screen.getByText('TCP')).toBeInTheDocument()
      expect(screen.getByText('1500')).toBeInTheDocument()
      expect(screen.getByText('443 → 80')).toBeInTheDocument()
    })

    expect(screen.getByText('Packets: 1')).toBeInTheDocument()
  })

  it('displays alert notifications when received', async () => {
    render(<App />)
    
    // Simulate alert message
    const alertEvent = {
      data: JSON.stringify(mockAlert)
    }
    
    mockWebSocket.onmessage(alertEvent)
    
    await waitFor(() => {
      expect(screen.getByText('Recent Alerts')).toBeInTheDocument()
      expect(screen.getByText('Suspicious burst detected')).toBeInTheDocument()
    })
  })

  it('handles packet selection and shows details', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Add a packet
    const messageEvent = {
      data: JSON.stringify(mockPacket)
    }
    mockWebSocket.onmessage(messageEvent)
    
    await waitFor(() => {
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
    })
    
    // Click on the packet row
    const packetRow = screen.getByText('192.168.1.100').closest('tr')
    await user.click(packetRow)
    
    // Check that packet details are shown
    await waitFor(() => {
      expect(screen.getByText('Packet Details')).toBeInTheDocument()
      expect(screen.getByText('TCP 192.168.1.100:443 -> 8.8.8.8:80 len=1500')).toBeInTheDocument()
      expect(screen.getByText('Explain Packet')).toBeInTheDocument()
    })
  })

  it('handles AI explanation requests', async () => {
    const user = userEvent.setup()
    
    // Mock successful AI response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        explanation: 'This is a TCP packet from a client to Google DNS.',
        is_mock: false
      })
    })
    
    render(<App />)
    
    // Add and select a packet
    const messageEvent = {
      data: JSON.stringify(mockPacket)
    }
    mockWebSocket.onmessage(messageEvent)
    
    await waitFor(() => {
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
    })
    
    const packetRow = screen.getByText('192.168.1.100').closest('tr')
    await user.click(packetRow)
    
    await waitFor(() => {
      expect(screen.getByText('Explain Packet')).toBeInTheDocument()
    })
    
    // Click explain button
    const explainButton = screen.getByText('Explain Packet')
    await user.click(explainButton)
    
    // Check loading state
    expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    
    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText('AI Analysis')).toBeInTheDocument()
      expect(screen.getByText('This is a TCP packet from a client to Google DNS.')).toBeInTheDocument()
    })
    
    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/ai/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: mockPacket.summary
      })
    })
  })

  it('handles AI explanation errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock failed AI response
    global.fetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<App />)
    
    // Add and select a packet
    const messageEvent = {
      data: JSON.stringify(mockPacket)
    }
    mockWebSocket.onmessage(messageEvent)
    
    await waitFor(() => {
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
    })
    
    const packetRow = screen.getByText('192.168.1.100').closest('tr')
    await user.click(packetRow)
    
    await waitFor(() => {
      expect(screen.getByText('Explain Packet')).toBeInTheDocument()
    })
    
    const explainButton = screen.getByText('Explain Packet')
    await user.click(explainButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to get AI explanation. Please try again.')).toBeInTheDocument()
    })
  })

  it('maintains packet buffer limit of 500', async () => {
    render(<App />)
    
    // Send 502 packets
    for (let i = 0; i < 502; i++) {
      const packet = {
        ...mockPacket,
        ts: mockPacket.ts + i,
        src: `192.168.1.${100 + (i % 155)}`
      }
      
      const messageEvent = {
        data: JSON.stringify(packet)
      }
      mockWebSocket.onmessage(messageEvent)
    }
    
    await waitFor(() => {
      expect(screen.getByText('Packets: 500')).toBeInTheDocument()
    })
  })

  it('handles WebSocket disconnection and reconnection', async () => {
    vi.useFakeTimers()
    
    render(<App />)
    
    // Initially connected
    expect(screen.getByText('Connected')).toBeInTheDocument()
    
    // Simulate disconnection
    mockWebSocket.onclose()
    
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument()
    })
    
    // Fast-forward time to trigger reconnection
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
    })
    
    vi.useRealTimers()
  })

  it('handles malformed WebSocket messages gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<App />)
    
    // Send malformed JSON
    const badMessageEvent = {
      data: 'invalid json'
    }
    
    mockWebSocket.onmessage(badMessageEvent)
    
    // Should not crash and should log error
    expect(consoleSpy).toHaveBeenCalledWith('Error parsing WebSocket message:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('formats timestamps correctly', async () => {
    render(<App />)
    
    const messageEvent = {
      data: JSON.stringify(mockPacket)
    }
    mockWebSocket.onmessage(messageEvent)
    
    await waitFor(() => {
      // Check that timestamp is formatted as time string
      const timeCell = screen.getByText(/\d{1,2}:\d{2}:\d{2}/)
      expect(timeCell).toBeInTheDocument()
    })
  })

  it('shows appropriate message when no packets are available', () => {
    render(<App />)
    
    expect(screen.getByText('Waiting for packets...')).toBeInTheDocument()
  })

  it('handles packets without port information', async () => {
    const icmpPacket = {
      ...mockPacket,
      proto: 'ICMP',
      sport: null,
      dport: null,
      summary: 'ICMP 192.168.1.100 -> 8.8.8.8 ping request'
    }
    
    render(<App />)
    
    const messageEvent = {
      data: JSON.stringify(icmpPacket)
    }
    mockWebSocket.onmessage(messageEvent)
    
    await waitFor(() => {
      expect(screen.getByText('ICMP')).toBeInTheDocument()
      expect(screen.getByText('-')).toBeInTheDocument() // No ports shown
    })
  })
})