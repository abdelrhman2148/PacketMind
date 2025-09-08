import { Box, Text, HStack, VStack, Badge } from '@chakra-ui/react'
import { useState, useMemo } from 'react'

const SyntaxHighlighter = ({ 
  data, 
  type = 'hex', // 'hex', 'ascii', 'json', 'raw'
  showLineNumbers = true,
  maxHeight = '400px',
  searchTerm = '',
  highlightBytes = []
}) => {
  const [selectedBytes, setSelectedBytes] = useState([])

  // Parse and format data based on type
  const formattedData = useMemo(() => {
    if (!data) return []

    switch (type) {
      case 'hex':
        return formatHexData(data)
      case 'ascii':
        return formatAsciiData(data)
      case 'json':
        return formatJsonData(data)
      default:
        return formatRawData(data)
    }
  }, [data, type])

  // Format hex data with proper spacing and colors
  const formatHexData = (hexString) => {
    if (typeof hexString !== 'string') {
      hexString = String(hexString)
    }
    
    // Remove any existing spaces and normalize
    const cleanHex = hexString.replace(/\s+/g, '').toLowerCase()
    const lines = []
    
    for (let i = 0; i < cleanHex.length; i += 32) {
      const chunk = cleanHex.slice(i, i + 32)
      const bytes = chunk.match(/.{1,2}/g) || []
      
      // Create hex representation
      const hexPart = bytes.map((byte, index) => ({
        value: byte,
        offset: Math.floor(i / 2) + index,
        type: getByteType(byte)
      }))
      
      // Create ASCII representation
      const asciiPart = bytes.map(byte => {
        const charCode = parseInt(byte, 16)
        return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '.'
      }).join('')
      
      lines.push({
        offset: Math.floor(i / 2),
        hex: hexPart,
        ascii: asciiPart,
        lineNumber: Math.floor(i / 32) + 1
      })
    }
    
    return lines
  }

  // Format ASCII data
  const formatAsciiData = (asciiString) => {
    const lines = asciiString.split('\n')
    return lines.map((line, index) => ({
      content: line,
      lineNumber: index + 1,
      type: 'ascii'
    }))
  }

  // Format JSON data with syntax highlighting
  const formatJsonData = (jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const formatted = JSON.stringify(parsed, null, 2)
      const lines = formatted.split('\n')
      
      return lines.map((line, index) => ({
        content: line,
        lineNumber: index + 1,
        type: 'json',
        tokens: tokenizeJson(line)
      }))
    } catch {
      return formatRawData(jsonData)
    }
  }

  // Format raw data
  const formatRawData = (rawData) => {
    const lines = String(rawData).split('\n')
    return lines.map((line, index) => ({
      content: line,
      lineNumber: index + 1,
      type: 'raw'
    }))
  }

  // Determine byte type for color coding
  const getByteType = (byte) => {
    const value = parseInt(byte, 16)
    if (value === 0) return 'null'
    if (value >= 32 && value <= 126) return 'printable'
    if (value >= 1 && value <= 31) return 'control'
    return 'extended'
  }

  // Tokenize JSON for syntax highlighting
  const tokenizeJson = (line) => {
    const tokens = []
    const regex = /("(?:[^"\\]|\\.)*")|(\b\d+\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],:])/g
    let match
    let lastIndex = 0

    while ((match = regex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: line.slice(lastIndex, match.index)
        })
      }

      // Add matched token
      if (match[1]) { // String
        tokens.push({ type: 'string', value: match[1] })
      } else if (match[2]) { // Number
        tokens.push({ type: 'number', value: match[2] })
      } else if (match[3]) { // Boolean/null
        tokens.push({ type: 'keyword', value: match[3] })
      } else if (match[4]) { // Punctuation
        tokens.push({ type: 'punctuation', value: match[4] })
      }

      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < line.length) {
      tokens.push({
        type: 'text',
        value: line.slice(lastIndex)
      })
    }

    return tokens
  }

  // Get color for byte type
  const getByteColor = (byteType, isSelected = false, isHighlighted = false) => {
    if (isSelected) return 'netflix.red'
    if (isHighlighted) return 'wireshark.accent'
    
    switch (byteType) {
      case 'null': return 'gray.500'
      case 'printable': return 'netflix.white'
      case 'control': return 'wireshark.warning'
      case 'extended': return 'wireshark.accent'
      default: return 'netflix.silver'
    }
  }

  // Get color for JSON tokens
  const getTokenColor = (tokenType) => {
    switch (tokenType) {
      case 'string': return 'wireshark.success'
      case 'number': return 'wireshark.accent'
      case 'keyword': return 'netflix.red'
      case 'punctuation': return 'netflix.silver'
      default: return 'netflix.white'
    }
  }

  // Handle byte selection
  const handleByteClick = (offset) => {
    setSelectedBytes(prev => 
      prev.includes(offset) 
        ? prev.filter(o => o !== offset)
        : [...prev, offset]
    )
  }

  // Highlight search terms
  const highlightSearchTerm = (text, term) => {
    if (!term) return text
    
    const regex = new RegExp(`(${term})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <Text 
          as="span" 
          key={index} 
          bg="wireshark.accent" 
          color="netflix.black"
          px={1}
          borderRadius="2px"
        >
          {part}
        </Text>
      ) : part
    )
  }

  return (
    <Box
      bg="rgba(10, 10, 10, 0.95)"
      borderRadius="12px"
      border="1px solid rgba(255, 255, 255, 0.1)"
      overflow="hidden"
      fontFamily="mono"
      fontSize="sm"
    >
      {/* Header */}
      <HStack
        px={4}
        py={3}
        bg="rgba(31, 31, 31, 0.8)"
        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
        justify="space-between"
      >
        <HStack spacing={2}>
          <Badge
            bg="netflix.red"
            color="netflix.white"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="4px"
          >
            {type.toUpperCase()}
          </Badge>
          {selectedBytes.length > 0 && (
            <Badge
              bg="wireshark.accent"
              color="netflix.black"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="4px"
            >
              {selectedBytes.length} bytes selected
            </Badge>
          )}
        </HStack>
        
        <Text color="netflix.silver" fontSize="xs">
          {formattedData.length} lines
        </Text>
      </HStack>

      {/* Content */}
      <Box
        maxH={maxHeight}
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(10, 10, 10, 0.3)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
          },
        }}
      >
        {type === 'hex' ? (
          // Hex view
          <VStack spacing={0} align="stretch">
            {formattedData.map((line) => (
              <HStack
                key={line.offset}
                spacing={0}
                px={4}
                py={1}
                _hover={{ bg: 'rgba(255, 255, 255, 0.02)' }}
                align="start"
                minH="24px"
              >
                {/* Line number */}
                {showLineNumbers && (
                  <Text
                    color="netflix.silver"
                    opacity={0.6}
                    minW="60px"
                    fontSize="xs"
                    fontFamily="mono"
                  >
                    {line.offset.toString(16).padStart(8, '0').toUpperCase()}
                  </Text>
                )}
                
                {/* Hex bytes */}
                <HStack spacing={1} flex={1} wrap="wrap">
                  {line.hex.map((byte, index) => (
                    <Text
                      key={`${line.offset}-${index}`}
                      color={getByteColor(
                        byte.type,
                        selectedBytes.includes(byte.offset),
                        highlightBytes.includes(byte.offset)
                      )}
                      cursor="pointer"
                      _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                      onClick={() => handleByteClick(byte.offset)}
                      px={1}
                      borderRadius="2px"
                      fontFamily="mono"
                      fontSize="xs"
                      bg={selectedBytes.includes(byte.offset) 
                        ? 'rgba(229, 9, 20, 0.2)' 
                        : 'transparent'
                      }
                    >
                      {highlightSearchTerm(byte.value.toUpperCase(), searchTerm)}
                    </Text>
                  ))}
                </HStack>
                
                {/* ASCII representation */}
                <Text
                  color="wireshark.accent"
                  fontFamily="mono"
                  fontSize="xs"
                  minW="200px"
                  pl={4}
                  borderLeft="1px solid rgba(255, 255, 255, 0.1)"
                >
                  {highlightSearchTerm(line.ascii, searchTerm)}
                </Text>
              </HStack>
            ))}
          </VStack>
        ) : type === 'json' ? (
          // JSON view
          <VStack spacing={0} align="stretch">
            {formattedData.map((line) => (
              <HStack
                key={line.lineNumber}
                spacing={2}
                px={4}
                py={1}
                _hover={{ bg: 'rgba(255, 255, 255, 0.02)' }}
                align="start"
              >
                {showLineNumbers && (
                  <Text
                    color="netflix.silver"
                    opacity={0.6}
                    minW="40px"
                    fontSize="xs"
                    textAlign="right"
                  >
                    {line.lineNumber}
                  </Text>
                )}
                
                <HStack spacing={0} flex={1}>
                  {line.tokens?.map((token, index) => (
                    <Text
                      key={index}
                      color={getTokenColor(token.type)}
                      fontFamily="mono"
                      fontSize="xs"
                    >
                      {highlightSearchTerm(token.value, searchTerm)}
                    </Text>
                  )) || (
                    <Text color="netflix.white" fontFamily="mono" fontSize="xs">
                      {highlightSearchTerm(line.content, searchTerm)}
                    </Text>
                  )}
                </HStack>
              </HStack>
            ))}
          </VStack>
        ) : (
          // ASCII/Raw view
          <VStack spacing={0} align="stretch">
            {formattedData.map((line) => (
              <HStack
                key={line.lineNumber}
                spacing={2}
                px={4}
                py={1}
                _hover={{ bg: 'rgba(255, 255, 255, 0.02)' }}
                align="start"
              >
                {showLineNumbers && (
                  <Text
                    color="netflix.silver"
                    opacity={0.6}
                    minW="40px"
                    fontSize="xs"
                    textAlign="right"
                  >
                    {line.lineNumber}
                  </Text>
                )}
                
                <Text
                  color="netflix.white"
                  fontFamily="mono"
                  fontSize="xs"
                  flex={1}
                  whiteSpace="pre"
                >
                  {highlightSearchTerm(line.content, searchTerm)}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  )
}

export default SyntaxHighlighter