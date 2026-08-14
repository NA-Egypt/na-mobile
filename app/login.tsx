import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ShieldCheck, CheckCircle2, Lock, Sparkles } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { NALogo } from '../src/components/NALogo';
import { colors, spacing, borderRadius, typography, shadows } from '../src/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleMicrosoftLogin = async () => {
    setIsAuthenticating(true);
    try {
      // Direct SSO Browser Redirect to Egypt NA Azure AD endpoint
      const authUrl = 'https://egyptna.org/auth/azure/redirect?redirect_uri=naegypt://auth-callback';
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'naegypt://auth-callback');

      if (result.type === 'success' && result.url) {
        // Extract token and user from redirect URI callback
        const urlParams = new URLSearchParams(result.url.split('?')[1] || '');
        const token = urlParams.get('token') || urlParams.get('access_token');
        const userJson = urlParams.get('user');

        if (token) {
          await SecureStore.setItemAsync('na_egypt_sanctum_token', token);
          if (userJson) {
            await SecureStore.setItemAsync('na_egypt_user_data', decodeURIComponent(userJson));
          }
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

      Alert.alert(
        isAr ? 'تنبيه المصادقة' : 'Authentication Notice',
        isAr
          ? 'لم يتم استلام رمز المصادقة من الخادم. يرجى التأكد من تفعيل مسار GET /auth/azure/redirect على الخادم.'
          : 'Authentication token not received. Please verify the backend GET /auth/azure/redirect route.'
      );
    } catch (error: any) {
      console.warn('OAuth Error:', error);
      Alert.alert(
        isAr ? 'خطأ في الاتصال' : 'Connection Error',
        isAr ? 'تعذر إتمام عملية الدخول عبر مايكروسوفت. يرجى المحاولة مرة أخرى.' : 'Could not complete Microsoft sign in. Please try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Branding */}
        <View style={styles.headerArea}>
          <View style={styles.logoBox}>
            <NALogo size={72} />
          </View>
          <Text style={styles.title}>
            {isAr ? 'زمالة المدمنين المجهولين في مصر' : 'Narcotics Anonymous - Egypt'}
          </Text>
          <Text style={styles.portalTag}>
            {isAr ? 'بوابة خادمي المجموعات واللجان' : 'Trusted Servants Portal'}
          </Text>
          <Text style={styles.subtitle}>
            {isAr
              ? 'تسجيل الدخول الموحد (SSO) للاطلاع على جداول أعمال الهيئات الخدمية، محاضر الاجتماعات والتقارير الإقليمية.'
              : 'Single Sign-On (SSO) to view Service Body Agendas, Meeting Minutes, and Regional Committee Reports.'}
          </Text>
        </View>

        {/* Microsoft SSO Card */}
        <View style={[styles.mainCard, shadows.card]}>
          <View style={styles.lockRow}>
            <Lock size={18} color={colors.primary} style={{ marginEnd: 6 }} />
            <Text style={styles.cardHeader}>
              {isAr ? 'المصادقة المؤسسية الآمنة' : 'Secure Organizational Auth'}
            </Text>
          </View>

          {/* Microsoft Login Button */}
          <TouchableOpacity
            style={styles.microsoftButton}
            onPress={handleMicrosoftLogin}
            disabled={isAuthenticating}
            activeOpacity={0.88}
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
                <Text style={styles.msButtonText}>
                  {isAr ? 'تسجيل الدخول بحساب مايكروسوفت' : 'Sign in with Microsoft'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Guidelines */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <Text style={styles.featureText}>
                {isAr ? 'الوصول المباشر لأجندات اللجان الفرعية' : 'Direct access to Sub-committee Agendas'}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <Text style={styles.featureText}>
                {isAr ? 'قراءة وتحميل التقارير المالية والخدمية' : 'Read & download H&I and Treasury reports'}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color={colors.success} style={styles.checkIcon} />
              <Text style={styles.featureText}>
                {isAr ? 'خاص بحسابات @egyptna.org المعتمدة' : 'Exclusive to verified @egyptna.org accounts'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowRight size={18} color={colors.textSecondary} style={{ marginEnd: 4 }} />
          <Text style={styles.backText}>{isAr ? 'الرجوع للرئيسية' : 'Back to Home'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fbff',
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBox: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
  },
  portalTag: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    lineHeight: 22,
  },
  mainCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardHeader: {
    ...typography.h3,
    color: colors.primary,
  },
  microsoftButton: {
    backgroundColor: '#2F2F2F',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msLogo: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginEnd: spacing.sm + 4,
  },
  msSquare: {
    width: 9,
    height: 9,
  },
  msButtonText: {
    ...typography.body,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  featuresList: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.08)',
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginEnd: spacing.xs + 2,
  },
  featureText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
