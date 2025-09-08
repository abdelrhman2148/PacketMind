import type { Preview } from '@storybook/react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'
import { netflixTheme } from '../src/tokens/netflixTheme'
import '../src/tokens/tokens.css'
import '../src/styles/accessibility.css'

// Global decorator to wrap stories with providers
const withProviders = (Story: any) => React.createElement(
  BrowserRouter,
  null,
  React.createElement(
    ChakraProvider,
    { theme: netflixTheme },
    React.createElement(
      'div',
      { style: { padding: '1rem', minHeight: '100vh', backgroundColor: '#000000' } },
      React.createElement(Story)
    )
  )
)

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    backgrounds: {
      default: 'netflix-dark',
      values: [
        {
          name: 'netflix-dark',
          value: '#000000'
        },
        {
          name: 'netflix-gray',
          value: '#1A1A1A'
        },
        {
          name: 'light',
          value: '#FFFFFF'
        }
      ]
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px'
          }
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px'
          }
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px'
          }
        },
        widescreen: {
          name: 'Widescreen',
          styles: {
            width: '1920px',
            height: '1080px'
          }
        }
      }
    },
    // Accessibility addon configuration
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          },
          {
            id: 'focus-management',
            enabled: true
          }
        ]
      }
    },
    docs: {
      theme: {
        base: 'dark',
        brandTitle: 'AI Shark Design System',
        brandUrl: '/',
        colorPrimary: '#E50914', // Netflix Red
        colorSecondary: '#06B6D4', // Wireshark Cyan
        appBg: '#0A0A0A', // Deep black
        appContentBg: '#1A1A1A', // Dark gray
        appBorderColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#FFFFFF',
        textInverseColor: '#000000',
        barTextColor: '#FFFFFF',
        barSelectedColor: '#06B6D4',
        barBg: '#1F1F1F',
        inputBg: '#2A2A2A',
        inputBorder: 'rgba(255, 255, 255, 0.2)',
        inputTextColor: '#FFFFFF'
      }
    }
  },
  decorators: [withProviders],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'netflix-dark',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'netflix-dark', title: 'Netflix Dark' },
          { value: 'netflix-light', title: 'Netflix Light' },
          { value: 'high-contrast', title: 'High Contrast' }
        ],
        showName: true
      }
    },
    accessibility: {
      description: 'Accessibility features',
      defaultValue: 'enabled',
      toolbar: {
        title: 'A11y',
        icon: 'accessibility',
        items: [
          { value: 'enabled', title: 'Enabled' },
          { value: 'disabled', title: 'Disabled' },
          { value: 'enhanced', title: 'Enhanced' }
        ]
      }
    }
  }
}

export default preview