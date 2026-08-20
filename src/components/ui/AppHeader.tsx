import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react-native';
import { NALogo } from '../NALogo';
import { AppText } from './AppText';
import { ContactModal } from '../ContactModal';
import { SettingsModal } from '../SettingsModal';
import { useAppTheme } from '../../theme';
import { haptic } from '../../utils/haptics';
import { authApi } from '../../api/auth';

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
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [isContactVisible, setIsContactVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if servant is logged in to show active dot on settings icon
    authApi.getStoredUser().then((u) => {
      setIsLoggedIn(!!u);
    }).catch(() => {});
  }, [isSettingsVisible]);

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
        <View style={[styles.topRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          {/* Brand or Screen Title */}
          {showBrand ? (
            <View style={[styles.brandContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <NALogo size={38} />
              <View
                style={[
                  styles.brandTitles,
                  {
                    marginStart: isAr ? 0 : 10,
                    marginEnd: isAr ? 10 : 0,
                    alignItems: isAr ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                <AppText
                  variant="h3"
                  color="#ffffff"
                  weight="800"
                  style={[styles.brandTitleAr, { textAlign: isAr ? 'right' : 'left' }]}
                >
                  {title || 'زمالة المدمنين المجهولين'}
                </AppText>
                <AppText
                  variant="caption"
                  color="rgba(224, 248, 252, 0.85)"
                  style={[styles.brandTitleEn, { textAlign: isAr ? 'right' : 'left' }]}
                >
                  {subtitle || 'Narcotics Anonymous • Egypt'}
                </AppText>
              </View>
            </View>
          ) : (
            <View style={[styles.titleContainer, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
              <AppText variant="h2" color="#ffffff" weight="800" style={{ textAlign: isAr ? 'right' : 'left' }}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" style={{ textAlign: isAr ? 'right' : 'left' }}>
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
              <TouchableOpacity
                onPress={() => {
                  haptic.selection();
                  setIsSettingsVisible(true);
                }}
                style={[
                  styles.settingsHeaderBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(255, 255, 255, 0.18)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('settings.title', 'الإعدادات')}
              >
                <Settings size={18} color="#ffffff" />
                {isLoggedIn && <View style={styles.activeUserDot} />}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Optional Bottom Component (Search, Filter, Segmented control) */}
        {bottomSlot ? <View style={styles.bottomContainer}>{bottomSlot}</View> : null}
      </SafeAreaView>

      {/* Global Settings Modal */}
      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        onOpenContact={() => setIsContactVisible(true)}
      />

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
  settingsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeUserDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#ffffff',
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
