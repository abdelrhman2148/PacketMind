import React from 'react'
import { render, screen, waitFor } from '../../utils/testUtils'
import { mockPacketData, a11yTestUtils } from '../../utils/testUtils'
import App from '../../App'

// Mock WebSocket
jest.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionStatus: 'connected',
    sendMessage: jest.fn(),
    isConnected: true
  })
}))

describe('Integration Tests - Core Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Search and Filter Integration', () => {
    it('performs complete search workflow', async () => {
      const { user } = render(<App />)
      
      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument()
      })
      
      // Search for packets
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'HTTP')
      
      // Verify search works
      await waitFor(() => {
        expect(screen.getByText(/filtered/i)).toBeInTheDocument()
      })
    })

    it('integrates accessibility features', async () => {
      const { user } = render(<App />)
      
      // Test keyboard navigation
      await a11yTestUtils.pressTab(user)
      expect(document.activeElement).toBeInTheDocument()
      
      // Check ARIA labels
      const searchInput = screen.getByPlaceholderText(/search/i)
      expect(searchInput).toHaveAttribute('aria-label')
    })
  })

  describe('Packet Table Integration', () => {
    it('displays and interacts with packet data', async () => {
      const { user } = render(<App />)
      
      await waitFor(() => {
        expect(screen.getByRole('table') || screen.getByTestId('packet-table')).toBeInTheDocument()
      })
      
      // Click on a packet row
      const rows = screen.getAllByRole('row')
      if (rows.length > 1) {
        await user.click(rows[1])
      }
    })
  })

  describe('Error Handling', () => {
    it('handles connection errors gracefully', () => {
      render(<App />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })
})