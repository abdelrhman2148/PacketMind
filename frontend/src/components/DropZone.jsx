import { useState, useRef, useEffect, forwardRef } from 'react'
import { Box, Text, VStack, HStack, Icon, useTheme } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { scaleAnimations, slideAnimations, pulseAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionText = motion(Text)

// Main DropZone component
const DropZone = forwardRef(({
  onDrop = () => {},
  onDragEnter = () => {},
  onDragLeave = () => {},
  onDragOver = () => {},
  acceptTypes = [],
  canDrop = () => true,
  disabled = false,
  children,
  placeholder,
  variant = 'default',
  size = 'md',
  showAnimation = true,
  showFeedback = true,
  showDropIndicator = true,
  className,
  style,
  ...props
}, ref) => {
  const [isOver, setIsOver] = useState(false)
  const [canDropItem, setCanDropItem] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)
  const [dropIndicatorPosition, setDropIndicatorPosition] = useState(null)
  const theme = useTheme()
  const dropZoneRef = useRef(null)
  const animationRef = useRef(null)

  // Register this component as a drop target
  const { registerDropTarget, isDragging } = useDragAndDrop({
    onDragStart: ({ data }) => {
      setDraggedItem(data)
    },
    onDragEnd: () => {
      setDraggedItem(null)
      setIsOver(false)
      setCanDropItem(false)
      setDropIndicatorPosition(null)
    }
  })

  // Register drop target
  useEffect(() => {
    if (dropZoneRef.current && !disabled) {
      const cleanup = registerDropTarget(dropZoneRef.current, {}, {
        canDrop: (draggedData) => {
          const typeAccepted = acceptTypes.length === 0 || 
            (draggedData.type && acceptTypes.includes(draggedData.type))
          const customCanDrop = canDrop(draggedData)
          return typeAccepted && customCanDrop
        },
        onDragEnter: (event) => {
          setIsOver(true)
          setCanDropItem(canDrop(draggedItem))
          onDragEnter(event)
        },
        onDragLeave: (event) => {
          setIsOver(false)
          setCanDropItem(false)
          setDropIndicatorPosition(null)
          onDragLeave(event)
        },
        onDrop: (event) => {
          setIsOver(false)
          setCanDropItem(false)
          setDropIndicatorPosition(null)
          onDrop(event)
        }
      })

      return cleanup
    }
  }, [registerDropTarget, disabled, acceptTypes, canDrop, draggedItem, onDragEnter, onDragLeave, onDrop])

  // Handle drag over for positioning
  const handleDragOver = (event) => {
    if (!dropZoneRef.current) return

    const rect = dropZoneRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setDropIndicatorPosition({ x, y })
    onDragOver({ x, y, event })
  }

  // Variant configurations
  const variants = {
    default: {
      bg: 'rgba(31, 31, 31, 0.5)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderStyle: 'dashed',
      borderWidth: '2px',
      color: 'netflix.silver'
    },
    netflix: {
      bg: 'rgba(229, 9, 20, 0.1)',
      borderColor: '#E50914',
      borderStyle: 'dashed',
      borderWidth: '2px',
      color: '#E50914'
    },
    wireshark: {
      bg: 'rgba(6, 182, 212, 0.1)',
      borderColor: '#06B6D4',
      borderStyle: 'dashed',
      borderWidth: '2px',
      color: '#06B6D4'
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      borderColor: '#10B981',
      borderStyle: 'dashed',
      borderWidth: '2px',
      color: '#10B981'
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      borderColor: '#EF4444',
      borderStyle: 'dashed',
      borderWidth: '2px',
      color: '#EF4444'
    }
  }

  const currentVariant = variants[variant] || variants.default

  // Size configurations
  const sizes = {
    sm: { minH: '80px', p: 3, fontSize: 'sm' },
    md: { minH: '120px', p: 4, fontSize: 'md' },
    lg: { minH: '160px', p: 6, fontSize: 'lg' },
    xl: { minH: '200px', p: 8, fontSize: 'xl' }
  }

  const currentSize = sizes[size] || sizes.md

  // Get dynamic styles based on state
  const getDynamicStyles = () => {
    const baseStyles = {
      ...currentVariant,
      ...currentSize,
      borderRadius: '12px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: disabled ? 'not-allowed' : 'default',
      opacity: disabled ? 0.5 : 1,
      position: 'relative',
      overflow: 'hidden'
    }

    if (disabled) {
      return {
        ...baseStyles,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.4)'
      }
    }

    if (isOver) {
      if (canDropItem) {
        return {
          ...baseStyles,
          bg: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10B981',
          borderStyle: 'solid',
          borderWidth: '3px',
          color: '#10B981',
          transform: 'scale(1.02)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)'
        }
      } else {
        return {
          ...baseStyles,
          bg: 'rgba(239, 68, 68, 0.2)',
          borderColor: '#EF4444',
          borderStyle: 'solid',
          borderWidth: '3px',
          color: '#EF4444',
          transform: 'scale(0.98)',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)'
        }
      }
    }

    if (isDragging) {
      return {
        ...baseStyles,
        bg: 'rgba(255, 255, 255, 0.05)',
        borderStyle: 'dashed',
        borderWidth: '2px',
        borderColor: currentVariant.borderColor,
        transform: 'scale(1.01)'
      }
    }

    return baseStyles
  }

  // Feedback icons
  const getFeedbackIcon = () => {
    if (disabled) return '🚫'
    if (isOver && canDropItem) return '✅'
    if (isOver && !canDropItem) return '❌'
    if (isDragging) return '📥'
    return '📋'
  }

  // Feedback message
  const getFeedbackMessage = () => {
    if (disabled) return 'Drop disabled'
    if (isOver && canDropItem) return 'Drop here'
    if (isOver && !canDropItem) return 'Cannot drop here'
    if (isDragging) return 'Drop zone active'
    return placeholder || 'Drag items here'
  }

  return (
    <MotionBox
      ref={(node) => {
        dropZoneRef.current = node
        if (ref) {
          if (typeof ref === 'function') ref(node)
          else ref.current = node
        }
      }}
      className={className}
      style={{ ...getDynamicStyles(), ...style }}
      onDragOver={handleDragOver}
      variants={showAnimation ? scaleAnimations : {}}
      initial={showAnimation ? "initial" : false}
      animate={showAnimation ? (isOver ? "animate" : "initial") : false}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      role="region"
      aria-label="Drop zone"
      aria-dropeffect={disabled ? "none" : "move"}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {/* Background animation */}
      <AnimatePresence>
        {showAnimation && isDragging && (
          <MotionBox
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)"
            variants={slideAnimations}
            initial="slideInLeft"
            animate="slideInRight"
            exit="slideInLeft"
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            pointerEvents="none"
          />
        )}
      </AnimatePresence>

      {/* Drop indicator */}
      <AnimatePresence>
        {showDropIndicator && dropIndicatorPosition && (
          <MotionBox
            position="absolute"
            left={dropIndicatorPosition.x - 10}
            top={dropIndicatorPosition.y - 10}
            w="20px"
            h="20px"
            borderRadius="50%"
            bg={canDropItem ? '#10B981' : '#EF4444'}
            variants={pulseAnimations}
            initial="initial"
            animate="pulse"
            exit="initial"
            pointerEvents="none"
            zIndex={2}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <VStack
        spacing={3}
        justify="center"
        align="center"
        h="100%"
        position="relative"
        zIndex={1}
      >
        {children || (
          <>
            {/* Feedback icon */}
            {showFeedback && (
              <MotionText
                fontSize="2xl"
                variants={showAnimation ? scaleAnimations : {}}
                initial={showAnimation ? "initial" : false}
                animate={showAnimation ? "animate" : false}
                transition={{ delay: 0.1 }}
              >
                {getFeedbackIcon()}
              </MotionText>
            )}

            {/* Feedback message */}
            <MotionText
              fontSize={currentSize.fontSize}
              fontWeight="medium"
              textAlign="center"
              color="inherit"
              variants={showAnimation ? slideAnimations.slideInUp : {}}
              initial={showAnimation ? "initial" : false}
              animate={showAnimation ? "animate" : false}
              transition={{ delay: 0.2 }}
            >
              {getFeedbackMessage()}
            </MotionText>

            {/* Accepted types */}
            {acceptTypes.length > 0 && (
              <MotionText
                fontSize="xs"
                color="inherit"
                opacity={0.7}
                textAlign="center"
                variants={showAnimation ? slideAnimations.slideInUp : {}}
                initial={showAnimation ? "initial" : false}
                animate={showAnimation ? "animate" : false}
                transition={{ delay: 0.3 }}
              >
                Accepts: {acceptTypes.join(', ')}
              </MotionText>
            )}
          </>
        )}
      </VStack>

      {/* Accessibility focus indicator */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        borderRadius="12px"
        border="3px solid transparent"
        pointerEvents="none"
        _focusWithin={{
          borderColor: '#06B6D4',
          boxShadow: '0 0 0 2px rgba(6, 182, 212, 0.3)'
        }}
      />
    </MotionBox>
  )
})

DropZone.displayName = 'DropZone'

// Specialized drop zone variants
export const SortableDropZone = ({ 
  items = [], 
  onReorder = () => {}, 
  orientation = 'vertical',
  ...props 
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const handleDrop = ({ draggedItem, dropTarget }) => {
    if (draggedIndex !== null && overIndex !== null) {
      const newItems = [...items]
      const [draggedItemData] = newItems.splice(draggedIndex, 1)
      newItems.splice(overIndex, 0, draggedItemData)
      onReorder(newItems)
    }
    setDraggedIndex(null)
    setOverIndex(null)
  }

  return (
    <DropZone
      onDrop={handleDrop}
      onDragEnter={() => {}}
      onDragOver={({ y, x }) => {
        // Calculate insert position based on orientation
        const insertIndex = orientation === 'vertical' 
          ? Math.floor(y / 60) // Assuming 60px item height
          : Math.floor(x / 120) // Assuming 120px item width
        setOverIndex(Math.min(insertIndex, items.length))
      }}
      {...props}
    >
      <VStack spacing={2} w="100%">
        {items.map((item, index) => (
          <Box
            key={item.id || index}
            w="100%"
            p={3}
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="8px"
            borderLeft={overIndex === index ? "3px solid #10B981" : "3px solid transparent"}
            opacity={draggedIndex === index ? 0.5 : 1}
          >
            {item.content || item.name || `Item ${index + 1}`}
          </Box>
        ))}
      </VStack>
    </DropZone>
  )
}

export const GridDropZone = ({ 
  gridSize = { cols: 12, rows: 8 },
  cellSize = { width: 60, height: 60 },
  gap = 4,
  onCellDrop = () => {},
  occupiedCells = [],
  ...props 
}) => {
  const [hoveredCell, setHoveredCell] = useState(null)

  const getCellPosition = (clientX, clientY, containerRect) => {
    const x = clientX - containerRect.left
    const y = clientY - containerRect.top
    
    const col = Math.floor(x / (cellSize.width + gap))
    const row = Math.floor(y / (cellSize.height + gap))
    
    return { col: Math.max(0, Math.min(col, gridSize.cols - 1)), 
             row: Math.max(0, Math.min(row, gridSize.rows - 1)) }
  }

  const isCellOccupied = (col, row) => {
    return occupiedCells.some(cell => cell.col === col && cell.row === row)
  }

  return (
    <DropZone
      onDragOver={({ x, y, event }) => {
        const containerRect = event.currentTarget.getBoundingClientRect()
        const cellPos = getCellPosition(event.clientX, event.clientY, containerRect)
        setHoveredCell(cellPos)
      }}
      onDragLeave={() => setHoveredCell(null)}
      onDrop={({ draggedItem }) => {
        if (hoveredCell && !isCellOccupied(hoveredCell.col, hoveredCell.row)) {
          onCellDrop({ item: draggedItem, cell: hoveredCell })
        }
        setHoveredCell(null)
      }}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize.cols}, ${cellSize.width}px)`,
        gridTemplateRows: `repeat(${gridSize.rows}, ${cellSize.height}px)`,
        gap: `${gap}px`,
        width: gridSize.cols * cellSize.width + (gridSize.cols - 1) * gap,
        height: gridSize.rows * cellSize.height + (gridSize.rows - 1) * gap
      }}
      {...props}
    >
      {Array.from({ length: gridSize.rows }).map((_, row) =>
        Array.from({ length: gridSize.cols }).map((_, col) => {
          const isOccupied = isCellOccupied(col, row)
          const isHovered = hoveredCell?.col === col && hoveredCell?.row === row
          
          return (
            <Box
              key={`${row}-${col}`}
              borderRadius="4px"
              border="1px solid"
              borderColor={
                isHovered ? (isOccupied ? '#EF4444' : '#10B981') :
                isOccupied ? 'rgba(255, 255, 255, 0.3)' :
                'rgba(255, 255, 255, 0.1)'
              }
              bg={
                isHovered ? (isOccupied ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)') :
                isOccupied ? 'rgba(255, 255, 255, 0.1)' :
                'transparent'
              }
              transition="all 0.2s ease"
            />
          )
        })
      )}
    </DropZone>
  )
}

export const FileDropZone = ({ 
  accept = [],
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  onFilesDrop = () => {},
  ...props 
}) => {
  const [draggedFiles, setDraggedFiles] = useState([])

  const validateFiles = (files) => {
    const validFiles = []
    const errors = []

    Array.from(files).forEach(file => {
      // Check file type
      if (accept.length > 0 && !accept.some(type => file.type.includes(type))) {
        errors.push(`${file.name}: File type not accepted`)
        return
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large (max ${maxSize / 1024 / 1024}MB)`)
        return
      }

      validFiles.push(file)
    })

    if (!multiple && validFiles.length > 1) {
      errors.push('Only one file allowed')
      return { validFiles: [validFiles[0]], errors }
    }

    return { validFiles, errors }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    const { validFiles, errors } = validateFiles(files)
    
    onFilesDrop({ files: validFiles, errors })
    setDraggedFiles([])
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    setDraggedFiles(files)
  }

  return (
    <DropZone
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDraggedFiles([])}
      {...props}
    >
      <VStack spacing={3}>
        <Text fontSize="3xl">📁</Text>
        <Text fontSize="lg" fontWeight="medium">
          Drop files here
        </Text>
        {accept.length > 0 && (
          <Text fontSize="sm" opacity={0.7}>
            Accepts: {accept.join(', ')}
          </Text>
        )}
        <Text fontSize="xs" opacity={0.7}>
          Max size: {Math.round(maxSize / 1024 / 1024)}MB
          {multiple ? ' • Multiple files allowed' : ' • Single file only'}
        </Text>
        {draggedFiles.length > 0 && (
          <VStack spacing={1}>
            <Text fontSize="sm" color="#06B6D4">
              Files ready to drop:
            </Text>
            {draggedFiles.slice(0, 3).map((file, index) => (
              <Text key={index} fontSize="xs" opacity={0.8}>
                {file.name} ({Math.round(file.size / 1024)}KB)
              </Text>
            ))}
            {draggedFiles.length > 3 && (
              <Text fontSize="xs" opacity={0.6}>
                +{draggedFiles.length - 3} more files
              </Text>
            )}
          </VStack>
        )}
      </VStack>
    </DropZone>
  )
}

export default DropZone