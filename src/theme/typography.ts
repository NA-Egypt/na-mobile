import { TypographySystem, SpacingSystem, BorderRadiusSystem } from './types';

export const typography: TypographySystem = {
  display: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
};

export const spacing: SpacingSystem = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius: BorderRadiusSystem = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  card: 16,
  pill: 999,
  full: 9999,
};
