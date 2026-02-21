/* client/src/pages/auth/ResetPasswordPage.tsx */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import { LockReset, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import AuroraBackground from '../../components/common/AuroraBackground';
import GlassCard from '../../components/common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { sanitizeInput } from '../../utils/sanitize';
import { logger } from '../../utils/logger';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mode } = useTheme();

  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    const sanitizedPassword = sanitizeInput(newPassword);
    const sanitizedConfirm = sanitizeInput(confirmPassword);

    if (!sanitizedPassword || !sanitizedConfirm) {
      setError('Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(sanitizedPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (sanitizedPassword !== sanitizedConfirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(token, sanitizedPassword);

      if (response.success || response.message) {
        setSuccess(true);
        logger.info('Password reset successful');

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      logger.error('Reset password error', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reset password';
      setError(errorMessage);
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
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {success ? (
                <CheckCircle
                  sx={{
                    fontSize: 48,
                    color: 'var(--basil-green)',
                    mb: 2,
                  }}
                />
              ) : (
                <LockReset
                  sx={{
                    fontSize: 48,
                    color: 'var(--chef-orange)',
                    mb: 2,
                  }}
                />
              )}
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
                {success ? 'Password Reset!' : 'Reset Password'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                }}
              >
                {success
                  ? 'Your password has been successfully reset.'
                  : 'Enter your new password below.'}
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
                Password successfully reset! Redirecting to login...
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
            {!success && token && (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{
                            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
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

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{
                            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                          }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
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

                {/* Password Requirements */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    Password must contain:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                      display: 'block',
                    }}
                  >
                    • At least 8 characters<br />
                    • One uppercase letter<br />
                    • One lowercase letter<br />
                    • One number
                  </Typography>
                </Box>

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
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}

            {/* Manual Login Button if token invalid */}
            {!success && !token && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => navigate('/forgot-password')}
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
                Request New Reset Link
              </Button>
            )}
          </GlassCard>
        </motion.div>
      </Box>
    </AuroraBackground>
  );
};

export default ResetPasswordPage;
