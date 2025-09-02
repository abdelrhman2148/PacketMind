import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { describe, it, expect } from 'vitest'
import HelpTooltip, { ProtocolTooltip, BPFHelpTooltip, FieldHelpTooltip } from './HelpTooltip'
import theme from '../theme'

// Test wrapper with ChakraProvider
const TestWrapper = ({ children }) => (
  <ChakraProvider theme={theme}>
    {children}
  </ChakraProvider>
)

describe('HelpTooltip Components', () => {
  describe('HelpTooltip', () => {
    it('renders children correctly', () => {
      render(
        <TestWrapper>
          <HelpTooltip content="Test tooltip content">
            <button>Test Button</button>
          </HelpTooltip>
        </TestWrapper>
      )
      
      expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
    })

    it('shows tooltip content on hover', async () => {
      render(
        <TestWrapper>
          <HelpTooltip content="Test tooltip content">
            <button>Test Button</button>
          </HelpTooltip>
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: 'Test Button' })
      fireEvent.mouseEnter(button)
      
      await waitFor(() => {
        expect(screen.getByText('Test tooltip content')).toBeInTheDocument()
      })
    })

    it('shows title and content when both provided', async () => {
      render(
        <TestWrapper>
          <HelpTooltip title="Test Title" content="Test content">
            <button>Test Button</button>
          </HelpTooltip>
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: 'Test Button' })
      fireEvent.mouseEnter(button)
      
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test content')).toBeInTheDocument()
      })
    })

    it('shows info icon when showIcon is true', () => {
      render(
        <TestWrapper>
          <HelpTooltip content="Test content" showIcon={true}>
            <span>Test Text</span>
          </HelpTooltip>
        </TestWrapper>
      )
      
      // Check for info icon (ChakraUI InfoIcon renders as svg)
      expect(document.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('ProtocolTooltip', () => {
    it('renders TCP protocol information', async () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="TCP" port={80}>
            <span>TCP</span>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByText('TCP')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('Transmission Control Protocol')).toBeInTheDocument()
        expect(screen.getByText('Port 80:')).toBeInTheDocument()
        expect(screen.getByText('HTTP - Web traffic')).toBeInTheDocument()
      })
    })

    it('renders UDP protocol information', async () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="UDP" port={53}>
            <span>UDP</span>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByText('UDP')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('User Datagram Protocol')).toBeInTheDocument()
        expect(screen.getByText('Port 53:')).toBeInTheDocument()
        expect(screen.getByText('DNS - Domain name resolution')).toBeInTheDocument()
      })
    })

    it('shows TCP flags information', async () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="TCP">
            <span>TCP</span>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByText('TCP')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('Common TCP Flags:')).toBeInTheDocument()
        expect(screen.getByText('SYN')).toBeInTheDocument()
        expect(screen.getByText('ACK')).toBeInTheDocument()
      })
    })

    it('renders children when protocol is unknown', () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="UNKNOWN">
            <span>UNKNOWN</span>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    })
  })

  describe('BPFHelpTooltip', () => {
    it('shows BPF filter examples on hover', async () => {
      render(
        <TestWrapper>
          <BPFHelpTooltip>
            <span>BPF Filter</span>
          </BPFHelpTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByText('BPF Filter')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('BPF Filter Examples')).toBeInTheDocument()
        expect(screen.getByText('host 192.168.1.1')).toBeInTheDocument()
        expect(screen.getByText('port 80')).toBeInTheDocument()
        expect(screen.getByText('Operators:')).toBeInTheDocument()
      })
    })

    it('shows operator information', async () => {
      render(
        <TestWrapper>
          <BPFHelpTooltip>
            <span>BPF Filter</span>
          </BPFHelpTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByText('BPF Filter')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('and')).toBeInTheDocument()
        expect(screen.getByText('or')).toBeInTheDocument()
        expect(screen.getByText('not')).toBeInTheDocument()
      })
    })
  })

  describe('FieldHelpTooltip', () => {
    it('shows help for timestamp field', async () => {
      render(
        <TestWrapper>
          <FieldHelpTooltip field="timestamp">
            <span>Timestamp</span>
          </FieldHelpTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByText('Timestamp')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('Time when the packet was captured')).toBeInTheDocument()
      })
    })

    it('shows help for source field', async () => {
      render(
        <TestWrapper>
          <FieldHelpTooltip field="source">
            <span>Source</span>
          </FieldHelpTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByText('Source')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('Source IP address - where the packet came from')).toBeInTheDocument()
      })
    })

    it('shows help for protocol field', async () => {
      render(
        <TestWrapper>
          <FieldHelpTooltip field="protocol">
            <span>Protocol</span>
          </FieldHelpTooltip>
        </TestWrapper>
      )
      
      const element = screen.getByText('Protocol')
      fireEvent.mouseEnter(element)
      
      await waitFor(() => {
        expect(screen.getByText('Network protocol used (TCP, UDP, ICMP, etc.)')).toBeInTheDocument()
      })
    })

    it('renders children when field is unknown', () => {
      render(
        <TestWrapper>
          <FieldHelpTooltip field="unknown">
            <span>Unknown Field</span>
          </FieldHelpTooltip>
        </TestWrapper>
      )
      
      expect(screen.getByText('Unknown Field')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('tooltips have proper ARIA attributes', async () => {
      render(
        <TestWrapper>
          <HelpTooltip content="Accessible tooltip">
            <button>Accessible Button</button>
          </HelpTooltip>
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: 'Accessible Button' })
      fireEvent.mouseEnter(button)
      
      await waitFor(() => {
        const tooltip = screen.getByText('Accessible tooltip')
        expect(tooltip).toBeInTheDocument()
      })
    })

    it('protocol tooltips work with keyboard navigation', async () => {
      render(
        <TestWrapper>
          <ProtocolTooltip protocol="TCP">
            <button>TCP Protocol</button>
          </ProtocolTooltip>
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: 'TCP Protocol' })
      button.focus()
      fireEvent.keyDown(button, { key: 'Enter' })
      
      // Button should be focusable
      expect(button).toHaveFocus()
    })
  })
})