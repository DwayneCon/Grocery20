/* client/src/components/chat/TypingIndicator.tsx */
import React from 'react';
import { Box, keyframes } from '@mui/material';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  show?: boolean;
  variant?: 'cursor' | 'dots';
}

const blink = keyframes`
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
`;

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ show = true, variant = 'cursor' }) => {
  if (!show) return null;

  if (variant === 'cursor') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          width: '2px',
          height: '1.2em',
          bgcolor: 'var(--primary)',
          animation: `${blink} 1s infinite`,
          ml: 0.5,
          verticalAlign: 'middle',
        }}
      />
    );
  }

  // Dots variant (for "Nora is typing...")
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'var(--primary)',
            }}
          />
        </motion.div>
      ))}
    </Box>
  );
};

export default TypingIndicator;
