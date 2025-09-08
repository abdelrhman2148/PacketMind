// Accessibility utilities for WCAG 2.1 AA compliance

/**
 * Color contrast utilities
 */
export const colorUtils = {
  // Convert hex to RGB
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  },

  // Get relative luminance
  getRelativeLuminance: (rgb) => {
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  // Calculate contrast ratio
  getContrastRatio: (color1, color2) => {
    const rgb1 = typeof color1 === 'string' ? colorUtils.hexToRgb(color1) : color1
    const rgb2 = typeof color2 === 'string' ? colorUtils.hexToRgb(color2) : color2
    
    if (!rgb1 || !rgb2) return 1

    const lum1 = colorUtils.getRelativeLuminance(rgb1)
    const lum2 = colorUtils.getRelativeLuminance(rgb2)
    
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    
    return (lighter + 0.05) / (darker + 0.05)
  },

  // Check WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
  isWCAGCompliant: (foreground, background, isLargeText = false) => {
    const ratio = colorUtils.getContrastRatio(foreground, background)
    return ratio >= (isLargeText ? 3 : 4.5)
  },

  // Check WCAG AAA compliance (7:1 for normal text, 4.5:1 for large text)
  isWCAGAAACompliant: (foreground, background, isLargeText = false) => {
    const ratio = colorUtils.getContrastRatio(foreground, background)
    return ratio >= (isLargeText ? 4.5 : 7)
  },

  // Get accessible color suggestions
  getAccessibleColor: (background, preferredForeground = '#000000') => {
    const bgRgb = colorUtils.hexToRgb(background)
    if (!bgRgb) return preferredForeground

    // Try white first
    if (colorUtils.isWCAGCompliant('#ffffff', background)) {
      return '#ffffff'
    }

    // Try black
    if (colorUtils.isWCAGCompliant('#000000', background)) {
      return '#000000'
    }

    // Try preferred color
    if (colorUtils.isWCAGCompliant(preferredForeground, background)) {
      return preferredForeground
    }

    // Return high contrast based on background luminance
    const luminance = colorUtils.getRelativeLuminance(bgRgb)
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }
}

/**
 * ARIA utilities
 */
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix = 'a11y') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Common ARIA attribute generators
  describedBy: (id) => ({ 'aria-describedby': id }),
  labelledBy: (id) => ({ 'aria-labelledby': id }),
  expanded: (isExpanded) => ({ 'aria-expanded': isExpanded.toString() }),
  selected: (isSelected) => ({ 'aria-selected': isSelected.toString() }),
  checked: (isChecked) => ({ 'aria-checked': isChecked.toString() }),
  disabled: (isDisabled) => ({ 'aria-disabled': isDisabled.toString() }),
  hidden: (isHidden) => ({ 'aria-hidden': isHidden.toString() }),
  current: (current) => ({ 'aria-current': current }),
  live: (politeness = 'polite') => ({ 'aria-live': politeness }),
  atomic: (isAtomic = true) => ({ 'aria-atomic': isAtomic.toString() }),
  busy: (isBusy) => ({ 'aria-busy': isBusy.toString() }),

  // Table ARIA helpers
  table: {
    columnHeader: () => ({ role: 'columnheader' }),
    rowHeader: () => ({ role: 'rowheader' }),
    gridCell: () => ({ role: 'gridcell' }),
    sort: (direction) => ({ 'aria-sort': direction }), // 'ascending', 'descending', 'none'
    rowIndex: (index) => ({ 'aria-rowindex': index.toString() }),
    colIndex: (index) => ({ 'aria-colindex': index.toString() }),
    rowCount: (count) => ({ 'aria-rowcount': count.toString() }),
    colCount: (count) => ({ 'aria-colcount': count.toString() })
  },

  // Dialog ARIA helpers
  dialog: {
    modal: () => ({ role: 'dialog', 'aria-modal': 'true' }),
    alertDialog: () => ({ role: 'alertdialog', 'aria-modal': 'true' }),
    title: (id) => ({ 'aria-labelledby': id }),
    description: (id) => ({ 'aria-describedby': id })
  },

  // Navigation ARIA helpers
  navigation: {
    main: () => ({ role: 'main' }),
    navigation: () => ({ role: 'navigation' }),
    banner: () => ({ role: 'banner' }),
    contentinfo: () => ({ role: 'contentinfo' }),
    complementary: () => ({ role: 'complementary' }),
    search: () => ({ role: 'search' }),
    landmark: (label) => ({ 'aria-label': label })
  },

  // Form ARIA helpers
  form: {
    required: () => ({ 'aria-required': 'true' }),
    invalid: (isInvalid, errorId) => ({
      'aria-invalid': isInvalid.toString(),
      ...(isInvalid && errorId ? { 'aria-describedby': errorId } : {})
    }),
    errorMessage: () => ({ role: 'alert', 'aria-live': 'assertive' })
  }
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  // Focus trap implementation
  createFocusTrap: (element) => {
    if (!element) return null

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    const getFocusableElements = () => {
      return Array.from(element.querySelectorAll(focusableSelectors))
        .filter(el => !el.hasAttribute('aria-hidden'))
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    const activate = () => {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
      element.addEventListener('keydown', handleKeyDown)
    }

    const deactivate = () => {
      element.removeEventListener('keydown', handleKeyDown)
    }

    return { activate, deactivate, getFocusableElements }
  },

  // Save and restore focus
  createFocusManager: () => {
    let previousFocus = null

    return {
      save: () => {
        previousFocus = document.activeElement
      },
      restore: () => {
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus()
        }
      },
      clear: () => {
        previousFocus = null
      }
    }
  },

  // Skip link utilities
  createSkipLink: (targetId, text = 'Skip to main content') => {
    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.textContent = text
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      transform: translateY(-100%);
      transition: transform 0.3s;
    `

    skipLink.addEventListener('focus', () => {
      skipLink.style.transform = 'translateY(0)'
    })

    skipLink.addEventListener('blur', () => {
      skipLink.style.transform = 'translateY(-100%)'
    })

    return skipLink
  }
}

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
  // Announce to screen readers
  announce: (message, priority = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    
    document.body.appendChild(announcer)
    announcer.textContent = message
    
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  },

  // Create visually hidden text for screen readers
  createScreenReaderText: (text) => {
    const span = document.createElement('span')
    span.textContent = text
    span.className = 'sr-only'
    span.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    return span
  },

  // Update screen reader content
  updateScreenReaderText: (element, text) => {
    if (!element) return
    
    let srElement = element.querySelector('.sr-only')
    if (!srElement) {
      srElement = screenReaderUtils.createScreenReaderText(text)
      element.appendChild(srElement)
    } else {
      srElement.textContent = text
    }
  }
}

/**
 * Keyboard navigation utilities
 */
export const keyboardUtils = {
  // Standard key codes
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    TAB: 'Tab',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown'
  },

  // Handle keyboard navigation in lists
  createListNavigator: (items, options = {}) => {
    const {
      orientation = 'vertical',
      wrap = true,
      onSelectionChange = () => {}
    } = options

    let currentIndex = 0

    const navigate = (event) => {
      const { key } = event
      const isVertical = orientation === 'vertical'
      const nextKey = isVertical ? keyboardUtils.keys.ARROW_DOWN : keyboardUtils.keys.ARROW_RIGHT
      const prevKey = isVertical ? keyboardUtils.keys.ARROW_UP : keyboardUtils.keys.ARROW_LEFT

      switch (key) {
        case nextKey:
          event.preventDefault()
          currentIndex = wrap 
            ? (currentIndex + 1) % items.length
            : Math.min(currentIndex + 1, items.length - 1)
          break
        case prevKey:
          event.preventDefault()
          currentIndex = wrap
            ? (currentIndex - 1 + items.length) % items.length
            : Math.max(currentIndex - 1, 0)
          break
        case keyboardUtils.keys.HOME:
          event.preventDefault()
          currentIndex = 0
          break
        case keyboardUtils.keys.END:
          event.preventDefault()
          currentIndex = items.length - 1
          break
        case keyboardUtils.keys.ENTER:
        case keyboardUtils.keys.SPACE:
          event.preventDefault()
          onSelectionChange(currentIndex, items[currentIndex])
          return
        default:
          return
      }

      // Focus the new item
      if (items[currentIndex] && items[currentIndex].focus) {
        items[currentIndex].focus()
      }
      
      onSelectionChange(currentIndex, items[currentIndex])
    }

    return { navigate, getCurrentIndex: () => currentIndex, setCurrentIndex: (index) => { currentIndex = index } }
  },

  // Create keyboard shortcut handler
  createShortcutHandler: (shortcuts) => {
    return (event) => {
      const key = event.key.toLowerCase()
      const modifiers = {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      }

      for (const shortcut of shortcuts) {
        const { key: shortcutKey, modifiers: shortcutModifiers = {}, action } = shortcut
        
        if (key === shortcutKey.toLowerCase()) {
          const modifierMatch = Object.keys(shortcutModifiers).every(
            mod => modifiers[mod] === shortcutModifiers[mod]
          )
          
          if (modifierMatch) {
            event.preventDefault()
            action(event)
            break
          }
        }
      }
    }
  }
}

/**
 * Motion and animation utilities
 */
export const motionUtils = {
  // Check user's motion preferences
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Create motion-aware animation config
  getAnimationConfig: (normalConfig, reducedConfig = {}) => {
    return motionUtils.prefersReducedMotion() ? { ...normalConfig, ...reducedConfig } : normalConfig
  },

  // Safe animation wrapper
  safeAnimate: (element, keyframes, options = {}) => {
    if (motionUtils.prefersReducedMotion()) {
      // Skip animation, just apply final state
      const finalState = keyframes[keyframes.length - 1] || keyframes
      Object.assign(element.style, finalState)
      return Promise.resolve()
    }
    
    return element.animate(keyframes, options)
  }
}

/**
 * User preference utilities
 */
export const preferenceUtils = {
  // Get all user preferences
  getUserPreferences: () => {
    return {
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      prefersReducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,
      prefersReducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches
    }
  },

  // Listen to preference changes
  onPreferenceChange: (callback) => {
    const mediaQueries = [
      '(prefers-reduced-motion: reduce)',
      '(prefers-contrast: high)',
      '(prefers-color-scheme: dark)',
      '(prefers-reduced-data: reduce)',
      '(prefers-reduced-transparency: reduce)'
    ]

    const listeners = mediaQueries.map(query => {
      const mq = window.matchMedia(query)
      const handler = () => callback(preferenceUtils.getUserPreferences())
      mq.addListener(handler)
      return { mq, handler }
    })

    return () => {
      listeners.forEach(({ mq, handler }) => {
        mq.removeListener(handler)
      })
    }
  }
}

/**
 * Form accessibility utilities
 */
export const formUtils = {
  // Validate form accessibility
  validateFormAccessibility: (form) => {
    const issues = []
    
    // Check for labels
    const inputs = form.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      const id = input.id
      const hasLabel = id && form.querySelector(`label[for="${id}"]`)
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')
      
      if (!hasLabel && !hasAriaLabel) {
        issues.push(`Input missing label: ${input.type || input.tagName}`)
      }
    })

    // Check for required field indicators
    const requiredInputs = form.querySelectorAll('[required]')
    requiredInputs.forEach(input => {
      if (!input.hasAttribute('aria-required')) {
        issues.push(`Required field missing aria-required: ${input.id || input.name}`)
      }
    })

    return issues
  },

  // Create accessible error message
  createErrorMessage: (inputId, message) => {
    const errorId = `${inputId}-error`
    const errorElement = document.createElement('div')
    errorElement.id = errorId
    errorElement.className = 'error-message'
    errorElement.textContent = message
    errorElement.setAttribute('role', 'alert')
    errorElement.setAttribute('aria-live', 'assertive')
    
    return { errorElement, errorId }
  }
}

/**
 * Test utilities for accessibility
 */
export const testUtils = {
  // Basic accessibility audit
  auditAccessibility: (element = document.body) => {
    const issues = []
    
    // Check for images without alt text
    const images = element.querySelectorAll('img')
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        issues.push(`Image ${index + 1} missing alt attribute`)
      }
    })

    // Check for buttons without accessible names
    const buttons = element.querySelectorAll('button')
    buttons.forEach((button, index) => {
      const hasText = button.textContent.trim()
      const hasAriaLabel = button.hasAttribute('aria-label') || button.hasAttribute('aria-labelledby')
      
      if (!hasText && !hasAriaLabel) {
        issues.push(`Button ${index + 1} missing accessible name`)
      }
    })

    // Check for headings hierarchy
    const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    let prevLevel = 0
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      if (level > prevLevel + 1) {
        issues.push(`Heading level skip detected at heading ${index + 1}: h${prevLevel} to h${level}`)
      }
      prevLevel = level
    })

    return issues
  },

  // Test color contrast
  testColorContrast: (element = document.body) => {
    const issues = []
    const textElements = element.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label')
    
    textElements.forEach((el, index) => {
      const styles = window.getComputedStyle(el)
      const color = styles.color
      const backgroundColor = styles.backgroundColor
      
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const ratio = colorUtils.getContrastRatio(color, backgroundColor)
        if (ratio < 4.5) {
          issues.push(`Low contrast ratio (${ratio.toFixed(2)}:1) in element ${index + 1}`)
        }
      }
    })

    return issues
  }
}

export default {
  colorUtils,
  ariaUtils,
  focusUtils,
  screenReaderUtils,
  keyboardUtils,
  motionUtils,
  preferenceUtils,
  formUtils,
  testUtils
}