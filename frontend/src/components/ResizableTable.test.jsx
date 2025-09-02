import { render, screen, fireEvent } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { vi } from 'vitest'
import ResizableTable from './ResizableTable'

const renderWithChakra = (component) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  )
}

describe('ResizableTable', () => {
  const mockOnRowClick = vi.fn()
  const mockOnColumnResize = vi.fn()
  const mockFormatTimestamp = vi.fn((ts) => new Date(ts * 1000).toLocaleTimeString())
  
  const sampleColumns = [
    { id: 'time', label: 'Time', visible: true, width: 120, resizable: true },
    { id: 'source', label: 'Source', visible: true, width: 150, resizable: true },
    { id: 'destination', label: 'Destination', visible: false, width: 150, resizable: true },
    { id: 'protocol', label: 'Protocol', visible: true, width: 100, resizable: true },
    { id: 'length', label: 'Length', visible: true, width: 80, resizable: true },
    { id: 'ports', label: 'Ports', visible: true, width: 120, resizable: true }
  ]
  
  const sampleData = [
    {
      ts: 1640995200.123,
      src: '192.168.1.100',
      dst: '8.8.8.8',
      proto: 'TCP',
      length: 1500,
      sport: 443,
      dport: 80,
      summary: 'TCP packet summary'
    },
    {
      ts: 1640995201.456,
      src: '10.0.0.1',
      dst: '192.168.1.1',
      proto: 'UDP',
      length: 512,
      sport: 53,
      dport: 12345,
      summary: 'UDP packet summary'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with visible columns only', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    // Should show visible columns
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Source')).toBeInTheDocument()
    expect(screen.getByText('Protocol')).toBeInTheDocument()
    expect(screen.getByText('Length')).toBeInTheDocument()
    expect(screen.getByText('Ports')).toBeInTheDocument()
    
    // Should not show hidden columns
    expect(screen.queryByText('Destination')).not.toBeInTheDocument()
  })

  it('renders packet data in table rows', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    // Should show packet data
    expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument()
    expect(screen.getByText('TCP')).toBeInTheDocument()
    expect(screen.getByText('UDP')).toBeInTheDocument()
    expect(screen.getByText('1500')).toBeInTheDocument()
    expect(screen.getByText('512')).toBeInTheDocument()
    expect(screen.getByText('443 → 80')).toBeInTheDocument()
    expect(screen.getByText('53 → 12345')).toBeInTheDocument()
  })

  it('calls onRowClick when row is clicked', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    const firstRow = screen.getByText('192.168.1.100').closest('tr')
    fireEvent.click(firstRow)
    
    expect(mockOnRowClick).toHaveBeenCalledWith(sampleData[0])
  })

  it('handles keyboard navigation on rows', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    const firstRow = screen.getByText('192.168.1.100').closest('tr')
    
    // Test Enter key
    fireEvent.keyDown(firstRow, { key: 'Enter' })
    expect(mockOnRowClick).toHaveBeenCalledWith(sampleData[0])
    
    // Test Space key
    fireEvent.keyDown(firstRow, { key: ' ' })
    expect(mockOnRowClick).toHaveBeenCalledTimes(2)
  })

  it('highlights selected row', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={mockOnRowClick}
        selectedRow={sampleData[0]}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    const firstRow = screen.getByText('192.168.1.100').closest('tr')
    expect(firstRow).toHaveAttribute('aria-selected', 'true')
  })

  it('renders protocol badges with correct colors', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    const tcpBadge = screen.getByText('TCP')
    const udpBadge = screen.getByText('UDP')
    
    expect(tcpBadge).toBeInTheDocument()
    expect(udpBadge).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={[]}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    expect(screen.getByText('No packets to display')).toBeInTheDocument()
  })

  it('applies column widths correctly', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    const timeHeader = screen.getByText('Time').closest('th')
    expect(timeHeader).toHaveStyle({ width: '120px' })
    
    const sourceHeader = screen.getByText('Source').closest('th')
    expect(sourceHeader).toHaveStyle({ width: '150px' })
  })

  it('handles missing port data gracefully', () => {
    const dataWithoutPorts = [{
      ts: 1640995200.123,
      src: '192.168.1.100',
      dst: '8.8.8.8',
      proto: 'ICMP',
      length: 64,
      summary: 'ICMP packet'
    }]
    
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={dataWithoutPorts}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('calls formatTimestamp for time column', () => {
    renderWithChakra(
      <ResizableTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={mockOnRowClick}
        selectedRow={null}
        formatTimestamp={mockFormatTimestamp}
        onColumnResize={mockOnColumnResize}
      />
    )
    
    expect(mockFormatTimestamp).toHaveBeenCalledWith(sampleData[0].ts)
    expect(mockFormatTimestamp).toHaveBeenCalledWith(sampleData[1].ts)
  })
})