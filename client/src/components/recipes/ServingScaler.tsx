import { Box, IconButton, Typography, Chip } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface ServingScalerProps {
  baseServings: number;
  currentServings: number;
  onServingsChange: (servings: number) => void;
}

const ServingScaler = ({ baseServings, currentServings, onServingsChange }: ServingScalerProps) => {
  const { mode } = useTheme();
  const scaleFactor = currentServings / baseServings;
  const isScaled = currentServings !== baseServings;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontWeight: 500 }}
      >
        Servings
      </Typography>

      <IconButton
        size="small"
        onClick={() => onServingsChange(Math.max(1, currentServings - 1))}
        disabled={currentServings <= 1}
        sx={{
          color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          width: 28,
          height: 28,
          '&:hover': {
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
          },
        }}
      >
        <Remove sx={{ fontSize: 16 }} />
      </IconButton>

      <Typography
        variant="h6"
        sx={{
          color: mode === 'dark' ? 'white' : '#000',
          fontWeight: 700,
          minWidth: 24,
          textAlign: 'center',
        }}
      >
        {currentServings}
      </Typography>

      <IconButton
        size="small"
        onClick={() => onServingsChange(Math.min(20, currentServings + 1))}
        disabled={currentServings >= 20}
        sx={{
          color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          width: 28,
          height: 28,
          '&:hover': {
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
          },
        }}
      >
        <Add sx={{ fontSize: 16 }} />
      </IconButton>

      {isScaled && (
        <Chip
          label={`${scaleFactor.toFixed(1)}x`}
          size="small"
          sx={{
            bgcolor: 'rgba(78,205,196,0.2)',
            color: '#4ECDC4',
            fontWeight: 700,
            height: 24,
          }}
        />
      )}
    </Box>
  );
};

export default ServingScaler;
