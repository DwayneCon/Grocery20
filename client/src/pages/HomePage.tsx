import { Box, Typography, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import HeroSection from '../components/home/HeroSection';
import ParallaxSection from '../components/home/ParallaxSection';
import FeatureShowcase from '../components/home/FeatureShowcase';
import SocialProof from '../components/home/SocialProof';
import InteractiveDemo from '../components/home/InteractiveDemo';

const HomePage = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0f1e',
        width: '100%',
        overflow: 'hidden',
        scrollBehavior: 'smooth',
      }}
    >
      {/* 1. Full-Viewport Hero */}
      <HeroSection />

      {/* 2. Feature Showcase with Parallax */}
      <ParallaxSection direction="left">
        <FeatureShowcase />
      </ParallaxSection>

      {/* 3. Interactive Demo */}
      <ParallaxSection direction="right">
        <Box sx={{ bgcolor: '#0a0f1e', width: '100%' }}>
          <InteractiveDemo />
        </Box>
      </ParallaxSection>

      {/* 4. Social Proof Counters with Parallax */}
      <ParallaxSection direction="left">
        <SocialProof />
      </ParallaxSection>

      {/* 5. CTA Section */}
      <Box
        component="section"
        aria-label="Call to action"
        sx={{
          textAlign: 'center',
          py: { xs: 8, md: 12 },
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          position: 'relative',
          background: 'linear-gradient(180deg, #0a0f1e 0%, #111827 50%, #0a0f1e 100%)',
        }}
      >
        {/* Subtle glow behind the heading */}
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '400px',
            height: '200px',
            background: 'radial-gradient(ellipse, rgba(249, 115, 22, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 30 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
              color: '#ffffff',
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            Ready to Transform Your Kitchen?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.55)',
              mb: 5,
              maxWidth: '600px',
              mx: 'auto',
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
              fontWeight: 400,
            }}
          >
            Join thousands of families who have simplified their meal planning with AI.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              component={motion.button}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                px: { xs: 4, sm: 5 },
                py: 2,
                borderRadius: '60px',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #f97316 0%, #FF8C5A 100%)',
                color: '#ffffff',
                boxShadow: '0 0 30px rgba(249, 115, 22, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF8C5A 0%, #f97316 100%)',
                  boxShadow: '0 0 50px rgba(249, 115, 22, 0.5)',
                },
              }}
            >
              Start Planning Today
            </Button>

            <Button
              component={motion.button}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                px: { xs: 4, sm: 5 },
                py: 2,
                borderRadius: '60px',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 700,
                textTransform: 'none',
                borderWidth: 2,
                color: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  borderWidth: 2,
                  borderColor: 'rgba(249, 115, 22, 0.5)',
                  bgcolor: 'rgba(249, 115, 22, 0.08)',
                },
              }}
            >
              Sign In
            </Button>
          </Box>
        </motion.div>
      </Box>

      {/* 6. Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#070b14',
          color: '#ffffff',
          py: { xs: 5, md: 7 },
          width: '100%',
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Box
          sx={{
            maxWidth: '1200px',
            mx: 'auto',
          }}
        >
          <Grid container spacing={{ xs: 4, md: 5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={800}
                gutterBottom
                sx={{
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  background: 'linear-gradient(135deg, #f97316 0%, #FFD93D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Grocery20
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.45)',
                  lineHeight: 1.7,
                }}
              >
                AI-powered meal planning and grocery management for modern families.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography
                variant="h6"
                component="h2"
                fontWeight={700}
                gutterBottom
                sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, color: '#ffffff' }}
              >
                Product
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {['Features', 'Pricing', 'API'].map((item) => (
                  <Typography
                    key={item}
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.45)',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      '&:hover': { color: '#f97316' },
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography
                variant="h6"
                component="h2"
                fontWeight={700}
                gutterBottom
                sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, color: '#ffffff' }}
              >
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {['About', 'Blog', 'Contact'].map((item) => (
                  <Typography
                    key={item}
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.45)',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      '&:hover': { color: '#f97316' },
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              mt: { xs: 4, md: 6 },
              pt: { xs: 3, md: 4 },
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: { xs: '0.8rem', md: '0.85rem' },
              }}
            >
              &copy; 2025 Grocery20. All rights reserved. Built with AI and love.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
