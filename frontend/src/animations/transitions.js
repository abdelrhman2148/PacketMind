// Netflix-inspired animation presets and transitions

// Easing functions matching Netflix's design system
export const netflixEasing = {
  // Cubic bezier curves for smooth Netflix-style animations
  standard: [0.4, 0, 0.2, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.25, 0.46, 0.45, 0.94]
}

// Page transition variants
export const pageTransitions = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: netflixEasing.standard,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: netflixEasing.accelerate
    }
  }
}

// Card hover animations
export const cardAnimations = {
  initial: {
    scale: 1,
    y: 0,
    rotateX: 0,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
  },
  hover: {
    scale: 1.02,
    y: -8,
    rotateX: 5,
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8)',
    transition: {
      duration: 0.3,
      ease: netflixEasing.decelerate
    }
  },
  tap: {
    scale: 0.98,
    y: -4,
    transition: {
      duration: 0.1,
      ease: netflixEasing.sharp
    }
  }
}

// List item stagger animations
export const listItemAnimations = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.4,
      ease: netflixEasing.standard
    }
  }),
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: netflixEasing.accelerate
    }
  }
}

// Modal animations
export const modalAnimations = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 100
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: netflixEasing.bounce,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -100,
    transition: {
      duration: 0.3,
      ease: netflixEasing.accelerate
    }
  }
}

// Sidebar slide animations
export const sidebarAnimations = {
  closed: {
    x: '100%',
    transition: {
      duration: 0.4,
      ease: netflixEasing.sharp
    }
  },
  open: {
    x: 0,
    transition: {
      duration: 0.4,
      ease: netflixEasing.decelerate,
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

// Button press animations
export const buttonAnimations = {
  initial: {
    scale: 1,
    boxShadow: '0 4px 15px rgba(229, 9, 20, 0.3)'
  },
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: '0 8px 25px rgba(229, 9, 20, 0.5)',
    transition: {
      duration: 0.2,
      ease: netflixEasing.decelerate
    }
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: 0.1,
      ease: netflixEasing.sharp
    }
  }
}

// Loading content animations
export const loadingAnimations = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: netflixEasing.standard
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: netflixEasing.accelerate
    }
  }
}

// Pulse animations for real-time indicators
export const pulseAnimations = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: netflixEasing.standard
    }
  }
}

// Shimmer effect for loading states
export const shimmerAnimations = {
  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

// Fade animations
export const fadeAnimations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: netflixEasing.standard
      }
    }
  },
  fadeOut: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: netflixEasing.accelerate
    }
  }
}

// Scale animations
export const scaleAnimations = {
  scaleIn: {
    initial: {
      scale: 0,
      opacity: 0
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: netflixEasing.bounce
      }
    }
  },
  scaleOut: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: netflixEasing.accelerate
    }
  }
}

// Slide animations
export const slideAnimations = {
  slideInLeft: {
    initial: {
      x: -100,
      opacity: 0
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: netflixEasing.decelerate
      }
    }
  },
  slideInRight: {
    initial: {
      x: 100,
      opacity: 0
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: netflixEasing.decelerate
      }
    }
  },
  slideInUp: {
    initial: {
      y: 100,
      opacity: 0
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: netflixEasing.decelerate
      }
    }
  },
  slideInDown: {
    initial: {
      y: -100,
      opacity: 0
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: netflixEasing.decelerate
      }
    }
  }
}

// Notification animations
export const notificationAnimations = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: netflixEasing.bounce
    }
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.8,
    transition: {
      duration: 0.3,
      ease: netflixEasing.accelerate
    }
  }
}

// Progress bar animations
export const progressAnimations = {
  loading: {
    width: ['0%', '100%'],
    transition: {
      duration: 2,
      ease: netflixEasing.standard,
      repeat: Infinity
    }
  },
  complete: {
    width: '100%',
    transition: {
      duration: 0.5,
      ease: netflixEasing.decelerate
    }
  }
}

// Floating animations
export const floatingAnimations = {
  float: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: netflixEasing.standard
    }
  }
}

// Rotation animations
export const rotationAnimations = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  },
  slowSpin: {
    rotate: 360,
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

// Container animations for staggered children
export const containerAnimations = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

// Export commonly used transition configurations
export const transitions = {
  default: {
    duration: 0.3,
    ease: netflixEasing.standard
  },
  fast: {
    duration: 0.2,
    ease: netflixEasing.sharp
  },
  slow: {
    duration: 0.6,
    ease: netflixEasing.decelerate
  },
  bounce: {
    duration: 0.5,
    ease: netflixEasing.bounce
  },
  elastic: {
    duration: 0.8,
    ease: netflixEasing.elastic
  }
}

export default {
  easing: netflixEasing,
  page: pageTransitions,
  card: cardAnimations,
  list: listItemAnimations,
  modal: modalAnimations,
  sidebar: sidebarAnimations,
  button: buttonAnimations,
  loading: loadingAnimations,
  pulse: pulseAnimations,
  shimmer: shimmerAnimations,
  fade: fadeAnimations,
  scale: scaleAnimations,
  slide: slideAnimations,
  notification: notificationAnimations,
  progress: progressAnimations,
  floating: floatingAnimations,
  rotation: rotationAnimations,
  container: containerAnimations,
  transitions
}