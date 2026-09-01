import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import {
  Lock,
  LogOut,
  FileText,
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Eye,
  FolderX,
  Calendar,
  User,
  Users,
  Building2,
  FileArchive,
  DownloadCloud,
  RefreshCw,
  HeartHandshake,
  UserPlus,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  WifiOff,
} from 'lucide-react-native';
import { UserProfile } from '../../src/api/auth';
import { apiClient } from '../../src/api/client';
import { agendasApi } from '../../src/api/agendas';
import { reportsApi } from '../../src/api/reports';
import { azureAuthService } from '../../src/services/azureAuthService';
import { useAppTheme } from '../../src/theme';
import {
  AppText,
  Badge,
  AppButton,
  EmptyState,
  Skeleton,
  AppHeader,
  MicrosoftLogo,
} from '../../src/components/ui';
import { haptic } from '../../src/utils/haptics';

type AgendaTabType = 'groups' | 'service_bodies' | 'committees_archive';

function cleanHtmlText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function AgendasScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, borderRadius, shadows, isDark } = useAppTheme();

  const [activeTab, setActiveTab] = useState<AgendaTabType>('groups');
  const [user, setUser] = useState<UserProfile | null>(null);

  const [groupAgendas, setGroupAgendas] = useState<any[]>([]);
  const [serviceBodyAgendas, setServiceBodyAgendas] = useState<any[]>([]);
  const [committeeReports, setCommitteeReports] = useState<any[]>([]);
  const [tabForbidden, setTabForbidden] = useState<Record<AgendaTabType, boolean>>({
    groups: false,
    service_bodies: false,
    committees_archive: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOfflineError, setIsOfflineError] = useState(false);

  // Selected item modal & live detail fetching
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchAllData = async (currentUser?: UserProfile | null) => {
    const activeUser = currentUser !== undefined ? currentUser : user;
    if (!activeUser) {
      setGroupAgendas([]);
      setServiceBodyAgendas([]);
      setCommitteeReports([]);
      setIsLoading(false);
      setIsRefreshing(false);
      setIsOfflineError(false);
      return;
    }

    // Check live internet connectivity
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setIsOfflineError(true);
        setGroupAgendas([]);
        setServiceBodyAgendas([]);
        setCommitteeReports([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
    } catch {
      // Continue if NetInfo check has issues
    }

    setIsLoading(true);
    setIsOfflineError(false);
    setTabForbidden({ groups: false, service_bodies: false, committees_archive: false });

    try {
      const [agendasRes, sbRes, reportsRes] = await Promise.allSettled([
        apiClient.get('/agendas', { params: { per_page: 100 } }),
        apiClient.get('/service-body-agendas', { params: { per_page: 100 } }),
        apiClient.get('/committee-reports', { params: { per_page: 100 } }),
      ]);

      let hasNetworkFailure = false;

      if (agendasRes.status === 'fulfilled') {
        const data = agendasRes.value.data?.data || agendasRes.value.data || [];
        setGroupAgendas(Array.isArray(data) ? data : []);
      } else {
        const status = (agendasRes.reason as any)?.response?.status;
        if (status === 403) {
          setTabForbidden((prev) => ({ ...prev, groups: true }));
        } else if (!status) {
          hasNetworkFailure = true;
        }
        setGroupAgendas([]);
      }

      if (sbRes.status === 'fulfilled') {
        const data = sbRes.value.data?.data || sbRes.value.data || [];
        setServiceBodyAgendas(Array.isArray(data) ? data : []);
      } else {
        const status = (sbRes.reason as any)?.response?.status;
        if (status === 403) {
          setTabForbidden((prev) => ({ ...prev, service_bodies: true }));
        } else if (!status) {
          hasNetworkFailure = true;
        }
        setServiceBodyAgendas([]);
      }

      if (reportsRes.status === 'fulfilled') {
        const data = reportsRes.value.data?.data || reportsRes.value.data || [];
        setCommitteeReports(Array.isArray(data) ? data : []);
      } else {
        const status = (reportsRes.reason as any)?.response?.status;
        if (status === 403) {
          setTabForbidden((prev) => ({ ...prev, committees_archive: true }));
        } else if (!status) {
          hasNetworkFailure = true;
        }
        setCommitteeReports([]);
      }

      if (hasNetworkFailure && agendasRes.status === 'rejected' && sbRes.status === 'rejected' && reportsRes.status === 'rejected') {
        setIsOfflineError(true);
      }
    } catch (e) {
      console.warn('Error loading agendas/reports live:', e);
      setIsOfflineError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      azureAuthService.checkSilentAuth().then((stored) => {
        setUser(stored);
        if (stored) {
          fetchAllData(stored);
        } else {
          setGroupAgendas([]);
          setServiceBodyAgendas([]);
          setCommitteeReports([]);
          setIsOfflineError(false);
        }
      });
    }, [])
  );

  const handleLogout = () => {
    haptic.selection();
    Alert.alert(
      isAr ? 'تسجيل الخروج الخدمي' : 'Servant Sign Out',
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
            setGroupAgendas([]);
            setServiceBodyAgendas([]);
            setCommitteeReports([]);
          },
        },
        {
          text: isAr ? 'خروج مايكروسوفت الكامل' : 'Full Microsoft Sign-out',
          style: 'destructive',
          onPress: async () => {
            haptic.warning();
            await azureAuthService.signOut(true);
            setUser(null);
            setGroupAgendas([]);
            setServiceBodyAgendas([]);
            setCommitteeReports([]);
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    haptic.light();
    await fetchAllData();
  };

  // Open item and fetch complete live API details
  const handleOpenItem = async (item: any, modalType: 'group' | 'service_body' | 'committee', defaultTitle: string) => {
    haptic.selection();
    setSelectedItem({ ...item, resolvedTitle: defaultTitle, modalType, loadedFromApi: false });
    setIsLoadingDetails(true);

    try {
      if (modalType === 'group' && item.id) {
        const full = await agendasApi.getGroupAgenda(item.id);
        if (full) {
          setSelectedItem((prev: any) => ({
            ...prev,
            ...full,
            resolvedTitle: defaultTitle,
            modalType,
            loadedFromApi: true,
          }));
        }
      } else if (modalType === 'service_body' && item.id) {
        const full = await agendasApi.getServiceBodyAgenda(item.id);
        if (full) {
          setSelectedItem((prev: any) => ({
            ...prev,
            ...full,
            resolvedTitle: defaultTitle,
            modalType,
            loadedFromApi: true,
          }));
        }
      } else if (modalType === 'committee' && item.id) {
        const full = await reportsApi.getCommitteeReport(item.id);
        if (full) {
          setSelectedItem((prev: any) => ({
            ...prev,
            ...full,
            resolvedTitle: defaultTitle,
            modalType,
            loadedFromApi: true,
          }));
        }
      }
    } catch (e) {
      console.warn('Could not load extra item details live:', e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const currentList = (
    activeTab === 'groups'
      ? groupAgendas
      : activeTab === 'service_bodies'
        ? serviceBodyAgendas
        : committeeReports
  ).filter((item): item is Record<string, any> => Boolean(item && typeof item === 'object'));

  return (
    <View style={[styles.screenWrapper, { backgroundColor: isDark ? colors.bgDark : colors.primaryDark }]}>
      <AppHeader
        title={isAr ? 'جداول الأعمال والأرشيف' : 'Agendas & Reports'}
        subtitle={isAr ? 'مصر • أرشيف الخدمة المباشر' : 'Egypt • Live Service Archive'}
        bottomSlot={
          <View style={styles.tabSelectorWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabSelectorContainer}
            >
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'groups' && [styles.tabButtonActive, { backgroundColor: isDark ? colors.cardBg : '#ffffff' }],
                ]}
                onPress={() => {
                  haptic.selection();
                  setActiveTab('groups');
                }}
                activeOpacity={0.8}
              >
                <FileText
                  size={14}
                  color={activeTab === 'groups' ? (isDark ? '#38bdf8' : colors.primary) : '#ffffff'}
                  style={{ marginEnd: 6 }}
                />
                <AppText
                  variant="label"
                  color={activeTab === 'groups' ? (isDark ? '#38bdf8' : colors.primary) : '#ffffff'}
                  weight="700"
                >
                  {isAr ? 'أجندات المجموعات' : 'Group Agendas'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'service_bodies' && [styles.tabButtonActive, { backgroundColor: isDark ? colors.cardBg : '#ffffff' }],
                ]}
                onPress={() => {
                  haptic.selection();
                  setActiveTab('service_bodies');
                }}
                activeOpacity={0.8}
              >
                <Building2
                  size={14}
                  color={activeTab === 'service_bodies' ? (isDark ? '#38bdf8' : colors.primary) : '#ffffff'}
                  style={{ marginEnd: 6 }}
                />
                <AppText
                  variant="label"
                  color={activeTab === 'service_bodies' ? (isDark ? '#38bdf8' : colors.primary) : '#ffffff'}
                  weight="700"
                >
                  {isAr ? 'المنتديات أو المناطق' : 'Service Bodies'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'committees_archive' && [styles.tabButtonActive, { backgroundColor: isDark ? colors.cardBg : '#ffffff' }],
                ]}
                onPress={() => {
                  haptic.selection();
                  setActiveTab('committees_archive');
                }}
                activeOpacity={0.8}
              >
                <FileArchive
                  size={14}
                  color={activeTab === 'committees_archive' ? (isDark ? '#38bdf8' : colors.primary) : '#ffffff'}
                  style={{ marginEnd: 6 }}
                />
                <AppText
                  variant="label"
                  color={activeTab === 'committees_archive' ? (isDark ? '#38bdf8' : colors.primary) : '#ffffff'}
                  weight="700"
                >
                  {isAr ? 'أرشيف اللجان' : 'Committees Archive'}
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        }
      />

      <View style={[styles.contentBody, { backgroundColor: colors.bgPrimary }]}>
        {/* User Auth Status Bar */}
        <View style={styles.authStatusContainer}>
          {user ? (
            <View
              style={[
                styles.loggedInCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <View style={[styles.userAvatar, { backgroundColor: colors.successLight }]}>
                <CheckCircle2 size={20} color={colors.success} />
              </View>
              <View style={styles.userInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <AppText variant="body" color={colors.textPrimary} weight="700">
                    {user.name || (isAr ? 'خادم مؤتمن' : 'Trusted Servant')}
                  </AppText>
                  <Badge
                    label={isAr ? 'حساب مايكروسوفت معتمد' : 'Verified MS Account'}
                    variant="accent"
                    size="sm"
                  />
                </View>
                <AppText variant="caption" color={colors.textSecondary}>
                  {user.email}
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                accessibilityRole="button"
                accessibilityLabel="Log out"
              >
                <LogOut size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.lockCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <View style={[styles.lockIconBox, { backgroundColor: colors.accentLight }]}>
                <Lock size={18} color={colors.accentDark} />
              </View>
              <View style={styles.lockInfo}>
                <AppText variant="body" color={colors.textPrimary} weight="700">
                  {isAr ? 'بوابة خدم اللجان والمجموعات' : 'Trusted Servants Portal'}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  {isAr
                    ? 'سجل دخولك بحساب مايكروسوفت للاطلاع على أرشيف الخدمة المباشر'
                    : 'Sign in with Microsoft to access live service archives'}
                </AppText>
              </View>
              <TouchableOpacity
                style={[
                  styles.msSmallLoginBtn,
                  { backgroundColor: '#2F2F2F', borderRadius: borderRadius.sm },
                ]}
                onPress={() => {
                  haptic.selection();
                  router.push('/login');
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('agendas.login_prompt')}
              >
                <MicrosoftLogo size={14} style={{ marginEnd: 6 }} />
                <AppText variant="caption" color="#ffffff" weight="700">
                  {t('agendas.login_prompt')}
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Main Content Area */}
        {!user ? (
          <ScrollView contentContainerStyle={styles.loggedOutScrollContent}>
            <View
              style={[
                styles.loggedOutCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <View style={[styles.lockLargeIcon, { backgroundColor: colors.accentLight }]}>
                <Lock size={30} color={colors.accentDark} />
              </View>
              <AppText variant="h3" color={colors.textPrimary} weight="800" style={{ textAlign: 'center', marginBottom: 6 }}>
                {activeTab === 'groups'
                  ? isAr
                    ? 'أجندات المجموعات - خدم المجموعات'
                    : 'Group Agendas - Trusted Servants'
                  : activeTab === 'service_bodies'
                    ? isAr
                      ? 'أجندات المنتديات أو المناطق'
                      : 'Service Body Agendas'
                    : isAr
                      ? 'أرشيف تقارير اللجان الخدمية'
                      : 'Committee Reports Archive'}
              </AppText>
              <AppText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
                {isAr
                  ? 'هذا القسم مخصص للخدم المؤتمن في زمالة المدمنين المجهولين في مصر. يرجى تسجيل الدخول بحساب Microsoft المؤسسي المرتبط بـ naegypt.org. للاطلاع على البيانات والتقارير المتاحة لخدمتك مباشرة عبر الإنترنت.'
                  : 'This section is strictly restricted to verified NA Egypt servants. Please sign in with your official naegypt.org Microsoft account to access live reports and agendas permitted for your role.'}
              </AppText>
              <TouchableOpacity
                style={[
                  styles.msPrimaryLoginBtn,
                  { backgroundColor: '#2F2F2F', borderRadius: borderRadius.md },
                ]}
                onPress={() => {
                  haptic.selection();
                  router.push('/login');
                }}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={t('agendas.login_prompt')}
              >
                <MicrosoftLogo size={18} style={{ marginEnd: 10 }} />
                <AppText variant="body" color="#ffffff" weight="700">
                  {isAr ? 'تسجيل الدخول بحساب مايكروسوفت' : 'Sign in with Microsoft'}
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : isOfflineError ? (
          /* Offline / Active Internet Required Banner */
          <ScrollView contentContainerStyle={styles.loggedOutScrollContent}>
            <View
              style={[
                styles.loggedOutCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <View style={[styles.lockLargeIcon, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <WifiOff size={30} color={colors.danger} />
              </View>
              <AppText variant="h3" color={colors.textPrimary} weight="800" style={{ textAlign: 'center', marginBottom: 6 }}>
                {t('agendas.online_only_title')}
              </AppText>
              <AppText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
                {t('agendas.network_required')}
              </AppText>
              <AppButton
                title={t('agendas.retry')}
                onPress={handleRefresh}
                variant="primary"
                size="md"
                icon={<RefreshCw size={16} color="#ffffff" />}
                style={{ minWidth: 180 }}
              />
            </View>
          </ScrollView>
        ) : tabForbidden[activeTab] ? (
          <ScrollView contentContainerStyle={styles.loggedOutScrollContent}>
            <View
              style={[
                styles.loggedOutCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <View style={[styles.lockLargeIcon, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <ShieldAlert size={30} color={colors.danger} />
              </View>
              <AppText variant="h3" color={colors.textPrimary} weight="800" style={{ textAlign: 'center', marginBottom: 6 }}>
                {isAr ? 'الصلاحية غير متوفرة لهذا الحساب' : 'Access Restricted for Your Role'}
              </AppText>
              <AppText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', lineHeight: 22, marginBottom: 16 }}>
                {isAr
                  ? `يتطلب هذا القسم صلاحيات محددة (مثل RSC أو كيان خدمي). رتبتك المسجلة حالياً: ${user.roles?.join(', ') || (isAr ? 'خادم موثوق' : 'Servant')}.`
                  : `This section requires specific permissions (RSC or Service Body). Your registered role: ${user.roles?.join(', ') || 'Servant'}.`}
              </AppText>
              <AppButton
                title={isAr ? 'تحديث الصلاحيات' : 'Refresh Permissions'}
                onPress={handleRefresh}
                variant="outline"
                size="sm"
                icon={<RefreshCw size={14} color={colors.primary} />}
              />
            </View>
          </ScrollView>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <View
              style={[
                styles.card,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <Skeleton width="40%" height={20} borderRadius={10} style={{ marginBottom: 12 }} />
              <Skeleton width="80%" height={22} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={16} style={{ marginBottom: 16 }} />
              <Skeleton width="100%" height={40} borderRadius={8} />
            </View>
            <View
              style={[
                styles.card,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <Skeleton width="35%" height={20} borderRadius={10} style={{ marginBottom: 12 }} />
              <Skeleton width="75%" height={22} style={{ marginBottom: 8 }} />
              <Skeleton width="55%" height={16} style={{ marginBottom: 16 }} />
              <Skeleton width="100%" height={40} borderRadius={8} />
            </View>
          </View>
        ) : (
          <FlatList
            data={currentList}
            keyExtractor={(item, index) => String(item.id || index)}
            contentContainerStyle={styles.listContent}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.accent, colors.primary]}
                tintColor={colors.accent}
              />
            }
            renderItem={({ item }) => {
              if (!item || typeof item !== 'object') return null;

              if (activeTab === 'groups') {
                const dateStr = item.agenda_date || item.created_at || '';
                const submitter = item.submitter_name || (isAr ? 'خادم المجموعة' : 'GSR');
                const position = item.service_position || (isAr ? 'خادم موثوق' : 'Trusted Servant');
                const groupTitle =
                  (isAr ? item.group?.ar_name : item.group?.en_name) ||
                  item.group?.ar_name ||
                  item.group?.en_name ||
                  item.group_name ||
                  item.title ||
                  (isAr ? 'جدول أعمال مجموعة' : 'Group Business Agenda');

                return (
                  <View
                    style={[
                      styles.card,
                      shadows.card,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                        borderRadius: borderRadius.card,
                      },
                    ]}
                  >
                    <View style={[styles.cardHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <Badge label={position} variant="accent" size="sm" />
                      {dateStr ? (
                        <Badge
                          label={dateStr.slice(0, 10)}
                          variant="neutral"
                          size="sm"
                          icon={<Calendar size={11} color={colors.textSecondary} />}
                        />
                      ) : null}
                    </View>

                    <AppText variant="h3" color={colors.textPrimary} weight="700" style={[styles.itemTitle, { textAlign: isAr ? 'right' : 'left' }]}>
                      {groupTitle}
                    </AppText>

                    <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <User size={14} color={colors.primary} style={{ marginEnd: isAr ? 0 : 6, marginStart: isAr ? 6 : 0 }} />
                      <AppText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? `مقدم التقرير: ${submitter}` : `Submitter: ${submitter}`}
                      </AppText>
                    </View>

                    {item.meetings_per_week ? (
                      <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <Users size={14} color={colors.primary} style={{ marginEnd: isAr ? 0 : 6, marginStart: isAr ? 6 : 0 }} />
                        <AppText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                          {isAr ? `${item.meetings_per_week} اجتماعات أسبوعياً` : `${item.meetings_per_week} meetings/week`}
                        </AppText>
                      </View>
                    ) : null}

                    {item.new_comers !== undefined && item.new_comers !== null ? (
                      <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <UserPlus size={14} color={colors.accentDark} style={{ marginEnd: isAr ? 0 : 6, marginStart: isAr ? 6 : 0 }} />
                        <AppText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                          {isAr ? `متوسط الجدد: ${item.new_comers}` : `Newcomers: ${item.new_comers}`}
                        </AppText>
                      </View>
                    ) : null}

                    {item.next_business_meeting ? (
                      <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <Calendar size={14} color={colors.success} style={{ marginEnd: isAr ? 0 : 6, marginStart: isAr ? 6 : 0 }} />
                        <AppText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                          {isAr ? `اجتماع العمل القادم: ${String(item.next_business_meeting).slice(0, 10)}` : `Next Business Mtg: ${String(item.next_business_meeting).slice(0, 10)}`}
                        </AppText>
                      </View>
                    ) : null}

                    <AppButton
                      title={isAr ? 'عرض جدول الأعمال كاملاً' : 'View Full Agenda'}
                      onPress={() => handleOpenItem(item, 'group', groupTitle)}
                      variant="primary"
                      size="sm"
                      icon={<Eye size={15} color="#ffffff" />}
                      style={{ marginTop: 12 }}
                    />
                  </View>
                );
              } else if (activeTab === 'service_bodies') {
                const title = item.title || item.name || (isAr ? 'جدول أعمال منطقة أو منتدى' : 'Service Body Agenda');
                const sbName = item.service_body_name || (isAr ? item.service_body?.ar_name : item.service_body?.en_name) || (isAr ? 'لجنة خدمة الإقليم (RSC)' : 'Regional Service Committee');
                const isApproved = item.status === 'approved';
                const dateStr = item.meeting_date || item.agenda_date || item.created_at || '';

                return (
                  <View
                    style={[
                      styles.card,
                      shadows.card,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                        borderRadius: borderRadius.card,
                      },
                    ]}
                  >
                    <View style={[styles.cardHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <Badge
                        label={isApproved ? (isAr ? 'معتمد' : 'Approved') : (isAr ? 'مقدم' : 'Submitted')}
                        variant={isApproved ? 'success' : 'warning'}
                        size="sm"
                      />
                      {dateStr ? (
                        <AppText variant="caption" color={colors.textMuted}>
                          {dateStr.slice(0, 10)}
                        </AppText>
                      ) : null}
                    </View>

                    <AppText variant="h3" color={colors.textPrimary} weight="700" style={[styles.itemTitle, { textAlign: isAr ? 'right' : 'left' }]}>
                      {title}
                    </AppText>

                    <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <Building2 size={14} color={colors.primary} style={{ marginEnd: isAr ? 0 : 6, marginStart: isAr ? 6 : 0 }} />
                      <AppText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {sbName}
                      </AppText>
                    </View>

                    {item.questions && Array.isArray(item.questions) && item.questions.length > 0 ? (
                      <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <HelpCircle size={14} color={colors.accentDark} style={{ marginEnd: isAr ? 0 : 6, marginStart: isAr ? 6 : 0 }} />
                        <AppText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                          {isAr ? `${item.questions.length} بنود / أسئلة للتصويت` : `${item.questions.length} Voting Items/Questions`}
                        </AppText>
                      </View>
                    ) : null}

                    <AppButton
                      title={isAr ? 'عرض جدول الأعمال ومحضر الاجتماع' : 'View Agenda & Minutes'}
                      onPress={() => handleOpenItem(item, 'service_body', title)}
                      variant="primary"
                      size="sm"
                      icon={<Eye size={15} color="#ffffff" />}
                      style={{ marginTop: 12 }}
                    />
                  </View>
                );
              } else {
                const committeeName = item?.committee_name || (isAr ? item?.committee?.ar_name || item?.service_committee?.ar_name : item?.committee?.en_name || item?.service_committee?.en_name) || item?.committee?.name || (isAr ? 'لجنة خدمية' : 'Service Committee');
                const period = item?.period || item?.report_date || (item?.created_at ? String(item.created_at).slice(0, 10) : '');
                const title = item?.title || item?.name || `${committeeName}${period ? ` - ${period}` : ''}`;
                const isApproved = item?.status === 'approved';
                const cleanDesc = cleanHtmlText(item?.description || item?.body || item?.content);

                return (
                  <View
                    style={[
                      styles.card,
                      shadows.card,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                        borderRadius: borderRadius.card,
                      },
                    ]}
                  >
                    <View style={[styles.cardHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <Badge label={committeeName} variant="accent" size="sm" />
                      <Badge
                        label={isApproved ? (isAr ? 'أرشيف معتمد' : 'Approved') : (isAr ? 'مقدم' : 'Submitted')}
                        variant={isApproved ? 'success' : 'neutral'}
                        size="sm"
                      />
                    </View>

                    <AppText variant="h3" color={colors.textPrimary} weight="700" style={[styles.itemTitle, { textAlign: isAr ? 'right' : 'left' }]}>
                      {title}
                    </AppText>

                    {period ? (
                      <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <Calendar size={14} color={colors.primary} style={{ marginEnd: isAr ? 0 : 6, marginStart: isAr ? 6 : 0 }} />
                        <AppText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                          {isAr ? `الفترة / التاريخ: ${period}` : `Period: ${period}`}
                        </AppText>
                      </View>
                    ) : null}

                    {cleanDesc ? (
                      <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={2} style={[{ marginTop: 4, marginBottom: 6, textAlign: isAr ? 'right' : 'left' }]}>
                        {cleanDesc}
                      </AppText>
                    ) : null}

                    <AppButton
                      title={isAr ? 'قراءة وتحميل الوثيقة' : 'View & Download Document'}
                      onPress={() => handleOpenItem(item, 'committee', title)}
                      variant="primary"
                      size="sm"
                      icon={<DownloadCloud size={15} color="#ffffff" />}
                      style={{ marginTop: 12 }}
                    />
                  </View>
                );
              }
            }}
            ListEmptyComponent={
              <EmptyState
                icon={<FolderX size={44} color={colors.accent} />}
                title={isAr ? 'لا توجد سجلات مسجلة في هذا القسم' : 'No records found in this section'}
                description={
                  isAr
                    ? 'يتم عرض تقارير وأرشيف اللجان وجداول الأعمال مباشرة من الخادم وفقاً لصلاحيات حسابك المعتمد.'
                    : 'Agendas and Committee records load directly from the server according to your verified account permissions.'
                }
              />
            }
          />
        )}
      </View>

      {/* Details & Document Viewer Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder, flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <AppText variant="h3" color={colors.textPrimary} weight="700" numberOfLines={1} style={[{ flex: 1, textAlign: isAr ? 'right' : 'left' }]}>
              {selectedItem?.resolvedTitle || selectedItem?.title || selectedItem?.name || (isAr ? 'تفاصيل التقرير' : 'Record Details')}
            </AppText>
            <TouchableOpacity
              onPress={() => setSelectedItem(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.modalCloseBtn, { backgroundColor: colors.bgSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {isLoadingDetails ? (
              <View style={styles.modalLoadingBanner}>
                <ActivityIndicator size="small" color={colors.primary} style={{ marginEnd: 8 }} />
                <AppText variant="caption" color={colors.textSecondary} weight="600">
                  {isAr ? 'جاري استرداد البيانات الحية الكاملة من الخادم...' : 'Fetching complete live details from server...'}
                </AppText>
              </View>
            ) : null}

            {selectedItem?.modalType === 'group' ? (
              /* GROUP AGENDA FULL DETAILS */
              <View style={[styles.modalCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderRadius: borderRadius.card }]}>
                <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <FileText size={18} color={colors.primary} style={{ marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }} />
                  <AppText variant="h4" color={colors.textPrimary} weight="800">
                    {isAr ? 'بيانات تقرير المجموعة' : 'Group Agenda Information'}
                  </AppText>
                </View>

                <View style={styles.detailGrid}>
                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'اسم المجموعة:' : 'Group Name:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem.resolvedTitle || (isAr ? 'مجموعة NA' : 'NA Group')}
                    </AppText>
                  </View>

                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'مقدم التقرير:' : 'Submitter Servant:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem.submitter_name || (isAr ? 'خادم المجموعة' : 'GSR')}
                    </AppText>
                  </View>

                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'الموقع الخدمي:' : 'Service Position:'}
                    </AppText>
                    <Badge label={selectedItem.service_position || (isAr ? 'خادم موثوق' : 'Servant')} variant="accent" size="sm" />
                  </View>

                  {/* Alternate GSR Position & Name */}
                  {selectedItem.alt_gsr_name || selectedItem.alt_gsr_position ? (
                    <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'خادم المجموعة المناوب:' : 'Alt. GSR Servant:'}
                      </AppText>
                      <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {selectedItem.alt_gsr_name || (isAr ? 'خادم مناوب' : 'Alt GSR')}
                        {selectedItem.alt_gsr_position ? ` (${selectedItem.alt_gsr_position})` : ''}
                      </AppText>
                    </View>
                  ) : null}

                  {selectedItem.agenda_date ? (
                    <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'تاريخ التقرير:' : 'Report Date:'}
                      </AppText>
                      <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {String(selectedItem.agenda_date).slice(0, 10)}
                      </AppText>
                    </View>
                  ) : null}
                </View>

                {/* Group Health Section */}
                <View style={[styles.sectionHeaderRow, { marginTop: 18, flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <Users size={18} color={colors.accentDark} style={{ marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }} />
                  <AppText variant="h4" color={colors.textPrimary} weight="800">
                    {isAr ? 'حالة اجتماعات المجموعة' : 'Meetings & Fellowship Status'}
                  </AppText>
                </View>

                <View style={styles.detailGrid}>
                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'الاجتماعات الأسبوعية:' : 'Meetings / Week:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem.meetings_per_week ? `${selectedItem.meetings_per_week} ${isAr ? 'اجتماعات' : 'meetings'}` : (isAr ? 'غير محدد' : 'N/A')}
                    </AppText>
                  </View>

                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'متوسط الأعضاء الجدد:' : 'Newcomers Average:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem.new_comers !== undefined && selectedItem.new_comers !== null ? `${selectedItem.new_comers} ${isAr ? 'أعضاء' : 'members'}` : (isAr ? 'غير مسجل' : 'N/A')}
                    </AppText>
                  </View>

                  {selectedItem.next_business_meeting ? (
                    <View style={[styles.detailGridItemFull, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'تاريخ اجتماع الأعمال القادم:' : 'Next Business Meeting:'}
                      </AppText>
                      <AppText variant="body" color={colors.success} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {String(selectedItem.next_business_meeting).slice(0, 10)}
                      </AppText>
                    </View>
                  ) : null}

                  {selectedItem.recovery_meetings_changes !== undefined && (
                    <View style={[styles.detailGridItemFull, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'تغييرات في مواعيد أو أماكن الاجتماعات:' : 'Meeting Schedule/Location Changes:'}
                      </AppText>
                      <Badge
                        label={selectedItem.recovery_meetings_changes ? (isAr ? 'يوجد تغييرات' : 'Has Changes') : (isAr ? 'لا توجد تغييرات' : 'No Changes')}
                        variant={selectedItem.recovery_meetings_changes ? 'warning' : 'neutral'}
                        size="sm"
                        style={{ marginTop: 4 }}
                      />
                    </View>
                  )}

                  {selectedItem.open_positions ? (
                    <View style={[styles.detailGridItemFull, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'المناصب الخدمية الشاغرة:' : 'Open Service Positions:'}
                      </AppText>
                      <AppText variant="body" color={colors.danger} weight="600" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {cleanHtmlText(selectedItem.open_positions)}
                      </AppText>
                    </View>
                  ) : null}
                </View>

                {/* Atmosphere & Finance */}
                <View style={[styles.sectionHeaderRow, { marginTop: 18, flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <HeartHandshake size={18} color={colors.success} style={{ marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }} />
                  <AppText variant="h4" color={colors.textPrimary} weight="800">
                    {isAr ? 'جو التعافي والشؤون المالية' : 'Atmosphere of Recovery & Finance'}
                  </AppText>
                </View>

                {selectedItem.recovery_atmosphere ? (
                  <View style={{ marginTop: 8, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'جو التعافي داخل المجموعة:' : 'Recovery Atmosphere:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ marginTop: 2, textAlign: isAr ? 'right' : 'left' }}>
                      {cleanHtmlText(selectedItem.recovery_atmosphere)}
                    </AppText>
                  </View>
                ) : null}

                {selectedItem.financial_issues ? (
                  <View style={{ marginTop: 12, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'الوضع المالي والاحتياطي الحكيم (التقليد السابع):' : '7th Tradition & Financial Status:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ marginTop: 2, textAlign: isAr ? 'right' : 'left' }}>
                      {cleanHtmlText(selectedItem.financial_issues)}
                    </AppText>
                  </View>
                ) : null}

                {selectedItem.trusted_servants ? (
                  <View style={{ marginTop: 12, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'حالة الخدام الموثوقين:' : 'Trusted Servants Status:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ marginTop: 2, textAlign: isAr ? 'right' : 'left' }}>
                      {cleanHtmlText(selectedItem.trusted_servants)}
                    </AppText>
                  </View>
                ) : null}

                {/* Other Topics / Array */}
                {selectedItem.other_topics && Array.isArray(selectedItem.other_topics) && selectedItem.other_topics.length > 0 ? (
                  <View style={{ marginTop: 18 }}>
                    <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <MessageSquare size={18} color={colors.accentDark} style={{ marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }} />
                      <AppText variant="h4" color={colors.textPrimary} weight="800">
                        {isAr ? 'مواضيع ونقاط إضافية للمناقشة' : 'Additional Discussion Topics'}
                      </AppText>
                    </View>
                    {selectedItem.other_topics.map((tItem: any, tIdx: number) => (
                      <View key={tIdx} style={[styles.subTopicCard, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder, alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                        <AppText variant="body" color={colors.textPrimary} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                          {cleanHtmlText(tItem.title) || `${isAr ? 'بند' : 'Topic'} #${tIdx + 1}`}
                        </AppText>
                        {tItem.content ? (
                          <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 4, textAlign: isAr ? 'right' : 'left' }}>
                            {cleanHtmlText(tItem.content)}
                          </AppText>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : selectedItem?.modalType === 'service_body' ? (
              /* SERVICE BODY AGENDA DETAILS */
              <View style={[styles.modalCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderRadius: borderRadius.card }]}>
                <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <Building2 size={18} color={colors.primary} style={{ marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }} />
                  <AppText variant="h4" color={colors.textPrimary} weight="800">
                    {isAr ? 'تفاصيل جدول أعمال المنتديات أو المناطق' : 'Service Body Agenda Details'}
                  </AppText>
                </View>

                <View style={styles.detailGrid}>
                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'المنتديات أو المناطق:' : 'Service Body:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem.service_body_name || (isAr ? selectedItem.service_body?.ar_name : selectedItem.service_body?.en_name) || (isAr ? 'لجنة خدمة الإقليم (RSC)' : 'Regional Service Committee')}
                    </AppText>
                  </View>

                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'الحالة:' : 'Status:'}
                    </AppText>
                    <Badge
                      label={selectedItem.status === 'approved' ? (isAr ? 'معتمد' : 'Approved') : (isAr ? 'قيد المراجعة' : 'Submitted')}
                      variant={selectedItem.status === 'approved' ? 'success' : 'warning'}
                      size="sm"
                    />
                  </View>

                  {selectedItem.month || selectedItem.year ? (
                    <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الفترة:' : 'Period:'}
                      </AppText>
                      <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {`${selectedItem.month || ''} ${selectedItem.year || ''}`.trim()}
                      </AppText>
                    </View>
                  ) : null}

                  {selectedItem.meeting_date || selectedItem.agenda_date || selectedItem.created_at ? (
                    <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'تاريخ الاجتماع / التوثيق:' : 'Meeting Date:'}
                      </AppText>
                      <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {String(selectedItem.meeting_date || selectedItem.agenda_date || selectedItem.created_at).slice(0, 10)}
                      </AppText>
                    </View>
                  ) : null}
                </View>

                {selectedItem.description || selectedItem.content ? (
                  <View style={{ marginTop: 16, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'البيان / محضر الاجتماع:' : 'Minutes / Description:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ marginTop: 4, lineHeight: 22, textAlign: isAr ? 'right' : 'left' }}>
                      {cleanHtmlText(selectedItem.description || selectedItem.content)}
                    </AppText>
                  </View>
                ) : null}

                {/* Voting Questions */}
                {selectedItem.questions && Array.isArray(selectedItem.questions) && selectedItem.questions.length > 0 ? (
                  <View style={{ marginTop: 20 }}>
                    <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <HelpCircle size={18} color={colors.accentDark} style={{ marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }} />
                      <AppText variant="h4" color={colors.textPrimary} weight="800">
                        {isAr ? 'بنود وأسئلة التصويت للأعضاء' : 'Voting Topics & Questions'}
                      </AppText>
                    </View>
                    {selectedItem.questions.map((q: any, qIdx: number) => (
                      <View key={qIdx} style={[styles.subTopicCard, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder, alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                        <AppText variant="body" color={colors.primary} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                          {`${qIdx + 1}. ${cleanHtmlText(q.title || q.question) || (isAr ? 'بند للتصويت' : 'Voting Item')}`}
                        </AppText>
                        {q.description || q.details ? (
                          <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 4, textAlign: isAr ? 'right' : 'left' }}>
                            {cleanHtmlText(q.description || q.details)}
                          </AppText>
                        ) : null}
                        {q.answer ? (
                          <View style={{ marginTop: 6, flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center' }}>
                            <Badge label={isAr ? `القرار: ${q.answer}` : `Decision: ${q.answer}`} variant="accent" size="sm" />
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              /* COMMITTEE REPORT DETAILS */
              <View style={[styles.modalCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderRadius: borderRadius.card }]}>
                <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <FileArchive size={18} color={colors.primary} style={{ marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }} />
                  <AppText variant="h4" color={colors.textPrimary} weight="800">
                    {isAr ? 'تفاصيل تقرير اللجنة الخدمية' : 'Committee Report Details'}
                  </AppText>
                </View>

                <View style={styles.detailGrid}>
                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'اللجنة الخدمية:' : 'Service Committee:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem?.committee_name || (isAr ? selectedItem?.committee?.ar_name || selectedItem?.service_committee?.ar_name : selectedItem?.committee?.en_name || selectedItem?.service_committee?.en_name) || selectedItem?.committee?.name || (isAr ? 'لجنة العلاقات العامة والخدمة' : 'Service Committee')}
                    </AppText>
                  </View>

                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'فترة التقرير:' : 'Reporting Period:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem?.period || selectedItem?.report_date || (selectedItem?.created_at ? String(selectedItem.created_at).slice(0, 10) : (isAr ? 'الفترة الحالية' : 'Current'))}
                    </AppText>
                  </View>

                  {selectedItem?.author_name ? (
                    <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'معد التقرير:' : 'Author / Submitter:'}
                      </AppText>
                      <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {selectedItem.author_name}
                      </AppText>
                    </View>
                  ) : null}

                  {selectedItem?.status ? (
                    <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'حالة الاعتماد:' : 'Approval Status:'}
                      </AppText>
                      <Badge
                        label={selectedItem.status === 'approved' ? (isAr ? 'معتمد' : 'Approved') : (isAr ? 'مقدم' : 'Submitted')}
                        variant={selectedItem.status === 'approved' ? 'success' : 'neutral'}
                        size="sm"
                      />
                    </View>
                  ) : null}
                </View>

                {selectedItem?.description || selectedItem?.body || selectedItem?.content ? (
                  <View style={{ marginTop: 16, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'ملخص الأنشطة والتقرير:' : 'Activity Summary & Report Body:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ marginTop: 4, lineHeight: 22, textAlign: isAr ? 'right' : 'left' }}>
                      {cleanHtmlText(selectedItem.description || selectedItem.body || selectedItem.content)}
                    </AppText>
                  </View>
                ) : null}

                {/* Document Download / View */}
                {selectedItem?.file_url || selectedItem?.attachment_url || selectedItem?.document_url ? (
                  <View style={{ marginTop: 20 }}>
                    <AppButton
                      title={isAr ? 'فتح وتحميل ملف التقرير المرفق (PDF/Doc)' : 'Open & Download Attached File'}
                      onPress={() => {
                        const url = selectedItem?.file_url || selectedItem?.attachment_url || selectedItem?.document_url;
                        if (url) {
                          Linking.openURL(url).catch(() => {
                            Alert.alert(isAr ? 'تنبيه' : 'Notice', isAr ? 'تعذر فتح ملف الوثيقة.' : 'Could not open document URL.');
                          });
                        }
                      }}
                      variant="primary"
                      size="md"
                      icon={<ExternalLink size={16} color="#ffffff" />}
                    />
                  </View>
                ) : null}
              </View>
            )}

            <View style={[styles.officialBadge, { backgroundColor: colors.accentLight }]}>
              <ShieldCheck size={16} color={colors.accentDark} style={{ marginEnd: 6 }} />
              <AppText variant="caption" color={colors.accentDark} weight="700">
                {isAr ? 'وثيقة مباشرة من خادم زمالة المدمنين المجهولين' : 'Live Verified Document - NA Egypt'}
              </AppText>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  tabSelectorWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tabSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 11,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentBody: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  authStatusContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loggedInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 10,
  },
  userInfo: {
    flex: 1,
  },
  logoutButton: {
    padding: 6,
  },
  lockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  lockIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 10,
  },
  lockInfo: {
    flex: 1,
    paddingEnd: 8,
  },
  msSmallLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  msPrimaryLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
  },
  loadingContainer: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 16,
    paddingBottom: 36,
  },
  modalLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  modalCard: {
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailGridItem: {
    width: '47%',
  },
  detailGridItemFull: {
    width: '100%',
    marginTop: 4,
  },
  subTopicCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  loggedOutScrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  loggedOutCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockLargeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
});
