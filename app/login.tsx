import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Smartphone,
  RefreshCw,
} from 'lucide-react-native';
import { NALogo } from '../src/components/NALogo';
import { useAppTheme } from '../src/theme';
import { AppText, Badge, LanguageSwitcher } from '../src/components/ui';
import { haptic } from '../src/utils/haptics';
import { azureAuthService } from '../src/services/azureAuthService';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, borderRadius, shadows } = useAppTheme();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);

  const handleMicrosoftLogin = async () => {
    haptic.selection();
    setIsAuthenticating(true);
    setAuthStatusMessage(
      isAr
        ? 'جاري الاتصال بحسابات مايكروسوفت وتطبيق Authenticator...'
        : 'Connecting to Microsoft & Authenticator Broker...'
    );

    try {
      const result = await azureAuthService.loginInteractive();

      if (result.cancelled) {
        setAuthStatusMessage(null);
        return;
      }

      if (result.success && result.sanctumToken) {
        haptic.success();
        const servantName = result.user?.name || (isAr ? 'خادم معتمد' : 'Trusted Servant');
        Alert.alert(
          isAr ? 'نجاح تسجيل الدخول' : 'Sign In Successful',
          isAr
            ? `مرحباً بك، ${servantName}. تم تسجيل الدخول بنجاح بحساب مايكروسوفت المؤسسي.`
            : `Welcome, ${servantName}. Signed in successfully with your Microsoft Servant account.`
        );
        router.back();
        return;
      }

      // Handle failure
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه المصادقة' : 'Authentication Notice',
        result.error ||
        (isAr
          ? 'تعذر إتمام عملية الدخول عبر مايكروسوفت. يرجى المحاولة مرة أخرى.'
          : 'Could not complete Microsoft sign in. Please try again.')
      );
    } catch (error: any) {
      console.warn('OAuth Error:', error);
      haptic.error();
      Alert.alert(
        isAr ? 'خطأ في الاتصال' : 'Connection Error',
        isAr
          ? 'تعذر الاتصال بخدمة مايكروسوفت أو خادم NA Egypt. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.'
          : 'Could not connect to Microsoft or NA Egypt server. Please verify your internet connection.'
      );
    } finally {
      setIsAuthenticating(false);
      setAuthStatusMessage(null);
    }
  };

  const handleWebFallbackLogin = async () => {
    haptic.light();
    setIsAuthenticating(true);
    setAuthStatusMessage(
      isAr
        ? 'جاري فتح بوابة الويب البديلة للدخول...'
        : 'Opening web authentication portal...'
    );

    try {
      const result = await azureAuthService.loginWithBackendRedirect();
      if (result.cancelled) {
        return;
      }

      if (result.success) {
        haptic.success();
        Alert.alert(
          isAr ? 'نجاح تسجيل الدخول' : 'Sign In Successful',
          isAr
            ? 'تم تسجيل الدخول بنجاح عبر بوابة الويب.'
            : 'Signed in successfully via Web portal.'
        );
        router.back();
      } else {
        Alert.alert(
          isAr ? 'فشل تسجيل الدخول' : 'Sign In Failed',
          result.error || (isAr ? 'تعذر إتمام الدخول' : 'Failed to authenticate')
        );
      }
    } catch (e) {
      Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'حدث خطأ غير متوقع' : 'Unexpected error');
    } finally {
      setIsAuthenticating(false);
      setAuthStatusMessage(null);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            haptic.light();
            router.back();
          }}
          style={[styles.backIconBtn, { backgroundColor: colors.cardBg }]}
          accessibilityRole="button"
          accessibilityLabel={isAr ? 'رجوع' : 'Back'}
        >
          {isAr ? (
            <ArrowRight size={20} color={colors.textPrimary} />
          ) : (
            <ArrowLeft size={20} color={colors.textPrimary} />
          )}
        </TouchableOpacity>
        <LanguageSwitcher />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Branding */}
        <View style={styles.headerArea}>
          <View style={styles.logoBox}>
            <NALogo size={68} />
          </View>
          <AppText variant="h2" color={colors.primary} weight="800" align="center">
            {isAr ? 'زمالة المدمنين المجهولين في مصر' : 'Narcotics Anonymous - Egypt'}
          </AppText>
          <Badge
            label={isAr ? 'بوابة خادمي المجموعات واللجان' : 'Trusted Servants Portal'}
            variant="accent"
            size="md"
            style={{ marginVertical: 8 }}
          />
          <AppText
            variant="body"
            color={colors.textSecondary}
            align="center"
            style={styles.subtitle}
          >
            {isAr
              ? 'تسجيل الدخول الموحد (Microsoft SSO) للاطلاع على جداول أعمال الالمنتديات أو المناطق الخدمية، محاضر الاجتماعات والتقارير الإقليمية.'
              : 'Single Sign-On (Microsoft SSO) to view Service Body Agendas, Meeting Minutes, and Regional Committee Reports.'}
          </AppText>
        </View>

        {/* Microsoft SSO Card */}
        <View
          style={[
            styles.mainCard,
            shadows.card,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              borderRadius: borderRadius.card,
            },
          ]}
        >
          <View style={styles.lockRow}>
            <ShieldCheck size={18} color={colors.accentDark} style={{ marginEnd: 6 }} />
            <AppText variant="h4" color={colors.textPrimary} weight="700">
              {isAr ? 'المصادقة المؤسسية الآمنة' : 'Secure Organizational Auth'}
            </AppText>
          </View>

          {/* Microsoft Login Button */}
          <TouchableOpacity
            style={[
              styles.microsoftButton,
              { borderRadius: borderRadius.md, opacity: isAuthenticating ? 0.8 : 1 },
            ]}
            onPress={handleMicrosoftLogin}
            disabled={isAuthenticating}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={
              isAr ? 'تسجيل الدخول بحساب مايكروسوفت' : 'Sign in with Microsoft'
            }
          >
            {isAuthenticating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#ffffff" size="small" style={{ marginEnd: 10 }} />
                <AppText variant="body" color="#ffffff" weight="600" style={styles.msButtonText}>
                  {isAr ? 'جاري التحقق والمصادقة...' : 'Authenticating...'}
                </AppText>
              </View>
            ) : (
              <View style={styles.msButtonContent}>
                {/* Official 4-Color Microsoft Square */}
                <View style={styles.msLogo}>
                  <View style={[styles.msSquare, { backgroundColor: '#F25022' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#7FBA00' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#00A4EF' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#FFB900' }]} />
                </View>
                <AppText variant="body" color="#ffffff" weight="700" style={styles.msButtonText}>
                  {isAr ? 'تسجيل الدخول بحساب مايكروسوفت' : 'Sign in with Microsoft'}
                </AppText>
              </View>
            )}
          </TouchableOpacity>

          {/* Broker Status Helper */}
          {authStatusMessage ? (
            <View style={styles.statusBox}>
              <Smartphone size={14} color={colors.primary} style={{ marginEnd: 6 }} />
              <AppText variant="caption" color={colors.primary} weight="600" style={{ flex: 1 }}>
                {authStatusMessage}
              </AppText>
            </View>
          ) : null}

          {/* Guidelines & Features */}
          <View style={[styles.featuresList, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                {isAr ? 'دعم Microsoft Authenticator واختيار الحساب المباشر' : 'Microsoft Authenticator & Account Picker support'}
              </AppText>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                {isAr ? 'الوصول المباشر لأجندات اللجان وتقارير الالمنتديات أو المناطق الخدمية' : 'Direct access to Sub-committee Agendas & reports'}
              </AppText>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                {isAr ? 'خاص ومقيد بحسابات @egyptna.org المعتمدة' : 'Exclusive to verified @egyptna.org accounts'}
              </AppText>
            </View>
          </View>

          {/* Fallback Web Portal Option */}
          <TouchableOpacity
            style={styles.fallbackBtn}
            onPress={handleWebFallbackLogin}
            disabled={isAuthenticating}
            activeOpacity={0.7}
          >
            <RefreshCw size={13} color={colors.textMuted} style={{ marginEnd: 6 }} />
            <AppText variant="caption" color={colors.textMuted} weight="500">
              {isAr ? 'استخدام بوابة الويب البديلة' : 'Use web redirect fallback'}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 4,
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  mainCard: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  microsoftButton: {
    backgroundColor: '#2F2F2F',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msLogo: {
    width: 18,
    height: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginEnd: 10,
  },
  msSquare: {
    width: 8,
    height: 8,
  },
  msButtonText: {
    fontSize: 15,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4f7fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  featuresList: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginEnd: 8,
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
});
