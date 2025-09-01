// Enhanced theme configuration for Chakra UI v3 with WCAG compliance
const theme = {
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#bae7ff',
      200: '#91d5ff',
      300: '#69c0ff',
      400: '#40a9ff',
      500: '#1890ff',
      600: '#096dd9',
      700: '#0050b3',
      800: '#003a8c',
      900: '#002766',
    },
    wireshark: {
      blue: '#61dafb',
      darkBlue: '#1e40af',
      green: '#10b981',
      orange: '#f59e0b',
      red: '#ef4444',
      yellow: '#fbbf24',
    },
    // WCAG AA compliant colors
    accessible: {
      // Light mode colors with 4.5:1 contrast ratio
      lightText: '#1a202c',      // Dark text on light backgrounds
      lightTextSecondary: '#4a5568', // Secondary text on light backgrounds
      lightBg: '#ffffff',        // Light background
      lightBgSecondary: '#f7fafc', // Secondary light background
      
      // Dark mode colors with 4.5:1 contrast ratio  
      darkText: '#f7fafc',       // Light text on dark backgrounds
      darkTextSecondary: '#cbd5e0', // Secondary text on dark backgrounds
      darkBg: '#1a202c',         // Dark background
      darkBgSecondary: '#2d3748', // Secondary dark background
      
      // Status colors with proper contrast
      success: '#38a169',        // Green with good contrast
      warning: '#d69e2e',        // Orange with good contrast
      error: '#e53e3e',          // Red with good contrast
      info: '#3182ce',           // Blue with good contrast
    }
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: true,
  },
  // Enhanced focus styles for accessibility
  styles: {
    global: {
      // Focus styles for better keyboard navigation
      '*:focus': {
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '2px',
      },
      // Skip link styles
      '.skip-link': {
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: 'blue.600',
        color: 'white',
        padding: '8px',
        textDecoration: 'none',
        borderRadius: '4px',
        zIndex: 9999,
        _focus: {
          top: '6px'
        }
      }
    }
  },
  // Responsive breakpoints
  breakpoints: {
    base: '0px',
    sm: '480px',
    md: '768px',
    lg: '992px',
    xl: '1280px',
    '2xl': '1536px',
  }
}

export default theme