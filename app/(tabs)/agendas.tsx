import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
  Layers,
  RefreshCw,
  UserCheck,
  Coins,
  HeartHandshake,
  UserPlus,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react-native';
import { authApi, UserProfile } from '../../src/api/auth';
import { apiClient } from '../../src/api/client';
import { azureAuthService } from '../../src/services/azureAuthService';
import { database } from '../../src/database';
import GroupModel from '../../src/database/models/Group';
import { useAppTheme } from '../../src/theme';
import {
  AppText,
  Badge,
  AppButton,
  EmptyState,
  Skeleton,
  AppHeader,
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
  const [groupLookup, setGroupLookup] = useState<Record<string, { ar_name: string; en_name: string }>>({});
  const [tabForbidden, setTabForbidden] = useState<Record<AgendaTabType, boolean>>({
    groups: false,
    service_bodies: false,
    committees_archive: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    const loadLocalGroups = async () => {
      try {
        const groups = await database.get<GroupModel>('groups').query().fetch();
        const map: Record<string, { ar_name: string; en_name: string }> = {};
        groups.forEach((g) => {
          const item = { ar_name: g.name || '', en_name: g.name || '' };
          if (g.remoteId) map[String(g.remoteId)] = item;
          if (g.id) map[String(g.id)] = item;
        });
        setGroupLookup(map);
      } catch (err) {
        console.warn('Error loading local groups for agenda titles:', err);
      }
    };
    loadLocalGroups();
  }, []);

  const fetchAllData = async (currentUser?: UserProfile | null) => {
    const activeUser = currentUser !== undefined ? currentUser : user;
    if (!activeUser) {
      setGroupAgendas([]);
      setServiceBodyAgendas([]);
      setCommitteeReports([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsLoading(true);
    setTabForbidden({ groups: false, service_bodies: false, committees_archive: false });

    try {
      const [agendasRes, sbRes, reportsRes] = await Promise.allSettled([
        apiClient.get('/agendas', { params: { per_page: 100 } }),
        apiClient.get('/service-body-agendas', { params: { per_page: 100 } }),
        apiClient.get('/committee-reports', { params: { per_page: 100 } }),
      ]);

      if (agendasRes.status === 'fulfilled') {
        const data = agendasRes.value.data?.data || agendasRes.value.data || [];
        setGroupAgendas(Array.isArray(data) ? data : []);
      } else {
        const status = (agendasRes.reason as any)?.response?.status;
        if (status === 403) {
          setTabForbidden((prev) => ({ ...prev, groups: true }));
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
        }
        setCommitteeReports([]);
      }
    } catch (e) {
      console.warn('Error loading agendas/reports with auth:', e);
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
        subtitle={isAr ? 'مصر • NA Egypt Fellowship' : 'Egypt • Service Archive'}
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
                  {isAr ? 'الهيئات الخدمية' : 'Service Bodies'}
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
                    {user.name || (isAr ? 'خادم زمالة معتمد' : 'Trusted Servant')}
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
                  {isAr ? 'بوابة خادمي اللجان والمجموعات' : 'Trusted Servants Portal'}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  {isAr
                    ? 'سجل دخولك بحساب مايكروسوفت للاطلاع على أرشيف اللجان وجداول الأعمال'
                    : 'Sign in with Microsoft to access committee archives'}
                </AppText>
              </View>
              <AppButton
                title={t('agendas.login_prompt')}
                onPress={() => {
                  haptic.selection();
                  router.push('/login');
                }}
                variant="primary"
                size="sm"
              />
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
                    ? 'أجندات المجموعات - خادمي المجموعات'
                    : 'Group Agendas - Trusted Servants'
                  : activeTab === 'service_bodies'
                  ? isAr
                    ? 'أجندات الهيئات - مجلس الخدمة'
                    : 'Service Body Agendas'
                  : isAr
                  ? 'أرشيف تقارير اللجان الخدمية'
                  : 'Committee Reports Archive'}
              </AppText>
              <AppText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
                {isAr
                  ? 'هذا القسم مخصص للخدام المعتمدين في زمالة المدمنين المجهولين في مصر. يرجى تسجيل الدخول بحساب Microsoft المؤسسي المرتبط بـ egyptna.org للاطلاع على البيانات والتقارير المتاحة لرتبتك الخدمية.'
                  : 'This section is strictly restricted to verified NA Egypt servants. Please sign in with your official egyptna.org Microsoft account to access reports and agendas permitted for your role.'}
              </AppText>
              <AppButton
                title={t('agendas.login_prompt')}
                onPress={() => {
                  haptic.selection();
                  router.push('/login');
                }}
                variant="primary"
                size="md"
                style={{ width: '100%' }}
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
                  ? `يتطلب هذا القسم صلاحيات محددة (مثل RSC أو هيئة خدمة). رتبتك المسجلة حالياً: ${user.roles?.join(', ') || (isAr ? 'خادم موثوق' : 'Servant')}.`
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
                const groupId = item.group_id || item.groupId || item.group?.id;
                const localGroup = groupId ? groupLookup[String(groupId)] : null;
                const groupTitle =
                  (isAr ? item.group?.ar_name || localGroup?.ar_name : item.group?.en_name || localGroup?.en_name) ||
                  item.group?.ar_name ||
                  item.group?.en_name ||
                  localGroup?.ar_name ||
                  localGroup?.en_name ||
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
                          {isAr ? `اجتماع الأعمال القادم: ${String(item.next_business_meeting).slice(0, 10)}` : `Next Business Mtg: ${String(item.next_business_meeting).slice(0, 10)}`}
                        </AppText>
                      </View>
                    ) : null}

                    <AppButton
                      title={isAr ? 'عرض جدول الأعمال كاملاً' : 'View Full Agenda'}
                      onPress={() => {
                        haptic.selection();
                        setSelectedItem({ ...item, resolvedTitle: groupTitle, modalType: 'group' });
                      }}
                      variant="primary"
                      size="sm"
                      icon={<Eye size={15} color="#ffffff" />}
                      style={{ marginTop: 12 }}
                    />
                  </View>
                );
              } else if (activeTab === 'service_bodies') {
                const title = item.title || item.name || (isAr ? 'جدول أعمال هيئة خدمية' : 'Service Body Agenda');
                const sbName = item.service_body_name || (isAr ? 'مجلس الخدمة الإقليمية (RSC)' : 'Regional Service Committee');
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
                      onPress={() => {
                        haptic.selection();
                        setSelectedItem({ ...item, resolvedTitle: title, modalType: 'service_body' });
                      }}
                      variant="primary"
                      size="sm"
                      icon={<Eye size={15} color="#ffffff" />}
                      style={{ marginTop: 12 }}
                    />
                  </View>
                );
              } else {
                const committeeName = item?.committee_name || item?.committee?.name || (isAr ? 'لجنة العلاقات العامة والخدمة' : 'Service Committee');
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
                      onPress={() => {
                        haptic.selection();
                        setSelectedItem({ ...item, resolvedTitle: title, modalType: 'committee' });
                      }}
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
                    ? 'يتم مزامنة تقارير وأرشيف اللجان وجداول الأعمال مباشرة من قاعدة بيانات egyptna.org وفقاً لصلاحيات حسابك.'
                    : 'Agendas and Committee records synchronize directly from egyptna.org according to your role permissions.'
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
                      {selectedItem.new_comers !== undefined ? `${selectedItem.new_comers} ${isAr ? 'أعضاء' : 'members'}` : (isAr ? 'غير مسجل' : 'N/A')}
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
                    {isAr ? 'تفاصيل جدول أعمال الهيئة الخدمية' : 'Service Body Agenda Details'}
                  </AppText>
                </View>

                <View style={styles.detailGrid}>
                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'الهيئة الخدمية:' : 'Service Body:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem.service_body_name || (isAr ? 'مجلس الخدمة الإقليمية (RSC)' : 'Regional Service Committee')}
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

                  {selectedItem.meeting_date || selectedItem.created_at ? (
                    <View style={[styles.detailGridItemFull, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'تاريخ الاجتماع / التوثيق:' : 'Meeting Date:'}
                      </AppText>
                      <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {String(selectedItem.meeting_date || selectedItem.created_at).slice(0, 10)}
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
                      {selectedItem?.committee_name || selectedItem?.committee?.name || (isAr ? 'لجنة العلاقات العامة والخدمة' : 'Service Committee')}
                    </AppText>
                  </View>

                  <View style={[styles.detailGridItem, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'فترة التقرير:' : 'Reporting Period:'}
                    </AppText>
                    <AppText variant="body" color={colors.textPrimary} style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {selectedItem?.period || (selectedItem?.created_at ? String(selectedItem.created_at).slice(0, 10) : (isAr ? 'الفترة الحالية' : 'Current'))}
                    </AppText>
                  </View>
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
                {isAr ? 'وثيقة رسمية معتمدة من زمالة NA مصر' : 'Official Verified Document - NA Egypt'}
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
  safeHeader: {
    paddingBottom: 4,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 10,
  },
  headerTextCol: {
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
