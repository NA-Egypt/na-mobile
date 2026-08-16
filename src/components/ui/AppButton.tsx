import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';
import { haptic } from '../../utils/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    haptic.selection();
    onPress();
  };

  // Size styles
  const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; height: number }> = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13, height: 36 },
    md: { paddingVertical: 10, paddingHorizontal: 18, fontSize: 15, height: 48 },
    lg: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16, height: 56 },
  };

  const currentSize = sizeStyles[size];

  // Variant styles
  let bgColor = colors.primary;
  let textColor = colors.white;
  let borderColor = 'transparent';
  let borderWidth = 0;

  switch (variant) {
    case 'primary':
      bgColor = colors.primary;
      textColor = colors.white;
      break;
    case 'secondary':
      bgColor = colors.secondary;
      textColor = colors.white;
      break;
    case 'accent':
      bgColor = colors.accent;
      textColor = colors.primaryDark;
      break;
    case 'outline':
      bgColor = 'transparent';
      textColor = colors.primary;
      borderColor = colors.primary;
      borderWidth = 1.5;
      break;
    case 'ghost':
      bgColor = 'transparent';
      textColor = colors.primary;
      break;
    case 'danger':
      bgColor = colors.danger;
      textColor = colors.white;
      break;
  }

  if (disabled) {
    bgColor = colors.borderSolid;
    textColor = colors.textMuted;
    borderColor = 'transparent';
  }

  return (
    <Animated.View style={[{ width: fullWidth ? '100%' : 'auto' }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.button,
          {
            backgroundColor: bgColor,
            borderColor,
            borderWidth,
            borderRadius: borderRadius.md,
            minHeight: currentSize.height,
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && iconPosition === 'left' && <Animated.View style={styles.iconLeft}>{icon}</Animated.View>}
            <Text
              style={[
                styles.text,
                {
                  color: textColor,
                  fontSize: currentSize.fontSize,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && <Animated.View style={styles.iconRight}>{icon}</Animated.View>}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 2,
  },
  iconRight: {
    marginLeft: 2,
  },
});
