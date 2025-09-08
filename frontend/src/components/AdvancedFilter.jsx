import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Input,
  Select,
  Button,
  Text,
  Badge,
  Flex
} from '@chakra-ui/react'

// Filter presets for common use cases
const FILTER_PRESETS = {
  'Web Traffic': {
    description: 'HTTP and HTTPS traffic',
    filters: [
      { field: 'protocol', operator: 'equals', value: 'HTTP' },
      { field: 'protocol', operator: 'equals', value: 'HTTPS' }
    ],
    logic: 'OR'
  },
  'DNS Queries': {
    description: 'Domain name resolution traffic',
    filters: [
      { field: 'protocol', operator: 'equals', value: 'DNS' },
      { field: 'port', operator: 'equals', value: '53' }
    ],
    logic: 'OR'
  },
  'SSH Connections': {
    description: 'Secure shell traffic',
    filters: [
      { field: 'protocol', operator: 'equals', value: 'SSH' },
      { field: 'port', operator: 'equals', value: '22' }
    ],
    logic: 'OR'
  },
  'Large Packets': {
    description: 'Packets larger than 1KB',
    filters: [
      { field: 'length', operator: 'greater_than', value: '1024' }
    ],
    logic: 'AND'
  },
  'Local Network': {
    description: 'Traffic within local network ranges',
    filters: [
      { field: 'source', operator: 'starts_with', value: '192.168.' },
      { field: 'source', operator: 'starts_with', value: '10.' },
      { field: 'source', operator: 'starts_with', value: '172.16.' }
    ],
    logic: 'OR'
  },
  'External Traffic': {
    description: 'Traffic to/from external networks',
    filters: [
      { field: 'source', operator: 'not_starts_with', value: '192.168.' },
      { field: 'source', operator: 'not_starts_with', value: '10.' },
      { field: 'source', operator: 'not_starts_with', value: '172.16.' }
    ],
    logic: 'AND'
  }
}

// Filter field configurations
const FILTER_FIELDS = {
  protocol: {
    label: 'Protocol',
    type: 'select',
    operators: ['equals', 'not_equals'],
    suggestions: ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP']
  },
  source: {
    label: 'Source IP',
    type: 'text',
    operators: ['equals', 'not_equals', 'contains', 'starts_with', 'not_starts_with'],
    placeholder: 'e.g., 192.168.1.1'
  },
  destination: {
    label: 'Destination IP',
    type: 'text',
    operators: ['equals', 'not_equals', 'contains', 'starts_with', 'not_starts_with'],
    placeholder: 'e.g., 8.8.8.8'
  },
  port: {
    label: 'Port',
    type: 'number',
    operators: ['equals', 'not_equals', 'greater_than', 'less_than'],
    placeholder: 'e.g., 80, 443'
  },
  length: {
    label: 'Packet Length',
    type: 'number',
    operators: ['equals', 'not_equals', 'greater_than', 'less_than'],
    placeholder: 'e.g., 1024'
  },
  keyword: {
    label: 'Keyword Search',
    type: 'text',
    operators: ['contains', 'not_contains'],
    placeholder: 'Search in packet summary'
  }
}

// Operator configurations
const OPERATORS = {
  equals: { label: 'equals', symbol: '=' },
  not_equals: { label: 'not equals', symbol: '≠' },
  contains: { label: 'contains', symbol: '∋' },
  not_contains: { label: 'not contains', symbol: '∌' },
  starts_with: { label: 'starts with', symbol: '^' },
  not_starts_with: { label: 'not starts with', symbol: '!^' },
  greater_than: { label: 'greater than', symbol: '>' },
  less_than: { label: 'less than', symbol: '<' }
}

const AdvancedFilter = ({ 
  packets = [], 
  onFilterChange, 
  initialFilters = [],
  className = '' 
}) => {
  const [filters, setFilters] = useState(initialFilters)
  const [filterLogic, setFilterLogic] = useState('AND')
  const [validationError, setValidationError] = useState('')
  const [suggestions, setSuggestions] = useState({})
  const [showPresets, setShowPresets] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [filterHistory, setFilterHistory] = useState([])
  const [savedFilters, setSavedFilters] = useState({})
  const [filterName, setFilterName] = useState('')

  // Load saved data from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('wireshark-filter-history')
      if (savedHistory) {
        setFilterHistory(JSON.parse(savedHistory))
      }
      
      const savedFiltersData = localStorage.getItem('wireshark-saved-filters')
      if (savedFiltersData) {
        setSavedFilters(JSON.parse(savedFiltersData))
      }
    } catch (error) {
      console.error('Error loading filter data:', error)
    }
  }, [])

  // Generate suggestions based on captured packet data
  useEffect(() => {
    const newSuggestions = {
      protocol: [...new Set(packets.map(p => p.proto).filter(Boolean))],
      source: [...new Set(packets.map(p => p.src).filter(Boolean))].slice(0, 20),
      destination: [...new Set(packets.map(p => p.dst).filter(Boolean))].slice(0, 20),
      port: [...new Set([
        ...packets.map(p => p.sport).filter(Boolean),
        ...packets.map(p => p.dport).filter(Boolean)
      ])].slice(0, 20)
    }
    setSuggestions(newSuggestions)
  }, [packets])

  // Validate filter configuration
  const validateFilters = (filtersToValidate = filters) => {
    try {
      for (const filter of filtersToValidate) {
        if (!filter.field || !filter.operator || filter.value === '') {
          throw new Error('All filter fields must be completed')
        }
        
        const fieldConfig = FILTER_FIELDS[filter.field]
        if (!fieldConfig) {
          throw new Error(`Invalid field: ${filter.field}`)
        }
        
        if (!fieldConfig.operators.includes(filter.operator)) {
          throw new Error(`Invalid operator for ${filter.field}: ${filter.operator}`)
        }
        
        // Type-specific validation
        if (fieldConfig.type === 'number' && isNaN(Number(filter.value))) {
          throw new Error(`${fieldConfig.label} must be a number`)
        }
      }
      
      setValidationError('')
      return true
    } catch (error) {
      setValidationError(error.message)
      return false
    }
  }

  // Apply filters to packets
  const applyFilters = useMemo(() => {
    if (filters.length === 0) return packets
    
    if (!validateFilters()) return packets

    return packets.filter(packet => {
      const results = filters.map(filter => {
        const packetValue = getPacketValue(packet, filter.field)
        return evaluateFilter(packetValue, filter.operator, filter.value)
      })
      
      return filterLogic === 'AND' 
        ? results.every(Boolean)
        : results.some(Boolean)
    })
  }, [packets, filters, filterLogic])

  // Get packet value for filtering
  const getPacketValue = (packet, field) => {
    switch (field) {
      case 'protocol': return packet.proto
      case 'source': return packet.src
      case 'destination': return packet.dst
      case 'port': return `${packet.sport || ''} ${packet.dport || ''}`
      case 'length': return packet.length
      case 'keyword': return packet.summary || ''
      default: return ''
    }
  }

  // Evaluate individual filter
  const evaluateFilter = (packetValue, operator, filterValue) => {
    if (!packetValue && packetValue !== 0) return false
    
    const pValue = String(packetValue).toLowerCase()
    const fValue = String(filterValue).toLowerCase()
    
    switch (operator) {
      case 'equals': return pValue === fValue
      case 'not_equals': return pValue !== fValue
      case 'contains': return pValue.includes(fValue)
      case 'not_contains': return !pValue.includes(fValue)
      case 'starts_with': return pValue.startsWith(fValue)
      case 'not_starts_with': return !pValue.startsWith(fValue)
      case 'greater_than': return Number(packetValue) > Number(filterValue)
      case 'less_than': return Number(packetValue) < Number(filterValue)
      default: return false
    }
  }

  // Add new filter
  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: 'protocol',
      operator: 'equals',
      value: ''
    }
    setFilters([...filters, newFilter])
  }

  // Update filter
  const updateFilter = (id, updates) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ))
  }

  // Remove filter
  const removeFilter = (id) => {
    setFilters(filters.filter(filter => filter.id !== id))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters([])
    setValidationError('')
  }

  // Apply preset
  const applyPreset = (presetName) => {
    const preset = FILTER_PRESETS[presetName]
    if (preset) {
      const newFilters = preset.filters.map((filter, index) => ({
        id: Date.now() + index,
        ...filter
      }))
      setFilters(newFilters)
      setFilterLogic(preset.logic)
      
      // Add to history
      addToHistory(`Preset: ${presetName}`, newFilters, preset.logic)
    }
  }

  // Save current filter configuration
  const saveCurrentFilter = () => {
    if (!filterName.trim() || filters.length === 0) {
      return
    }
    
    const newSavedFilters = {
      ...savedFilters,
      [filterName]: {
        filters: [...filters],
        logic: filterLogic,
        created: new Date().toISOString()
      }
    }
    
    setSavedFilters(newSavedFilters)
    localStorage.setItem('wireshark-saved-filters', JSON.stringify(newSavedFilters))
    setFilterName('')
  }

  // Load saved filter
  const loadSavedFilter = (name) => {
    const saved = savedFilters[name]
    if (saved) {
      const newFilters = saved.filters.map((filter, index) => ({
        ...filter,
        id: Date.now() + index
      }))
      setFilters(newFilters)
      setFilterLogic(saved.logic)
      
      addToHistory(`Loaded: ${name}`, newFilters, saved.logic)
    }
  }

  // Delete saved filter
  const deleteSavedFilter = (name) => {
    const newSavedFilters = { ...savedFilters }
    delete newSavedFilters[name]
    setSavedFilters(newSavedFilters)
    localStorage.setItem('wireshark-saved-filters', JSON.stringify(newSavedFilters))
  }

  // Add to filter history
  const addToHistory = (description, filtersData, logic) => {
    const historyEntry = {
      id: Date.now(),
      description,
      filters: filtersData,
      logic,
      timestamp: new Date().toISOString()
    }
    
    const newHistory = [historyEntry, ...filterHistory.slice(0, 19)] // Keep last 20
    setFilterHistory(newHistory)
    localStorage.setItem('wireshark-filter-history', JSON.stringify(newHistory))
  }

  // Load from history
  const loadFromHistory = (historyEntry) => {
    const newFilters = historyEntry.filters.map((filter, index) => ({
      ...filter,
      id: Date.now() + index
    }))
    setFilters(newFilters)
    setFilterLogic(historyEntry.logic)
  }

  // Apply filters and notify parent
  useEffect(() => {
    if (validateFilters()) {
      onFilterChange(applyFilters, {
        filters,
        logic: filterLogic,
        count: applyFilters.length,
        total: packets.length
      })
    }
  }, [filters, filterLogic, packets])

  return (
    <Box 
      p={4} 
      bg={{ base: 'white', _dark: 'gray.800' }} 
      borderRadius="lg" 
      border="1px solid" 
      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
      className={className}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={2}>
            <Text fontSize="lg" fontWeight="600">🔍 Advanced Filters</Text>
            {filters.length > 0 && (
              <Badge colorScheme="blue" variant="subtle">
                {applyFilters.length} / {packets.length} packets
              </Badge>
            )}
          </HStack>
          
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPresets(!showPresets)}
              colorScheme={showPresets ? 'blue' : 'gray'}
            >
              ⭐ Presets
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory(!showHistory)}
              colorScheme={showHistory ? 'blue' : 'gray'}
            >
              🕒 History
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSaved(!showSaved)}
              colorScheme={showSaved ? 'blue' : 'gray'}
            >
              💾 Saved
            </Button>
          </HStack>
        </Flex>

        {/* Filter Presets */}
        {showPresets && (
          <Box p={3} bg={{ base: 'gray.50', _dark: 'gray.700' }} borderRadius="md">
            <Text fontSize="sm" fontWeight="600" mb={2}>Quick Presets</Text>
            <Flex wrap="wrap" gap={2}>
              {Object.entries(FILTER_PRESETS).map(([name, preset]) => (
                <Button
                  key={name}
                  size="sm"
                  variant="outline"
                  onClick={() => applyPreset(name)}
                  title={preset.description}
                >
                  ⭐ {name}
                </Button>
              ))}
            </Flex>
          </Box>
        )}

        {/* Filter History */}
        {showHistory && (
          <Box p={3} bg={{ base: 'gray.50', _dark: 'gray.700' }} borderRadius="md">
            <Text fontSize="sm" fontWeight="600" mb={2}>Recent Filters</Text>
            {filterHistory.length === 0 ? (
              <Text fontSize="sm" color="gray.500">No filter history yet</Text>
            ) : (
              <VStack spacing={1} align="stretch">
                {filterHistory.slice(0, 5).map((entry) => (
                  <HStack key={entry.id} justify="space-between" p={2} bg={{ base: 'white', _dark: 'gray.600' }} borderRadius="sm">
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="500">{entry.description}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Text>
                    </VStack>
                    <Button size="xs" onClick={() => loadFromHistory(entry)}>
                      Load
                    </Button>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        )}

        {/* Saved Filters */}
        {showSaved && (
          <Box p={3} bg={{ base: 'gray.50', _dark: 'gray.700' }} borderRadius="md">
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600">Saved Filters</Text>
              <HStack spacing={2}>
                <Input
                  size="sm"
                  placeholder="Filter name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  maxW="150px"
                />
                <Button size="sm" onClick={saveCurrentFilter} colorScheme="green">
                  Save
                </Button>
              </HStack>
            </HStack>
            
            {Object.keys(savedFilters).length === 0 ? (
              <Text fontSize="sm" color="gray.500">No saved filters yet</Text>
            ) : (
              <VStack spacing={1} align="stretch">
                {Object.entries(savedFilters).map(([name, saved]) => (
                  <HStack key={name} justify="space-between" p={2} bg={{ base: 'white', _dark: 'gray.600' }} borderRadius="sm">
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="500">{name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {saved.filters.length} filters • {new Date(saved.created).toLocaleDateString()}
                      </Text>
                    </VStack>
                    <HStack spacing={1}>
                      <Button size="xs" onClick={() => loadSavedFilter(name)}>
                        Load
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => deleteSavedFilter(name)}
                      >
                        🗑️
                      </Button>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        )}

        {/* Filter Logic Selection */}
        {filters.length > 1 && (
          <HStack spacing={4}>
            <Text fontSize="sm" fontWeight="500">Filter Logic:</Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant={filterLogic === 'AND' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setFilterLogic('AND')}
              >
                AND
              </Button>
              <Button
                size="sm"
                variant={filterLogic === 'OR' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setFilterLogic('OR')}
              >
                OR
              </Button>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {filterLogic === 'AND' ? 'All conditions must match' : 'Any condition can match'}
            </Text>
          </HStack>
        )}

        {/* Individual Filters */}
        <VStack spacing={3} align="stretch">
          {filters.map((filter, index) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              index={index}
              suggestions={suggestions}
              onUpdate={(updates) => updateFilter(filter.id, updates)}
              onRemove={() => removeFilter(filter.id)}
              showLogic={index > 0}
              logic={filterLogic}
            />
          ))}
        </VStack>

        {/* Validation Error */}
        {validationError && (
          <Box p={3} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontSize="sm" color="red.600">{validationError}</Text>
          </Box>
        )}

        {/* Action Buttons */}
        <HStack spacing={2} justify="space-between">
          <Button
            size="sm"
            variant="outline"
            onClick={addFilter}
          >
            ➕ Add Filter
          </Button>
          
          <HStack spacing={2}>
            {filters.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                colorScheme="red"
              >
                🗑️ Clear All
              </Button>
            )}
          </HStack>
        </HStack>
      </VStack>
    </Box>
  )
}

// Individual filter row component
const FilterRow = ({ filter, index, suggestions, onUpdate, onRemove, showLogic, logic }) => {
  const fieldConfig = FILTER_FIELDS[filter.field]
  
  return (
    <HStack spacing={3} p={3} bg={{ base: 'gray.50', _dark: 'gray.700' }} borderRadius="md">
      {showLogic && (
        <Badge colorScheme="blue" fontSize="xs" px={2}>
          {logic}
        </Badge>
      )}
      
      {/* Field Selection */}
      <Select
        value={filter.field}
        onChange={(e) => onUpdate({ 
          field: e.target.value, 
          operator: FILTER_FIELDS[e.target.value].operators[0],
          value: ''
        })}
        size="sm"
        minW="120px"
        bg={{ base: 'white', _dark: 'gray.600' }}
      >
        {Object.entries(FILTER_FIELDS).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </Select>
      
      {/* Operator Selection */}
      <Select
        value={filter.operator}
        onChange={(e) => onUpdate({ operator: e.target.value })}
        size="sm"
        minW="120px"
        bg={{ base: 'white', _dark: 'gray.600' }}
      >
        {fieldConfig.operators.map(op => (
          <option key={op} value={op}>{OPERATORS[op].label}</option>
        ))}
      </Select>
      
      {/* Value Input */}
      {fieldConfig.type === 'select' ? (
        <Select
          value={filter.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          size="sm"
          minW="120px"
          bg={{ base: 'white', _dark: 'gray.600' }}
          placeholder="Select value..."
        >
          {(suggestions[filter.field] || fieldConfig.suggestions || []).map(suggestion => (
            <option key={suggestion} value={suggestion}>{suggestion}</option>
          ))}
        </Select>
      ) : (
        <Input
          value={filter.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder={fieldConfig.placeholder}
          size="sm"
          minW="150px"
          bg={{ base: 'white', _dark: 'gray.600' }}
          type={fieldConfig.type === 'number' ? 'number' : 'text'}
        />
      )}
      
      {/* Remove Button */}
      <Button
        size="sm"
        variant="ghost"
        colorScheme="red"
        onClick={onRemove}
      >
        ❌
      </Button>
    </HStack>
  )
}

export default AdvancedFilter