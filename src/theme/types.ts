export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  cardBg: string;
  cardElevated: string;
  cardBorder: string;
  bgPrimary: string;
  bgSecondary: string;
  bgLight: string;
  bgDark: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderSolid: string;
  borderSubtle: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
  white: string;
  black: string;
  overlay: string;
}

export interface TypographyStyle {
  fontSize: number;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800';
  lineHeight: number;
  letterSpacing?: number;
}

export interface TypographySystem {
  display: TypographyStyle;
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  h4: TypographyStyle;
  bodyLarge: TypographyStyle;
  body: TypographyStyle;
  bodySmall: TypographyStyle;
  label: TypographyStyle;
  labelSmall: TypographyStyle;
  caption: TypographyStyle;
}

export interface ElevationStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ShadowsSystem {
  sm: ElevationStyle;
  md: ElevationStyle;
  lg: ElevationStyle;
  card: ElevationStyle;
  header: ElevationStyle;
  glow: ElevationStyle;
  bottomSheet: ElevationStyle;
}

export interface SpacingSystem {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface BorderRadiusSystem {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  card: number;
  pill: number;
  full: number;
}

export interface AppTheme {
  isDark: boolean;
  colors: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingSystem;
  borderRadius: BorderRadiusSystem;
  shadows: ShadowsSystem;
}
