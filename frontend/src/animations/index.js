/**
 * AI Shark Design System - Animation Library
 * Netflix-inspired animations and transitions
 */

// ===== ANIMATION CONFIGURATIONS =====

export const animationDuration = {
  fast: 150,
  normal: 300,
  slow: 500,
  netflix: 400, // Netflix's preferred timing
}

export const animationEasing = {
  ease: 'ease',
  easeInOut: 'ease-in-out',
  netflix: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Netflix easing
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}

// ===== FRAMER MOTION VARIANTS =====

export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const slideUpVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: animationDuration.netflix / 1000,
      ease: animationEasing.netflix
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    scale: 0.98,
    transition: {
      duration: animationDuration.fast / 1000,
      ease: animationEasing.sharp
    }
  }
}

export const slideDownVariants = {
  initial: { 
    opacity: 0, 
    y: -20,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: animationDuration.netflix / 1000,
      ease: animationEasing.netflix
    }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    scale: 0.98
  }
}

export const slideLeftVariants = {
  initial: { 
    opacity: 0, 
    x: 30,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: animationDuration.netflix / 1000,
      ease: animationEasing.netflix
    }
  },
  exit: { 
    opacity: 0, 
    x: -15,
    scale: 0.98
  }
}

export const slideRightVariants = {
  initial: { 
    opacity: 0, 
    x: -30,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: animationDuration.netflix / 1000,
      ease: animationEasing.netflix
    }
  },
  exit: { 
    opacity: 0, 
    x: 15,
    scale: 0.98
  }
}

export const scaleVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.8 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: animationDuration.netflix / 1000,
      ease: animationEasing.bounce
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: {
      duration: animationDuration.fast / 1000,
      ease: animationEasing.sharp
    }
  }
}

export const netflixCardVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
    rotateX: 5
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.4,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  },
  hover: {
    scale: 1.05,
    y: -8,
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    transition: {
      duration: 0.3,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }
}

export const modalVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.8,
    y: 50
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    y: 30,
    transition: {
      duration: 0.3,
      ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  }
}

export const drawerVariants = {
  initial: { 
    x: '100%',
    opacity: 0
  },
  animate: { 
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8
    }
  },
  exit: { 
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  }
}

export const listItemVariants = {
  initial: { 
    opacity: 0, 
    x: -20,
    scale: 0.95
  },
  animate: (index) => ({ 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }),
  exit: { 
    opacity: 0, 
    x: 20,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}

// ===== LOADING ANIMATIONS =====

export const loadingVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
}

export const spinVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

export const pulseVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'ease-in-out'
    }
  }
}

export const waveVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'ease-in-out',
      repeatDelay: 0.2
    }
  }
}

// ===== NETFLIX-SPECIFIC ANIMATIONS =====

export const netflixHoverVariants = {
  rest: { 
    scale: 1,
    filter: 'brightness(1) saturate(1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
  },
  hover: { 
    scale: 1.05,
    filter: 'brightness(1.1) saturate(1.2)',
    boxShadow: '0 8px 25px rgba(229, 9, 20, 0.3)',
    transition: {
      duration: 0.3,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }
}

export const glowVariants = {
  initial: { 
    boxShadow: '0 0 0 rgba(6, 182, 212, 0)'
  },
  animate: { 
    boxShadow: [
      '0 0 0 rgba(6, 182, 212, 0)',
      '0 0 20px rgba(6, 182, 212, 0.5)',
      '0 0 0 rgba(6, 182, 212, 0)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'ease-in-out'
    }
  }
}

export const typewriterVariants = {
  initial: { width: 0 },
  animate: { 
    width: '100%',
    transition: {
      duration: 1.5,
      ease: 'steps(40, end)'
    }
  }
}

// ===== PAGE TRANSITION VARIANTS =====

export const pageVariants = {
  initial: { 
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  }
}

export const overlayVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

// ===== INTERACTION ANIMATIONS =====

export const buttonVariants = {
  rest: { 
    scale: 1,
    filter: 'brightness(1)'
  },
  hover: { 
    scale: 1.02,
    filter: 'brightness(1.1)',
    transition: {
      duration: 0.2,
      ease: 'ease-out'
    }
  },
  tap: { 
    scale: 0.98,
    filter: 'brightness(0.9)',
    transition: {
      duration: 0.1,
      ease: 'ease-in'
    }
  }
}

export const iconVariants = {
  rest: { 
    scale: 1,
    rotate: 0
  },
  hover: { 
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: 0.2,
      ease: 'ease-out'
    }
  },
  tap: { 
    scale: 0.9,
    rotate: -5,
    transition: {
      duration: 0.1
    }
  }
}

export const chipVariants = {
  initial: { 
    opacity: 0,
    scale: 0.8,
    x: -10
  },
  animate: { 
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    x: 10,
    transition: {
      duration: 0.2
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  }
}

// ===== UTILITY FUNCTIONS =====

export const createStaggeredAnimation = (delay = 0.1) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: delay
    }
  }
})

export const createSlideAnimation = (direction = 'up', distance = 20) => {
  const directions = {
    up: { initial: { y: distance }, animate: { y: 0 } },
    down: { initial: { y: -distance }, animate: { y: 0 } },
    left: { initial: { x: distance }, animate: { x: 0 } },
    right: { initial: { x: -distance }, animate: { x: 0 } }
  }
  
  return {
    initial: { 
      opacity: 0, 
      ...directions[direction].initial 
    },
    animate: { 
      opacity: 1, 
      ...directions[direction].animate,
      transition: {
        duration: animationDuration.netflix / 1000,
        ease: animationEasing.netflix
      }
    }
  }
}

export const createScaleAnimation = (scale = 0.8) => ({
  initial: { 
    opacity: 0, 
    scale 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: animationDuration.netflix / 1000,
      ease: animationEasing.netflix
    }
  }
})

// ===== PRESET COMBINATIONS =====

export const presets = {
  // Netflix card entrance
  netflixCard: netflixCardVariants,
  
  // Modal/Dialog
  modal: modalVariants,
  
  // Page transitions
  pageTransition: pageVariants,
  
  // List animations
  staggeredList: {
    container: staggerContainer,
    item: listItemVariants
  },
  
  // Loading states
  loading: {
    fade: loadingVariants,
    spin: spinVariants,
    pulse: pulseVariants,
    wave: waveVariants
  },
  
  // Interactive elements
  interactive: {
    button: buttonVariants,
    icon: iconVariants,
    chip: chipVariants,
    hover: netflixHoverVariants
  }
}

export default {
  duration: animationDuration,
  easing: animationEasing,
  variants: {
    fade: fadeVariants,
    slideUp: slideUpVariants,
    slideDown: slideDownVariants,
    slideLeft: slideLeftVariants,
    slideRight: slideRightVariants,
    scale: scaleVariants,
    netflixCard: netflixCardVariants,
    modal: modalVariants,
    drawer: drawerVariants,
    listItem: listItemVariants,
    stagger: staggerContainer,
    loading: loadingVariants,
    spin: spinVariants,
    pulse: pulseVariants,
    wave: waveVariants,
    netflixHover: netflixHoverVariants,
    glow: glowVariants,
    typewriter: typewriterVariants,
    page: pageVariants,
    overlay: overlayVariants,
    button: buttonVariants,
    icon: iconVariants,
    chip: chipVariants
  },
  utils: {
    createStaggeredAnimation,
    createSlideAnimation,
    createScaleAnimation
  },
  presets
}