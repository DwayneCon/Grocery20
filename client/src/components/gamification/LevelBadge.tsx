/* client/src/components/gamification/LevelBadge.tsx */
import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface LevelBadgeProps {
  level: number;
  title: string;
  icon: string;
  totalXP: number;
  /** When true, plays a celebratory pulse animation for leveling up */
  levelUp?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

const levelColors: Record<number, string> = {
  1: '#8D6E63',   // brown
  2: '#42A5F5',   // blue
  3: '#AB47BC',   // purple
  4: '#FFA726',   // orange
  5: '#FFD700',   // gold
  6: '#00E5FF',   // cyan/platinum
};

const sizeMap = {
  small: { badge: 48, icon: '1.4rem', border: 3 },
  medium: { badge: 64, icon: '1.8rem', border: 4 },
  large: { badge: 88, icon: '2.5rem', border: 5 },
};

const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  title,
  icon,
  totalXP,
  levelUp = false,
  size = 'medium',
}) => {
  const { reducedMotion } = useTheme();
  const color = levelColors[level] || levelColors[1];
  const dims = sizeMap[size];

  return (
    <Tooltip title={`Level ${level}: ${title} - ${totalXP} XP`} arrow placement="top">
      <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <AnimatePresence>
          <motion.div
            key={`badge-${level}`}
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div
              animate={
                levelUp && !reducedMotion
                  ? {
                      scale: [1, 1.2, 1],
                      boxShadow: [
                        `0 0 0px ${color}`,
                        `0 0 30px ${color}`,
                        `0 0 0px ${color}`,
                      ],
                    }
                  : {}
              }
              transition={
                levelUp
                  ? { duration: 1.2, repeat: 3, ease: 'easeInOut' }
                  : {}
              }
              style={{
                width: dims.badge,
                height: dims.badge,
                borderRadius: '50%',
                border: `${dims.border}px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%), var(--surface)`,
                boxShadow: `0 0 12px rgba(0,0,0,0.2), inset 0 0 8px rgba(255,255,255,0.05)`,
                cursor: 'default',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  fontSize: dims.icon,
                  lineHeight: 1,
                  filter: `drop-shadow(0 0 4px ${color})`,
                  userSelect: 'none',
                }}
              >
                {icon}
              </Box>

              {/* Level number chip */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: size === 'small' ? 18 : 22,
                  height: size === 'small' ? 18 : 22,
                  borderRadius: '50%',
                  bgcolor: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--surface)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: size === 'small' ? '0.6rem' : '0.7rem',
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  {level}
                </Typography>
              </Box>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {size !== 'small' && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: color,
              textAlign: 'center',
              letterSpacing: '0.3px',
              textShadow: `0 0 8px ${color}40`,
            }}
          >
            {title}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

export default LevelBadge;
