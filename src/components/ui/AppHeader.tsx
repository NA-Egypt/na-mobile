import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react-native';
import { NALogo } from '../NALogo';
import { AppText } from './AppText';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from '../ThemeToggle';
import { ContactModal } from '../ContactModal';
import { useAppTheme } from '../../theme';
import { haptic } from '../../utils/haptics';

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
  const [isContactVisible, setIsContactVisible] = useState(false);

  return (
    <>
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
                <TouchableOpacity
                  onPress={() => {
                    haptic.selection();
                    setIsContactVisible(true);
                  }}
                  style={[
                    styles.contactHeaderBtn,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isAr ? 'اتصل بنا' : 'Contact Us'}
                >
                  <Mail size={16} color="#ffffff" />
                </TouchableOpacity>
                <ThemeToggle />
                <LanguageSwitcher />
              </>
            )}
          </View>
        </View>

        {/* Optional Bottom Component (Search, Filter, Segmented control) */}
        {bottomSlot ? <View style={styles.bottomContainer}>{bottomSlot}</View> : null}
      </SafeAreaView>

      {/* Global Contact Modal */}
      <ContactModal
        visible={isContactVisible}
        onClose={() => setIsContactVisible(false)}
      />
    </>
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
  contactHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
});
