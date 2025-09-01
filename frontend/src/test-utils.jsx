import { ChakraProvider, defaultSystem } from '@chakra-ui/react'

// Test wrapper that provides Chakra UI context
export function ChakraTestWrapper({ children }) {
  return (
    <ChakraProvider value={defaultSystem}>
      {children}
    </ChakraProvider>
  )
}

// Custom render function that includes Chakra UI provider
export function renderWithChakra(ui, options = {}) {
  const { render } = require('@testing-library/react')
  
  return render(ui, {
    wrapper: ChakraTestWrapper,
    ...options,
  })
}

export * from '@testing-library/react'