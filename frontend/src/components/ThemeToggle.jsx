import { useState } from 'react'
import { Box } from '@chakra-ui/react'

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  const toggleTheme = () => {
    setIsDark(!isDark)
    // In a real implementation, this would update the theme context
    // For now, we'll just demonstrate the toggle functionality
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark')
  }

  return (
    <Box
      as="button"
      onClick={toggleTheme}
      p={2}
      borderRadius="md"
      bg={{ base: 'gray.100', _dark: 'gray.700' }}
      color={{ base: 'gray.700', _dark: 'gray.200' }}
      _hover={{
        bg: { base: 'gray.200', _dark: 'gray.600' }
      }}
      cursor="pointer"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </Box>
  )
}

export default ThemeToggle