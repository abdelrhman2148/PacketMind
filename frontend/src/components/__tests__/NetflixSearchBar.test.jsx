import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../utils/testUtils'
import { a11yTestUtils } from '../../../utils/testUtils'
import NetflixSearchBar from '../NetflixSearchBar'

// Mock the search hook with more detailed implementation
const mockSetSearchQuery = jest.fn()
const mockOnSearch = jest.fn()
const mockClearSearch = jest.fn()

jest.mock('../../hooks/useSearch', () => ({
  useSearch: () => ({
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
    suggestions: ['TCP', 'HTTP', 'UDP', '192.168.1.1'],
    isSearching: false,
    searchHistory: ['HTTP', 'port 80'],
    clearSearch: mockClearSearch
  })
}))

describe('NetflixSearchBar', () => {
  const defaultProps = {
    onSearch: mockOnSearch,
    placeholder: 'Search packets...',
    disabled: false,
    showSuggestions: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders search input with correct placeholder', () => {
      render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('renders search button', () => {
      render(<NetflixSearchBar {...defaultProps} />)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      expect(searchButton).toBeInTheDocument()
    })

    it('shows clear button when there is text', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'HTTP')
      
      const clearButton = screen.getByRole('button', { name: /clear/i })
      expect(clearButton).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('calls onSearch when typing with debounce', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'HTTP')
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('HTTP')
      }, { timeout: 1000 })
    })

    it('calls onSearch when search button is clicked', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      await user.type(searchInput, 'TCP')
      await user.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith('TCP')
    })

    it('calls onSearch when Enter key is pressed', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'UDP')
      await a11yTestUtils.pressEnter(user)
      
      expect(mockOnSearch).toHaveBeenCalledWith('UDP')
    })

    it('clears search when clear button is clicked', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'HTTP')
      
      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)
      
      expect(mockClearSearch).toHaveBeenCalled()
    })
  })

  describe('Autocomplete and Suggestions', () => {
    it('shows suggestions when typing', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'T')
      
      await waitFor(() => {
        expect(screen.getByText('TCP')).toBeInTheDocument()
      })
    })

    it('filters suggestions based on input', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'HT')
      
      await waitFor(() => {
        expect(screen.getByText('HTTP')).toBeInTheDocument()
        expect(screen.queryByText('TCP')).not.toBeInTheDocument()
      })
    })

    it('selects suggestion when clicked', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'T')
      
      await waitFor(() => {
        expect(screen.getByText('TCP')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('TCP'))
      
      expect(mockOnSearch).toHaveBeenCalledWith('TCP')
    })

    it('navigates suggestions with keyboard', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'T')
      
      await waitFor(() => {
        expect(screen.getByText('TCP')).toBeInTheDocument()
      })
      
      // Navigate with arrow keys
      await a11yTestUtils.pressKey(user, 'ArrowDown')
      await a11yTestUtils.pressEnter(user)
      
      expect(mockOnSearch).toHaveBeenCalled()
    })

    it('hides suggestions when showSuggestions is false', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} showSuggestions={false} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'T')
      
      await waitFor(() => {
        expect(screen.queryByText('TCP')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search History', () => {
    it('shows search history when input is focused and empty', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.click(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('HTTP')).toBeInTheDocument()
        expect(screen.getByText('port 80')).toBeInTheDocument()
      })
    })

    it('selects item from search history', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.click(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('HTTP')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('HTTP'))
      
      expect(mockOnSearch).toHaveBeenCalledWith('HTTP')
    })
  })

  describe('Disabled State', () => {
    it('disables input and button when disabled prop is true', () => {
      render(<NetflixSearchBar {...defaultProps} disabled={true} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      expect(searchInput).toBeDisabled()
      expect(searchButton).toBeDisabled()
    })

    it('does not show suggestions when disabled', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} disabled={true} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      
      // Try to type (should not work)
      await user.type(searchInput, 'T')
      
      expect(screen.queryByText('TCP')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      expect(searchInput).toHaveAttribute('aria-label', 'Search packets')
      expect(searchButton).toBeAccessible()
    })

    it('has proper ARIA expanded state for suggestions', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      
      // Initially collapsed
      expect(searchInput).toHaveAttribute('aria-expanded', 'false')
      
      // Type to show suggestions
      await user.type(searchInput, 'T')
      
      await waitFor(() => {
        expect(searchInput).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('supports keyboard navigation in suggestions list', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'T')
      
      await waitFor(() => {
        expect(screen.getByText('TCP')).toBeInTheDocument()
      })
      
      // Should be able to navigate with arrow keys
      await a11yTestUtils.pressKey(user, 'ArrowDown')
      
      const firstSuggestion = screen.getByText('TCP')
      expect(firstSuggestion).toHaveAttribute('aria-selected', 'true')
    })

    it('announces suggestion count to screen readers', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'T')
      
      await waitFor(() => {
        const suggestionsContainer = screen.getByRole('listbox')
        expect(suggestionsContainer).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('focuses properly with Tab navigation', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      // Tab to search input
      await a11yTestUtils.pressTab(user)
      expect(screen.getByPlaceholderText('Search packets...')).toHaveFocus()
      
      // Tab to search button
      await a11yTestUtils.pressTab(user)
      expect(screen.getByRole('button', { name: /search/i })).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('debounces search input properly', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      
      // Type quickly
      await user.type(searchInput, 'HTTP')
      
      // Should not call onSearch immediately
      expect(mockOnSearch).not.toHaveBeenCalled()
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1)
        expect(mockOnSearch).toHaveBeenCalledWith('HTTP')
      }, { timeout: 1000 })
    })

    it('cancels previous search when typing new query', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      
      // Type first query
      await user.type(searchInput, 'HT')
      
      // Immediately type more
      await user.type(searchInput, 'TP')
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1)
        expect(mockOnSearch).toHaveBeenCalledWith('HTTP')
      }, { timeout: 1000 })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty search gracefully', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })

    it('handles special characters in search', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search packets...')
      await user.type(searchInput, 'tcp && port 80')
      
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('tcp && port 80')
      }, { timeout: 1000 })
    })

    it('handles very long search queries', async () => {
      const { user } = render(<NetflixSearchBar {...defaultProps} />)
      
      const longQuery = 'a'.repeat(1000)
      const searchInput = screen.getByPlaceholderText('Search packets...')
      
      await user.type(searchInput, longQuery)
      
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith(longQuery)
      }, { timeout: 1000 })
    })
  })
})