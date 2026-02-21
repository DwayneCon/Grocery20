/* client/src/components/common/NoraAvatar.tsx */
import { Box, BoxProps } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartToy, Restaurant } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

export type NoraAvatarState = 'idle' | 'thinking' | 'speaking' | 'cooking';
export type NoraAvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface NoraAvatarProps extends Omit<BoxProps, 'component'> {
  state?: NoraAvatarState;
  size?: NoraAvatarSize;
  showChefHat?: boolean;
  animated?: boolean;
}

const sizeMap = {
  small: {
    container: 32,
    icon: 20,
    hat: 16,
    glow: 40,
  },
  medium: {
    container: 48,
    icon: 28,
    hat: 22,
    glow: 56,
  },
  large: {
    container: 64,
    icon: 38,
    hat: 28,
    glow: 72,
  },
  xlarge: {
    container: 96,
    icon: 56,
    hat: 40,
    glow: 104,
  },
};

/**
 * NoraAvatar - Animated avatar component for Nora, the AI culinary assistant
 *
 * Features:
 * - Multiple animation states (idle, thinking, speaking, cooking)
 * - Size variants (small, medium, large, xlarge)
 * - Optional chef hat indicator
 * - Smooth Framer Motion animations
 * - Design token integration
 *
 * @example
 * // Basic usage
 * <NoraAvatar size="medium" />
 *
 * @example
 * // Thinking state with chef hat
 * <NoraAvatar state="thinking" showChefHat size="large" />
 *
 * @example
 * // Speaking state
 * <NoraAvatar state="speaking" size="medium" animated />
 */
const NoraAvatar = ({
  state = 'idle',
  size = 'medium',
  showChefHat = true,
  animated = true,
  sx,
  ...props
}: NoraAvatarProps) => {
  const { mode } = useTheme();
  const sizes = sizeMap[size];

  // Animation variants based on state
  const containerVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    thinking: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    speaking: {
      scale: [1, 1.08, 0.98, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    cooking: {
      rotate: [0, -5, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const glowVariants = {
    idle: {
      opacity: 0.3,
      scale: 1,
    },
    thinking: {
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    speaking: {
      opacity: [0.4, 0.7, 0.4],
      scale: [1, 1.15, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    cooking: {
      opacity: [0.5, 0.8, 0.5],
      scale: [1, 1.3, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const hatVariants = {
    idle: {
      y: 0,
      rotate: 0,
    },
    thinking: {
      y: [-1, 1, -1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    speaking: {
      rotate: [-3, 3, -3],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    cooking: {
      y: [-2, 2, -2],
      rotate: [-5, 5, -5],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: sizes.container,
        height: sizes.container,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      role="img"
      aria-label={`Nora is ${state === 'thinking' ? 'thinking' : state === 'speaking' ? 'speaking' : state === 'cooking' ? 'cooking' : 'ready to help'}`}
      {...props}
    >
      {/* Animated Glow Effect */}
      <Box
        component={motion.div}
        variants={animated ? glowVariants : undefined}
        initial="idle"
        animate={animated ? state : 'idle'}
        sx={{
          position: 'absolute',
          width: sizes.glow,
          height: sizes.glow,
          borderRadius: '50%',
          background: `radial-gradient(circle, var(--chef-orange) 0%, transparent 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Avatar Container */}
      <Box
        component={motion.div}
        variants={animated ? containerVariants : undefined}
        initial="idle"
        animate={animated ? state : 'idle'}
        sx={{
          position: 'relative',
          width: sizes.container,
          height: sizes.container,
          borderRadius: '50%',
          background: mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(244, 164, 96, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(244, 164, 96, 0.15) 100%)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${mode === 'dark' ? 'rgba(255, 107, 53, 0.4)' : 'rgba(255, 107, 53, 0.3)'}`,
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(255, 107, 53, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.1)'
            : '0 8px 32px rgba(255, 107, 53, 0.15), inset 0 2px 8px rgba(255, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          zIndex: 1,
        }}
      >
        {/* Main Icon - SmartToy */}
        <SmartToy
          sx={{
            fontSize: sizes.icon,
            color: 'var(--chef-orange)',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
          }}
        />

        {/* Chef Hat Indicator */}
        <AnimatePresence>
          {showChefHat && (
            <Box
              component={motion.div}
              variants={animated ? hatVariants : undefined}
              initial="idle"
              animate={animated ? state : 'idle'}
              exit={{ opacity: 0, scale: 0 }}
              sx={{
                position: 'absolute',
                top: -sizes.hat / 3,
                right: -sizes.hat / 4,
                width: sizes.hat,
                height: sizes.hat,
                borderRadius: '50%',
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, var(--pure-white) 0%, #F0F0F0 100%)'
                  : 'linear-gradient(135deg, var(--pure-white) 0%, #E8E8E8 100%)',
                border: `2px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <Restaurant
                sx={{
                  fontSize: sizes.hat * 0.6,
                  color: 'var(--chef-orange)',
                }}
              />
            </Box>
          )}
        </AnimatePresence>

        {/* Thinking Dots - Only show when thinking */}
        <AnimatePresence>
          {state === 'thinking' && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              sx={{
                position: 'absolute',
                bottom: -sizes.container * 0.3,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  component={motion.div}
                  animate={{
                    y: [0, -4, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                  sx={{
                    width: sizes.container * 0.12,
                    height: sizes.container * 0.12,
                    borderRadius: '50%',
                    background: 'var(--chef-orange)',
                    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.4)',
                  }}
                />
              ))}
            </Box>
          )}
        </AnimatePresence>

        {/* Speaking Wave Indicator - Only show when speaking */}
        <AnimatePresence>
          {state === 'speaking' && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -sizes.container * 0.25,
                display: 'flex',
                gap: 0.3,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <Box
                  key={i}
                  component={motion.div}
                  animate={{
                    scaleY: [1, 1.8, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: 'easeInOut',
                  }}
                  sx={{
                    width: 2,
                    height: sizes.container * 0.15,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--basil-green)',
                    transformOrigin: 'center',
                  }}
                />
              ))}
            </Box>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default NoraAvatar;
