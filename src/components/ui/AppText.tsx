import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useAppTheme } from '../../theme';
import { TypographySystem } from '../../theme/types';
import { useTranslation } from 'react-i18next';
import { getRTLTextAlign } from '../../utils/rtl';

export interface AppTextProps extends TextProps {
  variant?: keyof TypographySystem;
  color?: string;
  weight?: '300' | '400' | '500' | '600' | '700' | '800';
  align?: 'left' | 'center' | 'right' | 'auto';
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  weight,
  align = 'auto',
  style,
  children,
  ...rest
}) => {
  const { colors, typography } = useAppTheme();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const baseTypography = typography[variant] || typography.body;
  const textAlign = align === 'auto' ? getRTLTextAlign(isAr) : align;

  const combinedStyle: TextStyle = {
    ...baseTypography,
    color: color || colors.textPrimary,
    textAlign,
    ...(weight ? { fontWeight: weight } : {}),
  };

  return (
    <Text style={[combinedStyle, style]} {...rest}>
      {children}
    </Text>
  );
};
