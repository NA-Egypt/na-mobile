import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
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
  ShieldCheck,
  Smartphone,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react-native';
import { NALogo } from '../src/components/NALogo';
import { useAppTheme } from '../src/theme';
import { AppText, Badge, LanguageSwitcher, MicrosoftLogo } from '../src/components/ui';
import { haptic } from '../src/utils/haptics';
import { azureAuthService } from '../src/services/azureAuthService';

export default function LoginScreen() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, borderRadius, shadows, isDark } = useAppTheme();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [successServantName, setSuccessServantName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMicrosoftLogin = async () => {
    if (isAuthenticating || successServantName) return;

    haptic.selection();
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const result = await azureAuthService.loginInteractive();

      // Silent cancellation: if user dismissed or cancelled, reset quietly
      if (result.cancelled) {
        setIsAuthenticating(false);
        return;
      }

      if (result.success && result.sanctumToken) {
        haptic.success();
        const servantName =
          result.user?.name || (isAr ? 'خادم مؤتمن' : 'Trusted Servant');
        setSuccessServantName(servantName);
        setIsAuthenticating(false);

        // Auto-dismiss smoothly after brief visual feedback
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/agendas');
          }
        }, 750);
        return;
      }

      // Handle explicit auth error
      haptic.warning();
      setErrorMessage(
        result.error ||
          (isAr
            ? 'تعذر إتمام تسجيل الدخول عبر مايكروسوفت. يرجى المحاولة مرة أخرى.'
            : 'Could not complete Microsoft sign-in. Please try again.')
      );
    } catch (error: any) {
      console.warn('OAuth Error:', error);
      haptic.error();
      setErrorMessage(
        isAr
          ? 'تعذر الاتصال بخدمة مايكروسوفت أو خادم NA Egypt. يرجى التأكد من اتصالك بالإنترنت.'
          : 'Could not connect to Microsoft or NA Egypt server. Please verify your connection.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      edges={['top', 'bottom']}
    >
      {/* Top Bar */}
      <View style={[styles.topBar, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          onPress={() => {
            haptic.light();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/agendas');
            }
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
        {/* Branding Area */}
        <View style={styles.headerArea}>
          <View style={styles.logoBox}>
            <NALogo size={64} />
          </View>
          <AppText variant="h2" color={colors.primary} weight="800" align="center">
            {isAr ? 'زمالة المدمنين المجهولين' : 'Narcotics Anonymous'}
          </AppText>
          <AppText
            variant="h4"
            color={colors.textSecondary}
            weight="600"
            align="center"
            style={{ marginTop: 2 }}
          >
            {isAr ? 'مصر • NA Egypt' : 'Egypt Fellowship'}
          </AppText>

          <Badge
            label={isAr ? 'بوابة الخدام الموثوقين' : 'Trusted Servants Portal'}
            variant="accent"
            size="md"
            style={{ marginVertical: 12 }}
          />

          <AppText
            variant="body"
            color={colors.textSecondary}
            align="center"
            style={styles.subtitle}
          >
            {isAr
              ? 'تسجيل الدخول المؤسسي الموحد (Microsoft SSO) للاطلاع على أجندات اللجان وتقارير المناطق الخدمية.'
              : 'Single Sign-On (Microsoft SSO) to view Service Body Agendas, Minutes, and Committee Reports.'}
          </AppText>
        </View>

        {/* Main Authentication Card */}
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
          <View style={[styles.cardHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <ShieldCheck size={20} color={colors.accentDark} />
            <AppText
              variant="h4"
              color={colors.textPrimary}
              weight="700"
              style={{ marginHorizontal: 8 }}
            >
              {isAr ? 'المصادقة المؤسسية المعتمدة' : 'Verified Servant Authentication'}
            </AppText>
          </View>

          {/* Success Banner */}
          {successServantName ? (
            <View
              style={[
                styles.successBanner,
                { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#edfbf2' },
              ]}
            >
              <CheckCircle2 size={24} color={colors.success} />
              <View style={[styles.successTextContainer, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                <AppText variant="body" color={colors.success} weight="700">
                  {isAr ? 'تم تسجيل الدخول بنجاح!' : 'Successfully Signed In!'}
                </AppText>
                <AppText variant="caption" color={colors.textPrimary} weight="600">
                  {isAr ? `مرحباً بك، ${successServantName}` : `Welcome, ${successServantName}`}
                </AppText>
              </View>
            </View>
          ) : (
            <>
              {/* Error Notice if any */}
              {errorMessage ? (
                <View
                  style={[
                    styles.errorBanner,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#fef2f2' },
                  ]}
                >
                  <AlertCircle size={18} color={colors.danger} style={{ marginEnd: 8 }} />
                  <AppText
                    variant="caption"
                    color={colors.danger}
                    weight="600"
                    style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }}
                  >
                    {errorMessage}
                  </AppText>
                </View>
              ) : null}

              {/* Single Microsoft Sign-In Button */}
              <TouchableOpacity
                style={[
                  styles.microsoftButton,
                  {
                    borderRadius: borderRadius.md,
                    opacity: isAuthenticating ? 0.85 : 1,
                  },
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
                    <AppText variant="body" color="#ffffff" weight="600">
                      {isAr ? 'جاري الاتصال بمايكروسوفت...' : 'Connecting to Microsoft...'}
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.msButtonContent}>
                    <MicrosoftLogo size={20} style={{ marginEnd: 12 }} />
                    <AppText variant="body" color="#ffffff" weight="700">
                      {isAr ? 'تسجيل الدخول بحساب مايكروسوفت' : 'Sign in with Microsoft'}
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Value Props & Servant Guidelines */}
          <View style={[styles.featuresList, { borderTopColor: colors.borderSubtle }]}>
            <View style={[styles.featureItem, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Smartphone size={16} color={colors.primary} style={isAr ? styles.featureIconAr : styles.featureIconEn} />
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={[styles.featureText, { textAlign: isAr ? 'right' : 'left' }]}
              >
                {isAr
                  ? 'دعم مباشر لتطبيق Microsoft Authenticator وتحديد الحساب'
                  : 'Direct Microsoft Authenticator & Account Picker support'}
              </AppText>
            </View>

            <View style={[styles.featureItem, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <FileText size={16} color={colors.primary} style={isAr ? styles.featureIconAr : styles.featureIconEn} />
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={[styles.featureText, { textAlign: isAr ? 'right' : 'left' }]}
              >
                {isAr
                  ? 'الاطلاع على جداول أعمال ومحاضر اجتماعات اللجان والمناطق'
                  : 'Instant access to Live Agendas, Minutes & Archive'}
              </AppText>
            </View>

            <View style={[styles.featureItem, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <UserCheck size={16} color={colors.success} style={isAr ? styles.featureIconAr : styles.featureIconEn} />
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={[styles.featureText, { textAlign: isAr ? 'right' : 'left' }]}
              >
                {isAr
                  ? 'خاص ومقيد بالبريد الإلكتروني المعتمد @naegypt.org'
                  : 'Exclusively restricted to authorized @naegypt.org accounts'}
              </AppText>
            </View>
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    marginBottom: 10,
  },
  subtitle: {
    marginTop: 4,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  mainCard: {
    width: '100%',
    padding: 22,
    borderWidth: 1,
  },
  cardHeaderRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  microsoftButton: {
    backgroundColor: '#2F2F2F',
    paddingVertical: 14,
    paddingHorizontal: 20,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  successTextContainer: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  featuresList: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    gap: 14,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIconAr: {
    marginStart: 10,
  },
  featureIconEn: {
    marginEnd: 10,
  },
  featureText: {
    flex: 1,
    lineHeight: 18,
  },
});
