import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import { vi } from 'vitest'
import AdvancedFilter from './AdvancedFilter'
import theme from '../theme'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Test wrapper with ChakraProvider
const TestWrapper = ({ children }) => (
  <ChakraProvider theme={theme}>
    {children}
  </ChakraProvider>
)

// Sample packet data for testing
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
  },
  {
    ts: 1640995202.789,
    src: '192.168.1.50',
    dst: '172.16.0.1',
    proto: 'HTTP',
    length: 2048,
    sport: 8080,
    dport: 80,
    summary: 'HTTP GET request'
  }
]

describe('AdvancedFilter', () => {
  const mockOnFilterChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  const renderAdvancedFilter = (props = {}) => {
    return render(
      <TestWrapper>
        <AdvancedFilter
          packets={mockPackets}
          onFilterChange={mockOnFilterChange}
          {...props}
        />
      </TestWrapper>
    )
  }

  describe('Basic Rendering', () => {
    test('renders advanced filter component', () => {
      renderAdvancedFilter()
      
      expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
      expect(screen.getByText('Add Filter')).toBeInTheDocument()
    })

    test('shows packet count when no filters applied', () => {
      renderAdvancedFilter()
      
      // Should show total packet count in badge when filters are applied
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        mockPackets,
        expect.objectContaining({
          count: mockPackets.length,
          total: mockPackets.length
        })
      )
    })

    test('renders filter presets button', () => {
      renderAdvancedFilter()
      
      const presetsButton = screen.getByLabelText('Filter presets')
      expect(presetsButton).toBeInTheDocument()
    })

    test('renders filter history button', () => {
      renderAdvancedFilter()
      
      const historyButton = screen.getByLabelText('Filter history')
      expect(historyButton).toBeInTheDocument()
    })

    test('renders saved filters button', () => {
      renderAdvancedFilter()
      
      const savedButton = screen.getByLabelText('Saved filters')
      expect(savedButton).toBeInTheDocument()
    })
  })

  describe('Filter Management', () => {
    test('adds new filter when Add Filter button is clicked', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      // Should show filter row with default values
      expect(screen.getByDisplayValue('Protocol')).toBeInTheDocument()
      expect(screen.getByDisplayValue('equals')).toBeInTheDocument()
    })

    test('removes filter when remove button is clicked', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add a filter first
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      // Remove the filter
      const removeButton = screen.getByLabelText('Remove filter')
      await user.click(removeButton)
      
      // Filter row should be gone
      expect(screen.queryByDisplayValue('Protocol')).not.toBeInTheDocument()
    })

    test('clears all filters when Clear All button is clicked', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add multiple filters
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      await user.click(addButton)
      
      // Clear all filters
      const clearButton = screen.getByText('Clear All')
      await user.click(clearButton)
      
      // No filter rows should remain
      expect(screen.queryByDisplayValue('Protocol')).not.toBeInTheDocument()
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument()
    })

    test('updates filter field when changed', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add a filter
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      // Change field from Protocol to Source IP
      const fieldSelect = screen.getByDisplayValue('Protocol')
      await user.selectOptions(fieldSelect, 'source')
      
      expect(screen.getByDisplayValue('Source IP')).toBeInTheDocument()
    })

    test('updates filter operator when changed', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add a filter
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      // Change operator
      const operatorSelect = screen.getByDisplayValue('equals')
      await user.selectOptions(operatorSelect, 'not_equals')
      
      expect(screen.getByDisplayValue('not equals')).toBeInTheDocument()
    })

    test('updates filter value when changed', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add a filter and change to source field
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      const fieldSelect = screen.getByDisplayValue('Protocol')
      await user.selectOptions(fieldSelect, 'source')
      
      // Update value
      const valueInput = screen.getByPlaceholderText('e.g., 192.168.1.1')
      await user.type(valueInput, '192.168.1.100')
      
      expect(valueInput).toHaveValue('192.168.1.100')
    })
  })

  describe('Filter Logic', () => {
    test('shows logic selection when multiple filters exist', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add two filters
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      await user.click(addButton)
      
      // Logic selection should appear
      expect(screen.getByText('Filter Logic:')).toBeInTheDocument()
      expect(screen.getByText('AND')).toBeInTheDocument()
      expect(screen.getByText('OR')).toBeInTheDocument()
    })

    test('changes filter logic from AND to OR', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add two filters
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      await user.click(addButton)
      
      // Click OR button
      const orButton = screen.getByRole('button', { name: 'OR' })
      await user.click(orButton)
      
      // Should show OR as selected and update help text
      expect(screen.getByText('Any condition can match')).toBeInTheDocument()
    })
  })

  describe('Filter Presets', () => {
    test('shows presets when presets button is clicked', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      const presetsButton = screen.getByLabelText('Filter presets')
      await user.click(presetsButton)
      
      expect(screen.getByText('Quick Presets')).toBeInTheDocument()
      expect(screen.getByText('Web Traffic')).toBeInTheDocument()
      expect(screen.getByText('DNS Queries')).toBeInTheDocument()
    })

    test('applies preset when preset button is clicked', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Open presets
      const presetsButton = screen.getByLabelText('Filter presets')
      await user.click(presetsButton)
      
      // Apply Web Traffic preset
      const webTrafficButton = screen.getByText('Web Traffic')
      await user.click(webTrafficButton)
      
      // Should create filters for HTTP and HTTPS
      await waitFor(() => {
        expect(screen.getByDisplayValue('HTTP')).toBeInTheDocument()
      })
    })
  })

  describe('Filter History', () => {
    test('shows empty history message when no history exists', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      const historyButton = screen.getByLabelText('Filter history')
      await user.click(historyButton)
      
      expect(screen.getByText('No filter history yet')).toBeInTheDocument()
    })

    test('loads filter history from localStorage', () => {
      const mockHistory = [
        {
          id: 1,
          description: 'Test Filter',
          filters: [{ field: 'protocol', operator: 'equals', value: 'TCP' }],
          logic: 'AND',
          timestamp: new Date().toISOString()
        }
      ]
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory))
      
      renderAdvancedFilter()
      
      // History should be loaded (we can't easily test the UI without clicking the button)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('wireshark-filter-history')
    })
  })

  describe('Saved Filters', () => {
    test('shows empty saved filters message when none exist', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      const savedButton = screen.getByLabelText('Saved filters')
      await user.click(savedButton)
      
      expect(screen.getByText('No saved filters yet')).toBeInTheDocument()
    })

    test('saves current filter configuration', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add a filter
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      // Open saved filters
      const savedButton = screen.getByLabelText('Saved filters')
      await user.click(savedButton)
      
      // Enter filter name and save
      const nameInput = screen.getByPlaceholderText('Filter name...')
      await user.type(nameInput, 'My Test Filter')
      
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)
      
      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wireshark-saved-filters',
        expect.stringContaining('My Test Filter')
      )
    })
  })

  describe('Filter Validation', () => {
    test('shows validation error for incomplete filter', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add a filter but don't fill in value
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      // Change to source field to get text input
      const fieldSelect = screen.getByDisplayValue('Protocol')
      await user.selectOptions(fieldSelect, 'source')
      
      // Leave value empty - validation should trigger
      await waitFor(() => {
        expect(screen.getByText('All filter fields must be completed')).toBeInTheDocument()
      })
    })

    test('validates number fields', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add a filter and change to port field
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      const fieldSelect = screen.getByDisplayValue('Protocol')
      await user.selectOptions(fieldSelect, 'port')
      
      // Enter invalid number
      const valueInput = screen.getByPlaceholderText('e.g., 80, 443')
      await user.type(valueInput, 'not-a-number')
      
      await waitFor(() => {
        expect(screen.getByText('Port must be a number')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Application', () => {
    test('filters packets based on protocol', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add protocol filter for TCP
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      const valueSelect = screen.getByDisplayValue('')
      await user.selectOptions(valueSelect, 'TCP')
      
      // Should call onFilterChange with filtered packets
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ proto: 'TCP' })
          ]),
          expect.objectContaining({
            count: 1, // Only one TCP packet in mock data
            total: 3
          })
        )
      })
    })

    test('filters packets based on source IP', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add source IP filter
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      
      const fieldSelect = screen.getByDisplayValue('Protocol')
      await user.selectOptions(fieldSelect, 'source')
      
      const valueInput = screen.getByPlaceholderText('e.g., 192.168.1.1')
      await user.type(valueInput, '192.168.1.100')
      
      // Should filter to packets from that source
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ src: '192.168.1.100' })
          ]),
          expect.objectContaining({
            count: 1,
            total: 3
          })
        )
      })
    })

    test('applies multiple filters with AND logic', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add two filters
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      await user.click(addButton)
      
      // First filter: protocol = TCP
      const protocolSelects = screen.getAllByDisplayValue('')
      await user.selectOptions(protocolSelects[0], 'TCP')
      
      // Second filter: source starts with 192.168
      const fieldSelects = screen.getAllByDisplayValue('Protocol')
      await user.selectOptions(fieldSelects[1], 'source')
      
      const operatorSelects = screen.getAllByDisplayValue('equals')
      await user.selectOptions(operatorSelects[1], 'starts_with')
      
      const valueInput = screen.getByPlaceholderText('e.g., 192.168.1.1')
      await user.type(valueInput, '192.168')
      
      // Should filter to packets matching both conditions
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ 
              proto: 'TCP',
              src: expect.stringMatching(/^192\.168/)
            })
          ]),
          expect.objectContaining({
            count: 1,
            total: 3
          })
        )
      })
    })

    test('applies multiple filters with OR logic', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add two filters
      const addButton = screen.getByText('Add Filter')
      await user.click(addButton)
      await user.click(addButton)
      
      // Change to OR logic
      const orButton = screen.getByRole('button', { name: 'OR' })
      await user.click(orButton)
      
      // First filter: protocol = TCP
      const protocolSelects = screen.getAllByDisplayValue('')
      await user.selectOptions(protocolSelects[0], 'TCP')
      
      // Second filter: protocol = UDP
      await user.selectOptions(protocolSelects[1], 'UDP')
      
      // Should filter to packets matching either condition
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ proto: 'TCP' }),
            expect.objectContaining({ proto: 'UDP' })
          ]),
          expect.objectContaining({
            count: 2, // TCP and UDP packets
            total: 3
          })
        )
      })
    })
  })

  describe('Suggestions', () => {
    test('generates suggestions from packet data', () => {
      renderAdvancedFilter()
      
      // Component should extract unique values from packets for suggestions
      // This is tested indirectly through the filter application
      expect(mockOnFilterChange).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderAdvancedFilter()
      
      expect(screen.getByLabelText('Filter presets')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter history')).toBeInTheDocument()
      expect(screen.getByLabelText('Saved filters')).toBeInTheDocument()
    })

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderAdvancedFilter()
      
      // Add filter button should be focusable
      const addButton = screen.getByText('Add Filter')
      addButton.focus()
      expect(addButton).toHaveFocus()
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}')
      expect(screen.getByDisplayValue('Protocol')).toBeInTheDocument()
    })
  })
})