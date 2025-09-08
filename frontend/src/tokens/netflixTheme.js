import { extendTheme } from '@chakra-ui/react'
import { designTokens } from './designTokens'

// Component style overrides for Netflix theme
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
      transition: 'all 0.2s',
      _focus: {
        boxShadow: `0 0 0 3px ${designTokens.colors.primary[500]}40`
      }
    },
    variants: {
      netflix: {
        bg: designTokens.colors.primary[500],
        color: 'white',
        _hover: {
          bg: designTokens.colors.primary[600],
          transform: 'translateY(-1px)',
          boxShadow: designTokens.shadows.netflix.card
        },
        _active: {
          bg: designTokens.colors.primary[700],
          transform: 'translateY(0)'
        }
      },
      netflixSecondary: {
        bg: designTokens.colors.neutral[800],
        color: designTokens.colors.neutral[100],
        border: `1px solid ${designTokens.colors.neutral[700]}`,
        _hover: {
          bg: designTokens.colors.neutral[700],
          borderColor: designTokens.colors.accent[500]
        }
      },
      ghost: {
        color: designTokens.colors.neutral[300],
        _hover: {
          bg: `${designTokens.colors.neutral[800]}80`,
          color: designTokens.colors.neutral[100]
        }
      }
    }
  },

  Card: {
    baseStyle: {
      container: {
        bg: designTokens.colors.neutral[900],
        borderRadius: 'xl',
        border: `1px solid ${designTokens.colors.neutral[800]}`,
        boxShadow: designTokens.shadows.netflix.card,
        transition: 'all 0.3s ease'
      }
    },
    variants: {
      netflix: {
        container: {
          bg: designTokens.colors.neutral[950],
          borderColor: designTokens.colors.neutral[800],
          _hover: {
            borderColor: designTokens.colors.accent[500],
            boxShadow: designTokens.shadows.netflix.elevated
          }
        }
      },
      elevated: {
        container: {
          bg: designTokens.colors.neutral[900],
          boxShadow: designTokens.shadows.netflix.elevated,
          borderColor: designTokens.colors.neutral[700]
        }
      }
    }
  },

  Input: {
    baseStyle: {
      field: {
        bg: designTokens.colors.neutral[900],
        borderColor: designTokens.colors.neutral[700],
        color: designTokens.colors.neutral[100],
        _placeholder: {
          color: designTokens.colors.neutral[500]
        },
        _focus: {
          borderColor: designTokens.colors.accent[500],
          boxShadow: `0 0 0 1px ${designTokens.colors.accent[500]}`
        },
        _hover: {
          borderColor: designTokens.colors.neutral[600]
        }
      }
    }
  },

  Table: {
    baseStyle: {
      table: {
        bg: designTokens.colors.neutral[950]
      },
      th: {
        bg: designTokens.colors.neutral[900],
        borderColor: designTokens.colors.neutral[800],
        color: designTokens.colors.neutral[300],
        fontWeight: 'semibold',
        textTransform: 'uppercase',
        letterSpacing: 'wide',
        fontSize: 'xs'
      },
      td: {
        borderColor: designTokens.colors.neutral[800],
        color: designTokens.colors.neutral[200]
      },
      tbody: {
        tr: {
          _hover: {
            bg: `${designTokens.colors.neutral[800]}50`
          }
        }
      }
    }
  },

  Badge: {
    baseStyle: {
      fontWeight: 'medium',
      fontSize: 'xs',
      px: 2,
      py: 1,
      borderRadius: 'md'
    },
    variants: {
      protocol: (props) => {
        const { colorScheme } = props
        const protocolColors = designTokens.colors.protocol
        const color = protocolColors[colorScheme] || designTokens.colors.accent[500]
        
        return {
          bg: `${color}20`,
          color: color,
          border: `1px solid ${color}40`
        }
      }
    }
  },

  Modal: {
    baseStyle: {
      dialog: {
        bg: designTokens.colors.neutral[950],
        borderRadius: '2xl',
        border: `1px solid ${designTokens.colors.neutral[800]}`,
        boxShadow: designTokens.shadows.netflix.modal
      },
      header: {
        color: designTokens.colors.neutral[100],
        fontWeight: 'bold'
      },
      body: {
        color: designTokens.colors.neutral[200]
      },
      overlay: {
        bg: 'blackAlpha.800',
        backdropFilter: 'blur(4px)'
      }
    }
  },

  Tooltip: {
    baseStyle: {
      bg: designTokens.colors.neutral[800],
      color: designTokens.colors.neutral[100],
      borderRadius: 'md',
      fontSize: 'sm',
      px: 3,
      py: 2,
      boxShadow: designTokens.shadows.lg
    }
  }
}

// Global styles
const styles = {
  global: {
    body: {
      bg: designTokens.colors.neutral[1000],
      color: designTokens.colors.neutral[100],
      fontFamily: designTokens.typography.fonts.body
    },
    '*::placeholder': {
      color: designTokens.colors.neutral[500]
    },
    '*, *::before, &::after': {
      borderColor: designTokens.colors.neutral[700]
    },
    // Scrollbar styling
    '::-webkit-scrollbar': {
      width: '8px'
    },
    '::-webkit-scrollbar-track': {
      bg: designTokens.colors.neutral[900]
    },
    '::-webkit-scrollbar-thumb': {
      bg: designTokens.colors.neutral[700],
      borderRadius: 'full'
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: designTokens.colors.neutral[600]
    }
  }
}

// Create the Netflix theme
export const netflixTheme = extendTheme({
  colors: {
    netflix: {
      black: designTokens.colors.neutral[1000],
      white: designTokens.colors.neutral[0],
      red: designTokens.colors.primary[500],
      darkRed: designTokens.colors.primary[700],
      silver: designTokens.colors.neutral[400],
      darkGray: designTokens.colors.neutral[800],
      gray: designTokens.colors.neutral[700]
    },
    wireshark: {
      accent: designTokens.colors.accent[500],
      accentDark: designTokens.colors.accent[600],
      accentLight: designTokens.colors.accent[400]
    },
    protocol: designTokens.colors.protocol,
    status: designTokens.colors.status,
    semantic: designTokens.colors.semantic
  },

  fonts: {
    heading: designTokens.typography.fonts.display,
    body: designTokens.typography.fonts.body,
    mono: designTokens.typography.fonts.mono
  },

  fontSizes: designTokens.typography.fontSize,
  fontWeights: designTokens.typography.fontWeight,
  lineHeights: designTokens.typography.lineHeight,
  letterSpacings: designTokens.typography.letterSpacing,

  space: designTokens.spacing,
  sizes: designTokens.spacing,

  radii: designTokens.borderRadius,
  shadows: {
    ...designTokens.shadows,
    outline: `0 0 0 3px ${designTokens.colors.accent[500]}40`
  },

  breakpoints: designTokens.breakpoints,
  zIndices: designTokens.zIndex,

  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false
  },

  styles,
  components,

  // Custom semantic tokens
  semanticTokens: {
    colors: {
      'chakra-body-text': designTokens.colors.neutral[100],
      'chakra-body-bg': designTokens.colors.neutral[1000],
      'chakra-border-color': designTokens.colors.neutral[700],
      'chakra-placeholder-color': designTokens.colors.neutral[500]
    }
  }
})

export default netflixTheme