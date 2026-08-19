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
} from 'lucide-react-native';
import { authApi, UserProfile } from '../../src/api/auth';
import { apiClient } from '../../src/api/client';
import { azureAuthService } from '../../src/services/azureAuthService';
import { useAppTheme } from '../../src/theme';
import {
  AppText,
  Badge,
  AppButton,
  EmptyState,
  Skeleton,
  LanguageSwitcher,
} from '../../src/components/ui';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { haptic } from '../../src/utils/haptics';

type AgendaTabType = 'groups' | 'service_bodies' | 'committees_archive';

export default function AgendasScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, borderRadius, shadows } = useAppTheme();

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
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

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
        apiClient.get('/agendas'),
        apiClient.get('/service-body-agendas'),
        apiClient.get('/committee-reports'),
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

  const currentList =
    activeTab === 'groups'
      ? groupAgendas
      : activeTab === 'service_bodies'
        ? serviceBodyAgendas
        : committeeReports;

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.primaryDark }]}>
      <SafeAreaView style={[styles.safeHeader, { backgroundColor: colors.primaryDark }]} edges={['top']}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight + '40' }]}>
            <Layers size={20} color={colors.accent} />
          </View>
          <View style={styles.headerTextCol}>
            <AppText variant="h3" color="#ffffff" weight="800">
              {isAr ? 'جداول الأعمال والأرشيف الخدمي' : 'Agendas & Service Archive'}
            </AppText>
            <AppText variant="caption" color="rgba(224, 248, 252, 0.75)">
              {isAr
                ? 'أجندات المجموعات، الهيئات، وأرشيف تقارير اللجان الفرعية'
                : 'Group Agendas, Service Bodies & Committee Archive'}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            <LanguageSwitcher />
          </View>
        </View>

        {/* 3-Tab Segmented Selector */}
        <View style={styles.tabSelectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabSelectorContainer}
          >
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'groups' && [styles.tabButtonActive, { backgroundColor: colors.cardBg }],
              ]}
              onPress={() => {
                haptic.selection();
                setActiveTab('groups');
              }}
              activeOpacity={0.8}
            >
              <FileText
                size={14}
                color={activeTab === 'groups' ? colors.primary : '#ffffff'}
                style={{ marginEnd: 6 }}
              />
              <AppText
                variant="label"
                color={activeTab === 'groups' ? colors.primary : '#ffffff'}
                weight="700"
              >
                {isAr ? 'أجندات المجموعات' : 'Group Agendas'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'service_bodies' && [styles.tabButtonActive, { backgroundColor: colors.cardBg }],
              ]}
              onPress={() => {
                haptic.selection();
                setActiveTab('service_bodies');
              }}
              activeOpacity={0.8}
            >
              <Building2
                size={14}
                color={activeTab === 'service_bodies' ? colors.primary : '#ffffff'}
                style={{ marginEnd: 6 }}
              />
              <AppText
                variant="label"
                color={activeTab === 'service_bodies' ? colors.primary : '#ffffff'}
                weight="700"
              >
                {isAr ? 'الهيئات الخدمية' : 'Service Bodies'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'committees_archive' && [styles.tabButtonActive, { backgroundColor: colors.cardBg }],
              ]}
              onPress={() => {
                haptic.selection();
                setActiveTab('committees_archive');
              }}
              activeOpacity={0.8}
            >
              <FileArchive
                size={14}
                color={activeTab === 'committees_archive' ? colors.primary : '#ffffff'}
                style={{ marginEnd: 6 }}
              />
              <AppText
                variant="label"
                color={activeTab === 'committees_archive' ? colors.primary : '#ffffff'}
                weight="700"
              >
                {isAr ? 'أرشيف اللجان' : 'Committees Archive'}
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>

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
              if (activeTab === 'groups') {
                const dateStr = item.agenda_date || item.created_at || '';
                const submitter = item.submitter_name || (isAr ? 'خادم المجموعة' : 'GSR');
                const position = item.service_position || (isAr ? 'خادم موثوق' : 'Trusted Servant');

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
                    <View style={styles.cardHeaderRow}>
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

                    <AppText variant="h3" color={colors.textPrimary} weight="700" style={styles.itemTitle}>
                      {isAr ? `جدول أعمال مجموعة #${item.group_id || item.id}` : `Group Agenda #${item.group_id || item.id}`}
                    </AppText>

                    <View style={styles.infoRow}>
                      <User size={14} color={colors.primary} style={{ marginEnd: 6 }} />
                      <AppText variant="bodySmall" color={colors.textSecondary}>
                        {isAr ? `مقدم التقرير: ${submitter}` : `Submitter: ${submitter}`}
                      </AppText>
                    </View>

                    {item.meetings_per_week ? (
                      <View style={styles.infoRow}>
                        <Users size={14} color={colors.primary} style={{ marginEnd: 6 }} />
                        <AppText variant="bodySmall" color={colors.textSecondary}>
                          {isAr ? `${item.meetings_per_week} اجتماعات أسبوعياً` : `${item.meetings_per_week} meetings/week`}
                        </AppText>
                      </View>
                    ) : null}

                    <AppButton
                      title={isAr ? 'عرض التفاصيل الكاملة' : 'View Details'}
                      onPress={() => {
                        haptic.selection();
                        setSelectedItem({ ...item, modalType: 'group' });
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
                    <View style={styles.cardHeaderRow}>
                      <Badge
                        label={isApproved ? (isAr ? 'معتمد' : 'Approved') : (isAr ? 'مقدم' : 'Submitted')}
                        variant={isApproved ? 'success' : 'warning'}
                        size="sm"
                      />
                      {item.created_at ? (
                        <AppText variant="caption" color={colors.textMuted}>
                          {item.created_at.slice(0, 10)}
                        </AppText>
                      ) : null}
                    </View>

                    <AppText variant="h3" color={colors.textPrimary} weight="700" style={styles.itemTitle}>
                      {title}
                    </AppText>

                    <View style={styles.infoRow}>
                      <Building2 size={14} color={colors.primary} style={{ marginEnd: 6 }} />
                      <AppText variant="bodySmall" color={colors.textSecondary}>
                        {sbName}
                      </AppText>
                    </View>

                    <AppButton
                      title={isAr ? 'عرض محضر الاجتماع' : 'View Minutes'}
                      onPress={() => {
                        haptic.selection();
                        setSelectedItem({ ...item, modalType: 'service_body' });
                      }}
                      variant="primary"
                      size="sm"
                      icon={<Eye size={15} color="#ffffff" />}
                      style={{ marginTop: 12 }}
                    />
                  </View>
                );
              } else {
                const title = item.title || item.name || (isAr ? 'تقرير لجنة فرعية' : 'Committee Report');
                const committeeName = item.committee_name || (isAr ? 'لجنة العلاقات العامة والخدمة' : 'Service Committee');
                const isApproved = item.status === 'approved';

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
                    <View style={styles.cardHeaderRow}>
                      <Badge label={committeeName} variant="accent" size="sm" />
                      <Badge
                        label={isApproved ? (isAr ? 'أرشيف معتمد' : 'Approved') : (isAr ? 'مقدم' : 'Submitted')}
                        variant={isApproved ? 'success' : 'neutral'}
                        size="sm"
                      />
                    </View>

                    <AppText variant="h3" color={colors.textPrimary} weight="700" style={styles.itemTitle}>
                      {title}
                    </AppText>

                    {item.description ? (
                      <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 4, marginBottom: 6 }}>
                        {item.description}
                      </AppText>
                    ) : null}

                    <AppButton
                      title={isAr ? 'قراءة وتحميل الوثيقة' : 'View & Download Document'}
                      onPress={() => {
                        haptic.selection();
                        setSelectedItem({ ...item, modalType: 'committee' });
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
          <View style={[styles.modalHeader, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder }]}>
            <AppText variant="h3" color={colors.textPrimary} weight="700" numberOfLines={1} style={{ flex: 1 }}>
              {selectedItem?.title || selectedItem?.name || `تقرير #${selectedItem?.id}`}
            </AppText>
            <TouchableOpacity
              onPress={() => setSelectedItem(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.modalCloseBtn, { backgroundColor: colors.bgSecondary }]}
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View
              style={[
                styles.modalCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <AppText variant="caption" color={colors.textMuted} weight="700" style={styles.modalFieldLabel}>
                {isAr ? 'العنوان / التعريف:' : 'Title / Identifier:'}
              </AppText>
              <AppText variant="body" color={colors.textPrimary} weight="600" style={styles.modalFieldValue}>
                {selectedItem?.title || selectedItem?.name || `سجل رقم #${selectedItem?.id}`}
              </AppText>

              {selectedItem?.agenda_date || selectedItem?.created_at ? (
                <>
                  <AppText variant="caption" color={colors.textMuted} weight="700" style={styles.modalFieldLabel}>
                    {isAr ? 'التاريخ:' : 'Date:'}
                  </AppText>
                  <AppText variant="body" color={colors.textPrimary} style={styles.modalFieldValue}>
                    {(selectedItem?.agenda_date || selectedItem?.created_at || '').slice(0, 10)}
                  </AppText>
                </>
              ) : null}

              {selectedItem?.submitter_name ? (
                <>
                  <AppText variant="caption" color={colors.textMuted} weight="700" style={styles.modalFieldLabel}>
                    {isAr ? 'مقدم التقرير:' : 'Submitter:'}
                  </AppText>
                  <AppText variant="body" color={colors.textPrimary} style={styles.modalFieldValue}>
                    {selectedItem.submitter_name}
                  </AppText>
                </>
              ) : null}

              {selectedItem?.service_position ? (
                <>
                  <AppText variant="caption" color={colors.textMuted} weight="700" style={styles.modalFieldLabel}>
                    {isAr ? 'الصفة الخدمية:' : 'Service Position:'}
                  </AppText>
                  <AppText variant="body" color={colors.textPrimary} style={styles.modalFieldValue}>
                    {selectedItem.service_position}
                  </AppText>
                </>
              ) : null}

              {selectedItem?.description ? (
                <>
                  <AppText variant="caption" color={colors.textMuted} weight="700" style={styles.modalFieldLabel}>
                    {isAr ? 'البيان / التفاصيل:' : 'Details:'}
                  </AppText>
                  <AppText variant="body" color={colors.textPrimary} style={styles.modalFieldValue}>
                    {selectedItem.description}
                  </AppText>
                </>
              ) : null}

              <View style={[styles.officialBadge, { backgroundColor: colors.accentLight }]}>
                <ShieldAlert size={14} color={colors.accentDark} style={{ marginEnd: 6 }} />
                <AppText variant="caption" color={colors.accentDark} weight="700">
                  {isAr ? 'وثيقة رسمية معتمدة من زمالة NA مصر' : 'Official Document - NA Egypt'}
                </AppText>
              </View>
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
    marginTop: 4,
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
  },
  modalCard: {
    padding: 18,
    borderWidth: 1,
  },
  modalFieldLabel: {
    marginTop: 12,
    marginBottom: 2,
  },
  modalFieldValue: {
    lineHeight: 22,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 18,
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
