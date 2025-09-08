import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import NetflixHeader from './NetflixHeader'

const meta: Meta<typeof NetflixHeader> = {
  title: 'Components/NetflixHeader',
  component: NetflixHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main header component for the AI Shark application with Netflix-inspired styling.'
      }
    }
  },
  argTypes: {
    connectionStatus: {
      control: 'select',
      options: ['connected', 'disconnected', 'connecting', 'reconnecting'],
      description: 'WebSocket connection status'
    },
    packetCount: {
      control: { type: 'number', min: 0, max: 100000 },
      description: 'Number of captured packets'
    },
    isCapturing: {
      control: 'boolean',
      description: 'Whether packet capture is currently active'
    },
    currentInterface: {
      control: 'text',
      description: 'Currently selected network interface'
    }
  },
  args: {
    onSearch: action('search'),
    onFilterToggle: action('filter-toggle'),
    onSettingsClick: action('settings-click'),
    onAboutClick: action('about-click')
  }
}

export default meta
type Story = StoryObj<typeof NetflixHeader>

export const Default: Story = {
  args: {
    connectionStatus: 'connected',
    packetCount: 150,
    isCapturing: false,
    currentInterface: 'eth0'
  }
}

export const Disconnected: Story = {
  args: {
    connectionStatus: 'disconnected',
    packetCount: 0,
    isCapturing: false,
    currentInterface: ''
  }
}

export const Connecting: Story = {
  args: {
    connectionStatus: 'connecting',
    packetCount: 0,
    isCapturing: false,
    currentInterface: 'eth0'
  }
}

export const Capturing: Story = {
  args: {
    connectionStatus: 'connected',
    packetCount: 1250,
    isCapturing: true,
    currentInterface: 'wlan0'
  }
}

export const HighPacketCount: Story = {
  args: {
    connectionStatus: 'connected',
    packetCount: 15750,
    isCapturing: true,
    currentInterface: 'eth0'
  }
}

export const NoInterface: Story = {
  args: {
    connectionStatus: 'connected',
    packetCount: 50,
    isCapturing: false,
    currentInterface: ''
  }
}

export const Mobile: Story = {
  args: {
    connectionStatus: 'connected',
    packetCount: 150,
    isCapturing: false,
    currentInterface: 'eth0'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile'
    }
  }
}

export const Tablet: Story = {
  args: {
    connectionStatus: 'connected',
    packetCount: 150,
    isCapturing: false,
    currentInterface: 'eth0'
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
}

// Accessibility story
export const AccessibilityTest: Story = {
  args: {
    connectionStatus: 'connected',
    packetCount: 150,
    isCapturing: false,
    currentInterface: 'eth0'
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'focus-management', enabled: true },
          { id: 'aria-labels', enabled: true }
        ]
      }
    }
  }
}

// Interactive story for testing functionality
export const Interactive: Story = {
  args: {
    connectionStatus: 'connected',
    packetCount: 150,
    isCapturing: false,
    currentInterface: 'eth0'
  },
  play: async ({ canvasElement, step }) => {
    // This would contain interactions for testing
    // Using @storybook/addon-interactions
  }
}