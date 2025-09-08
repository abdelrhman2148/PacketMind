import React from 'react'
import { render as rtlRender, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Custom Netflix theme for testing
const netflixTheme = extendTheme({
  colors: {
    netflix: {
      black: '#000000',
      white: '#FFFFFF',
      red: '#E50914',
      silver: '#8C8C8C'
    },
    wireshark: {
      accent: '#06B6D4'
    }
  }
})

// Mock data generators
export const mockPacketData = {
  generate: (count = 10) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `packet-${index + 1}`,
      ts: Date.now() / 1000 + index,
      src: `192.168.1.${(index % 254) + 1}`,
      dst: `10.0.0.${(index % 254) + 1}`,
      sport: 3000 + (index % 1000),
      dport: 80 + (index % 100),
      proto: ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS'][index % 5],
      length: 64 + (index * 10),
      summary: `Packet ${index + 1} summary information`,
      isAnomaly: index % 10 === 0,
      isBookmarked: index % 15 === 0
    }))
  },
  
  createSample: () => ({
    id: 'test-packet',
    ts: Date.now() / 1000,
    src: '192.168.1.100',
    dst: '10.0.0.1',
    sport: 3000,
    dport: 80,
    proto: 'HTTP',
    length: 1024,
    summary: 'Test packet for unit testing',
    isAnomaly: false,
    isBookmarked: false
  })
}

export const mockChatData = {
  generateMessages: (count = 5) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `msg-${index + 1}`,
      content: `Test message ${index + 1}`,
      sender: index % 2 === 0 ? 'user' : 'ai',
      timestamp: Date.now() - (count - index) * 60000,
      type: 'text'
    }))
  },
  
  createUserMessage: (content = 'Test user message') => ({
    id: 'user-msg',
    content,
    sender: 'user',
    timestamp: Date.now(),
    type: 'text'
  }),
  
  createAIResponse: (content = 'Test AI response') => ({
    id: 'ai-msg',
    content,
    sender: 'ai',
    timestamp: Date.now(),
    type: 'text'
  })
}

// Custom render function with all providers
function AllTheProviders({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity
      },
      mutations: {
        retry: false
      }
    }
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={netflixTheme}>
          {children}
        </ChakraProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

// Enhanced render function
export function render(ui, options = {}) {
  const { wrapper: Wrapper = AllTheProviders, ...renderOptions } = options
  
  const rendered = rtlRender(ui, {
    wrapper: Wrapper,
    ...renderOptions
  })

  return {
    ...rendered,
    user: userEvent.setup()
  }
}

// Common test utilities
export const testUtils = {
  // Wait for async operations
  waitForLoadingToFinish: () => {
    return waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  },

  // Wait for element to appear
  waitForElement: async (selector) => {
    return await waitFor(() => {
      const element = screen.getByRole(selector) || screen.getByTestId(selector)
      expect(element).toBeInTheDocument()
      return element
    })
  },

  // Simulate network delay
  delay: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock WebSocket
  createMockWebSocket: () => {
    const mockWs = {
      close: jest.fn(),
      send: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: WebSocket.OPEN
    }
    
    global.WebSocket = jest.fn(() => mockWs)
    return mockWs
  },

  // Mock IntersectionObserver
  mockIntersectionObserver: () => {
    const mockIntersectionObserver = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    })
    
    window.IntersectionObserver = mockIntersectionObserver
    window.IntersectionObserver.mockImplementation = mockIntersectionObserver
  },

  // Mock ResizeObserver
  mockResizeObserver: () => {
    const mockResizeObserver = jest.fn()
    mockResizeObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    })
    
    window.ResizeObserver = mockResizeObserver
  },

  // Mock performance API
  mockPerformanceAPI: () => {
    Object.defineProperty(window, 'performance', {
      value: {
        memory: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000
        },
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: jest.fn(() => [])
      },
      writable: true
    })
  },

  // Mock local storage
  mockLocalStorage: () => {
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })
    
    return localStorageMock
  },

  // Mock requestAnimationFrame
  mockAnimationFrame: () => {
    let id = 0
    const callbacks = new Map()
    
    global.requestAnimationFrame = jest.fn((callback) => {
      const currentId = ++id
      callbacks.set(currentId, callback)
      return currentId
    })
    
    global.cancelAnimationFrame = jest.fn((id) => {
      callbacks.delete(id)
    })
    
    // Helper to trigger all pending animation frames
    global.flushAnimationFrames = () => {
      callbacks.forEach(callback => callback(performance.now()))
      callbacks.clear()
    }
  }
}

// Accessibility testing helpers
export const a11yTestUtils = {
  // Check for ARIA attributes
  expectARIALabel: (element, label) => {
    expect(element).toHaveAttribute('aria-label', label)
  },

  expectARIARole: (element, role) => {
    expect(element).toHaveAttribute('role', role)
  },

  // Check keyboard navigation
  expectFocusable: (element) => {
    expect(element).toBeVisible()
    expect(element.tabIndex).toBeGreaterThanOrEqual(0)
  },

  expectNotFocusable: (element) => {
    expect(element.tabIndex).toBe(-1)
  },

  // Simulate keyboard events
  pressKey: async (user, key, options = {}) => {
    await user.keyboard(`{${key}}`, options)
  },

  pressTab: async (user, shift = false) => {
    if (shift) {
      await user.keyboard('{Shift>}{Tab}{/Shift}')
    } else {
      await user.keyboard('{Tab}')
    }
  },

  pressEscape: async (user) => {
    await user.keyboard('{Escape}')
  },

  pressEnter: async (user) => {
    await user.keyboard('{Enter}')
  },

  pressSpace: async (user) => {
    await user.keyboard(' ')
  }
}

// Performance testing helpers
export const performanceTestUtils = {
  // Measure component render time
  measureRenderTime: async (renderFn) => {
    const start = performance.now()
    await renderFn()
    const end = performance.now()
    return end - start
  },

  // Measure memory usage
  measureMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  },

  // Create performance observer
  createPerformanceObserver: (callback) => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(callback)
      return observer
    }
    return null
  }
}

// Mock components for testing
export const MockComponents = {
  MockPacketTable: ({ packets = [], onPacketSelect = jest.fn() }) => (
    <div data-testid="mock-packet-table">
      {packets.map(packet => (
        <div
          key={packet.id}
          data-testid={`packet-${packet.id}`}
          onClick={() => onPacketSelect(packet)}
        >
          {packet.summary}
        </div>
      ))}
    </div>
  ),

  MockChart: ({ data = [], type = 'line' }) => (
    <div data-testid={`mock-chart-${type}`}>
      Chart with {data.length} data points
    </div>
  ),

  MockWebSocket: ({ onMessage = jest.fn(), onConnect = jest.fn() }) => (
    <div data-testid="mock-websocket">WebSocket Connection</div>
  )
}

// Custom matchers
export const customMatchers = {
  toBeAccessible: (element) => {
    const pass = element.getAttribute('aria-label') !== null ||
                 element.getAttribute('aria-labelledby') !== null ||
                 element.textContent.trim() !== ''

    return {
      pass,
      message: () => `Expected element to be accessible (have aria-label, aria-labelledby, or text content)`
    }
  },

  toHaveValidTabIndex: (element) => {
    const tabIndex = element.tabIndex
    const pass = tabIndex === 0 || tabIndex === -1

    return {
      pass,
      message: () => `Expected element to have valid tabIndex (0 or -1), but got ${tabIndex}`
    }
  }
}

// Test data factories
export const createTestData = {
  packets: mockPacketData.generate,
  chatMessages: mockChatData.generateMessages,
  user: () => ({
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    preferences: {
      theme: 'dark',
      notifications: true
    }
  }),
  
  networkInterface: () => ({
    id: 'eth0',
    name: 'Ethernet',
    description: 'Primary network interface',
    isActive: true,
    type: 'ethernet'
  }),

  filter: () => ({
    id: 'test-filter',
    name: 'Test Filter',
    expression: 'tcp port 80',
    isActive: true,
    type: 'bpf'
  })
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export the custom render as the default render
export { render as default }