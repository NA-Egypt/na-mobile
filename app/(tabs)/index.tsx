import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  PhoneCall,
  MapPin,
  Calendar,
  Users,
  Compass,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Clock,
  ArrowUpRight,
  HeartHandshake,
  Navigation,
} from 'lucide-react-native';
import { AppText, Badge, AppHeader } from '../../src/components/ui';
import { JftModal } from '../../src/components/JftModal';
import { HelplineModal } from '../../src/components/HelplineModal';
import { homeApi } from '../../src/api/home';
import { FrontpageStats, JftData, HelplineItem } from '../../src/api/types';
import { useAppTheme } from '../../src/theme';
import { haptic } from '../../src/utils/haptics';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows, isDark } = useAppTheme();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isJftVisible, setIsJftVisible] = useState(false);
  const [isHelplineVisible, setIsHelplineVisible] = useState(false);

  const [stats, setStats] = useState<FrontpageStats>({
    weekly_meetings: 78,
    groups: 35,
    governorates: 9,
    upcoming_events: 4,
  });

  const [jft, setJft] = useState<JftData>({
    title: 'تأمل اليوم في التعافي',
    date: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    quote: 'نحن لا نستطيع أن نغير من أين أتينا، ولكننا نستطيع أن نغير إلى أين نحن ذاهبون.',
    quote_source: 'الكتاب الأساسي لزمالة المدمنين المجهولين',
  });

  const OFFICIAL_DEFAULT_HELPLINES: HelplineItem[] = [
    {
      region: 'Cairo & Giza',
      region_ar: 'القاهرة والجيزة',
      phones: ['+201006979198', '+201060933888'],
      whatsapp: '+201060933888',
    },
    {
      region: 'Alexandria',
      region_ar: 'الإسكندرية',
      phones: ['+201503884411'],
      whatsapp: '+201503884411',
    },
    {
      region: 'Al Ahram',
      region_ar: 'الأهرام',
      phones: ['+201003694690'],
      whatsapp: '+201003694690',
    },
  ];

  const [helplines, setHelplines] = useState<HelplineItem[]>(OFFICIAL_DEFAULT_HELPLINES);

  const loadHomeData = async () => {
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const nextYearIso = new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0];

      const [statsRes, jftRes, homeDataRes, calEventsRes] = await Promise.allSettled([
        homeApi.getStats(),
        homeApi.getJft(),
        homeApi.getHomeData(),
        homeApi.getHomeData().catch(() => null),
      ]);

      let upcomingEventsCount = 0;

      if (homeDataRes.status === 'fulfilled' && homeDataRes.value) {
        const home = homeDataRes.value;
        if (Array.isArray(home.helplines) && home.helplines.length > 0) {
          setHelplines(home.helplines);
        }
        if (Array.isArray(home.upcoming_events)) {
          upcomingEventsCount = home.upcoming_events.length;
        }
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats((prev) => ({
          ...prev,
          ...statsRes.value,
          upcoming_events: upcomingEventsCount || statsRes.value.upcoming_events || prev.upcoming_events,
        }));
      } else if (upcomingEventsCount > 0) {
        setStats((prev) => ({ ...prev, upcoming_events: upcomingEventsCount }));
      }

      if (jftRes.status === 'fulfilled' && jftRes.value) {
        setJft(jftRes.value);
      }
    } catch (e) {
      // Keep resilient cached fallback
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    haptic.light();
    await loadHomeData();
    setIsRefreshing(false);
  };

  const handleCall = (phoneNumber: string) => {
    haptic.selection();
    Linking.openURL(`tel:${phoneNumber}`).catch(() => { });
  };

  const handleWhatsApp = (whatsappNumber: string) => {
    haptic.selection();
    const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/2${cleanNum}`).catch(() => { });
  };

  return (
    <View style={[styles.screenWrapper, { backgroundColor: isDark ? colors.bgDark : colors.primaryDark }]}>
      <AppHeader
        title={isAr ? 'زمالة المدمنين المجهولين' : 'Narcotics Anonymous'}
        subtitle={isAr ? 'مصر • NA Egypt Fellowship' : 'Egypt • Official Fellowship'}
      />

      <ScrollView
        style={[styles.contentBody, { backgroundColor: colors.bgPrimary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent, colors.primary]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Welcome Banner */}
        <View style={[styles.welcomeCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={[styles.welcomeHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.welcomeIconWrapper, { backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : colors.accentLight, marginEnd: isAr ? 0 : 12, marginStart: isAr ? 12 : 0 }]}>
              <HeartHandshake size={24} color={isDark ? '#22d3ee' : colors.accentDark} />
            </View>
            <View style={[styles.welcomeTextCol, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
              <AppText variant="h2" color={colors.textPrimary} weight="800" style={{ textAlign: isAr ? 'right' : 'left' }}>
                {isAr ? 'أهلاً بك في زمالة المدمنين المجهولين' : 'Welcome to NA Egypt'}
              </AppText>
              <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 2, textAlign: isAr ? 'right' : 'left' }}>
                {isAr
                  ? 'أي مدمن يمكنه التوقف عن التعاطي وفقدان الرغبة وإيجاد طريقة جديدة للحياة.'
                  : 'Any addict can stop using, lose the desire to use, and find a new way to live.'}
              </AppText>
            </View>
          </View>
        </View>

        {/* Live Fellowship Stats Grid */}
        <View style={[styles.sectionHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <AppText variant="h3" color={colors.textPrimary} weight="800">
            {isAr ? 'إحصائيات وخدمات الزمالة' : 'Fellowship Overview'}
          </AppText>
          <Badge label={isAr ? 'مباشر' : 'Live'} variant="accent" size="sm" />
        </View>

        <View style={styles.statsGrid}>
          {/* Stat 1: Weekly Meetings */}
          <TouchableOpacity
            style={[styles.statCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => {
              haptic.selection();
              router.push('/(tabs)/meetings');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : colors.primaryLight + '20' }]}>
              <Clock size={20} color={isDark ? '#38bdf8' : colors.primary} />
            </View>
            <AppText variant="h1" color={isDark ? '#38bdf8' : colors.primary} weight="800" style={styles.statNumber}>
              {stats.weekly_meetings || stats.total_meetings || '0'}
            </AppText>
            <AppText variant="labelSmall" color={colors.textSecondary} weight="700" style={styles.statLabel}>
              {isAr ? 'اجتماع أسبوعي' : 'Weekly Meetings'}
            </AppText>
          </TouchableOpacity>

          {/* Stat 2: Active Groups */}
          <TouchableOpacity
            style={[styles.statCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => {
              haptic.selection();
              router.push('/(tabs)/meetings');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(34, 211, 238, 0.18)' : colors.accentLight }]}>
              <Users size={20} color={isDark ? '#22d3ee' : colors.accentDark} />
            </View>
            <AppText variant="h1" color={isDark ? '#22d3ee' : colors.accentDark} weight="800" style={styles.statNumber}>
              {stats.groups || stats.total_groups || '0'}
            </AppText>
            <AppText variant="labelSmall" color={colors.textSecondary} weight="700" style={styles.statLabel}>
              {isAr ? 'مجموعة نشطة' : 'Active Groups'}
            </AppText>
          </TouchableOpacity>

          {/* Stat 3: Governorates Covered */}
          <View style={[styles.statCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.18)' : colors.goldLight }]}>
              <Compass size={20} color={isDark ? '#fbbf24' : colors.goldDark} />
            </View>
            <AppText variant="h1" color={isDark ? '#fbbf24' : colors.goldDark} weight="800" style={styles.statNumber}>
              {stats.governorates || stats.cities || '0'}
            </AppText>
            <AppText variant="labelSmall" color={colors.textSecondary} weight="700" style={styles.statLabel}>
              {isAr ? 'محافظات مغطاة' : 'Governorates'}
            </AppText>
          </View>

          {/* Stat 4: Upcoming Events */}
          <TouchableOpacity
            style={[styles.statCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => {
              haptic.selection();
              router.push('/(tabs)/events');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.18)' : colors.successLight }]}>
              <Calendar size={20} color={isDark ? '#34d399' : colors.success} />
            </View>
            <AppText variant="h1" color={isDark ? '#34d399' : colors.success} weight="800" style={styles.statNumber}>
              {stats.upcoming_events !== undefined && stats.upcoming_events !== null ? String(stats.upcoming_events) : '0'}
            </AppText>
            <AppText variant="labelSmall" color={colors.textSecondary} weight="700" style={styles.statLabel}>
              {isAr ? 'فعاليات قادمة' : 'Upcoming Events'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Quick Action Navigation Cards */}
        <View style={styles.quickLinksRow}>
          {/* Card 1: Nearest Meeting to Me (Spotlight) */}
          <TouchableOpacity
            style={[
              styles.quickLinkCard,
              shadows.card,
              {
                backgroundColor: isDark ? '#0c2a3e' : '#0369a1',
                borderColor: isDark ? '#0284c7' : '#38bdf8',
                borderWidth: 1.5,
                marginBottom: 10,
                flexDirection: isAr ? 'row-reverse' : 'row',
              },
            ]}
            onPress={() => {
              haptic.selection();
              router.push('/(tabs)/meetings?nearest=1');
            }}
            activeOpacity={0.85}
          >
            <View style={[styles.quickLinkContent, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View
                style={[
                  styles.quickLinkIconCircle,
                  { backgroundColor: isDark ? 'rgba(34, 211, 238, 0.25)' : 'rgba(255, 255, 255, 0.2)' },
                  isAr ? { marginLeft: 12 } : { marginRight: 12 },
                ]}
              >
                <Navigation size={22} color={isDark ? '#22d3ee' : '#ffffff'} />
              </View>
              <View style={{ alignItems: isAr ? 'flex-end' : 'flex-start', flex: 1 }}>
                <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <AppText variant="label" color="#ffffff" weight="800">
                    {isAr ? 'أقرب اجتماع لي' : 'Nearest Meeting to Me'}
                  </AppText>
                  <Badge label={isAr ? 'GPS' : 'GPS'} variant="accent" size="sm" />
                </View>
                <AppText variant="caption" color="rgba(224, 248, 252, 0.9)" style={{ marginTop: 2 }}>
                  {isAr ? 'اعثر فوراً على أقرب اجتماع قادم لموقعك' : 'Find the closest upcoming meeting to your location'}
                </AppText>
              </View>
            </View>
            <ArrowUpRight size={20} color="#ffffff" style={{ transform: [{ scaleX: isAr ? -1 : 1 }] }} />
          </TouchableOpacity>

          {/* Card 2: Full Directory Search */}
          <TouchableOpacity
            style={[
              styles.quickLinkCard,
              { backgroundColor: isDark ? colors.cardElevated : colors.primaryDark, flexDirection: isAr ? 'row-reverse' : 'row' },
            ]}
            onPress={() => {
              haptic.selection();
              router.push('/(tabs)/meetings');
            }}
            activeOpacity={0.85}
          >
            <View style={[styles.quickLinkContent, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View
                style={[
                  styles.quickLinkIconCircle,
                  { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
                  isAr ? { marginLeft: 12 } : { marginRight: 12 },
                ]}
              >
                <MapPin size={20} color="#ffffff" />
              </View>
              <View style={{ alignItems: isAr ? 'flex-end' : 'flex-start', flex: 1 }}>
                <AppText variant="label" color="#ffffff" weight="800">
                  {isAr ? 'دليل جميع الاجتماعات' : 'Browse All Meetings'}
                </AppText>
                <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" style={{ marginTop: 2 }}>
                  {isAr ? 'تصفح حسب اليوم والمحافظة والمنطقة' : 'Filter by day, city & format'}
                </AppText>
              </View>
            </View>
            <ArrowUpRight size={18} color="#ffffff" style={{ transform: [{ scaleX: isAr ? -1 : 1 }] }} />
          </TouchableOpacity>
        </View>

        {/* Just For Today (لليوم فقط) Card */}
        <View style={[styles.jftCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={[styles.jftHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.jftTitleRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View style={[styles.jftIconCircle, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : colors.goldLight, marginEnd: isAr ? 0 : 10, marginStart: isAr ? 10 : 0 }]}>
                <Sparkles size={18} color={isDark ? '#fbbf24' : colors.goldDark} />
              </View>
              <View style={{ alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                <AppText variant="h3" color={colors.textPrimary} weight="800">
                  {isAr ? 'لليوم فقط • تأمل التعافي' : 'Just For Today • Daily Reflection'}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {jft.date || jft.page_date || (isAr ? 'تأمل اليوم' : 'Today')}
                </AppText>
              </View>
            </View>
            <Badge label={isAr ? 'يومي' : 'Daily'} variant="gold" size="sm" />
          </View>

          <View style={[styles.jftQuoteBox, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSolid, alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h3" color={isDark ? '#38bdf8' : colors.primary} weight="700" style={{ marginBottom: 6, textAlign: isAr ? 'right' : 'left' }}>
              {jft.title || (isAr ? 'تأمل اليوم في التعافي' : 'Daily Reflection')}
            </AppText>
            <AppText variant="body" color={colors.textPrimary} style={[styles.jftQuoteText, { textAlign: isAr ? 'right' : 'left' }]}>
              "{jft.quote || jft.thought_for_the_day || (isAr ? 'نحن نعيش التعافي يوماً بيوم.' : 'We live recovery one day at a time.')}"
            </AppText>
            {jft.quote_source ? (
              <AppText variant="caption" color={colors.textMuted} weight="600" style={{ marginTop: 6, textAlign: isAr ? 'right' : 'left' }}>
                — {jft.quote_source}
              </AppText>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.jftActionBtn, { backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : colors.accentLight, flexDirection: isAr ? 'row-reverse' : 'row' }]}
            onPress={() => {
              haptic.selection();
              setIsJftVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Sparkles size={15} color={isDark ? '#22d3ee' : colors.accentDark} style={{ marginEnd: isAr ? 0 : 6, marginStart: isAr ? 6 : 0 }} />
            <AppText variant="label" color={isDark ? '#22d3ee' : colors.accentDark} weight="700">
              {isAr ? 'قراءة التأمل كاملاً' : 'Read Full Reflection'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Helplines Section (خطوط المساعدة) */}
        <View style={[styles.sectionHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
            <PhoneCall size={18} color={isDark ? '#22d3ee' : colors.accentDark} />
            <AppText variant="h3" color={colors.textPrimary} weight="800">
              {isAr ? 'خطوط المساعدة في مصر' : 'Regional Helplines'}
            </AppText>
          </View>
          <TouchableOpacity
            onPress={() => {
              haptic.selection();
              setIsHelplineVisible(true);
            }}
          >
            <AppText variant="labelSmall" color={isDark ? '#22d3ee' : colors.accentDark} weight="700">
              {isAr ? 'عرض الكل' : 'View All'}
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.helplineList}>
          {helplines.slice(0, 3).map((item, idx) => (
            <View
              key={idx}
              style={[styles.helplineCard, shadows.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, flexDirection: isAr ? 'row-reverse' : 'row' }]}
            >
              <View style={[styles.helplineInfo, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                <AppText variant="body" color={colors.textPrimary} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                  {isAr ? item.region_ar || item.region : item.region || item.region_ar}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={{ textAlign: isAr ? 'right' : 'left' }}>
                  {isAr ? 'متاح للرد والدعم على مدار الساعة' : 'Available for fellowship support'}
                </AppText>
              </View>

              <View style={[styles.helplineActions, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                {item.phones && item.phones.length > 0 && (
                  <TouchableOpacity
                    style={[styles.helplineBtn, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : colors.successLight, flexDirection: isAr ? 'row-reverse' : 'row' }]}
                    onPress={() => handleCall(item.phones[0])}
                    activeOpacity={0.8}
                  >
                    <Phone size={14} color={isDark ? '#34d399' : colors.success} style={{ marginEnd: isAr ? 0 : 4, marginStart: isAr ? 4 : 0 }} />
                    <AppText variant="caption" color={isDark ? '#34d399' : colors.success} weight="700">
                      {item.phones[0]}
                    </AppText>
                  </TouchableOpacity>
                )}

                {item.whatsapp && (
                  <TouchableOpacity
                    style={[styles.helplineBtn, { backgroundColor: isDark ? 'rgba(34, 211, 238, 0.2)' : colors.accentLight, flexDirection: isAr ? 'row-reverse' : 'row' }]}
                    onPress={() => handleWhatsApp(item.whatsapp!)}
                    activeOpacity={0.8}
                  >
                    <MessageCircle size={14} color={isDark ? '#22d3ee' : colors.accentDark} style={{ marginEnd: isAr ? 0 : 4, marginStart: isAr ? 4 : 0 }} />
                    <AppText variant="caption" color={isDark ? '#22d3ee' : colors.accentDark} weight="700">
                      WhatsApp
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Just For Today Modal */}
      <JftModal
        visible={isJftVisible}
        onClose={() => setIsJftVisible(false)}
      />

      {/* Regional Helplines Modal */}
      <HelplineModal
        visible={isHelplineVisible}
        onClose={() => setIsHelplineVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  contentBody: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  welcomeCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  welcomeTextCol: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    lineHeight: 26,
  },
  statLabel: {
    marginTop: 2,
  },
  quickLinksRow: {
    marginBottom: 18,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
  },
  quickLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickLinkIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jftCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  jftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jftIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jftQuoteBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  jftQuoteText: {
    lineHeight: 22,
    fontStyle: 'italic',
  },
  jftActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  helplineList: {
    gap: 10,
  },
  helplineCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  helplineInfo: {
    flex: 1,
    minWidth: 140,
  },
  helplineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helplineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
