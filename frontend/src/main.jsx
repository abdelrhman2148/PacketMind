import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, createSystem } from '@chakra-ui/react'
import './index.css'
import './premium.css'
import App from './App.jsx'
import theme from './theme.js'
import PremiumErrorBoundary from './components/PremiumErrorBoundary.jsx'

// Create system with our enhanced theme
const system = createSystem(theme)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PremiumErrorBoundary>
      <ChakraProvider value={system}>
        <App />
      </ChakraProvider>
    </PremiumErrorBoundary>
  </StrictMode>,
)
