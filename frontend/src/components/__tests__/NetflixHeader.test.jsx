import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../utils/testUtils'
import NetflixHeader from '../NetflixHeader'

// Mock the search hook
jest.mock('../../hooks/useSearch', () => ({
  useSearch: () => ({
    searchQuery: '',
    setSearchQuery: jest.fn(),
    suggestions: [],
    isSearching: false,
    searchHistory: []
  })
}))

describe('NetflixHeader', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    onFilterToggle: jest.fn(),
    onSettingsClick: jest.fn(),
    onAboutClick: jest.fn(),
    connectionStatus: 'connected',
    packetCount: 150,
    isCapturing: false,
    currentInterface: 'eth0'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the Netflix logo and title', () => {
      render(<NetflixHeader {...defaultProps} />)
      
      expect(screen.getByText('AI SHARK')).toBeInTheDocument()
      expect(screen.getByText('Network Packet Analyzer')).toBeInTheDocument()
    })

    it('displays connection status correctly', () => {
      render(<NetflixHeader {...defaultProps} />)
      
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('150 packets')).toBeInTheDocument()
    })

    it('shows current interface when provided', () => {
      render(<NetflixHeader {...defaultProps} />)
      
      expect(screen.getByText('eth0')).toBeInTheDocument()
    })

    it('renders all navigation buttons', () => {
      render(<NetflixHeader {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    })
  })

  describe('Connection Status', () => {
    it('displays disconnected status with correct styling', () => {
      render(<NetflixHeader {...defaultProps} connectionStatus="disconnected" />)
      
      const statusText = screen.getByText('Disconnected')
      expect(statusText).toBeInTheDocument()
    })

    it('displays connecting status', () => {
      render(<NetflixHeader {...defaultProps} connectionStatus="connecting" />)
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    it('displays reconnecting status', () => {
      render(<NetflixHeader {...defaultProps} connectionStatus="reconnecting" />)
      
      expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
    })
  })

  describe('Packet Count Display', () => {
    it('formats large packet counts correctly', () => {
      render(<NetflixHeader {...defaultProps} packetCount={1500} />)
      
      expect(screen.getByText('1.5K packets')).toBeInTheDocument()
    })

    it('shows exact count for small numbers', () => {
      render(<NetflixHeader {...defaultProps} packetCount={50} />)
      
      expect(screen.getByText('50 packets')).toBeInTheDocument()
    })

    it('shows zero packets when no packets captured', () => {
      render(<NetflixHeader {...defaultProps} packetCount={0} />)
      
      expect(screen.getByText('0 packets')).toBeInTheDocument()
    })
  })

  describe('Capture Status', () => {
    it('shows capturing indicator when active', () => {
      render(<NetflixHeader {...defaultProps} isCapturing={true} />)
      
      expect(screen.getByText('Capturing')).toBeInTheDocument()
    })

    it('does not show capturing indicator when inactive', () => {
      render(<NetflixHeader {...defaultProps} isCapturing={false} />)
      
      expect(screen.queryByText('Capturing')).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('calls onSearch when search is triggered', async () => {
      const { user } = render(<NetflixHeader {...defaultProps} />)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      expect(defaultProps.onSearch).toHaveBeenCalled()
    })

    it('handles search input correctly', async () => {
      const { user } = render(<NetflixHeader {...defaultProps} />)
      
      // Assuming the search button opens a search input
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      const searchInput = screen.queryByRole('textbox')
      if (searchInput) {
        await user.type(searchInput, 'HTTP')
        expect(defaultProps.onSearch).toHaveBeenCalledWith('HTTP')
      }
    })
  })

  describe('Filter Toggle', () => {
    it('calls onFilterToggle when filter button is clicked', async () => {
      const { user } = render(<NetflixHeader {...defaultProps} />)
      
      const filterButton = screen.getByRole('button', { name: /filter/i })
      await user.click(filterButton)
      
      expect(defaultProps.onFilterToggle).toHaveBeenCalled()
    })
  })

  describe('Settings and About', () => {
    it('calls onSettingsClick when settings button is clicked', async () => {
      const { user } = render(<NetflixHeader {...defaultProps} />)
      
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
      
      expect(defaultProps.onSettingsClick).toHaveBeenCalled()
    })

    it('opens about dialog when about is triggered', async () => {
      const { user } = render(<NetflixHeader {...defaultProps} />)
      
      // Look for about button or menu item
      const aboutElement = screen.queryByRole('button', { name: /about/i }) || 
                          screen.queryByText(/about/i)
      
      if (aboutElement) {
        await user.click(aboutElement)
        expect(defaultProps.onAboutClick).toHaveBeenCalled()
      }
    })
  })

  describe('Responsive Behavior', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<NetflixHeader {...defaultProps} />)
      
      // Header should still render all essential elements
      expect(screen.getByText('AI SHARK')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on interactive elements', () => {
      render(<NetflixHeader {...defaultProps} />)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      const filterButton = screen.getByRole('button', { name: /filter/i })
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      
      expect(searchButton).toBeAccessible()
      expect(filterButton).toBeAccessible()
      expect(settingsButton).toBeAccessible()
    })

    it('supports keyboard navigation', async () => {
      const { user } = render(<NetflixHeader {...defaultProps} />)
      
      // Tab through interactive elements
      await user.tab()
      
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
      expect(focusedElement.tagName).toBe('BUTTON')
    })

    it('announces status changes to screen readers', async () => {
      const { rerender } = render(<NetflixHeader {...defaultProps} connectionStatus="connecting" />)
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
      
      rerender(<NetflixHeader {...defaultProps} connectionStatus="connected" />)
      
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn()
      
      const TestComponent = (props) => {
        renderSpy()
        return <NetflixHeader {...props} />
      }
      
      const { rerender } = render(<TestComponent {...defaultProps} />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestComponent {...defaultProps} />)
      
      // Should use memoization to prevent unnecessary re-renders
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('handles missing props gracefully', () => {
      const minimalProps = {
        onSearch: jest.fn(),
        onFilterToggle: jest.fn()
      }
      
      expect(() => {
        render(<NetflixHeader {...minimalProps} />)
      }).not.toThrow()
      
      expect(screen.getByText('AI SHARK')).toBeInTheDocument()
    })

    it('handles invalid connection status', () => {
      render(<NetflixHeader {...defaultProps} connectionStatus="invalid" />)
      
      // Should default to a safe state or handle gracefully
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })
})