import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ariaUtils,
  focusUtils,
  screenReaderUtils,
  keyboardUtils,
  motionUtils,
  preferenceUtils,
  colorUtils
} from '../utils/a11y'

// Comprehensive accessibility hook for managing all a11y features
export const useAccessibility = (options = {}) => {
  const {
    enableFocusManagement = true,
    enableKeyboardNavigation = true,
    enableScreenReaderSupport = true,
    enableMotionPreferences = true,
    enableContrastChecking = true,
    onAccessibilityChange = () => {}
  } = options

  // User preferences state
  const [userPreferences, setUserPreferences] = useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersDarkMode: false,
    prefersReducedData: false,
    prefersReducedTransparency: false
  })

  // Accessibility state
  const [accessibilityState, setAccessibilityState] = useState({
    isScreenReaderActive: false,
    currentFocusElement: null,
    keyboardNavigation: false,
    announcements: [],
    focusHistory: []
  })

  // Refs for managing accessibility features
  const focusManagerRef = useRef(null)
  const focusTrapRef = useRef(null)
  const announceTimeoutRef = useRef(null)

  // Initialize user preferences
  useEffect(() => {
    if (enableMotionPreferences) {
      const preferences = preferenceUtils.getUserPreferences()
      setUserPreferences(preferences)

      // Listen for preference changes
      const cleanup = preferenceUtils.onPreferenceChange((newPreferences) => {
        setUserPreferences(newPreferences)
        onAccessibilityChange('preferences', newPreferences)
      })

      return cleanup
    }
  }, [enableMotionPreferences, onAccessibilityChange])

  // Focus management utilities
  const focusManagement = useMemo(() => {
    if (!enableFocusManagement) return {}

    const createFocusManager = () => {
      if (!focusManagerRef.current) {
        focusManagerRef.current = focusUtils.createFocusManager()
      }
      return focusManagerRef.current
    }

    const createFocusTrap = (element) => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate()
      }
      
      if (element) {
        focusTrapRef.current = focusUtils.createFocusTrap(element)
        return focusTrapRef.current
      }
      
      return null
    }

    const saveFocus = () => {
      const manager = createFocusManager()
      manager.save()
      
      setAccessibilityState(prev => ({
        ...prev,
        focusHistory: [...prev.focusHistory, document.activeElement]
      }))
    }

    const restoreFocus = () => {
      const manager = createFocusManager()
      manager.restore()
    }

    const clearFocus = () => {
      const manager = createFocusManager()
      manager.clear()
      
      setAccessibilityState(prev => ({
        ...prev,
        focusHistory: []
      }))
    }

    return {
      createFocusManager,
      createFocusTrap,
      saveFocus,
      restoreFocus,
      clearFocus
    }
  }, [enableFocusManagement])

  // Screen reader utilities
  const screenReader = useMemo(() => {
    if (!enableScreenReaderSupport) return {}

    const announce = useCallback((message, priority = 'polite') => {
      screenReaderUtils.announce(message, priority)
      
      // Update announcements history
      setAccessibilityState(prev => ({
        ...prev,
        announcements: [
          ...prev.announcements.slice(-9), // Keep last 10 announcements
          { message, priority, timestamp: Date.now() }
        ]
      }))
      
      onAccessibilityChange('announcement', { message, priority })
    }, [])

    const announceWithDelay = useCallback((message, delay = 500, priority = 'polite') => {
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current)
      }
      
      announceTimeoutRef.current = setTimeout(() => {
        announce(message, priority)
      }, delay)
    }, [announce])

    const createScreenReaderText = (text) => {
      return screenReaderUtils.createScreenReaderText(text)
    }

    const updateScreenReaderText = (element, text) => {
      return screenReaderUtils.updateScreenReaderText(element, text)
    }

    return {
      announce,
      announceWithDelay,
      createScreenReaderText,
      updateScreenReaderText
    }
  }, [enableScreenReaderSupport, onAccessibilityChange])

  // Keyboard navigation utilities
  const keyboardNavigation = useMemo(() => {
    if (!enableKeyboardNavigation) return {}

    const createListNavigator = (items, options = {}) => {
      return keyboardUtils.createListNavigator(items, {
        ...options,
        onSelectionChange: (index, item) => {
          setAccessibilityState(prev => ({
            ...prev,
            currentFocusElement: item
          }))
          
          if (options.onSelectionChange) {
            options.onSelectionChange(index, item)
          }
          
          onAccessibilityChange('navigation', { index, item })
        }
      })
    }

    const createShortcutHandler = (shortcuts) => {
      return keyboardUtils.createShortcutHandler(shortcuts.map(shortcut => ({
        ...shortcut,
        action: (event) => {
          onAccessibilityChange('shortcut', { shortcut, event })
          shortcut.action(event)
        }
      })))
    }

    const handleKeyboardNavigation = useCallback((event) => {
      const { key, target } = event
      
      // Track keyboard usage
      if (key === 'Tab') {
        setAccessibilityState(prev => ({
          ...prev,
          keyboardNavigation: true,
          currentFocusElement: target
        }))
      }
      
      // Handle escape key globally
      if (key === 'Escape') {
        onAccessibilityChange('escape', { event, target })
      }
    }, [])

    return {
      createListNavigator,
      createShortcutHandler,
      handleKeyboardNavigation,
      keys: keyboardUtils.keys
    }
  }, [enableKeyboardNavigation, onAccessibilityChange])

  // Motion and animation utilities
  const motionManagement = useMemo(() => {
    if (!enableMotionPreferences) return {}

    const getAnimationConfig = (normalConfig, reducedConfig = {}) => {
      return motionUtils.getAnimationConfig(normalConfig, reducedConfig)
    }

    const safeAnimate = (element, keyframes, options = {}) => {
      return motionUtils.safeAnimate(element, keyframes, options)
    }

    const shouldReduceMotion = () => {
      return userPreferences.prefersReducedMotion
    }

    return {
      getAnimationConfig,
      safeAnimate,
      shouldReduceMotion,
      prefersReducedMotion: userPreferences.prefersReducedMotion
    }
  }, [enableMotionPreferences, userPreferences.prefersReducedMotion])

  // Color contrast utilities
  const contrastManagement = useMemo(() => {
    if (!enableContrastChecking) return {}

    const checkContrast = (foreground, background, isLargeText = false) => {
      return colorUtils.isWCAGCompliant(foreground, background, isLargeText)
    }

    const getAccessibleColor = (background, preferredForeground) => {
      return colorUtils.getAccessibleColor(background, preferredForeground)
    }

    const getContrastRatio = (color1, color2) => {
      return colorUtils.getContrastRatio(color1, color2)
    }

    return {
      checkContrast,
      getAccessibleColor,
      getContrastRatio,
      isWCAGCompliant: colorUtils.isWCAGCompliant,
      isWCAGAAACompliant: colorUtils.isWCAGAAACompliant
    }
  }, [enableContrastChecking])

  // ARIA utilities
  const aria = useMemo(() => ({
    generateId: ariaUtils.generateId,
    describedBy: ariaUtils.describedBy,
    labelledBy: ariaUtils.labelledBy,
    expanded: ariaUtils.expanded,
    selected: ariaUtils.selected,
    checked: ariaUtils.checked,
    disabled: ariaUtils.disabled,
    hidden: ariaUtils.hidden,
    current: ariaUtils.current,
    live: ariaUtils.live,
    atomic: ariaUtils.atomic,
    busy: ariaUtils.busy,
    table: ariaUtils.table,
    dialog: ariaUtils.dialog,
    navigation: ariaUtils.navigation,
    form: ariaUtils.form
  }), [])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate()
      }
      
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current)
      }
    }
  }, [])

  // Global keyboard event listener
  useEffect(() => {
    if (enableKeyboardNavigation && keyboardNavigation.handleKeyboardNavigation) {
      document.addEventListener('keydown', keyboardNavigation.handleKeyboardNavigation)
      
      return () => {
        document.removeEventListener('keydown', keyboardNavigation.handleKeyboardNavigation)
      }
    }
  }, [enableKeyboardNavigation, keyboardNavigation.handleKeyboardNavigation])

  return {
    // State
    userPreferences,
    accessibilityState,
    
    // Focus management
    ...focusManagement,
    
    // Screen reader support
    ...screenReader,
    
    // Keyboard navigation
    ...keyboardNavigation,
    
    // Motion management
    ...motionManagement,
    
    // Color contrast
    ...contrastManagement,
    
    // ARIA utilities
    aria,
    
    // Utility functions
    isAccessible: (element) => {
      // Basic accessibility check
      const hasAccessibleName = element.getAttribute('aria-label') ||
                               element.getAttribute('aria-labelledby') ||
                               element.textContent?.trim()
      
      const hasRole = element.getAttribute('role') || element.tagName.toLowerCase()
      
      return Boolean(hasAccessibleName && hasRole)
    },
    
    // Announce helper with common patterns
    announcePageChange: (pageName) => {
      screenReader.announce(`Navigated to ${pageName}`, 'assertive')
    },
    
    announceError: (message) => {
      screenReader.announce(`Error: ${message}`, 'assertive')
    },
    
    announceSuccess: (message) => {
      screenReader.announce(`Success: ${message}`, 'polite')
    },
    
    announceLoading: (isLoading, context = '') => {
      const message = isLoading 
        ? `Loading ${context}` 
        : `Finished loading ${context}`
      screenReader.announce(message, 'polite')
    },
    
    // High-level accessibility features
    makeElementAccessible: (element, options = {}) => {
      const {
        label,
        description,
        role,
        focusable = true,
        keyboardShortcut
      } = options
      
      if (label) {
        element.setAttribute('aria-label', label)
      }
      
      if (description) {
        const descId = ariaUtils.generateId('desc')
        const descElement = document.createElement('div')
        descElement.id = descId
        descElement.textContent = description
        descElement.className = 'sr-only'
        element.appendChild(descElement)
        element.setAttribute('aria-describedby', descId)
      }
      
      if (role) {
        element.setAttribute('role', role)
      }
      
      if (focusable && !element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0')
      }
      
      if (keyboardShortcut) {
        element.addEventListener('keydown', (event) => {
          if (event.key === keyboardShortcut.key && 
              (!keyboardShortcut.modifiers || 
               Object.keys(keyboardShortcut.modifiers).every(mod => 
                 event[`${mod}Key`] === keyboardShortcut.modifiers[mod]
               ))) {
            event.preventDefault()
            keyboardShortcut.action(event)
          }
        })
      }
    }
  }
}

// Hook for specific accessibility patterns
export const useAccessibleTable = (options = {}) => {
  const { announce } = useAccessibility({ enableScreenReaderSupport: true })
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'none' })
  
  const handleSort = useCallback((column) => {
    setSortConfig(prev => {
      const newDirection = prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
      announce(`Table sorted by ${column}, ${newDirection}ending order`)
      return { column, direction: newDirection }
    })
  }, [announce])
  
  const getTableProps = () => ({
    role: 'table',
    'aria-label': options.tableLabel || 'Data table'
  })
  
  const getHeaderProps = (column) => ({
    role: 'columnheader',
    'aria-sort': sortConfig.column === column ? sortConfig.direction : 'none',
    tabIndex: 0,
    onClick: () => handleSort(column),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleSort(column)
      }
    }
  })
  
  const getCellProps = (rowIndex, colIndex) => ({
    role: 'gridcell',
    'aria-rowindex': rowIndex + 1,
    'aria-colindex': colIndex + 1
  })
  
  return {
    sortConfig,
    getTableProps,
    getHeaderProps,
    getCellProps,
    handleSort
  }
}

// Hook for dialog accessibility
export const useAccessibleDialog = (options = {}) => {
  const { createFocusTrap, saveFocus, restoreFocus } = useAccessibility()
  const dialogRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  
  const openDialog = useCallback(() => {
    saveFocus()
    setIsOpen(true)
    
    // Create focus trap after dialog is rendered
    setTimeout(() => {
      if (dialogRef.current) {
        const trap = createFocusTrap(dialogRef.current)
        if (trap) {
          trap.activate()
        }
      }
    }, 0)
  }, [saveFocus, createFocusTrap])
  
  const closeDialog = useCallback(() => {
    setIsOpen(false)
    restoreFocus()
  }, [restoreFocus])
  
  const getDialogProps = () => ({
    ref: dialogRef,
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': options.titleId,
    'aria-describedby': options.descriptionId
  })
  
  return {
    isOpen,
    openDialog,
    closeDialog,
    getDialogProps
  }
}

// Hook for form accessibility
export const useAccessibleForm = () => {
  const { announce } = useAccessibility({ enableScreenReaderSupport: true })
  const [errors, setErrors] = useState({})
  
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
    
    if (error) {
      announce(`Error in ${fieldName}: ${error}`, 'assertive')
    }
  }, [announce])
  
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])
  
  const getFieldProps = (fieldName, label) => {
    const hasError = Boolean(errors[fieldName])
    const fieldId = `field-${fieldName}`
    const errorId = `${fieldId}-error`
    
    return {
      id: fieldId,
      'aria-label': label,
      'aria-invalid': hasError,
      'aria-describedby': hasError ? errorId : undefined
    }
  }
  
  const getErrorProps = (fieldName) => {
    const errorId = `field-${fieldName}-error`
    
    return {
      id: errorId,
      role: 'alert',
      'aria-live': 'assertive'
    }
  }
  
  return {
    errors,
    setFieldError,
    clearFieldError,
    getFieldProps,
    getErrorProps
  }
}

export default useAccessibility