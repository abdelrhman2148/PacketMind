import { 
  Tooltip, 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Badge,
  Code,
  Divider
} from '@chakra-ui/react'
// import { InfoIcon } from '@chakra-ui/icons'

// Protocol information database
const PROTOCOL_INFO = {
  TCP: {
    name: 'Transmission Control Protocol',
    description: 'Reliable, connection-oriented protocol that ensures data delivery',
    commonPorts: {
      80: 'HTTP - Web traffic',
      443: 'HTTPS - Secure web traffic',
      22: 'SSH - Secure shell',
      21: 'FTP - File transfer',
      25: 'SMTP - Email sending',
      53: 'DNS - Domain name resolution',
      110: 'POP3 - Email retrieval',
      143: 'IMAP - Email access',
      993: 'IMAPS - Secure IMAP',
      995: 'POP3S - Secure POP3'
    },
    flags: {
      SYN: 'Synchronize - Initiates connection',
      ACK: 'Acknowledge - Confirms receipt',
      FIN: 'Finish - Terminates connection',
      RST: 'Reset - Aborts connection',
      PSH: 'Push - Forces immediate delivery',
      URG: 'Urgent - Priority data',
      ECE: 'ECN Echo - Congestion notification',
      CWR: 'Congestion Window Reduced'
    }
  },
  UDP: {
    name: 'User Datagram Protocol',
    description: 'Fast, connectionless protocol for time-sensitive applications',
    commonPorts: {
      53: 'DNS - Domain name resolution',
      67: 'DHCP Server - IP address assignment',
      68: 'DHCP Client - IP address requests',
      69: 'TFTP - Trivial file transfer',
      123: 'NTP - Network time synchronization',
      161: 'SNMP - Network management',
      162: 'SNMP Trap - Network alerts',
      514: 'Syslog - System logging',
      1194: 'OpenVPN - VPN connections',
      5353: 'mDNS - Multicast DNS'
    }
  },
  ICMP: {
    name: 'Internet Control Message Protocol',
    description: 'Network diagnostic and error reporting protocol',
    types: {
      0: 'Echo Reply - Ping response',
      3: 'Destination Unreachable',
      4: 'Source Quench - Slow down',
      5: 'Redirect - Route change',
      8: 'Echo Request - Ping',
      11: 'Time Exceeded - TTL expired',
      12: 'Parameter Problem - Header error'
    }
  },
  ARP: {
    name: 'Address Resolution Protocol',
    description: 'Maps IP addresses to MAC addresses on local networks',
    operations: {
      1: 'Request - Who has this IP?',
      2: 'Reply - I have this IP'
    }
  },
  DNS: {
    name: 'Domain Name System',
    description: 'Translates domain names to IP addresses',
    recordTypes: {
      A: 'IPv4 address',
      AAAA: 'IPv6 address',
      CNAME: 'Canonical name alias',
      MX: 'Mail exchange server',
      NS: 'Name server',
      PTR: 'Reverse DNS lookup',
      SOA: 'Start of authority',
      TXT: 'Text record'
    }
  },
  HTTP: {
    name: 'Hypertext Transfer Protocol',
    description: 'Protocol for web communication',
    methods: {
      GET: 'Retrieve data',
      POST: 'Submit data',
      PUT: 'Update resource',
      DELETE: 'Remove resource',
      HEAD: 'Get headers only',
      OPTIONS: 'Check allowed methods'
    },
    statusCodes: {
      200: 'OK - Success',
      301: 'Moved Permanently',
      302: 'Found - Temporary redirect',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error'
    }
  }
}

// BPF filter help information
const BPF_HELP = {
  syntax: {
    title: 'BPF Filter Syntax',
    examples: [
      { filter: 'host 192.168.1.1', description: 'Traffic to/from specific IP' },
      { filter: 'port 80', description: 'Traffic on port 80' },
      { filter: 'tcp port 443', description: 'HTTPS traffic only' },
      { filter: 'udp and port 53', description: 'DNS queries only' },
      { filter: 'icmp', description: 'ICMP packets (ping, etc.)' },
      { filter: 'arp', description: 'ARP packets only' },
      { filter: 'net 192.168.1.0/24', description: 'Traffic from subnet' },
      { filter: 'src host 10.0.0.1', description: 'Traffic from specific source' },
      { filter: 'dst port 22', description: 'Traffic to SSH port' },
      { filter: 'tcp and (port 80 or port 443)', description: 'Web traffic (HTTP/HTTPS)' }
    ],
    operators: [
      { op: 'and', description: 'Logical AND' },
      { op: 'or', description: 'Logical OR' },
      { op: 'not', description: 'Logical NOT' },
      { op: '()', description: 'Grouping' }
    ]
  }
}

// Field-specific help information
const FIELD_HELP = {
  timestamp: 'Time when the packet was captured',
  source: 'Source IP address - where the packet came from',
  destination: 'Destination IP address - where the packet is going',
  protocol: 'Network protocol used (TCP, UDP, ICMP, etc.)',
  length: 'Total packet size in bytes',
  sport: 'Source port number',
  dport: 'Destination port number',
  summary: 'Brief packet description with key details'
}

/**
 * Protocol-specific tooltip component
 */
const ProtocolTooltip = ({ protocol, port, children, ...props }) => {
  const protocolInfo = PROTOCOL_INFO[protocol?.toUpperCase()]
  
  if (!protocolInfo) {
    return children
  }

  const portInfo = port && protocolInfo.commonPorts?.[port]
  
  const content = (
    <VStack align="start" spacing={2} maxW="300px">
      <Box>
        <Text fontWeight="bold" color="blue.300">
          {protocolInfo.name}
        </Text>
        <Text fontSize="sm" color="gray.300">
          {protocolInfo.description}
        </Text>
      </Box>
      
      {portInfo && (
        <>
          <Divider />
          <Box>
            <Text fontWeight="semibold" color="green.300">
              Port {port}:
            </Text>
            <Text fontSize="sm" color="gray.300">
              {portInfo}
            </Text>
          </Box>
        </>
      )}
      
      {protocolInfo.flags && (
        <>
          <Divider />
          <Box>
            <Text fontWeight="semibold" color="yellow.300" mb={1}>
              Common TCP Flags:
            </Text>
            <VStack align="start" spacing={1}>
              {Object.entries(protocolInfo.flags).slice(0, 4).map(([flag, desc]) => (
                <HStack key={flag} spacing={2}>
                  <Badge colorScheme="blue" size="sm">{flag}</Badge>
                  <Text fontSize="xs" color="gray.400">{desc}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </>
      )}
    </VStack>
  )

  return (
    <Tooltip
      label={content}
      placement="top"
      hasArrow
      bg="gray.800"
      color="white"
      borderRadius="md"
      p={3}
      {...props}
    >
      {children}
    </Tooltip>
  )
}

/**
 * BPF filter help tooltip
 */
const BPFHelpTooltip = ({ children, ...props }) => {
  const content = (
    <VStack align="start" spacing={3} maxW="400px">
      <Box>
        <Text fontWeight="bold" color="blue.300" mb={2}>
          BPF Filter Examples
        </Text>
        <VStack align="start" spacing={1}>
          {BPF_HELP.syntax.examples.slice(0, 6).map((example, index) => (
            <Box key={index}>
              <Code fontSize="xs" colorScheme="blue">
                {example.filter}
              </Code>
              <Text fontSize="xs" color="gray.400" ml={2}>
                {example.description}
              </Text>
            </Box>
          ))}
        </VStack>
      </Box>
      
      <Divider />
      
      <Box>
        <Text fontWeight="semibold" color="green.300" mb={1}>
          Operators:
        </Text>
        <HStack spacing={4} wrap="wrap">
          {BPF_HELP.syntax.operators.map((op, index) => (
            <VStack key={index} spacing={0}>
              <Code fontSize="xs" colorScheme="green">{op.op}</Code>
              <Text fontSize="xs" color="gray.400">{op.description}</Text>
            </VStack>
          ))}
        </HStack>
      </Box>
      
      <Text fontSize="xs" color="gray.500" fontStyle="italic">
        Use parentheses for complex expressions. Leave empty to capture all traffic.
      </Text>
    </VStack>
  )

  return (
    <Tooltip
      label={content}
      placement="top"
      hasArrow
      bg="gray.800"
      color="white"
      borderRadius="md"
      p={3}
      {...props}
    >
      {children}
    </Tooltip>
  )
}

/**
 * Field-specific help tooltip
 */
const FieldHelpTooltip = ({ field, children, ...props }) => {
  const helpText = FIELD_HELP[field]
  
  if (!helpText) {
    return children
  }

  return (
    <Tooltip
      label={helpText}
      placement="top"
      hasArrow
      bg="gray.700"
      color="white"
      fontSize="sm"
      {...props}
    >
      {children}
    </Tooltip>
  )
}

/**
 * Generic help tooltip with info icon
 */
const HelpTooltip = ({ 
  content, 
  title, 
  children, 
  showIcon = false, 
  iconProps = {},
  ...props 
}) => {
  const tooltipContent = title ? (
    <VStack align="start" spacing={2}>
      <Text fontWeight="bold" color="blue.300">{title}</Text>
      <Text fontSize="sm">{content}</Text>
    </VStack>
  ) : content

  const wrappedChildren = showIcon ? (
    <HStack spacing={1} align="center">
      {children}
      <span 
        style={{ 
          fontSize: '12px', 
          color: '#718096'
        }}
      >
        ℹ️
      </span>
    </HStack>
  ) : children

  return (
    <Tooltip
      label={tooltipContent}
      placement="top"
      hasArrow
      bg="gray.700"
      color="white"
      borderRadius="md"
      p={2}
      {...props}
    >
      {wrappedChildren}
    </Tooltip>
  )
}

export default HelpTooltip
export { ProtocolTooltip, BPFHelpTooltip, FieldHelpTooltip }