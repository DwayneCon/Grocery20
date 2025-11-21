/* client/src/contexts/ThemeContext.tsx */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, Theme } from '@mui/material';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as PaletteMode) || 'dark';
  });

  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('fontSize');
    return (saved as 'small' | 'medium' | 'large') || 'medium';
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem('reducedMotion');
    return saved === 'true';
  });

  const [highContrast, setHighContrast] = useState(() => {
    const saved = localStorage.getItem('highContrast');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reducedMotion', reducedMotion.toString());
    // Apply reduced motion preference
    if (reducedMotion) {
      document.documentElement.style.setProperty('--motion-duration', '0.01ms');
    } else {
      document.documentElement.style.removeProperty('--motion-duration');
    }
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('highContrast', highContrast.toString());
  }, [highContrast]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
  };

  const toggleReducedMotion = () => {
    setReducedMotion((prev) => !prev);
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const fontSizeMap = {
    small: {
      fontSize: 12,
      h1: { fontSize: '2rem' },
      h2: { fontSize: '1.75rem' },
      h3: { fontSize: '1.5rem' },
      h4: { fontSize: '1.25rem' },
      h5: { fontSize: '1.1rem' },
      h6: { fontSize: '1rem' },
      body1: { fontSize: '0.875rem' },
      body2: { fontSize: '0.8rem' },
    },
    medium: {
      fontSize: 14,
      h1: { fontSize: '2.5rem' },
      h2: { fontSize: '2rem' },
      h3: { fontSize: '1.75rem' },
      h4: { fontSize: '1.5rem' },
      h5: { fontSize: '1.25rem' },
      h6: { fontSize: '1.1rem' },
      body1: { fontSize: '1rem' },
      body2: { fontSize: '0.875rem' },
    },
    large: {
      fontSize: 16,
      h1: { fontSize: '3rem' },
      h2: { fontSize: '2.5rem' },
      h3: { fontSize: '2rem' },
      h4: { fontSize: '1.75rem' },
      h5: { fontSize: '1.5rem' },
      h6: { fontSize: '1.25rem' },
      body1: { fontSize: '1.125rem' },
      body2: { fontSize: '1rem' },
    },
  };

  // Calculate colors outside theme creation to avoid dynamic values
  const primaryColor = highContrast ? (mode === 'dark' ? '#00FF00' : '#0000FF') : '#4ECDC4';
  const secondaryColor = highContrast ? (mode === 'dark' ? '#FFFF00' : '#FF00FF') : '#FF6B6B';

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: primaryColor,
      },
      secondary: {
        main: secondaryColor,
      },
      background: {
        default: mode === 'dark'
          ? (highContrast ? '#000000' : '#0A0E27')
          : (highContrast ? '#FFFFFF' : '#F5F5F5'),
        paper: mode === 'dark'
          ? (highContrast ? '#000000' : '#1A1F3A')
          : (highContrast ? '#FFFFFF' : '#FFFFFF'),
      },
      text: {
        primary: mode === 'dark'
          ? (highContrast ? '#FFFFFF' : 'rgba(255, 255, 255, 0.95)')
          : (highContrast ? '#000000' : 'rgba(0, 0, 0, 0.87)'),
        secondary: mode === 'dark'
          ? (highContrast ? '#CCCCCC' : 'rgba(255, 255, 255, 0.7)')
          : (highContrast ? '#333333' : 'rgba(0, 0, 0, 0.6)'),
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: fontSizeMap[fontSize].fontSize,
      h1: fontSizeMap[fontSize].h1,
      h2: fontSizeMap[fontSize].h2,
      h3: fontSizeMap[fontSize].h3,
      h4: fontSizeMap[fontSize].h4,
      h5: fontSizeMap[fontSize].h5,
      h6: fontSizeMap[fontSize].h6,
      body1: fontSizeMap[fontSize].body1,
      body2: fontSizeMap[fontSize].body2,
    },
    shape: {
      borderRadius: 16,
    },
    transitions: {
      duration: {
        shortest: reducedMotion ? 1 : 150,
        shorter: reducedMotion ? 1 : 200,
        short: reducedMotion ? 1 : 250,
        standard: reducedMotion ? 1 : 300,
        complex: reducedMotion ? 1 : 375,
        enteringScreen: reducedMotion ? 1 : 225,
        leavingScreen: reducedMotion ? 1 : 195,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '10px 24px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleTheme,
        fontSize,
        setFontSize,
        reducedMotion,
        toggleReducedMotion,
        highContrast,
        toggleHighContrast,
      }}
    >
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
