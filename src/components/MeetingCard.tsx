import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
  Modal,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Clock,
  Bookmark,
  Navigation,
  Globe,
  Share2,
  Tag,
  Bell,
  BellRing,
  UserCheck,
  Phone,
  Check,
  X,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAppTheme } from '../theme';
import { AppText, Badge } from './ui';
import { haptic } from '../utils/haptics';
import { useAppStore } from '../store/appStore';
import {
  scheduleMeetingReminder,
  cancelMeetingReminder,
} from '../services/notifications';

export interface MeetingCardProps {
  meetingId: string;
  groupName: string;
  cityName: string;
  neighborhoodName: string;
  dayName: string;
  dayId?: string | number;
  startTime: string;
  endTime: string;
  type: 'open' | 'closed' | string;
  lang: 'ar' | 'en' | 'both' | 'arabic' | 'english' | string;
  gsrName?: string;
  gsrPhone?: string;
  notes?: string;
  locationUrl?: string;
  topicName?: string;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  index?: number;
}

const MeetingCardComponent: React.FC<MeetingCardProps> = ({
  meetingId,
  groupName,
  cityName,
  neighborhoodName,
  dayName,
  dayId,
  startTime,
  endTime,
  type,
  lang,
  gsrName,
  gsrPhone,
  notes,
  locationUrl,
  topicName,
  isBookmarked,
  onToggleBookmark,
  index = 0,
}) => {
  const { colors, spacing, borderRadius, shadows, isDark } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState(false);

  const { meetingReminders, setMeetingReminder, removeMeetingReminder } =
    useAppStore();
  const existingReminder = meetingReminders[meetingId];

  const handleOpenMap = () => {
    haptic.selection();
    if (
      locationUrl &&
      (locationUrl.startsWith('http://') ||
        locationUrl.startsWith('https://') ||
        locationUrl.startsWith('geo:') ||
        locationUrl.startsWith('maps:'))
    ) {
      Linking.openURL(locationUrl).catch(() => {
        const query = encodeURIComponent(`${groupName}, ${neighborhoodName}, ${cityName}, Egypt`);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
      return;
    }

    const query = encodeURIComponent(`${groupName}, ${neighborhoodName}, ${cityName}, Egypt`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
    }
  };

  const handleShare = async () => {
    haptic.light();
    try {
      const message = `${groupName}\n📍 ${cityName}${neighborhoodName ? ` • ${neighborhoodName}` : ''}\n📅 ${dayName} (${startTime} - ${endTime})\n🌐 NA Egypt Fellowship`;
      await Share.share({
        message,
        title: groupName,
      });
    } catch {}
  };

  const handleBookmarkPress = () => {
    haptic.light();
    onToggleBookmark(meetingId);
  };

  const handleCallGsr = () => {
    if (!gsrPhone) return;
    haptic.selection();
    Linking.openURL(`tel:${gsrPhone}`).catch(() => {});
  };

  const handleSelectReminderOffset = async (offsetHours: 1 | 2) => {
    haptic.selection();
    setIsReminderPickerVisible(false);

    // Cancel old reminder if any
    if (existingReminder?.notificationId) {
      await cancelMeetingReminder(existingReminder.notificationId);
    }

    const notificationId = await scheduleMeetingReminder({
      meetingId,
      groupName,
      dayName,
      dayId,
      startTime,
      cityName,
      offsetHours,
      isAr,
    });

    if (notificationId) {
      setMeetingReminder(meetingId, { offsetHours, notificationId });
      haptic.success();
    }
  };

  const handleRemoveReminder = async () => {
    haptic.light();
    setIsReminderPickerVisible(false);
    if (existingReminder?.notificationId) {
      await cancelMeetingReminder(existingReminder.notificationId);
    }
    removeMeetingReminder(meetingId);
  };

  const getLanguageLabel = () => {
    if (lang === 'arabic' || lang === 'ar') return isAr ? 'عربي' : 'Arabic';
    if (lang === 'english' || lang === 'en') return isAr ? 'إنجليزي' : 'English';
    return isAr ? 'عربي / إنجليزي' : 'Bilingual';
  };

  const isOpen = type === 'open';

  return (
    <>
      <Animated.View
        entering={FadeInUp.delay(Math.min(index * 40, 300)).duration(350)}
        style={[
          styles.card,
          shadows.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            borderRadius: borderRadius.card,
          },
        ]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`${groupName}, ${dayName} from ${startTime} to ${endTime}, in ${cityName} ${neighborhoodName}. ${isOpen ? 'Open meeting' : 'Closed meeting'}.`}
      >
        {/* Top badges & Quick Actions */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <Badge label={dayName} variant="gold" size="sm" />
            <Badge
              label={isOpen ? t('meetings.type_open') : t('meetings.type_closed')}
              variant={isOpen ? 'accent' : 'neutral'}
              size="sm"
            />
            <Badge
              label={getLanguageLabel()}
              variant="primary"
              size="sm"
              icon={<Globe size={11} color={isDark ? '#38bdf8' : colors.primary} />}
            />
          </View>

          <View style={styles.actionButtonsRow}>
            {/* Reminder Bell Button */}
            <TouchableOpacity
              onPress={() => {
                haptic.selection();
                setIsReminderPickerVisible(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.iconButton,
                {
                  backgroundColor: existingReminder
                    ? isDark
                      ? 'rgba(34, 211, 238, 0.2)'
                      : colors.accentLight
                    : colors.bgSecondary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isAr ? 'تفعيل تذكير بميعاد الاجتماع' : 'Set meeting reminder'}
            >
              {existingReminder ? (
                <BellRing size={16} color={isDark ? '#22d3ee' : colors.accentDark} />
              ) : (
                <Bell size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.iconButton, { backgroundColor: colors.bgSecondary }]}
              accessibilityRole="button"
              accessibilityLabel={isAr ? 'مشاركة تفاصيل الاجتماع' : 'Share meeting details'}
            >
              <Share2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Bookmark Button */}
            <TouchableOpacity
              onPress={handleBookmarkPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isBookmarked
                    ? isDark
                      ? 'rgba(251, 191, 36, 0.2)'
                      : colors.goldLight
                    : colors.bgSecondary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark meeting'}
            >
              <Bookmark
                size={17}
                color={isBookmarked ? (isDark ? '#fbbf24' : colors.goldDark) : colors.textMuted}
                fill={isBookmarked ? (isDark ? '#fbbf24' : colors.goldDark) : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Group Title */}
        <AppText
          variant="h3"
          color={colors.textPrimary}
          weight="700"
          style={styles.groupTitle}
        >
          {groupName}
        </AppText>

        {/* Location Row */}
        <View style={styles.infoRow}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
            <MapPin size={14} color={isDark ? '#22d3ee' : colors.accentDark} />
          </View>
          <AppText
            variant="body"
            color={colors.textSecondary}
            weight="500"
            style={styles.infoText}
          >
            {cityName}{neighborhoodName ? ` • ${neighborhoodName}` : ''}
          </AppText>
        </View>

        {/* Time Row */}
        <View style={styles.infoRow}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
            <Clock size={14} color={isDark ? '#22d3ee' : colors.accentDark} />
          </View>
          <View style={styles.timeContainer}>
            <AppText
              variant="body"
              color={colors.textPrimary}
              weight="600"
              style={styles.timeLtrText}
            >
              {`\u200E${startTime} \u2013 ${endTime}`}
            </AppText>
            {existingReminder && (
              <View style={[styles.reminderBadge, { backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : colors.accentLight }]}>
                <Bell size={10} color={isDark ? '#22d3ee' : colors.accentDark} style={{ marginEnd: 3 }} />
                <AppText
                  variant="caption"
                  color={isDark ? '#22d3ee' : colors.accentDark}
                  weight="700"
                >
                  {isAr
                    ? `تنبيه قبل ${existingReminder.offsetHours} ${existingReminder.offsetHours === 1 ? 'ساعة' : 'ساعتين'}`
                    : `Alert ${existingReminder.offsetHours}h before`}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* GSR (Group Service Representative) Info Row */}
        {(gsrName || gsrPhone) ? (
          <View style={[styles.gsrContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}>
            <View style={styles.gsrLeft}>
              <View style={[styles.gsrIconWrapper, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : colors.primaryLight + '25' }]}>
                <UserCheck size={13} color={isDark ? '#38bdf8' : colors.primary} />
              </View>
              <View style={styles.gsrTextCol}>
                <AppText variant="caption" color={colors.textMuted} weight="600">
                  {isAr ? 'ممثل خدمة المجموعة (GSR)' : 'GSR Service Representative'}
                </AppText>
                <AppText variant="bodySmall" color={colors.textPrimary} weight="700">
                  {gsrName || (isAr ? 'خدمة المجموعة' : 'Group Service')}
                </AppText>
              </View>
            </View>

            {gsrPhone ? (
              <TouchableOpacity
                onPress={handleCallGsr}
                style={[styles.gsrCallBtn, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : colors.successLight }]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Call GSR ${gsrPhone}`}
              >
                <Phone size={12} color={isDark ? '#34d399' : colors.success} style={{ marginEnd: 4 }} />
                <AppText variant="caption" color={isDark ? '#34d399' : colors.success} weight="700">
                  {gsrPhone}
                </AppText>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Topic Row */}
        {topicName ? (
          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
              <Tag size={13} color={isDark ? '#22d3ee' : colors.accentDark} />
            </View>
            <AppText
              variant="body"
              color={colors.textSecondary}
              weight="600"
              style={styles.infoText}
            >
              {topicName}
            </AppText>
          </View>
        ) : null}

        {/* Optional Notes */}
        {notes ? (
          <View style={[styles.notesContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSolid }]}>
            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.notesText}>
              {notes}
            </AppText>
          </View>
        ) : null}

        {/* Map Directions Button */}
        <TouchableOpacity
          style={[styles.mapButton, { backgroundColor: isDark ? colors.primaryDark : colors.primary }]}
          onPress={handleOpenMap}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('meetings.directions')}
        >
          <Navigation size={15} color="#ffffff" style={{ marginEnd: spacing.xs + 2 }} />
          <AppText variant="label" color="#ffffff" weight="700">
            {t('meetings.directions')}
          </AppText>
        </TouchableOpacity>
      </Animated.View>

      {/* Reminder Picker Modal */}
      <Modal
        visible={isReminderPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsReminderPickerVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.65)' }]}
          onPress={() => setIsReminderPickerVisible(false)}
        >
          <Pressable
            style={[
              styles.pickerSheet,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.card,
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <View style={styles.pickerTitleRow}>
                <Bell size={18} color={isDark ? '#22d3ee' : colors.accentDark} style={{ marginEnd: 8 }} />
                <AppText variant="h3" color={colors.textPrimary} weight="700">
                  {isAr ? 'تذكير بميعاد الاجتماع' : 'Meeting Reminder'}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setIsReminderPickerVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.pickerSub}>
              {isAr
                ? `اختر موعد التنبيه الأسبوعي لاجتماع "${groupName}":`
                : `Choose weekly reminder time for "${groupName}":`}
            </AppText>

            {/* Option 1: 1 Hour Before */}
            <TouchableOpacity
              style={[
                styles.optionRow,
                {
                  backgroundColor:
                    existingReminder?.offsetHours === 1
                      ? isDark
                        ? 'rgba(34, 211, 238, 0.15)'
                        : colors.accentLight
                      : colors.bgSecondary,
                  borderColor:
                    existingReminder?.offsetHours === 1 ? colors.accent : colors.borderSolid,
                },
              ]}
              onPress={() => handleSelectReminderOffset(1)}
              activeOpacity={0.8}
            >
              <View style={styles.optionInfo}>
                <AppText variant="body" color={colors.textPrimary} weight="700">
                  {isAr ? 'قبل الاجتماع بساعة (1 ساعة)' : '1 Hour Before Meeting'}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {isAr ? 'تنبيه أسبوعي منتظم قبل البدء بـ 60 دقيقة' : 'Weekly reminder 60 minutes prior'}
                </AppText>
              </View>
              {existingReminder?.offsetHours === 1 && (
                <Check size={18} color={isDark ? '#22d3ee' : colors.accentDark} />
              )}
            </TouchableOpacity>

            {/* Option 2: 2 Hours Before */}
            <TouchableOpacity
              style={[
                styles.optionRow,
                {
                  backgroundColor:
                    existingReminder?.offsetHours === 2
                      ? isDark
                        ? 'rgba(34, 211, 238, 0.15)'
                        : colors.accentLight
                      : colors.bgSecondary,
                  borderColor:
                    existingReminder?.offsetHours === 2 ? colors.accent : colors.borderSolid,
                },
              ]}
              onPress={() => handleSelectReminderOffset(2)}
              activeOpacity={0.8}
            >
              <View style={styles.optionInfo}>
                <AppText variant="body" color={colors.textPrimary} weight="700">
                  {isAr ? 'قبل الاجتماع بساعتين (2 ساعة)' : '2 Hours Before Meeting'}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {isAr ? 'تنبيه أسبوعي منتظم قبل البدء بـ 120 دقيقة' : 'Weekly reminder 120 minutes prior'}
                </AppText>
              </View>
              {existingReminder?.offsetHours === 2 && (
                <Check size={18} color={isDark ? '#22d3ee' : colors.accentDark} />
              )}
            </TouchableOpacity>

            {/* Option 3: Cancel Reminder (if active) */}
            {existingReminder && (
              <TouchableOpacity
                style={[styles.removeReminderBtn, { borderColor: colors.danger }]}
                onPress={handleRemoveReminder}
                activeOpacity={0.8}
              >
                <AppText variant="label" color={colors.danger} weight="700">
                  {isAr ? 'إلغاء التذكير لهذا الاجتماع' : 'Cancel Meeting Reminder'}
                </AppText>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export const MeetingCard = React.memo(MeetingCardComponent);

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    marginBottom: 10,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 8,
  },
  infoText: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeLtrText: {
    fontVariant: ['tabular-nums'],
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gsrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  gsrLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gsrIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 8,
  },
  gsrTextCol: {
    flex: 1,
  },
  gsrCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  notesContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  notesText: {
    lineHeight: 18,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    minHeight: 44,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerSheet: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderWidth: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerSub: {
    marginBottom: 16,
    lineHeight: 18,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionInfo: {
    flex: 1,
    marginEnd: 10,
  },
  removeReminderBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
});
