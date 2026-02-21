/* client/src/components/gamification/AchievementNotification.tsx */
import React, { useEffect, useState } from 'react';
import { Box, Typography, Snackbar, IconButton } from '@mui/material';
import { Close, EmojiEvents } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import { RecentAchievement, achievementService } from '../../services/achievementService';
import confetti from 'canvas-confetti';
import { logger } from '../../utils/logger';

const tierColors = {
  bronze: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
  silver: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
  gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  platinum: 'linear-gradient(135deg, #E5E4E2 0%, #B9F2FF 100%)',
};

const AchievementNotification: React.FC = () => {
  const [achievements, setAchievements] = useState<RecentAchievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<RecentAchievement | null>(null);

  useEffect(() => {
    // Check for new achievements when component mounts
    checkForNewAchievements();

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkForNewAchievements, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show next achievement from queue
    if (achievements.length > 0 && !currentAchievement) {
      const next = achievements[0];
      setCurrentAchievement(next);
      setAchievements((prev) => prev.slice(1));

      // Trigger confetti
      triggerConfetti();
    }
  }, [achievements, currentAchievement]);

  const checkForNewAchievements = async () => {
    try {
      const recent = await achievementService.getRecentAchievements();
      if (recent.length > 0) {
        setAchievements((prev) => [...prev, ...recent]);
      }
    } catch (error) {
      logger.error('Failed to check for new achievements', error instanceof Error ? error : undefined);
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleClose = async () => {
    if (currentAchievement) {
      // Mark as notified
      await achievementService.markAchievementNotified(currentAchievement.id);
      setCurrentAchievement(null);
    }
  };

  return (
    <Snackbar
      open={!!currentAchievement}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={handleClose}
      autoHideDuration={8000}
      sx={{ zIndex: 9999 }}
    >
      <Box>
        <AnimatePresence>
          {currentAchievement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
            >
              <GlassCard
                sx={{
                  position: 'relative',
                  minWidth: '350px',
                  maxWidth: '500px',
                  background: tierColors[currentAchievement.tier as keyof typeof tierColors],
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Sparkle Animation Background */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Close Button */}
                <IconButton
                  size="small"
                  onClick={handleClose}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: '#fff',
                    zIndex: 2,
                  }}
                >
                  <Close />
                </IconButton>

                {/* Content */}
                <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Icon */}
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: '4rem',
                          filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))',
                        }}
                      >
                        {currentAchievement.icon}
                      </Box>
                    </motion.div>

                    {/* Text */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="overline"
                        sx={{
                          color: '#fff',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <EmojiEvents sx={{ fontSize: '1.2rem' }} />
                        Achievement Unlocked!
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{
                          color: '#fff',
                          fontWeight: 700,
                          mb: 0.5,
                        }}
                      >
                        {currentAchievement.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.9)',
                          mb: 1,
                        }}
                      >
                        {currentAchievement.description}
                      </Typography>

                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 'var(--radius-full)',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <EmojiEvents sx={{ fontSize: '1rem', color: '#FFD700' }} />
                        <Typography
                          variant="body2"
                          sx={{ color: '#fff', fontWeight: 700 }}
                        >
                          +{currentAchievement.points} pts
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Shine Effect */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '50%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    pointerEvents: 'none',
                  }}
                />
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Snackbar>
  );
};

export default AchievementNotification;
