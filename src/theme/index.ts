export const colors = {
  primary: '#1e3a5f',       // Deep Navy Blue (Website Header)
  primaryDark: '#11253e',   // Darker Navy
  primaryLight: '#32557f',  // Classic NA Blue
  secondary: '#2b4c7e',
  accent: '#10b3cf',        // Vibrant Cyan / Highlight
  accentLight: '#e0f8fc',
  accentDark: '#08899f',
  gold: '#f59e0b',          // Gold Accent / Emblem Ring
  goldLight: '#fef3c7',
  cardBg: '#ffffff',
  bgLight: '#f8fafc',       // Soft Slate Background
  bgDark: '#0f172a',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: 'rgba(30, 58, 95, 0.10)',
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
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  card: 16,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#1e3a5f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  glow: {
    shadowColor: '#10b3cf',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
};

