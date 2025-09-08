import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import NetflixSearchBar from './NetflixSearchBar'

const meta: Meta<typeof NetflixSearchBar> = {
  title: 'Components/NetflixSearchBar',
  component: NetflixSearchBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A Netflix-styled search bar component with autocomplete, suggestions, and accessibility features.'
      }
    }
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the search bar is disabled'
    },
    showSuggestions: {
      control: 'boolean',
      description: 'Whether to show autocomplete suggestions'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the search bar'
    },
    variant: {
      control: 'select',
      options: ['filled', 'outline', 'flushed'],
      description: 'Visual variant of the search input'
    }
  },
  args: {
    onSearch: action('search'),
    onFocus: action('focus'),
    onBlur: action('blur'),
    onChange: action('change')
  }
}

export default meta
type Story = StoryObj<typeof NetflixSearchBar>

export const Default: Story = {
  args: {
    placeholder: 'Search packets...',
    showSuggestions: true
  }
}

export const WithValue: Story = {
  args: {
    placeholder: 'Search packets...',
    defaultValue: 'HTTP',
    showSuggestions: true
  }
}

export const Disabled: Story = {
  args: {
    placeholder: 'Search packets...',
    disabled: true,
    showSuggestions: true
  }
}

export const NoSuggestions: Story = {
  args: {
    placeholder: 'Search packets...',
    showSuggestions: false
  }
}

export const SmallSize: Story = {
  args: {
    placeholder: 'Search...',
    size: 'sm',
    showSuggestions: true
  }
}

export const LargeSize: Story = {
  args: {
    placeholder: 'Search packets and protocols...',
    size: 'lg',
    showSuggestions: true
  }
}

export const OutlineVariant: Story = {
  args: {
    placeholder: 'Search packets...',
    variant: 'outline',
    showSuggestions: true
  }
}

export const FlushedVariant: Story = {
  args: {
    placeholder: 'Search packets...',
    variant: 'flushed',
    showSuggestions: true
  }
}

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Filter by protocol, IP, port...',
    showSuggestions: true
  }
}

export const LoadingState: Story = {
  args: {
    placeholder: 'Search packets...',
    isLoading: true,
    showSuggestions: true
  }
}

export const WithError: Story = {
  args: {
    placeholder: 'Search packets...',
    isInvalid: true,
    errorMessage: 'Invalid search query format',
    showSuggestions: true
  }
}

// Accessibility stories
export const AccessibilityTest: Story = {
  args: {
    placeholder: 'Search packets...',
    showSuggestions: true,
    'aria-label': 'Search network packets',
    'aria-describedby': 'search-help'
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
        <div id="search-help" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#8C8C8C' }}>
          Type to search packets by protocol, IP address, port, or summary content.
        </div>
      </div>
    )
  ],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'label', enabled: true },
          { id: 'aria-labels', enabled: true },
          { id: 'keyboard-navigation', enabled: true }
        ]
      }
    }
  }
}

export const KeyboardNavigation: Story = {
  args: {
    placeholder: 'Search packets...',
    showSuggestions: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Use Tab to focus, Arrow keys to navigate suggestions, Enter to search, Escape to close suggestions.'
      }
    }
  }
}

// Mobile responsive
export const Mobile: Story = {
  args: {
    placeholder: 'Search...',
    showSuggestions: true,
    size: 'md'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile'
    }
  }
}

export const Tablet: Story = {
  args: {
    placeholder: 'Search packets and protocols...',
    showSuggestions: true,
    size: 'lg'
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
}

// Interactive demo
export const InteractiveDemo: Story = {
  args: {
    placeholder: 'Try typing "TCP", "HTTP", or an IP address...',
    showSuggestions: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing autocomplete functionality. Type to see suggestions appear.'
      }
    }
  }
}

// Performance test
export const PerformanceTest: Story = {
  args: {
    placeholder: 'Performance test - type quickly...',
    showSuggestions: true,
    debounceMs: 300
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests search performance with debounced input and large suggestion lists.'
      }
    }
  }
}

// Different contexts
export const InHeader: Story = {
  args: {
    placeholder: 'Search packets...',
    variant: 'filled',
    size: 'sm',
    showSuggestions: true
  },
  decorators: [
    (Story) => (
      <div style={{ 
        background: '#000000', 
        padding: '1rem', 
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Story />
      </div>
    )
  ]
}

export const InSidebar: Story = {
  args: {
    placeholder: 'Filter packets...',
    variant: 'outline',
    size: 'sm',
    showSuggestions: true
  },
  decorators: [
    (Story) => (
      <div style={{ 
        background: '#1A1A1A', 
        padding: '1rem', 
        borderRadius: '8px',
        width: '250px'
      }}>
        <Story />
      </div>
    )
  ]
}

export const InModal: Story = {
  args: {
    placeholder: 'Search for specific packets...',
    variant: 'filled',
    size: 'md',
    showSuggestions: true
  },
  decorators: [
    (Story) => (
      <div style={{ 
        background: '#1A1A1A', 
        padding: '2rem', 
        borderRadius: '12px',
        border: '2px solid #06B6D4',
        maxWidth: '500px'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#FFFFFF' }}>Advanced Search</h3>
        <Story />
      </div>
    )
  ]
}