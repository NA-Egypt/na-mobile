import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  Settings,
  X,
  Sun,
  Moon,
  Globe,
  Mail,
  User,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppTheme, useThemeStore } from '../theme';
import { AppText, Badge } from './ui';
import { haptic } from '../utils/haptics';
import { azureAuthService } from '../services/azureAuthService';
import { authApi, UserProfile } from '../api/auth';

export interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenContact: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onOpenContact,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, isDark, borderRadius, shadows } = useAppTheme();
  const setMode = useThemeStore((state) => state.setMode);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Check auth status
      checkUser();
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible]);

  const checkUser = async () => {
    try {
      const stored = await authApi.getStoredUser();
      if (stored) {
        setUser(stored);
      }
      const fresh = await azureAuthService.checkSilentAuth();
      setUser(fresh);
    } catch {
      // Ignore
    }
  };

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    if (i18n.language === lang) return;
    haptic.selection();
    i18n.changeLanguage(lang);
  };

  const handleThemeChange = (mode: 'light' | 'dark') => {
    haptic.light();
    setMode(mode);
  };

  const handleLoginPress = () => {
    haptic.selection();
    onClose();
    router.push('/login');
  };

  const handleLogout = () => {
    haptic.selection();
    Alert.alert(
      isAr ? 'تسجيل الخروج' : 'Sign Out',
      isAr
        ? 'هل ترغب في تسجيل الخروج من التطبيق فقط أم إنهاء جلسة مايكروسوفت بالكامل؟'
        : 'Do you want to sign out from the app only, or sign out completely from your Microsoft session?',
      [
        {
          text: isAr ? 'إلغاء' : 'Cancel',
          style: 'cancel',
        },
        {
          text: isAr ? 'الخروج من التطبيق' : 'App Sign-out',
          onPress: async () => {
            haptic.light();
            await azureAuthService.signOut(false);
            setUser(null);
          },
        },
        {
          text: isAr ? 'خروج مايكروسوفت الكامل' : 'Full Microsoft Sign-out',
          style: 'destructive',
          onPress: async () => {
            haptic.warning();
            await azureAuthService.signOut(true);
            setUser(null);
          },
        },
      ]
    );
  };

  const handleContactPress = () => {
    haptic.selection();
    onClose();
    onOpenContact();
  };

  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                shadows.lg,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.xl,
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Header */}
              <View
                style={[
                  styles.headerRow,
                  {
                    borderBottomColor: colors.cardBorder,
                    flexDirection: isAr ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <View
                  style={[
                    styles.headerTitleContainer,
                    { flexDirection: isAr ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View
                    style={[
                      styles.headerIconBg,
                      { backgroundColor: colors.accent + '20' },
                    ]}
                  >
                    <Settings size={18} color={colors.accent} />
                  </View>
                  <AppText variant="h3" weight="800" color={colors.textPrimary}>
                    {t('settings.title', 'الإعدادات')}
                  </AppText>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isAr ? 'إغلاق' : 'Close'}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.bodyContent}>
                {/* 1. Servant Account Card */}
                {user ? (
                  <View
                    style={[
                      styles.accountCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : colors.primaryLight + '12',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.accountRow,
                        { flexDirection: isAr ? 'row-reverse' : 'row' },
                      ]}
                    >
                      <View
                        style={[
                          styles.avatarContainer,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <User size={18} color="#ffffff" />
                        <View style={styles.onlineDot} />
                      </View>

                      <View
                        style={[
                          styles.accountDetails,
                          {
                            alignItems: isAr ? 'flex-end' : 'flex-start',
                            marginHorizontal: 10,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.accountNameRow,
                            { flexDirection: isAr ? 'row-reverse' : 'row' },
                          ]}
                        >
                          <AppText
                            variant="body"
                            weight="700"
                            color={colors.textPrimary}
                            numberOfLines={1}
                          >
                            {user.name || (isAr ? 'خادم موثوق' : 'Trusted Servant')}
                          </AppText>
                          <Badge
                            label={isAr ? 'خادم مؤتمن' : 'Servant'}
                            variant="accent"
                            size="sm"
                          />
                        </View>

                        {user.email ? (
                          <AppText
                            variant="caption"
                            color={colors.textMuted}
                            numberOfLines={1}
                            style={{ marginTop: 2 }}
                          >
                            {user.email}
                          </AppText>
                        ) : null}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleLogout}
                      style={[
                        styles.logoutBtn,
                        {
                          backgroundColor: isDark
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(239, 68, 68, 0.08)',
                          borderColor: colors.danger + '40',
                          flexDirection: isAr ? 'row-reverse' : 'row',
                        },
                      ]}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                    >
                      <LogOut size={15} color={colors.danger} />
                      <AppText
                        variant="labelSmall"
                        weight="700"
                        color={colors.danger}
                        style={{ marginHorizontal: 6 }}
                      >
                        {t('settings.sign_out', 'تسجيل الخروج')}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleLoginPress}
                    style={[
                      styles.loginBanner,
                      {
                        backgroundColor: isDark
                          ? 'rgba(0, 168, 150, 0.12)'
                          : colors.primaryLight + '18',
                        borderColor: colors.accent + '40',
                        flexDirection: isAr ? 'row-reverse' : 'row',
                      },
                    ]}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.loginIconBg,
                        { backgroundColor: colors.accent + '25' },
                      ]}
                    >
                      <ShieldCheck size={20} color={colors.accent} />
                    </View>

                    <View
                      style={[
                        styles.loginTextContainer,
                        {
                          alignItems: isAr ? 'flex-end' : 'flex-start',
                          marginHorizontal: 10,
                        },
                      ]}
                    >
                      <AppText
                        variant="body"
                        weight="700"
                        color={colors.textPrimary}
                      >
                        {t('settings.servant_login', 'دخول الخدام الموثوقين')}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={colors.textMuted}
                        style={{ marginTop: 2 }}
                      >
                        {t(
                          'settings.servant_login_desc',
                          'الوصول للأجندات والتقارير الخدمية'
                        )}
                      </AppText>
                    </View>

                    <ChevronIcon size={18} color={colors.accent} />
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View
                  style={[styles.sectionDivider, { backgroundColor: colors.cardBorder }]}
                />

                {/* 2. Appearance Toggle Row */}
                <View
                  style={[
                    styles.settingRow,
                    { flexDirection: isAr ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View
                    style={[
                      styles.settingRowLeft,
                      { flexDirection: isAr ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View
                      style={[
                        styles.settingIconBg,
                        {
                          backgroundColor: isDark
                            ? 'rgba(251, 191, 36, 0.15)'
                            : 'rgba(30, 77, 107, 0.1)',
                        },
                      ]}
                    >
                      {isDark ? (
                        <Moon size={16} color="#fbbf24" />
                      ) : (
                        <Sun size={16} color={colors.primary} />
                      )}
                    </View>
                    <AppText
                      variant="body"
                      weight="600"
                      color={colors.textPrimary}
                      style={{ marginHorizontal: 8 }}
                    >
                      {t('settings.appearance', 'المظهر')}
                    </AppText>
                  </View>

                  {/* Segmented Light / Dark Toggle */}
                  <View
                    style={[
                      styles.segmentedContainer,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.05)',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleThemeChange('light')}
                      style={[
                        styles.segmentBtn,
                        !isDark && {
                          backgroundColor: colors.cardBg,
                          ...shadows.sm,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Sun
                        size={13}
                        color={!isDark ? colors.primary : colors.textMuted}
                      />
                      <AppText
                        variant="caption"
                        weight={!isDark ? '700' : '500'}
                        color={!isDark ? colors.primary : colors.textMuted}
                        style={{ marginStart: 4 }}
                      >
                        {isAr ? 'فاتح' : 'Light'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleThemeChange('dark')}
                      style={[
                        styles.segmentBtn,
                        isDark && {
                          backgroundColor: colors.primaryDark,
                          ...shadows.sm,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Moon
                        size={13}
                        color={isDark ? '#fbbf24' : colors.textMuted}
                      />
                      <AppText
                        variant="caption"
                        weight={isDark ? '700' : '500'}
                        color={isDark ? '#ffffff' : colors.textMuted}
                        style={{ marginStart: 4 }}
                      >
                        {isAr ? 'داكن' : 'Dark'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. Language Switcher Row */}
                <View
                  style={[
                    styles.settingRow,
                    { flexDirection: isAr ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View
                    style={[
                      styles.settingRowLeft,
                      { flexDirection: isAr ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View
                      style={[
                        styles.settingIconBg,
                        { backgroundColor: colors.accent + '20' },
                      ]}
                    >
                      <Globe size={16} color={colors.accent} />
                    </View>
                    <AppText
                      variant="body"
                      weight="600"
                      color={colors.textPrimary}
                      style={{ marginHorizontal: 8 }}
                    >
                      {t('settings.language', 'اللغة')}
                    </AppText>
                  </View>

                  {/* Segmented AR / EN Toggle */}
                  <View
                    style={[
                      styles.segmentedContainer,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.05)',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleLanguageChange('ar')}
                      style={[
                        styles.segmentBtn,
                        isAr && {
                          backgroundColor: isDark
                            ? colors.primaryDark
                            : colors.cardBg,
                          ...shadows.sm,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <AppText
                        variant="caption"
                        weight={isAr ? '700' : '500'}
                        color={isAr ? colors.accent : colors.textMuted}
                      >
                        عربي
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleLanguageChange('en')}
                      style={[
                        styles.segmentBtn,
                        !isAr && {
                          backgroundColor: isDark
                            ? colors.primaryDark
                            : colors.cardBg,
                          ...shadows.sm,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <AppText
                        variant="caption"
                        weight={!isAr ? '700' : '500'}
                        color={!isAr ? colors.accent : colors.textMuted}
                      >
                        EN
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Contact Us Row */}
                <TouchableOpacity
                  onPress={handleContactPress}
                  style={[
                    styles.settingActionRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.02)',
                      borderColor: colors.cardBorder,
                      flexDirection: isAr ? 'row-reverse' : 'row',
                    },
                  ]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.settingRowLeft,
                      { flexDirection: isAr ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View
                      style={[
                        styles.settingIconBg,
                        { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                      ]}
                    >
                      <Mail size={16} color="#ef4444" />
                    </View>
                    <View
                      style={{
                        marginHorizontal: 8,
                        alignItems: isAr ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <AppText
                        variant="body"
                        weight="600"
                        color={colors.textPrimary}
                      >
                        {t('settings.contact_us', 'اتصل بنا')}
                      </AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        {t(
                          'settings.contact_us_desc',
                          'الاستفسارات وتعديلات الاجتماعات'
                        )}
                      </AppText>
                    </View>
                  </View>

                  <ChevronIcon size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View
                style={[
                  styles.footerContainer,
                  { borderTopColor: colors.cardBorder },
                ]}
              >
                <AppText variant="caption" color={colors.textMuted} align="center">
                  {t('settings.app_version', 'زمالة المدمنين المجهولين • تطبيق مصر')}
                </AppText>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  accountCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  accountRow: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  accountDetails: {
    flex: 1,
  },
  accountNameRow: {
    alignItems: 'center',
    gap: 6,
  },
  logoutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  loginBanner: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  loginIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTextContainer: {
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 2,
  },
  settingRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  settingRowLeft: {
    alignItems: 'center',
    flex: 1,
  },
  settingIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingActionRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 44,
  },
  footerContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
