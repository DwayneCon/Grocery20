import { Box } from '@mui/material';
import { ReactNode } from 'react';

interface AuroraBackgroundProps {
  children?: ReactNode;
  colors?: string[];
  speed?: number;
}

const AuroraBackground = ({
  children,
  colors = ['#ee7752', '#e73c7e', '#23a6d5', '#23d5ab'],
  speed = 15,
}: AuroraBackgroundProps) => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(-45deg, ${colors.join(', ')})`,
          backgroundSize: '400% 400%',
          animation: `aurora ${speed}s ease infinite`,
          '@keyframes aurora': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }}
      />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AuroraBackground;
