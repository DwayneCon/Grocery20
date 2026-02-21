/* client/src/components/dashboard/StreakCounter.tsx */
import { Box, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface StreakCounterProps {
  streak: number;
  longestStreak?: number;
}

const StreakCounter = ({ streak, longestStreak = 0 }: StreakCounterProps) => {
  const { mode } = useTheme();

  const nextMilestone = Math.ceil(streak / 7) * 7;
  const daysToNextMilestone = nextMilestone - streak;
  const progressToNextMilestone = ((streak % 7) / 7) * 100;

  return (
    <Box
      sx={{
        p: 4,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        background:
          mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.02) 100%)',
        border:
          mode === 'dark'
            ? '1px solid rgba(255, 107, 53, 0.2)'
            : '1px solid rgba(255, 107, 53, 0.15)',
        boxShadow:
          mode === 'dark'
            ? '0 8px 32px rgba(255, 107, 53, 0.1)'
            : '0 8px 32px rgba(255, 107, 53, 0.08)',
      }}
    >
      {/* Background flame pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `radial-gradient(circle at 20% 50%, var(--chef-orange) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, var(--chef-orange) 0%, transparent 50%)`,
          backgroundSize: 'cover',
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Typography variant="h1" sx={{ fontSize: '5rem', mb: 1, lineHeight: 1 }}>
            🔥
          </Typography>
        </motion.div>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: mode === 'dark' ? 'var(--pure-white)' : 'var(--chef-orange)',
            mb: 0.5,
            fontFamily: 'var(--font-heading)',
          }}
        >
          {streak} Day Streak!
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            fontFamily: 'var(--font-body)',
            mb: 3,
          }}
        >
          {streak < 7
            ? `${7 - streak} day${7 - streak === 1 ? '' : 's'} to weekly warrior!`
            : streak >= longestStreak
            ? "You're on fire! New personal record! 🎉"
            : "You're on fire! Keep it up!"}
        </Typography>

        {/* Progress to next milestone */}
        <Box sx={{ mt: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progressToNextMilestone}
            sx={{
              height: 8,
              borderRadius: 'var(--radius-full)',
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,107,53,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'var(--chef-orange)',
                borderRadius: 'var(--radius-full)',
                background:
                  mode === 'dark'
                    ? 'linear-gradient(90deg, var(--chef-orange) 0%, #FFB84D 100%)'
                    : 'linear-gradient(90deg, var(--chef-orange) 0%, #FF8C5A 100%)',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              mt: 1,
              display: 'block',
              fontFamily: 'var(--font-body)',
            }}
          >
            Next reward: {daysToNextMilestone === 0 ? 'Achievement unlocked!' : `${daysToNextMilestone} day${daysToNextMilestone === 1 ? '' : 's'}`}
          </Typography>
        </Box>

        {/* Personal best indicator */}
        {longestStreak > 0 && streak !== longestStreak && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop:
                mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.1)'
                  : '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Personal Best: {longestStreak} days
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StreakCounter;
