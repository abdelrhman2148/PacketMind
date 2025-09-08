import type { Preview } from '@storybook/react'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'
import '../src/styles/accessibility.css'

// Netflix-inspired theme for Storybook
const netflixTheme = extendTheme({
  colors: {
    netflix: {
      black: '#000000',
      white: '#FFFFFF',
      red: '#E50914',
      silver: '#8C8C8C',
      darkGray: '#1A1A1A'
    },
    wireshark: {
      accent: '#06B6D4'
    }
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false
  },
  styles: {
    global: {
      body: {
        bg: 'netflix.black',
        color: 'netflix.white'
      }
    }
  }
})

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
        colorPrimary: '#E50914',
        colorSecondary: '#06B6D4',
        appBg: '#000000',
        appContentBg: '#1A1A1A',
        textColor: '#FFFFFF'
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