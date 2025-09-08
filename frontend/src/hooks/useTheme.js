import { useState, useEffect, useCallback } from 'react'
import { useColorMode } from '@chakra-ui/react'

const THEME_STORAGE_KEY = 'ai-shark-theme-preference'
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'

export const useTheme = () => {
  const { colorMode, setColorMode, toggleColorMode } = useColorMode()
  const [systemPreference, setSystemPreference] = useState('dark')
  const [themePreference, setThemePreference] = useState('dark')
  const [isSystemTheme, setIsSystemTheme] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setThemePreference(parsed.preference || 'dark')
        setIsSystemTheme(parsed.useSystem || false)
        
        if (parsed.useSystem) {
          // Use system preference
          const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY)
          const systemMode = mediaQuery.matches ? 'dark' : 'light'
          setSystemPreference(systemMode)
          setColorMode(systemMode)
        } else {
          // Use stored preference
          setColorMode(parsed.preference || 'dark')
        }
      } catch (error) {
        console.warn('Failed to parse stored theme preference:', error)
        setColorMode('dark')
      }
    } else {
      // No stored preference, use system default (dark for Netflix theme)
      setColorMode('dark')
      setThemePreference('dark')
    }
  }, [setColorMode])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY)
    
    const handleSystemThemeChange = (e) => {
      const newSystemPreference = e.matches ? 'dark' : 'light'
      setSystemPreference(newSystemPreference)
      
      if (isSystemTheme) {
        setColorMode(newSystemPreference)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    // Set initial system preference
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light')

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [isSystemTheme, setColorMode])

  // Save theme preference to localStorage
  const saveThemePreference = useCallback((preference, useSystem = false) => {
    const themeData = {
      preference,
      useSystem,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeData))
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }, [])

  // Set theme with persistence
  const setTheme = useCallback((theme) => {
    if (theme === 'system') {
      setIsSystemTheme(true)
      setColorMode(systemPreference)
      saveThemePreference(systemPreference, true)
    } else {
      setIsSystemTheme(false)
      setThemePreference(theme)
      setColorMode(theme)
      saveThemePreference(theme, false)
    }
  }, [systemPreference, setColorMode, saveThemePreference])

  // Enhanced toggle with smooth transitions
  const smoothToggleTheme = useCallback(() => {
    const newMode = colorMode === 'dark' ? 'light' : 'dark'
    
    // Add transition class to body for smooth color changes
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    
    setTheme(newMode)
    
    // Remove transition after animation completes
    setTimeout(() => {
      document.body.style.transition = ''
    }, 300)
  }, [colorMode, setTheme])

  // Get current effective theme
  const effectiveTheme = isSystemTheme ? systemPreference : themePreference

  // Theme utilities
  const isDark = colorMode === 'dark'
  const isLight = colorMode === 'light'

  // Get theme-specific values
  const getThemeValue = useCallback((lightValue, darkValue) => {
    return isDark ? darkValue : lightValue
  }, [isDark])

  // CSS custom properties for dynamic theming
  const getCSSVariables = useCallback(() => {
    if (isDark) {
      return {
        '--bg-primary': '#0A0A0A',
        '--bg-secondary': '#141414',
        '--bg-tertiary': '#1F1F1F',
        '--bg-elevated': '#2F2F2F',
        '--text-primary': '#FFFFFF',
        '--text-secondary': '#B3B3B3',
        '--text-tertiary': '#808080',
        '--border-primary': 'rgba(255, 255, 255, 0.1)',
        '--border-secondary': 'rgba(255, 255, 255, 0.2)',
        '--netflix-red': '#E50914',
        '--wireshark-accent': '#06B6D4',
        '--shadow-color': 'rgba(0, 0, 0, 0.8)',
      }
    } else {
      return {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-tertiary': '#f1f5f9',
        '--bg-elevated': '#ffffff',
        '--text-primary': '#0f172a',
        '--text-secondary': '#475569',
        '--text-tertiary': '#64748b',
        '--border-primary': '#e2e8f0',
        '--border-secondary': '#cbd5e1',
        '--netflix-red': '#E50914',
        '--wireshark-accent': '#1E40AF',
        '--shadow-color': 'rgba(0, 0, 0, 0.1)',
      }
    }
  }, [isDark])

  // Apply CSS variables to document
  useEffect(() => {
    const variables = getCSSVariables()
    const root = document.documentElement
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }, [getCSSVariables])

  // Accessibility helpers
  const getContrastColor = useCallback((backgroundColor) => {
    // Simple contrast calculation for accessibility
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    
    return brightness > 128 ? '#000000' : '#FFFFFF'
  }, [])

  // Theme status
  const themeStatus = {
    current: colorMode,
    preference: themePreference,
    isSystem: isSystemTheme,
    systemPreference,
    effectiveTheme,
    isDark,
    isLight,
  }

  return {
    // Current state
    colorMode,
    isDark,
    isLight,
    themeStatus,
    
    // Theme controls
    setTheme,
    toggleColorMode,
    smoothToggleTheme,
    
    // Utilities
    getThemeValue,
    getCSSVariables,
    getContrastColor,
    
    // System integration
    systemPreference,
    isSystemTheme,
  }
}

export default useTheme