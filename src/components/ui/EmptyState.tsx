import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { AlertCircle } from 'lucide-react-native';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  primaryActionTitle?: string;
  onPrimaryAction?: () => void;
  secondaryActionTitle?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryActionTitle,
  onPrimaryAction,
  secondaryActionTitle,
  onSecondaryAction,
  style,
}) => {
  const { colors, spacing, borderRadius } = useAppTheme();

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description || ''}`}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.primaryLight + '15',
            borderRadius: borderRadius.full,
          },
        ]}
      >
        {icon || <AlertCircle size={40} color={colors.accent} />}
      </View>

      <AppText
        variant="h3"
        align="center"
        color={colors.textPrimary}
        weight="700"
        style={styles.title}
      >
        {title}
      </AppText>

      {description && (
        <AppText
          variant="body"
          align="center"
          color={colors.textSecondary}
          style={styles.description}
        >
          {description}
        </AppText>
      )}

      {(primaryActionTitle || secondaryActionTitle) && (
        <View style={styles.actionsContainer}>
          {primaryActionTitle && onPrimaryAction && (
            <AppButton
              title={primaryActionTitle}
              onPress={onPrimaryAction}
              variant="accent"
              size="md"
              style={{ minWidth: 160 }}
            />
          )}

          {secondaryActionTitle && onSecondaryAction && (
            <AppButton
              title={secondaryActionTitle}
              onPress={onSecondaryAction}
              variant="ghost"
              size="sm"
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    maxWidth: 320,
    lineHeight: 22,
  },
  actionsContainer: {
    alignItems: 'center',
    width: '100%',
  },
});
