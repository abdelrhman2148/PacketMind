// Design Tokens for AI Shark Netflix-Style Design System
// These tokens define the core visual properties used throughout the application

export const designTokens = {
  // ===== COLOR SYSTEM =====
  colors: {
    // Primary Netflix Brand Colors
    primary: {
      50: '#FEF2F2',   // Lightest red tint
      100: '#FEE2E2',  // Light red tint
      200: '#FECACA',  // Medium light red
      300: '#FCA5A5',  // Medium red
      400: '#F87171',  // Medium dark red
      500: '#E50914',  // Netflix Red (Primary)
      600: '#DC2626',  // Dark red
      700: '#B91C1C',  // Darker red
      800: '#991B1B',  // Very dark red
      900: '#7F1D1D'   // Darkest red
    },

    // Wireshark-inspired Accent Colors
    accent: {
      50: '#F0F9FF',   // Lightest cyan
      100: '#E0F2FE',  // Light cyan
      200: '#BAE6FD',  // Medium light cyan
      300: '#7DD3FC',  // Medium cyan
      400: '#38BDF8',  // Medium dark cyan
      500: '#06B6D4',  // Wireshark Cyan (Accent)
      600: '#0891B2',  // Dark cyan
      700: '#0E7490',  // Darker cyan
      800: '#155E75',  // Very dark cyan
      900: '#164E63'   // Darkest cyan
    },

    // Netflix Grayscale System
    neutral: {
      0: '#FFFFFF',    // Pure white
      50: '#F9FAFB',   // Lightest gray
      100: '#F3F4F6',  // Light gray
      200: '#E5E7EB',  // Medium light gray
      300: '#D1D5DB',  // Medium gray
      400: '#9CA3AF',  // Medium dark gray
      500: '#6B7280',  // Dark gray
      600: '#4B5563',  // Darker gray
      700: '#374151',  // Very dark gray
      800: '#1F2937',  // Netflix Dark Gray
      900: '#111827',  // Almost black
      950: '#0A0A0A',  // Netflix Black
      1000: '#000000'  // Pure black
    },

    // Semantic Colors
    semantic: {
      success: {
        light: '#10B981',   // Green 500
        main: '#059669',    // Green 600
        dark: '#047857'     // Green 700
      },
      warning: {
        light: '#F59E0B',   // Amber 500
        main: '#D97706',    // Amber 600
        dark: '#B45309'     // Amber 700
      },
      error: {
        light: '#EF4444',   // Red 500
        main: '#DC2626',    // Red 600
        dark: '#B91C1C'     // Red 700
      },
      info: {
        light: '#3B82F6',   // Blue 500
        main: '#2563EB',    // Blue 600
        dark: '#1D4ED8'     // Blue 700
      }
    },

    // Network Protocol Colors
    protocol: {
      tcp: '#06B6D4',     // Cyan - reliable transmission
      udp: '#10B981',     // Green - fast transmission
      http: '#F59E0B',    // Amber - web traffic
      https: '#059669',   // Dark green - secure web
      dns: '#8B5CF6',     // Purple - name resolution
      icmp: '#EF4444',    // Red - network control
      arp: '#F97316',     // Orange - address resolution
      ssh: '#6366F1',     // Indigo - secure shell
      ftp: '#EC4899',     // Pink - file transfer
      smtp: '#14B8A6'     // Teal - email
    },

    // Network Status Colors
    status: {
      connected: '#10B981',    // Green
      connecting: '#F59E0B',   // Amber
      disconnected: '#EF4444', // Red
      timeout: '#6B7280',      // Gray
      error: '#DC2626'         // Dark red
    }
  },

  // ===== SPACING SYSTEM =====
  spacing: {
    // Base unit: 4px (0.25rem)
    0: '0',           // 0px
    px: '1px',        // 1px
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem'       // 384px
  },

  // ===== TYPOGRAPHY SYSTEM =====
  typography: {
    // Font Families
    fonts: {
      display: '"Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
      body: '"Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
    },

    // Font Sizes (Netflix-inspired hierarchy)
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px
      '8xl': '6rem',    // 96px
      '9xl': '8rem'     // 128px
    },

    // Font Weights
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    },

    // Line Heights
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    },

    // Letter Spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },

  // ===== BORDER RADIUS =====
  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px'
  },

  // ===== SHADOWS =====
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 50px 100px -20px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    
    // Netflix-specific shadows
    netflix: {
      card: '0 4px 12px rgba(0, 0, 0, 0.4)',
      elevated: '0 8px 24px rgba(0, 0, 0, 0.5)',
      modal: '0 25px 50px rgba(0, 0, 0, 0.6)'
    },

    // Glow effects for UI elements
    glow: {
      red: '0 0 20px rgba(229, 9, 20, 0.5)',
      cyan: '0 0 20px rgba(6, 182, 212, 0.5)',
      green: '0 0 20px rgba(16, 185, 129, 0.5)',
      purple: '0 0 20px rgba(139, 92, 246, 0.5)'
    }
  },

  // ===== BREAKPOINTS =====
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // ===== Z-INDEX =====
  zIndex: {
    auto: 'auto',
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
    max: 2147483647
  },

  // ===== TRANSITIONS =====
  transitions: {
    // Duration
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '750ms'
    },

    // Timing Functions (Netflix-inspired)
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      netflix: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Netflix's signature easing
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // ===== OPACITY =====
  opacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1'
  }
}

export default designTokens