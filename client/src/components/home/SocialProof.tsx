import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface StatItem {
  end: number;
  suffix: string;
  label: string;
  prefix?: string;
}

const STATS: StatItem[] = [
  { end: 10000, suffix: '+', label: 'Meals Planned' },
  { end: 50, suffix: 'K+', prefix: '$', label: 'Saved by Families' },
  { end: 500, suffix: '+', label: 'Happy Families' },
];

const SMOOTH_EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: SMOOTH_EASE,
    },
  },
};

const SocialProof = () => {
  const prefersReducedMotion = useReducedMotion();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <Box
      component="section"
      aria-label="Statistics"
      sx={{
        py: { xs: 8, md: 12 },
        px: { xs: 2, sm: 3, md: 4, lg: 6 },
      }}
    >
      {/* Section Heading */}
      <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
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
          Trusted by Families
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: { xs: '1rem', md: '1.15rem' },
            maxWidth: '500px',
            mx: 'auto',
          }}
        >
          Join thousands who have simplified their grocery routine.
        </Typography>
      </Box>

      {/* Stats Row */}
      <div ref={ref}>
        <motion.div
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 48,
            maxWidth: 900,
            margin: '0 auto',
            flexWrap: 'wrap',
          }}
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={prefersReducedMotion ? undefined : itemVariants}
              style={{
                textAlign: 'center',
                flex: '1 1 180px',
                minWidth: 160,
              }}
            >
              {/* Animated Counter */}
              <Typography
                variant="h2"
                component="div"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.8rem', sm: '3rem', md: '3.5rem' },
                  lineHeight: 1,
                  mb: 1,
                  color: '#f97316',
                  textShadow: '0 0 40px rgba(249, 115, 22, 0.35)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {inView ? (
                  <CountUp
                    start={0}
                    end={stat.end}
                    duration={2.5}
                    separator=","
                    prefix={stat.prefix || ''}
                    suffix={stat.suffix}
                    useEasing
                  />
                ) : (
                  <span>{stat.prefix || ''}0{stat.suffix}</span>
                )}
              </Typography>

              {/* Label */}
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.55)',
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {stat.label}
              </Typography>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Box>
  );
};

export default SocialProof;
