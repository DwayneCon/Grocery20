/* client/src/components/common/AccessibilityMenu.tsx */
import { useState } from 'react';
import {
  IconButton,
  Menu,
  Typography,
  Switch,
  Divider,
  Box,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Accessibility,
  DarkMode,
  LightMode,
  TextFields,
  Animation,
  Contrast,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

const AccessibilityMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {
    mode,
    toggleTheme,
    fontSize,
    setFontSize,
    reducedMotion,
    toggleReducedMotion,
    highContrast,
    toggleHighContrast,
  } = useTheme();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Accessibility Settings" arrow>
        <IconButton
          onClick={handleOpen}
          sx={{
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
          }}
          aria-label="Open accessibility settings"
          aria-expanded={Boolean(anchorEl)}
          aria-haspopup="true"
        >
          <Accessibility />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
            minWidth: 300,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Accessibility /> Accessibility
          </Typography>

          {/* Theme Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'dark'}
                onChange={toggleTheme}
                icon={<LightMode sx={{ color: 'white' }} />}
                checkedIcon={<DarkMode sx={{ color: 'white' }} />}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                {mode === 'dark' ? <DarkMode /> : <LightMode />}
                <Typography>Dark Mode</Typography>
              </Box>
            }
            sx={{ mb: 2, width: '100%' }}
          />

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

          {/* Font Size */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextFields /> Font Size
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <Box
                  key={size}
                  onClick={() => setFontSize(size)}
                  sx={{
                    flex: 1,
                    py: 1,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: fontSize === size ? '#4ECDC4' : 'rgba(255,255,255,0.05)',
                    color: fontSize === size ? 'black' : 'white',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: fontSize === size ? 'bold' : 'normal',
                    '&:hover': {
                      bgcolor: fontSize === size ? '#3BA59E' : 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

          {/* Reduced Motion */}
          <FormControlLabel
            control={
              <Switch
                checked={reducedMotion}
                onChange={toggleReducedMotion}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4ECDC4',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                <Animation />
                <Typography>Reduce Motion</Typography>
              </Box>
            }
            sx={{ mb: 2, width: '100%' }}
          />

          {/* High Contrast */}
          <FormControlLabel
            control={
              <Switch
                checked={highContrast}
                onChange={toggleHighContrast}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4ECDC4',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                <Contrast />
                <Typography>High Contrast</Typography>
              </Box>
            }
            sx={{ width: '100%' }}
          />

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 2, display: 'block' }}>
            Settings are saved automatically
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default AccessibilityMenu;
