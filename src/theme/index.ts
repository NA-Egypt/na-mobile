import { lightColors } from './colors';
import { typography, spacing, borderRadius } from './typography';
import { lightShadows, darkShadows } from './shadows';

// Backward-compatible static exports (defaulting to light theme tokens)
export const colors = lightColors;
export { typography, spacing, borderRadius };
export const shadows = lightShadows;
export { lightShadows, darkShadows };

// Extended Theme Engine
export * from './types';
export * from './colors';
export * from './typography';
export * from './shadows';
export * from './themeStore';
export * from './useAppTheme';
