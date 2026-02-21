/* client/src/components/gamification/XPProgress.tsx */
import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface XPProgressProps {
  totalXP: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
  level: number;
  title: string;
  nextLevel: { level: number; title: string; xpRequired: number; icon: string } | null;
  /** Recently gained XP amount to trigger the float animation */
  recentXPGain?: number;
}

const levelColors: Record<number, string> = {
  1: '#8D6E63',
  2: '#42A5F5',
  3: '#AB47BC',
  4: '#FFA726',
  5: '#FFD700',
  6: '#00E5FF',
};

const XPProgress: React.FC<XPProgressProps> = ({
  totalXP,
  xpIntoLevel,
  xpForNextLevel,
  progress,
  level,
  title,
  nextLevel,
  recentXPGain,
}) => {
  const { reducedMotion } = useTheme();
  const color = levelColors[level] || levelColors[1];

  // State for the floating "+XP" notification
  const [floatingXP, setFloatingXP] = useState<number | null>(null);
  const [floatKey, setFloatKey] = useState(0);

  useEffect(() => {
    if (recentXPGain && recentXPGain > 0) {
      setFloatingXP(recentXPGain);
      setFloatKey((prev) => prev + 1);

      const timer = setTimeout(() => setFloatingXP(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [recentXPGain]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: 'var(--text-primary)' }}
        >
          {totalXP} XP
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'var(--text-tertiary)' }}
        >
          {nextLevel
            ? `${xpIntoLevel} / ${xpForNextLevel} to Level ${nextLevel.level}`
            : 'MAX LEVEL'}
        </Typography>
      </Box>

      {/* Progress bar container */}
      <Box sx={{ position: 'relative' }}>
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={reducedMotion ? { duration: 0.01 } : { duration: 0.3 }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 12,
              borderRadius: 'var(--radius-sm)',
              bgcolor: 'var(--surface-light)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 'var(--radius-sm)',
                background: `linear-gradient(90deg, ${color} 0%, ${color}CC 50%, ${color} 100%)`,
                backgroundSize: '200% 100%',
                animation: reducedMotion ? 'none' : 'shimmer 2s linear infinite',
                transition: reducedMotion
                  ? 'transform 0.01s'
                  : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              '@keyframes shimmer': {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-200% 0' },
              },
            }}
          />
        </motion.div>

        {/* Floating "+XP" animation */}
        <AnimatePresence>
          {floatingXP !== null && !reducedMotion && (
            <motion.div
              key={floatKey}
              initial={{ opacity: 1, y: 0, x: '-50%' }}
              animate={{ opacity: 0, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: -8,
                left: `${Math.min(progress, 95)}%`,
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: color,
                  textShadow: `0 0 8px ${color}80`,
                  whiteSpace: 'nowrap',
                }}
              >
                +{floatingXP} XP
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Level title below the bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: color,
            letterSpacing: '0.3px',
          }}
        >
          {title}
        </Typography>
        {nextLevel && (
          <Typography
            variant="caption"
            sx={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}
          >
            Next: {nextLevel.title} {nextLevel.icon}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default XPProgress;
