import React, { createContext, useContext, useEffect } from 'react'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { createSystem } from '@chakra-ui/react'
import netflixTheme from '../theme/netflix-theme.js'
import useTheme from '../hooks/useTheme.js'

// Create theme context
const ThemeContext = createContext()

// Create Chakra system with Netflix theme
const system = createSystem(netflixTheme)

// Theme provider component
export const NetflixThemeProvider = ({ children }) => {
  const themeControls = useTheme()

  // Apply theme-specific CSS classes to body
  useEffect(() => {
    const { isDark, colorMode } = themeControls
    
    // Add theme classes to body
    document.body.className = `theme-${colorMode} ${isDark ? 'dark-theme' : 'light-theme'}`
    
    // Apply theme-specific styles
    if (isDark) {
      document.body.style.background = 'linear-gradient(135deg, #0A0A0A 0%, #141414 100%)'
    } else {
      document.body.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
    }
    
    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0A0A0A' : '#ffffff')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = isDark ? '#0A0A0A' : '#ffffff'
      document.head.appendChild(meta)
    }
  }, [themeControls.isDark, themeControls.colorMode])

  // Handle high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    
    const handleContrastChange = (e) => {
      if (e.matches) {
        document.body.classList.add('high-contrast')
      } else {
        document.body.classList.remove('high-contrast')
      }
    }
    
    mediaQuery.addEventListener('change', handleContrastChange)
    handleContrastChange(mediaQuery) // Set initial state
    
    return () => {
      mediaQuery.removeEventListener('change', handleContrastChange)
    }
  }, [])

  // Handle reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleMotionChange = (e) => {
      if (e.matches) {
        document.body.classList.add('reduced-motion')
      } else {
        document.body.classList.remove('reduced-motion')
      }
    }
    
    mediaQuery.addEventListener('change', handleMotionChange)
    handleMotionChange(mediaQuery) // Set initial state
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  return (
    <ThemeContext.Provider value={themeControls}>
      <ChakraProvider value={system}>
        {children}
      </ChakraProvider>
    </ThemeContext.Provider>
  )
}

// Hook to use theme context
export const useNetflixTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useNetflixTheme must be used within a NetflixThemeProvider')
  }
  return context
}

// Theme toggle component
export const ThemeToggle = ({ 
  size = 'md', 
  variant = 'ghost',
  showLabel = true,
  iconOnly = false 
}) => {
  const { colorMode, smoothToggleTheme, isDark } = useNetflixTheme()

  const themeIcon = isDark ? '☀️' : '🌙'
  const themeLabel = isDark ? 'Light Mode' : 'Dark Mode'

  if (iconOnly) {
    return (
      <button
        onClick={smoothToggleTheme}
        className="theme-toggle-icon"
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: size === 'sm' ? '1.2rem' : size === 'lg' ? '2rem' : '1.5rem',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={themeLabel}
        aria-label={themeLabel}
      >
        {themeIcon}
      </button>
    )
  }

  return (
    <button
      onClick={smoothToggleTheme}
      className={`theme-toggle theme-toggle-${variant}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        color: isDark ? '#ffffff' : '#000000',
        cursor: 'pointer',
        fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
        fontWeight: '500',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.backgroundColor = isDark 
          ? 'rgba(255, 255, 255, 0.2)' 
          : 'rgba(0, 0, 0, 0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.backgroundColor = isDark 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.1)'
      }}
      title={themeLabel}
      aria-label={themeLabel}
    >
      <span style={{ fontSize: '1.2em' }}>{themeIcon}</span>
      {showLabel && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  )
}

// Color mode script for initial theme
export const ThemeScript = () => (
  <ColorModeScript initialColorMode={netflixTheme.config.initialColorMode} />
)

export default NetflixThemeProvider