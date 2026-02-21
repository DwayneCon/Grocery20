/* client/src/utils/microinteractions.ts */
import { Variants } from 'framer-motion';

/**
 * Microinteraction Animation Variants
 * Reusable framer-motion variants for consistent interactions across the app
 */

/**
 * Button press feedback
 */
export const buttonPress: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

/**
 * Gentle hover lift
 */
export const hoverLift: Variants = {
  rest: { y: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  hover: {
    y: -4,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transition: { duration: 0.2 },
  },
};

/**
 * Card hover effect
 */
export const cardHover: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
  },
};

/**
 * Bounce in animation
 */
export const bounceIn: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

/**
 * Fade slide in from bottom
 */
export const fadeSlideUp: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

/**
 * Stagger children animations
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Stagger item
 */
export const staggerItem: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

/**
 * Page transition
 */
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Shake animation (for errors)
 */
export const shake: Variants = {
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
};

/**
 * Pulse animation (for notifications)
 */
export const pulse: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

/**
 * Ripple effect (for buttons)
 */
export const ripple: Variants = {
  initial: {
    scale: 0,
    opacity: 0.5,
  },
  animate: {
    scale: 2,
    opacity: 0,
    transition: {
      duration: 0.6,
    },
  },
};

/**
 * Glow effect on hover
 */
export const glow: Variants = {
  rest: {
    filter: 'drop-shadow(0 0 0px rgba(255,107,53,0))',
  },
  hover: {
    filter: 'drop-shadow(0 0 10px rgba(255,107,53,0.5))',
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Rotate on hover (for icons)
 */
export const rotateHover: Variants = {
  rest: { rotate: 0 },
  hover: {
    rotate: 15,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Scale pulse (for loading states)
 */
export const scalePulse: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  },
};

/**
 * Expand width (for progress bars)
 */
export const expandWidth: Variants = {
  initial: { width: 0 },
  animate: {
    width: '100%',
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

/**
 * Morph shape (for dynamic icons)
 */
export const morphShape: Variants = {
  circle: {
    borderRadius: '50%',
    transition: { duration: 0.3 },
  },
  square: {
    borderRadius: '0%',
    transition: { duration: 0.3 },
  },
  rounded: {
    borderRadius: '12px',
    transition: { duration: 0.3 },
  },
};

/**
 * Success checkmark animation
 */
export const successCheck: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

/**
 * Drawer slide in
 */
export const drawerSlide: Variants = {
  closed: {
    x: '100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Modal backdrop
 */
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      delay: 0.1,
    },
  },
};

/**
 * Modal content
 */
export const modalContent: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Number counter animation
 */
export const numberCount: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

/**
 * Flip card
 */
export const flipCard: Variants = {
  front: {
    rotateY: 0,
    transition: {
      duration: 0.6,
    },
  },
  back: {
    rotateY: 180,
    transition: {
      duration: 0.6,
    },
  },
};

/**
 * Spring bounce
 */
export const springBounce = {
  type: 'spring',
  stiffness: 400,
  damping: 10,
};

/**
 * Smooth ease
 */
export const smoothEase = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1], // Material Design easing
};

/**
 * Snappy transition
 */
export const snappyTransition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};
