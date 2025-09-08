import { renderHook, act } from '@testing-library/react'
import { useAccessibility } from '../useAccessibility'

// Mock screen reader announcements
const mockAnnounce = jest.fn()
jest.mock('../utils/a11y', () => ({
  screenReaderUtils: {
    announce: mockAnnounce,
    isScreenReaderActive: () => true
  },
  focusUtils: {
    getFocusableElements: () => [],
    trapFocus: jest.fn(),
    restoreFocus: jest.fn()
  },
  ariaUtils: {
    generateId: () => 'test-id',
    createAriaLabel: (text) => text
  },
  colorUtils: {
    getContrastRatio: () => 4.5,
    isWCAGCompliant: () => true
  }
}))

describe('useAccessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock user preferences
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce') ? false : true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  describe('Initialization', () => {
    it('initializes with default options', () => {
      const { result } = renderHook(() => useAccessibility())
      
      expect(result.current).toHaveProperty('announceToScreenReader')
      expect(result.current).toHaveProperty('manageFocus')
      expect(result.current).toHaveProperty('enhanceForScreenReader')
      expect(result.current).toHaveProperty('keyboardNavigation')
    })

    it('applies custom options', () => {
      const options = {
        enableKeyboardTraps: true,
        enableFocusManagement: true,
        enableScreenReaderSupport: true
      }
      
      const { result } = renderHook(() => useAccessibility(options))
      
      expect(result.current).toBeDefined()
    })

    it('detects user preferences correctly', () => {
      const { result } = renderHook(() => useAccessibility())
      
      expect(result.current.userPreferences).toEqual({
        prefersReducedMotion: false,
        prefersHighContrast: true,
        prefersDarkMode: true
      })
    })
  })

  describe('Screen Reader Support', () => {
    it('announces messages to screen reader', () => {
      const { result } = renderHook(() => useAccessibility({
        enableScreenReaderSupport: true
      }))
      
      act(() => {
        result.current.announceToScreenReader('Test announcement')
      })
      
      expect(mockAnnounce).toHaveBeenCalledWith('Test announcement', 'polite')
    })

    it('announces urgent messages with assertive priority', () => {
      const { result } = renderHook(() => useAccessibility({
        enableScreenReaderSupport: true
      }))
      
      act(() => {
        result.current.announceToScreenReader('Urgent message', 'assertive')
      })
      
      expect(mockAnnounce).toHaveBeenCalledWith('Urgent message', 'assertive')
    })

    it('does not announce when screen reader support is disabled', () => {
      const { result } = renderHook(() => useAccessibility({
        enableScreenReaderSupport: false
      }))
      
      act(() => {
        result.current.announceToScreenReader('Test announcement')
      })
      
      expect(mockAnnounce).not.toHaveBeenCalled()
    })
  })

  describe('Focus Management', () => {
    let mockElement

    beforeEach(() => {
      mockElement = {
        focus: jest.fn(),
        blur: jest.fn(),
        getAttribute: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
      
      document.querySelector = jest.fn(() => mockElement)
      document.getElementById = jest.fn(() => mockElement)
    })

    it('manages focus correctly', () => {
      const { result } = renderHook(() => useAccessibility({
        enableFocusManagement: true
      }))
      
      act(() => {
        result.current.manageFocus.focus('#test-element')
      })
      
      expect(document.querySelector).toHaveBeenCalledWith('#test-element')
      expect(mockElement.focus).toHaveBeenCalled()
    })

    it('restores previous focus', () => {
      const { result } = renderHook(() => useAccessibility({
        enableFocusManagement: true
      }))
      
      act(() => {
        result.current.manageFocus.focus('#test-element')
        result.current.manageFocus.restorePrevious()
      })
      
      expect(mockElement.focus).toHaveBeenCalledTimes(2)
    })

    it('traps focus in container', () => {
      const { result } = renderHook(() => useAccessibility({
        enableKeyboardTraps: true
      }))
      
      act(() => {
        result.current.manageFocus.trapInContainer('#container')
      })
      
      expect(document.querySelector).toHaveBeenCalledWith('#container')
    })
  })

  describe('Keyboard Navigation', () => {
    it('provides keyboard navigation utilities', () => {
      const { result } = renderHook(() => useAccessibility())
      
      expect(result.current.keyboardNavigation).toHaveProperty('handleKeyDown')
      expect(result.current.keyboardNavigation).toHaveProperty('addShortcut')
      expect(result.current.keyboardNavigation).toHaveProperty('removeShortcut')
    })

    it('handles keyboard events', () => {
      const mockHandler = jest.fn()
      const { result } = renderHook(() => useAccessibility())
      
      act(() => {
        result.current.keyboardNavigation.addShortcut('Enter', mockHandler)
      })
      
      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      }
      
      act(() => {
        result.current.keyboardNavigation.handleKeyDown(mockEvent)
      })
      
      expect(mockHandler).toHaveBeenCalledWith(mockEvent)
    })

    it('removes keyboard shortcuts', () => {
      const mockHandler = jest.fn()
      const { result } = renderHook(() => useAccessibility())
      
      act(() => {
        result.current.keyboardNavigation.addShortcut('Enter', mockHandler)
        result.current.keyboardNavigation.removeShortcut('Enter')
      })
      
      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      }
      
      act(() => {
        result.current.keyboardNavigation.handleKeyDown(mockEvent)
      })
      
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('ARIA Enhancement', () => {
    let mockElement

    beforeEach(() => {
      mockElement = {
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        removeAttribute: jest.fn()
      }
      
      document.querySelector = jest.fn(() => mockElement)
    })

    it('enhances elements for screen readers', () => {
      const { result } = renderHook(() => useAccessibility())
      
      act(() => {
        result.current.enhanceForScreenReader('#test-element', {
          label: 'Test label',
          role: 'button',
          description: 'Test description'
        })
      })
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Test label')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('role', 'button')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-describedby', expect.any(String))
    })

    it('removes ARIA attributes when enhancement is cleared', () => {
      const { result } = renderHook(() => useAccessibility())
      
      act(() => {
        result.current.enhanceForScreenReader('#test-element', null)
      })
      
      expect(mockElement.removeAttribute).toHaveBeenCalledWith('aria-label')
      expect(mockElement.removeAttribute).toHaveBeenCalledWith('role')
    })
  })

  describe('User Preferences', () => {
    it('detects reduced motion preference', () => {
      // Mock reduced motion preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }))
      
      const { result } = renderHook(() => useAccessibility())
      
      expect(result.current.userPreferences.prefersReducedMotion).toBe(true)
    })

    it('detects high contrast preference', () => {
      // Mock high contrast preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }))
      
      const { result } = renderHook(() => useAccessibility())
      
      expect(result.current.userPreferences.prefersHighContrast).toBe(true)
    })

    it('updates preferences when media queries change', () => {
      let mediaQueryCallback
      
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            mediaQueryCallback = callback
          }
        }),
        removeEventListener: jest.fn()
      }))
      
      const { result } = renderHook(() => useAccessibility())
      
      expect(result.current.userPreferences.prefersReducedMotion).toBe(false)
      
      // Simulate media query change
      act(() => {
        mediaQueryCallback({ matches: true })
      })
      
      expect(result.current.userPreferences.prefersReducedMotion).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListener = jest.fn()
      
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener
      }))
      
      const { unmount } = renderHook(() => useAccessibility())
      
      unmount()
      
      expect(removeEventListener).toHaveBeenCalled()
    })

    it('cleans up focus traps on unmount', () => {
      const { result, unmount } = renderHook(() => useAccessibility({
        enableKeyboardTraps: true
      }))
      
      act(() => {
        result.current.manageFocus.trapInContainer('#container')
      })
      
      unmount()
      
      // Should not throw error
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('handles missing elements gracefully', () => {
      document.querySelector = jest.fn(() => null)
      
      const { result } = renderHook(() => useAccessibility())
      
      expect(() => {
        act(() => {
          result.current.manageFocus.focus('#nonexistent')
        })
      }).not.toThrow()
    })

    it('handles invalid ARIA attributes gracefully', () => {
      const mockElement = {
        setAttribute: jest.fn(() => {
          throw new Error('Invalid attribute')
        })
      }
      
      document.querySelector = jest.fn(() => mockElement)
      
      const { result } = renderHook(() => useAccessibility())
      
      expect(() => {
        act(() => {
          result.current.enhanceForScreenReader('#test', { label: 'test' })
        })
      }).not.toThrow()
    })
  })
})