import { useRef, useCallback, useEffect, useState } from 'react'
import { focusUtils, keyboardUtils } from '../utils/a11y'

// Enhanced focus management and keyboard navigation hook
export const useFocusManagement = (options = {}) => {
  const {
    trapFocus = false,
    restoreFocus = true,
    enableEscapeKey = true,
    enableArrowKeys = true,
    skipLinks = true,
    roving = false,
    autoFocus = null, // element selector or ref
    onEscapeKey = null,
    onFocusChange = null,
    containerRef = null,
    debug = false
  } = options

  const [currentFocusIndex, setCurrentFocusIndex] = useState(0)
  const [focusableElements, setFocusableElements] = useState([])
  const lastFocusedElement = useRef(null)
  const focusManagerRef = useRef(null)
  const isActiveRef = useRef(false)

  // Store last focused element when trap becomes active
  const storePreviousFocus = useCallback(() => {
    if (typeof document !== 'undefined') {
      lastFocusedElement.current = document.activeElement
      if (debug) console.log('Stored previous focus:', lastFocusedElement.current)
    }
  }, [debug])

  // Restore focus to previously focused element
  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && lastFocusedElement.current) {
      try {
        lastFocusedElement.current.focus()
        if (debug) console.log('Restored focus to:', lastFocusedElement.current)
      } catch (error) {
        console.warn('Failed to restore focus:', error)
      }
    }
  }, [restoreFocus, debug])

  // Get all focusable elements within container
  const getFocusableElements = useCallback(() => {
    const container = containerRef?.current || focusManagerRef.current
    if (!container) return []

    const elements = focusUtils.getFocusableElements(container)
    setFocusableElements(elements)
    
    if (debug) console.log('Found focusable elements:', elements.length)
    return elements
  }, [containerRef, debug])

  // Focus first element
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[0].focus()
      setCurrentFocusIndex(0)
      if (onFocusChange) onFocusChange(elements[0], 0)
    }
  }, [getFocusableElements, onFocusChange])

  // Focus last element
  const focusLast = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      const lastIndex = elements.length - 1
      elements[lastIndex].focus()
      setCurrentFocusIndex(lastIndex)
      if (onFocusChange) onFocusChange(elements[lastIndex], lastIndex)
    }
  }, [getFocusableElements, onFocusChange])

  // Focus next element
  const focusNext = useCallback((wrap = true) => {
    const elements = getFocusableElements()
    if (elements.length === 0) return

    let nextIndex = currentFocusIndex + 1
    
    if (nextIndex >= elements.length) {
      nextIndex = wrap ? 0 : elements.length - 1
    }

    elements[nextIndex].focus()
    setCurrentFocusIndex(nextIndex)
    if (onFocusChange) onFocusChange(elements[nextIndex], nextIndex)
  }, [currentFocusIndex, getFocusableElements, onFocusChange])

  // Focus previous element
  const focusPrevious = useCallback((wrap = true) => {
    const elements = getFocusableElements()
    if (elements.length === 0) return

    let prevIndex = currentFocusIndex - 1
    
    if (prevIndex < 0) {
      prevIndex = wrap ? elements.length - 1 : 0
    }

    elements[prevIndex].focus()
    setCurrentFocusIndex(prevIndex)
    if (onFocusChange) onFocusChange(elements[prevIndex], prevIndex)
  }, [currentFocusIndex, getFocusableElements, onFocusChange])

  // Focus element by index
  const focusByIndex = useCallback((index) => {
    const elements = getFocusableElements()
    if (index >= 0 && index < elements.length) {
      elements[index].focus()
      setCurrentFocusIndex(index)
      if (onFocusChange) onFocusChange(elements[index], index)
    }
  }, [getFocusableElements, onFocusChange])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    const { key, shiftKey, ctrlKey, metaKey, target } = event

    // Skip if modifier keys are pressed (except Shift for Tab)
    if ((ctrlKey || metaKey) && key !== 'Tab') return

    // Handle Escape key
    if (enableEscapeKey && key === 'Escape') {
      event.preventDefault()
      if (onEscapeKey) {
        onEscapeKey(event)
      } else if (trapFocus) {
        restorePreviousFocus()
      }
      return
    }

    // Handle Tab navigation for focus trapping
    if (trapFocus && key === 'Tab') {
      event.preventDefault()
      
      if (shiftKey) {
        focusPrevious()
      } else {
        focusNext()
      }
      return
    }

    // Handle arrow key navigation
    if (enableArrowKeys && !roving) {
      switch (key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault()
          focusNext(false)
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault()
          focusPrevious(false)
          break
        case 'Home':
          event.preventDefault()
          focusFirst()
          break
        case 'End':
          event.preventDefault()
          focusLast()
          break
      }
    }

    // Handle roving tabindex navigation
    if (roving && enableArrowKeys) {
      const elements = getFocusableElements()
      const currentIndex = elements.indexOf(target)
      
      if (currentIndex !== -1) {
        // Remove tabindex from all elements
        elements.forEach(el => el.setAttribute('tabindex', '-1'))
        
        let nextIndex = currentIndex
        let handled = false

        switch (key) {
          case 'ArrowDown':
          case 'ArrowRight':
            event.preventDefault()
            nextIndex = (currentIndex + 1) % elements.length
            handled = true
            break
          case 'ArrowUp':
          case 'ArrowLeft':
            event.preventDefault()
            nextIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1
            handled = true
            break
          case 'Home':
            event.preventDefault()
            nextIndex = 0
            handled = true
            break
          case 'End':
            event.preventDefault()
            nextIndex = elements.length - 1
            handled = true
            break
        }

        if (handled && elements[nextIndex]) {
          // Set tabindex and focus on target element
          elements[nextIndex].setAttribute('tabindex', '0')
          elements[nextIndex].focus()
          setCurrentFocusIndex(nextIndex)
          if (onFocusChange) onFocusChange(elements[nextIndex], nextIndex)
        }
      }
    }
  }, [
    enableEscapeKey,
    enableArrowKeys,
    trapFocus,
    roving,
    onEscapeKey,
    restorePreviousFocus,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    getFocusableElements,
    onFocusChange
  ])

  // Handle focus events to track current focus
  const handleFocus = useCallback((event) => {
    const elements = getFocusableElements()
    const index = elements.indexOf(event.target)
    
    if (index !== -1) {
      setCurrentFocusIndex(index)
      if (onFocusChange) onFocusChange(event.target, index)
    }
  }, [getFocusableElements, onFocusChange])

  // Activate focus management
  const activate = useCallback(() => {
    if (isActiveRef.current) return

    isActiveRef.current = true
    storePreviousFocus()
    
    const container = containerRef?.current || focusManagerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      container.addEventListener('focus', handleFocus, true)
      
      // Set up roving tabindex if enabled
      if (roving) {
        const elements = getFocusableElements()
        elements.forEach((el, index) => {
          el.setAttribute('tabindex', index === 0 ? '0' : '-1')
        })
      }
      
      // Auto-focus if specified
      if (autoFocus) {
        if (typeof autoFocus === 'string') {
          const element = container.querySelector(autoFocus)
          if (element) element.focus()
        } else if (autoFocus.current) {
          autoFocus.current.focus()
        }
      } else if (trapFocus) {
        focusFirst()
      }
    }
    
    if (debug) console.log('Focus management activated')
  }, [
    containerRef,
    handleKeyDown,
    handleFocus,
    roving,
    autoFocus,
    trapFocus,
    focusFirst,
    getFocusableElements,
    storePreviousFocus,
    debug
  ])

  // Deactivate focus management
  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return

    isActiveRef.current = false
    
    const container = containerRef?.current || focusManagerRef.current
    if (container) {
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('focus', handleFocus, true)
    }
    
    // Restore tabindex if roving was enabled
    if (roving) {
      const elements = getFocusableElements()
      elements.forEach(el => {
        el.removeAttribute('tabindex')
      })
    }
    
    if (trapFocus) {
      restorePreviousFocus()
    }
    
    if (debug) console.log('Focus management deactivated')
  }, [
    containerRef,
    handleKeyDown,
    handleFocus,
    roving,
    trapFocus,
    restorePreviousFocus,
    getFocusableElements,
    debug
  ])

  // Effect to handle component lifecycle
  useEffect(() => {
    if (trapFocus) {
      activate()
      return deactivate
    }
  }, [trapFocus, activate, deactivate])

  // Update focusable elements when container content changes
  useEffect(() => {
    const container = containerRef?.current || focusManagerRef.current
    if (!container) return

    const observer = new MutationObserver(() => {
      getFocusableElements()
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'aria-hidden']
    })

    return () => observer.disconnect()
  }, [containerRef, getFocusableElements])

  return {
    // Ref for the focus container
    focusManagerRef,
    
    // Control functions
    activate,
    deactivate,
    
    // Navigation functions
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusByIndex,
    
    // State
    currentFocusIndex,
    focusableElements,
    isActive: isActiveRef.current,
    
    // Utilities
    getFocusableElements,
    storePreviousFocus,
    restorePreviousFocus
  }
}

// Keyboard shortcuts manager
export const useKeyboardShortcuts = (shortcuts = {}, options = {}) => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true,
    targetRef = null,
    debug = false
  } = options

  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    const { key, code, ctrlKey, metaKey, shiftKey, altKey, target } = event
    
    // Create shortcut key
    const modifiers = []
    if (ctrlKey || metaKey) modifiers.push('ctrl')
    if (shiftKey) modifiers.push('shift')
    if (altKey) modifiers.push('alt')
    
    const shortcutKey = modifiers.length > 0 
      ? `${modifiers.join('+')}+${key.toLowerCase()}`
      : key.toLowerCase()

    const handler = shortcutsRef.current[shortcutKey] || shortcutsRef.current[code]
    
    if (handler) {
      if (preventDefault) event.preventDefault()
      if (stopPropagation) event.stopPropagation()
      
      if (debug) console.log('Keyboard shortcut triggered:', shortcutKey)
      
      handler(event, { key, code, modifiers, target })
    }
  }, [enabled, preventDefault, stopPropagation, debug])

  useEffect(() => {
    const target = targetRef?.current || document
    
    target.addEventListener('keydown', handleKeyDown)
    
    return () => {
      target.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, targetRef])

  return {
    updateShortcuts: (newShortcuts) => {
      shortcutsRef.current = newShortcuts
    },
    addShortcut: (key, handler) => {
      shortcutsRef.current[key] = handler
    },
    removeShortcut: (key) => {
      delete shortcutsRef.current[key]
    }
  }
}

// Skip links component for accessibility
export const SkipLinks = ({ links = [], className = '' }) => {
  const defaultLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' }
  ]

  const allLinks = links.length > 0 ? links : defaultLinks

  return (
    <div className={`skip-links ${className}`}>
      {allLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            const target = document.querySelector(link.href)
            if (target) {
              target.focus()
              target.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

// Focus visible indicator component
export const FocusVisibleProvider = ({ children, className = '' }) => {
  useEffect(() => {
    // Add focus-visible polyfill behavior
    let hadKeyboardEvent = true
    let keyboardThrottleTimeout = 0

    const handlePointerDown = () => {
      hadKeyboardEvent = false
    }

    const handleKeyDown = (e) => {
      if (e.metaKey || e.altKey || e.ctrlKey) return
      hadKeyboardEvent = true
    }

    const handleFocus = (e) => {
      if (hadKeyboardEvent || e.target.matches(':focus-visible')) {
        e.target.classList.add('focus-visible')
      }
    }

    const handleBlur = (e) => {
      e.target.classList.remove('focus-visible')
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handlePointerDown, true)
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('touchstart', handlePointerDown, true)
    document.addEventListener('focus', handleFocus, true)
    document.addEventListener('blur', handleBlur, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handlePointerDown, true)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('touchstart', handlePointerDown, true)
      document.removeEventListener('focus', handleFocus, true)
      document.removeEventListener('blur', handleBlur, true)
    }
  }, [])

  return <div className={`focus-visible-provider ${className}`}>{children}</div>
}

export default {
  useFocusManagement,
  useKeyboardShortcuts,
  SkipLinks,
  FocusVisibleProvider
}