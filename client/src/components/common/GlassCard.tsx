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
  ...props
}: GlassCardProps) => {
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
      background: 'rgba(20, 20, 25, 0.6)', // Darker base for contrast
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

  const style = intensityMap[intensity];

  if (noBorder) delete style.border;

  return (
    <Box
      component={motion.div}
      whileHover={hover ? {
        y: -5,
        transition: { duration: 0.3, ease: "easeOut" }
      } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      sx={{
        ...style,
        borderRadius: '24px', // Smoother corners
        padding: 3,
        position: 'relative',
        overflow: 'hidden',
        ...props.sx,
      }}
      {...props}
    >
      {/* Shine Effect on Hover */}
      {hover && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.03) 25%, transparent 30%)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.6s',
            zIndex: 0,
            pointerEvents: 'none',
            '.MuiBox-root:hover &': {
              transform: 'translateX(100%)',
              transition: 'transform 0.8s',
            }
          }}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default GlassCard;
