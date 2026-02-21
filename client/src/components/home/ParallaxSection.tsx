import { ReactNode, useRef } from 'react';
import { Box } from '@mui/material';
import { motion, useScroll, useTransform, useReducedMotion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface ParallaxSectionProps {
  children: ReactNode;
  direction?: 'left' | 'right';
  className?: string;
}

const ParallaxSection = ({
  children,
  direction = 'left',
  className,
}: ParallaxSectionProps) => {
  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ['start end', 'end start'],
  });

  // Subtle parallax depth: content moves slightly against scroll
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  const [inViewRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  // Slide in from the side based on direction
  const slideX = direction === 'left' ? -60 : 60;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: slideX,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
        staggerChildren: 0.2,
      },
    },
  };

  if (prefersReducedMotion) {
    return (
      <Box
        ref={scrollRef}
        className={className}
        sx={{
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div ref={inViewRef}>
          {children}
        </div>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      className={className}
      sx={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div style={{ y, position: 'relative' }}>
        <div ref={inViewRef}>
          <motion.div
            variants={variants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </Box>
  );
};

export default ParallaxSection;
