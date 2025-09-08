import { useAccessibility } from '../hooks/useAccessibility'
import { useFocusManagement } from '../hooks/useFocusManagement'
import { colorUtils, ariaUtils, focusUtils } from './a11y'

// High-order component to add accessibility features to existing components
export const withAccessibility = (Component, options = {}) => {
  const {
    enableKeyboardNavigation = true,
    enableScreenReader = true,
    enableFocusManagement = true,
    enableColorContrast = true,
    ariaLabel = '',
    ariaDescribedBy = '',
    role = '',
    focusTrap = false
  } = options

  const AccessibleComponent = (props) => {
    const accessibility = useAccessibility({
      enableKeyboardTraps: focusTrap,
      enableFocusManagement,
      enableScreenReaderSupport: enableScreenReader
    })

    const focusManagement = useFocusManagement({
      trapFocus: focusTrap,
      enableArrowKeys: enableKeyboardNavigation,
      enableEscapeKey: true
    })

    const enhancedProps = {
      ...props,
      ...accessibility,
      ...focusManagement,
      'aria-label': ariaLabel || props['aria-label'],
      'aria-describedby': ariaDescribedBy || props['aria-describedby'],
      role: role || props.role,
      ref: focusManagement.focusManagerRef
    }

    return <Component {...enhancedProps} />
  }

  AccessibleComponent.displayName = `withAccessibility(${Component.displayName || Component.name})`
  return AccessibleComponent
}

// Utility to enhance existing components with accessibility features
export const enhanceComponentAccessibility = (componentRef, options = {}) => {
  const {
    enableKeyboardNavigation = true,
    enableScreenReader = true,
    ariaLabel = '',
    role = '',
    landmarks = []
  } = options

  if (!componentRef.current) return

  const element = componentRef.current

  // Add ARIA attributes
  if (ariaLabel) {
    element.setAttribute('aria-label', ariaLabel)
  }

  if (role) {
    element.setAttribute('role', role)
  }

  // Add keyboard navigation
  if (enableKeyboardNavigation) {
    element.setAttribute('tabindex', '0')
    
    const handleKeyDown = (event) => {
      const { key } = event
      
      switch (key) {
        case 'Enter':
        case ' ':
          if (element.click) {
            event.preventDefault()
            element.click()
          }
          break
        case 'Escape':
          if (element.blur) {
            element.blur()
          }
          break
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    
    // Cleanup function
    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }

  // Add landmarks
  landmarks.forEach(landmark => {
    const landmarkElement = element.querySelector(landmark.selector)
    if (landmarkElement) {
      landmarkElement.setAttribute('role', landmark.role)
      if (landmark.label) {
        landmarkElement.setAttribute('aria-label', landmark.label)
      }
    }
  })
}

// Accessibility checker for components
export const checkComponentAccessibility = (element) => {
  const issues = []

  if (!element) {
    issues.push('Element not found')
    return issues
  }

  // Check for missing alt text on images
  const images = element.querySelectorAll('img')
  images.forEach((img, index) => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push(`Image ${index + 1} missing alt text`)
    }
  })

  // Check for missing labels on form elements
  const formElements = element.querySelectorAll('input, select, textarea')
  formElements.forEach((input, index) => {
    const hasLabel = input.labels && input.labels.length > 0
    const hasAriaLabel = input.getAttribute('aria-label')
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby')
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push(`Form element ${index + 1} missing label`)
    }
  })

  // Check for insufficient color contrast
  const textElements = element.querySelectorAll('*')
  textElements.forEach((el, index) => {
    const styles = window.getComputedStyle(el)
    const color = styles.color
    const backgroundColor = styles.backgroundColor
    
    if (color && backgroundColor && color !== backgroundColor) {
      const ratio = colorUtils.getContrastRatio(color, backgroundColor)
      if (ratio < 4.5) {
        issues.push(`Element ${index + 1} has insufficient color contrast: ${ratio.toFixed(2)}:1`)
      }
    }
  })

  // Check for missing headings structure
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length === 0) {
    issues.push('No heading structure found')
  } else {
    let previousLevel = 0
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      if (level > previousLevel + 1) {
        issues.push(`Heading level gap at heading ${index + 1}: jumped from h${previousLevel} to h${level}`)
      }
      previousLevel = level
    })
  }

  // Check for keyboard accessibility
  const interactiveElements = element.querySelectorAll('button, a, input, select, textarea, [tabindex]')
  interactiveElements.forEach((el, index) => {
    const tabIndex = el.getAttribute('tabindex')
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push(`Interactive element ${index + 1} has positive tabindex, use 0 or -1`)
    }
  })

  return issues
}

// Auto-fix common accessibility issues
export const autoFixAccessibilityIssues = (element) => {
  if (!element) return

  // Add missing alt text
  const images = element.querySelectorAll('img:not([alt])')
  images.forEach(img => {
    img.setAttribute('alt', 'Image')
  })

  // Add missing button types
  const buttons = element.querySelectorAll('button:not([type])')
  buttons.forEach(button => {
    button.setAttribute('type', 'button')
  })

  // Fix positive tabindex values
  const positiveTabIndex = element.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])')
  positiveTabIndex.forEach(el => {
    const tabIndex = parseInt(el.getAttribute('tabindex'))
    if (tabIndex > 0) {
      el.setAttribute('tabindex', '0')
    }
  })

  // Add ARIA labels to unlabeled interactive elements
  const unlabeledInteractive = element.querySelectorAll('button:not([aria-label]):not([aria-labelledby]), a:not([aria-label]):not([aria-labelledby])')
  unlabeledInteractive.forEach(el => {
    const text = el.textContent || el.innerText
    if (text.trim()) {
      el.setAttribute('aria-label', text.trim())
    }
  })
}

// Component accessibility report generator
export const generateAccessibilityReport = (component) => {
  const issues = checkComponentAccessibility(component)
  
  return {
    score: Math.max(0, 100 - (issues.length * 10)),
    issues,
    recommendations: issues.map(issue => {
      if (issue.includes('missing alt text')) {
        return 'Add descriptive alt text to images'
      }
      if (issue.includes('missing label')) {
        return 'Add proper labels to form elements'
      }
      if (issue.includes('color contrast')) {
        return 'Increase color contrast to meet WCAG standards'
      }
      if (issue.includes('heading')) {
        return 'Use proper heading hierarchy (h1, h2, h3, etc.)'
      }
      if (issue.includes('tabindex')) {
        return 'Use tabindex="0" or tabindex="-1" instead of positive values'
      }
      return 'Review and fix accessibility issue'
    }),
    summary: {
      total: issues.length,
      critical: issues.filter(i => i.includes('missing label') || i.includes('color contrast')).length,
      warning: issues.filter(i => i.includes('heading') || i.includes('tabindex')).length,
      info: issues.filter(i => i.includes('missing alt text')).length
    }
  }
}

export default {
  withAccessibility,
  enhanceComponentAccessibility,
  checkComponentAccessibility,
  autoFixAccessibilityIssues,
  generateAccessibilityReport
}