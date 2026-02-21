/* client/src/components/common/Skeleton.tsx */

import { Box, BoxProps } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export interface SkeletonProps extends BoxProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'wave',
  sx,
  ...props
}) => {
  const { mode } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          height: height || '1em',
          borderRadius: '4px',
        };
      case 'circular':
        return {
          borderRadius: '50%',
          width: width || height || '40px',
          height: height || width || '40px',
        };
      case 'rounded':
        return {
          borderRadius: 'var(--radius-lg)',
        };
      case 'rectangular':
      default:
        return {
          borderRadius: '4px',
        };
    }
  };

  const baseStyles = {
    width: width || '100%',
    height: height || '100%',
    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    position: 'relative',
    overflow: 'hidden',
    ...getVariantStyles(),
  };

  const animationVariants = {
    pulse: {
      opacity: [1, 0.4, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    wave: {
      backgroundPosition: ['-200px 0', '200px 0'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    none: {},
  };

  return (
    <Box
      component={motion.div}
      animate={animation === 'pulse' ? animationVariants.pulse : animation === 'none' ? {} : undefined}
      sx={{
        ...baseStyles,
        ...(animation === 'wave' && {
          background: mode === 'dark'
            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 100%)'
            : 'linear-gradient(90deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.12) 50%, rgba(0, 0, 0, 0.08) 100%)',
          backgroundSize: '200px 100%',
          animation: 'wave 1.5s linear infinite',
          '@keyframes wave': {
            '0%': {
              backgroundPosition: '-200px 0',
            },
            '100%': {
              backgroundPosition: '200px 0',
            },
          },
        }),
        ...sx,
      }}
      {...props}
    />
  );
};

// Preset skeleton components for common use cases
export const TextSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="text" {...props} />
);

export const CircularSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="circular" {...props} />
);

export const RoundedSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="rounded" {...props} />
);

export const CardSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <CircularSkeleton width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <TextSkeleton width="60%" height="24px" sx={{ mb: 1 }} />
          <TextSkeleton width="40%" height="16px" />
        </Box>
      </Box>
      <RoundedSkeleton height="200px" sx={{ mb: 2 }} />
      <TextSkeleton width="100%" sx={{ mb: 1 }} />
      <TextSkeleton width="90%" sx={{ mb: 1 }} />
      <TextSkeleton width="80%" />
    </Box>
  );
};

export const MealCardSkeleton: React.FC = () => {
  const { mode } = useTheme();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 'var(--radius-lg)',
        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextSkeleton width="80px" height="20px" />
        <CircularSkeleton width={18} height={18} />
      </Box>
      <TextSkeleton width="90%" height="28px" sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <RoundedSkeleton width="80px" height="32px" />
        <RoundedSkeleton width="100px" height="32px" />
      </Box>
    </Box>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <TextSkeleton key={i} width={`${100 / columns}%`} height="24px" />
      ))}
    </Box>
  );
};

export const ListItemSkeleton: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
      <CircularSkeleton width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <TextSkeleton width="70%" height="20px" sx={{ mb: 0.5 }} />
        <TextSkeleton width="40%" height="14px" />
      </Box>
      <RoundedSkeleton width="60px" height="32px" />
    </Box>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <TextSkeleton width="100px" height="16px" sx={{ mb: 1 }} />
        <TextSkeleton width="300px" height="48px" />
      </Box>

      {/* Grid of cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <RoundedSkeleton key={i} height="200px" />
        ))}
      </Box>
    </Box>
  );
};

export default Skeleton;
