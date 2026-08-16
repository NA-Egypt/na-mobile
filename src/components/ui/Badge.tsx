import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../../theme';

export type BadgeVariant = 'primary' | 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const { colors, borderRadius, typography } = useAppTheme();

  let bgColor = colors.bgSecondary;
  let textColor = colors.textSecondary;
  let borderColor = 'transparent';

  switch (variant) {
    case 'primary':
      bgColor = colors.primaryLight + '20';
      textColor = colors.primary;
      break;
    case 'accent':
      bgColor = colors.accentLight;
      textColor = colors.accentDark;
      break;
    case 'gold':
      bgColor = colors.goldLight;
      textColor = colors.goldDark;
      break;
    case 'success':
      bgColor = colors.successLight;
      textColor = colors.success;
      break;
    case 'warning':
      bgColor = colors.warningLight;
      textColor = colors.warning;
      break;
    case 'danger':
      bgColor = colors.dangerLight;
      textColor = colors.danger;
      break;
    case 'neutral':
      bgColor = colors.borderSubtle;
      textColor = colors.textSecondary;
      break;
    case 'outline':
      bgColor = 'transparent';
      textColor = colors.textSecondary;
      borderColor = colors.borderSolid;
      break;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: borderColor !== 'transparent' ? 1 : 0,
          borderRadius: borderRadius.pill,
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 3 : 5,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? 11 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
