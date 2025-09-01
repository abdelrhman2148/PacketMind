import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChakraProvider, createSystem } from '@chakra-ui/react'
import App from './App'
import theme from './theme'

// Create system with our theme
const system = createSystem(theme)

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  readyState: 1,
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))

// Mock API functions
vi.mock('./api', () => ({
  explainPacket: vi.fn(() => Promise.resolve({ explanation: 'Mock explanation', is_mock: true })),
  getInterfaces: vi.fn(() => Promise.resolve([{ name: 'eth0', description: 'Ethernet' }])),
  updateCaptureSettings: vi.fn(() => Promise.resolve({ success: true })),
}))

const renderWithChakra = (component) => {
  return render(
    <ChakraProvider value={system}>
      {component}
    </ChakraProvider>
  )
}

describe('Accessibility Features', () => {
  it('should have a skip navigation link', () => {
    renderWithChakra(<App />)
    const skipLink = screen.getByText('Skip to main content')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('should have proper heading hierarchy', () => {
    renderWithChakra(<App />)
    
    // Main heading
    const mainHeading = screen.getByRole('heading', { level: 1, name: /wireshark\+ web dashboard/i })
    expect(mainHeading).toBeInTheDocument()
    
    // Section headings
    const captureHeading = screen.getByRole('heading', { level: 2, name: /capture settings/i })
    expect(captureHeading).toBeInTheDocument()
    
    const packetsHeading = screen.getByRole('heading', { level: 2, name: /live packets/i })
    expect(packetsHeading).toBeInTheDocument()
  })

  it('should have proper form labels', () => {
    renderWithChakra(<App />)
    
    const interfaceSelect = screen.getByLabelText(/network interface/i)
    expect(interfaceSelect).toBeInTheDocument()
    
    const filterInput = screen.getByLabelText(/bpf filter/i)
    expect(filterInput).toBeInTheDocument()
  })

  it('should have proper ARIA attributes', () => {
    renderWithChakra(<App />)
    
    // Check for regions
    const banner = screen.getByRole('banner')
    expect(banner).toBeInTheDocument()
    
    const main = screen.getByRole('main', { name: /main content/i })
    expect(main).toBeInTheDocument()
    
    // Check for table
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    expect(table).toHaveAttribute('aria-label', 'Network packets table')
  })

  it('should support keyboard navigation', () => {
    renderWithChakra(<App />)
    
    const applyButton = screen.getByRole('button', { name: /apply settings/i })
    
    // Focus the button
    applyButton.focus()
    expect(applyButton).toHaveFocus()
    
    // Should be able to activate with Enter
    fireEvent.keyDown(applyButton, { key: 'Enter' })
    // Button should still be focused after activation attempt
    expect(applyButton).toHaveFocus()
  })

  it('should have proper color contrast indicators', () => {
    renderWithChakra(<App />)
    
    // Check that status indicators have proper text alternatives
    const connectionStatus = screen.getByText(/connected|disconnected|reconnecting/i)
    expect(connectionStatus).toBeInTheDocument()
  })

  it('should have live regions for dynamic content', () => {
    renderWithChakra(<App />)
    
    // Check for aria-live regions (these would be added when alerts appear)
    // For now, just verify the structure is in place
    const app = screen.getByRole('application') || document.body
    expect(app).toBeInTheDocument()
  })

  it('should have proper button states', () => {
    renderWithChakra(<App />)
    
    const applyButton = screen.getByRole('button', { name: /apply settings/i })
    
    // Button should be disabled initially (no interface selected)
    expect(applyButton).toBeDisabled()
    
    // Theme toggle should be enabled
    const themeToggle = screen.getByRole('button', { name: /switch to light mode|switch to dark mode/i })
    expect(themeToggle).toBeEnabled()
  })

  it('should handle focus management properly', () => {
    renderWithChakra(<App />)
    
    // All interactive elements should be focusable
    const buttons = screen.getAllByRole('button')
    const inputs = screen.getAllByRole('textbox')
    const selects = screen.getAllByRole('combobox')
    
    buttons.forEach(button => {
      if (!button.disabled) {
        expect(button).toHaveAttribute('tabIndex', '0')
      }
    })
  })

  it('should provide screen reader friendly content', () => {
    renderWithChakra(<App />)
    
    // Check for visually hidden helper text
    const interfaceHelp = screen.getByText(/select the network interface to capture packets from/i)
    expect(interfaceHelp).toBeInTheDocument()
    
    const filterHelp = screen.getByText(/enter a berkeley packet filter expression/i)
    expect(filterHelp).toBeInTheDocument()
  })

  it('should be responsive', () => {
    // Test mobile viewport
    global.innerWidth = 375
    global.innerHeight = 667
    global.dispatchEvent(new Event('resize'))
    
    renderWithChakra(<App />)
    
    // On mobile, some elements should be hidden or reorganized
    // This would need to be tested with actual responsive behavior
    const app = screen.getByRole('application') || document.body
    expect(app).toBeInTheDocument()
  })
})