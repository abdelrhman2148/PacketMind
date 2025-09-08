import { 
  Box, 
  Input, 
  InputGroup, 
  InputLeftElement, 
  InputRightElement,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Kbd,
  useDisclosure
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { SearchIcon, CloseIcon, TimeIcon, StarIcon } from '@chakra-ui/icons'

const MotionBox = motion(Box)
const MotionVStack = motion(VStack)

const NetflixSearchBar = ({
  searchQuery = '',
  onSearchChange,
  onSearch,
  onClear,
  suggestions = [],
  showSuggestions = false,
  setShowSuggestions,
  searchHistory = [],
  isSearching = false,
  placeholder = 'Search packets by IP, protocol, port, or content...',
  variant = 'netflix',
  size = 'lg',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const inputRef = useRef(null)
  const suggestionRefs = useRef([])

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true)
    if (searchQuery.trim() && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Handle input blur with delay for suggestion clicks
  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false)
      setShowSuggestions(false)
      setSelectedSuggestion(-1)
    }, 150)
  }

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    onSearchChange(value)
    setSelectedSuggestion(-1)
  }

  // Handle key down events
  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        onSearch(searchQuery)
        setShowSuggestions(false)
      }
      return
    }

    const totalSuggestions = suggestions.length + (searchHistory.length > 0 ? searchHistory.slice(0, 3).length : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestion(prev => 
          prev < totalSuggestions - 1 ? prev + 1 : -1
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestion(prev => 
          prev > -1 ? prev - 1 : totalSuggestions - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestion >= 0) {
          const allSuggestions = [...suggestions, ...searchHistory.slice(0, 3)]
          const selectedText = allSuggestions[selectedSuggestion]
          onSearchChange(selectedText)
          onSearch(selectedText)
        } else {
          onSearch(searchQuery)
        }
        setShowSuggestions(false)
        setSelectedSuggestion(-1)
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestion(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    onSearchChange(suggestion)
    onSearch(suggestion)
    setShowSuggestions(false)
    setSelectedSuggestion(-1)
  }

  // Handle clear
  const handleClear = () => {
    onClear()
    setShowSuggestions(false)
    setSelectedSuggestion(-1)
    inputRef.current?.focus()
  }

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestion >= 0 && suggestionRefs.current[selectedSuggestion]) {
      suggestionRefs.current[selectedSuggestion].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedSuggestion])

  // Variant styles
  const variantStyles = {
    netflix: {
      bg: 'rgba(31, 31, 31, 0.95)',
      borderColor: isFocused ? '#E50914' : 'rgba(255, 255, 255, 0.2)',
      color: '#FFFFFF',
      _placeholder: { color: 'rgba(255, 255, 255, 0.6)' },
      boxShadow: isFocused ? '0 0 0 2px rgba(229, 9, 20, 0.3)' : 'none',
      backdropFilter: 'blur(20px)'
    },
    wireshark: {
      bg: 'rgba(6, 182, 212, 0.1)',
      borderColor: isFocused ? '#06B6D4' : 'rgba(6, 182, 212, 0.3)',
      color: '#FFFFFF',
      _placeholder: { color: 'rgba(255, 255, 255, 0.6)' },
      boxShadow: isFocused ? '0 0 0 2px rgba(6, 182, 212, 0.3)' : 'none',
      backdropFilter: 'blur(20px)'
    }
  }

  const currentVariant = variantStyles[variant] || variantStyles.netflix

  // Size configurations
  const sizeConfig = {
    sm: { h: '40px', fontSize: 'sm', px: 4 },
    md: { h: '48px', fontSize: 'md', px: 5 },
    lg: { h: '56px', fontSize: 'lg', px: 6 },
    xl: { h: '64px', fontSize: 'xl', px: 8 }
  }

  const currentSize = sizeConfig[size] || sizeConfig.lg

  return (
    <Box position="relative" w="100%" {...props}>
      {/* Search Input */}
      <InputGroup size={size}>
        <InputLeftElement h={currentSize.h} pl={2}>
          <MotionBox
            animate={isSearching ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: isSearching ? Infinity : 0, ease: 'linear' }}
          >
            <SearchIcon 
              color={isFocused ? (variant === 'netflix' ? '#E50914' : '#06B6D4') : 'rgba(255, 255, 255, 0.6)'} 
              boxSize={5}
            />
          </MotionBox>
        </InputLeftElement>

        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          h={currentSize.h}
          fontSize={currentSize.fontSize}
          pl={12}
          pr={searchQuery ? 12 : currentSize.px}
          borderRadius="12px"
          border="2px solid"
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          {...currentVariant}
          _focus={{
            ...currentVariant,
            borderColor: variant === 'netflix' ? '#E50914' : '#06B6D4',
            boxShadow: variant === 'netflix' 
              ? '0 0 0 3px rgba(229, 9, 20, 0.3)' 
              : '0 0 0 3px rgba(6, 182, 212, 0.3)'
          }}
          _hover={{
            borderColor: variant === 'netflix' 
              ? 'rgba(229, 9, 20, 0.5)' 
              : 'rgba(6, 182, 212, 0.5)'
          }}
        />

        {searchQuery && (
          <InputRightElement h={currentSize.h} pr={2}>
            <IconButton
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              colorScheme="whiteAlpha"
              onClick={handleClear}
              borderRadius="full"
              _hover={{
                bg: variant === 'netflix' 
                  ? 'rgba(229, 9, 20, 0.2)' 
                  : 'rgba(6, 182, 212, 0.2)'
              }}
            />
          </InputRightElement>
        )}
      </InputGroup>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
          <MotionBox
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={10}
            mt={2}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              bg="rgba(31, 31, 31, 0.98)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="12px"
              backdropFilter="blur(20px)"
              boxShadow="0 8px 32px rgba(0, 0, 0, 0.6)"
              maxH="400px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(10, 10, 10, 0.3)',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '3px',
                },
              }}
            >
              <VStack spacing={0} align="stretch" p={2}>
                {/* Search History */}
                {searchHistory.length > 0 && (
                  <>
                    <Box px={3} py={2}>
                      <HStack spacing={2}>
                        <TimeIcon boxSize={3} color="rgba(255, 255, 255, 0.5)" />
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)" fontWeight="medium">
                          Recent Searches
                        </Text>
                      </HStack>
                    </Box>
                    {searchHistory.slice(0, 3).map((item, index) => {
                      const suggestionIndex = suggestions.length + index
                      return (
                        <MotionBox
                          key={`history-${index}`}
                          ref={el => suggestionRefs.current[suggestionIndex] = el}
                          px={3}
                          py={2}
                          cursor="pointer"
                          bg={selectedSuggestion === suggestionIndex 
                            ? (variant === 'netflix' ? 'rgba(229, 9, 20, 0.2)' : 'rgba(6, 182, 212, 0.2)')
                            : 'transparent'
                          }
                          borderRadius="8px"
                          onClick={() => handleSuggestionClick(item)}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="netflix.white">
                              {item}
                            </Text>
                            <Badge
                              size="sm"
                              bg="rgba(255, 255, 255, 0.1)"
                              color="rgba(255, 255, 255, 0.7)"
                            >
                              recent
                            </Badge>
                          </HStack>
                        </MotionBox>
                      )
                    })}
                  </>
                )}

                {/* Current Suggestions */}
                {suggestions.length > 0 && (
                  <>
                    {searchHistory.length > 0 && (
                      <Box h="1px" bg="rgba(255, 255, 255, 0.1)" mx={2} my={2} />
                    )}
                    {suggestions.map((suggestion, index) => (
                      <MotionBox
                        key={`suggestion-${index}`}
                        ref={el => suggestionRefs.current[index] = el}
                        px={3}
                        py={2}
                        cursor="pointer"
                        bg={selectedSuggestion === index 
                          ? (variant === 'netflix' ? 'rgba(229, 9, 20, 0.2)' : 'rgba(6, 182, 212, 0.2)')
                          : 'transparent'
                        }
                        borderRadius="8px"
                        onClick={() => handleSuggestionClick(suggestion)}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        transition={{ duration: 0.2 }}
                      >
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="netflix.white">
                            {suggestion.includes(':') ? (
                              <HStack spacing={1}>
                                <Badge
                                  size="sm"
                                  bg={variant === 'netflix' ? 'netflix.red' : 'wireshark.accent'}
                                  color="netflix.white"
                                >
                                  {suggestion.split(':')[0]}
                                </Badge>
                                <Text as="span">{suggestion.split(':')[1]}</Text>
                              </HStack>
                            ) : (
                              suggestion
                            )}
                          </Text>
                          <Box opacity={0.7}>
                            <Kbd fontSize="xs" bg="rgba(255, 255, 255, 0.1)" color="rgba(255, 255, 255, 0.7)">
                              ↵
                            </Kbd>
                          </Box>
                        </HStack>
                      </MotionBox>
                    ))}
                  </>
                )}

                {/* Search Tips */}
                <Box px={3} py={2} mt={2} borderTop="1px solid rgba(255, 255, 255, 0.1)">
                  <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)">
                    💡 Try: <Text as="span" fontFamily="mono">protocol:TCP</Text>, 
                    <Text as="span" fontFamily="mono"> src:192.168.1.1</Text>, 
                    <Text as="span" fontFamily="mono"> port:80</Text>
                  </Text>
                </Box>
              </VStack>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Loading Indicator */}
      <AnimatePresence>
        {isSearching && (
          <MotionBox
            position="absolute"
            top="50%"
            right={searchQuery ? 12 : 4}
            transform="translateY(-50%)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box
              w="4px"
              h="4px"
              bg={variant === 'netflix' ? '#E50914' : '#06B6D4'}
              borderRadius="full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Enhanced Focus Ring */}
      <AnimatePresence>
        {isFocused && (
          <MotionBox
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            borderRadius="12px"
            border="2px solid"
            borderColor={variant === 'netflix' ? '#E50914' : '#06B6D4'}
            opacity={0.5}
            pointerEvents="none"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </Box>
  )
}

export default NetflixSearchBar