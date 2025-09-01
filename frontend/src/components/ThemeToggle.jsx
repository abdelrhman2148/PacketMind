import { useState } from 'react'
import { Button } from '@chakra-ui/react'

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  const toggleTheme = () => {
    setIsDark(!isDark)
    // Toggle the data-theme attribute on the document
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark')
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      _focus={{
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
        outline: 'none'
      }}
      _hover={{
        bg: { base: 'gray.100', _dark: 'gray.700' }
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </Button>
  )
}

export default ThemeToggle