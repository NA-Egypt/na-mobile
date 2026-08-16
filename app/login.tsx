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
import { ArrowRight, ArrowLeft, CheckCircle2, Lock } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { NALogo } from '../src/components/NALogo';
import { useAppTheme } from '../src/theme';
import { AppText, Badge, LanguageSwitcher } from '../src/components/ui';
import { haptic } from '../src/utils/haptics';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, borderRadius, shadows } = useAppTheme();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleMicrosoftLogin = async () => {
    haptic.selection();
    setIsAuthenticating(true);
    try {
      const authUrl = 'https://egyptna.org/auth/azure/redirect?redirect_uri=naegypt://auth-callback';
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'naegypt://auth-callback');

      if (result.type === 'success' && result.url) {
        const urlParams = new URLSearchParams(result.url.split('?')[1] || '');
        const token = urlParams.get('token') || urlParams.get('access_token');
        const userJson = urlParams.get('user');

        if (token) {
          await SecureStore.setItemAsync('na_egypt_sanctum_token', token);
          if (userJson) {
            await SecureStore.setItemAsync('na_egypt_user_data', decodeURIComponent(userJson));
          }
          haptic.success();
          Alert.alert(
            isAr ? 'نجاح تسجيل الدخول' : 'Sign In Successful',
            isAr ? 'تم تسجيل الدخول بنجاح بحساب مايكروسوفت الخادمي.' : 'Signed in successfully with your Microsoft Servant account.'
          );
          router.back();
          return;
        }
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }

      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه المصادقة' : 'Authentication Notice',
        isAr
          ? 'لم يتم استلام رمز المصادقة من الخادم. يرجى التأكد من تفعيل مسار GET /auth/azure/redirect على الخادم.'
          : 'Authentication token not received. Please verify the backend GET /auth/azure/redirect route.'
      );
    } catch (error: any) {
      console.warn('OAuth Error:', error);
      haptic.error();
      Alert.alert(
        isAr ? 'خطأ في الاتصال' : 'Connection Error',
        isAr ? 'تعذر إتمام عملية الدخول عبر مايكروسوفت. يرجى المحاولة مرة أخرى.' : 'Could not complete Microsoft sign in. Please try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
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
          {isAr ? <ArrowRight size={20} color={colors.textPrimary} /> : <ArrowLeft size={20} color={colors.textPrimary} />}
        </TouchableOpacity>
        <LanguageSwitcher />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <AppText variant="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
            {isAr
              ? 'تسجيل الدخول الموحد (SSO) للاطلاع على جداول أعمال الهيئات الخدمية، محاضر الاجتماعات والتقارير الإقليمية.'
              : 'Single Sign-On (SSO) to view Service Body Agendas, Meeting Minutes, and Regional Committee Reports.'}
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
            <Lock size={16} color={colors.accentDark} style={{ marginEnd: 6 }} />
            <AppText variant="h4" color={colors.textPrimary} weight="700">
              {isAr ? 'المصادقة المؤسسية الآمنة' : 'Secure Organizational Auth'}
            </AppText>
          </View>

          {/* Microsoft Login Button */}
          <TouchableOpacity
            style={[styles.microsoftButton, { borderRadius: borderRadius.md }]}
            onPress={handleMicrosoftLogin}
            disabled={isAuthenticating}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={isAr ? 'تسجيل الدخول بحساب مايكروسوفت' : 'Sign in with Microsoft'}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#ffffff" />
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

          {/* Guidelines */}
          <View style={[styles.featuresList, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                {isAr ? 'الوصول المباشر لأجندات اللجان الفرعية' : 'Direct access to Sub-committee Agendas'}
              </AppText>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                {isAr ? 'قراءة وتحميل التقارير المالية والخدمية' : 'Read & download H&I and Treasury reports'}
              </AppText>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                {isAr ? 'خاص بحسابات @egyptna.org المعتمدة' : 'Exclusive to verified @egyptna.org accounts'}
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
    minHeight: 50,
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
    fontSize: 14,
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
});
