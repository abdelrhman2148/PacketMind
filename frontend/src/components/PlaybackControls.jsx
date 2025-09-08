import { useState, useRef, useEffect } from 'react'
import {
  HStack,
  VStack,
  Box,
  Text,
  IconButton,
  Button,
  ButtonGroup,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Badge,
  Kbd,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayback } from '../hooks/usePlayback'
import { buttonAnimations, scaleAnimations, slideAnimations } from '../animations/transitions'

const MotionBox = motion(Box)
const MotionButton = motion(Button)
const MotionIconButton = motion(IconButton)

const PlaybackControls = ({
  packets = [],
  onTimeChange = () => {},
  onSpeedChange = () => {},
  onBookmarkJump = () => {},
  onExportSegment = () => {},
  showAdvancedControls = true,
  showKeyboardShortcuts = false,
  enableLooping = true,
  enableVolumeControl = false,
  compactMode = false,
  autoPlay = false,
  defaultSpeed = 1,
  ...props
}) => {
  const [showTooltips, setShowTooltips] = useState(true)
  const [expandedControls, setExpandedControls] = useState(!compactMode)
  const { isOpen: isShortcutsOpen, onOpen: onShortcutsOpen, onClose: onShortcutsClose } = useDisclosure()
  const controlsRef = useRef(null)

  // Initialize playback hook
  const {
    isPlaying,
    isPaused,
    currentTime,
    duration,
    playbackSpeed,
    volume,
    isMuted,
    isLooping,
    selectedRange,
    play,
    pause,
    stop,
    togglePlayback,
    seekTo,
    seekRelative,
    changeSpeed,
    cycleSpeed,
    jumpToBookmark,
    playSelection,
    setVolume,
    setIsMuted,
    setIsLooping,
    formatTime,
    getProgress,
    availableSpeeds
  } = usePlayback(packets, {
    autoPlay,
    defaultSpeed,
    enableKeyboardControls: true,
    onTimeUpdate: onTimeChange,
    onStateChange: (state) => {
      console.log('Playback state changed:', state)
    }
  })

  // Update external handlers
  useEffect(() => {
    onSpeedChange(playbackSpeed)
  }, [playbackSpeed, onSpeedChange])

  // Keyboard shortcuts list
  const keyboardShortcuts = [
    { key: 'Space', description: 'Play/Pause' },
    { key: '←/→', description: 'Seek ±1s' },
    { key: 'Shift + ←/→', description: 'Seek ±10s' },
    { key: 'Home/End', description: 'Go to start/end' },
    { key: '1, 2, 4, 8', description: 'Set playback speed' },
    { key: '+', description: 'Cycle speeds' },
    { key: 'L', description: 'Toggle loop' },
    { key: 'M', description: 'Toggle mute' },
    { key: 'Ctrl + N/B', description: 'Next/Previous bookmark' },
    { key: 'Ctrl + S', description: 'Stop playback' },
    { key: '?', description: 'Show shortcuts' }
  ]

  // Play state icons and labels
  const getPlayButtonProps = () => {
    if (isPlaying) {
      return {
        icon: '⏸️',
        label: 'Pause',
        action: pause
      }
    } else if (isPaused) {
      return {
        icon: '▶️',
        label: 'Resume',
        action: play
      }
    } else {
      return {
        icon: '▶️',
        label: 'Play',
        action: play
      }
    }
  }

  const playButtonProps = getPlayButtonProps()

  // Speed indicator with color coding
  const getSpeedIndicatorColor = () => {
    if (playbackSpeed < 1) return 'blue.400'
    if (playbackSpeed === 1) return 'green.400'
    if (playbackSpeed <= 2) return 'yellow.400'
    return 'red.400'
  }

  // Main control buttons
  const MainControls = () => (
    <HStack spacing={2}>
      {/* Previous frame/bookmark */}
      <Tooltip label="Previous bookmark (Ctrl+B)" isDisabled={!showTooltips}>
        <MotionIconButton
          size={compactMode ? 'sm' : 'md'}
          variant="netflixSecondary"
          icon={<Text fontSize={compactMode ? 'sm' : 'md'}>⏮️</Text>}
          onClick={() => jumpToBookmark('prev')}
          variants={buttonAnimations}
          whileHover="hover"
          whileTap="tap"
          _hover={{
            bg: 'rgba(255, 255, 255, 0.1)',
            transform: 'scale(1.05)'
          }}
        />
      </Tooltip>

      {/* Seek backward */}
      <Tooltip label="Seek -10s (Shift+←)" isDisabled={!showTooltips}>
        <MotionIconButton
          size={compactMode ? 'sm' : 'md'}
          variant="netflixSecondary"
          icon={<Text fontSize={compactMode ? 'sm' : 'md'}>⏪</Text>}
          onClick={() => seekRelative(-10)}
          variants={buttonAnimations}
          whileHover="hover"
          whileTap="tap"
        />
      </Tooltip>

      {/* Play/Pause */}
      <Tooltip label={`${playButtonProps.label} (Space)`} isDisabled={!showTooltips}>
        <MotionIconButton
          size={compactMode ? 'md' : 'lg'}
          variant="netflixPrimary"
          icon={<Text fontSize={compactMode ? 'lg' : 'xl'}>{playButtonProps.icon}</Text>}
          onClick={playButtonProps.action}
          bg="netflix.red"
          color="white"
          variants={scaleAnimations}
          whileHover="hover"
          whileTap="tap"
          _hover={{
            bg: 'rgba(229, 9, 20, 0.8)',
            transform: 'scale(1.1)'
          }}
          _active={{
            transform: 'scale(0.95)'
          }}
        />
      </Tooltip>

      {/* Seek forward */}
      <Tooltip label="Seek +10s (Shift+→)" isDisabled={!showTooltips}>
        <MotionIconButton
          size={compactMode ? 'sm' : 'md'}
          variant="netflixSecondary"
          icon={<Text fontSize={compactMode ? 'sm' : 'md'}>⏩</Text>}
          onClick={() => seekRelative(10)}
          variants={buttonAnimations}
          whileHover="hover"
          whileTap="tap"
        />
      </Tooltip>

      {/* Next frame/bookmark */}
      <Tooltip label="Next bookmark (Ctrl+N)" isDisabled={!showTooltips}>
        <MotionIconButton
          size={compactMode ? 'sm' : 'md'}
          variant="netflixSecondary"
          icon={<Text fontSize={compactMode ? 'sm' : 'md'}>⏭️</Text>}
          onClick={() => jumpToBookmark('next')}
          variants={buttonAnimations}
          whileHover="hover"
          whileTap="tap"
        />
      </Tooltip>

      {/* Stop */}
      <Tooltip label="Stop (Ctrl+S)" isDisabled={!showTooltips}>
        <MotionIconButton
          size={compactMode ? 'sm' : 'md'}
          variant="netflixSecondary"
          icon={<Text fontSize={compactMode ? 'sm' : 'md'}>⏹️</Text>}
          onClick={stop}
          variants={buttonAnimations}
          whileHover="hover"
          whileTap="tap"
        />
      </Tooltip>
    </HStack>
  )

  // Speed controls
  const SpeedControls = () => (
    <HStack spacing={2}>
      <Text fontSize="xs" color="netflix.silver" minW="50px">
        Speed:
      </Text>
      
      {/* Speed buttons for common speeds */}
      <ButtonGroup size="xs" isAttached variant="netflixSecondary">
        {[0.25, 0.5, 1, 2, 4].map((speed) => (
          <Button
            key={speed}
            onClick={() => changeSpeed(speed)}
            bg={playbackSpeed === speed ? 'netflix.red' : 'transparent'}
            color={playbackSpeed === speed ? 'white' : 'netflix.silver'}
            _hover={{
              bg: playbackSpeed === speed ? 'rgba(229, 9, 20, 0.8)' : 'rgba(255, 255, 255, 0.1)'
            }}
            px={2}
          >
            {speed}x
          </Button>
        ))}
      </ButtonGroup>

      {/* Speed menu for all available speeds */}
      <Menu>
        <MenuButton
          as={Button}
          size="xs"
          variant="netflixSecondary"
          rightIcon={<Text fontSize="xs">▼</Text>}
          minW="60px"
        >
          <HStack spacing={1}>
            <Text color={getSpeedIndicatorColor()}>●</Text>
            <Text>{playbackSpeed}x</Text>
          </HStack>
        </MenuButton>
        <MenuList bg="netflix.black" borderColor="rgba(255, 255, 255, 0.1)">
          {availableSpeeds.map((speed) => (
            <MenuItem
              key={speed}
              onClick={() => changeSpeed(speed)}
              bg={playbackSpeed === speed ? 'rgba(229, 9, 20, 0.2)' : 'transparent'}
              color="netflix.white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            >
              <HStack justify="space-between" w="100%">
                <Text>{speed}x</Text>
                {playbackSpeed === speed && (
                  <Text color="netflix.red" fontSize="sm">✓</Text>
                )}
              </HStack>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      {/* Cycle speed button */}
      <Tooltip label="Cycle speeds (+)" isDisabled={!showTooltips}>
        <IconButton
          size="xs"
          variant="ghost"
          color="netflix.silver"
          icon={<Text fontSize="xs">⚡</Text>}
          onClick={cycleSpeed}
          _hover={{ color: 'netflix.white' }}
        />
      </Tooltip>
    </HStack>
  )

  // Volume controls (if enabled)
  const VolumeControls = () => (
    enableVolumeControl && (
      <HStack spacing={2} minW="120px">
        <Tooltip label={`${isMuted ? 'Unmute' : 'Mute'} (M)`} isDisabled={!showTooltips}>
          <IconButton
            size="xs"
            variant="ghost"
            color="netflix.silver"
            icon={<Text fontSize="sm">{isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}</Text>}
            onClick={() => setIsMuted(!isMuted)}
            _hover={{ color: 'netflix.white' }}
          />
        </Tooltip>
        
        <Box flex={1}>
          <Slider
            value={isMuted ? 0 : volume * 100}
            onChange={(value) => {
              setVolume(value / 100)
              if (value > 0) setIsMuted(false)
            }}
            size="sm"
            min={0}
            max={100}
          >
            <SliderTrack bg="rgba(255, 255, 255, 0.2)">
              <SliderFilledTrack bg="netflix.silver" />
            </SliderTrack>
            <SliderThumb boxSize={3} bg="netflix.silver" />
          </Slider>
        </Box>
      </HStack>
    )
  )

  // Selection and export controls
  const SelectionControls = () => (
    <HStack spacing={2}>
      {selectedRange && (
        <>
          <Badge colorScheme="blue" variant="solid" px={2}>
            Selection: {formatTime(selectedRange.start)} - {formatTime(selectedRange.end)}
          </Badge>
          
          <Tooltip label="Play selection" isDisabled={!showTooltips}>
            <IconButton
              size="xs"
              variant="netflixSecondary"
              icon={<Text fontSize="xs">🎯</Text>}
              onClick={playSelection}
            />
          </Tooltip>
          
          <Tooltip label="Export selection" isDisabled={!showTooltips}>
            <IconButton
              size="xs"
              variant="netflixSecondary"
              icon={<Text fontSize="xs">💾</Text>}
              onClick={() => onExportSegment(selectedRange.start, selectedRange.end)}
            />
          </Tooltip>
        </>
      )}
    </HStack>
  )

  // Additional controls
  const AdditionalControls = () => (
    <HStack spacing={2}>
      {/* Loop toggle */}
      {enableLooping && (
        <Tooltip label={`${isLooping ? 'Disable' : 'Enable'} loop (Ctrl+L)`} isDisabled={!showTooltips}>
          <IconButton
            size="xs"
            variant={isLooping ? 'netflixPrimary' : 'ghost'}
            color={isLooping ? 'white' : 'netflix.silver'}
            bg={isLooping ? 'netflix.red' : 'transparent'}
            icon={<Text fontSize="xs">🔁</Text>}
            onClick={() => setIsLooping(!isLooping)}
            _hover={{
              color: 'netflix.white',
              bg: isLooping ? 'rgba(229, 9, 20, 0.8)' : 'rgba(255, 255, 255, 0.1)'
            }}
          />
        </Tooltip>
      )}

      {/* Keyboard shortcuts */}
      {showKeyboardShortcuts && (
        <Tooltip label="Keyboard shortcuts (?)" isDisabled={!showTooltips}>
          <IconButton
            size="xs"
            variant="ghost"
            color="netflix.silver"
            icon={<Text fontSize="xs">⌨️</Text>}
            onClick={onShortcutsOpen}
            _hover={{ color: 'netflix.white' }}
          />
        </Tooltip>
      )}

      {/* Expand/collapse toggle */}
      <Tooltip label={expandedControls ? 'Collapse' : 'Expand'} isDisabled={!showTooltips}>
        <IconButton
          size="xs"
          variant="ghost"
          color="netflix.silver"
          icon={<Text fontSize="xs">{expandedControls ? '🔽' : '🔼'}</Text>}
          onClick={() => setExpandedControls(!expandedControls)}
          _hover={{ color: 'netflix.white' }}
        />
      </Tooltip>
    </HStack>
  )

  // Time display
  const TimeDisplay = () => (
    <HStack spacing={3} minW="200px" justify="center">
      <Text
        fontSize={compactMode ? 'sm' : 'md'}
        color="netflix.white"
        fontWeight="bold"
        fontVariantNumeric="tabular-nums"
        minW="80px"
        textAlign="right"
      >
        {formatTime(currentTime)}
      </Text>
      
      <Text fontSize="xs" color="netflix.silver">/</Text>
      
      <Text
        fontSize={compactMode ? 'sm' : 'md'}
        color="netflix.silver"
        fontVariantNumeric="tabular-nums"
        minW="80px"
        textAlign="left"
      >
        {formatTime(duration)}
      </Text>
    </HStack>
  )

  // Keyboard shortcuts modal
  const KeyboardShortcutsModal = () => (
    <Modal isOpen={isShortcutsOpen} onClose={onShortcutsClose} size="md">
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent bg="netflix.black" border="1px solid rgba(255, 255, 255, 0.1)">
        <ModalHeader color="netflix.white">
          <HStack spacing={2}>
            <Text>⌨️</Text>
            <Text>Keyboard Shortcuts</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="netflix.white" />
        
        <ModalBody pb={6}>
          <VStack spacing={3} align="stretch">
            {keyboardShortcuts.map((shortcut, index) => (
              <HStack key={index} justify="space-between">
                <HStack spacing={2}>
                  <Kbd
                    bg="rgba(255, 255, 255, 0.1)"
                    color="netflix.white"
                    fontSize="xs"
                  >
                    {shortcut.key}
                  </Kbd>
                </HStack>
                <Text color="netflix.silver" fontSize="sm">
                  {shortcut.description}
                </Text>
              </HStack>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )

  return (
    <MotionBox
      ref={controlsRef}
      variants={slideAnimations.slideInUp}
      initial="initial"
      animate="animate"
      {...props}
    >
      <VStack spacing={3} align="stretch">
        {/* Main control row */}
        <HStack
          justify="space-between"
          align="center"
          p={4}
          bg="rgba(10, 10, 10, 0.9)"
          backdropFilter="blur(20px)"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          {/* Left section - Main controls */}
          <HStack spacing={4} flex={1}>
            <MainControls />
            {!compactMode && <TimeDisplay />}
          </HStack>

          {/* Center section - Time display (compact mode) */}
          {compactMode && <TimeDisplay />}

          {/* Right section - Additional controls */}
          <HStack spacing={4} flex={1} justify="flex-end">
            <AdditionalControls />
          </HStack>
        </HStack>

        {/* Expanded controls */}
        <AnimatePresence>
          {expandedControls && showAdvancedControls && (
            <MotionBox
              variants={slideAnimations.slideInDown}
              initial="initial"
              animate="animate"
              exit="initial"
            >
              <VStack spacing={3}>
                {/* Speed and volume controls */}
                <HStack
                  justify="space-between"
                  align="center"
                  p={3}
                  bg="rgba(31, 31, 31, 0.8)"
                  borderRadius="8px"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  w="100%"
                >
                  <SpeedControls />
                  <VolumeControls />
                </HStack>

                {/* Selection controls */}
                <SelectionControls />
              </VStack>
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <Box
          h="2px"
          bg="rgba(255, 255, 255, 0.1)"
          borderRadius="1px"
          overflow="hidden"
        >
          <MotionBox
            h="100%"
            bg="netflix.red"
            borderRadius="1px"
            style={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.1 }}
          />
        </Box>
      </VStack>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal />
    </MotionBox>
  )
}

export default PlaybackControls