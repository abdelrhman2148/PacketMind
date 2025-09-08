import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useDebounce } from './useDebounce'

// Search hook for comprehensive packet filtering and search functionality
export const useSearch = (packets = [], options = {}) => {
  const {
    debounceDelay = 300,
    maxSuggestions = 10,
    maxHistory = 20,
    enableHistory = true,
    enableSuggestions = true
  } = options

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchHistory, setSearchHistory] = useState(() => {
    if (enableHistory) {
      try {
        const stored = localStorage.getItem('ai-shark-search-history')
        return stored ? JSON.parse(stored) : []
      } catch {
        return []
      }
    }
    return []
  })

  // Filter state
  const [activeFilters, setActiveFilters] = useState({
    protocol: [],
    source: [],
    destination: [],
    port: [],
    timeRange: null,
    packetSize: null,
    custom: []
  })
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      const stored = localStorage.getItem('ai-shark-saved-filters')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Suggestions state
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Refs
  const searchTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, debounceDelay)

  // Extract searchable content from packets
  const searchableData = useMemo(() => {
    if (!packets.length) return []

    return packets.map(packet => ({
      id: packet.ts || Date.now() + Math.random(),
      packet,
      searchableText: [
        packet.src,
        packet.dst,
        packet.proto,
        packet.summary,
        packet.sport?.toString(),
        packet.dport?.toString(),
        packet.length?.toString()
      ].filter(Boolean).join(' ').toLowerCase()
    }))
  }, [packets])

  // Generate search suggestions based on packet content
  const generateSuggestions = useCallback((query) => {
    if (!query || query.length < 2 || !enableSuggestions) return []

    const queryLower = query.toLowerCase()
    const suggestionSet = new Set()

    // Extract suggestions from packets
    packets.forEach(packet => {
      // Protocol suggestions
      if (packet.proto && packet.proto.toLowerCase().includes(queryLower)) {
        suggestionSet.add(`protocol:${packet.proto}`)
      }

      // Source IP suggestions
      if (packet.src && packet.src.toLowerCase().includes(queryLower)) {
        suggestionSet.add(`src:${packet.src}`)
      }

      // Destination IP suggestions
      if (packet.dst && packet.dst.toLowerCase().includes(queryLower)) {
        suggestionSet.add(`dst:${packet.dst}`)
      }

      // Port suggestions
      if (packet.sport && packet.sport.toString().includes(queryLower)) {
        suggestionSet.add(`port:${packet.sport}`)
      }
      if (packet.dport && packet.dport.toString().includes(queryLower)) {
        suggestionSet.add(`port:${packet.dport}`)
      }

      // Content suggestions
      if (packet.summary && packet.summary.toLowerCase().includes(queryLower)) {
        const words = packet.summary.toLowerCase().split(/\s+/)
        words.forEach(word => {
          if (word.includes(queryLower) && word.length > 2) {
            suggestionSet.add(word)
          }
        })
      }
    })

    // Add history suggestions
    searchHistory.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(queryLower)) {
        suggestionSet.add(historyItem)
      }
    })

    return Array.from(suggestionSet).slice(0, maxSuggestions)
  }, [packets, searchHistory, maxSuggestions, enableSuggestions])

  // Perform search with advanced filtering
  const performSearch = useCallback((query, filters = activeFilters) => {
    if (!query.trim() && Object.values(filters).every(f => !f || (Array.isArray(f) && f.length === 0))) {
      return packets
    }

    setIsSearching(true)

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      let results = [...searchableData]

      // Text search
      if (query.trim()) {
        const queryLower = query.toLowerCase()

        // Check for special search operators
        const protocolMatch = query.match(/protocol:(\w+)/i)
        const srcMatch = query.match(/src:([^\s]+)/i)
        const dstMatch = query.match(/dst:([^\s]+)/i)
        const portMatch = query.match(/port:(\d+)/i)

        if (protocolMatch || srcMatch || dstMatch || portMatch) {
          // Structured search
          results = results.filter(({ packet }) => {
            if (protocolMatch && packet.proto !== protocolMatch[1]) return false
            if (srcMatch && packet.src !== srcMatch[1]) return false
            if (dstMatch && packet.dst !== dstMatch[1]) return false
            if (portMatch && packet.sport?.toString() !== portMatch[1] && packet.dport?.toString() !== portMatch[1]) return false
            return true
          })
        } else {
          // Full-text search
          results = results.filter(({ searchableText }) => 
            searchableText.includes(queryLower)
          )
        }
      }

      // Apply protocol filters
      if (filters.protocol && filters.protocol.length > 0) {
        results = results.filter(({ packet }) => 
          filters.protocol.includes(packet.proto)
        )
      }

      // Apply source filters
      if (filters.source && filters.source.length > 0) {
        results = results.filter(({ packet }) => 
          filters.source.includes(packet.src)
        )
      }

      // Apply destination filters
      if (filters.destination && filters.destination.length > 0) {
        results = results.filter(({ packet }) => 
          filters.destination.includes(packet.dst)
        )
      }

      // Apply port filters
      if (filters.port && filters.port.length > 0) {
        results = results.filter(({ packet }) => 
          filters.port.some(port => 
            packet.sport?.toString() === port.toString() || 
            packet.dport?.toString() === port.toString()
          )
        )
      }

      // Apply time range filter
      if (filters.timeRange) {
        const now = Date.now() / 1000
        const timeThreshold = now - filters.timeRange
        results = results.filter(({ packet }) => 
          packet.ts >= timeThreshold
        )
      }

      // Apply packet size filter
      if (filters.packetSize) {
        const { min, max } = filters.packetSize
        results = results.filter(({ packet }) => {
          const size = packet.length || 0
          return (!min || size >= min) && (!max || size <= max)
        })
      }

      return results.map(({ packet }) => packet)
    } catch (error) {
      console.error('Search error:', error)
      return packets
    } finally {
      setIsSearching(false)
    }
  }, [searchableData, packets, activeFilters])

  // Handle search query change
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query)
    
    if (query.trim()) {
      setShowSuggestions(true)
      setSuggestions(generateSuggestions(query))
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }, [generateSuggestions])

  // Execute search
  const executeSearch = useCallback((query = searchQuery) => {
    if (query.trim() && enableHistory) {
      // Add to search history
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, maxHistory)
      setSearchHistory(newHistory)
      localStorage.setItem('ai-shark-search-history', JSON.stringify(newHistory))
    }

    const results = performSearch(query)
    setSearchResults(results)
    setShowSuggestions(false)
    
    return results
  }, [searchQuery, searchHistory, performSearch, enableHistory, maxHistory])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setShowSuggestions(false)
    setSuggestions([])
  }, [])

  // Add filter
  const addFilter = useCallback((type, value) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      
      if (Array.isArray(newFilters[type])) {
        if (!newFilters[type].includes(value)) {
          newFilters[type] = [...newFilters[type], value]
        }
      } else {
        newFilters[type] = value
      }
      
      return newFilters
    })
  }, [])

  // Remove filter
  const removeFilter = useCallback((type, value = null) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      
      if (value === null) {
        // Remove entire filter type
        if (Array.isArray(newFilters[type])) {
          newFilters[type] = []
        } else {
          newFilters[type] = null
        }
      } else {
        // Remove specific value
        if (Array.isArray(newFilters[type])) {
          newFilters[type] = newFilters[type].filter(item => item !== value)
        }
      }
      
      return newFilters
    })
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      protocol: [],
      source: [],
      destination: [],
      port: [],
      timeRange: null,
      packetSize: null,
      custom: []
    })
  }, [])

  // Save current filter set
  const saveFilterSet = useCallback((name) => {
    const filterSet = {
      id: Date.now().toString(),
      name,
      filters: activeFilters,
      query: searchQuery,
      timestamp: new Date().toISOString()
    }
    
    const newSavedFilters = [...savedFilters, filterSet]
    setSavedFilters(newSavedFilters)
    localStorage.setItem('ai-shark-saved-filters', JSON.stringify(newSavedFilters))
    
    return filterSet
  }, [activeFilters, searchQuery, savedFilters])

  // Load saved filter set
  const loadFilterSet = useCallback((filterSet) => {
    setActiveFilters(filterSet.filters)
    setSearchQuery(filterSet.query || '')
  }, [])

  // Delete saved filter set
  const deleteFilterSet = useCallback((id) => {
    const newSavedFilters = savedFilters.filter(filter => filter.id !== id)
    setSavedFilters(newSavedFilters)
    localStorage.setItem('ai-shark-saved-filters', JSON.stringify(newSavedFilters))
  }, [savedFilters])

  // Get quick filter suggestions
  const getQuickFilters = useCallback(() => {
    const protocols = [...new Set(packets.map(p => p.proto).filter(Boolean))]
    const sources = [...new Set(packets.map(p => p.src).filter(Boolean))].slice(0, 10)
    const destinations = [...new Set(packets.map(p => p.dst).filter(Boolean))].slice(0, 10)
    const ports = [...new Set([
      ...packets.map(p => p.sport).filter(Boolean),
      ...packets.map(p => p.dport).filter(Boolean)
    ])].slice(0, 10)

    return {
      protocols,
      sources,
      destinations,
      ports
    }
  }, [packets])

  // Effect to perform search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery !== searchQuery) return // Still debouncing
    
    const results = performSearch(debouncedQuery)
    setSearchResults(results)
  }, [debouncedQuery, activeFilters, performSearch, searchQuery])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((count, filter) => {
      if (Array.isArray(filter)) {
        return count + filter.length
      } else if (filter !== null && filter !== undefined) {
        return count + 1
      }
      return count
    }, 0)
  }, [activeFilters])

  return {
    // Search state
    searchQuery,
    isSearching,
    searchResults,
    searchHistory,
    
    // Suggestions
    suggestions,
    showSuggestions,
    
    // Filter state
    activeFilters,
    savedFilters,
    activeFilterCount,
    
    // Search actions
    handleSearchChange,
    executeSearch,
    clearSearch,
    setShowSuggestions,
    
    // Filter actions
    addFilter,
    removeFilter,
    clearAllFilters,
    saveFilterSet,
    loadFilterSet,
    deleteFilterSet,
    
    // Utilities
    getQuickFilters,
    performSearch
  }
}

// Simple debounce hook
const useDebounceHook = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default useSearch