import { Box, Typography, Button } from '@mui/material';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const FOOD_EMOJIS = [
  { emoji: '\uD83E\uDD51', label: 'avocado' },
  { emoji: '\uD83C\uDF55', label: 'pizza' },
  { emoji: '\uD83E\uDD58', label: 'stew' },
  { emoji: '\uD83C\uDF73', label: 'egg' },
  { emoji: '\uD83E\uDD57', label: 'salad' },
  { emoji: '\uD83C\uDF4E', label: 'apple' },
  { emoji: '\uD83E\uDD66', label: 'broccoli' },
  { emoji: '\uD83C\uDF4B', label: 'lemon' },
  { emoji: '\uD83E\uDDC0', label: 'cheese' },
  { emoji: '\uD83C\uDF53', label: 'strawberry' },
  { emoji: '\uD83E\uDD5A', label: 'egg-shell' },
  { emoji: '\uD83C\uDF3D', label: 'corn' },
];

const SUBTITLE_WORDS = [
  'Let', 'Nora', 'plan', 'your', 'meals,', 'optimize', 'your',
  'budget,', 'and', 'simplify', 'your', 'grocery', 'shopping',
];

const SMOOTH_EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

interface FloatingParticleProps {
  emoji: string;
  delay: number;
  x: number;
  duration: number;
  size: number;
}

const FloatingParticle = ({ emoji, delay, x, duration, size }: FloatingParticleProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <span
        role="presentation"
        style={{
          position: 'absolute',
          bottom: '20%',
          left: `${x}%`,
          fontSize: `${size}rem`,
          opacity: 0.15,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {emoji}
      </span>
    );
  }

  return (
    <motion.span
      role="presentation"
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: [0, -600, -1200],
        opacity: [0, 0.25, 0],
        x: [0, Math.random() > 0.5 ? 30 : -30, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
      style={{
        position: 'absolute',
        bottom: '-5%',
        left: `${x}%`,
        fontSize: `${size}rem`,
        pointerEvents: 'none',
        userSelect: 'none',
        willChange: 'transform, opacity',
      }}
    >
      {emoji}
    </motion.span>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const particles = useMemo(() =>
    FOOD_EMOJIS.map((item, i) => ({
      ...item,
      delay: i * 1.8 + Math.random() * 2,
      x: 5 + (i * 8) + Math.random() * 4,
      duration: 8 + Math.random() * 6,
      size: 1.5 + Math.random() * 1.5,
    })),
    []
  );

  const headlineVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: SMOOTH_EASE,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.8 + i * 0.06,
        duration: 0.4,
        ease: SMOOTH_EASE,
      },
    }),
  };

  return (
    <Box
      component="section"
      aria-label="Hero"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#0a0f1e',
      }}
    >
      {/* Animated Aurora Gradient Background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(102, 126, 234, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 60%, rgba(249, 115, 22, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 70% 40% at 50% 80%, rgba(118, 75, 162, 0.25) 0%, transparent 55%)
          `,
          backgroundSize: '200% 200%',
          animation: prefersReducedMotion ? 'none' : 'auroraShift 15s ease infinite',
          '@keyframes auroraShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '33%': { backgroundPosition: '100% 0%' },
            '66%': { backgroundPosition: '50% 100%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }}
      />

      {/* Floating Food Particles */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {particles.map((p, i) => (
          <FloatingParticle
            key={i}
            emoji={p.emoji}
            delay={p.delay}
            x={p.x}
            duration={p.duration}
            size={p.size}
          />
        ))}
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          px: { xs: 3, sm: 4, md: 6 },
          maxWidth: '900px',
          width: '100%',
        }}
      >
        {/* Headline */}
        <motion.div
          variants={prefersReducedMotion ? undefined : headlineVariants}
          initial="hidden"
          animate="visible"
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5.5rem' },
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              mb: 3,
            }}
          >
            Your AI{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #f97316 0%, #FFD93D 50%, #f97316 100%)',
                backgroundSize: '200% 200%',
                animation: prefersReducedMotion ? 'none' : 'gradientText 4s ease infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                '@keyframes gradientText': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' },
                },
              }}
            >
              Kitchen Assistant
            </Box>
          </Typography>
        </motion.div>

        {/* Subtitle with staggered word fade-in */}
        <Typography
          variant="h5"
          component="p"
          sx={{
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.35rem' },
            lineHeight: 1.7,
            maxWidth: '700px',
            mx: 'auto',
            mb: 5,
            fontWeight: 400,
          }}
        >
          {SUBTITLE_WORDS.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              custom={i}
              variants={prefersReducedMotion ? undefined : wordVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'inline-block', marginRight: '0.35em' }}
            >
              {word}
            </motion.span>
          ))}
        </Typography>

        {/* CTA Button */}
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        >
          <Button
            component={motion.button}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              background: 'linear-gradient(135deg, #f97316 0%, #FF8C5A 100%)',
              color: '#ffffff',
              px: { xs: 5, sm: 6 },
              py: { xs: 1.5, sm: 2 },
              borderRadius: '60px',
              fontSize: { xs: '1.05rem', sm: '1.2rem' },
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 0 30px rgba(249, 115, 22, 0.4)',
              position: 'relative',
              overflow: 'visible',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: '-3px',
                borderRadius: '64px',
                background: 'linear-gradient(135deg, #f97316, #FFD93D, #f97316)',
                backgroundSize: '200% 200%',
                animation: prefersReducedMotion ? 'none' : 'glowPulse 3s ease infinite',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                zIndex: -1,
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #FF8C5A 0%, #f97316 100%)',
                boxShadow: '0 0 50px rgba(249, 115, 22, 0.6)',
                '&::before': {
                  opacity: 1,
                },
              },
              '@keyframes glowPulse': {
                '0%': { backgroundPosition: '0% 50%', opacity: 0.5 },
                '50%': { backgroundPosition: '100% 50%', opacity: 0.8 },
                '100%': { backgroundPosition: '0% 50%', opacity: 0.5 },
              },
            }}
          >
            Start Planning
          </Button>
        </motion.div>
      </Box>

      {/* Scroll Indicator */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Scroll
        </Typography>
        <motion.div
          animate={prefersReducedMotion ? undefined : {
            y: [0, 8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <KeyboardArrowDownIcon
            sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 28 }}
          />
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default HeroSection;
