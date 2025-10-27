/**
 * Audio Visualizer Configuration - Cyberpunk Edition
 * Neon energy colors and quantum reactor aesthetics
 */
export const VISUALIZER_CONFIG = {
  BAR_COUNT: 32,
  BAR_WIDTH: 6,
  BAR_GAP: 4,
  MAX_HEIGHT: 100,
  MIN_HEIGHT: 4,
  ANIMATION_SPEED: 50, // ms between updates
  SMOOTHING: 0.7, // 0-1, higher = smoother but slower response
  
  // Cyberpunk Neon Colors
  COLOR_PRIMARY: '#00FFA3', // Acid green
  COLOR_SECONDARY: '#00B2FF', // Electric cyan
  COLOR_ACCENT: '#FF00E0', // Magenta
  COLOR_GLOW: '#A78BFA', // Soft purple
} as const;

export type VisualizerConfig = typeof VISUALIZER_CONFIG;
