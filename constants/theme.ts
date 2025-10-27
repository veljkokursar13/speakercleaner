/**
 * Cyberpunk Theme Configuration
 * Futuristic neon energy theme with glowing UI elements
 */

export const cyberpunkTheme = {
  // Backgrounds
  background: '#050509',
  backgroundDeep: '#000000',
  backgroundGradient: ['#0a0a14', '#000000'],
  
  // Neon Gradients
  neonPrimary: ['#00FFA3', '#00B2FF'], // Acid green → Electric cyan
  neonSecondary: ['#FF00E0', '#FF0077'], // Magenta → Hot pink
  neonAccent: ['#FFD600', '#FF6B00'], // Gold → Orange
  neonPurple: ['#A78BFA', '#8B5CF6'], // Soft purple → Deep purple
  
  // Solid Colors
  acidGreen: '#00FFA3',
  electricCyan: '#00B2FF',
  magenta: '#FF00E0',
  hotPink: '#FF0077',
  
  // Text
  textPrimary: '#E0E0E0',
  textSecondary: '#A0A0A0',
  textDim: '#606060',
  textNeon: '#00FFA3',
  
  // Glow Effects
  glowPrimary: 'rgba(0, 255, 163, 0.6)',
  glowSecondary: 'rgba(255, 0, 224, 0.6)',
  glowSoft: 'rgba(0, 255, 170, 0.3)',
  
  // Glass/Blur
  glassDark: 'rgba(10, 10, 20, 0.7)',
  glassLight: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(0, 255, 170, 0.2)',
  
  // Shadows
  shadowNeon: {
    shadowColor: '#00FFA3',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  shadowMagenta: {
    shadowColor: '#FF00E0',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  
  // Borders
  borderNeon: 'rgba(0, 255, 170, 0.4)',
  borderGlow: 'rgba(0, 178, 255, 0.5)',
  borderDim: 'rgba(255, 255, 255, 0.1)',
  
  // Typography
  fonts: {
    heading: {
      fontWeight: '700' as const,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },
    button: {
      fontWeight: '700' as const,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
    },
    body: {
      fontWeight: '400' as const,
      letterSpacing: 0.5,
    },
  },
} as const;

export type CyberpunkTheme = typeof cyberpunkTheme;
