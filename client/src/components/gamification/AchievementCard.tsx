/* client/src/components/gamification/AchievementCard.tsx */
import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Lock, EmojiEvents } from '@mui/icons-material';
import GlassCard from '../common/GlassCard';
import { Achievement } from '../../services/achievementService';
import { useTheme } from '../../contexts/ThemeContext';

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
}

const tierColors = {
  bronze: {
    gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
    glow: 'rgba(205, 127, 50, 0.3)',
  },
  silver: {
    gradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
    glow: 'rgba(192, 192, 192, 0.3)',
  },
  gold: {
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    glow: 'rgba(255, 215, 0, 0.3)',
  },
  platinum: {
    gradient: 'linear-gradient(135deg, #E5E4E2 0%, #B9F2FF 100%)',
    glow: 'rgba(185, 242, 255, 0.3)',
  },
};

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, index }) => {
  const { mode } = useTheme();
  const tierStyle = tierColors[achievement.tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      style={{ height: '100%' }}
    >
      <GlassCard
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: achievement.unlocked
            ? `2px solid ${tierStyle.gradient}`
            : '2px solid var(--border)',
          boxShadow: achievement.unlocked
            ? `0 0 20px ${tierStyle.glow}`
            : 'none',
          filter: achievement.unlocked ? 'none' : 'grayscale(60%)',
          opacity: achievement.unlocked ? 1 : 0.7,
        }}
      >
        {/* Tier Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
          }}
        >
          <Chip
            label={achievement.tier.toUpperCase()}
            size="small"
            sx={{
              background: tierStyle.gradient,
              color: '#000',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.5px',
            }}
          />
        </Box>

        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 3,
            position: 'relative',
          }}
        >
          <motion.div
            animate={
              achievement.unlocked
                ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <Box
              sx={{
                fontSize: '4rem',
                filter: achievement.unlocked
                  ? `drop-shadow(0 0 10px ${tierStyle.glow})`
                  : 'grayscale(100%)',
                position: 'relative',
              }}
            >
              {achievement.unlocked ? (
                achievement.icon
              ) : (
                <Lock sx={{ fontSize: '4rem', color: 'var(--text-tertiary)' }} />
              )}
            </Box>
          </motion.div>

          {/* Trophy overlay for unlocked achievements */}
          {achievement.unlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.3, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: -1,
              }}
            >
              <EmojiEvents sx={{ fontSize: '8rem', color: tierStyle.glow }} />
            </motion.div>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ px: 2, pb: 2, flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
              textAlign: 'center',
              color: 'var(--text-primary)',
            }}
          >
            {achievement.name}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'var(--text-secondary)',
              textAlign: 'center',
              mb: 2,
              minHeight: '3em',
            }}
          >
            {achievement.description}
          </Typography>

          {/* Progress Bar */}
          {!achievement.unlocked && (
            <Box sx={{ mt: 'auto' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: 'var(--text-tertiary)' }}>
                  Progress
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: 'var(--text-secondary)' }}
                >
                  {achievement.progress} / {achievement.requirement_value}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={achievement.progressPercentage}
                sx={{
                  height: 8,
                  borderRadius: 'var(--radius-sm)',
                  bgcolor: 'var(--surface-light)',
                  '& .MuiLinearProgress-bar': {
                    background: tierStyle.gradient,
                    borderRadius: 'var(--radius-sm)',
                  },
                }}
              />
            </Box>
          )}

          {/* Points Display */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 0.5,
              mt: 2,
              py: 1,
              px: 2,
              borderRadius: 'var(--radius-md)',
              bgcolor: achievement.unlocked ? tierStyle.glow : 'var(--surface)',
              border: `1px solid ${achievement.unlocked ? tierStyle.gradient : 'var(--border)'}`,
            }}
          >
            <EmojiEvents
              sx={{
                fontSize: '1.2rem',
                color: achievement.unlocked ? '#FFD700' : 'var(--text-tertiary)',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: achievement.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {achievement.points} pts
            </Typography>
          </Box>

          {/* Unlocked Date */}
          {achievement.unlocked && achievement.unlockedAt && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                mt: 1,
                fontStyle: 'italic',
              }}
            >
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </GlassCard>
    </motion.div>
  );
};

export default AchievementCard;
