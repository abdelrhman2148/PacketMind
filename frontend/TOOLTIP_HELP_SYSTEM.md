# Tooltip and Help System Implementation

This document describes the contextual tooltips and help system implemented for the Wireshark+ Web Dashboard.

## Overview

The help system provides contextual information throughout the application to help users understand network protocols, BPF filter syntax, field meanings, and application functionality. It includes:

1. **Protocol Tooltips** - Detailed information about network protocols
2. **BPF Filter Help** - Syntax examples and operators for packet filtering
3. **Field Help Tooltips** - Explanations for table columns and form fields
4. **Guided Tour** - Interactive walkthrough for new users
5. **Help Button** - Quick access to help resources

## Components

### HelpTooltip.jsx

The main tooltip component library providing:

#### ProtocolTooltip
- Shows protocol name, description, and common port meanings
- Displays TCP flags information for TCP protocol
- Supports TCP, UDP, ICMP, ARP, DNS, and HTTP protocols
- Example usage:
```jsx
<ProtocolTooltip protocol="TCP" port={80}>
  <Badge>TCP</Badge>
</ProtocolTooltip>
```

#### BPFHelpTooltip
- Displays BPF filter syntax examples
- Shows logical operators (and, or, not)
- Provides common filter patterns
- Example usage:
```jsx
<BPFHelpTooltip>
  <Text>BPF Filter:</Text>
</BPFHelpTooltip>
```

#### FieldHelpTooltip
- Explains table column meanings
- Supports timestamp, source, destination, protocol, length, ports
- Example usage:
```jsx
<FieldHelpTooltip field="timestamp">
  <Text>Timestamp</Text>
</FieldHelpTooltip>
```

#### HelpTooltip (Generic)
- Basic tooltip with optional title and info icon
- Customizable content and styling
- Example usage:
```jsx
<HelpTooltip content="Helpful information" showIcon={true}>
  <Button>Action</Button>
</HelpTooltip>
```

### GuidedTour.jsx

Interactive tour component with 7 steps:

1. **Welcome** - Introduction to features
2. **Capture Settings** - Interface and BPF filter configuration
3. **Live Packet Table** - Understanding the packet display
4. **AI Analysis** - Using AI-powered packet explanations
5. **Anomaly Detection** - Understanding traffic alerts
6. **Keyboard Navigation** - Accessibility shortcuts
7. **Getting Started** - Quick start checklist

Features:
- Auto-starts for new users
- Remembers completion state in localStorage
- Keyboard accessible navigation
- Progress indicator
- Skip functionality

### HelpButton.jsx

Dropdown menu providing:
- Start guided tour
- Reset tour (for returning users)
- Quick keyboard shortcuts reference
- Contextual tips

## Protocol Information Database

Comprehensive protocol information including:

### TCP (Transmission Control Protocol)
- Description: Reliable, connection-oriented protocol
- Common ports: 80 (HTTP), 443 (HTTPS), 22 (SSH), 21 (FTP), etc.
- TCP flags: SYN, ACK, FIN, RST, PSH, URG, ECE, CWR

### UDP (User Datagram Protocol)
- Description: Fast, connectionless protocol
- Common ports: 53 (DNS), 67/68 (DHCP), 123 (NTP), etc.

### ICMP (Internet Control Message Protocol)
- Description: Network diagnostic and error reporting
- Message types: Echo Request/Reply, Destination Unreachable, etc.

### ARP (Address Resolution Protocol)
- Description: Maps IP addresses to MAC addresses
- Operations: Request (1), Reply (2)

### DNS (Domain Name System)
- Description: Translates domain names to IP addresses
- Record types: A, AAAA, CNAME, MX, NS, PTR, SOA, TXT

### HTTP (Hypertext Transfer Protocol)
- Description: Protocol for web communication
- Methods: GET, POST, PUT, DELETE, HEAD, OPTIONS
- Status codes: 200 (OK), 404 (Not Found), 500 (Server Error), etc.

## BPF Filter Help

### Syntax Examples
- `host 192.168.1.1` - Traffic to/from specific IP
- `port 80` - Traffic on port 80
- `tcp port 443` - HTTPS traffic only
- `udp and port 53` - DNS queries only
- `icmp` - ICMP packets (ping, etc.)
- `arp` - ARP packets only
- `net 192.168.1.0/24` - Traffic from subnet
- `src host 10.0.0.1` - Traffic from specific source
- `dst port 22` - Traffic to SSH port
- `tcp and (port 80 or port 443)` - Web traffic

### Operators
- `and` - Logical AND
- `or` - Logical OR
- `not` - Logical NOT
- `()` - Grouping

## Field Help Information

- **timestamp** - Time when the packet was captured
- **source** - Source IP address - where the packet came from
- **destination** - Destination IP address - where the packet is going
- **protocol** - Network protocol used (TCP, UDP, ICMP, etc.)
- **length** - Total packet size in bytes
- **sport** - Source port number
- **dport** - Destination port number
- **summary** - Brief packet description with key details

## Integration Points

### App.jsx
- Imports all tooltip components
- Adds guided tour with auto-start for new users
- Integrates help button in header
- Wraps key UI elements with appropriate tooltips

### ResizableTable.jsx
- Column headers use FieldHelpTooltip
- Protocol cells use ProtocolTooltip with port information
- Enhanced hover states and accessibility

## Accessibility Features

### Keyboard Navigation
- All tooltips work with keyboard focus
- Tab navigation through interactive elements
- Enter/Space key activation
- Escape key to close modals

### Screen Reader Support
- Proper ARIA labels and roles
- Descriptive text for all interactive elements
- Semantic HTML structure
- Focus management

### Visual Accessibility
- High contrast colors
- Clear focus indicators
- Responsive design for different screen sizes
- Icon + text combinations for clarity

## Testing

### Unit Tests (SimpleTooltip.test.jsx)
- Protocol information database validation
- BPF filter help content verification
- Field help information testing
- Tour navigation logic testing
- Component functionality validation

### Integration Tests
- Tooltip rendering and interaction
- Keyboard accessibility
- Multiple tooltip handling
- Screen reader compatibility

## Usage Examples

### Adding Protocol Tooltip
```jsx
import { ProtocolTooltip } from './components/HelpTooltip'

<ProtocolTooltip protocol="TCP" port={443}>
  <Badge colorScheme="blue">TCP</Badge>
</ProtocolTooltip>
```

### Adding BPF Help
```jsx
import { BPFHelpTooltip } from './components/HelpTooltip'

<BPFHelpTooltip>
  <Input placeholder="Enter BPF filter..." />
</BPFHelpTooltip>
```

### Adding Field Help
```jsx
import { FieldHelpTooltip } from './components/HelpTooltip'

<FieldHelpTooltip field="timestamp">
  <Text>Timestamp</Text>
</FieldHelpTooltip>
```

### Integrating Guided Tour
```jsx
import GuidedTour, { useGuidedTour } from './components/GuidedTour'

function App() {
  const { isOpen, onClose, startTour, resetTour } = useGuidedTour()
  
  return (
    <div>
      {/* Your app content */}
      <GuidedTour isOpen={isOpen} onClose={onClose} autoStart={true} />
    </div>
  )
}
```

## Configuration

### Tour Auto-start
The guided tour automatically starts for new users. This behavior can be controlled:
```jsx
<GuidedTour autoStart={false} /> // Disable auto-start
```

### Tooltip Placement
All tooltips support Chakra UI placement options:
```jsx
<HelpTooltip placement="bottom" content="Help text">
  <Button>Action</Button>
</HelpTooltip>
```

### Custom Styling
Tooltips inherit theme colors and can be customized:
```jsx
<HelpTooltip 
  bg="custom.bg" 
  color="custom.text"
  content="Styled tooltip"
>
  <Element />
</HelpTooltip>
```

## Performance Considerations

- Tooltips are rendered on-demand (hover/focus)
- Tour state is persisted in localStorage
- Protocol information is statically defined (no API calls)
- Minimal bundle size impact with tree-shaking

## Future Enhancements

1. **Dynamic Protocol Detection** - Auto-detect protocols from packet data
2. **Custom Help Content** - Allow users to add custom tooltip content
3. **Interactive Examples** - Live BPF filter testing
4. **Video Tutorials** - Embedded video help content
5. **Contextual Search** - Search help content by topic
6. **Multi-language Support** - Internationalization for help content

## Maintenance

### Adding New Protocols
1. Update `PROTOCOL_INFO` object in `HelpTooltip.jsx`
2. Add protocol-specific information (ports, flags, etc.)
3. Update tests to include new protocol
4. Document new protocol in this file

### Adding New Tour Steps
1. Add step object to `TOUR_STEPS` array in `GuidedTour.jsx`
2. Update total step count in progress calculation
3. Add corresponding test cases
4. Update documentation

### Adding New Field Help
1. Add field mapping to `FIELD_HELP` object in `HelpTooltip.jsx`
2. Use `FieldHelpTooltip` component where needed
3. Add test coverage for new field
4. Document field meaning in this file