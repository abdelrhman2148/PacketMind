// Netflix-inspired color palette with comprehensive theming support
export const netflixColors = {
  // Netflix brand colors
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#E50914', // Netflix primary red
    600: '#DC143C', // Netflix secondary red
    700: '#B20710', // Netflix dark red
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Netflix grayscale palette
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Netflix specific grays
  netflix: {
    white: '#FFFFFF',
    silver: '#B3B3B3',
    lightGray: '#2F2F2F',
    mediumGray: '#1F1F1F',
    darkGray: '#141414',
    black: '#0A0A0A',
    darker: '#000000',
  },

  // Wireshark accent colors
  wireshark: {
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    // Neon variants for dark theme
    neon: '#00FFFF',
    electric: '#7DF9FF',
    plasma: '#FF6EC7',
    quantum: '#9D4EDD',
  },

  // Status colors with high contrast
  status: {
    success: {
      light: '#065f46',
      dark: '#10b981',
    },
    warning: {
      light: '#92400e',
      dark: '#f59e0b',
    },
    error: {
      light: '#dc2626',
      dark: '#ef4444',
    },
    info: {
      light: '#1e40af',
      dark: '#3b82f6',
    },
  },

  // Semantic colors for different themes
  semantic: {
    light: {
      bg: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        elevated: '#ffffff',
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        tertiary: '#64748b',
        inverse: '#ffffff',
      },
      border: {
        primary: '#e2e8f0',
        secondary: '#cbd5e1',
        tertiary: '#94a3b8',
      },
    },
    dark: {
      bg: {
        primary: '#0A0A0A',
        secondary: '#141414',
        tertiary: '#1F1F1F',
        elevated: '#2F2F2F',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#B3B3B3',
        tertiary: '#808080',
        inverse: '#0A0A0A',
      },
      border: {
        primary: 'rgba(255, 255, 255, 0.1)',
        secondary: 'rgba(255, 255, 255, 0.2)',
        tertiary: 'rgba(255, 255, 255, 0.3)',
      },
    },
  },

  // Gradients for both themes
  gradients: {
    netflix: {
      primary: 'linear-gradient(135deg, #E50914 0%, #DC143C 50%, #B20710 100%)',
      secondary: 'linear-gradient(135deg, #B20710 0%, #E50914 100%)',
      hero: 'linear-gradient(45deg, #E50914 0%, #DC143C 50%, #B20710 100%)',
    },
    wireshark: {
      primary: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #06B6D4 100%)',
      secondary: 'linear-gradient(135deg, #06B6D4 0%, #00FFFF 50%, #7DF9FF 100%)',
      neon: 'linear-gradient(135deg, #9D4EDD 0%, #FF6EC7 50%, #00FFFF 100%)',
    },
    neutral: {
      light: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    },
  },
}

// Export color utilities
export const getSemanticColor = (colorMode, category, variant = 'primary') => {
  return netflixColors.semantic[colorMode]?.[category]?.[variant] || netflixColors.netflix.white
}

export const getStatusColor = (status, colorMode) => {
  return netflixColors.status[status]?.[colorMode] || netflixColors.wireshark.info
}

export default netflixColors