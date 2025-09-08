import { useState, useEffect, useRef, useCallback } from 'react'

// Custom hook for handling mobile gestures and touch interactions
export const useMobileGestures = (options = {}) => {
  const {
    threshold = 50, // Minimum distance for swipe detection
    timeLimit = 300, // Maximum time for swipe (ms)
    preventScroll = false, // Prevent default scroll behavior
    enablePinch = false, // Enable pinch zoom detection
    enableRotation = false // Enable rotation detection
  } = options

  const [gestureState, setGestureState] = useState({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    direction: null,
    distance: 0,
    velocity: 0,
    scale: 1,
    rotation: 0
  })

  const gestureRef = useRef({
    startTime: 0,
    lastX: 0,
    lastY: 0,
    initialDistance: 0,
    initialRotation: 0,
    touches: []
  })

  // Calculate distance between two points
  const getDistance = useCallback((touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Calculate angle between two points
  const getAngle = useCallback((touch1, touch2) => {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI
  }, [])

  // Determine swipe direction
  const getDirection = useCallback((deltaX, deltaY) => {
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    
    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((event) => {
    if (preventScroll) {
      event.preventDefault()
    }

    const touch = event.touches[0]
    const startTime = Date.now()
    
    gestureRef.current = {
      ...gestureRef.current,
      startTime,
      lastX: touch.clientX,
      lastY: touch.clientY,
      touches: Array.from(event.touches)
    }

    if (event.touches.length === 2 && (enablePinch || enableRotation)) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      gestureRef.current.initialDistance = getDistance(touch1, touch2)
      gestureRef.current.initialRotation = getAngle(touch1, touch2)
    }

    setGestureState(prev => ({
      ...prev,
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      direction: null,
      distance: 0,
      velocity: 0,
      scale: 1,
      rotation: 0
    }))
  }, [preventScroll, enablePinch, enableRotation, getDistance, getAngle])

  // Handle touch move
  const handleTouchMove = useCallback((event) => {
    if (preventScroll) {
      event.preventDefault()
    }

    if (!gestureState.isActive) return

    const touch = event.touches[0]
    const currentTime = Date.now()
    const timeDelta = currentTime - gestureRef.current.startTime
    
    if (timeDelta === 0) return

    const deltaX = touch.clientX - gestureState.startX
    const deltaY = touch.clientY - gestureState.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Calculate velocity
    const deltaDistance = Math.sqrt(
      Math.pow(touch.clientX - gestureRef.current.lastX, 2) +
      Math.pow(touch.clientY - gestureRef.current.lastY, 2)
    )
    const velocity = deltaDistance / 16 // Assume 60fps (16ms per frame)

    let scale = 1
    let rotation = 0

    // Handle multi-touch gestures
    if (event.touches.length === 2 && (enablePinch || enableRotation)) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      
      if (enablePinch) {
        const currentDistance = getDistance(touch1, touch2)
        scale = currentDistance / gestureRef.current.initialDistance
      }
      
      if (enableRotation) {
        const currentRotation = getAngle(touch1, touch2)
        rotation = currentRotation - gestureRef.current.initialRotation
      }
    }

    gestureRef.current.lastX = touch.clientX
    gestureRef.current.lastY = touch.clientY

    setGestureState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      direction: getDirection(deltaX, deltaY),
      distance,
      velocity,
      scale,
      rotation
    }))
  }, [gestureState.isActive, gestureState.startX, gestureState.startY, preventScroll, enablePinch, enableRotation, getDistance, getAngle, getDirection])

  // Handle touch end
  const handleTouchEnd = useCallback((event) => {
    if (preventScroll) {
      event.preventDefault()
    }

    if (!gestureState.isActive) return

    const endTime = Date.now()
    const timeDelta = endTime - gestureRef.current.startTime
    const { distance, deltaX, deltaY } = gestureState

    // Determine if this was a valid swipe
    const isSwipe = distance >= threshold && timeDelta <= timeLimit
    const direction = isSwipe ? getDirection(deltaX, deltaY) : null

    setGestureState(prev => ({
      ...prev,
      isActive: false,
      direction,
      distance,
      velocity: distance / timeDelta // Final velocity calculation
    }))

    // Reset gesture reference
    gestureRef.current = {
      startTime: 0,
      lastX: 0,
      lastY: 0,
      initialDistance: 0,
      initialRotation: 0,
      touches: []
    }
  }, [gestureState, threshold, timeLimit, preventScroll, getDirection])

  // Touch event handlers object
  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  }

  // Gesture detection helpers
  const isSwipeLeft = gestureState.direction === 'left' && gestureState.distance >= threshold
  const isSwipeRight = gestureState.direction === 'right' && gestureState.distance >= threshold
  const isSwipeUp = gestureState.direction === 'up' && gestureState.distance >= threshold
  const isSwipeDown = gestureState.direction === 'down' && gestureState.distance >= threshold
  const isPinching = Math.abs(gestureState.scale - 1) > 0.1
  const isRotating = Math.abs(gestureState.rotation) > 5

  return {
    gestureState,
    touchHandlers,
    // Convenience methods
    isSwipeLeft,
    isSwipeRight,
    isSwipeUp,
    isSwipeDown,
    isPinching,
    isRotating,
    // State checks
    isActive: gestureState.isActive,
    direction: gestureState.direction,
    distance: gestureState.distance,
    velocity: gestureState.velocity,
    scale: gestureState.scale,
    rotation: gestureState.rotation
  }
}

// Hook for swipe navigation
export const useSwipeNavigation = (onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown) => {
  const { gestureState, touchHandlers, isSwipeLeft, isSwipeRight, isSwipeUp, isSwipeDown } = useMobileGestures({
    threshold: 75,
    timeLimit: 500
  })

  useEffect(() => {
    if (!gestureState.isActive) {
      if (isSwipeLeft && onSwipeLeft) onSwipeLeft()
      if (isSwipeRight && onSwipeRight) onSwipeRight()
      if (isSwipeUp && onSwipeUp) onSwipeUp()
      if (isSwipeDown && onSwipeDown) onSwipeDown()
    }
  }, [gestureState.isActive, isSwipeLeft, isSwipeRight, isSwipeUp, isSwipeDown, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    touchHandlers,
    gestureState,
    isActive: gestureState.isActive
  }
}

// Hook for pull-to-refresh functionality
export const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80,
    maxDistance = 150,
    refreshThreshold = 60
  } = options

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [canRefresh, setCanRefresh] = useState(false)

  const { gestureState, touchHandlers } = useMobileGestures({
    threshold: 10,
    preventScroll: false
  })

  useEffect(() => {
    if (gestureState.isActive && gestureState.direction === 'down') {
      const distance = Math.min(gestureState.distance, maxDistance)
      setPullDistance(distance)
      setCanRefresh(distance >= refreshThreshold)
    } else if (!gestureState.isActive && canRefresh && !isRefreshing) {
      setIsRefreshing(true)
      onRefresh().finally(() => {
        setIsRefreshing(false)
        setPullDistance(0)
        setCanRefresh(false)
      })
    } else if (!gestureState.isActive) {
      setPullDistance(0)
      setCanRefresh(false)
    }
  }, [gestureState, canRefresh, isRefreshing, onRefresh, maxDistance, refreshThreshold])

  return {
    touchHandlers,
    isRefreshing,
    pullDistance,
    canRefresh,
    progress: Math.min(pullDistance / refreshThreshold, 1)
  }
}

// Hook for long press detection
export const useLongPress = (onLongPress, options = {}) => {
  const {
    delay = 500,
    moveThreshold = 10
  } = options

  const [isLongPressing, setIsLongPressing] = useState(false)
  const timeoutRef = useRef(null)
  const startPos = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
    
    timeoutRef.current = setTimeout(() => {
      setIsLongPressing(true)
      onLongPress(event)
    }, delay)
  }, [delay, onLongPress])

  const handleTouchMove = useCallback((event) => {
    const touch = event.touches[0]
    const deltaX = Math.abs(touch.clientX - startPos.current.x)
    const deltaY = Math.abs(touch.clientY - startPos.current.y)
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsLongPressing(false)
    }
  }, [moveThreshold])

  const handleTouchEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsLongPressing(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd
    },
    isLongPressing
  }
}

// Hook for detecting mobile device and orientation
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [orientation, setOrientation] = useState('portrait')
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({ width, height })
      setIsMobile(width <= 768)
      setIsTablet(width > 768 && width <= 1024)
      setOrientation(width > height ? 'landscape' : 'portrait')
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    orientation,
    screenSize,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  }
}

export default {
  useMobileGestures,
  useSwipeNavigation,
  usePullToRefresh,
  useLongPress,
  useMobileDetection
}