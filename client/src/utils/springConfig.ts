export const springs = {
  gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 10 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 25 },
  slow: { type: 'spring' as const, stiffness: 80, damping: 20 },
};

export const magneticHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: springs.bouncy,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: springs.gentle,
};

export const staggerChildren = (delay = 0.05) => ({
  animate: { transition: { staggerChildren: delay } },
});
