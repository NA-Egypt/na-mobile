import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NALogo } from '../NALogo';
import { AppText } from './AppText';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from '../ThemeToggle';
import { useAppTheme } from '../../theme';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBrand?: boolean;
  rightActions?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBrand = true,
  rightActions,
  bottomSlot,
  style,
}) => {
  const { colors, isDark } = useAppTheme();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? colors.cardBg : colors.primaryDark },
        style,
      ]}
    >
      <View style={styles.topRow}>
        {/* Brand or Screen Title */}
        {showBrand ? (
          <View style={styles.brandContainer}>
            <NALogo size={38} />
            <View style={styles.brandTitles}>
              <AppText variant="h3" color="#ffffff" weight="800" style={styles.brandTitleAr}>
                {title || 'زمالة المدمنين المجهولين'}
              </AppText>
              <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" style={styles.brandTitleEn}>
                {subtitle || 'Narcotics Anonymous • Egypt'}
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <AppText variant="h2" color="#ffffff" weight="800">
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" color="rgba(224, 248, 252, 0.85)">
                {subtitle}
              </AppText>
            ) : null}
          </View>
        )}

        {/* Header Right Actions */}
        <View style={styles.actionsRow}>
          {rightActions ? (
            rightActions
          ) : (
            <>
              <ThemeToggle />
              <LanguageSwitcher />
            </>
          )}
        </View>
      </View>

      {/* Optional Bottom Component (Search, Filter, Segmented control) */}
      {bottomSlot ? <View style={styles.bottomContainer}>{bottomSlot}</View> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    paddingBottom: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandTitles: {
    marginStart: 10,
    flex: 1,
  },
  brandTitleAr: {
    fontSize: 15,
    lineHeight: 20,
  },
  brandTitleEn: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  titleContainer: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
});
