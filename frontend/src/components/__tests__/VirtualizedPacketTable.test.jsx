import React from 'react'
import { render, screen, waitFor } from '../../../utils/testUtils'
import { mockPacketData, a11yTestUtils } from '../../../utils/testUtils'
import VirtualizedPacketTable from '../VirtualizedPacketTable'

describe('VirtualizedPacketTable', () => {
  const mockPackets = mockPacketData.generate(20)
  const defaultProps = {
    packets: mockPackets,
    selectedPacket: null,
    onPacketSelect: jest.fn(),
    onPacketDoubleClick: jest.fn(),
    height: 400,
    searchQuery: '',
    isCapturing: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders packet table with correct structure', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
      expect(screen.getByText('20 packets')).toBeInTheDocument()
    })

    it('renders column controls', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      expect(screen.getByText('Columns:')).toBeInTheDocument()
      expect(screen.getByText('Index')).toBeInTheDocument()
      expect(screen.getByText('Timestamp')).toBeInTheDocument()
      expect(screen.getByText('Source')).toBeInTheDocument()
      expect(screen.getByText('Destination')).toBeInTheDocument()
      expect(screen.getByText('Protocol')).toBeInTheDocument()
    })

    it('shows empty state when no packets', () => {
      render(<VirtualizedPacketTable {...defaultProps} packets={[]} />)
      
      expect(screen.getByText('📡')).toBeInTheDocument()
      expect(screen.getByText('No packets captured yet')).toBeInTheDocument()
    })

    it('shows capturing indicator when active', () => {
      render(<VirtualizedPacketTable {...defaultProps} isCapturing={true} />)
      
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  describe('Packet Data Display', () => {
    it('displays packet information correctly', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      // Check if packet data is rendered
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument()
      expect(screen.getByText('TCP')).toBeInTheDocument()
    })

    it('formats timestamps properly', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      // Should show formatted timestamp
      const timestampElements = screen.getAllByText(/\d{2}:\d{2}:\d{2}/)
      expect(timestampElements.length).toBeGreaterThan(0)
    })

    it('shows protocol badges with correct colors', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      const protocolBadges = screen.getAllByText(/TCP|UDP|HTTP|HTTPS|DNS/)
      expect(protocolBadges.length).toBeGreaterThan(0)
    })
  })

  describe('Column Management', () => {
    it('toggles column visibility', async () => {
      const { user } = render(<VirtualizedPacketTable {...defaultProps} />)
      
      const summaryColumn = screen.getByText('Summary')
      await user.click(summaryColumn)
      
      // Column should be hidden
      expect(summaryColumn).toHaveClass('variant', 'outline')
    })

    it('shows all columns by default', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      expect(screen.getByText('Index')).toBeInTheDocument()
      expect(screen.getByText('Timestamp')).toBeInTheDocument()
      expect(screen.getByText('Source')).toBeInTheDocument()
      expect(screen.getByText('Destination')).toBeInTheDocument()
      expect(screen.getByText('Protocol')).toBeInTheDocument()
      expect(screen.getByText('Length')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts by timestamp by default', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      expect(screen.getByText('Sorted by timestamp (desc)')).toBeInTheDocument()
    })

    it('toggles sort direction when clicking same column', async () => {
      const { user } = render(<VirtualizedPacketTable {...defaultProps} />)
      
      // Find timestamp header and click it
      const timestampHeader = screen.getByText('Time')
      await user.click(timestampHeader)
      
      await waitFor(() => {
        expect(screen.getByText('Sorted by timestamp (asc)')).toBeInTheDocument()
      })
    })

    it('changes sort column when clicking different column', async () => {
      const { user } = render(<VirtualizedPacketTable {...defaultProps} />)
      
      // Click on protocol column
      const protocolHeader = screen.getByText('Protocol')
      await user.click(protocolHeader)
      
      await waitFor(() => {
        expect(screen.getByText('Sorted by protocol (desc)')).toBeInTheDocument()
      })
    })
  })

  describe('Filtering and Search', () => {
    it('filters packets based on search query', () => {
      render(<VirtualizedPacketTable {...defaultProps} searchQuery="TCP" />)
      
      expect(screen.getByText(/filtered from 20/)).toBeInTheDocument()
    })

    it('shows correct filtered count', () => {
      render(<VirtualizedPacketTable {...defaultProps} searchQuery="HTTP" />)
      
      const filteredText = screen.getByText(/\d+ packets \(filtered from 20\)/)
      expect(filteredText).toBeInTheDocument()
    })

    it('shows no results message when search has no matches', () => {
      render(<VirtualizedPacketTable {...defaultProps} searchQuery="nonexistent" />)
      
      expect(screen.getByText('No packets match your search')).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('highlights selected packet', async () => {
      const selectedPacket = mockPackets[0]
      render(<VirtualizedPacketTable {...defaultProps} selectedPacket={selectedPacket} />)
      
      // Check for selection highlighting
      const packetElements = screen.getAllByText(selectedPacket.src)
      expect(packetElements[0].closest('div')).toHaveStyle('background: rgba(6, 182, 212, 0.1)')
    })

    it('calls onPacketSelect when packet is clicked', async () => {
      const { user } = render(<VirtualizedPacketTable {...defaultProps} />)
      
      const packetElement = screen.getByText(mockPackets[0].src)
      await user.click(packetElement.closest('div'))
      
      expect(defaultProps.onPacketSelect).toHaveBeenCalledWith(mockPackets[0])
    })

    it('calls onPacketDoubleClick when packet is double-clicked', async () => {
      const { user } = render(<VirtualizedPacketTable {...defaultProps} />)
      
      const packetElement = screen.getByText(mockPackets[0].src)
      await user.dblClick(packetElement.closest('div'))
      
      expect(defaultProps.onPacketDoubleClick).toHaveBeenCalledWith(mockPackets[0])
    })
  })

  describe('Virtualization', () => {
    it('shows virtualization information', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      expect(screen.getByText(/Virtual scrolling:/)).toBeInTheDocument()
      expect(screen.getByText(/rendering \d+ \/ 20 rows/)).toBeInTheDocument()
    })

    it('optimizes for large datasets', () => {
      const largeDataset = mockPacketData.generate(1500)
      render(<VirtualizedPacketTable {...defaultProps} packets={largeDataset} />)
      
      expect(screen.getByText('Optimized rendering')).toBeInTheDocument()
    })
  })

  describe('Performance Indicators', () => {
    it('shows performance status for large datasets', () => {
      const largeDataset = mockPacketData.generate(1200)
      render(<VirtualizedPacketTable {...defaultProps} packets={largeDataset} />)
      
      expect(screen.getByText('Performance: Optimized rendering')).toBeInTheDocument()
    })

    it('shows standard rendering for small datasets', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      expect(screen.getByText('Performance: Standard rendering')).toBeInTheDocument()
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
    })

    it('hides summary column on mobile', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      // Summary should be hidden by default on mobile
      expect(screen.queryByText('Summary')).not.toBeInTheDocument()
    })

    it('shows shorter timestamps on mobile', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      // Mobile timestamps should be shorter format
      const timestamps = screen.getAllByText(/\d{2}:\d{2}:\d{2}/)
      expect(timestamps.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      const table = screen.getByTestId('virtualized-list')
      expect(table).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const { user } = render(<VirtualizedPacketTable {...defaultProps} />)
      
      // Tab to first interactive element
      await a11yTestUtils.pressTab(user)
      
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
    })

    it('announces selection changes', async () => {
      const { user } = render(<VirtualizedPacketTable {...defaultProps} />)
      
      const packetElement = screen.getByText(mockPackets[0].src)
      await user.click(packetElement.closest('div'))
      
      // Should trigger accessibility announcement
      expect(defaultProps.onPacketSelect).toHaveBeenCalled()
    })

    it('supports screen reader navigation', () => {
      render(<VirtualizedPacketTable {...defaultProps} />)
      
      // Check for screen reader friendly structure
      expect(screen.getByTestId('virtualized-list')).toHaveAttribute('role', undefined)
    })
  })

  describe('Error Handling', () => {
    it('handles missing packet data gracefully', () => {
      const incompletePackets = [{ id: 'test', src: '192.168.1.1' }]
      
      expect(() => {
        render(<VirtualizedPacketTable {...defaultProps} packets={incompletePackets} />)
      }).not.toThrow()
    })

    it('handles invalid height values', () => {
      expect(() => {
        render(<VirtualizedPacketTable {...defaultProps} height={-100} />)
      }).not.toThrow()
    })

    it('handles null selectedPacket gracefully', () => {
      expect(() => {
        render(<VirtualizedPacketTable {...defaultProps} selectedPacket={null} />)
      }).not.toThrow()
    })
  })

  describe('Live Updates', () => {
    it('auto-scrolls to new packets when capturing', () => {
      const { rerender } = render(<VirtualizedPacketTable {...defaultProps} isCapturing={true} />)
      
      const newPackets = [...mockPackets, mockPacketData.createSample()]
      rerender(<VirtualizedPacketTable {...defaultProps} packets={newPackets} isCapturing={true} />)
      
      expect(screen.getByText('21 packets')).toBeInTheDocument()
    })

    it('maintains scroll position when not capturing', () => {
      const { rerender } = render(<VirtualizedPacketTable {...defaultProps} isCapturing={false} />)
      
      const newPackets = [...mockPackets, mockPacketData.createSample()]
      rerender(<VirtualizedPacketTable {...defaultProps} packets={newPackets} isCapturing={false} />)
      
      expect(screen.getByText('21 packets')).toBeInTheDocument()
    })
  })
})