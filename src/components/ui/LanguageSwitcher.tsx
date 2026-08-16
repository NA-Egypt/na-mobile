import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { useAppTheme } from '../../theme';
import { haptic } from '../../utils/haptics';
import { AppText } from './AppText';

export interface LanguageSwitcherProps {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { colors, borderRadius, shadows } = useAppTheme();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const toggleLanguage = () => {
    haptic.selection();
    const nextLang = isAr ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  return (
    <TouchableOpacity
      onPress={toggleLanguage}
      style={[
        styles.container,
        shadows.sm,
        {
          backgroundColor: colors.primaryLight + '25',
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.pill,
        },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={isAr ? 'تغيير اللغة إلى الإنجليزية' : 'Switch language to Arabic'}
      accessibilityHint={isAr ? 'Switches app to English' : 'يحول التطبيق إلى اللغة العربية'}
    >
      <Globe size={14} color={colors.accent} style={styles.globeIcon} />
      <View
        style={[
          styles.badge,
          {
            backgroundColor: colors.accent,
            borderRadius: borderRadius.pill,
          },
        ]}
      >
        <AppText
          variant="labelSmall"
          color={colors.primaryDark}
          weight="700"
          style={styles.langText}
        >
          {isAr ? 'EN' : 'عربي'}
        </AppText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    gap: 6,
  },
  globeIcon: {
    marginLeft: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontSize: 11,
  },
});
