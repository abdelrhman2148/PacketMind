// Polyfills for Jest testing environment

// TextEncoder/TextDecoder polyfill
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Blob polyfill for file handling tests
if (!global.Blob) {
  global.Blob = class Blob {
    constructor(chunks = [], options = {}) {
      this.size = 0
      this.type = options.type || ''
      this.chunks = chunks
    }
    
    slice() {
      return new Blob()
    }
    
    text() {
      return Promise.resolve('')
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0))
    }
  }
}

// File polyfill
if (!global.File) {
  global.File = class File extends global.Blob {
    constructor(chunks, name, options = {}) {
      super(chunks, options)
      this.name = name
      this.lastModified = Date.now()
    }
  }
}

// URL.createObjectURL polyfill
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = jest.fn(() => 'mock-url')
  global.URL.revokeObjectURL = jest.fn()
}

// IntersectionObserver polyfill
if (!global.IntersectionObserver) {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// ResizeObserver polyfill
if (!global.ResizeObserver) {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// MutationObserver polyfill
if (!global.MutationObserver) {
  global.MutationObserver = class MutationObserver {
    constructor(callback) {
      this.callback = callback
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// requestIdleCallback polyfill
if (!global.requestIdleCallback) {
  global.requestIdleCallback = (callback) => {
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50
      })
    }, 1)
  }
  
  global.cancelIdleCallback = (id) => {
    clearTimeout(id)
  }
}

// Performance polyfill
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
}

// Crypto polyfill for UUID generation
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
  }
}