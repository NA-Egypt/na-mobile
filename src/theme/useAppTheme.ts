import { useColorScheme } from 'react-native';
import { useThemeStore } from './themeStore';
import { lightColors, darkColors } from './colors';
import { typography, spacing, borderRadius } from './typography';
import { lightShadows, darkShadows } from './shadows';
import { AppTheme } from './types';

export function useAppTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;
  const shadows = isDark ? darkShadows : lightShadows;

  return {
    isDark,
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
  };
}
