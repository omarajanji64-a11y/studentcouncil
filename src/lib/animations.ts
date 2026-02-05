export const easing = [0.4, 0, 0.2, 1] as const;

export const durations = {
  fast: 0.14,
  base: 0.18,
  slow: 0.24,
} as const;

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.base, ease: easing },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: durations.fast, ease: easing },
  },
} as const;

export const cardStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
} as const;

export const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: easing },
  },
} as const;

export const modalOverlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: durations.base, ease: easing } },
  exit: { opacity: 0, transition: { duration: durations.fast, ease: easing } },
} as const;

export const modalContent = {
  hidden: { opacity: 0, scale: 0.96, y: 6 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: durations.base, ease: easing },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: durations.fast, ease: easing },
  },
} as const;

export const toastMotion = {
  initial: { opacity: 0, x: 24, y: 4 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: durations.base, ease: easing },
  },
  exit: {
    opacity: 0,
    x: 24,
    y: 4,
    transition: { duration: durations.fast, ease: easing },
  },
} as const;

export const buttonMotion = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 520, damping: 32, mass: 0.3 },
} as const;

export const listItemMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.base, ease: easing } },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: durations.fast, ease: easing },
  },
} as const;

export const shimmerMotion = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      duration: 1.4,
      ease: easing,
      repeat: Infinity,
      repeatDelay: 0.2,
    },
  },
} as const;
