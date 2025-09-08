import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import AccessibleTable from './AccessibleTable'
import { mockPacketData } from '../utils/testUtils'

// Sample data for the table
const sampleData = mockPacketData.generate(50)
const columns = [
  { key: 'index', header: 'Index', width: '60px' },
  { key: 'ts', header: 'Timestamp', width: '150px', formatter: (value) => new Date(value * 1000).toLocaleTimeString() },
  { key: 'src', header: 'Source', width: '140px' },
  { key: 'dst', header: 'Destination', width: '140px' },
  { key: 'proto', header: 'Protocol', width: '80px' },
  { key: 'length', header: 'Length', width: '80px', formatter: (value) => `${value}B` },
  { key: 'summary', header: 'Summary', minWidth: '200px' }
]

const meta: Meta<typeof AccessibleTable> = {
  title: 'Components/AccessibleTable',
  component: AccessibleTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A fully accessible table component with WCAG 2.1 AA compliance, screen reader support, and keyboard navigation.'
      }
    }
  },
  argTypes: {
    sortable: {
      control: 'boolean',
      description: 'Whether columns can be sorted'
    },
    filterable: {
      control: 'boolean',
      description: 'Whether table data can be filtered'
    },
    selectable: {
      control: 'boolean',
      description: 'Whether rows can be selected'
    },
    multiSelect: {
      control: 'boolean',
      description: 'Whether multiple rows can be selected'
    },
    searchable: {
      control: 'boolean',
      description: 'Whether table has search functionality'
    },
    pageSize: {
      control: { type: 'number', min: 5, max: 100 },
      description: 'Number of rows per page'
    },
    loading: {
      control: 'boolean',
      description: 'Loading state'
    },
    error: {
      control: 'text',
      description: 'Error message to display'
    }
  },
  args: {
    onSelectionChange: action('selection-change'),
    onSort: action('sort'),
    onFilter: action('filter')
  }
}

export default meta
type Story = StoryObj<typeof AccessibleTable>

export const Default: Story = {
  args: {
    data: sampleData,
    columns,
    caption: 'Network Packet Data',
    sortable: true,
    filterable: true,
    searchable: true,
    pageSize: 10
  }
}

export const Selectable: Story = {
  args: {
    data: sampleData,
    columns,
    caption: 'Selectable Packet Table',
    sortable: true,
    selectable: true,
    searchable: true,
    pageSize: 10
  }
}

export const MultiSelect: Story = {
  args: {
    data: sampleData,
    columns,
    caption: 'Multi-Select Packet Table',
    sortable: true,
    selectable: true,
    multiSelect: true,
    searchable: true,
    pageSize: 10
  }
}

export const Loading: Story = {
  args: {
    data: [],
    columns,
    caption: 'Loading Packet Data',
    loading: true
  }
}

export const Error: Story = {
  args: {
    data: [],
    columns,
    caption: 'Packet Data with Error',
    error: 'Failed to load packet data. Please try again.'
  }
}

export const Empty: Story = {
  args: {
    data: [],
    columns,
    caption: 'Empty Packet Table',
    emptyMessage: 'No packets have been captured yet.',
    sortable: true,
    searchable: true
  }
}

export const SmallDataset: Story = {
  args: {
    data: mockPacketData.generate(5),
    columns,
    caption: 'Small Dataset',
    sortable: true,
    searchable: true,
    pageSize: 5
  }
}

export const LargeDataset: Story = {
  args: {
    data: mockPacketData.generate(500),
    columns,
    caption: 'Large Dataset (500 rows)',
    sortable: true,
    searchable: true,
    filterable: true,
    selectable: true,
    multiSelect: true,
    pageSize: 25
  }
}

export const MinimalColumns: Story = {
  args: {
    data: sampleData,
    columns: [
      { key: 'src', header: 'Source' },
      { key: 'dst', header: 'Destination' },
      { key: 'proto', header: 'Protocol' }
    ],
    caption: 'Minimal Column Set',
    sortable: true,
    searchable: true
  }
}

export const NoSorting: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns,
    caption: 'No Sorting Available',
    sortable: false,
    searchable: true,
    pageSize: 10
  }
}

export const NoSearch: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns,
    caption: 'No Search Available',
    sortable: true,
    searchable: false,
    pageSize: 10
  }
}

// Accessibility focused stories
export const AccessibilityTest: Story = {
  args: {
    data: sampleData.slice(0, 20),
    columns,
    caption: 'Accessibility Test Table',
    sortable: true,
    searchable: true,
    selectable: true,
    multiSelect: true,
    ariaLabel: 'Network packet data table',
    pageSize: 10
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'aria-labels', enabled: true },
          { id: 'table-structure', enabled: true }
        ]
      }
    }
  }
}

export const KeyboardNavigation: Story = {
  args: {
    data: sampleData.slice(0, 15),
    columns,
    caption: 'Keyboard Navigation Demo',
    sortable: true,
    searchable: true,
    selectable: true,
    pageSize: 10
  },
  parameters: {
    docs: {
      description: {
        story: 'Use Tab to navigate, Arrow keys to move between cells, Space to select rows, Enter to activate buttons.'
      }
    }
  }
}

export const ScreenReaderTest: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns,
    caption: 'Screen Reader Optimized Table',
    sortable: true,
    searchable: true,
    selectable: true,
    ariaLabel: 'Network packet analysis data',
    ariaDescribedBy: 'table-help-text',
    pageSize: 10
  },
  decorators: [
    (Story) => (
      <div>
        <div id="table-help-text" style={{ marginBottom: '1rem', color: '#8C8C8C' }}>
          This table contains network packet data. Use keyboard navigation to explore the data.
          Press Enter on column headers to sort, Space to select rows.
        </div>
        <Story />
      </div>
    )
  ]
}

// Mobile responsive story
export const Mobile: Story = {
  args: {
    data: sampleData.slice(0, 20),
    columns: [
      { key: 'src', header: 'Source' },
      { key: 'dst', header: 'Destination' },
      { key: 'proto', header: 'Protocol' },
      { key: 'length', header: 'Length', formatter: (value) => `${value}B` }
    ],
    caption: 'Mobile Optimized Table',
    sortable: true,
    searchable: true,
    selectable: true,
    pageSize: 10
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile'
    }
  }
}

// Performance test story
export const PerformanceTest: Story = {
  args: {
    data: mockPacketData.generate(1000),
    columns,
    caption: 'Performance Test (1000 rows)',
    sortable: true,
    searchable: true,
    filterable: true,
    selectable: true,
    multiSelect: true,
    pageSize: 50
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests table performance with 1000 rows of data. Should maintain smooth interactions.'
      }
    }
  }
}