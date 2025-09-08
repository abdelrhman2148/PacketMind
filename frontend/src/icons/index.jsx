import React from 'react'
import { createIcon, Icon } from '@chakra-ui/react'

// Base icon component with consistent styling
const BaseIcon = ({ children, ...props }) => (
  <Icon
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="0"
    {...props}
  >
    {children}
  </Icon>
)

// Network and Protocol Icons
export const NetworkIcon = createIcon({
  displayName: 'NetworkIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="5" cy="5" r="2" fill="currentColor"/>
      <circle cx="19" cy="5" r="2" fill="currentColor"/>
      <circle cx="5" cy="19" r="2" fill="currentColor"/>
      <circle cx="19" cy="19" r="2" fill="currentColor"/>
      <path d="M7 7l3.5 3.5M16.5 8.5L13 12M7 17l3.5-3.5M16.5 15.5L13 12" 
            stroke="currentColor" strokeWidth="2" fill="none"/>
    </g>
  )
})

export const PacketIcon = createIcon({
  displayName: 'PacketIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="3" y="8" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="5" y="10" width="2" height="4" fill="currentColor"/>
      <rect x="8" y="10" width="2" height="4" fill="currentColor"/>
      <rect x="11" y="10" width="6" height="4" fill="currentColor"/>
      <rect x="18" y="10" width="1" height="4" fill="currentColor"/>
    </g>
  )
})

export const TCPIcon = createIcon({
  displayName: 'TCPIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <path d="M3 12h18M3 8h18M3 16h18" stroke="currentColor" strokeWidth="2"/>
      <circle cx="6" cy="12" r="1" fill="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="18" cy="12" r="1" fill="currentColor"/>
      <path d="M2 6v12l2-2M22 6v12l-2-2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </g>
  )
})

export const UDPIcon = createIcon({
  displayName: 'UDPIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <path d="M3 12l9-6v4h9v4h-9v4z" fill="currentColor"/>
      <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </g>
  )
})

export const HTTPIcon = createIcon({
  displayName: 'HTTPIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 9h8M8 13h6M8 17h4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="8" r="1" fill="currentColor"/>
      <path d="M3 9h18" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

export const HTTPSIcon = createIcon({
  displayName: 'HTTPSIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="3" y="11" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="15" r="2" fill="currentColor"/>
    </g>
  )
})

export const DNSIcon = createIcon({
  displayName: 'DNSIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1"/>
      <circle cx="12" cy="7" r="1" fill="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="12" cy="17" r="1" fill="currentColor"/>
      <circle cx="7" cy="12" r="1" fill="currentColor"/>
      <circle cx="17" cy="12" r="1" fill="currentColor"/>
    </g>
  )
})

export const WiFiIcon = createIcon({
  displayName: 'WiFiIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9z" fill="currentColor"/>
      <path d="M5 13l2 2c2.76-2.76 7.24-2.76 10 0l2-2c-4.28-4.28-11.72-4.28-16 0z" fill="currentColor"/>
      <path d="M9 17l2 2c.87-.87 2.13-.87 3 0l2-2c-2.28-2.28-5.72-2.28-8 0z" fill="currentColor"/>
      <circle cx="12" cy="21" r="1" fill="currentColor"/>
    </g>
  )
})

export const EthernetIcon = createIcon({
  displayName: 'EthernetIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="2" y="9" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="4" y="11" width="2" height="2" fill="currentColor"/>
      <rect x="7" y="11" width="2" height="2" fill="currentColor"/>
      <rect x="10" y="11" width="4" height="2" fill="currentColor"/>
      <rect x="15" y="11" width="2" height="2" fill="currentColor"/>
      <rect x="18" y="11" width="2" height="2" fill="currentColor"/>
      <path d="M6 15v3M10 15v3M14 15v3M18 15v3" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

// Interface and Connection Icons
export const InterfaceIcon = createIcon({
  displayName: 'InterfaceIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="8" cy="12" r="2" fill="currentColor"/>
      <circle cx="16" cy="12" r="2" fill="currentColor"/>
      <path d="M10 12h4" stroke="currentColor" strokeWidth="2"/>
      <path d="M3 12h2M19 12h2" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

export const RouterIcon = createIcon({
  displayName: 'RouterIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="3" y="12" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="6" cy="15" r="1" fill="currentColor"/>
      <circle cx="9" cy="15" r="1" fill="currentColor"/>
      <circle cx="12" cy="15" r="1" fill="currentColor"/>
      <circle cx="15" cy="15" r="1" fill="currentColor"/>
      <circle cx="18" cy="15" r="1" fill="currentColor"/>
      <path d="M8 12V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M10 6V4M14 6V4" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

export const ServerIcon = createIcon({
  displayName: 'ServerIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="2" y="6" width="20" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="2" y="14" width="20" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="6" cy="8" r="1" fill="currentColor"/>
      <circle cx="6" cy="16" r="1" fill="currentColor"/>
      <path d="M10 8h8M10 16h8" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

// Status and Action Icons
export const ConnectedIcon = createIcon({
  displayName: 'ConnectedIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/>
    </g>
  )
})

export const DisconnectedIcon = createIcon({
  displayName: 'DisconnectedIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

export const PlayIcon = createIcon({
  displayName: 'PlayIcon',
  viewBox: '0 0 24 24',
  path: (
    <path d="M8 5v14l11-7z" fill="currentColor"/>
  )
})

export const PauseIcon = createIcon({
  displayName: 'PauseIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
      <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
    </g>
  )
})

export const StopIcon = createIcon({
  displayName: 'StopIcon',
  viewBox: '0 0 24 24',
  path: (
    <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
  )
})

export const CaptureIcon = createIcon({
  displayName: 'CaptureIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="4" fill="currentColor"/>
      <path d="M3 12h3M18 12h3M12 3v3M12 18v3" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

// Analysis and Monitoring Icons
export const AnalyticsIcon = createIcon({
  displayName: 'AnalyticsIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <path d="M3 20V10L8 5L13 10L18 5V20" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M3 20H21" stroke="currentColor" strokeWidth="2"/>
      <circle cx="8" cy="15" r="1" fill="currentColor"/>
      <circle cx="13" cy="12" r="1" fill="currentColor"/>
      <circle cx="18" cy="8" r="1" fill="currentColor"/>
    </g>
  )
})

export const MonitorIcon = createIcon({
  displayName: 'MonitorIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="2" y="4" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 8h12M6 12h8" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

export const AlertIcon = createIcon({
  displayName: 'AlertIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" 
            stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

export const FilterIcon = createIcon({
  displayName: 'FilterIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" 
               stroke="currentColor" strokeWidth="2" fill="none"/>
    </g>
  )
})

export const SearchIcon = createIcon({
  displayName: 'SearchIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

// AI and Chat Icons
export const AIIcon = createIcon({
  displayName: 'AIIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="9" cy="9" r="1" fill="currentColor"/>
      <circle cx="15" cy="9" r="1" fill="currentColor"/>
      <path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M2 12h2M20 12h2M12 2v2M12 20v2" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

export const ChatIcon = createIcon({
  displayName: 'ChatIcon',
  viewBox: '0 0 24 24',
  path: (
    <g>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
            stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2"/>
    </g>
  )
})

// Export all icons as a collection
export const icons = {
  // Network
  network: NetworkIcon,
  packet: PacketIcon,
  tcp: TCPIcon,
  udp: UDPIcon,
  http: HTTPIcon,
  https: HTTPSIcon,
  dns: DNSIcon,
  wifi: WiFiIcon,
  ethernet: EthernetIcon,
  
  // Infrastructure
  interface: InterfaceIcon,
  router: RouterIcon,
  server: ServerIcon,
  
  // Status
  connected: ConnectedIcon,
  disconnected: DisconnectedIcon,
  
  // Controls
  play: PlayIcon,
  pause: PauseIcon,
  stop: StopIcon,
  capture: CaptureIcon,
  
  // Analysis
  analytics: AnalyticsIcon,
  monitor: MonitorIcon,
  alert: AlertIcon,
  filter: FilterIcon,
  search: SearchIcon,
  
  // AI & Chat
  ai: AIIcon,
  chat: ChatIcon
}

export default icons