/* client/src/components/chat/NoraMood.tsx */
import { Box } from '@mui/material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import NoraAvatar from '../common/NoraAvatar';
import type { NoraAvatarSize } from '../common/NoraAvatar';

/**
 * Mood types for the Nora avatar emotional state system.
 *
 * - idle: Default resting state with gentle floating
 * - thinking: Pulsing/wobbling with animated dots below
 * - happy: Quick bounce with sparkle particles
 * - celebrating: Energetic bounce with confetti emoji particles
 * - cooking: Side-to-side sway with rising steam lines
 */
export type NoraMood = 'idle' | 'thinking' | 'happy' | 'celebrating' | 'cooking';

export interface NoraMoodProps {
  /** The emotional state to display */
  mood: NoraMood;
  /** Pixel size of the avatar (default 48) */
  size?: number;
}

/**
 * Map a numeric pixel size to the closest NoraAvatarSize preset.
 */
const getAvatarSize = (px: number): NoraAvatarSize => {
  if (px <= 36) return 'small';
  if (px <= 56) return 'medium';
  if (px <= 80) return 'large';
  return 'xlarge';
};

// ---------------------------------------------------------------------------
// Particle sub-components for each mood
// ---------------------------------------------------------------------------

/** Sparkle particles for the "happy" mood */
const SparkleParticles = ({ size }: { size: number }) => {
  const particles = [
    { x: size * 0.6, y: -size * 0.3, delay: 0 },
    { x: -size * 0.5, y: -size * 0.4, delay: 0.15 },
    { x: size * 0.4, y: -size * 0.6, delay: 0.3 },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <Box
          key={i}
          component={motion.div}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 0.4,
            x: p.x,
            y: p.y,
          }}
          transition={{
            duration: 0.8,
            delay: p.delay,
            ease: 'easeOut',
          }}
          sx={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            fontSize: size * 0.3,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          &#10024;
        </Box>
      ))}
    </>
  );
};

/** Confetti emoji particles for the "celebrating" mood */
const ConfettiParticles = ({ size }: { size: number }) => {
  const emojis = [
    { char: '\uD83C\uDF89', x: size * 0.7, y: -size * 0.9, delay: 0 },
    { char: '\uD83C\uDF8A', x: -size * 0.6, y: -size * 1.0, delay: 0.2 },
    { char: '\uD83C\uDF89', x: size * 0.2, y: -size * 1.1, delay: 0.35 },
    { char: '\uD83C\uDF8A', x: -size * 0.3, y: -size * 0.8, delay: 0.1 },
  ];

  return (
    <>
      {emojis.map((e, i) => (
        <Box
          key={i}
          component={motion.div}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 0.5,
            x: e.x,
            y: e.y,
          }}
          transition={{
            duration: 1.2,
            delay: e.delay,
            ease: 'easeOut',
          }}
          sx={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            fontSize: size * 0.35,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {e.char}
        </Box>
      ))}
    </>
  );
};

/** Thinking dots rendered below the avatar */
const ThinkingDots = ({ size }: { size: number }) => (
  <Box
    component={motion.div}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 4 }}
    sx={{
      position: 'absolute',
      bottom: -size * 0.25,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '4px',
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
          width: Math.max(4, size * 0.1),
          height: Math.max(4, size * 0.1),
          borderRadius: '50%',
          background: 'var(--chef-orange)',
          boxShadow: '0 2px 8px rgba(255, 107, 53, 0.4)',
        }}
      />
    ))}
  </Box>
);

/** Rising steam lines for the "cooking" mood */
const SteamLines = ({ size }: { size: number }) => (
  <Box
    sx={{
      position: 'absolute',
      top: -size * 0.35,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '4px',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  >
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        component={motion.div}
        animate={{
          y: [0, -size * 0.4],
          opacity: [0.6, 0],
          scaleX: [1, 1.3],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          delay: i * 0.3,
          ease: 'easeOut',
        }}
        sx={{
          width: 2,
          height: size * 0.2,
          borderRadius: '2px',
          background: 'rgba(180, 180, 180, 0.6)',
          transformOrigin: 'bottom center',
        }}
      />
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * NoraMood - Animated wrapper around NoraAvatar that expresses emotional states.
 *
 * It renders the existing NoraAvatar inside a Framer Motion wrapper and adds
 * mood-specific particle/decoration elements as absolutely positioned siblings.
 *
 * @example
 * <NoraMood mood="idle" />
 *
 * @example
 * <NoraMood mood="celebrating" size={64} />
 */
const NoraMood = ({ mood, size = 48 }: NoraMoodProps) => {
  const shouldReduceMotion = useReducedMotion();

  // When the user prefers reduced motion, fall back to a static presentation.
  const noMotion = shouldReduceMotion === true;

  const avatarSize = getAvatarSize(size);

  // --------------------------------------------------
  // Motion variants for the outer wrapper
  // --------------------------------------------------

  const idleVariant: TargetAndTransition = noMotion
    ? {}
    : {
        y: [-2, 2, -2],
        scale: [1.0, 1.02, 1.0],
        transition: {
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        },
      };

  const thinkingVariant: TargetAndTransition = noMotion
    ? {}
    : {
        opacity: [0.7, 1.0, 0.7],
        rotate: [-5, 5, -5],
        transition: {
          opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        },
      };

  const happyVariant: TargetAndTransition = noMotion
    ? {}
    : {
        scale: [1, 1.2, 1.0],
        transition: {
          duration: 0.5,
          ease: 'easeOut',
        },
      };

  const celebratingVariant: TargetAndTransition = noMotion
    ? {}
    : {
        scale: [1, 1.3, 0.95, 1.05, 1.0],
        rotate: [0, -8, 8, -4, 0],
        transition: {
          duration: 0.7,
          ease: 'easeOut',
        },
      };

  const cookingVariant: TargetAndTransition = noMotion
    ? {}
    : {
        x: [-3, 3, -3],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  const getAnimateProps = (): TargetAndTransition => {
    switch (mood) {
      case 'idle':
        return idleVariant;
      case 'thinking':
        return thinkingVariant;
      case 'happy':
        return happyVariant;
      case 'celebrating':
        return celebratingVariant;
      case 'cooking':
        return cookingVariant;
      default:
        return idleVariant;
    }
  };

  // Map NoraMood moods to the NoraAvatar state prop.
  const getAvatarState = (): 'idle' | 'thinking' | 'speaking' | 'cooking' => {
    switch (mood) {
      case 'thinking':
        return 'thinking';
      case 'cooking':
        return 'cooking';
      case 'happy':
      case 'celebrating':
        return 'speaking';
      default:
        return 'idle';
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Leave room for particles / steam above and dots below
        width: size * 1.6,
        height: size * 1.6,
      }}
      role="img"
      aria-label={`Nora is ${mood}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={mood}
          initial={{ opacity: 0.8, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            ...getAnimateProps(),
          }}
          exit={{ opacity: 0.8, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NoraAvatar
            size={avatarSize}
            state={getAvatarState()}
            showChefHat
            animated={!noMotion}
          />
        </motion.div>
      </AnimatePresence>

      {/* ---- Mood-specific decorations ---- */}
      <AnimatePresence>
        {mood === 'thinking' && !noMotion && <ThinkingDots size={size} />}
      </AnimatePresence>

      <AnimatePresence>
        {mood === 'happy' && !noMotion && <SparkleParticles size={size} />}
      </AnimatePresence>

      <AnimatePresence>
        {mood === 'celebrating' && !noMotion && <ConfettiParticles size={size} />}
      </AnimatePresence>

      <AnimatePresence>
        {mood === 'cooking' && !noMotion && <SteamLines size={size} />}
      </AnimatePresence>
    </Box>
  );
};

export default NoraMood;
