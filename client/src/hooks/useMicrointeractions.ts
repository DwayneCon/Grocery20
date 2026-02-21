/* client/src/hooks/useMicrointeractions.ts */
import { useCallback } from 'react';
import { useAnimation, AnimationControls } from 'framer-motion';

/**
 * Hook for triggering microinteractions programmatically
 */
export const useMicrointeractions = () => {
  const controls = useAnimation();

  const shake = useCallback(async () => {
    await controls.start({
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.4 },
    });
  }, [controls]);

  const pulse = useCallback(async () => {
    await controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 },
    });
  }, [controls]);

  const bounce = useCallback(async () => {
    await controls.start({
      y: [0, -10, 0],
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    });
  }, [controls]);

  const glow = useCallback(async () => {
    await controls.start({
      filter: [
        'drop-shadow(0 0 0px rgba(255,107,53,0))',
        'drop-shadow(0 0 10px rgba(255,107,53,0.8))',
        'drop-shadow(0 0 0px rgba(255,107,53,0))',
      ],
      transition: { duration: 0.6 },
    });
  }, [controls]);

  const spin = useCallback(async () => {
    await controls.start({
      rotate: 360,
      transition: { duration: 0.5 },
    });
  }, [controls]);

  const wiggle = useCallback(async () => {
    await controls.start({
      rotate: [-5, 5, -5, 5, 0],
      transition: { duration: 0.5 },
    });
  }, [controls]);

  const heartbeat = useCallback(async () => {
    await controls.start({
      scale: [1, 1.2, 1, 1.2, 1],
      transition: { duration: 0.6 },
    });
  }, [controls]);

  const flash = useCallback(async () => {
    await controls.start({
      opacity: [1, 0.3, 1],
      transition: { duration: 0.3 },
    });
  }, [controls]);

  return {
    controls,
    shake,
    pulse,
    bounce,
    glow,
    spin,
    wiggle,
    heartbeat,
    flash,
  };
};

/**
 * Hook for haptic feedback (mobile devices)
 */
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = useCallback(() => vibrate(20), [vibrate]);
  const heavyTap = useCallback(() => vibrate(30), [vibrate]);
  const doubleTap = useCallback(() => vibrate([10, 50, 10]), [vibrate]);
  const success = useCallback(() => vibrate([10, 50, 10, 50, 10]), [vibrate]);
  const error = useCallback(() => vibrate([50, 100, 50]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    success,
    error,
  };
};

/**
 * Hook for sound feedback
 */
export const useSoundFeedback = () => {
  const playSound = useCallback((frequency: number, duration: number = 100) => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    }
  }, []);

  const click = useCallback(() => playSound(800, 50), [playSound]);
  const success = useCallback(() => {
    playSound(523, 100);
    setTimeout(() => playSound(659, 100), 100);
  }, [playSound]);
  const error = useCallback(() => playSound(300, 200), [playSound]);
  const notify = useCallback(() => playSound(1000, 100), [playSound]);

  return {
    playSound,
    click,
    success,
    error,
    notify,
  };
};
