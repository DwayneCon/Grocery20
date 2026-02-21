/* client/src/pages/auth/ForgotPasswordPage.tsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Email, ArrowBack } from '@mui/icons-material';
import AuroraBackground from '../../components/common/AuroraBackground';
import GlassCard from '../../components/common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { sanitizeInput } from '../../utils/sanitize';
import { logger } from '../../utils/logger';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sanitizedEmail = sanitizeInput(email);

      if (!sanitizedEmail) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      const response = await authService.forgotPassword(sanitizedEmail);

      if (response.success || response.message) {
        setSuccess(true);
        logger.info('Password reset email sent', { email: sanitizedEmail });
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      logger.error('Forgot password error', err);
      // Don't reveal if email exists or not (security best practice)
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const auroraColors = mode === 'dark'
    ? ['#FF6B35', '#F4A460', '#6A4C93', '#05AF5C', '#FFD93D']
    : ['#FFDDC1', '#FFEDBC', '#E8D5F2', '#C1F7DC', '#FFF9D6'];

  return (
    <AuroraBackground speed={20} colors={auroraColors}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard
            intensity="ultra"
            sx={{
              width: '100%',
              maxWidth: 450,
              p: { xs: 3, sm: 4 },
              borderRadius: 'var(--radius-xl)',
            }}
          >
            {/* Back Button */}
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/login')}
              sx={{
                mb: 2,
                color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                '&:hover': {
                  color: mode === 'dark' ? 'white' : '#000000',
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                },
              }}
            >
              Back to Login
            </Button>

            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Email
                sx={{
                  fontSize: 48,
                  color: 'var(--chef-orange)',
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                fontWeight="900"
                sx={{
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                    : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  fontFamily: 'var(--font-display)',
                }}
              >
                Forgot Password?
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                }}
              >
                No worries! Enter your email and we'll send you a reset link.
              </Typography>
            </Box>

            {/* Success Message */}
            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: mode === 'dark' ? 'rgba(5, 175, 92, 0.1)' : 'rgba(5, 175, 92, 0.05)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(5, 175, 92, 0.3)' : 'rgba(5, 175, 92, 0.2)'}`,
                }}
              >
                If an account exists with that email, you'll receive a password reset link shortly.
                Check your inbox and spam folder.
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(211, 47, 47, 0.3)' : 'rgba(211, 47, 47, 0.2)'}`,
                }}
              >
                {error}
              </Alert>
            )}

            {/* Form */}
            {!success && (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      '& fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--chef-orange)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      '&.Mui-focused': {
                        color: 'var(--chef-orange)',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: mode === 'dark' ? 'white' : '#000000',
                    },
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)',
                    color: 'var(--pure-white)',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    py: 1.5,
                    borderRadius: 'var(--radius-md)',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                    transition: 'all var(--transition-bounce)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FF8C5A 0%, var(--chef-orange) 100%)',
                      boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&.Mui-disabled': {
                      background: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}

            {/* Success Action Button */}
            {success && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  background: 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)',
                  color: 'var(--pure-white)',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  py: 1.5,
                  borderRadius: 'var(--radius-md)',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                  transition: 'all var(--transition-bounce)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FF8C5A 0%, var(--chef-orange) 100%)',
                    boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Return to Login
              </Button>
            )}

            {/* Footer Links */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                }}
              >
                Remember your password?{' '}
                <Link
                  onClick={() => navigate('/login')}
                  sx={{
                    color: 'var(--chef-orange)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </GlassCard>
        </motion.div>
      </Box>
    </AuroraBackground>
  );
};

export default ForgotPasswordPage;
