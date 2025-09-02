import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { describe, it, expect } from 'vitest'
import { ProtocolTooltip, BPFHelpTooltip, FieldHelpTooltip } from './HelpTooltip'
import theme from '../theme'

// Test wrapper with ChakraProvider
const TestWrapper = ({ children }) => (
  <ChakraProvider theme={theme}>
    {children}
  </ChakraProvider>
)

describe('Tooltip Integration Tests', () => {
  describe('Protocol Tooltips', () => {
    it('shows TCP protocol information with port details', async () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="TCP" port={80}>
            <div data-testid="tcp-element">TCP:80</div>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByTestId('tcp-element')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('Transmission Control Protocol')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('shows UDP protocol information', async () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="UDP" port={53}>
            <div data-testid="udp-element">UDP:53</div>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByTestId('udp-element')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('User Datagram Protocol')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles unknown protocols gracefully', () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="UNKNOWN">
            <div data-testid="unknown-element">UNKNOWN</div>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      // Should render children even for unknown protocols
      expect(screen.getByTestId('unknown-element')).toBeInTheDocument()
    })
  })

  describe('BPF Help Tooltips', () => {
    it('shows BPF filter help', async () => {
      render(
        <TestWrapper>
          <BPFHelpTooltip>
            <div data-testid="bpf-element">BPF Filter Help</div>
          </BPFHelpTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByTestId('bpf-element')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('BPF Filter Examples')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Field Help Tooltips', () => {
    it('shows field-specific help', async () => {
      render(
        <TestWrapper>
          <FieldHelpTooltip field="timestamp">
            <div data-testid="field-element">Timestamp</div>
          </FieldHelpTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByTestId('field-element')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('Time when the packet was captured')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles unknown fields gracefully', () => {
      render(
        <TestWrapper>
          <FieldHelpTooltip field="nonexistent">
            <div data-testid="unknown-field">Unknown Field</div>
          </FieldHelpTooltip>
        </TestWrapper>
      )
      
      // Should render children even for unknown fields
      expect(screen.getByTestId('unknown-field')).toBeInTheDocument()
    })
  })

  describe('Tooltip Accessibility', () => {
    it('tooltips are keyboard accessible', async () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="TCP">
            <button data-testid="focusable-element">TCP Button</button>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      const button = screen.getByTestId('focusable-element')
      button.focus()
      
      // Element should be focusable
      expect(button).toHaveFocus()
    })

    it('tooltips work with screen readers', async () => {
      render(
        <TestWrapper>
          <FieldHelpTooltip field="protocol">
            <span role="button" tabIndex={0} data-testid="accessible-element">
              Protocol
            </span>
          </FieldHelpTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByTestId('accessible-element')
      expect(element).toHaveAttribute('role', 'button')
      expect(element).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Multiple Tooltips', () => {
    it('handles multiple tooltips on the same page', async () => {
      render(
        <TestWrapper>
          <div>
            <ProtocolTooltip protocol="TCP">
              <div data-testid="tcp-tooltip">TCP</div>
            </ProtocolTooltip>
            <ProtocolTooltip protocol="UDP">
              <div data-testid="udp-tooltip">UDP</div>
            </ProtocolTooltip>
            <FieldHelpTooltip field="timestamp">
              <div data-testid="field-tooltip">Timestamp</div>
            </FieldHelpTooltip>
          </div>
        </TestWrapper>
      )
      
      // All elements should be present
      expect(screen.getByTestId('tcp-tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('udp-tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('field-tooltip')).toBeInTheDocument()
    })
  })
})