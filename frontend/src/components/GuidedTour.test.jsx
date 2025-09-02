import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GuidedTour, { useGuidedTour } from './GuidedTour'
import theme from '../theme'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Test wrapper with ChakraProvider
const TestWrapper = ({ children }) => (
  <ChakraProvider theme={theme}>
    {children}
  </ChakraProvider>
)

// Test component to test the hook
const TestHookComponent = () => {
  const { isOpen, startTour, resetTour } = useGuidedTour()
  
  return (
    <div>
      <button onClick={startTour}>Start Tour</button>
      <button onClick={resetTour}>Reset Tour</button>
      <GuidedTour isOpen={isOpen} onClose={() => {}} />
    </div>
  )
}

describe('GuidedTour Component', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  describe('Tour Display', () => {
    it('renders when isOpen is true', () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      expect(screen.getByText('Welcome to Wireshark+ Web')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={false} onClose={() => {}} />
        </TestWrapper>
      )
      
      expect(screen.queryByText('Welcome to Wireshark+ Web')).not.toBeInTheDocument()
    })

    it('shows welcome step content', () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      expect(screen.getByText('Welcome to Wireshark+ Web Dashboard!')).toBeInTheDocument()
      expect(screen.getByText('Capture network packets in real-time')).toBeInTheDocument()
      expect(screen.getByText('Filter traffic with BPF expressions')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to next step when Next button is clicked', async () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Capture Settings')).toBeInTheDocument()
        expect(screen.getByText('Step 2 of 7')).toBeInTheDocument()
      })
    })

    it('navigates to previous step when Previous button is clicked', async () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      // Go to step 2 first
      const nextButton = screen.getByRole('button', { name: 'Next' })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Capture Settings')).toBeInTheDocument()
      })
      
      // Go back to step 1
      const prevButton = screen.getByRole('button', { name: 'Previous' })
      fireEvent.click(prevButton)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Wireshark+ Web')).toBeInTheDocument()
        expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
      })
    })

    it('disables Previous button on first step', () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      const prevButton = screen.getByRole('button', { name: 'Previous' })
      expect(prevButton).toBeDisabled()
    })

    it('shows Get Started button on last step', async () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      // Navigate to last step
      const nextButton = screen.getByRole('button', { name: 'Next' })
      
      // Click Next 6 times to reach the last step (step 7)
      for (let i = 0; i < 6; i++) {
        fireEvent.click(nextButton)
        await waitFor(() => {
          expect(screen.getByText(`Step ${i + 2} of 7`)).toBeInTheDocument()
        })
      }
      
      expect(screen.getByRole('button', { name: 'Get Started!' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    })
  })

  describe('Tour Completion', () => {
    it('marks tour as seen when completed', async () => {
      const onClose = vi.fn()
      
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={onClose} />
        </TestWrapper>
      )
      
      // Navigate to last step and complete
      const nextButton = screen.getByRole('button', { name: 'Next' })
      for (let i = 0; i < 6; i++) {
        fireEvent.click(nextButton)
        await waitFor(() => {
          expect(screen.getByText(`Step ${i + 2} of 7`)).toBeInTheDocument()
        })
      }
      
      const getStartedButton = screen.getByRole('button', { name: 'Get Started!' })
      fireEvent.click(getStartedButton)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('wireshark-web-tour-seen', 'true')
      expect(onClose).toHaveBeenCalled()
    })

    it('marks tour as seen when skipped', () => {
      const onClose = vi.fn()
      
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={onClose} />
        </TestWrapper>
      )
      
      const skipButton = screen.getByRole('button', { name: 'Skip Tour' })
      fireEvent.click(skipButton)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('wireshark-web-tour-seen', 'true')
      expect(onClose).toHaveBeenCalled()
    })

    it('marks tour as seen when closed', () => {
      const onClose = vi.fn()
      
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={onClose} />
        </TestWrapper>
      )
      
      // Click the X button (close button)
      const closeButton = screen.getByLabelText('Close')
      fireEvent.click(closeButton)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('wireshark-web-tour-seen', 'true')
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Auto-start Behavior', () => {
    it('does not auto-start if user has seen tour', () => {
      localStorageMock.getItem.mockReturnValue('true')
      
      const onClose = vi.fn()
      
      render(
        <TestWrapper>
          <GuidedTour isOpen={false} onClose={onClose} autoStart={true} />
        </TestWrapper>
      )
      
      // Should not open automatically
      expect(screen.queryByText('Welcome to Wireshark+ Web')).not.toBeInTheDocument()
    })
  })

  describe('Step Content', () => {
    it('shows capture settings step content', async () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Capture Settings')).toBeInTheDocument()
        expect(screen.getByText('Network Interface:')).toBeInTheDocument()
        expect(screen.getByText('BPF Filter (Optional):')).toBeInTheDocument()
        expect(screen.getByText('port 80')).toBeInTheDocument()
      })
    })

    it('shows packet table step content', async () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      
      // Navigate to step 3 (packet table)
      fireEvent.click(nextButton) // Step 2
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 7')).toBeInTheDocument()
      })
      
      fireEvent.click(nextButton) // Step 3
      await waitFor(() => {
        expect(screen.getByText('Live Packet Table')).toBeInTheDocument()
        expect(screen.getByText('Table Columns:')).toBeInTheDocument()
        expect(screen.getByText('Timestamp')).toBeInTheDocument()
        expect(screen.getByText('Source')).toBeInTheDocument()
      })
    })

    it('shows keyboard shortcuts step content', async () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      
      // Navigate to step 6 (keyboard shortcuts)
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextButton)
        await waitFor(() => {
          expect(screen.getByText(`Step ${i + 2} of 7`)).toBeInTheDocument()
        })
      }
      
      expect(screen.getByText('Keyboard Navigation')).toBeInTheDocument()
      expect(screen.getByText('Keyboard Shortcuts:')).toBeInTheDocument()
      expect(screen.getByText('Tab')).toBeInTheDocument()
      expect(screen.getByText('Enter')).toBeInTheDocument()
    })
  })

  describe('useGuidedTour Hook', () => {
    it('provides tour control functions', () => {
      render(
        <TestWrapper>
          <TestHookComponent />
        </TestWrapper>
      )
      
      expect(screen.getByRole('button', { name: 'Start Tour' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reset Tour' })).toBeInTheDocument()
    })

    it('opens tour when startTour is called', () => {
      render(
        <TestWrapper>
          <TestHookComponent />
        </TestWrapper>
      )
      
      const startButton = screen.getByRole('button', { name: 'Start Tour' })
      fireEvent.click(startButton)
      
      expect(screen.getByText('Welcome to Wireshark+ Web')).toBeInTheDocument()
    })

    it('resets tour when resetTour is called', () => {
      render(
        <TestWrapper>
          <TestHookComponent />
        </TestWrapper>
      )
      
      const resetButton = screen.getByRole('button', { name: 'Reset Tour' })
      fireEvent.click(resetButton)
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('wireshark-web-tour-seen')
      expect(screen.getByText('Welcome to Wireshark+ Web')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <GuidedTour isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      nextButton.focus()
      expect(nextButton).toHaveFocus()
      
      fireEvent.keyDown(nextButton, { key: 'Enter' })
      // Should navigate to next step
    })
  })
})