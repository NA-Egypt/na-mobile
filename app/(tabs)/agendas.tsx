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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Lock, LogOut, FileText, X, ShieldAlert, CheckCircle2, Eye, FolderX, Calendar, User, Users } from 'lucide-react-native';
import { authApi, UserProfile } from '../../src/api/auth';
import { apiClient } from '../../src/api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

export default function AgendasScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [agendas, setAgendas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<any | null>(null);

  const fetchLiveAgendas = async () => {
    setIsLoading(true);
    try {
      const [agendasRes, serviceAgendasRes] = await Promise.allSettled([
        apiClient.get('/agendas'),
        apiClient.get('/service-body-agendas'),
      ]);

      const items: any[] = [];

      if (agendasRes.status === 'fulfilled') {
        const data = agendasRes.value.data?.data || agendasRes.value.data || [];
        if (Array.isArray(data)) {
          items.push(...data);
        }
      }

      if (serviceAgendasRes.status === 'fulfilled') {
        const data = serviceAgendasRes.value.data?.data || serviceAgendasRes.value.data || [];
        if (Array.isArray(data)) {
          items.push(...data);
        }
      }

      setAgendas(items);
    } catch (e) {
      console.warn('Error fetching live agendas:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    authApi.getStoredUser().then((stored) => {
      setUser(stored);
      fetchLiveAgendas();
    });
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveAgendas();
  };

  return (
    <View style={styles.screenWrapper}>
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        <View style={styles.headerBanner}>
          <View style={styles.iconCircle}>
            <FileText size={22} color="#ffffff" />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'جداول الأعمال والتقارير الخدمية' : 'Agendas & Service Reports'}
            </Text>
            <Text style={[styles.headerSubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr
                ? 'تقارير مجموعات الزمالة ومحاضر اجتماعات الهيئات الخدمية'
                : 'Group Agendas, Meeting Reports & Service Body Records'}
            </Text>
          </View>
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
                {user.name || (isAr ? 'خادم معتمد' : 'Trusted Servant')}
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
                {isAr ? 'بوابة خادمي المجموعات' : 'Trusted Servants Portal'}
              </Text>
              <Text style={[styles.lockSubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr ? 'سجل دخولك بحساب مايكروسوفت للاطلاع على التقارير' : 'Sign in with Microsoft to access reports'}
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
            {isAr ? 'جاري جلب جداول الأعمال من الخادم...' : 'Loading agendas from server...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={agendas}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => {
            const dateStr = item.agenda_date || item.created_at || '';
            const submitter = item.submitter_name || (isAr ? 'غير محدد' : 'N/A');
            const position = item.service_position || (isAr ? 'خادم موثوق' : 'Trusted Servant');
            const meetingsCount = item.meetings_per_week ? `${item.meetings_per_week} ${isAr ? 'اجتماعات/أسبوع' : 'meetings/week'}` : '';

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

                <Text style={[styles.agendaTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                  {isAr ? `جدول أعمال مجموعة رقم #${item.group_id || item.id}` : `Group Agenda #${item.group_id || item.id}`}
                </Text>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <User size={14} color={colors.primary} style={{ marginEnd: 4 }} />
                    <Text style={[styles.infoLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                      {isAr ? `المقدم: ${submitter}` : `Submitter: ${submitter}`}
                    </Text>
                  </View>

                  {meetingsCount ? (
                    <View style={styles.infoItem}>
                      <Users size={14} color={colors.primary} style={{ marginEnd: 4 }} />
                      <Text style={[styles.infoLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                        {meetingsCount}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {item.new_comers !== undefined && item.new_comers !== null ? (
                  <View style={styles.newcomersBox}>
                    <Text style={[styles.newcomersText, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                      {isAr ? `عدد القادمين الجدد (Newcomers): ${item.new_comers}` : `Newcomers count: ${item.new_comers}`}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => setSelectedAgenda(item)}
                  activeOpacity={0.85}
                >
                  <Eye size={15} color="#ffffff" style={{ marginEnd: 6 }} />
                  <Text style={styles.viewDetailsText}>
                    {isAr ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FolderX size={52} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr ? 'لا توجد جداول أعمال مسجلة حالياً' : 'No agendas currently registered'}
              </Text>
              <Text style={[styles.emptySubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr
                  ? 'يتم عرض جداول أعمال المجموعات وتقارير الهيئات الخدمية فور إدراجها على الخادم.'
                  : 'Agendas will appear here once submitted on egyptna.org.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Agenda Detail Modal */}
      <Modal
        visible={!!selectedAgenda}
        animationType="slide"
        onRequestClose={() => setSelectedAgenda(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr
                ? `تفاصيل جدول الأعمال #${selectedAgenda?.id}`
                : `Agenda Details #${selectedAgenda?.id}`}
            </Text>
            <TouchableOpacity onPress={() => setSelectedAgenda(null)} hitSlop={10}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={[styles.modalCard, shadows.card]}>
              <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr ? 'التاريخ:' : 'Date:'}
              </Text>
              <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {selectedAgenda?.agenda_date || selectedAgenda?.created_at || 'N/A'}
              </Text>

              <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr ? 'مقدم التقرير:' : 'Submitter:'}
              </Text>
              <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {selectedAgenda?.submitter_name || 'N/A'}
              </Text>

              <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr ? 'الصفة الخدمية:' : 'Service Position:'}
              </Text>
              <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {selectedAgenda?.service_position || 'N/A'}
              </Text>

              {selectedAgenda?.meetings_per_week ? (
                <>
                  <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {isAr ? 'عدد الاجتماعات أسبوعياً:' : 'Meetings / Week:'}
                  </Text>
                  <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {selectedAgenda.meetings_per_week}
                  </Text>
                </>
              ) : null}

              {selectedAgenda?.new_comers !== undefined ? (
                <>
                  <Text style={[styles.modalFieldLabel, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {isAr ? 'القادمون الجدد:' : 'Newcomers:'}
                  </Text>
                  <Text style={[styles.modalFieldValue, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {selectedAgenda.new_comers}
                  </Text>
                </>
              ) : null}

              <View style={styles.officialBadge}>
                <ShieldAlert size={14} color={colors.primary} style={{ marginEnd: 4 }} />
                <Text style={styles.officialBadgeText}>
                  {isAr ? 'سجل معتمد من قاعدة بيانات زمالة NA مصر' : 'Verified NA Egypt Record'}
                </Text>
              </View>
            </View>
          </View>
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
    paddingVertical: spacing.md,
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
  agendaTitle: {
    ...typography.h3,
    color: colors.primary,
    marginVertical: spacing.xs + 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  newcomersBox: {
    backgroundColor: '#f8fafc',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  newcomersText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
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
    flex: 1,
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
