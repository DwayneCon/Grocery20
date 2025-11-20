import { Box, BoxProps, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface NeuroCardProps extends BoxProps {
  children: ReactNode;
  hover?: boolean;
  pressed?: boolean;
}

const NeuroCard = ({
  children,
  hover = true,
  pressed = false,
  ...props
}: NeuroCardProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const lightStyle = {
    background: 'linear-gradient(145deg, #f0f0f0, #cacaca)',
    boxShadow: pressed
      ? 'inset 10px 10px 30px #bebebe, inset -10px -10px 30px #ffffff'
      : '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
  };

  const darkStyle = {
    background: 'linear-gradient(145deg, #2a2d3a, #1f2129)',
    boxShadow: pressed
      ? 'inset 10px 10px 30px #1a1c24, inset -10px -10px 30px #363945'
      : '20px 20px 60px #1a1c24, -20px -20px 60px #363945',
  };

  const style = isDark ? darkStyle : lightStyle;

  return (
    <Box
      component={motion.div}
      whileHover={hover ? {
        scale: 1.02,
      } : undefined}
      whileTap={pressed ? { scale: 0.98 } : undefined}
      transition={{
        duration: 0.2,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      sx={{
        ...style,
        borderRadius: '20px',
        padding: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default NeuroCard;
