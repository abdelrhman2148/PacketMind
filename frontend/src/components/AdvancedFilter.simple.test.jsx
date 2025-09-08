import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { vi } from 'vitest'
import AdvancedFilter from './AdvancedFilter'

// Simple test wrapper
const TestWrapper = ({ children }) => (
  <ChakraProvider>
    {children}
  </ChakraProvider>
)

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Sample packet data
const mockPackets = [
  {
    ts: 1640995200.123,
    src: '192.168.1.100',
    dst: '8.8.8.8',
    proto: 'TCP',
    length: 1500,
    sport: 443,
    dport: 80,
    summary: 'TCP 192.168.1.100:443 -> 8.8.8.8:80 len=1500'
  },
  {
    ts: 1640995201.456,
    src: '10.0.0.1',
    dst: '1.1.1.1',
    proto: 'UDP',
    length: 512,
    sport: 53,
    dport: 53,
    summary: 'UDP 10.0.0.1:53 -> 1.1.1.1:53 len=512 DNS query'
  }
]

describe('AdvancedFilter - Simple Tests', () => {
  const mockOnFilterChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  test('renders without crashing', () => {
    render(
      <TestWrapper>
        <AdvancedFilter
          packets={mockPackets}
          onFilterChange={mockOnFilterChange}
        />
      </TestWrapper>
    )
    
    expect(screen.getByText('🔍 Advanced Filters')).toBeInTheDocument()
  })

  test('shows add filter button', () => {
    render(
      <TestWrapper>
        <AdvancedFilter
          packets={mockPackets}
          onFilterChange={mockOnFilterChange}
        />
      </TestWrapper>
    )
    
    expect(screen.getByText('➕ Add Filter')).toBeInTheDocument()
  })

  test('calls onFilterChange with initial data', () => {
    render(
      <TestWrapper>
        <AdvancedFilter
          packets={mockPackets}
          onFilterChange={mockOnFilterChange}
        />
      </TestWrapper>
    )
    
    // Should be called with initial packet data
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      mockPackets,
      expect.objectContaining({
        count: mockPackets.length,
        total: mockPackets.length
      })
    )
  })

  test('can add a filter', () => {
    render(
      <TestWrapper>
        <AdvancedFilter
          packets={mockPackets}
          onFilterChange={mockOnFilterChange}
        />
      </TestWrapper>
    )
    
    const addButton = screen.getByText('➕ Add Filter')
    fireEvent.click(addButton)
    
    // Should show filter controls
    expect(screen.getByDisplayValue('Protocol')).toBeInTheDocument()
    expect(screen.getByDisplayValue('equals')).toBeInTheDocument()
  })
})