/* client/src/components/dashboard/WeeklySummary.tsx */
import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, LinearProgress, Chip, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EmojiEvents,
  Restaurant,
  AttachMoney,
  FavoriteBorder,
  Close,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import GlassCard from '../common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { streakService, StreakData } from '../../services/streakService';
import { triggerCelebration } from '../../utils/celebrations';
import { logger } from '../../utils/logger';

interface WeeklySummaryProps {
  open: boolean;
  onClose: () => void;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ open, onClose }) => {
  const { mode } = useTheme();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadWeeklySummary();
      // Trigger celebration when summary opens
      setTimeout(() => triggerCelebration('success'), 500);
    }
  }, [open]);

  const loadWeeklySummary = async () => {
    try {
      setLoading(true);
      const data = await streakService.getStreakData();
      setStreakData(data);
    } catch (error) {
      logger.error('Failed to load weekly summary', error instanceof Error ? error : undefined);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !streakData) return null;

  const stats = streakData.stats;
  const mealsPerWeek = 21; // 3 meals × 7 days
  const mealsPlannedPercent = Math.min(100, (stats.mealsPlannedCount / mealsPerWeek) * 100);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              zIndex: 9998,
            }}
          />

          {/* Summary Card */}
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              <GlassCard
                sx={{
                  p: 4,
                  position: 'relative',
                  background:
                    mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(50,50,50,0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.95) 100%)',
                }}
              >
                {/* Close Button */}
                <Button
                  onClick={onClose}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    minWidth: 'auto',
                    p: 1,
                  }}
                >
                  <Close />
                </Button>

                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: 2,
                    }}
                  >
                    <EmojiEvents
                      sx={{
                        fontSize: '4rem',
                        color: '#FFD700',
                        filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))',
                        mb: 2,
                      }}
                    />
                  </motion.div>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Weekly Summary
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    Here's how you did this week!
                  </Typography>
                </Box>

                {/* Stats Grid */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {/* Meals Planned */}
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                      }}
                    >
                      <Restaurant sx={{ fontSize: '2rem', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stats.mealsPlannedCount}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Meals Planned
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Current Streak */}
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: '#fff',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Typography sx={{ fontSize: '2rem' }}>🔥</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {streakData.currentStreak}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Day Streak
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Budget Weeks */}
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: '#fff',
                      }}
                    >
                      <AttachMoney sx={{ fontSize: '2rem', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stats.weeksUnderBudget}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Weeks Under Budget
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Nutrition Goals */}
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: '#fff',
                      }}
                    >
                      <FavoriteBorder sx={{ fontSize: '2rem', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stats.daysHitNutritionGoals}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Days Hit Goals
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Progress Bar */}
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Weekly Planning Progress
                    </Typography>
                    <Chip
                      label={`${Math.round(mealsPlannedPercent)}%`}
                      size="small"
                      sx={{
                        bgcolor: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={mealsPlannedPercent}
                    sx={{
                      height: 12,
                      borderRadius: 'var(--radius-full)',
                      bgcolor: 'var(--surface)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
                        borderRadius: 'var(--radius-full)',
                      },
                    }}
                  />
                </Box>

                {/* Achievements */}
                {streakData.unlockedAchievements.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <CheckCircle sx={{ color: 'var(--success)' }} />
                      New Achievements
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {streakData.unlockedAchievements.slice(0, 5).map((achievement, index) => (
                        <Chip
                          key={index}
                          label={achievement}
                          sx={{
                            bgcolor: 'var(--primary)',
                            color: '#fff',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Keep Going Message */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 'var(--radius-lg)',
                    bgcolor: 'var(--surface)',
                    textAlign: 'center',
                  }}
                >
                  <TrendingUp
                    sx={{
                      fontSize: '2.5rem',
                      color: 'var(--success)',
                      mb: 1,
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    You're doing great!
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    Keep planning meals to maintain your streak and unlock more achievements.
                  </Typography>
                </Box>

                {/* Action Button */}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onClose}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    '&:hover': {
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                      opacity: 0.9,
                    },
                  }}
                >
                  Continue Planning
                </Button>
              </GlassCard>
            </motion.div>
          </Box>
        </>
      )}
    </AnimatePresence>
  );
};

export default WeeklySummary;
