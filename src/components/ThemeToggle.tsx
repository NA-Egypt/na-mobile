import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useAppTheme, useThemeStore } from '../theme';
import { haptic } from '../utils/haptics';

export const ThemeToggle: React.FC = () => {
  const { isDark, colors } = useAppTheme();
  const setMode = useThemeStore((state) => state.setMode);

  const toggleTheme = () => {
    haptic.light();
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.2)',
          borderColor: 'rgba(255, 255, 255, 0.25)',
        },
      ]}
      onPress={toggleTheme}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun size={15} color="#fbbf24" />
      ) : (
        <Moon size={15} color="#ffffff" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
