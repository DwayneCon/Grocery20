import { Box, Container, Typography, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Restaurant, ShoppingCart, AutoAwesome, Bolt } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';

const HomePage = () => {
  const navigate = useNavigate();

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* Hero Section */}
      <AuroraBackground speed={12} colors={['#2D3436', '#000000', '#636E72']}>
        <Container maxWidth="lg" sx={{ pt: 20, pb: 12, position: 'relative', zIndex: 2 }}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{ textAlign: 'center' }}
          >
            <GlassCard intensity="light" sx={{ display: 'inline-block', px: 3, py: 1, mb: 3, borderRadius: 50 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Bolt sx={{ color: '#FFE66D' }} />
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Grocery Planning Reimagined
                </Typography>
              </Box>
            </GlassCard>

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 900,
                color: 'white',
                mb: 2,
                fontSize: { xs: '3rem', md: '5rem' },
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

            <Typography variant="h5" sx={{ mb: 6, color: 'rgba(255,255,255,0.7)', maxWidth: '700px', mx: 'auto' }}>
              Stop worrying about "What's for dinner?" Let AI handle the planning, budgeting, and shopping lists for your entire household.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'black',
                  px: 5,
                  py: 2,
                  borderRadius: 4,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  boxShadow: '0 0 30px rgba(255,255,255,0.3)',
                  '&:hover': { bgcolor: '#f0f0f0' }
                }}
                onClick={() => navigate('/register')}
              >
                Get Started Free
              </Button>
            </Box>
          </Box>
        </Container>
      </AuroraBackground>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: 12, mt: -10, position: 'relative', zIndex: 3 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <GlassCard
                hover
                intensity="strong"
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 5,
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.5)'
                }}
              >
                <Box
                  component={motion.div}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  sx={{ mb: 3, display: 'inline-block' }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="text.primary">
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {feature.description}
                </Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Ready to Transform Your Kitchen?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
            Join thousands of families who have simplified their meal planning with AI.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 5,
                py: 2,
                borderRadius: 4,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 15px 40px rgba(102, 126, 234, 0.4)'
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
                px: 5,
                py: 2,
                borderRadius: 4,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }
              }}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Grocery20
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.400' }}>
                AI-powered meal planning and grocery management for modern families.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Product
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'grey.400', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Features
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Pricing
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  API
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'grey.400', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  About
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Blog
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Contact
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid', borderColor: 'grey.800', mt: 6, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              © 2025 Grocery20. All rights reserved. Built with AI and love.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
