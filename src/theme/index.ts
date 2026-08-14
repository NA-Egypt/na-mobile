export const colors = {
  primary: '#32557f',       // Deep Slate Navy Blue
  primaryDark: '#253e5e',
  primaryLight: '#4a76ab',
  secondary: '#32557f',
  accent: '#10b3cf',        // Cyan / Highlight
  accentLight: '#e4f7fa',
  cardBg: '#ffffff',
  bgLight: '#f7fbff',       // Soft background
  bgDark: '#1e324b',
  textPrimary: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#899bb1',
  border: 'rgba(50, 85, 127, 0.10)',
  borderSolid: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  card: 20,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#32557f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  header: {
    shadowColor: '#32557f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
};
