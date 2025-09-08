/**
 * AI Shark Design System - Typography System
 * Netflix-inspired typography with Wireshark network analysis theming
 */

import { designTokens } from '../tokens/designTokens'

// ===== FONT FAMILIES =====

export const fontFamilies = {
  display: '"Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  body: '"Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
}

// ===== FONT WEIGHTS =====

export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800
}

// ===== FONT SIZES =====

export const fontSizes = {
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
}

// ===== LINE HEIGHTS =====

export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2
}

// ===== LETTER SPACING =====

export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em'
}

// ===== TYPOGRAPHY SCALES =====

export const typographyScale = {
  // Display text (Hero sections, main headlines)
  display: {
    '4xl': {
      fontSize: fontSizes['8xl'],
      lineHeight: lineHeights.none,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.tight,
      fontFamily: fontFamilies.display
    },
    '3xl': {
      fontSize: fontSizes['7xl'],
      lineHeight: lineHeights.none,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.tight,
      fontFamily: fontFamilies.display
    },
    '2xl': {
      fontSize: fontSizes['6xl'],
      lineHeight: lineHeights.none,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.tight,
      fontFamily: fontFamilies.display
    },
    xl: {
      fontSize: fontSizes['5xl'],
      lineHeight: lineHeights.tight,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.tight,
      fontFamily: fontFamilies.display
    },
    lg: {
      fontSize: fontSizes['4xl'],
      lineHeight: lineHeights.tight,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.display
    },
    base: {
      fontSize: fontSizes['3xl'],
      lineHeight: lineHeights.tight,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.display
    },
    sm: {
      fontSize: fontSizes['2xl'],
      lineHeight: lineHeights.snug,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.display
    }
  },

  // Headings (Section titles, component headers)
  heading: {
    '4xl': {
      fontSize: fontSizes['5xl'],
      lineHeight: lineHeights.none,
      fontWeight: fontWeights.extrabold,
      letterSpacing: letterSpacings.tight,
      fontFamily: fontFamilies.display
    },
    '3xl': {
      fontSize: fontSizes['4xl'],
      lineHeight: lineHeights.tight,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.tight,
      fontFamily: fontFamilies.display
    },
    '2xl': {
      fontSize: fontSizes['3xl'],
      lineHeight: lineHeights.tight,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.display
    },
    xl: {
      fontSize: fontSizes['2xl'],
      lineHeight: lineHeights.snug,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.display
    },
    lg: {
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.snug,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.display
    },
    base: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.display
    },
    sm: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.display
    },
    xs: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacings.wide,
      fontFamily: fontFamilies.display
    }
  },

  // Body text (Paragraphs, descriptions)
  body: {
    '2xl': {
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.relaxed,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.body
    },
    xl: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.relaxed,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.body
    },
    lg: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.relaxed,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.body
    },
    base: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.body
    },
    sm: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.body
    }
  },

  // Labels and UI elements
  label: {
    lg: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.body
    },
    base: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.body
    },
    sm: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacings.wide,
      fontFamily: fontFamilies.body
    }
  },

  // Code and monospace text
  code: {
    lg: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.mono
    },
    base: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.mono
    },
    sm: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.snug,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.mono
    }
  },

  // Captions and small text
  caption: {
    lg: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.normal,
      fontFamily: fontFamilies.body
    },
    base: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.normal,
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacings.wide,
      fontFamily: fontFamilies.body
    }
  }
}

// ===== NETFLIX-SPECIFIC STYLES =====

export const netflixStyles = {
  // Hero section text
  hero: {
    fontSize: fontSizes['6xl'],
    lineHeight: lineHeights.none,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
    fontFamily: fontFamilies.display,
    color: designTokens.colors.neutral[0],
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
  },

  // Subtitle text
  subtitle: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.relaxed,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.body,
    color: designTokens.colors.neutral[300],
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)'
  },

  // Card titles
  cardTitle: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.display,
    color: designTokens.colors.neutral[0]
  },

  // Card descriptions
  cardDescription: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.body,
    color: designTokens.colors.neutral[400]
  },

  // Navigation text
  navText: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.wide,
    fontFamily: fontFamilies.body,
    color: designTokens.colors.neutral[300],
    textTransform: 'uppercase'
  },

  // Button text
  buttonText: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.wide,
    fontFamily: fontFamilies.body,
    textTransform: 'uppercase'
  }
}

// ===== WIRESHARK-SPECIFIC STYLES =====

export const wiresharkStyles = {
  // Protocol text
  protocolLabel: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    fontFamily: fontFamilies.mono,
    textTransform: 'uppercase'
  },

  // Packet data
  packetData: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.mono
  },

  // IP addresses
  ipAddress: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.mono,
    color: designTokens.colors.accent[500]
  },

  // Port numbers
  portNumber: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.mono,
    color: designTokens.colors.neutral[400]
  },

  // Timestamps
  timestamp: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.mono,
    color: designTokens.colors.neutral[500]
  },

  // Error messages
  errorMessage: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.body,
    color: designTokens.colors.semantic.error
  },

  // Success messages
  successMessage: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.body,
    color: designTokens.colors.semantic.success
  }
}

// ===== UTILITY FUNCTIONS =====

export const createTextStyle = (category, size = 'base') => {
  if (!typographyScale[category] || !typographyScale[category][size]) {
    console.warn(`Typography style not found: ${category}.${size}`)
    return typographyScale.body.base
  }
  return typographyScale[category][size]
}

export const getResponsiveTextStyle = (baseStyle, breakpoints = {}) => {
  return {
    ...baseStyle,
    '@media (max-width: 768px)': {
      fontSize: breakpoints.mobile?.fontSize || `calc(${baseStyle.fontSize} * 0.875)`,
      lineHeight: breakpoints.mobile?.lineHeight || baseStyle.lineHeight,
      ...breakpoints.mobile
    },
    '@media (max-width: 480px)': {
      fontSize: breakpoints.small?.fontSize || `calc(${baseStyle.fontSize} * 0.75)`,
      lineHeight: breakpoints.small?.lineHeight || baseStyle.lineHeight,
      ...breakpoints.small
    }
  }
}

export const createTruncatedStyle = (lines = 1) => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: lines,
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

export const createGlowTextStyle = (color = designTokens.colors.accent[500]) => ({
  textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`,
  color: '#FFFFFF'
})

// ===== PRESET COMBINATIONS =====

export const presetStyles = {
  // Page headers
  pageHeader: {
    ...typographyScale.heading['2xl'],
    color: designTokens.colors.neutral[0],
    marginBottom: designTokens.spacing[6]
  },

  // Section headers
  sectionHeader: {
    ...typographyScale.heading.lg,
    color: designTokens.colors.neutral[100],
    marginBottom: designTokens.spacing[4]
  },

  // Card content
  cardContent: {
    title: netflixStyles.cardTitle,
    description: netflixStyles.cardDescription
  },

  // Form elements
  formLabel: {
    ...typographyScale.label.base,
    color: designTokens.colors.neutral[200],
    marginBottom: designTokens.spacing[1]
  },

  formHelperText: {
    ...typographyScale.caption.base,
    color: designTokens.colors.neutral[400],
    marginTop: designTokens.spacing[1]
  },

  formErrorText: {
    ...typographyScale.caption.base,
    color: designTokens.colors.semantic.error,
    marginTop: designTokens.spacing[1]
  },

  // Data display
  dataLabel: wiresharkStyles.protocolLabel,
  dataValue: wiresharkStyles.packetData,

  // Navigation
  navigationItem: netflixStyles.navText,

  // Interactive elements
  buttonPrimary: {
    ...netflixStyles.buttonText,
    color: designTokens.colors.neutral[0]
  },

  buttonSecondary: {
    ...netflixStyles.buttonText,
    color: designTokens.colors.accent[500]
  },

  linkText: {
    ...typographyScale.body.base,
    color: designTokens.colors.accent[500],
    textDecoration: 'underline',
    '&:hover': {
      color: designTokens.colors.accent[400]
    }
  }
}

// ===== CSS CUSTOM PROPERTIES =====

export const typographyCSSVariables = `
  /* Typography CSS Variables */
  :root {
    /* Font Families */
    --font-display: ${fontFamilies.display};
    --font-body: ${fontFamilies.body};
    --font-mono: ${fontFamilies.mono};
    --font-system: ${fontFamilies.system};

    /* Font Weights */
    --font-weight-light: ${fontWeights.light};
    --font-weight-normal: ${fontWeights.normal};
    --font-weight-medium: ${fontWeights.medium};
    --font-weight-semibold: ${fontWeights.semibold};
    --font-weight-bold: ${fontWeights.bold};
    --font-weight-extrabold: ${fontWeights.extrabold};

    /* Font Sizes */
    --font-size-xs: ${fontSizes.xs};
    --font-size-sm: ${fontSizes.sm};
    --font-size-base: ${fontSizes.base};
    --font-size-lg: ${fontSizes.lg};
    --font-size-xl: ${fontSizes.xl};
    --font-size-2xl: ${fontSizes['2xl']};
    --font-size-3xl: ${fontSizes['3xl']};
    --font-size-4xl: ${fontSizes['4xl']};
    --font-size-5xl: ${fontSizes['5xl']};
    --font-size-6xl: ${fontSizes['6xl']};

    /* Line Heights */
    --line-height-none: ${lineHeights.none};
    --line-height-tight: ${lineHeights.tight};
    --line-height-snug: ${lineHeights.snug};
    --line-height-normal: ${lineHeights.normal};
    --line-height-relaxed: ${lineHeights.relaxed};
    --line-height-loose: ${lineHeights.loose};

    /* Letter Spacing */
    --letter-spacing-tighter: ${letterSpacings.tighter};
    --letter-spacing-tight: ${letterSpacings.tight};
    --letter-spacing-normal: ${letterSpacings.normal};
    --letter-spacing-wide: ${letterSpacings.wide};
    --letter-spacing-wider: ${letterSpacings.wider};
    --letter-spacing-widest: ${letterSpacings.widest};
  }
`

export default {
  families: fontFamilies,
  weights: fontWeights,
  sizes: fontSizes,
  lineHeights,
  letterSpacings,
  scale: typographyScale,
  netflix: netflixStyles,
  wireshark: wiresharkStyles,
  utils: {
    createTextStyle,
    getResponsiveTextStyle,
    createTruncatedStyle,
    createGlowTextStyle
  },
  presets: presetStyles,
  cssVariables: typographyCSSVariables
}