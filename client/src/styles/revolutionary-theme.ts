import { createTheme, ThemeOptions } from '@mui/material/styles';

// CULINARY COSMOS DESIGN SYSTEM
export const tasteColors = {
  umami: 'linear-gradient(135deg, #FF6B6B, #845EC2)',
  sweet: 'radial-gradient(circle, #FFE66D, #FF6B6B)',
  sour: 'conic-gradient(from 180deg, #4ECDC4, #95E1D3)',
  bitter: 'linear-gradient(to right, #2D3436, #636E72)',
  salty: 'linear-gradient(45deg, #74B9FF, #A29BFE)',
};

// Motion curves for organic animations
export const motionCurves = {
  organic: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.23, 1, 0.320, 1)',
  energetic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Glassmorphism values
export const glassEffect = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(40px) saturate(200%)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
};

// Neuromorphic effect
export const neuroEffect = {
  light: {
    background: 'linear-gradient(145deg, #f0f0f0, #cacaca)',
    boxShadow: '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
  },
  dark: {
    background: 'linear-gradient(145deg, #2a2d3a, #1f2129)',
    boxShadow: '20px 20px 60px #1a1c24, -20px -20px 60px #363945',
  },
};

const revolutionaryTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#845EC2',
      light: '#B39CD0',
      dark: '#664DB8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF6B6B',
      light: '#FF8E8E',
      dark: '#E54F4F',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4ECDC4',
      light: '#7EDAD4',
      dark: '#3AB3AB',
    },
    warning: {
      main: '#FFE66D',
      light: '#FFEF98',
      dark: '#F4D949',
    },
    info: {
      main: '#74B9FF',
      light: '#9BCFFF',
      dark: '#5AA3E6',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"SF Pro Display"',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.35,
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.45,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.1)',
    '0px 12px 24px rgba(0,0,0,0.12)',
    '0px 16px 32px rgba(0,0,0,0.14)',
    '0px 20px 40px rgba(0,0,0,0.16)',
    '0px 24px 48px rgba(0,0,0,0.18)',
    '0px 28px 56px rgba(0,0,0,0.20)',
    '0px 32px 64px rgba(0,0,0,0.22)',
    '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    '0 12px 40px 0 rgba(31, 38, 135, 0.40)',
    '0 16px 48px 0 rgba(31, 38, 135, 0.43)',
    '0 20px 56px 0 rgba(31, 38, 135, 0.46)',
    '0 24px 64px 0 rgba(31, 38, 135, 0.49)',
    '0 28px 72px 0 rgba(31, 38, 135, 0.52)',
    '0 32px 80px 0 rgba(31, 38, 135, 0.55)',
    '0 36px 88px 0 rgba(31, 38, 135, 0.58)',
    '0 40px 96px 0 rgba(31, 38, 135, 0.61)',
    '0 44px 104px 0 rgba(31, 38, 135, 0.64)',
    '0 48px 112px 0 rgba(31, 38, 135, 0.67)',
    '0 52px 120px 0 rgba(31, 38, 135, 0.70)',
    '0 56px 128px 0 rgba(31, 38, 135, 0.73)',
    '0 60px 136px 0 rgba(31, 38, 135, 0.76)',
    '0 64px 144px 0 rgba(31, 38, 135, 0.79)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '1rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(132, 94, 194, 0.3)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(132, 94, 194, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#845EC2',
                borderWidth: '2px',
              },
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(132, 94, 194, 0.1)',
            },
          },
        },
      },
    },
  },
};

export const darkRevolutionaryTheme: ThemeOptions = {
  ...revolutionaryTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#B39CD0',
      light: '#C9B5DD',
      dark: '#845EC2',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FF8E8E',
      light: '#FFA8A8',
      dark: '#FF6B6B',
      contrastText: '#000000',
    },
    success: {
      main: '#7EDAD4',
      light: '#A0E8E1',
      dark: '#4ECDC4',
    },
    warning: {
      main: '#FFEF98',
      light: '#FFF5B8',
      dark: '#FFE66D',
    },
    info: {
      main: '#9BCFFF',
      light: '#BFDFFF',
      dark: '#74B9FF',
    },
    background: {
      default: '#1A1D29',
      paper: '#242838',
    },
    text: {
      primary: '#E8EAED',
      secondary: '#B0B5C3',
    },
  },
};

export const revolutionaryLightTheme = createTheme(revolutionaryTheme);
export const revolutionaryDarkTheme = createTheme(darkRevolutionaryTheme);

export default revolutionaryLightTheme;
