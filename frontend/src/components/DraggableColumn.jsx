import { useState, useRef, useEffect, forwardRef } from 'react'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  IconButton,
  Tooltip,
  HStack,
  VStack,
  Badge,
  useTheme
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSortable } from '../hooks/useDragAndDrop'
import { defaultLayoutManager } from '../utils/layoutManager'
import { listItemAnimations, buttonAnimations, scaleAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionTh = motion(Th)
const MotionTr = motion(Tr)

// Individual draggable column header
const DraggableColumnHeader = forwardRef(({
  column,
  index,
  isDragging = false,
  isOver = false,
  canDrop = false,
  onSort = () => {},
  onResize = () => {},
  onToggleVisibility = () => {},
  sortDirection = null,
  isResizable = true,
  isSortable = true,
  minWidth = 100,
  maxWidth = 500,
  showGrip = true,
  ...props
}, ref) => {
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const resizeRef = useRef(null)
  const theme = useTheme()

  // Handle resize start
  const handleResizeStart = (event) => {
    if (!isResizable) return
    
    event.preventDefault()
    setIsResizing(true)
    setStartX(event.clientX)
    setStartWidth(column.width || 150)
    
    // Add global listeners
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    document.addEventListener('touchmove', handleResizeMove)
    document.addEventListener('touchend', handleResizeEnd)
  }

  // Handle resize move
  const handleResizeMove = (event) => {
    if (!isResizing) return
    
    const clientX = event.clientX || event.touches?.[0]?.clientX
    const deltaX = clientX - startX
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX))
    
    onResize(column.key, newWidth)
  }

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false)
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.removeEventListener('touchmove', handleResizeMove)
    document.removeEventListener('touchend', handleResizeEnd)
  }

  // Handle sort
  const handleSort = () => {
    if (!isSortable) return
    
    const newDirection = sortDirection === 'asc' ? 'desc' : 
                        sortDirection === 'desc' ? null : 'asc'
    onSort(column.key, newDirection)
  }

  // Get drag styles
  const getDragStyles = () => {
    const baseStyles = {
      position: 'relative',
      transition: isDragging ? 'none' : 'all 0.2s ease',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      borderRadius: '8px',
      overflow: 'hidden'
    }

    if (isDragging) {
      return {
        ...baseStyles,
        opacity: 0.8,
        transform: 'rotate(2deg) scale(1.02)',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        bg: 'rgba(31, 31, 31, 0.95)',
        border: '2px solid #06B6D4'
      }
    }

    if (isOver) {
      return {
        ...baseStyles,
        bg: canDrop ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        borderLeft: canDrop ? '4px solid #10B981' : '4px solid #EF4444',
        transform: 'translateX(4px)'
      }
    }

    return baseStyles
  }

  return (
    <MotionTh
      ref={ref}
      key={column.key}
      position="relative"
      bg="rgba(31, 31, 31, 0.8)"
      borderColor="rgba(255, 255, 255, 0.1)"
      color="netflix.white"
      fontWeight="bold"
      fontSize="sm"
      textTransform="uppercase"
      letterSpacing="0.05em"
      w={column.width || 'auto'}
      minW={minWidth}
      maxW={maxWidth}
      style={getDragStyles()}
      variants={listItemAnimations}
      initial="hidden"
      animate="visible"
      custom={index}
      {...props}
    >
      <HStack spacing={2} justify="space-between" w="100%">
        {/* Drag grip */}
        {showGrip && (
          <Box
            cursor="grab"
            color="netflix.silver"
            fontSize="xs"
            opacity={0.6}
            _hover={{ opacity: 1 }}
            _active={{ cursor: 'grabbing' }}
          >
            ⋮⋮
          </Box>
        )}

        {/* Column content */}
        <HStack spacing={2} flex={1} minW={0}>
          {/* Column title */}
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="netflix.white"
            noOfLines={1}
            cursor={isSortable ? 'pointer' : 'default'}
            onClick={handleSort}
            _hover={isSortable ? { color: 'wireshark.accent' } : {}}
            title={column.title}
          >
            {column.title}
          </Text>

          {/* Sort indicator */}
          {isSortable && sortDirection && (
            <Text
              fontSize="xs"
              color="wireshark.accent"
              fontWeight="bold"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Text>
          )}

          {/* Column type badge */}
          {column.type && (
            <Badge
              size="sm"
              colorScheme={
                column.type === 'number' ? 'blue' :
                column.type === 'date' ? 'green' :
                column.type === 'boolean' ? 'purple' :
                'gray'
              }
              fontSize="xs"
            >
              {column.type}
            </Badge>
          )}
        </HStack>

        {/* Column actions */}
        <HStack spacing={1}>
          {/* Visibility toggle */}
          <Tooltip label={column.visible ? 'Hide column' : 'Show column'}>
            <IconButton
              size="xs"
              variant="ghost"
              color="netflix.silver"
              icon={<Text fontSize="xs">{column.visible ? '👁️' : '🚫'}</Text>}
              onClick={() => onToggleVisibility(column.key)}
              _hover={{ color: 'netflix.white', bg: 'rgba(255, 255, 255, 0.1)' }}
            />
          </Tooltip>

          {/* Resize handle */}
          {isResizable && (
            <Box
              ref={resizeRef}
              position="absolute"
              right={0}
              top={0}
              bottom={0}
              w="4px"
              cursor="col-resize"
              bg="transparent"
              _hover={{ bg: 'wireshark.accent' }}
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              zIndex={10}
            >
              <Box
                position="absolute"
                right="1px"
                top="50%"
                transform="translateY(-50%)"
                w="2px"
                h="60%"
                bg={isResizing ? 'wireshark.accent' : 'rgba(255, 255, 255, 0.3)'}
                borderRadius="1px"
                transition="all 0.2s ease"
              />
            </Box>
          )}
        </HStack>
      </HStack>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <MotionBox
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="linear-gradient(45deg, transparent 30%, rgba(6, 182, 212, 0.1) 50%, transparent 70%)"
            pointerEvents="none"
            variants={scaleAnimations}
            initial="scaleIn"
            animate="scaleOut"
            exit="scaleIn"
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
      </AnimatePresence>
    </MotionTh>
  )
})

DraggableColumnHeader.displayName = 'DraggableColumnHeader'

// Main draggable table component
const DraggableTable = ({
  columns: initialColumns = [],
  data = [],
  onColumnReorder = () => {},
  onColumnResize = () => {},
  onColumnToggle = () => {},
  onSort = () => {},
  sortColumn = null,
  sortDirection = null,
  variant = 'netflix',
  size = 'md',
  enableColumnReordering = true,
  enableColumnResizing = true,
  enableColumnToggling = true,
  enableSorting = true,
  showColumnGrips = true,
  saveLayout = true,
  layoutName = 'default-table-layout',
  minColumnWidth = 100,
  maxColumnWidth = 500,
  ...props
}) => {
  const [columns, setColumns] = useState(initialColumns)
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [overColumn, setOverColumn] = useState(null)

  // Initialize sortable functionality
  const { sortableItems, getSortableProps, isDragging } = useSortable(
    columns,
    (newColumns) => {
      setColumns(newColumns)
      onColumnReorder(newColumns)
      
      // Save layout if enabled
      if (saveLayout) {
        defaultLayoutManager.saveLayout(layoutName, {
          items: newColumns,
          config: { type: 'table', enableReordering: enableColumnReordering }
        }, {
          description: 'Table column layout',
          type: 'table'
        })
      }
    },
    {
      orientation: 'horizontal',
      disabled: !enableColumnReordering
    }
  )

  // Load saved layout on mount
  useEffect(() => {
    if (saveLayout && initialColumns.length > 0) {
      try {
        const savedLayout = defaultLayoutManager.loadLayout(layoutName)
        if (savedLayout && savedLayout.layout.items) {
          setColumns(savedLayout.layout.items)
        }
      } catch (error) {
        console.log('No saved layout found, using default columns')
      }
    }
  }, [saveLayout, layoutName, initialColumns])

  // Handle column resize
  const handleColumnResize = (columnKey, newWidth) => {
    const newColumns = columns.map(col => 
      col.key === columnKey ? { ...col, width: newWidth } : col
    )
    setColumns(newColumns)
    onColumnResize(columnKey, newWidth)
    
    // Save layout
    if (saveLayout) {
      defaultLayoutManager.saveLayout(layoutName, {
        items: newColumns,
        config: { type: 'table', enableReordering: enableColumnReordering }
      })
    }
  }

  // Handle column visibility toggle
  const handleColumnToggle = (columnKey) => {
    const newColumns = columns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    )
    setColumns(newColumns)
    onColumnToggle(columnKey)
    
    // Save layout
    if (saveLayout) {
      defaultLayoutManager.saveLayout(layoutName, {
        items: newColumns,
        config: { type: 'table', enableReordering: enableColumnReordering }
      })
    }
  }

  // Variant styles
  const variants = {
    netflix: {
      bg: 'rgba(10, 10, 10, 0.95)',
      headerBg: 'rgba(31, 31, 31, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      rowBg: 'rgba(255, 255, 255, 0.02)',
      hoverBg: 'rgba(255, 255, 255, 0.05)'
    },
    wireshark: {
      bg: 'rgba(6, 182, 212, 0.05)',
      headerBg: 'rgba(6, 182, 212, 0.1)',
      borderColor: 'rgba(6, 182, 212, 0.2)',
      rowBg: 'rgba(6, 182, 212, 0.02)',
      hoverBg: 'rgba(6, 182, 212, 0.05)'
    }
  }

  const currentVariant = variants[variant] || variants.netflix

  // Size configurations
  const sizes = {
    sm: { fontSize: 'sm', cellPadding: 2 },
    md: { fontSize: 'md', cellPadding: 3 },
    lg: { fontSize: 'lg', cellPadding: 4 }
  }

  const currentSize = sizes[size] || sizes.md

  // Get visible columns
  const visibleColumns = columns.filter(col => col.visible !== false)

  return (
    <Box
      overflow="auto"
      bg={currentVariant.bg}
      borderRadius="12px"
      border="1px solid"
      borderColor={currentVariant.borderColor}
      {...props}
    >
      <Table variant="simple" size={size}>
        <Thead bg={currentVariant.headerBg}>
          <Tr>
            {visibleColumns.map((column, index) => {
              const sortableProps = getSortableProps(index)
              
              return (
                <DraggableColumnHeader
                  key={column.key}
                  ref={sortableProps.draggable}
                  column={column}
                  index={index}
                  isDragging={isDragging && draggedColumn === index}
                  isOver={overColumn === index}
                  canDrop={true}
                  onSort={enableSorting ? onSort : undefined}
                  onResize={enableColumnResizing ? handleColumnResize : undefined}
                  onToggleVisibility={enableColumnToggling ? handleColumnToggle : undefined}
                  sortDirection={sortColumn === column.key ? sortDirection : null}
                  isResizable={enableColumnResizing}
                  isSortable={enableSorting && column.sortable !== false}
                  minWidth={minColumnWidth}
                  maxWidth={maxColumnWidth}
                  showGrip={showColumnGrips && enableColumnReordering}
                  style={sortableProps.style}
                  {...sortableProps.droppable}
                />
              )
            })}
          </Tr>
        </Thead>
        
        <Tbody>
          <AnimatePresence>
            {data.map((row, rowIndex) => (
              <MotionTr
                key={row.id || rowIndex}
                bg={currentVariant.rowBg}
                _hover={{ bg: currentVariant.hoverBg }}
                borderColor={currentVariant.borderColor}
                variants={listItemAnimations}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={rowIndex}
              >
                {visibleColumns.map((column) => (
                  <Td
                    key={`${row.id || rowIndex}-${column.key}`}
                    fontSize={currentSize.fontSize}
                    p={currentSize.cellPadding}
                    color="netflix.white"
                    borderColor={currentVariant.borderColor}
                  >
                    {column.render 
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]
                    }
                  </Td>
                ))}
              </MotionTr>
            ))}
          </AnimatePresence>
        </Tbody>
      </Table>
    </Box>
  )
}

// Column configuration helper component
export const ColumnConfigPanel = ({
  columns = [],
  onColumnsChange = () => {},
  onResetToDefault = () => {},
  showVisibilityControls = true,
  showOrderControls = true,
  showWidthControls = true
}) => {
  const handleMoveUp = (index) => {
    if (index === 0) return
    const newColumns = [...columns]
    const [moved] = newColumns.splice(index, 1)
    newColumns.splice(index - 1, 0, moved)
    onColumnsChange(newColumns)
  }

  const handleMoveDown = (index) => {
    if (index === columns.length - 1) return
    const newColumns = [...columns]
    const [moved] = newColumns.splice(index, 1)
    newColumns.splice(index + 1, 0, moved)
    onColumnsChange(newColumns)
  }

  const handleToggleVisibility = (index) => {
    const newColumns = columns.map((col, i) => 
      i === index ? { ...col, visible: !col.visible } : col
    )
    onColumnsChange(newColumns)
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="bold" color="netflix.white">
          Column Configuration
        </Text>
        <IconButton
          size="sm"
          variant="netflixSecondary"
          icon={<Text fontSize="sm">🔄</Text>}
          onClick={onResetToDefault}
          aria-label="Reset to default"
        />
      </HStack>

      <VStack spacing={2} align="stretch">
        {columns.map((column, index) => (
          <MotionBox
            key={column.key}
            p={3}
            bg="rgba(31, 31, 31, 0.8)"
            borderRadius="8px"
            border="1px solid rgba(255, 255, 255, 0.1)"
            variants={listItemAnimations}
            initial="hidden"
            animate="visible"
            custom={index}
          >
            <HStack justify="space-between">
              <HStack spacing={3} flex={1}>
                {showVisibilityControls && (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    color={column.visible ? 'green.400' : 'red.400'}
                    icon={<Text fontSize="sm">{column.visible ? '👁️' : '🚫'}</Text>}
                    onClick={() => handleToggleVisibility(index)}
                    aria-label={column.visible ? 'Hide column' : 'Show column'}
                  />
                )}
                
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontSize="sm" fontWeight="bold" color="netflix.white">
                    {column.title}
                  </Text>
                  <Text fontSize="xs" color="netflix.silver">
                    {column.key} • {column.type || 'text'}
                  </Text>
                </VStack>

                {showWidthControls && (
                  <Text fontSize="xs" color="netflix.silver">
                    {column.width || 'auto'}px
                  </Text>
                )}
              </HStack>

              {showOrderControls && (
                <VStack spacing={1}>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color="netflix.silver"
                    icon={<Text fontSize="xs">↑</Text>}
                    onClick={() => handleMoveUp(index)}
                    isDisabled={index === 0}
                    aria-label="Move up"
                  />
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color="netflix.silver"
                    icon={<Text fontSize="xs">↓</Text>}
                    onClick={() => handleMoveDown(index)}
                    isDisabled={index === columns.length - 1}
                    aria-label="Move down"
                  />
                </VStack>
              )}
            </HStack>
          </MotionBox>
        ))}
      </VStack>
    </VStack>
  )
}

export { DraggableColumnHeader }
export default DraggableTable