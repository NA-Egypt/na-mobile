import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';
import { haptic } from '../../utils/haptics';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'none' | 'button' | 'link' | 'header';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  contentStyle,
  accessible = true,
  accessibilityLabel,
  accessibilityRole,
}) => {
  const { colors, borderRadius, shadows } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (!onPress) return;
    haptic.selection();
    onPress();
  };

  let cardBg = colors.cardBg;
  let borderColor = colors.cardBorder;
  let borderWidth = 1;
  let shadowStyle = shadows.card;

  switch (variant) {
    case 'default':
      cardBg = colors.cardBg;
      borderColor = colors.cardBorder;
      borderWidth = 1;
      shadowStyle = shadows.card;
      break;
    case 'elevated':
      cardBg = colors.cardElevated;
      borderColor = 'transparent';
      borderWidth = 0;
      shadowStyle = shadows.md;
      break;
    case 'outlined':
      cardBg = 'transparent';
      borderColor = colors.borderSolid;
      borderWidth = 1.5;
      shadowStyle = { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
      break;
    case 'filled':
      cardBg = colors.bgSecondary;
      borderColor = 'transparent';
      borderWidth = 0;
      shadowStyle = { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
      break;
  }

  const containerStyle = [
    styles.card,
    shadowStyle,
    {
      backgroundColor: cardBg,
      borderColor,
      borderWidth,
      borderRadius: borderRadius.card,
    },
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={[containerStyle, animatedStyle]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible={accessible}
          accessibilityRole={accessibilityRole || 'button'}
          accessibilityLabel={accessibilityLabel}
          style={[styles.innerContent, contentStyle]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={containerStyle}
    >
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    overflow: 'hidden',
  },
  innerContent: {
    padding: 16,
  },
});
