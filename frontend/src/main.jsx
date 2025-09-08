import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './premium.css'
import App from './App.jsx'
import { NetflixThemeProvider, ThemeScript } from './components/ThemeProvider.jsx'
import PremiumErrorBoundary from './components/PremiumErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeScript />
    <PremiumErrorBoundary>
      <NetflixThemeProvider>
        <App />
      </NetflixThemeProvider>
    </PremiumErrorBoundary>
  </StrictMode>,
)
