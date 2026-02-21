/* client/src/components/common/UnifiedCard.tsx */
import { Box, BoxProps } from '@mui/material';
import { motion, HTMLMotionProps, Variants, TargetAndTransition } from 'framer-motion';
import { ReactNode } from 'react';

export type CardVariant = 'solid' | 'glass' | 'outlined' | 'elevated';

export interface UnifiedCardProps extends Omit<BoxProps, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  variant?: CardVariant;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  // Framer Motion props
  initial?: HTMLMotionProps<'div'>['initial'];
  animate?: HTMLMotionProps<'div'>['animate'];
  exit?: HTMLMotionProps<'div'>['exit'];
  variants?: Variants;
  transition?: HTMLMotionProps<'div'>['transition'];
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
  whileInView?: HTMLMotionProps<'div'>['whileInView'];
  viewport?: HTMLMotionProps<'div'>['viewport'];
  layout?: boolean | 'position' | 'size';
  layoutId?: string;
}

const UnifiedCard = ({
  children,
  variant = 'solid',
  hover = true,
  padding = 'md',
  borderRadius = 'lg',
  sx = {},
  // Framer Motion props
  initial,
  animate,
  exit,
  variants,
  transition,
  whileHover: customWhileHover,
  whileTap: customWhileTap,
  whileInView,
  viewport,
  layout,
  layoutId,
  ...props
}: UnifiedCardProps) => {

  // Padding map using design tokens
  const paddingMap = {
    none: '0',
    sm: 'var(--space-2)',    // 16px
    md: 'var(--space-3)',    // 24px
    lg: 'var(--space-4)',    // 32px
    xl: 'var(--space-6)',    // 48px
  };

  // Border radius map using design tokens
  const radiusMap = {
    sm: 'var(--radius-sm)',   // 6px
    md: 'var(--radius-md)',   // 12px
    lg: 'var(--radius-lg)',   // 16px
    xl: 'var(--radius-xl)',   // 24px
  };

  // Variant styles using design tokens
  const variantStyles = {
    solid: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-md)',
      '&:hover': hover ? {
        boxShadow: 'var(--shadow-lg)',
      } : {},
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'var(--shadow-glass)',
      '&:hover': hover ? {
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
      } : {},
    },
    outlined: {
      background: 'transparent',
      border: '2px solid var(--border-color)',
      boxShadow: 'none',
      '&:hover': hover ? {
        borderColor: 'var(--chef-orange)',
        boxShadow: '0 0 0 1px var(--chef-orange)',
      } : {},
    },
    elevated: {
      background: 'var(--bg-secondary)',
      border: 'none',
      boxShadow: 'var(--shadow-elevated)',
      '&:hover': hover ? {
        boxShadow: 'var(--shadow-elevated-hover)',
        transform: 'translateY(-2px)',
      } : {},
    },
  };

  // Construct final style object
  const finalStyle = {
    ...variantStyles[variant],
    padding: paddingMap[padding],
    borderRadius: radiusMap[borderRadius],
    position: 'relative',
    overflow: 'hidden',
    transition: 'all var(--transition-normal)',
    ...sx
  };

  // Default motion values
  const effectiveWhileHover = customWhileHover ?? (hover && variant !== 'elevated' ? { y: -4 } : undefined);
  const effectiveWhileTap = customWhileTap ?? (hover ? { scale: 0.98 } : undefined);

  return (
    <Box
      component={motion.div}
      initial={initial}
      animate={animate}
      exit={exit}
      variants={variants}
      transition={transition ?? { duration: 0.3, ease: 'easeOut' }}
      whileHover={effectiveWhileHover}
      whileTap={effectiveWhileTap}
      whileInView={whileInView}
      viewport={viewport}
      layout={layout}
      layoutId={layoutId}
      sx={finalStyle}
      {...props}
    >
      {/* Shine Effect on Hover (for glass and elevated variants) */}
      {hover && (variant === 'glass' || variant === 'elevated') && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(105deg, transparent 20%, rgba(255, 107, 53, 0.1) 25%, transparent 30%)',
            transform: 'translateX(-100%)',
            transition: 'transform var(--transition-slow)',
            zIndex: 0,
            pointerEvents: 'none',
            '.MuiBox-root:hover &': {
              transform: 'translateX(100%)',
            }
          }}
        />
      )}

      {/* Content wrapper */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default UnifiedCard;
