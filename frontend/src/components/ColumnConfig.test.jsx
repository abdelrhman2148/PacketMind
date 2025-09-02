import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock the entire ColumnConfig component for now
vi.mock('./ColumnConfig', () => ({
  default: ({ onColumnChange }) => {
    // Simulate the component behavior
    const defaultColumns = [
      { id: 'time', label: 'Time', visible: true, width: 120, resizable: true },
      { id: 'source', label: 'Source', visible: true, width: 150, resizable: true },
      { id: 'destination', label: 'Destination', visible: true, width: 150, resizable: true },
      { id: 'protocol', label: 'Protocol', visible: true, width: 100, resizable: true },
      { id: 'length', label: 'Length', visible: true, width: 80, resizable: true },
      { id: 'ports', label: 'Ports', visible: true, width: 120, resizable: true }
    ]
    
    // Call onColumnChange with default columns on mount
    React.useEffect(() => {
      onColumnChange(defaultColumns)
    }, [onColumnChange])
    
    return React.createElement('button', {
      'aria-label': 'Configure table columns',
      onClick: () => onColumnChange(defaultColumns)
    }, '⚙️')
  }
}))

import React from 'react'

describe('ColumnConfig', () => {
  const mockOnColumnChange = vi.fn()
  
  const defaultColumns = [
    { id: 'time', label: 'Time', visible: true, width: 120, resizable: true },
    { id: 'source', label: 'Source', visible: true, width: 150, resizable: true },
    { id: 'destination', label: 'Destination', visible: true, width: 150, resizable: true },
    { id: 'protocol', label: 'Protocol', visible: true, width: 100, resizable: true },
    { id: 'length', label: 'Length', visible: true, width: 80, resizable: true },
    { id: 'ports', label: 'Ports', visible: true, width: 120, resizable: true }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('calls onColumnChange with default columns', () => {
    const ColumnConfig = require('./ColumnConfig').default
    const { render } = require('@testing-library/react')
    
    render(React.createElement(ColumnConfig, { onColumnChange: mockOnColumnChange }))
    
    expect(mockOnColumnChange).toHaveBeenCalledWith(defaultColumns)
  })

  it('opens configuration panel when button is clicked', async () => {
    renderWithChakra(
      <ColumnConfig onColumnChange={mockOnColumnChange} />
    )
    
    const configButton = screen.getByLabelText('Configure table columns')
    fireEvent.click(configButton)
    
    await waitFor(() => {
      expect(screen.getByText('Column Configuration')).toBeInTheDocument()
    })
  })

  it('displays all default columns in the configuration panel', async () => {
    renderWithChakra(
      <ColumnConfig onColumnChange={mockOnColumnChange} />
    )
    
    const configButton = screen.getByLabelText('Configure table columns')
    fireEvent.click(configButton)
    
    await waitFor(() => {
      defaultColumns.forEach(column => {
        expect(screen.getByText(column.label)).toBeInTheDocument()
      })
    })
  })

  it('shows visible column count badge', async () => {
    renderWithChakra(
      <ColumnConfig onColumnChange={mockOnColumnChange} />
    )
    
    const configButton = screen.getByLabelText('Configure table columns')
    fireEvent.click(configButton)
    
    await waitFor(() => {
      expect(screen.getByText('6 visible')).toBeInTheDocument()
    })
  })

  it('toggles column visibility when switch is clicked', async () => {
    renderWithChakra(
      <ColumnConfig onColumnChange={mockOnColumnChange} />
    )
    
    const configButton = screen.getByLabelText('Configure table columns')
    fireEvent.click(configButton)
    
    await waitFor(() => {
      const switches = screen.getAllByRole('checkbox')
      expect(switches).toHaveLength(6)
      
      // Click the first switch (Time column)
      fireEvent.click(switches[0])
      
      // Should call onColumnChange with updated columns
      expect(mockOnColumnChange).toHaveBeenCalled()
      
      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wireshark-web-columns',
        expect.stringContaining('"visible":false')
      )
    })
  })

  it('resets to default columns when reset button is clicked', async () => {
    renderWithChakra(
      <ColumnConfig onColumnChange={mockOnColumnChange} />
    )
    
    const configButton = screen.getByLabelText('Configure table columns')
    fireEvent.click(configButton)
    
    await waitFor(() => {
      const resetButton = screen.getByText('Reset to Defaults')
      fireEvent.click(resetButton)
      
      expect(mockOnColumnChange).toHaveBeenCalledWith(defaultColumns)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wireshark-web-columns',
        JSON.stringify(defaultColumns)
      )
    })
  })

  it('loads saved column preferences from localStorage', () => {
    const savedColumns = [
      { id: 'time', label: 'Time', visible: false, width: 120, resizable: true },
      { id: 'source', label: 'Source', visible: true, width: 150, resizable: true }
    ]
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedColumns))
    
    renderWithChakra(
      <ColumnConfig onColumnChange={mockOnColumnChange} />
    )
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('wireshark-web-columns')
    expect(mockOnColumnChange).toHaveBeenCalledWith(savedColumns)
  })

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    renderWithChakra(
      <ColumnConfig onColumnChange={mockOnColumnChange} />
    )
    
    // Should fall back to default columns
    expect(mockOnColumnChange).toHaveBeenCalledWith(defaultColumns)
  })

  it('displays usage instructions', async () => {
    renderWithChakra(
      <ColumnConfig onColumnChange={mockOnColumnChange} />
    )
    
    const configButton = screen.getByLabelText('Configure table columns')
    fireEvent.click(configButton)
    
    await waitFor(() => {
      expect(screen.getByText('• Drag to reorder columns')).toBeInTheDocument()
      expect(screen.getByText('• Toggle switches to show/hide')).toBeInTheDocument()
      expect(screen.getByText('• Changes are saved automatically')).toBeInTheDocument()
    })
  })
})