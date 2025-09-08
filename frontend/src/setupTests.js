import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { testUtils, customMatchers } from './utils/testUtils'

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000
})

// Add custom matchers
expect.extend(customMatchers)

// Global test setup
beforeEach(() => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  
  // Setup common mocks
  testUtils.mockIntersectionObserver()
  testUtils.mockResizeObserver()
  testUtils.mockPerformanceAPI()
  testUtils.mockAnimationFrame()
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
  
  // Mock window.getComputedStyle
  window.getComputedStyle = jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn().mockReturnValue(''),
    color: '#ffffff',
    backgroundColor: '#000000'
  }))
  
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = jest.fn()
  
  // Mock focus and blur
  HTMLElement.prototype.focus = jest.fn()
  HTMLElement.prototype.blur = jest.fn()
})

afterEach(() => {
  // Restore console methods
  console.warn.mockRestore?.()
  console.error.mockRestore?.()
  
  // Clear all mocks
  jest.clearAllMocks()
  
  // Flush animation frames
  global.flushAnimationFrames?.()
})

// Global cleanup
afterAll(() => {
  jest.restoreAllMocks()
})

// Mock modules that don't work well in test environment
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    td: ({ children, ...props }) => <td {...props}>{children}</td>
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  }),
  useMotionValue: () => ({
    get: jest.fn(),
    set: jest.fn()
  })
}))

jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData, itemSize, height }) => {
    const items = Array.from({ length: itemCount }, (_, index) => 
      children({
        index,
        style: { height: itemSize },
        data: itemData
      })
    )
    return <div style={{ height }} data-testid="virtualized-list">{items}</div>
  }
}))

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1
}))

// Mock navigator APIs
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn()
})

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue('')
  }
})

// Suppress specific warnings we know about
const originalError = console.error
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: findDOMNode is deprecated') ||
     args[0].includes('componentWillReceiveProps has been renamed'))
  ) {
    return
  }
  originalError.call(console, ...args)
}