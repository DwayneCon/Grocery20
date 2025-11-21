import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { setCredentials } from '../../features/auth/authSlice';
import { authService } from '../../services/authService';
import AuroraBackground from '../../components/common/AuroraBackground';
import GlassCard from '../../components/common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const auroraColors = mode === 'dark'
    ? ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
    : ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });

      dispatch(
        setCredentials({
          user: {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            householdId: response.user.householdId,
          },
          token: response.accessToken,
        })
      );

      // Store refresh token
      localStorage.setItem('refreshToken', response.refreshToken);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground colors={auroraColors} speed={20}>
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
          <GlassCard
            intensity="ultra"
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ p: { xs: 3, md: 4 }, width: '100%' }}
          >
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              align="center"
              fontWeight="900"
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                  : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Sign In
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 4, color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
              Welcome back to Grocery20
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: mode === 'dark' ? 'white' : '#000000',
                    '& fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)'
                    },
                    '&:hover fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
                  }
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: mode === 'dark' ? 'white' : '#000000',
                    '& fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)'
                    },
                    '&:hover fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
                  }
                }}
              />

              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 4,
                  mb: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  py: 1.5,
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
                  },
                  '&:disabled': {
                    background: 'rgba(102, 126, 234, 0.5)'
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                  Don't have an account?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate('/register')}
                    sx={{
                      cursor: 'pointer',
                      color: '#667eea',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Sign Up
                  </Link>
                </Typography>
              </Box>
            </form>
          </GlassCard>
        </Box>
      </Container>
    </AuroraBackground>
  );
};

export default LoginPage;
