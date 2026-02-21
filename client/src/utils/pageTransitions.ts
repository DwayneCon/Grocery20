/* client/src/utils/pageTransitions.ts */
import { Variants } from 'framer-motion';

/**
 * Custom easing curve for smooth, natural motion
 * Based on Apple's spring timing
 */
export const smoothEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Page transition variants for full page animations
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: smoothEasing,
      opacity: { duration: 0.3 },
      y: { duration: 0.4 },
      scale: { duration: 0.35 },
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    transition: {
      duration: 0.25,
      ease: smoothEasing,
    },
  },
};

/**
 * Fade in animation (subtle)
 */
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Slide up animation (for cards, modals)
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.25,
    },
  },
};

/**
 * Scale in animation (for dialogs, tooltips)
 */
export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Stagger children animation (for lists)
 */
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Stagger item animation (for list items)
 */
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Slide in from left (for sidebars, drawers)
 */
export const slideFromLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.25,
    },
  },
};

/**
 * Slide in from right (for sidebars, drawers)
 */
export const slideFromRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: {
      duration: 0.25,
    },
  },
};

/**
 * Bounce in animation (for notifications, alerts)
 */
export const bounceInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      duration: 0.6,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Flip animation (for cards)
 */
export const flipVariants: Variants = {
  hidden: {
    opacity: 0,
    rotateY: -90,
  },
  visible: {
    opacity: 1,
    rotateY: 0,
    transition: {
      duration: 0.5,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    rotateY: 90,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Blur reveal animation (for hero sections)
 */
export const blurRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(5px)',
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Typing cursor animation
 */
export const cursorVariants: Variants = {
  blinking: {
    opacity: [0, 0, 1, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatDelay: 0,
      ease: 'linear',
      times: [0, 0.5, 0.5, 1],
    },
  },
};

/**
 * Preset transition configurations for common durations
 */
export const transitionPresets = {
  fast: { duration: 0.2, ease: smoothEasing },
  normal: { duration: 0.3, ease: smoothEasing },
  slow: { duration: 0.5, ease: smoothEasing },
  spring: { type: 'spring' as const, stiffness: 260, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 15 },
};
