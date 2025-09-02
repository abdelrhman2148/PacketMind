import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Switch,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  useDisclosure,
  Tooltip,
  Flex,
  Badge,
  Icon,
  Divider,
  useColorModeValue,
  ScaleFade,
  Slide,
  keyframes,
  chakra,
  shouldForwardProp,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast
} from '@chakra-ui/react'
import { motion, isValidMotionProp } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Create motion components
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
})

const MotionFlex = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
})

// Animated gradient
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

// Pulse animation
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

// Default column configuration
const DEFAULT_COLUMNS = [
  { id: 'time', label: 'Time', visible: true, width: 120, resizable: true },
  { id: 'source', label: 'Source', visible: true, width: 150, resizable: true },
  { id: 'destination', label: 'Destination', visible: true, width: 150, resizable: true },
  { id: 'protocol', label: 'Protocol', visible: true, width: 100, resizable: true },
  { id: 'length', label: 'Length', visible: true, width: 80, resizable: true },
  { id: 'ports', label: 'Ports', visible: true, width: 120, resizable: true }
]

// Enhanced drag handle icon component
const DragHandleIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"
    />
  </Icon>
)

// Enhanced settings icon component
const SettingsIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
    />
  </Icon>
)

// Column type icons
const getColumnIcon = (columnId) => {
  const iconProps = { boxSize: 4, color: 'gray.500' }
  
  switch (columnId) {
    case 'time':
      return <Icon viewBox="0 0 24 24" {...iconProps}>
        <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m4.2 14.2L11 13V7h1.5v5.2l4.5 2.7l-.8 1.3Z"/>
      </Icon>
    case 'source':
    case 'destination':
      return <Icon viewBox="0 0 24 24" {...iconProps}>
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5l5-5v3h4v4h-4v3z"/>
      </Icon>
    case 'protocol':
      return <Icon viewBox="0 0 24 24" {...iconProps}>
        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22L12 18.77L5.82 22L7 14.14l-5-4.87l6.91-1.01L12 2z"/>
      </Icon>
    case 'length':
      return <Icon viewBox="0 0 24 24" {...iconProps}>
        <path fill="currentColor" d="M3 17h18v2H3v-2zm0-6h18v2H3v-2zm0-6h18v2H3V5z"/>
      </Icon>
    case 'ports':
      return <Icon viewBox="0 0 24 24" {...iconProps}>
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
      </Icon>
    default:
      return <Icon viewBox="0 0 24 24" {...iconProps}>
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2z"/>
      </Icon>
  }
}

// Ultra-enhanced sortable item component
const SortableItem = ({ column, onToggleVisibility, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const bgColor = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const dragBg = useColorModeValue('blue.50', 'blue.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <MotionBox
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.02,
        x: 4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Box
        p={5}
        bg={isDragging ? dragBg : bgColor}
        borderRadius="xl"
        mx={2}
        my={2}
        border="2px solid"
        borderColor={isDragging ? 'blue.400' : borderColor}
        shadow={isDragging ? '2xl' : 'lg'}
        position="relative"
        overflow="hidden"
        _hover={{
          shadow: '2xl',
          borderColor: 'blue.300'
        }}
        transition="all 0.3s ease"
      >
        {/* Animated gradient overlay */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient={column.visible 
            ? "linear(45deg, blue.400, purple.500, pink.500, blue.400)" 
            : "linear(45deg, gray.300, gray.400, gray.300)"
          }
          bgSize="400% 400%"
          animation={column.visible ? `${gradientAnimation} 3s ease infinite` : 'none'}
          opacity={0.1}
          pointerEvents="none"
        />

        {/* Status indicator */}
        <Box
          position="absolute"
          top={2}
          right={2}
          w={3}
          h={3}
          borderRadius="full"
          bg={column.visible ? 'green.400' : 'gray.400'}
          animation={column.visible ? `${pulseAnimation} 2s ease infinite` : 'none'}
        />
        
        <Flex align="center" gap={4} position="relative">
          {/* Enhanced drag handle */}
          <Tooltip 
            label="🖱️ Drag to reorder columns" 
            placement="left" 
            hasArrow
            bg="gray.800"
            color="white"
          >
            <MotionBox
              {...attributes}
              {...listeners}
              cursor="grab"
              _active={{ cursor: 'grabbing' }}
              p={2}
              borderRadius="lg"
              bg="gray.100"
              _hover={{ 
                bg: 'blue.100',
                color: 'blue.600'
              }}
              whileHover={{ rotate: 5 }}
              whileTap={{ rotate: -5, scale: 0.9 }}
              transition="all 0.2s"
            >
              <DragHandleIcon boxSize={6} />
            </MotionBox>
          </Tooltip>

          {/* Enhanced column icon with animation */}
          <MotionBox
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {getColumnIcon(column.id)}
          </MotionBox>

          {/* Enhanced column info */}
          <Box flex={1}>
            <HStack spacing={3} align="center" mb={2}>
              <Text fontSize="md" fontWeight="700" color={column.visible ? 'gray.800' : 'gray.500'}>
                {column.label}
              </Text>
              {!column.visible && (
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Badge 
                    colorScheme="red" 
                    variant="solid"
                    borderRadius="full"
                    fontSize="xs"
                    px={2}
                  >
                    Hidden
                  </Badge>
                </MotionBox>
              )}
              {column.visible && (
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Badge 
                    colorScheme="green" 
                    variant="solid"
                    borderRadius="full"
                    fontSize="xs"
                    px={2}
                  >
                    Visible
                  </Badge>
                </MotionBox>
              )}
            </HStack>
            
            <VStack align="start" spacing={1}>
              <HStack spacing={4}>
                <Text fontSize="xs" color="gray.600" fontWeight="500">
                  Width: {column.width}px
                </Text>
                <Text fontSize="xs" color="gray.600" fontWeight="500">
                  {column.resizable ? '📏 Resizable' : '🔒 Fixed'}
                </Text>
              </HStack>
              <Progress
                value={(column.width / 300) * 100}
                size="xs"
                colorScheme={column.visible ? 'blue' : 'gray'}
                w="100%"
                borderRadius="full"
              />
            </VStack>
          </Box>

          {/* Enhanced visibility toggle */}
          <Tooltip 
            label={
              <VStack spacing={1} p={2}>
                <Text fontWeight="bold">
                  {column.visible ? '👁️ Hide Column' : '👁️‍🗨️ Show Column'}
                </Text>
                <Text fontSize="xs">
                  {column.visible 
                    ? 'Click to hide this column from the table' 
                    : 'Click to show this column in the table'
                  }
                </Text>
              </VStack>
            }
            placement="right" 
            hasArrow
            bg="gray.800"
            color="white"
          >
            <MotionBox
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Switch
                isChecked={column.visible}
                onChange={() => onToggleVisibility(column.id)}
                size="lg"
                colorScheme="blue"
                sx={{
                  '.chakra-switch__track': {
                    bg: column.visible ? 'blue.500' : 'gray.300',
                    _checked: {
                      bg: 'blue.500',
                    }
                  },
                  '.chakra-switch__thumb': {
                    bg: 'white',
                    shadow: 'lg'
                  }
                }}
              />
            </MotionBox>
          </Tooltip>
        </Flex>
      </Box>
    </MotionBox>
  )
}

const ColumnConfig = ({ onColumnChange, initialColumns = DEFAULT_COLUMNS }) => {
  const [columns, setColumns] = useState(initialColumns)
  const [isLoading, setIsLoading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // Load column preferences from localStorage on mount
  useEffect(() => {
    setIsLoading(true)
    const savedColumns = localStorage.getItem('wireshark-web-columns')
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns)
        setColumns(parsedColumns)
        onColumnChange(parsedColumns)
        toast({
          title: "✅ Column preferences loaded",
          description: "Your saved column configuration has been restored",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top-right"
        })
      } catch (error) {
        console.error('Error loading column preferences:', error)
        setColumns(DEFAULT_COLUMNS)
        onColumnChange(DEFAULT_COLUMNS)
        toast({
          title: "⚠️ Failed to load preferences",
          description: "Using default column configuration",
          status: "warning",
          duration: 3000,
          isClosable: true,
          position: "top-right"
        })
      }
    } else {
      setColumns(DEFAULT_COLUMNS)
      onColumnChange(DEFAULT_COLUMNS)
    }
    setIsLoading(false)
  }, [onColumnChange, toast])

  // Save column preferences to localStorage with feedback
  const saveColumns = (newColumns) => {
    try {
      localStorage.setItem('wireshark-web-columns', JSON.stringify(newColumns))
      toast({
        title: "💾 Settings saved",
        description: "Column configuration saved successfully",
        status: "success",
        duration: 1500,
        isClosable: true,
        position: "bottom-right"
      })
    } catch (error) {
      console.error('Error saving column preferences:', error)
      toast({
        title: "❌ Save failed",
        description: "Could not save column preferences",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      })
    }
  }

  // Handle column visibility toggle with animation
  const toggleColumnVisibility = (columnId) => {
    const newColumns = columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    )
    setColumns(newColumns)
    saveColumns(newColumns)
    onColumnChange(newColumns)
  }

  // Handle drag and drop reordering with feedback
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = columns.findIndex(col => col.id === active.id)
      const newIndex = columns.findIndex(col => col.id === over.id)

      const newColumns = arrayMove(columns, oldIndex, newIndex)
      setColumns(newColumns)
      saveColumns(newColumns)
      onColumnChange(newColumns)
      
      toast({
        title: "🔄 Columns reordered",
        description: `Moved ${active.id} column to position ${newIndex + 1}`,
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "bottom-right"
      })
    }
  }

  // Enhanced sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Reset to default columns with confirmation
  const resetToDefaults = () => {
    setColumns(DEFAULT_COLUMNS)
    saveColumns(DEFAULT_COLUMNS)
    onColumnChange(DEFAULT_COLUMNS)
    
    toast({
      title: "🔄 Reset complete",
      description: "Column configuration restored to defaults",
      status: "info",
      duration: 3000,
      isClosable: true,
      position: "top-right"
    })
  }

  // Get statistics
  const visibleCount = columns.filter(col => col.visible).length
  const totalWidth = columns.filter(col => col.visible).reduce((sum, col) => sum + col.width, 0)

  const popoverBg = useColorModeValue('white', 'gray.900')
  const headerBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)'
  )
  const instructionsBg = useColorModeValue('blue.50', 'blue.900')

  if (isLoading) {
    return (
      <IconButton
        icon={<SettingsIcon />}
        size="md"
        variant="ghost"
        aria-label="Loading column configuration"
        isLoading
      />
    )
  }

  return (
    <Popover 
      isOpen={isOpen} 
      onOpen={onOpen} 
      onClose={onClose} 
      placement="bottom-end"
      closeOnBlur={true}
    >
      <PopoverTrigger>
        <Tooltip 
          label={
            <VStack spacing={1} p={2}>
              <Text fontWeight="bold">🛠️ Column Configuration</Text>
              <Text fontSize="xs">Customize your table layout</Text>
              <Text fontSize="xs" color="gray.300">
                {visibleCount} columns visible • {totalWidth}px total width
              </Text>
            </VStack>
          }
          hasArrow 
          placement="bottom"
          bg="gray.800"
          color="white"
        >
          <MotionBox
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <IconButton
              icon={<SettingsIcon />}
              size="lg"
              variant="ghost"
              aria-label="Configure table columns"
              bg="blue.50"
              color="blue.600"
              _hover={{ 
                bg: 'blue.100', 
                color: 'blue.700',
                shadow: 'lg'
              }}
              _active={{ 
                bg: 'blue.200',
                transform: 'scale(0.95)',
              }}
              borderRadius="xl"
              border="2px solid"
              borderColor="blue.200"
              _focus={{
                borderColor: 'blue.400',
                shadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
            />
          </MotionBox>
        </Tooltip>
      </PopoverTrigger>
      
      <MotionBox
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <PopoverContent 
          w="480px" 
          maxH="700px" 
          bg={popoverBg}
          border="2px solid"
          borderColor="blue.200"
          borderRadius="2xl"
          shadow="2xl"
          _focus={{ outline: 'none' }}
          overflow="hidden"
        >
          {/* Ultra-enhanced header */}
          <PopoverHeader 
            bgGradient={headerBg}
            color="white"
            p={6}
            position="relative"
            overflow="hidden"
          >
            {/* Animated background pattern */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bgGradient="linear(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%)"
              bgSize="20px 20px"
              animation={`${gradientAnimation} 10s linear infinite`}
              opacity={0.3}
            />
            
            <VStack spacing={3} position="relative">
              <HStack justify="space-between" align="center" w="100%">
                <HStack spacing={3}>
                  <MotionBox
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <SettingsIcon boxSize={8} />
                  </MotionBox>
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="800" fontSize="xl" letterSpacing="tight">
                      Column Configuration
                    </Text>
                    <Text fontSize="sm" opacity={0.9}>
                      Customize your data view
                    </Text>
                  </VStack>
                </HStack>
                
                <VStack spacing={1}>
                  <Badge 
                    colorScheme="green" 
                    variant="solid"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="700"
                  >
                    {visibleCount}/{columns.length} visible
                  </Badge>
                  <Text fontSize="xs" opacity={0.8}>
                    {totalWidth}px total width
                  </Text>
                </VStack>
              </HStack>

              {/* Stats row */}
              <HStack spacing={6} w="100%" justify="center">
                <VStack spacing={0}>
                  <Text fontSize="lg" fontWeight="700">{columns.length}</Text>
                  <Text fontSize="xs" opacity={0.8}>Total Columns</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontSize="lg" fontWeight="700">{visibleCount}</Text>
                  <Text fontSize="xs" opacity={0.8}>Visible</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontSize="lg" fontWeight="700">{columns.length - visibleCount}</Text>
                  <Text fontSize="xs" opacity={0.8}>Hidden</Text>
                </VStack>
              </HStack>
            </VStack>
          </PopoverHeader>
          
          <PopoverCloseButton 
            size="lg"
            color="white"
            _hover={{ bg: 'whiteAlpha.200', transform: 'scale(1.1)' }}
            _active={{ transform: 'scale(0.9)' }}
            transition="all 0.2s"
            borderRadius="full"
          />
          
          <PopoverBody p={0}>
            <VStack spacing={0} align="stretch">
              {/* Enhanced control section */}
              <Box p={6} borderBottom="2px solid" borderColor="gray.100">
                <VStack spacing={4}>
                  <MotionBox
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    w="100%"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      colorScheme="blue"
                      onClick={resetToDefaults}
                      width="100%"
                      leftIcon={
                        <MotionBox
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Icon viewBox="0 0 24 24" boxSize={5}>
                            <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6c0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6c0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4l-4-4v3z"/>
                          </Icon>
                        </MotionBox>
                      }
                      _hover={{ 
                        bg: 'blue.50',
                        borderColor: 'blue.400',
                        transform: 'translateY(-2px)',
                        shadow: 'lg'
                      }}
                      borderRadius="xl"
                      h={12}
                    >
                      🔄 Reset to Defaults
                    </Button>
                  </MotionBox>

                  {/* Quick stats */}
                  <Alert status="info" borderRadius="xl" bg="blue.50" border="1px solid" borderColor="blue.200">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">
                      <strong>{visibleCount}</strong> columns visible, 
                      <strong> {totalWidth}px</strong> total width
                    </AlertDescription>
                  </Alert>
                </VStack>
              </Box>

              {/* Enhanced column list */}
              <Box maxH="400px" overflowY="auto" p={4}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={columns.map(col => col.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <VStack spacing={3} align="stretch">
                      {columns.map((column, index) => (
                        <SortableItem
                          key={column.id}
                          column={column}
                          index={index}
                          onToggleVisibility={toggleColumnVisibility}
                        />
                      ))}
                    </VStack>
                  </SortableContext>
                </DndContext>
              </Box>

              <Divider />

              {/* Ultra-enhanced instructions */}
              <Box p={6} bgGradient="linear(to-r, blue.50, purple.50)" borderBottomRadius="2xl">
                <VStack spacing={4} align="start">
                  <HStack spacing={2}>
                    <Text fontSize="lg">💡</Text>
                    <Text fontSize="md" fontWeight="700" color="blue.800">
                      Pro Tips & Shortcuts
                    </Text>
                  </HStack>
                  
                  <VStack spacing={3} align="start" fontSize="sm" color="blue.700">
                    <MotionBox
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HStack>
                        <Text fontSize="lg">🖱️</Text>
                        <Text><strong>Drag & Drop:</strong> Use the grip handle to reorder columns</Text>
                      </HStack>
                    </MotionBox>
                    
                    <MotionBox
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HStack>
                        <Text fontSize="lg">👁️</Text>
                        <Text><strong>Visibility:</strong> Toggle switches to show/hide columns</Text>
                      </HStack>
                    </MotionBox>
                    
                    <MotionBox
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HStack>
                        <Text fontSize="lg">💾</Text>
                        <Text><strong>Auto-Save:</strong> All changes are saved automatically</Text>
                      </HStack>
                    </MotionBox>
                    
                    <MotionBox
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HStack>
                        <Text fontSize="lg">📏</Text>
                        <Text><strong>Resize:</strong> Drag column borders in the table to resize</Text>
                      </HStack>
                    </MotionBox>
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </MotionBox>
    </Popover>
  )
}

export default ColumnConfig