import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  VStack,
  HStack,
  Badge,
  useDisclosure,
  Kbd
} from '@chakra-ui/react'
// import { MdHelpOutline, MdInfo, MdRefresh } from 'react-icons/md'
import HelpTooltip from './HelpTooltip'

/**
 * Help button with dropdown menu for various help options
 */
const HelpButton = ({ onStartTour, onResetTour }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleTourStart = () => {
    onClose()
    onStartTour()
  }

  const handleTourReset = () => {
    onClose()
    onResetTour()
  }

  return (
    <Menu isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
      <HelpTooltip content="Get help and view tutorials">
        <MenuButton
          as={IconButton}
          icon={<span>❓</span>}
          variant="ghost"
          size="sm"
          aria-label="Help and tutorials"
          _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
          _focus={{
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)'
          }}
        />
      </HelpTooltip>
      
      <MenuList maxW="300px" p={2}>
        <VStack align="start" spacing={2} p={2}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.600">
            Help & Tutorials
          </Text>
        </VStack>
        
        <MenuDivider />
        
        <MenuItem onClick={handleTourStart} icon={<span>ℹ️</span>}>
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">
              Start Guided Tour
            </Text>
            <Text fontSize="xs" color="gray.500">
              Learn how to use Wireshark+ Web
            </Text>
          </VStack>
        </MenuItem>
        
        <MenuItem onClick={handleTourReset} icon={<span>🔄</span>}>
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">
              Reset & Restart Tour
            </Text>
            <Text fontSize="xs" color="gray.500">
              View the tutorial again
            </Text>
          </VStack>
        </MenuItem>
        
        <MenuDivider />
        
        <VStack align="start" spacing={2} p={2}>
          <Text fontSize="xs" fontWeight="semibold" color="gray.600">
            Quick Tips:
          </Text>
          
          <HStack spacing={2}>
            <Kbd fontSize="xs">Tab</Kbd>
            <Text fontSize="xs" color="gray.500">Navigate elements</Text>
          </HStack>
          
          <HStack spacing={2}>
            <Kbd fontSize="xs">Enter</Kbd>
            <Text fontSize="xs" color="gray.500">Select packet</Text>
          </HStack>
          
          <HStack spacing={2}>
            <Badge colorScheme="blue" size="sm">Hover</Badge>
            <Text fontSize="xs" color="gray.500">See tooltips</Text>
          </HStack>
        </VStack>
      </MenuList>
    </Menu>
  )
}

export default HelpButton