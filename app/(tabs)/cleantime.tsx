import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import {
  Award,
  Calendar,
  Sparkles,
  Share2,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft,
  X,
  Heart,
  Quote,
} from 'lucide-react-native';
import { AppText, Badge, AppButton, AppHeader } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme';
import { haptic } from '../../src/utils/haptics';

const CLEAN_DATE_STORAGE_KEY = 'na_user_clean_date';

interface KeytagMilestone {
  id: string;
  days: number;
  labelAr: string;
  labelEn: string;
  color: string;
  textColor: string;
  borderColor: string;
}

const NA_KEYTAGS: KeytagMilestone[] = [
  {
    id: '1day',
    days: 1,
    labelAr: 'يوم واحد / مرحباً',
    labelEn: '1 Day / Welcome',
    color: '#ffffff',
    textColor: '#1e293b',
    borderColor: '#cbd5e1',
  },
  {
    id: '30days',
    days: 30,
    labelAr: '٣٠ يوماً',
    labelEn: '30 Days',
    color: '#f97316',
    textColor: '#ffffff',
    borderColor: '#ea580c',
  },
  {
    id: '60days',
    days: 60,
    labelAr: '٦٠ يوماً',
    labelEn: '60 Days',
    color: '#22c55e',
    textColor: '#ffffff',
    borderColor: '#16a34a',
  },
  {
    id: '90days',
    days: 90,
    labelAr: '٩٠ يوماً',
    labelEn: '90 Days',
    color: '#ef4444',
    textColor: '#ffffff',
    borderColor: '#dc2626',
  },
  {
    id: '6months',
    days: 182,
    labelAr: '٦ شهور',
    labelEn: '6 Months',
    color: '#3b82f6',
    textColor: '#ffffff',
    borderColor: '#2563eb',
  },
  {
    id: '9months',
    days: 273,
    labelAr: '٩ شهور',
    labelEn: '9 Months',
    color: '#eab308',
    textColor: '#ffffff',
    borderColor: '#ca8a04',
  },
  {
    id: '1year',
    days: 365,
    labelAr: 'سنة واحدة',
    labelEn: '1 Year (Moonglow)',
    color: '#8b5cf6',
    textColor: '#ffffff',
    borderColor: '#7c3aed',
  },
  {
    id: '18months',
    days: 547,
    labelAr: '١٨ شهراً',
    labelEn: '18 Months',
    color: '#64748b',
    textColor: '#ffffff',
    borderColor: '#475569',
  },
  {
    id: '2years',
    days: 730,
    labelAr: 'سنتان',
    labelEn: '2 Years',
    color: '#0f172a',
    textColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  {
    id: '3years',
    days: 1095,
    labelAr: '٣ سنوات',
    labelEn: '3 Years',
    color: '#0f172a',
    textColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  {
    id: '5years',
    days: 1825,
    labelAr: '٥ سنوات',
    labelEn: '5 Years',
    color: '#0f172a',
    textColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
];

const NA_LITERATURE_QUOTES = [
  {
    quoteAr: 'لليوم فقط: ستكون أفكاري متجهة نحو تعافيي، عائشاً ومستمتعاً بالحياة دون استخدام المخدرات.',
    quoteEn: 'Just for today, my thoughts will be on my recovery, living and enjoying life without the use of drugs.',
    sourceAr: 'النص الأساسي لزمالة المدمنين المجهولين',
    sourceEn: 'NA Basic Text',
  },
  {
    quoteAr: 'نحن لا نستطيع أن نغير من أين أتينا، ولكننا نستطيع أن نغير إلى أين نحن ذاهبون.',
    quoteEn: 'We cannot change where we come from, but we can change where we are going.',
    sourceAr: 'النص الأساسي لزمالة المدمنين المجهولين',
    sourceEn: 'NA Basic Text',
  },
  {
    quoteAr: 'إن امتناني يتحدث عندما أهتم وأشارك الآخرين بطريقة زمالة المدمنين المجهولين.',
    quoteEn: 'My gratitude speaks when I care and when I share with others the NA way.',
    sourceAr: 'النص الأساسي لزمالة المدمنين المجهولين',
    sourceEn: 'NA Basic Text',
  },
  {
    quoteAr: 'أي مدمن يمكنه التوقف عن التعاطي وفقدان الرغبة وإيجاد طريقة جديدة للحياة.',
    quoteEn: 'An addict, any addict, can stop using drugs, lose the desire to use, and find a new way to live.',
    sourceAr: 'النص الأساسي لزمالة المدمنين المجهولين',
    sourceEn: 'NA Basic Text',
  },
  {
    quoteAr: 'واصل الحضور، البرنامج يعمل!',
    quoteEn: 'Keep coming back, it works!',
    sourceAr: 'شعار زمالة المدمنين المجهولين',
    sourceEn: 'NA Fellowship Slogan',
  },
];

export default function CleantimeScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, isDark, borderRadius, shadows } = useAppTheme();

  // Default to today or saved clean date
  const [cleanDate, setCleanDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());

  // Load saved date
  useEffect(() => {
    SecureStore.getItemAsync(CLEAN_DATE_STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          const parsed = new Date(saved);
          if (!isNaN(parsed.getTime())) {
            setCleanDate(parsed);
          }
        }
      })
      .catch(() => { });
  }, []);

  const saveCleanDate = async (newDate: Date) => {
    setCleanDate(newDate);
    try {
      await SecureStore.setItemAsync(CLEAN_DATE_STORAGE_KEY, newDate.toISOString());
    } catch { }
  };

  // Calculate clean time intervals
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - cleanDate.getTime());
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalWeeks = Math.floor(totalDays / 7);

  // Exact Year / Month / Day calculation
  let years = now.getFullYear() - cleanDate.getFullYear();
  let months = now.getMonth() - cleanDate.getMonth();
  let remainingDays = now.getDate() - cleanDate.getDate();

  if (remainingDays < 0) {
    months -= 1;
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    remainingDays += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) {
    years = 0;
    months = 0;
    remainingDays = 0;
  }

  // Find next keytag milestone
  const nextMilestone = NA_KEYTAGS.find((k) => k.days > totalDays) || null;
  const currentMilestoneIndex = NA_KEYTAGS.findIndex((k) => k.days > totalDays);
  const prevMilestoneDays =
    currentMilestoneIndex > 0 ? NA_KEYTAGS[currentMilestoneIndex - 1].days : 0;

  const milestoneProgress = nextMilestone
    ? Math.min(
      100,
      Math.max(
        0,
        ((totalDays - prevMilestoneDays) / (nextMilestone.days - prevMilestoneDays)) * 100
      )
    )
    : 100;
  const daysRemaining = nextMilestone ? Math.max(0, nextMilestone.days - totalDays) : 0;

  // Random daily quote (deterministic for the day)
  const quoteIndex = totalDays % NA_LITERATURE_QUOTES.length;
  const dailyQuote = NA_LITERATURE_QUOTES[quoteIndex];

  const handleShare = async () => {
    haptic.selection();
    const shareMessage = t('cleantime.share_message', {
      days: totalDays,
      years,
      months,
      remainingDays,
    });
    try {
      await Share.share({
        message: shareMessage,
        title: t('cleantime.share_title', 'أيام تعافيي في زمالة المدمنين المجهولين'),
      });
    } catch { }
  };

  const handleOpenPicker = () => {
    haptic.selection();
    setTempYear(cleanDate.getFullYear());
    setTempMonth(cleanDate.getMonth() + 1);
    setTempDay(cleanDate.getDate());
    setIsPickerVisible(true);
  };

  const handleApplyPickerDate = () => {
    haptic.success();
    const newDate = new Date(tempYear, tempMonth - 1, tempDay, 0, 0, 0, 0);
    if (newDate > new Date()) {
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr
          ? 'لا يمكن اختيار تاريخ في المستقبل.'
          : 'Clean date cannot be in the future.'
      );
      return;
    }
    saveCleanDate(newDate);
    setIsPickerVisible(false);
  };

  const handleQuickPreset = (daysAgo: number) => {
    haptic.selection();
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setTempYear(d.getFullYear());
    setTempMonth(d.getMonth() + 1);
    setTempDay(d.getDate());
  };

  const formattedDate = cleanDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.screenWrapper, { backgroundColor: isDark ? colors.bgDark : colors.primaryDark }]}>
      <AppHeader
        title={t('cleantime.title', 'حاسبة أيام التعافي')}
        subtitle={t('cleantime.subtitle', 'احسب واحتفل بأيام ومراحل تعافيك لليوم فقط')}
        showBrand={false}
      />

      <ScrollView
        style={[styles.contentBody, { backgroundColor: colors.bgPrimary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Clean Date Card */}
        <View
          style={[
            styles.dateCard,
            shadows.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[styles.dateRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.dateIconWrapper, { backgroundColor: colors.accent + '20' }]}>
              <Calendar size={22} color={colors.accent} />
            </View>

            <View style={[styles.dateInfo, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
              <AppText variant="caption" color={colors.textMuted}>
                {t('cleantime.pick_date_label', 'تاريخ الامتناع')}
              </AppText>
              <AppText variant="body" weight="800" color={colors.textPrimary}>
                {formattedDate}
              </AppText>
            </View>

            <TouchableOpacity
              onPress={handleOpenPicker}
              style={[
                styles.changeDateBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.primaryLight + '18',
                  borderColor: colors.cardBorder,
                },
              ]}
              activeOpacity={0.8}
            >
              <AppText variant="labelSmall" weight="700" color={colors.primary}>
                {t('cleantime.change_date', 'تعديل التاريخ')}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Hero Total Days Clean Counter */}
        <View
          style={[
            styles.heroCounterCard,
            shadows.lg,
            {
              backgroundColor: isDark ? colors.cardElevated : colors.primaryDark,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.heroGlowCircle} />

          <View style={[styles.heroHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <Sparkles size={20} color={colors.accent} />
            <AppText variant="label" color="#ffffff" weight="800" style={{ letterSpacing: 0.5 }}>
              {isAr ? 'لليوم فقط • JUST FOR TODAY' : 'JUST FOR TODAY • لليوم فقط'}
            </AppText>
            <Sparkles size={20} color={colors.accent} />
          </View>

          <View style={styles.heroNumberContainer}>
            <AppText variant="display" color="#ffffff" weight="800" style={styles.heroNumber}>
              {totalDays}
            </AppText>
            <AppText variant="h3" color={colors.accent} weight="700" style={{ marginTop: -4 }}>
              {t('cleantime.total_days', 'إجمالي أيام التعافي')}
            </AppText>
          </View>

          {/* Breakdown Grid: Years, Months, Days */}
          <View style={styles.breakdownGrid}>
            <View style={[styles.breakdownBox, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <AppText variant="h2" color="#ffffff" weight="800">
                {years}
              </AppText>
              <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" weight="600">
                {t('cleantime.years', 'سنوات')}
              </AppText>
            </View>

            <View style={[styles.breakdownBox, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <AppText variant="h2" color="#ffffff" weight="800">
                {months}
              </AppText>
              <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" weight="600">
                {t('cleantime.months', 'شهور')}
              </AppText>
            </View>

            <View style={[styles.breakdownBox, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <AppText variant="h2" color="#ffffff" weight="800">
                {remainingDays}
              </AppText>
              <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" weight="600">
                {t('cleantime.days', 'أيام')}
              </AppText>
            </View>
          </View>

          {/* Secondary stats (Weeks & Hours) */}
          <View style={[styles.subStatsRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.subStatItem, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Clock size={14} color="rgba(224, 248, 252, 0.7)" />
              <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" style={{ marginHorizontal: 4 }}>
                {totalWeeks} {t('cleantime.weeks', 'أسابيع')}
              </AppText>
            </View>

            <View style={{ width: 1, height: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

            <View style={[styles.subStatItem, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Clock size={14} color="rgba(224, 248, 252, 0.7)" />
              <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" style={{ marginHorizontal: 4 }}>
                {totalHours.toLocaleString()} {t('cleantime.hours', 'ساعات')}
              </AppText>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareHeroBtn, { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
          >
            <Share2 size={16} color={colors.primaryDark} />
            <AppText variant="body" weight="800" color={colors.primaryDark} style={{ marginHorizontal: 8 }}>
              {t('cleantime.share_button', 'مشاركة إنجاز التعافي')}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* 3. Next Milestone Progress */}
        {nextMilestone && (
          <View
            style={[
              styles.milestoneCard,
              shadows.card,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            <View style={[styles.milestoneHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View style={[styles.milestoneTitleGroup, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <Award size={20} color={colors.gold} />
                <View style={{ marginHorizontal: 8, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                  <AppText variant="body" weight="800" color={colors.textPrimary}>
                    {t('cleantime.next_milestone', 'الميدالية القادمة')}: {isAr ? nextMilestone.labelAr : nextMilestone.labelEn}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {daysRemaining} {t('cleantime.days_remaining', 'يوم متبقي')}
                  </AppText>
                </View>
              </View>

              <Badge
                label={`${Math.round(milestoneProgress)}%`}
                variant="accent"
                size="sm"
              />
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${milestoneProgress}%`,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* 4. NA Literature Inspiration Box */}
        <View
          style={[
            styles.quoteCard,
            shadows.card,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[styles.quoteHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <Quote size={18} color={colors.primary} />
            <AppText variant="label" weight="800" color={colors.primary} style={{ marginHorizontal: 6 }}>
              {t('cleantime.quote_title', 'من أدبيات زمالة المدمنين المجهولين')}
            </AppText>
          </View>

          <AppText
            variant="body"
            color={colors.textPrimary}
            style={[styles.quoteText, { textAlign: isAr ? 'right' : 'left' }]}
          >
            "{isAr ? dailyQuote.quoteAr : dailyQuote.quoteEn}"
          </AppText>

          <AppText
            variant="caption"
            color={colors.textMuted}
            weight="700"
            style={{ textAlign: isAr ? 'right' : 'left', marginTop: 6 }}
          >
            — {isAr ? dailyQuote.sourceAr : dailyQuote.sourceEn}
          </AppText>
        </View>

        {/* 5. NA Keytags & Medallions Progression */}
        <View style={styles.sectionTitleRow}>
          <AppText variant="h3" weight="800" color={colors.textPrimary}>
            {t('cleantime.keytags_title', 'ميداليات ومراحل زمالة المدمنين المجهولين')}
          </AppText>
        </View>

        <View style={styles.keytagsGrid}>
          {NA_KEYTAGS.map((tag) => {
            const isEarned = totalDays >= tag.days;
            return (
              <View
                key={tag.id}
                style={[
                  styles.keytagCard,
                  shadows.sm,
                  {
                    backgroundColor: isEarned ? tag.color : (isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'),
                    borderColor: isEarned ? tag.borderColor : colors.cardBorder,
                    opacity: isEarned ? 1 : 0.6,
                  },
                ]}
              >
                <View style={styles.keytagRing}>
                  <View style={[styles.keytagHole, { backgroundColor: isEarned ? (tag.color === '#ffffff' ? '#e2e8f0' : '#00000030') : colors.cardBorder }]} />
                </View>

                <View style={styles.keytagContent}>
                  <AppText
                    variant="label"
                    weight="800"
                    color={isEarned ? tag.textColor : colors.textMuted}
                    style={{ textAlign: 'center' }}
                  >
                    {isAr ? tag.labelAr : tag.labelEn}
                  </AppText>

                  <AppText
                    variant="caption"
                    weight="600"
                    color={isEarned ? (tag.color === '#ffffff' ? colors.textSecondary : 'rgba(255,255,255,0.85)') : colors.textMuted}
                    style={{ textAlign: 'center', marginTop: 2 }}
                  >
                    {tag.days} {isAr ? 'يوم' : 'Days'}
                  </AppText>
                </View>

                <View style={styles.keytagStatus}>
                  {isEarned ? (
                    <CheckCircle2 size={16} color={tag.textColor === '#ffffff' ? '#ffffff' : colors.primary} />
                  ) : (
                    <Lock size={14} color={colors.textMuted} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.pickerCard,
              shadows.lg,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderRadius: borderRadius.xl },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.pickerHeader, { borderBottomColor: colors.cardBorder, flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View style={[styles.pickerTitleRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <Calendar size={18} color={colors.primary} />
                <AppText variant="h3" weight="800" color={colors.textPrimary} style={{ marginHorizontal: 8 }}>
                  {t('cleantime.select_clean_date', 'اختر تاريخ امتناعك')}
                </AppText>
              </View>

              <TouchableOpacity
                onPress={() => setIsPickerVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetRow}>
              <TouchableOpacity
                onPress={() => handleQuickPreset(0)}
                style={[styles.presetBtn, { backgroundColor: colors.primaryLight + '20' }]}
              >
                <AppText variant="caption" weight="700" color={colors.primary}>
                  {isAr ? 'اليوم' : 'Today'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickPreset(30)}
                style={[styles.presetBtn, { backgroundColor: colors.primaryLight + '20' }]}
              >
                <AppText variant="caption" weight="700" color={colors.primary}>
                  {isAr ? '٣٠ يوماً' : '30d ago'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickPreset(90)}
                style={[styles.presetBtn, { backgroundColor: colors.primaryLight + '20' }]}
              >
                <AppText variant="caption" weight="700" color={colors.primary}>
                  {isAr ? '٩٠ يوماً' : '90d ago'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickPreset(365)}
                style={[styles.presetBtn, { backgroundColor: colors.primaryLight + '20' }]}
              >
                <AppText variant="caption" weight="700" color={colors.primary}>
                  {isAr ? 'سنة مضت' : '1y ago'}
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Year / Month / Day Selectors */}
            <View style={styles.selectorGrid}>
              {/* Day Selector */}
              <View style={styles.selectorCol}>
                <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: 'center', marginBottom: 4 }}>
                  {isAr ? 'اليوم' : 'Day'}
                </AppText>
                <View style={[styles.selectorBox, { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }]}>
                  <TouchableOpacity
                    onPress={() => setTempDay((d) => Math.min(31, d + 1))}
                    style={styles.stepBtn}
                  >
                    <AppText variant="h3" weight="800" color={colors.primary}>+</AppText>
                  </TouchableOpacity>
                  <AppText variant="h2" weight="800" color={colors.textPrimary}>
                    {tempDay}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => setTempDay((d) => Math.max(1, d - 1))}
                    style={styles.stepBtn}
                  >
                    <AppText variant="h3" weight="800" color={colors.primary}>-</AppText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Month Selector */}
              <View style={styles.selectorCol}>
                <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: 'center', marginBottom: 4 }}>
                  {isAr ? 'الشهر' : 'Month'}
                </AppText>
                <View style={[styles.selectorBox, { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }]}>
                  <TouchableOpacity
                    onPress={() => setTempMonth((m) => Math.min(12, m + 1))}
                    style={styles.stepBtn}
                  >
                    <AppText variant="h3" weight="800" color={colors.primary}>+</AppText>
                  </TouchableOpacity>
                  <AppText variant="h2" weight="800" color={colors.textPrimary}>
                    {tempMonth}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => setTempMonth((m) => Math.max(1, m - 1))}
                    style={styles.stepBtn}
                  >
                    <AppText variant="h3" weight="800" color={colors.primary}>-</AppText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Year Selector */}
              <View style={[styles.selectorCol, { flex: 1.2 }]}>
                <AppText variant="caption" color={colors.textMuted} weight="700" style={{ textAlign: 'center', marginBottom: 4 }}>
                  {isAr ? 'السنة' : 'Year'}
                </AppText>
                <View style={[styles.selectorBox, { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }]}>
                  <TouchableOpacity
                    onPress={() => setTempYear((y) => Math.min(new Date().getFullYear(), y + 1))}
                    style={styles.stepBtn}
                  >
                    <AppText variant="h3" weight="800" color={colors.primary}>+</AppText>
                  </TouchableOpacity>
                  <AppText variant="h2" weight="800" color={colors.textPrimary}>
                    {tempYear}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => setTempYear((y) => Math.max(1953, y - 1))}
                    style={styles.stepBtn}
                  >
                    <AppText variant="h3" weight="800" color={colors.primary}>-</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <AppButton
              title={t('cleantime.save_date', 'حفظ تاريخ التعافي')}
              onPress={handleApplyPickerDate}
              variant="primary"
              size="lg"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
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
    paddingBottom: 36,
  },
  dateCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  dateRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  changeDateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  heroCounterCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 168, 150, 0.15)',
  },
  heroHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heroNumberContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  heroNumber: {
    fontSize: 54,
    lineHeight: 62,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    letterSpacing: -1,
  },
  breakdownGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginVertical: 14,
  },
  breakdownBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  subStatsRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  subStatItem: {
    alignItems: 'center',
  },
  shareHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 14,
    width: '100%',
  },
  milestoneCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  milestoneHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  milestoneTitleGroup: {
    alignItems: 'center',
    flex: 1,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  quoteCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  quoteHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteText: {
    lineHeight: 22,
    fontStyle: 'italic',
  },
  sectionTitleRow: {
    marginBottom: 12,
    marginTop: 4,
  },
  keytagsGrid: {
    gap: 10,
  },
  keytagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  keytagRing: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keytagHole: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  keytagContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  keytagStatus: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderWidth: 1,
  },
  pickerHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  pickerTitleRow: {
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  selectorCol: {
    flex: 1,
  },
  selectorBox: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    height: 130,
  },
  stepBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
