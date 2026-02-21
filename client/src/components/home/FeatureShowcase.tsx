import { Box, Typography, Grid } from '@mui/material';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Feature {
  emoji: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    emoji: '\uD83E\uDD16',
    title: 'AI Meal Planning',
    description:
      'Nora learns your family\'s preferences and creates personalized weekly meal plans',
  },
  {
    emoji: '\uD83D\uDED2',
    title: 'Smart Shopping Lists',
    description:
      'Auto-generated, organized by store aisle, with real-time price tracking',
  },
  {
    emoji: '\uD83D\uDCB0',
    title: 'Budget Optimization',
    description:
      'Track spending, find deals, and save an average of $50/week on groceries',
  },
];

const SMOOTH_EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: SMOOTH_EASE,
    },
  }),
};

const FeatureShowcase = () => {
  const prefersReducedMotion = useReducedMotion();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Box
      component="section"
      aria-label="Features"
      sx={{
        py: { xs: 8, md: 12 },
        px: { xs: 2, sm: 3, md: 4, lg: 6 },
      }}
    >
      {/* Section Heading */}
      <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            color: '#ffffff',
            mb: 2,
            letterSpacing: '-0.02em',
          }}
        >
          Everything You Need
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: { xs: '1rem', md: '1.15rem' },
            maxWidth: '550px',
            mx: 'auto',
          }}
        >
          From meal planning to grocery checkout, Nora handles it all.
        </Typography>
      </Box>

      {/* Feature Cards Grid */}
      <Grid
        ref={ref}
        container
        spacing={{ xs: 3, md: 4 }}
        sx={{
          maxWidth: '1200px',
          mx: 'auto',
        }}
      >
        {FEATURES.map((feature, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
            <motion.div
              custom={index}
              variants={prefersReducedMotion ? undefined : cardVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              whileHover={prefersReducedMotion ? undefined : {
                y: -4,
                transition: { duration: 0.25 },
              }}
              style={{ height: '100%' }}
            >
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 3, sm: 4 },
                  borderRadius: 'var(--radius-xl)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                  cursor: 'default',
                  textAlign: 'center',
                  '&:hover': {
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    boxShadow: '0 0 30px rgba(249, 115, 22, 0.1)',
                    background: 'rgba(255, 255, 255, 0.06)',
                  },
                }}
              >
                {/* Emoji Icon */}
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : {
                    scale: 1.15,
                    rotate: 5,
                    transition: { duration: 0.25 },
                  }}
                  style={{
                    fontSize: '3.5rem',
                    marginBottom: 20,
                    lineHeight: 1,
                    display: 'inline-block',
                  }}
                  role="presentation"
                >
                  {feature.emoji}
                </motion.div>

                {/* Title */}
                <Typography
                  variant="h5"
                  component="h3"
                  sx={{
                    fontWeight: 700,
                    color: '#ffffff',
                    mb: 1.5,
                    fontSize: { xs: '1.25rem', md: '1.4rem' },
                  }}
                >
                  {feature.title}
                </Typography>

                {/* Description */}
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.55)',
                    lineHeight: 1.7,
                    fontSize: { xs: '0.9rem', md: '0.95rem' },
                  }}
                >
                  {feature.description}
                </Typography>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FeatureShowcase;
