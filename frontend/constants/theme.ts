export const colors = {
  // Deep Space Backgrounds
  background: '#050511', // Almost black, deep void
  surface: 'rgba(255, 255, 255, 0.05)', // Glassy
  surfaceHover: 'rgba(255, 255, 255, 0.1)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.15)',

  // Brand Gradients (Start -> End)
  primaryGradient: ['#6C5CE7', '#a29bfe'], // Soft purple
  secondaryGradient: ['#0984E3', '#74b9ff'], // Electric blue
  accentGradient: ['#FFD93D', '#ffeaa7'], // Golden types

  // Solid Fallbacks
  primary: '#6C5CE7',
  primaryDark: '#5849C8',
  primaryLight: '#A29BFE',
  accent: '#FFD93D',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0C0', // Stardust grey
  textTertiary: 'rgba(255, 255, 255, 0.4)',

  // Functional
  error: '#FF6B6B',
  success: '#4ECDC4',
  info: '#74B9FF',

  // Moods (for Journal)
  mood1: '#2d3436', // Deep sorrow
  mood2: '#636e72', // Melancholy
  mood3: '#b2bec3', // Neutral
  mood4: '#74b9ff', // Light
  mood5: '#fdcb6e', // Radiant

  // Special
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassShadow: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  headerHeight: 60,
};

export const typography = {
  fontFamily: {
    regular: 'System', // Could add custom font later
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
    display: 42,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  }
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
};
