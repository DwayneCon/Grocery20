import { Box, BoxProps } from '@mui/material';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends BoxProps {
  children: ReactNode;
  hover?: boolean;
  intensity?: 'light' | 'medium' | 'strong';
}

const GlassCard = ({
  children,
  hover = true,
  intensity = 'medium',
  ...props
}: GlassCardProps) => {
  const intensityMap = {
    light: {
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(40px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
    },
    strong: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(60px) saturate(220%)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
    },
  };

  const style = intensityMap[intensity];

  return (
    <Box
      component={motion.div}
      whileHover={hover ? {
        y: -4,
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
      } : undefined}
      transition={{
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      sx={{
        ...style,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        borderRadius: '20px',
        padding: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GlassCard;
