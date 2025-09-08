import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// Main drag and drop hook with comprehensive support
export const useDragAndDrop = (options = {}) => {
  const {
    onDragStart = () => {},
    onDragEnd = () => {},
    onDrop = () => {},
    onDragOver = () => {},
    enableTouch = true,
    enableKeyboard = true,
    enableMouse = true,
    dragThreshold = 5,
    scrollSpeed = 10,
    scrollEdgeThreshold = 50,
    autoScroll = true,
    ghostOpacity = 0.5,
    snapToGrid = false,
    gridSize = 20,
    constrainToParent = false,
    axis = null // 'x', 'y', or null for both
  } = options

  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedItem: null,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dragPreview: null,
    dropTarget: null,
    canDrop: false
  })

  const dragRef = useRef({
    startTime: 0,
    startMousePos: { x: 0, y: 0 },
    currentMousePos: { x: 0, y: 0 },
    draggedElement: null,
    dropTargets: new Map(),
    scrollInterval: null,
    keyboardMode: false,
    focusedDropTarget: null
  })

  // Register draggable element
  const registerDraggable = useCallback((element, data, options = {}) => {
    if (!element) return () => {}

    const {
      disabled = false,
      handle = null,
      preview = null,
      canDrag = () => true
    } = options

    const handleStart = (event) => {
      if (disabled || !canDrag(data)) return

      // Check if drag started from handle
      if (handle && !handle.contains(event.target)) return

      event.preventDefault()
      
      const startTime = Date.now()
      const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0
      const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0
      
      const rect = element.getBoundingClientRect()
      const offset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      }

      dragRef.current = {
        ...dragRef.current,
        startTime,
        startMousePos: { x: clientX, y: clientY },
        currentMousePos: { x: clientX, y: clientY },
        draggedElement: element
      }

      setDragState(prev => ({
        ...prev,
        draggedItem: data,
        dragOffset: offset,
        startPosition: { x: clientX, y: clientY },
        currentPosition: { x: clientX, y: clientY }
      }))

      onDragStart({ data, element, event, offset })

      // Add global listeners
      if (enableMouse) {
        document.addEventListener('mousemove', handleMove)
        document.addEventListener('mouseup', handleEnd)
      }
      if (enableTouch) {
        document.addEventListener('touchmove', handleMove, { passive: false })
        document.addEventListener('touchend', handleEnd)
      }
    }

    const handleMove = (event) => {
      const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0
      const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0
      
      dragRef.current.currentMousePos = { x: clientX, y: clientY }

      // Check if drag threshold is met
      const deltaX = clientX - dragRef.current.startMousePos.x
      const deltaY = clientY - dragRef.current.startMousePos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (!dragState.isDragging && distance >= dragThreshold) {
        setDragState(prev => ({
          ...prev,
          isDragging: true,
          dragPreview: preview || element.cloneNode(true)
        }))
      }

      if (dragState.isDragging) {
        event.preventDefault()
        
        let newX = clientX
        let newY = clientY

        // Apply axis constraints
        if (axis === 'x') {
          newY = dragRef.current.startMousePos.y
        } else if (axis === 'y') {
          newX = dragRef.current.startMousePos.x
        }

        // Apply grid snapping
        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize
          newY = Math.round(newY / gridSize) * gridSize
        }

        // Apply parent constraints
        if (constrainToParent && element.parentElement) {
          const parentRect = element.parentElement.getBoundingClientRect()
          const elementRect = element.getBoundingClientRect()
          
          newX = Math.max(parentRect.left, Math.min(newX, parentRect.right - elementRect.width))
          newY = Math.max(parentRect.top, Math.min(newY, parentRect.bottom - elementRect.height))
        }

        setDragState(prev => ({
          ...prev,
          currentPosition: { x: newX, y: newY }
        }))

        // Auto-scroll
        if (autoScroll) {
          handleAutoScroll(clientX, clientY)
        }

        // Check for drop targets
        const dropTarget = findDropTarget(clientX, clientY)
        setDragState(prev => ({
          ...prev,
          dropTarget,
          canDrop: dropTarget ? dropTarget.canDrop(dragState.draggedItem) : false
        }))

        onDragOver({ data, element, event, position: { x: newX, y: newY } })
      }
    }

    const handleEnd = (event) => {
      // Remove global listeners
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)

      if (dragRef.current.scrollInterval) {
        clearInterval(dragRef.current.scrollInterval)
        dragRef.current.scrollInterval = null
      }

      const wasKeyboardMode = dragRef.current.keyboardMode
      
      if (dragState.isDragging) {
        // Handle drop
        if (dragState.dropTarget && dragState.canDrop) {
          onDrop({
            draggedItem: dragState.draggedItem,
            dropTarget: dragState.dropTarget,
            position: dragState.currentPosition,
            event
          })
        }

        onDragEnd({
          data: dragState.draggedItem,
          element,
          event,
          dropped: dragState.dropTarget && dragState.canDrop,
          keyboardMode: wasKeyboardMode
        })
      }

      // Reset state
      setDragState({
        isDragging: false,
        draggedItem: null,
        dragOffset: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragPreview: null,
        dropTarget: null,
        canDrop: false
      })

      dragRef.current = {
        ...dragRef.current,
        draggedElement: null,
        keyboardMode: false,
        focusedDropTarget: null
      }
    }

    // Mouse events
    if (enableMouse) {
      element.addEventListener('mousedown', handleStart)
    }

    // Touch events
    if (enableTouch) {
      element.addEventListener('touchstart', handleStart, { passive: false })
    }

    // Keyboard events
    if (enableKeyboard) {
      element.addEventListener('keydown', handleKeyDown)
    }

    // Cleanup function
    return () => {
      element.removeEventListener('mousedown', handleStart)
      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [dragState, onDragStart, onDragEnd, onDrop, onDragOver, enableTouch, enableKeyboard, enableMouse, dragThreshold, autoScroll, axis, snapToGrid, gridSize, constrainToParent])

  // Register drop target
  const registerDropTarget = useCallback((element, data, options = {}) => {
    if (!element) return () => {}

    const {
      canDrop = () => true,
      onDragEnter = () => {},
      onDragLeave = () => {},
      onDrop: onDropCallback = () => {},
      acceptTypes = []
    } = options

    const dropTargetData = {
      element,
      data,
      canDrop: (draggedItem) => {
        if (acceptTypes.length > 0 && draggedItem.type && !acceptTypes.includes(draggedItem.type)) {
          return false
        }
        return canDrop(draggedItem)
      },
      onDragEnter,
      onDragLeave,
      onDrop: onDropCallback
    }

    dragRef.current.dropTargets.set(element, dropTargetData)

    return () => {
      dragRef.current.dropTargets.delete(element)
    }
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!enableKeyboard) return

    const { key, shiftKey, ctrlKey, altKey } = event

    switch (key) {
      case ' ':
      case 'Enter':
        event.preventDefault()
        dragRef.current.keyboardMode = true
        // Start keyboard drag mode
        if (!dragState.isDragging) {
          const element = event.target
          const rect = element.getBoundingClientRect()
          const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          }
          
          setDragState(prev => ({
            ...prev,
            isDragging: true,
            draggedItem: { element, keyboard: true },
            startPosition: center,
            currentPosition: center
          }))
          
          onDragStart({ 
            data: { element, keyboard: true }, 
            element, 
            event, 
            offset: { x: rect.width / 2, y: rect.height / 2 } 
          })
        } else {
          // Drop in keyboard mode
          if (dragState.dropTarget && dragState.canDrop) {
            onDrop({
              draggedItem: dragState.draggedItem,
              dropTarget: dragState.dropTarget,
              position: dragState.currentPosition,
              event,
              keyboardMode: true
            })
          }
          
          // End drag
          setDragState(prev => ({
            ...prev,
            isDragging: false,
            draggedItem: null,
            dropTarget: null,
            canDrop: false
          }))
          
          onDragEnd({
            data: dragState.draggedItem,
            element: event.target,
            event,
            dropped: dragState.dropTarget && dragState.canDrop,
            keyboardMode: true
          })
        }
        break

      case 'Escape':
        if (dragState.isDragging) {
          event.preventDefault()
          // Cancel drag
          setDragState(prev => ({
            ...prev,
            isDragging: false,
            draggedItem: null,
            dropTarget: null,
            canDrop: false
          }))
          
          onDragEnd({
            data: dragState.draggedItem,
            element: event.target,
            event,
            dropped: false,
            cancelled: true,
            keyboardMode: true
          })
        }
        break

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (dragState.isDragging) {
          event.preventDefault()
          const moveDistance = shiftKey ? 10 : ctrlKey ? 1 : 5
          let deltaX = 0
          let deltaY = 0

          switch (key) {
            case 'ArrowUp':
              deltaY = -moveDistance
              break
            case 'ArrowDown':
              deltaY = moveDistance
              break
            case 'ArrowLeft':
              deltaX = -moveDistance
              break
            case 'ArrowRight':
              deltaX = moveDistance
              break
          }

          const newPosition = {
            x: dragState.currentPosition.x + deltaX,
            y: dragState.currentPosition.y + deltaY
          }

          setDragState(prev => ({
            ...prev,
            currentPosition: newPosition
          }))

          // Find drop target at new position
          const dropTarget = findDropTarget(newPosition.x, newPosition.y)
          setDragState(prev => ({
            ...prev,
            dropTarget,
            canDrop: dropTarget ? dropTarget.canDrop(dragState.draggedItem) : false
          }))
        } else {
          // Navigate between drop targets
          navigateDropTargets(key)
        }
        break

      case 'Tab':
        if (dragState.isDragging) {
          event.preventDefault()
          cycleDropTargets(shiftKey)
        }
        break
    }
  }, [dragState, enableKeyboard, onDragStart, onDragEnd, onDrop])

  // Find drop target at position
  const findDropTarget = useCallback((x, y) => {
    for (const [element, dropTarget] of dragRef.current.dropTargets) {
      const rect = element.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return dropTarget
      }
    }
    return null
  }, [])

  // Auto-scroll functionality
  const handleAutoScroll = useCallback((clientX, clientY) => {
    const { scrollInterval } = dragRef.current
    
    if (scrollInterval) {
      clearInterval(scrollInterval)
    }

    const viewport = {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight
    }

    let scrollX = 0
    let scrollY = 0

    if (clientX < scrollEdgeThreshold) {
      scrollX = -scrollSpeed
    } else if (clientX > viewport.right - scrollEdgeThreshold) {
      scrollX = scrollSpeed
    }

    if (clientY < scrollEdgeThreshold) {
      scrollY = -scrollSpeed
    } else if (clientY > viewport.bottom - scrollEdgeThreshold) {
      scrollY = scrollSpeed
    }

    if (scrollX !== 0 || scrollY !== 0) {
      dragRef.current.scrollInterval = setInterval(() => {
        window.scrollBy(scrollX, scrollY)
      }, 16) // ~60fps
    }
  }, [scrollSpeed, scrollEdgeThreshold])

  // Navigate drop targets with keyboard
  const navigateDropTargets = useCallback((key) => {
    const dropTargets = Array.from(dragRef.current.dropTargets.keys())
    const currentFocus = dragRef.current.focusedDropTarget
    let currentIndex = currentFocus ? dropTargets.indexOf(currentFocus) : -1

    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        currentIndex = (currentIndex + 1) % dropTargets.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        currentIndex = currentIndex <= 0 ? dropTargets.length - 1 : currentIndex - 1
        break
    }

    if (dropTargets[currentIndex]) {
      dropTargets[currentIndex].focus()
      dragRef.current.focusedDropTarget = dropTargets[currentIndex]
    }
  }, [])

  // Cycle through drop targets
  const cycleDropTargets = useCallback((reverse = false) => {
    const dropTargets = Array.from(dragRef.current.dropTargets.keys())
    const currentFocus = dragRef.current.focusedDropTarget
    let currentIndex = currentFocus ? dropTargets.indexOf(currentFocus) : -1

    if (reverse) {
      currentIndex = currentIndex <= 0 ? dropTargets.length - 1 : currentIndex - 1
    } else {
      currentIndex = (currentIndex + 1) % dropTargets.length
    }

    if (dropTargets[currentIndex]) {
      const dropTarget = dragRef.current.dropTargets.get(dropTargets[currentIndex])
      setDragState(prev => ({
        ...prev,
        dropTarget,
        canDrop: dropTarget ? dropTarget.canDrop(dragState.draggedItem) : false
      }))
      dragRef.current.focusedDropTarget = dropTargets[currentIndex]
    }
  }, [dragState.draggedItem])

  // Get drag style for preview
  const getDragStyle = useCallback((isDragging = dragState.isDragging) => {
    if (!isDragging) return {}

    const { currentPosition, dragOffset } = dragState
    
    return {
      position: 'fixed',
      left: currentPosition.x - dragOffset.x,
      top: currentPosition.y - dragOffset.y,
      opacity: ghostOpacity,
      pointerEvents: 'none',
      zIndex: 9999,
      transform: 'rotate(3deg)',
      transition: 'none'
    }
  }, [dragState, ghostOpacity])

  // Get drop style for drop zones
  const getDropStyle = useCallback((isOver = false, canDrop = false) => {
    const baseStyle = {
      transition: 'all 0.2s ease'
    }

    if (isOver && canDrop) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        borderColor: '#06B6D4',
        transform: 'scale(1.02)'
      }
    } else if (isOver) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#EF4444'
      }
    } else if (dragState.isDragging) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed'
      }
    }

    return baseStyle
  }, [dragState.isDragging])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragRef.current.scrollInterval) {
        clearInterval(dragRef.current.scrollInterval)
      }
    }
  }, [])

  return {
    // State
    dragState,
    isDragging: dragState.isDragging,
    draggedItem: dragState.draggedItem,
    dropTarget: dragState.dropTarget,
    canDrop: dragState.canDrop,
    
    // Functions
    registerDraggable,
    registerDropTarget,
    getDragStyle,
    getDropStyle,
    
    // Utilities
    findDropTarget,
    navigateDropTargets,
    cycleDropTargets
  }
}

// Hook for sortable lists
export const useSortable = (items, onReorder, options = {}) => {
  const {
    orientation = 'vertical',
    animationDuration = 300,
    disabled = false
  } = options

  const [sortableItems, setSortableItems] = useState(items)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const { registerDraggable, registerDropTarget, isDragging } = useDragAndDrop({
    onDragStart: ({ data }) => {
      setDraggedIndex(data.index)
    },
    onDragEnd: ({ dropped }) => {
      if (dropped && draggedIndex !== null && overIndex !== null) {
        const newItems = [...sortableItems]
        const [draggedItem] = newItems.splice(draggedIndex, 1)
        newItems.splice(overIndex, 0, draggedItem)
        
        setSortableItems(newItems)
        onReorder(newItems)
      }
      
      setDraggedIndex(null)
      setOverIndex(null)
    },
    axis: orientation === 'horizontal' ? 'x' : 'y',
    enabled: !disabled
  })

  useEffect(() => {
    setSortableItems(items)
  }, [items])

  const getSortableProps = useCallback((index) => {
    const item = sortableItems[index]
    
    return {
      draggable: registerDraggable,
      droppable: registerDropTarget,
      data: { item, index },
      style: {
        transition: isDragging ? 'none' : `transform ${animationDuration}ms ease`,
        transform: draggedIndex === index ? 'scale(1.05)' : 'scale(1)',
        opacity: draggedIndex === index ? 0.5 : 1
      }
    }
  }, [sortableItems, draggedIndex, isDragging, animationDuration, registerDraggable, registerDropTarget])

  return {
    sortableItems,
    getSortableProps,
    isDragging,
    draggedIndex,
    overIndex
  }
}

// Hook for grid layout management
export const useGridLayout = (initialLayout, onLayoutChange, options = {}) => {
  const {
    cols = 12,
    rowHeight = 30,
    margin = [10, 10],
    containerPadding = [10, 10],
    breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    compactType = 'vertical'
  } = options

  const [layout, setLayout] = useState(initialLayout)
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg')

  const { registerDraggable, registerDropTarget, isDragging } = useDragAndDrop({
    onDragEnd: ({ dropped, draggedItem, dropTarget }) => {
      if (dropped && dropTarget) {
        const newLayout = layout.map(item => {
          if (item.i === draggedItem.i) {
            return {
              ...item,
              x: dropTarget.x,
              y: dropTarget.y
            }
          }
          return item
        })
        
        setLayout(newLayout)
        onLayoutChange(newLayout, currentBreakpoint)
      }
    },
    snapToGrid: true,
    gridSize: Math.round(window.innerWidth / cols)
  })

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      let newBreakpoint = 'xxs'
      
      for (const [breakpoint, minWidth] of Object.entries(breakpoints)) {
        if (width >= minWidth) {
          newBreakpoint = breakpoint
        }
      }
      
      setCurrentBreakpoint(newBreakpoint)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoints])

  const getGridItemProps = useCallback((item) => {
    const colWidth = (window.innerWidth - containerPadding[0] * 2 - margin[0] * (cols - 1)) / cols
    const x = item.x * (colWidth + margin[0]) + containerPadding[0]
    const y = item.y * (rowHeight + margin[1]) + containerPadding[1]
    const width = item.w * colWidth + (item.w - 1) * margin[0]
    const height = item.h * rowHeight + (item.h - 1) * margin[1]

    return {
      draggable: registerDraggable,
      data: item,
      style: {
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transition: isDragging ? 'none' : 'all 0.2s ease'
      }
    }
  }, [layout, cols, rowHeight, margin, containerPadding, isDragging, registerDraggable])

  return {
    layout,
    currentBreakpoint,
    getGridItemProps,
    isDragging,
    setLayout
  }
}

export default {
  useDragAndDrop,
  useSortable,
  useGridLayout
}