import { extendTheme } from '@chakra-ui/react'
import { netflixColors, getSemanticColor, getStatusColor } from './colors.js'

// Enhanced Netflix-inspired theme with light/dark mode support
const netflixTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
    cssVarPrefix: 'netflix',
  },

  // Breakpoints
  breakpoints: {
    base: '0px',
    sm: '480px',
    md: '768px',
    lg: '992px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Typography
  fonts: {
    heading: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  },

  // Enhanced color system
  colors: {
    ...netflixColors,
    
    // Brand colors
    brand: netflixColors.red,
    
    // Semantic color mappings
    primary: netflixColors.red,
    secondary: netflixColors.wireshark,
    
    // Custom color schemes
    netflix: netflixColors.netflix,
    wireshark: netflixColors.wireshark,
  },

  // Global styles with theme awareness
  styles: {
    global: (props) => {
      const { colorMode } = props
      const isDark = colorMode === 'dark'
      
      return {
        // CSS custom properties for smooth transitions
        ':root': {
          '--transition-duration': '0.3s',
          '--transition-easing': 'cubic-bezier(0.4, 0, 0.2, 1)',
        },

        // Keyframe animations
        '@keyframes fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes slideIn': {
          '0%': { transform: 'translateX(-20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        '@keyframes glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(229, 9, 20, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(229, 9, 20, 0.6)' },
        },
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },

        // Base styles
        html: {
          scrollBehavior: 'smooth',
        },
        
        body: {
          bg: getSemanticColor(colorMode, 'bg', 'primary'),
          color: getSemanticColor(colorMode, 'text', 'primary'),
          fontFamily: 'body',
          lineHeight: 'base',
          transition: 'background-color var(--transition-duration) var(--transition-easing), color var(--transition-duration) var(--transition-easing)',
          minHeight: '100vh',
          overflowX: 'hidden',
        },

        // Enhanced scrollbar styling
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: isDark 
            ? 'rgba(255, 255, 255, 0.3) rgba(31, 31, 31, 0.8)'
            : 'rgba(0, 0, 0, 0.3) rgba(248, 250, 252, 0.8)',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: isDark ? 'rgba(31, 31, 31, 0.8)' : 'rgba(248, 250, 252, 0.8)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          borderRadius: '4px',
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          backgroundClip: 'content-box',
        },

        // Focus styles for accessibility
        '*:focus': {
          outline: '2px solid',
          outlineColor: netflixColors.wireshark.accent,
          outlineOffset: '2px',
        },

        // Selection styles
        '::selection': {
          bg: isDark ? 'rgba(229, 9, 20, 0.3)' : 'rgba(229, 9, 20, 0.2)',
          color: isDark ? netflixColors.netflix.white : netflixColors.netflix.black,
        },

        // High contrast media query support
        '@media (prefers-contrast: high)': {
          '*': {
            borderColor: isDark ? netflixColors.netflix.white : netflixColors.netflix.black,
          },
        },

        // Reduced motion support
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animation: 'none !important',
            transition: 'none !important',
          },
        },

        // Dark theme background effects
        ...(isDark && {
          'body::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(229, 9, 20, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(157, 78, 221, 0.05) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: -1,
          },
        }),
      }
    },
  },

  // Enhanced component styles
  components: {
    // Button component
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: '8px',
        transition: 'all var(--transition-duration) var(--transition-easing)',
        position: 'relative',
        overflow: 'hidden',
        _focus: {
          boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.5)',
        },
        _disabled: {
          opacity: 0.6,
          cursor: 'not-allowed',
        },
      },
      variants: {
        netflix: (props) => {
          const { colorMode } = props
          return {
            bg: netflixColors.gradients.netflix.primary,
            color: netflixColors.netflix.white,
            boxShadow: '0 4px 15px rgba(229, 9, 20, 0.3)',
            _hover: {
              transform: 'translateY(-2px) scale(1.02)',
              boxShadow: '0 8px 25px rgba(229, 9, 20, 0.5)',
              _disabled: {
                transform: 'none',
                boxShadow: '0 4px 15px rgba(229, 9, 20, 0.3)',
              },
            },
            _active: {
              transform: 'translateY(0) scale(1)',
            },
          }
        },
        netflixSecondary: (props) => {
          const { colorMode } = props
          const isDark = colorMode === 'dark'
          return {
            bg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            color: getSemanticColor(colorMode, 'text', 'primary'),
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            _hover: {
              bg: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: isDark ? '0 8px 25px rgba(0, 0, 0, 0.3)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
            },
          }
        },
        wireshark: {
          bg: netflixColors.gradients.wireshark.primary,
          color: netflixColors.netflix.white,
          boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)',
          _hover: {
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: '0 8px 25px rgba(30, 64, 175, 0.5)',
          },
        },
        ghost: (props) => {
          const { colorMode } = props
          const isDark = colorMode === 'dark'
          return {
            bg: 'transparent',
            color: getSemanticColor(colorMode, 'text', 'secondary'),
            _hover: {
              bg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              color: getSemanticColor(colorMode, 'text', 'primary'),
              transform: 'translateY(-1px)',
            },
          }
        },
      },
    },

    // Card component
    Card: {
      baseStyle: (props) => {
        const { colorMode } = props
        const isDark = colorMode === 'dark'
        return {
          container: {
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'all 0.4s var(--transition-easing)',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            bg: getSemanticColor(colorMode, 'bg', 'elevated'),
            border: '1px solid',
            borderColor: getSemanticColor(colorMode, 'border', 'primary'),
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.6)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
        }
      },
      variants: {
        netflix: (props) => {
          const { colorMode } = props
          const isDark = colorMode === 'dark'
          return {
            container: {
              bg: isDark ? 'rgba(20, 20, 20, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              boxShadow: isDark 
                ? '0 8px 32px rgba(0, 0, 0, 0.6)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              _hover: {
                transform: 'translateY(-4px) scale(1.01)',
                boxShadow: isDark 
                  ? '0 16px 48px rgba(0, 0, 0, 0.8)' 
                  : '0 16px 48px rgba(0, 0, 0, 0.2)',
                borderColor: netflixColors.wireshark.accent,
              },
            },
          }
        },
        elevated: (props) => {
          const { colorMode } = props
          const isDark = colorMode === 'dark'
          return {
            container: {
              bg: getSemanticColor(colorMode, 'bg', 'tertiary'),
              boxShadow: isDark 
                ? '0 12px 40px rgba(0, 0, 0, 0.5)' 
                : '0 12px 40px rgba(0, 0, 0, 0.15)',
              _hover: {
                transform: 'translateY(-6px) scale(1.02)',
                boxShadow: isDark 
                  ? '0 20px 60px rgba(0, 0, 0, 0.7)' 
                  : '0 20px 60px rgba(0, 0, 0, 0.25)',
                borderColor: netflixColors.red[500],
              },
            },
          }
        },
      },
    },

    // Heading component
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
        letterSpacing: '-0.025em',
        fontFamily: 'heading',
      },
    },

    // Text component
    Text: {
      baseStyle: {
        lineHeight: '1.6',
        fontFamily: 'body',
      },
    },

    // Input component
    Input: {
      baseStyle: (props) => {
        const { colorMode } = props
        const isDark = colorMode === 'dark'
        return {
          field: {
            bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            border: '1px solid',
            borderColor: getSemanticColor(colorMode, 'border', 'primary'),
            color: getSemanticColor(colorMode, 'text', 'primary'),
            _placeholder: {
              color: getSemanticColor(colorMode, 'text', 'tertiary'),
            },
            _focus: {
              borderColor: netflixColors.wireshark.accent,
              boxShadow: `0 0 0 1px ${netflixColors.wireshark.accent}`,
            },
            transition: 'all var(--transition-duration) var(--transition-easing)',
          },
        }
      },
    },

    // Modal component
    Modal: {
      baseStyle: (props) => {
        const { colorMode } = props
        return {
          dialog: {
            bg: getSemanticColor(colorMode, 'bg', 'primary'),
            border: '1px solid',
            borderColor: getSemanticColor(colorMode, 'border', 'primary'),
            boxShadow: colorMode === 'dark' 
              ? '0 25px 80px rgba(0, 0, 0, 0.6)' 
              : '0 25px 80px rgba(0, 0, 0, 0.15)',
          },
          overlay: {
            bg: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
          },
        }
      },
    },

    // Badge component
    Badge: {
      baseStyle: {
        borderRadius: '6px',
        fontWeight: 'semibold',
        fontSize: 'xs',
        px: 2,
        py: 1,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
    },

    // Alert component
    Alert: {
      baseStyle: (props) => {
        const { colorMode } = props
        return {
          container: {
            borderRadius: '12px',
            border: '1px solid',
            backdropFilter: 'blur(10px)',
          },
        }
      },
    },
  },

  // Enhanced shadows with theme awareness
  shadows: {
    netflix: '0 8px 32px rgba(0, 0, 0, 0.6)',
    netflixHover: '0 16px 48px rgba(0, 0, 0, 0.8)',
    netflixGlow: '0 0 40px rgba(229, 9, 20, 0.4)',
    wireshark: '0 8px 32px rgba(30, 64, 175, 0.3)',
    wiresharkHover: '0 16px 48px rgba(30, 64, 175, 0.5)',
    wiresharkGlow: '0 0 40px rgba(6, 182, 212, 0.4)',
    glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
    glassHover: '0 16px 48px rgba(0, 0, 0, 0.4)',
    glow: '0 0 30px rgba(6, 182, 212, 0.5)',
    glowIntense: '0 0 50px rgba(6, 182, 212, 0.7)',
    neon: '0 0 20px rgba(0, 255, 255, 0.5)',
    neonIntense: '0 0 40px rgba(0, 255, 255, 0.8)',
    premium: '0 20px 60px rgba(0, 0, 0, 0.5)',
    cinematic: '0 25px 80px rgba(0, 0, 0, 0.6)',
    // Light theme shadows
    light: '0 8px 32px rgba(0, 0, 0, 0.1)',
    lightHover: '0 16px 48px rgba(0, 0, 0, 0.15)',
    lightGlow: '0 0 30px rgba(229, 9, 20, 0.2)',
  },

  // Semantic tokens for theme-aware values
  semanticTokens: {
    colors: {
      'bg-primary': {
        default: 'white',
        _dark: 'netflix.black',
      },
      'bg-secondary': {
        default: 'gray.50',
        _dark: 'netflix.darkGray',
      },
      'bg-tertiary': {
        default: 'gray.100',
        _dark: 'netflix.mediumGray',
      },
      'text-primary': {
        default: 'gray.900',
        _dark: 'netflix.white',
      },
      'text-secondary': {
        default: 'gray.700',
        _dark: 'netflix.silver',
      },
      'border-primary': {
        default: 'gray.200',
        _dark: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
})

export default netflixTheme