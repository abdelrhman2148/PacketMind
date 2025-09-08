import { useState, useRef, useEffect, createElement } from 'react'
import {
  Box,
  Grid,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Input,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGridLayout } from '../hooks/useDragAndDrop'
import { defaultLayoutManager } from '../utils/layoutManager'
import DropZone from './DropZone'
import { scaleAnimations, listItemAnimations, slideAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionGrid = motion(Grid)

// Widget wrapper component
const DraggableWidget = ({
  widget,
  layout,
  isDragging = false,
  onRemove = () => {},
  onEdit = () => {},
  onResize = () => {},
  isResizable = true,
  isRemovable = true,
  isEditable = true,
  showControls = true,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef(null)

  // Handle resize
  const handleResizeStart = (event, direction) => {
    event.preventDefault()
    setIsResizing(true)
    
    const startX = event.clientX
    const startY = event.clientY
    const startW = layout.w
    const startH = layout.h

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      let newW = startW
      let newH = startH

      if (direction.includes('right')) {
        newW = Math.max(1, startW + Math.round(deltaX / 100))
      }
      if (direction.includes('bottom')) {
        newH = Math.max(1, startH + Math.round(deltaY / 60))
      }

      onResize(widget.id, { w: newW, h: newH })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Widget status indicator
  const getStatusColor = () => {
    switch (widget.status) {
      case 'active': return 'green.400'
      case 'warning': return 'yellow.400'
      case 'error': return 'red.400'
      case 'loading': return 'blue.400'
      default: return 'gray.400'
    }
  }

  return (
    <MotionBox
      position="relative"
      bg="rgba(31, 31, 31, 0.95)"
      borderRadius="12px"
      border="2px solid"
      borderColor={isDragging ? '#06B6D4' : 'rgba(255, 255, 255, 0.1)'}
      overflow="hidden"
      cursor={isDragging ? 'grabbing' : 'default'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={scaleAnimations}
      initial="initial"
      animate={isDragging ? "scaleOut" : "animate"}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Widget Header */}
      <HStack
        p={3}
        bg="rgba(10, 10, 10, 0.8)"
        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
        justify="space-between"
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
      >
        <HStack spacing={2}>
          {/* Status indicator */}
          <Box
            w="8px"
            h="8px"
            borderRadius="50%"
            bg={getStatusColor()}
            boxShadow={`0 0 8px ${getStatusColor()}`}
          />
          
          {/* Widget title */}
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="netflix.white"
            noOfLines={1}
          >
            {widget.title}
          </Text>

          {/* Widget type badge */}
          <Badge
            size="sm"
            colorScheme={widget.category === 'analytics' ? 'blue' : 
                        widget.category === 'monitoring' ? 'green' :
                        widget.category === 'alerts' ? 'red' : 'gray'}
            fontSize="xs"
          >
            {widget.type}
          </Badge>
        </HStack>

        {/* Widget controls */}
        <AnimatePresence>
          {showControls && (isHovered || isDragging) && (
            <MotionHStack
              spacing={1}
              variants={slideAnimations.slideInRight}
              initial="initial"
              animate="animate"
              exit="initial"
            >
              {isEditable && (
                <Tooltip label="Edit widget">
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color="netflix.silver"
                    icon={<Text fontSize="xs">⚙️</Text>}
                    onClick={() => onEdit(widget)}
                    _hover={{ color: 'netflix.white', bg: 'rgba(255, 255, 255, 0.1)' }}
                  />
                </Tooltip>
              )}

              {isRemovable && (
                <Tooltip label="Remove widget">
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color="red.400"
                    icon={<Text fontSize="xs">✕</Text>}
                    onClick={() => onRemove(widget.id)}
                    _hover={{ color: 'red.300', bg: 'rgba(239, 68, 68, 0.1)' }}
                  />
                </Tooltip>
              )}
            </MotionHStack>
          )}
        </AnimatePresence>
      </HStack>

      {/* Widget Content */}
      <Box p={4} h="calc(100% - 60px)" overflow="auto">
        {widget.component ? (
          createElement(widget.component, widget.props || {})
        ) : (
          <VStack spacing={3} justify="center" align="center" h="100%">
            <Text fontSize="4xl" opacity={0.5}>
              {widget.icon || '📊'}
            </Text>
            <Text color="netflix.silver" textAlign="center" fontSize="sm">
              {widget.description || 'Widget content will appear here'}
            </Text>
          </VStack>
        )}
      </Box>

      {/* Resize handles */}
      {isResizable && (isHovered || isResizing) && (
        <>
          {/* Bottom-right resize handle */}
          <Box
            position="absolute"
            bottom="0"
            right="0"
            w="20px"
            h="20px"
            cursor="nw-resize"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            _hover={{
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                w: '0',
                h: '0',
                borderBottom: '8px solid #06B6D4',
                borderLeft: '8px solid transparent'
              }
            }}
          />

          {/* Right resize handle */}
          <Box
            position="absolute"
            top="20px"
            bottom="20px"
            right="0"
            w="4px"
            cursor="col-resize"
            bg="transparent"
            _hover={{ bg: 'rgba(6, 182, 212, 0.5)' }}
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />

          {/* Bottom resize handle */}
          <Box
            position="absolute"
            bottom="0"
            left="20px"
            right="20px"
            h="4px"
            cursor="row-resize"
            bg="transparent"
            _hover={{ bg: 'rgba(6, 182, 212, 0.5)' }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
        </>
      )}

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <MotionBox
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(6, 182, 212, 0.1)"
            border="2px dashed #06B6D4"
            borderRadius="12px"
            pointerEvents="none"
            variants={scaleAnimations}
            initial="initial"
            animate="animate"
            exit="initial"
          />
        )}
      </AnimatePresence>
    </MotionBox>
  )
}

// Widget library/selector
const WidgetLibrary = ({ onAddWidget = () => {}, availableWidgets = [] }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'All Widgets', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'monitoring', label: 'Monitoring', icon: '👁️' },
    { id: 'alerts', label: 'Alerts', icon: '🚨' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'security', label: 'Security', icon: '🔐' }
  ]

  const filteredWidgets = selectedCategory === 'all' 
    ? availableWidgets 
    : availableWidgets.filter(w => w.category === selectedCategory)

  return (
    <>
      <Button
        variant="netflixPrimary"
        leftIcon={<Text>➕</Text>}
        onClick={onOpen}
        size="sm"
      >
        Add Widget
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg="netflix.black" border="1px solid rgba(255, 255, 255, 0.1)">
          <ModalHeader color="netflix.white">Widget Library</ModalHeader>
          <ModalCloseButton color="netflix.white" />
          
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {/* Category filter */}
              <HStack spacing={2} wrap="wrap">
                {categories.map(category => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={selectedCategory === category.id ? 'netflixPrimary' : 'netflixSecondary'}
                    leftIcon={<Text>{category.icon}</Text>}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.label}
                  </Button>
                ))}
              </HStack>

              <Divider borderColor="rgba(255, 255, 255, 0.1)" />

              {/* Widget grid */}
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                {filteredWidgets.map(widget => (
                  <MotionBox
                    key={widget.id}
                    p={4}
                    bg="rgba(31, 31, 31, 0.8)"
                    borderRadius="8px"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    cursor="pointer"
                    onClick={() => {
                      onAddWidget(widget)
                      onClose()
                    }}
                    variants={scaleAnimations}
                    whileHover="animate"
                    whileTap="scaleOut"
                  >
                    <VStack spacing={3} align="center">
                      <Text fontSize="2xl">{widget.icon}</Text>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="netflix.white"
                        textAlign="center"
                      >
                        {widget.title}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="netflix.silver"
                        textAlign="center"
                        noOfLines={2}
                      >
                        {widget.description}
                      </Text>
                      <Badge colorScheme="blue" size="sm">
                        {widget.category}
                      </Badge>
                    </VStack>
                  </MotionBox>
                ))}
              </Grid>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

// Widget editor modal
const WidgetEditor = ({ widget, isOpen, onClose, onSave }) => {
  const [editedWidget, setEditedWidget] = useState(widget || {})

  useEffect(() => {
    setEditedWidget(widget || {})
  }, [widget])

  const handleSave = () => {
    onSave(editedWidget)
    onClose()
  }

  if (!widget) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent bg="netflix.black" border="1px solid rgba(255, 255, 255, 0.1)">
        <ModalHeader color="netflix.white">Edit Widget</ModalHeader>
        <ModalCloseButton color="netflix.white" />
        
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Widget title */}
            <FormControl>
              <FormLabel color="netflix.white">Title</FormLabel>
              <Input
                value={editedWidget.title || ''}
                onChange={(e) => setEditedWidget(prev => ({ ...prev, title: e.target.value }))}
                bg="rgba(31, 31, 31, 0.8)"
                border="1px solid rgba(255, 255, 255, 0.2)"
                color="netflix.white"
              />
            </FormControl>

            {/* Widget description */}
            <FormControl>
              <FormLabel color="netflix.white">Description</FormLabel>
              <Input
                value={editedWidget.description || ''}
                onChange={(e) => setEditedWidget(prev => ({ ...prev, description: e.target.value }))}
                bg="rgba(31, 31, 31, 0.8)"
                border="1px solid rgba(255, 255, 255, 0.2)"
                color="netflix.white"
              />
            </FormControl>

            {/* Widget size */}
            <HStack spacing={4}>
              <FormControl>
                <FormLabel color="netflix.white">Width</FormLabel>
                <NumberInput
                  value={editedWidget.w || 2}
                  onChange={(_, value) => setEditedWidget(prev => ({ ...prev, w: value }))}
                  min={1}
                  max={12}
                >
                  <NumberInputField
                    bg="rgba(31, 31, 31, 0.8)"
                    border="1px solid rgba(255, 255, 255, 0.2)"
                    color="netflix.white"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper color="netflix.white" />
                    <NumberDecrementStepper color="netflix.white" />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel color="netflix.white">Height</FormLabel>
                <NumberInput
                  value={editedWidget.h || 2}
                  onChange={(_, value) => setEditedWidget(prev => ({ ...prev, h: value }))}
                  min={1}
                  max={8}
                >
                  <NumberInputField
                    bg="rgba(31, 31, 31, 0.8)"
                    border="1px solid rgba(255, 255, 255, 0.2)"
                    color="netflix.white"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper color="netflix.white" />
                    <NumberDecrementStepper color="netflix.white" />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </HStack>

            {/* Save button */}
            <Button variant="netflixPrimary" onClick={handleSave} mt={4}>
              Save Changes
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

// Main dashboard component
const DraggableDashboard = ({
  initialLayout = [],
  availableWidgets = [],
  onLayoutChange = () => {},
  onWidgetAdd = () => {},
  onWidgetRemove = () => {},
  onWidgetEdit = () => {},
  gridConfig = { cols: 12, rowHeight: 60 },
  layoutName = 'dashboard-layout',
  enableAddWidget = true,
  enableRemoveWidget = true,
  enableEditWidget = true,
  enableLayoutSave = true,
  showGrid = true,
  ...props
}) => {
  const [layout, setLayout] = useState(initialLayout)
  const [widgets, setWidgets] = useState(new Map())
  const [editingWidget, setEditingWidget] = useState(null)
  const { isOpen: isEditorOpen, onOpen: onEditorOpen, onClose: onEditorClose } = useDisclosure()

  // Grid layout hook
  const { getGridItemProps, isDragging } = useGridLayout(
    layout,
    (newLayout) => {
      setLayout(newLayout)
      onLayoutChange(newLayout)
      
      // Save layout
      if (enableLayoutSave) {
        defaultLayoutManager.saveLayout(layoutName, {
          items: newLayout,
          config: { ...gridConfig, type: 'dashboard' }
        }, {
          description: 'Dashboard layout',
          type: 'dashboard'
        })
      }
    },
    gridConfig
  )

  // Load saved layout
  useEffect(() => {
    if (enableLayoutSave && initialLayout.length === 0) {
      try {
        const savedLayout = defaultLayoutManager.loadLayout(layoutName)
        if (savedLayout?.layout?.items) {
          setLayout(savedLayout.layout.items)
        }
      } catch (error) {
        console.log('No saved dashboard layout found')
      }
    }
  }, [enableLayoutSave, layoutName, initialLayout])

  // Initialize widgets map
  useEffect(() => {
    const widgetMap = new Map()
    layout.forEach(item => {
      const widgetDef = availableWidgets.find(w => w.id === item.i) || item.widget
      if (widgetDef) {
        widgetMap.set(item.i, { ...widgetDef, ...item })
      }
    })
    setWidgets(widgetMap)
  }, [layout, availableWidgets])

  // Add widget
  const handleAddWidget = (widgetDef) => {
    const newItem = {
      i: `widget-${Date.now()}`,
      x: 0,
      y: Infinity, // Auto-place at bottom
      w: widgetDef.defaultWidth || 2,
      h: widgetDef.defaultHeight || 2,
      widget: widgetDef
    }
    
    const newLayout = [...layout, newItem]
    setLayout(newLayout)
    onWidgetAdd(widgetDef, newItem)
  }

  // Remove widget
  const handleRemoveWidget = (widgetId) => {
    const newLayout = layout.filter(item => item.i !== widgetId)
    setLayout(newLayout)
    onWidgetRemove(widgetId)
  }

  // Edit widget
  const handleEditWidget = (widget) => {
    setEditingWidget(widget)
    onEditorOpen()
  }

  // Save widget changes
  const handleSaveWidget = (editedWidget) => {
    const newLayout = layout.map(item => 
      item.i === editedWidget.id ? { ...item, widget: editedWidget } : item
    )
    setLayout(newLayout)
    onWidgetEdit(editedWidget)
  }

  // Resize widget
  const handleResizeWidget = (widgetId, newSize) => {
    const newLayout = layout.map(item => 
      item.i === widgetId ? { ...item, ...newSize } : item
    )
    setLayout(newLayout)
  }

  return (
    <Box {...props}>
      {/* Dashboard header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Text fontSize="xl" fontWeight="bold" color="netflix.white">
            Dashboard
          </Text>
          <Text fontSize="sm" color="netflix.silver">
            {layout.length} widgets • Drag to rearrange
          </Text>
        </VStack>

        <HStack spacing={3}>
          {enableAddWidget && (
            <WidgetLibrary
              availableWidgets={availableWidgets}
              onAddWidget={handleAddWidget}
            />
          )}

          <Menu>
            <MenuButton as={Button} variant="netflixSecondary" size="sm">
              ⚙️ Options
            </MenuButton>
            <MenuList bg="netflix.black" border="1px solid rgba(255, 255, 255, 0.1)">
              <MenuItem
                bg="transparent"
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                onClick={() => setLayout([])}
              >
                Clear Dashboard
              </MenuItem>
              <MenuItem
                bg="transparent"
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                Export Layout
              </MenuItem>
              <MenuItem
                bg="transparent"
                color="netflix.white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                Import Layout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </HStack>

      {/* Dashboard grid */}
      <Box position="relative" minH="400px">
        {/* Grid background */}
        {showGrid && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            opacity={0.1}
            pointerEvents="none"
            backgroundImage={`
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `}
            backgroundSize={`${100 / gridConfig.cols}% ${gridConfig.rowHeight}px`}
          />
        )}

        {/* Drop zone for new widgets */}
        {layout.length === 0 && (
          <DropZone
            onDrop={({ draggedItem }) => {
              if (draggedItem.widget) {
                handleAddWidget(draggedItem.widget)
              }
            }}
            placeholder="Drop widgets here to get started"
            minH="400px"
          />
        )}

        {/* Widgets */}
        <AnimatePresence>
          {layout.map((item) => {
            const widget = widgets.get(item.i)
            if (!widget) return null

            const gridProps = getGridItemProps(item)

            return (
              <DraggableWidget
                key={item.i}
                widget={widget}
                layout={item}
                isDragging={isDragging}
                onRemove={enableRemoveWidget ? handleRemoveWidget : undefined}
                onEdit={enableEditWidget ? handleEditWidget : undefined}
                onResize={handleResizeWidget}
                isRemovable={enableRemoveWidget}
                isEditable={enableEditWidget}
                style={gridProps.style}
                {...gridProps}
              />
            )
          })}
        </AnimatePresence>
      </Box>

      {/* Widget editor */}
      <WidgetEditor
        widget={editingWidget}
        isOpen={isEditorOpen}
        onClose={onEditorClose}
        onSave={handleSaveWidget}
      />
    </Box>
  )
}

export { DraggableWidget, WidgetLibrary, WidgetEditor }
export default DraggableDashboard