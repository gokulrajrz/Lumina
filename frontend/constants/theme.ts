export const colors = {
  // Matte Dark Backgrounds
  background: '#1A1A1A',
  surface: '#242424',
  surfaceHover: '#2E2E2E',
  surfaceHighlight: '#383838',

  // Brand
  primary: '#FFFFFF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#555555',

  // Functional
  error: '#FF4D4D',
  success: '#4ADE80',
  info: '#60A5FA',

  // Borders & Shadows (minimal for matte)
  border: '#2A2A2A',
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
    regular: 'System',
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  glow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};
