import { useState, useRef, useEffect, useCallback } from 'react'
import { TimelineManager } from '../utils/timelineManager'

// Custom hook for timeline playback management
export const usePlayback = (packets = [], options = {}) => {
  const {
    autoPlay = false,
    loop = false,
    defaultSpeed = 1,
    enableKeyboardControls = true,
    onTimeUpdate = () => {},
    onStateChange = () => {},
    onBookmarkReached = () => {},
    onAnomalyDetected = () => {}
  } = options

  // Playback state
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(defaultSpeed)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [isLooping, setIsLooping] = useState(loop)

  // Timeline position and seeking
  const [selectedRange, setSelectedRange] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [bufferProgress, setBufferProgress] = useState(0)

  // Playback references
  const playbackRef = useRef({
    intervalId: null,
    timelineManager: null,
    lastUpdateTime: 0,
    animationFrameId: null
  })

  // Available playback speeds
  const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8]

  // Initialize timeline manager
  useEffect(() => {
    if (packets.length > 0) {
      playbackRef.current.timelineManager = new TimelineManager()
      
      // Load packets into timeline
      packets.forEach(packet => {
        playbackRef.current.timelineManager.addPacket(packet)
      })

      // Calculate duration
      const timeline = playbackRef.current.timelineManager.getTimeline()
      if (timeline.length > 0) {
        const firstPacket = timeline[0]
        const lastPacket = timeline[timeline.length - 1]
        const calculatedDuration = lastPacket.timestamp - firstPacket.timestamp
        setDuration(calculatedDuration)
      }

      // Set buffer progress (assuming all data is loaded)
      setBufferProgress(1)
    }

    return () => {
      stopPlayback()
    }
  }, [packets])

  // Playback update loop
  const updatePlayback = useCallback(() => {
    if (!isPlaying || !playbackRef.current.timelineManager) return

    const now = performance.now()
    const deltaTime = (now - playbackRef.current.lastUpdateTime) * playbackSpeed / 1000
    playbackRef.current.lastUpdateTime = now

    setCurrentTime(prevTime => {
      const newTime = prevTime + deltaTime

      // Check if reached end
      if (newTime >= duration) {
        if (isLooping) {
          const loopedTime = 0
          onTimeUpdate(loopedTime)
          return loopedTime
        } else {
          setIsPlaying(false)
          setIsPaused(false)
          onStateChange({ isPlaying: false, isPaused: false, currentTime: duration })
          return duration
        }
      }

      // Check for bookmarks and anomalies
      const currentPackets = playbackRef.current.timelineManager.getPacketsAtTime(newTime)
      
      // Check bookmarks
      const bookmarks = playbackRef.current.timelineManager.getBookmarks()
      const reachedBookmark = bookmarks.find(b => 
        Math.abs(b.timestamp - newTime) < 0.1 && Math.abs(b.timestamp - prevTime) > 0.1
      )
      if (reachedBookmark) {
        onBookmarkReached(reachedBookmark)
      }

      // Check anomalies
      currentPackets.forEach(packet => {
        if (packet.isAnomaly && Math.abs(packet.timestamp - newTime) < 0.1) {
          onAnomalyDetected(packet)
        }
      })

      onTimeUpdate(newTime)
      return newTime
    })

    playbackRef.current.animationFrameId = requestAnimationFrame(updatePlayback)
  }, [isPlaying, playbackSpeed, duration, isLooping, onTimeUpdate, onStateChange, onBookmarkReached, onAnomalyDetected])

  // Start playback
  const play = useCallback(() => {
    if (!playbackRef.current.timelineManager) return

    setIsPlaying(true)
    setIsPaused(false)
    playbackRef.current.lastUpdateTime = performance.now()
    
    onStateChange({ isPlaying: true, isPaused: false, currentTime })
    updatePlayback()
  }, [currentTime, onStateChange, updatePlayback])

  // Pause playback
  const pause = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(true)
    
    if (playbackRef.current.animationFrameId) {
      cancelAnimationFrame(playbackRef.current.animationFrameId)
      playbackRef.current.animationFrameId = null
    }
    
    onStateChange({ isPlaying: false, isPaused: true, currentTime })
  }, [currentTime, onStateChange])

  // Stop playback
  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentTime(0)
    
    if (playbackRef.current.animationFrameId) {
      cancelAnimationFrame(playbackRef.current.animationFrameId)
      playbackRef.current.animationFrameId = null
    }
    
    onStateChange({ isPlaying: false, isPaused: false, currentTime: 0 })
  }, [onStateChange])

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  // Seek to specific time
  const seekTo = useCallback((time) => {
    const clampedTime = Math.max(0, Math.min(duration, time))
    setCurrentTime(clampedTime)
    onTimeUpdate(clampedTime)
  }, [duration, onTimeUpdate])

  // Seek relative to current time
  const seekRelative = useCallback((deltaTime) => {
    seekTo(currentTime + deltaTime)
  }, [currentTime, seekTo])

  // Change playback speed
  const changeSpeed = useCallback((speed) => {
    if (PLAYBACK_SPEEDS.includes(speed)) {
      setPlaybackSpeed(speed)
    }
  }, [])

  // Cycle through playback speeds
  const cycleSpeed = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed)
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex])
  }, [playbackSpeed])

  // Jump to next/previous bookmark
  const jumpToBookmark = useCallback((direction = 'next') => {
    if (!playbackRef.current.timelineManager) return

    const bookmarks = playbackRef.current.timelineManager.getBookmarks()
    if (bookmarks.length === 0) return

    const sortedBookmarks = bookmarks.sort((a, b) => a.timestamp - b.timestamp)

    if (direction === 'next') {
      const nextBookmark = sortedBookmarks.find(b => b.timestamp > currentTime)
      if (nextBookmark) {
        seekTo(nextBookmark.timestamp)
      }
    } else {
      const prevBookmark = sortedBookmarks.reverse().find(b => b.timestamp < currentTime)
      if (prevBookmark) {
        seekTo(prevBookmark.timestamp)
      }
    }
  }, [currentTime, seekTo])

  // Set selection range
  const setSelectionRange = useCallback((startTime, endTime) => {
    if (startTime >= 0 && endTime <= duration && startTime < endTime) {
      setSelectedRange({ start: startTime, end: endTime })
    } else {
      setSelectedRange(null)
    }
  }, [duration])

  // Play selection
  const playSelection = useCallback(() => {
    if (!selectedRange) return
    
    seekTo(selectedRange.start)
    play()
    
    // Stop when reaching end of selection
    const checkSelectionEnd = () => {
      if (currentTime >= selectedRange.end) {
        pause()
      } else if (isPlaying) {
        requestAnimationFrame(checkSelectionEnd)
      }
    }
    
    requestAnimationFrame(checkSelectionEnd)
  }, [selectedRange, seekTo, play, pause, currentTime, isPlaying])

  // Export current selection or entire timeline
  const exportTimelineSegment = useCallback((startTime = null, endTime = null) => {
    if (!playbackRef.current.timelineManager) return null

    const start = startTime || (selectedRange?.start ?? 0)
    const end = endTime || (selectedRange?.end ?? duration)
    
    return playbackRef.current.timelineManager.exportTimelineSegment(start, end)
  }, [selectedRange, duration])

  // Get packets in current view
  const getCurrentPackets = useCallback(() => {
    if (!playbackRef.current.timelineManager) return []
    return playbackRef.current.timelineManager.getPacketsAtTime(currentTime)
  }, [currentTime])

  // Get timeline statistics
  const getTimelineStats = useCallback(() => {
    if (!playbackRef.current.timelineManager) return null
    return playbackRef.current.timelineManager.getStatistics()
  }, [])

  // Keyboard controls
  useEffect(() => {
    if (!enableKeyboardControls) return

    const handleKeyPress = (event) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.isContentEditable) {
        return
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault()
          togglePlayback()
          break
        case 'arrowleft':
          event.preventDefault()
          if (event.shiftKey) {
            seekRelative(-10) // Shift + Left: -10s
          } else {
            seekRelative(-1) // Left: -1s
          }
          break
        case 'arrowright':
          event.preventDefault()
          if (event.shiftKey) {
            seekRelative(10) // Shift + Right: +10s
          } else {
            seekRelative(1) // Right: +1s
          }
          break
        case 'home':
          event.preventDefault()
          seekTo(0)
          break
        case 'end':
          event.preventDefault()
          seekTo(duration)
          break
        case 'l':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setIsLooping(!isLooping)
          }
          break
        case 'm':
          event.preventDefault()
          setIsMuted(!isMuted)
          break
        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            stopPlayback()
          }
          break
        case 'p':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            togglePlayback()
          }
          break
        case '1':
        case '2':
        case '4':
        case '8':
          event.preventDefault()
          changeSpeed(parseInt(event.key))
          break
        case '+':
        case '=':
          event.preventDefault()
          cycleSpeed()
          break
        case 'n':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            jumpToBookmark('next')
          }
          break
        case 'b':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            jumpToBookmark('prev')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [enableKeyboardControls, togglePlayback, seekRelative, seekTo, duration, isLooping, isMuted, changeSpeed, cycleSpeed, jumpToBookmark])

  // Format time for display
  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 1000)
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
    } else {
      return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`
    }
  }, [])

  // Get progress percentage
  const getProgress = useCallback(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0
  }, [currentTime, duration])

  return {
    // State
    isPlaying,
    isPaused,
    currentTime,
    duration,
    playbackSpeed,
    volume,
    isMuted,
    isLooping,
    isLive,
    bufferProgress,
    selectedRange,

    // Controls
    play,
    pause,
    stop: stopPlayback,
    togglePlayback,
    seekTo,
    seekRelative,
    changeSpeed,
    cycleSpeed,
    jumpToBookmark,
    setSelectionRange,
    playSelection,

    // Timeline data
    getCurrentPackets,
    getTimelineStats,
    exportTimelineSegment,

    // Utilities
    formatTime,
    getProgress,
    availableSpeeds: PLAYBACK_SPEEDS,

    // Settings
    setVolume,
    setIsMuted,
    setIsLooping,
    setIsLive
  }
}

export default usePlayback