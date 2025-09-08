// Premium Netflix-inspired theme configuration for Wireshark+ Web Dashboard
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
    // Premium Netflix-inspired color palette
    netflix: {
      red: '#E50914',
      darkRed: '#B20710',
      crimson: '#DC143C',
      black: '#0A0A0A',
      darkGray: '#141414',
      mediumGray: '#1F1F1F',
      lightGray: '#2F2F2F',
      silver: '#B3B3B3',
      white: '#FFFFFF',
      accent: '#00D4FF',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    },
    // Premium Wireshark brand colors with cinematic styling
    wireshark: {
      primary: '#1E40AF',
      secondary: '#3B82F6',
      accent: '#06B6D4',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      dark: '#0F172A',
      darker: '#020617',
      blue: '#61dafb',
      darkBlue: '#1e40af',
      green: '#10b981',
      orange: '#f59e0b',
      red: '#ef4444',
      yellow: '#fbbf24',
      neon: '#00FFFF',
      electric: '#7DF9FF',
      plasma: '#FF6EC7',
      quantum: '#9D4EDD',
    },
    // Cinematic gradient colors
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      error: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      dark: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      netflix: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
      netflixHero: 'linear-gradient(45deg, #E50914 0%, #DC143C 50%, #B20710 100%)',
      wiresharkNeon: 'linear-gradient(135deg, #06B6D4 0%, #00FFFF 50%, #7DF9FF 100%)',
      cyberpunk: 'linear-gradient(135deg, #9D4EDD 0%, #FF6EC7 50%, #00FFFF 100%)',
      matrix: 'linear-gradient(135deg, #0A0A0A 0%, #1E40AF 50%, #06B6D4 100%)',
      hologram: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(157, 78, 221, 0.3) 50%, rgba(255, 110, 199, 0.3) 100%)',
    },
    // WCAG AA compliant colors
    accessible: {
      // Light mode colors with 4.5:1 contrast ratio
      lightText: '#1a202c',
      lightTextSecondary: '#4a5568',
      lightBg: '#ffffff',
      lightBgSecondary: '#f7fafc',
      
      // Dark mode colors with 4.5:1 contrast ratio  
      darkText: '#f7fafc',
      darkTextSecondary: '#cbd5e0',
      darkBg: '#1a202c',
      darkBgSecondary: '#2d3748',
      
      // Status colors with proper contrast
      success: '#38a169',
      warning: '#d69e2e',
      error: '#e53e3e',
      info: '#3182ce',
    }
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
  },
  // Premium cinematic global styles
  styles: {
    global: (props) => ({
      '@keyframes float': {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-10px)' },
      },
      '@keyframes glow': {
        '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
        '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' },
      },
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.7 },
      },
      '@keyframes slideInFromLeft': {
        '0%': { transform: 'translateX(-100%)', opacity: 0 },
        '100%': { transform: 'translateX(0)', opacity: 1 },
      },
      '@keyframes slideInFromRight': {
        '0%': { transform: 'translateX(100%)', opacity: 0 },
        '100%': { transform: 'translateX(0)', opacity: 1 },
      },
      '@keyframes fadeInUp': {
        '0%': { transform: 'translateY(30px)', opacity: 0 },
        '100%': { transform: 'translateY(0)', opacity: 1 },
      },
      '@keyframes scaleIn': {
        '0%': { transform: 'scale(0.8)', opacity: 0 },
        '100%': { transform: 'scale(1)', opacity: 1 },
      },
      '@keyframes shimmer': {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
      body: {
        bg: props.colorMode === 'dark' ? 'netflix.black' : 'white',
        color: props.colorMode === 'dark' ? 'netflix.white' : 'gray.800',
        fontFamily: 'body',
        lineHeight: 'base',
        overflow: 'hidden auto',
        position: 'relative',
      },
      // Custom scrollbar styling
      '*': {
        scrollbarWidth: 'thin',
        scrollbarColor: 'netflix.mediumGray netflix.black',
      },
      '*::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '*::-webkit-scrollbar-track': {
        background: 'netflix.black',
        borderRadius: '4px',
      },
      '*::-webkit-scrollbar-thumb': {
        background: 'netflix.mediumGray',
        borderRadius: '4px',
        border: '2px solid',
        borderColor: 'netflix.black',
      },
      '*::-webkit-scrollbar-thumb:hover': {
        background: 'netflix.lightGray',
      },
      // Enhanced focus styles for accessibility
      '*:focus': {
        outline: '2px solid',
        outlineColor: 'wireshark.accent',
        outlineOffset: '2px',
      },
      // Skip link styles
      '.skip-link': {
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: 'wireshark.primary',
        color: 'white',
        padding: '8px',
        textDecoration: 'none',
        borderRadius: '4px',
        zIndex: 9999,
        _focus: {
          top: '6px'
        }
      },
      // Premium smooth animations
      '*': {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Cinematic background effects
      'body::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(229, 9, 20, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(157, 78, 221, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: -1,
      },
    }),
  },
  // Premium component style overrides
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        _focus: {
          boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.5)',
        },
        _before: {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          transition: 'left 0.5s',
        },
        _hover: {
          _before: {
            left: '100%',
          },
        },
      },
      variants: {
        netflix: {
          bg: 'linear-gradient(135deg, #E50914 0%, #DC143C 50%, #B20710 100%)',
          color: 'white',
          boxShadow: '0 4px 15px rgba(229, 9, 20, 0.3)',
          _hover: {
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: '0 8px 25px rgba(229, 9, 20, 0.5)',
          },
          _active: {
            transform: 'translateY(0) scale(1)',
          },
        },
        netflixSecondary: {
          bg: 'rgba(255, 255, 255, 0.1)',
          color: 'netflix.white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          },
        },
        wireshark: {
          bg: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #06B6D4 100%)',
          color: 'white',
          boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)',
          _hover: {
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: '0 8px 25px rgba(30, 64, 175, 0.5)',
          },
        },
        neon: {
          bg: 'transparent',
          color: 'wireshark.neon',
          border: '2px solid',
          borderColor: 'wireshark.neon',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          _hover: {
            bg: 'wireshark.neon',
            color: 'netflix.black',
            transform: 'translateY(-2px)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
          },
        },
        ghost: {
          bg: 'transparent',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateY(-1px)',
            backdropFilter: 'blur(10px)',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '16px',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          _before: {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
          },
        },
      },
      variants: {
        netflix: {
          container: {
            bg: 'rgba(20, 20, 20, 0.9)',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            _hover: {
              transform: 'translateY(-4px) scale(1.01)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8)',
              borderColor: 'rgba(6, 182, 212, 0.3)',
            },
          },
        },
        elevated: {
          container: {
            bg: 'rgba(31, 31, 31, 0.95)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            _hover: {
              transform: 'translateY(-6px) scale(1.02)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
              borderColor: 'rgba(229, 9, 20, 0.3)',
            },
          },
        },
        glass: {
          container: {
            bg: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            _hover: {
              bg: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
            },
          },
        },
        hologram: {
          container: {
            bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(157, 78, 221, 0.1) 50%, rgba(255, 110, 199, 0.1) 100%)',
            backdropFilter: 'blur(25px)',
            border: '1px solid',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            boxShadow: '0 0 40px rgba(6, 182, 212, 0.2)',
            _hover: {
              boxShadow: '0 0 60px rgba(6, 182, 212, 0.4)',
              borderColor: 'rgba(6, 182, 212, 0.5)',
              transform: 'translateY(-3px)',
            },
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
        letterSpacing: '-0.025em',
        fontFamily: 'heading',
      },
    },
    Text: {
      baseStyle: {
        lineHeight: '1.6',
        fontFamily: 'body',
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: '6px',
        fontWeight: 'semibold',
        fontSize: 'xs',
        px: 2,
        py: 1,
      },
    },
  },
  // Premium cinematic shadows
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
    hologram: '0 0 60px rgba(157, 78, 221, 0.3)',
    premium: '0 20px 60px rgba(0, 0, 0, 0.5)',
    cinematic: '0 25px 80px rgba(0, 0, 0, 0.6)',
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