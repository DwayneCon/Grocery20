import { Box, Typography, Button, Grid, useTheme as useMuiTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Restaurant, ShoppingCart, AutoAwesome, Bolt } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { useTheme } from '../contexts/ThemeContext';

const HomePage = () => {
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const { mode } = useTheme();

  const features = [
    {
      icon: <AutoAwesome sx={{ fontSize: 48, color: '#FF6B6B' }} />,
      title: 'AI Chef',
      description: 'Conversational meal planning that understands your cravings and budget.',
    },
    {
      icon: <Restaurant sx={{ fontSize: 48, color: '#4ECDC4' }} />,
      title: 'Smart Menu',
      description: 'Weekly plans balanced for nutrition, taste, and household dislikes.',
    },
    {
      icon: <ShoppingCart sx={{ fontSize: 48, color: '#FFE66D' }} />,
      title: 'Auto List',
      description: 'Instant grocery lists organized by store aisle. Never miss an item.',
    },
  ];

  // Theme-aware aurora colors - Vibrant 5-color gradient
  const auroraColors = mode === 'dark'
    ? ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
    : ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: mode === 'dark' ? '#0A0E27' : '#F5F5F5', width: '100%', overflow: 'hidden' }}>

      {/* Hero Section */}
      <AuroraBackground speed={12} colors={auroraColors}>
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
          width: '100%',
          px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }
        }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{
              textAlign: 'center',
              width: '100%',
              maxWidth: { xs: '100%', sm: '100%', md: '90%', lg: '80%', xl: '1600px' }
            }}
          >
            <GlassCard intensity="light" sx={{ display: 'inline-block', px: 3, py: 1, mb: 3, borderRadius: 50 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Bolt sx={{ color: '#FFE66D' }} />
                <Typography variant="subtitle2" sx={{
                  color: mode === 'dark' ? 'white' : '#000000',
                  fontWeight: 'bold'
                }}>
                  Grocery Planning Reimagined
                </Typography>
              </Box>
            </GlassCard>

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 900,
                color: mode === 'dark' ? 'white' : '#000000',
                mb: 2,
                fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem', lg: '5rem', xl: '6rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.02em'
              }}
            >
              Your Personal <br />
              <span style={{
                background: 'linear-gradient(135deg, #FF6B6B, #FFE66D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AI KitchenOS
              </span>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mb: 6,
                color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                maxWidth: { xs: '100%', md: '80%', lg: '700px' },
                mx: 'auto',
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                px: { xs: 2, sm: 0 }
              }}
            >
              Stop worrying about "What's for dinner?" Let AI handle the planning, budgeting, and shopping lists for your entire household.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', px: { xs: 2, sm: 0 } }}>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="contained"
                size="large"
                sx={{
                  bgcolor: mode === 'dark' ? 'white' : '#4ECDC4',
                  color: mode === 'dark' ? 'black' : 'white',
                  px: { xs: 3, sm: 5 },
                  py: 2,
                  borderRadius: 4,
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  fontWeight: 'bold',
                  boxShadow: mode === 'dark'
                    ? '0 0 30px rgba(255,255,255,0.3)'
                    : '0 0 30px rgba(78, 205, 196, 0.3)',
                  '&:hover': {
                    bgcolor: mode === 'dark' ? '#f0f0f0' : '#3BA59E',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => navigate('/register')}
              >
                Get Started Free
              </Button>
            </Box>
          </Box>
        </Box>
      </AuroraBackground>

      {/* Features Grid */}
      <Box sx={{
        py: { xs: 6, md: 10, lg: 12 },
        mt: { xs: -4, md: -8 },
        position: 'relative',
        zIndex: 3,
        width: '100%',
        bgcolor: mode === 'dark' ? '#0A0E27' : '#F5F5F5',
        px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }
      }}>
        <Grid
          container
          spacing={{ xs: 3, md: 4, lg: 6 }}
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: '100%', md: '95%', lg: '90%', xl: '1600px' },
            mx: 'auto'
          }}
        >
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <GlassCard
                hover
                intensity="ultra"
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: { xs: 3, sm: 4, md: 5 },
                }}
              >
                <Box
                  component={motion.div}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  sx={{ mb: 3, display: 'inline-block' }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h4"
                  gutterBottom
                  fontWeight="900"
                  sx={{
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                      : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    lineHeight: 1.7,
                    fontSize: { xs: '0.95rem', sm: '1rem' }
                  }}
                >
                  {feature.description}
                </Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA Section */}
      <Box sx={{
        textAlign: 'center',
        py: { xs: 6, md: 10 },
        px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
        bgcolor: mode === 'dark' ? '#1A1F3A' : '#FFFFFF',
        width: '100%'
      }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
          sx={{
            color: '#000000',
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem', lg: '3rem' }
          }}
        >
          Ready to Transform Your Kitchen?
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(0,0,0,0.6)',
            mb: 4,
            maxWidth: { xs: '100%', md: '80%', lg: '600px' },
            mx: 'auto',
            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
          }}
        >
          Join thousands of families who have simplified their meal planning with AI.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            sx={{
              px: { xs: 3, sm: 5 },
              py: 2,
              borderRadius: 4,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 15px 40px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => navigate('/register')}
          >
            Start Planning Today
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{
              px: { xs: 3, sm: 5 },
              py: 2,
              borderRadius: 4,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 'bold',
              borderWidth: 2,
              color: '#000000',
              borderColor: '#4ECDC4',
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                bgcolor: mode === 'dark' ? 'rgba(78, 205, 196, 0.05)' : 'rgba(78, 205, 196, 0.08)'
              }
            }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{
        bgcolor: mode === 'dark' ? '#212121' : '#F5F5F5',
        color: mode === 'dark' ? 'white' : '#000000',
        py: { xs: 4, md: 6 },
        width: '100%',
        px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }
      }}>
        <Box sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '100%', md: '95%', lg: '90%', xl: '1600px' },
          mx: 'auto'
        }}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
              >
                Grocery20
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? '#BDBDBD' : '#757575',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                AI-powered meal planning and grocery management for modern families.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
              >
                Product
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? '#BDBDBD' : '#757575',
                    cursor: 'pointer',
                    '&:hover': { color: mode === 'dark' ? 'white' : '#000000' }
                  }}
                >
                  Features
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? '#BDBDBD' : '#757575',
                    cursor: 'pointer',
                    '&:hover': { color: mode === 'dark' ? 'white' : '#000000' }
                  }}
                >
                  Pricing
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? '#BDBDBD' : '#757575',
                    cursor: 'pointer',
                    '&:hover': { color: mode === 'dark' ? 'white' : '#000000' }
                  }}
                >
                  API
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
              >
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? '#BDBDBD' : '#757575',
                    cursor: 'pointer',
                    '&:hover': { color: mode === 'dark' ? 'white' : '#000000' }
                  }}
                >
                  About
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? '#BDBDBD' : '#757575',
                    cursor: 'pointer',
                    '&:hover': { color: mode === 'dark' ? 'white' : '#000000' }
                  }}
                >
                  Blog
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? '#BDBDBD' : '#757575',
                    cursor: 'pointer',
                    '&:hover': { color: mode === 'dark' ? 'white' : '#000000' }
                  }}
                >
                  Contact
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{
            borderTop: '1px solid',
            borderColor: mode === 'dark' ? '#424242' : '#E0E0E0',
            mt: { xs: 4, md: 6 },
            pt: { xs: 3, md: 4 },
            textAlign: 'center'
          }}>
            <Typography
              variant="body2"
              sx={{
                color: mode === 'dark' ? '#9E9E9E' : '#757575',
                fontSize: { xs: '0.8rem', md: '0.875rem' }
              }}
            >
              © 2025 Grocery20. All rights reserved. Built with AI and love.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
