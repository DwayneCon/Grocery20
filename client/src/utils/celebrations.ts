/* client/src/utils/celebrations.ts */
import confetti from 'canvas-confetti';

/**
 * Celebration types for different events
 */
export type CelebrationType =
  | 'success' // General success (meal planned, goal achieved)
  | 'achievement' // Achievement unlocked
  | 'streak' // Streak milestone
  | 'budget' // Stayed under budget
  | 'nutrition' // Hit nutrition goal
  | 'fireworks' // Big celebration (week complete, major milestone);

/**
 * Trigger a celebration animation
 */
export const triggerCelebration = (type: CelebrationType = 'success') => {
  switch (type) {
    case 'achievement':
      achievementCelebration();
      break;
    case 'streak':
      streakCelebration();
      break;
    case 'budget':
      budgetCelebration();
      break;
    case 'nutrition':
      nutritionCelebration();
      break;
    case 'fireworks':
      fireworksCelebration();
      break;
    case 'success':
    default:
      successCelebration();
      break;
  }
};

/**
 * Quick success celebration
 */
const successCelebration = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF6B35', '#05AF5C', '#FFD93D'],
  });
};

/**
 * Achievement unlock celebration
 */
const achievementCelebration = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FF6B35'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FF6B35'],
    });
  }, 250);
};

/**
 * Streak milestone celebration
 */
const streakCelebration = () => {
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
      colors: ['#FF6B35', '#F4A460', '#FFD93D'],
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

/**
 * Budget achievement celebration (money emojis)
 */
const budgetCelebration = () => {
  const scalar = 2;
  const money = confetti.shapeFromText({ text: '💰', scalar });

  confetti({
    shapes: [money],
    particleCount: 50,
    spread: 100,
    origin: { y: 0.6 },
    scalar,
    zIndex: 9999,
  });
};

/**
 * Nutrition goal celebration (healthy emojis)
 */
const nutritionCelebration = () => {
  const scalar = 2;
  const healthy = confetti.shapeFromText({ text: '🥗', scalar });
  const heart = confetti.shapeFromText({ text: '❤️', scalar });

  confetti({
    shapes: [healthy, heart],
    particleCount: 50,
    spread: 100,
    origin: { y: 0.6 },
    scalar,
    zIndex: 9999,
    colors: ['#05AF5C', '#43e97b', '#38f9d7'],
  });
};

/**
 * Big fireworks celebration for major milestones
 */
const fireworksCelebration = () => {
  const duration = 5000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      particleCount,
      startVelocity: 0,
      ticks: 200,
      origin: {
        x: Math.random(),
        y: Math.random() * 0.5 - 0.2,
      },
      colors: ['#FF6B35', '#05AF5C', '#FFD93D', '#6A4C93', '#F4A460'],
      shapes: ['circle', 'square'],
      gravity: 0.4,
      scalar: 1.2,
      drift: 0,
      zIndex: 9999,
    });
  }, 400);
};

/**
 * Micro-celebration for small wins (lighter confetti)
 */
export const microCelebration = () => {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: ['#FF6B35', '#05AF5C', '#FFD93D'],
    ticks: 50,
    gravity: 0.8,
    zIndex: 9999,
  });
};

/**
 * Small, quick confetti burst when a meal is approved
 */
export const celebrateMealApproved = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#f97316', '#22c55e', '#3b82f6'],
    ticks: 100,
    gravity: 1.2,
    scalar: 0.8,
    zIndex: 9999,
  });
};

/**
 * Full-screen celebration when a meal plan is completed.
 * Two bursts launch from the left and right sides simultaneously,
 * with food emoji shapes mixed in for extra flair.
 */
export const celebratePlanComplete = () => {
  const colors = ['#f97316', '#22c55e', '#eab308', '#ec4899'];

  // Create food emoji shapes for extra celebration flair
  const scalar = 1.5;
  const fork = confetti.shapeFromText({ text: '🍽️', scalar });
  const star = confetti.shapeFromText({ text: '⭐', scalar });

  const sharedOpts: confetti.Options = {
    particleCount: 100,
    spread: 100,
    colors,
    ticks: 200,
    zIndex: 9999,
    shapes: ['circle', 'square', fork, star],
    scalar,
  };

  // Left burst
  confetti({
    ...sharedOpts,
    angle: 60,
    origin: { x: 0.2, y: 0.5 },
  });

  // Right burst
  confetti({
    ...sharedOpts,
    angle: 120,
    origin: { x: 0.8, y: 0.5 },
  });
};

/**
 * Gold/star themed celebration for unlocking achievements
 */
export const celebrateAchievement = () => {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
    shapes: ['star'],
    ticks: 150,
    scalar: 1.2,
    zIndex: 9999,
  });
};

/**
 * Fire/streak themed celebration whose intensity scales with the milestone.
 * Higher milestones produce more particles and a wider spread.
 *
 * @param milestone - The streak count (e.g. 3, 7, 14, 30)
 */
export const celebrateStreak = (milestone: number) => {
  confetti({
    particleCount: Math.min(30 + milestone * 10, 150),
    spread: 50 + milestone * 5,
    origin: { y: 0.7 },
    colors: ['#ef4444', '#f97316', '#eab308'],
    ticks: 120,
    zIndex: 9999,
  });
};

/**
 * Stop all ongoing celebrations
 */
export const stopAllCelebrations = () => {
  confetti.reset();
};
