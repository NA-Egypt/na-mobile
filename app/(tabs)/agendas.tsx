import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  LogOut,
  FileText,
  X,
  ShieldAlert,
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
} from 'lucide-react-native';
import { authApi, UserProfile } from '../../src/api/auth';
import { apiClient } from '../../src/api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

type AgendaTabType = 'groups' | 'service_bodies' | 'committees_archive';

export default function AgendasScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AgendaTabType>('groups');
  const [user, setUser] = useState<UserProfile | null>(null);

  const [groupAgendas, setGroupAgendas] = useState<any[]>([]);
  const [serviceBodyAgendas, setServiceBodyAgendas] = useState<any[]>([]);
  const [committeeReports, setCommitteeReports] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [agendasRes, sbRes, reportsRes] = await Promise.allSettled([
        apiClient.get('/agendas'),
        apiClient.get('/service-body-agendas'),
        apiClient.get('/committee-reports'),
      ]);

      if (agendasRes.status === 'fulfilled') {
        const data = agendasRes.value.data?.data || agendasRes.value.data || [];
        setGroupAgendas(Array.isArray(data) ? data : []);
      }

      if (sbRes.status === 'fulfilled') {
        const data = sbRes.value.data?.data || sbRes.value.data || [];
        setServiceBodyAgendas(Array.isArray(data) ? data : []);
      }

      if (reportsRes.status === 'fulfilled') {
        const data = reportsRes.value.data?.data || reportsRes.value.data || [];
        setCommitteeReports(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Error loading agendas/reports:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    authApi.getStoredUser().then((stored) => {
      setUser(stored);
      fetchAllData();
    });
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
    fetchAllData();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
  };

  // Check user permissions
  const hasPermission = (permissionName: string) => {
    if (!user) return false;
    if (user.roles?.includes('admin') || user.roles?.includes('super_admin')) return true;
    return user.permissions?.includes(permissionName) || false;
  };

  const currentList =
    activeTab === 'groups'
      ? groupAgendas
      : activeTab === 'service_bodies'
      ? serviceBodyAgendas
      : committeeReports;

  return (
    <View style={styles.screenWrapper}>
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.iconCircle}>
            <Layers size={22} color="#ffffff" />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'جداول الأعمال والأرشيف الخدمي' : 'Agendas & Service Archive'}
            </Text>
            <Text style={[styles.headerSubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr
                ? 'أجندات المجموعات، الهيئات الخدمية، وأرشيف تقارير اللجان الفرعية'
                : 'Group Agendas, Service Bodies & Committee Archive'}
            </Text>
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
              style={[styles.tabButton, activeTab === 'groups' && styles.tabButtonActive]}
              onPress={() => setActiveTab('groups')}
              activeOpacity={0.8}
            >
              <FileText size={15} color={activeTab === 'groups' ? '#ffffff' : 'rgba(255,255,255,0.85)'} style={{ marginEnd: 6 }} />
              <Text style={[styles.tabButtonText, activeTab === 'groups' && styles.tabButtonTextActive]}>
                {isAr ? 'أجندات المجموعات' : 'Group Agendas'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'service_bodies' && styles.tabButtonActive]}
              onPress={() => setActiveTab('service_bodies')}
              activeOpacity={0.8}
            >
              <Building2 size={15} color={activeTab === 'service_bodies' ? '#ffffff' : 'rgba(255,255,255,0.85)'} style={{ marginEnd: 6 }} />
              <Text style={[styles.tabButtonText, activeTab === 'service_bodies' && styles.tabButtonTextActive]}>
                {isAr ? 'الهيئات الخدمية' : 'Service Bodies'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'committees_archive' && styles.tabButtonActive]}
              onPress={() => setActiveTab('committees_archive')}
              activeOpacity={0.8}
            >
              <FileArchive size={15} color={activeTab === 'committees_archive' ? '#ffffff' : 'rgba(255,255,255,0.85)'} style={{ marginEnd: 6 }} />
              <Text style={[styles.tabButtonText, activeTab === 'committees_archive' && styles.tabButtonTextActive]}>
                {isAr ? 'أرشيف اللجان' : 'Committees Archive'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* User Auth Status Bar */}
      <View style={styles.authStatusContainer}>
        {user ? (
          <View style={[styles.loggedInCard, shadows.card]}>
            <View style={styles.userAvatar}>
              <CheckCircle2 size={20} color={colors.success} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {user.name || (isAr ? 'خادم زمالة معتمد' : 'Trusted Servant')}
              </Text>
              <Text style={[styles.userEmail, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {user.email}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.lockCard, shadows.card]}>
            <View style={styles.lockIconBox}>
              <Lock size={20} color={colors.primary} />
            </View>
            <View style={styles.lockInfo}>
              <Text style={[styles.lockTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr ? 'بوابة خادمي اللجان والمجموعات' : 'Trusted Servants Portal'}
              </Text>
              <Text style={[styles.lockSubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr
                  ? 'سجل دخولك بحساب مايكروسوفت للاطلاع على أرشيف اللجان وجداول الأعمال المعتمدة'
                  : 'Sign in with Microsoft to access verified committee records'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>{t('agendas.login_prompt')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main List Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
            {isAr ? 'جاري جلب البيانات من الخادم...' : 'Loading data from server...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => {
            if (activeTab === 'groups') {
              // Group Agenda Item
              const dateStr = item.agenda_date || item.created_at || '';
              const submitter = item.submitter_name || (isAr ? 'خادم المجموعة' : 'GSR');
              const position = item.service_position || (isAr ? 'خادم موثوق' : 'Trusted Servant');

              return (
                <View style={[styles.card, shadows.card]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionText}>{position}</Text>
                    </View>
                    {dateStr ? (
                      <View style={styles.dateBadge}>
                        <Calendar size={12} color="#0891b2" style={{ marginEnd: 4 }} />
                        <Text style={styles.dateText}>{dateStr.slice(0, 10)}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.itemTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {isAr ? `جدول أعمال مجموعة #${item.group_id || item.id}` : `Group Agenda #${item.group_id || item.id}`}
                  </Text>

                  <View style={styles.infoRow}>
                    <User size={14} color={colors.primary} style={{ marginEnd: 4 }} />
                    <Text style={[styles.infoLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                      {isAr ? `مقدم التقرير: ${submitter}` : `Submitter: ${submitter}`}
                    </Text>
                  </View>

                  {item.meetings_per_week ? (
                    <View style={styles.infoRow}>
                      <Users size={14} color={colors.primary} style={{ marginEnd: 4 }} />
                      <Text style={[styles.infoLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                        {isAr ? `${item.meetings_per_week} اجتماعات أسبوعياً` : `${item.meetings_per_week} meetings/week`}
                      </Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedItem({ ...item, modalType: 'group' })}
                    activeOpacity={0.85}
                  >
                    <Eye size={15} color="#ffffff" style={{ marginEnd: 6 }} />
                    <Text style={styles.viewDetailsText}>{isAr ? 'عرض التفاصيل الكاملة' : 'View Details'}</Text>
                  </TouchableOpacity>
                </View>
              );
            } else if (activeTab === 'service_bodies') {
              // Service Body Agenda Item
              const title = item.title || item.name || (isAr ? 'جدول أعمال هيئة خدمية' : 'Service Body Agenda');
              const sbName = item.service_body_name || (isAr ? 'مجلس الخدمة الإقليمية (RSC)' : 'Regional Service Committee');
              const status = item.status || 'submitted';

              return (
                <View style={[styles.card, shadows.card]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.statusBadge, status === 'approved' ? styles.statusApproved : styles.statusSubmitted]}>
                      <Text style={[styles.statusBadgeText, status === 'approved' ? styles.statusApprovedText : styles.statusSubmittedText]}>
                        {status === 'approved' ? (isAr ? 'معتمد' : 'Approved') : (isAr ? 'مقدم' : 'Submitted')}
                      </Text>
                    </View>
                    {item.created_at ? (
                      <Text style={styles.dateText}>{item.created_at.slice(0, 10)}</Text>
                    ) : null}
                  </View>

                  <Text style={[styles.itemTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {title}
                  </Text>

                  <View style={styles.infoRow}>
                    <Building2 size={14} color={colors.primary} style={{ marginEnd: 4 }} />
                    <Text style={[styles.infoLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                      {sbName}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedItem({ ...item, modalType: 'service_body' })}
                    activeOpacity={0.85}
                  >
                    <Eye size={15} color="#ffffff" style={{ marginEnd: 6 }} />
                    <Text style={styles.viewDetailsText}>{isAr ? 'عرض محضر الاجتماع' : 'View Minutes'}</Text>
                  </TouchableOpacity>
                </View>
              );
            } else {
              // Committee Reports Archive Item
              const title = item.title || item.name || (isAr ? 'تقرير لجنة فرعية' : 'Committee Report');
              const committeeName = item.committee_name || (isAr ? 'لجنة العلاقات العامة والخدمة' : 'Service Committee');
              const isApproved = item.status === 'approved';

              return (
                <View style={[styles.card, shadows.card]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.committeeBadge}>
                      <Text style={styles.committeeText}>{committeeName}</Text>
                    </View>
                    <View style={[styles.statusBadge, isApproved ? styles.statusApproved : styles.statusSubmitted]}>
                      <Text style={[styles.statusBadgeText, isApproved ? styles.statusApprovedText : styles.statusSubmittedText]}>
                        {isApproved ? (isAr ? 'أرشيف معتمد' : 'Approved') : (isAr ? 'مقدم' : 'Submitted')}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.itemTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {title}
                  </Text>

                  {item.description ? (
                    <Text style={[styles.itemDescription, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                      {item.description}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedItem({ ...item, modalType: 'committee' })}
                    activeOpacity={0.85}
                  >
                    <DownloadCloud size={15} color="#ffffff" style={{ marginEnd: 6 }} />
                    <Text style={styles.viewDetailsText}>{isAr ? 'قراءة وتحميل الوثيقة' : 'View & Download Document'}</Text>
                  </TouchableOpacity>
                </View>
              );
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FolderX size={52} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {user
                  ? isAr
                    ? 'لا توجد سجلات مسجلة في هذا القسم حالياً'
                    : 'No records found in this section'
                  : isAr
                  ? 'سجل دخولك بحساب مايكروسوفت للاطلاع على السجلات'
                  : 'Sign in with Microsoft to access records'}
              </Text>
              <Text style={[styles.emptySubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr
                  ? 'يتم مزامنة تقارير وأرشيف اللجان وجداول الأعمال مباشرة من قاعدة بيانات egyptna.org.'
                  : 'Agendas and Committee records synchronize directly from egyptna.org.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Details & Document Viewer Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]} numberOfLines={1}>
              {selectedItem?.title || selectedItem?.name || `تقرير #${selectedItem?.id}`}
            </Text>
            <TouchableOpacity onPress={() => setSelectedItem(null)} hitSlop={10}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={[styles.modalCard, shadows.card]}>
              <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr ? 'العنوان / التعريف:' : 'Title / Identifier:'}
              </Text>
              <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {selectedItem?.title || selectedItem?.name || `سجل رقم #${selectedItem?.id}`}
              </Text>

              {selectedItem?.agenda_date || selectedItem?.created_at ? (
                <>
                  <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {isAr ? 'التاريخ:' : 'Date:'}
                  </Text>
                  <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {(selectedItem?.agenda_date || selectedItem?.created_at || '').slice(0, 10)}
                  </Text>
                </>
              ) : null}

              {selectedItem?.submitter_name ? (
                <>
                  <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {isAr ? 'مقدم التقرير:' : 'Submitter:'}
                  </Text>
                  <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {selectedItem.submitter_name}
                  </Text>
                </>
              ) : null}

              {selectedItem?.service_position ? (
                <>
                  <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {isAr ? 'الصفة الخدمية:' : 'Service Position:'}
                  </Text>
                  <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {selectedItem.service_position}
                  </Text>
                </>
              ) : null}

              {selectedItem?.description ? (
                <>
                  <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {isAr ? 'البيان / التفاصيل:' : 'Details:'}
                  </Text>
                  <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {selectedItem.description}
                  </Text>
                </>
              ) : null}

              <View style={styles.officialBadge}>
                <ShieldAlert size={14} color={colors.primary} style={{ marginEnd: 4 }} />
                <Text style={styles.officialBadgeText}>
                  {isAr ? 'وثيقة رسمية معتمدة من زمالة NA مصر' : 'Official Document - NA Egypt'}
                </Text>
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
    backgroundColor: '#f7fbff',
  },
  safeHeader: {
    backgroundColor: colors.primary,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.sm + 2,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: '#ffffff',
    fontSize: 18,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  tabSelectorWrapper: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  tabSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.md,
    borderRadius: 11,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
  },
  tabButtonText: {
    ...typography.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  tabButtonTextActive: {
    color: colors.primary,
  },
  authStatusContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  loggedInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: '#e6f4ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutButton: {
    padding: spacing.xs + 2,
  },
  lockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  lockIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: '#e4f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.sm,
  },
  lockInfo: {
    flex: 1,
  },
  lockTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  lockSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.md,
  },
  loginBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  positionBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  positionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    fontSize: 11,
  },
  committeeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  committeeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusApproved: {
    backgroundColor: '#e6f4ea',
  },
  statusSubmitted: {
    backgroundColor: '#fff7ed',
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  statusApprovedText: {
    color: colors.success,
  },
  statusSubmittedText: {
    color: colors.warning,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4f7fa',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  dateText: {
    ...typography.caption,
    color: '#0891b2',
    fontWeight: '600',
    fontSize: 11,
  },
  itemTitle: {
    ...typography.h3,
    color: colors.primary,
    marginVertical: spacing.xs + 2,
  },
  itemDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  viewDetailsText: {
    ...typography.body,
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f7fbff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.primary,
    flex: 1,
    marginEnd: spacing.md,
  },
  modalContent: {
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  modalFieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  modalFieldValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4f7fa',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  officialBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});
