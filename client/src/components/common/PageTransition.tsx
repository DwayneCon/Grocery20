/* client/src/components/common/PageTransition.tsx */
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { springs } from '../../utils/springConfig';
import {
  fadeInVariants,
  slideUpVariants,
  scaleInVariants,
  staggerContainerVariants,
  staggerItemVariants,
  slideFromLeftVariants,
  slideFromRightVariants,
  bounceInVariants,
  flipVariants,
  blurRevealVariants,
} from '../../utils/pageTransitions';

type TransitionType =
  | 'fade'
  | 'slideUp'
  | 'scaleIn'
  | 'staggerContainer'
  | 'staggerItem'
  | 'slideFromLeft'
  | 'slideFromRight'
  | 'bounceIn'
  | 'flip'
  | 'blurReveal'
  | 'pageSlide'
  | 'none';

interface PageTransitionProps {
  children: ReactNode;
  type?: TransitionType;
  delay?: number;
  duration?: number;
  customVariants?: Variants;
  className?: string;
  /** Unique key for AnimatePresence (e.g., location.pathname). When provided, wraps in AnimatePresence mode="wait". */
  transitionKey?: string;
}

/**
 * Spring-powered page slide variants.
 * Enter: fade in + slide from right (x: 20 -> 0)
 * Exit: fade out + slide left (x: 0 -> -20)
 */
const pageSlideVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: springs.snappy,
  },
};

const variantMap: Record<TransitionType, Variants | null> = {
  fade: fadeInVariants,
  slideUp: slideUpVariants,
  scaleIn: scaleInVariants,
  staggerContainer: staggerContainerVariants,
  staggerItem: staggerItemVariants,
  slideFromLeft: slideFromLeftVariants,
  slideFromRight: slideFromRightVariants,
  bounceIn: bounceInVariants,
  flip: flipVariants,
  blurReveal: blurRevealVariants,
  pageSlide: pageSlideVariants,
  none: null,
};

/**
 * PageTransition - Wrapper component for consistent page/component animations
 *
 * @example
 * // Fade in animation
 * <PageTransition type="fade">
 *   <YourComponent />
 * </PageTransition>
 *
 * @example
 * // Spring-powered page slide with AnimatePresence
 * <PageTransition type="pageSlide" transitionKey={location.pathname}>
 *   <Outlet />
 * </PageTransition>
 *
 * @example
 * // Staggered list animation
 * <PageTransition type="staggerContainer">
 *   {items.map(item => (
 *     <PageTransition key={item.id} type="staggerItem">
 *       <ListItem>{item.name}</ListItem>
 *     </PageTransition>
 *   ))}
 * </PageTransition>
 *
 * @example
 * // Custom variants
 * <PageTransition customVariants={myCustomVariants}>
 *   <YourComponent />
 * </PageTransition>
 */
const PageTransition = ({
  children,
  type = 'fade',
  delay = 0,
  duration,
  customVariants,
  className,
  transitionKey,
}: PageTransitionProps) => {
  // Use custom variants if provided, otherwise use preset
  const variants = customVariants || variantMap[type];

  // If no animation, return children directly
  if (type === 'none' || !variants) {
    return <>{children}</>;
  }

  // Override transition timings if provided
  const modifiedVariants = duration || delay > 0
    ? {
        ...variants,
        visible: {
          ...variants.visible,
          transition: {
            ...(variants.visible as any).transition,
            ...(duration && { duration }),
            ...(delay > 0 && { delay }),
          },
        },
      }
    : variants;

  const motionContent = (
    <motion.div
      key={transitionKey}
      variants={modifiedVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );

  // When a transitionKey is provided, wrap in AnimatePresence for route transitions
  if (transitionKey) {
    return (
      <AnimatePresence mode="wait">
        {motionContent}
      </AnimatePresence>
    );
  }

  return motionContent;
};

export default PageTransition;
