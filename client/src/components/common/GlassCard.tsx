/* client/src/components/common/GlassCard.tsx */
import { Box, BoxProps } from '@mui/material';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends BoxProps {
  children: ReactNode;
  hover?: boolean;
  intensity?: 'light' | 'medium' | 'strong' | 'ultra';
  noBorder?: boolean;
}

const GlassCard = ({
  children,
  hover = true,
  intensity = 'medium',
  noBorder = false,
  sx = {}, // Default to empty object
  ...props
}: GlassCardProps) => {

  // Define styles with strict string values for colors
  const intensityMap = {
    light: {
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(16px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(24px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
    },
    strong: {
      background: 'rgba(20, 20, 25, 0.6)',
      backdropFilter: 'blur(40px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    },
    ultra: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(60px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    }
  };

  // Safe fallback if intensity is invalid
  const baseStyle = intensityMap[intensity] || intensityMap['medium'];

  // Create a clean style object
  const finalStyle = {
    ...baseStyle,
    ...(noBorder && { border: 'none' }),
    borderRadius: '24px',
    padding: '24px', // Explicit px string
    position: 'relative' as const,
    overflow: 'hidden' as const,
    ...sx
  };

  return (
    <Box
      component={motion.div}
      whileHover={hover ? { y: -5 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      sx={finalStyle}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GlassCard;
