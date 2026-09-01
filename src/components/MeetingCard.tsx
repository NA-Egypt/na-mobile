import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
  Modal,
  Pressable,
  Alert,
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
  Video,
  ExternalLink,
  KeyRound,
  Hash,
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
import { formatDistance } from '../utils/location';
import {
  isOnlineMeeting,
  extractZoomDetails,
  MeetingTimeInfo,
  getMeetingTimeStatus,
} from '../utils/meetingTime';

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
  distanceKm?: number;
  groupType?: string;
  isOnline?: boolean;
  timeInfo?: MeetingTimeInfo;
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
  distanceKm,
  groupType,
  isOnline,
  timeInfo,
}) => {
  const { colors, spacing, borderRadius, shadows, isDark } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState(false);

  const { meetingReminders, setMeetingReminder, removeMeetingReminder } =
    useAppStore();
  const existingReminder = meetingReminders[meetingId];

  // Determine if this is an online meeting
  const isOnlineActual = useMemo(() => {
    if (typeof isOnline === 'boolean') return isOnline;
    return isOnlineMeeting({
      groupType,
      locationUrl,
      cityName,
      neighborhoodName,
      notes,
    });
  }, [isOnline, groupType, locationUrl, cityName, neighborhoodName, notes]);

  // Extract Zoom / Meeting details
  const zoomDetails = useMemo(() => {
    return extractZoomDetails(locationUrl, notes);
  }, [locationUrl, notes]);

  // Real-time schedule info for time-awareness
  const computedTimeInfo = useMemo(() => {
    if (timeInfo) return timeInfo;
    return getMeetingTimeStatus({ dayName, dayId, startTime, endTime });
  }, [timeInfo, dayName, dayId, startTime, endTime]);

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

  const handleJoinOnline = async () => {
    haptic.selection();
    if (zoomDetails.joinUrl) {
      try {
        // Try Zoom app deep link first if it is a zoom URL
        if (zoomDetails.isZoom && zoomDetails.meetingId) {
          const pwdParam = zoomDetails.passcode ? `&pwd=${zoomDetails.passcode}` : '';
          const zoomAppUrl = `zoomus://zoom.us/join?confno=${zoomDetails.meetingId}${pwdParam}`;
          const canOpen = await Linking.canOpenURL(zoomAppUrl).catch(() => false);
          if (canOpen) {
            await Linking.openURL(zoomAppUrl);
            return;
          }
        }
        await Linking.openURL(zoomDetails.joinUrl);
      } catch {
        Linking.openURL(zoomDetails.joinUrl).catch(() => {
          Alert.alert(
            isAr ? 'تعذر فتح الرابط' : 'Could not open link',
            isAr ? 'يرجى التحقق من الرابط أو فتح تطبيق زووم يدوياً.' : 'Please check the link or open Zoom manually.'
          );
        });
      }
    } else {
      Alert.alert(
        groupName,
        isAr
          ? `بيانات الاجتماع عبر الإنترنت:\n${zoomDetails.meetingId ? `معرف الاجتماع: ${zoomDetails.meetingId}\n` : ''}${zoomDetails.passcode ? `كلمة المرور: ${zoomDetails.passcode}\n` : ''}${notes || ''}`
          : `Online Meeting Details:\n${zoomDetails.meetingId ? `Meeting ID: ${zoomDetails.meetingId}\n` : ''}${zoomDetails.passcode ? `Passcode: ${zoomDetails.passcode}\n` : ''}${notes || ''}`
      );
    }
  };

  const handleShare = async () => {
    haptic.light();
    try {
      let locationText = `📍 ${cityName}${neighborhoodName ? ` • ${neighborhoodName}` : ''}`;
      if (isOnlineActual) {
        locationText = `💻 ${isAr ? 'اجتماع أونلاين عبر زووم' : 'Online Zoom Meeting'}${zoomDetails.joinUrl ? `\n🔗 ${zoomDetails.joinUrl}` : ''}${zoomDetails.meetingId ? `\n🆔 ID: ${zoomDetails.meetingId}` : ''}${zoomDetails.passcode ? `\n🔑 Passcode: ${zoomDetails.passcode}` : ''}`;
      }
      const message = `${groupName}\n${locationText}\n📅 ${dayName} (${startTime} - ${endTime})\n🌐 NA Egypt Fellowship`;
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
      cityName: isOnlineActual ? (isAr ? 'اجتماع أونلاين' : 'Online Meeting') : cityName,
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
            borderColor: isOnlineActual && computedTimeInfo.isLive
              ? isDark ? '#0284c7' : colors.primary
              : colors.cardBorder,
            borderRadius: borderRadius.card,
            borderWidth: isOnlineActual && computedTimeInfo.isLive ? 1.5 : 1,
          },
        ]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`${groupName}, ${dayName} from ${startTime} to ${endTime}. ${type === 'open' ? 'Open meeting' : 'Closed meeting'}.`}
      >
        {/* Card Header: Day & Online Status + Action Icons */}
        <View style={[styles.headerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <View style={[styles.badgeRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            {/* Live or Relative Time Badges for Online */}
            {isOnlineActual && computedTimeInfo.isLive && (
              <Badge
                label={isAr ? '🔴 مباشر الآن' : '🔴 LIVE NOW'}
                variant="success"
                size="sm"
              />
            )}
            {isOnlineActual && !computedTimeInfo.isLive && computedTimeInfo.displayStatusText && (
              <Badge
                label={isAr ? computedTimeInfo.displayStatusText.ar : computedTimeInfo.displayStatusText.en}
                variant={computedTimeInfo.status === 'starting_soon' ? 'warning' : 'accent'}
                size="sm"
              />
            )}
            {!isOnlineActual && distanceKm !== undefined && (
              <Badge
                label={`📍 ${formatDistance(distanceKm, isAr)}`}
                variant="accent"
                size="sm"
              />
            )}
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
            />
            {isOnlineActual && (
              <Badge
                label={zoomDetails.platformName || (isAr ? 'أونلاين' : 'Online')}
                variant="accent"
                size="sm"
              />
            )}
          </View>

          <View style={[styles.actionButtonsRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
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
          style={[styles.groupTitle, { textAlign: isAr ? 'right' : 'left' }]}
        >
          {groupName}
        </AppText>

        {/* Location Row (Map pin for In-Person, Globe/Platform for Online) */}
        <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <View style={[styles.iconWrapper, { backgroundColor: isOnlineActual ? (isDark ? 'rgba(56, 189, 248, 0.15)' : colors.accentLight) : colors.accentLight, marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }]}>
            {isOnlineActual ? (
              <Globe size={14} color={isDark ? '#38bdf8' : colors.primary} />
            ) : (
              <MapPin size={14} color={isDark ? '#22d3ee' : colors.accentDark} />
            )}
          </View>
          <AppText
            variant="body"
            color={colors.textSecondary}
            weight="500"
            style={[styles.infoText, { textAlign: isAr ? 'right' : 'left' }]}
          >
            {isOnlineActual
              ? (isAr ? 'اجتماع عبر الإنترنت (زووم)' : 'Online Virtual Meeting (Zoom)')
              : `${cityName}${neighborhoodName ? ` • ${neighborhoodName}` : ''}`}
          </AppText>
        </View>

        {/* Time Row */}
        <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight, marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }]}>
            <Clock size={14} color={isDark ? '#22d3ee' : colors.accentDark} />
          </View>
          <View style={[styles.timeContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
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

        {/* Online Credentials Display (Meeting ID & Passcode) */}
        {isOnlineActual && (zoomDetails.meetingId || zoomDetails.passcode) ? (
          <View style={[styles.credentialsBox, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder, flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            {zoomDetails.meetingId && (
              <View style={[styles.credentialItem, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <Hash size={13} color={isDark ? '#38bdf8' : colors.primary} style={{ marginEnd: isAr ? 0 : 4, marginStart: isAr ? 4 : 0 }} />
                <AppText variant="caption" color={colors.textMuted} weight="600">
                  {isAr ? 'المعرف:' : 'ID:'}{' '}
                </AppText>
                <AppText variant="caption" color={colors.textPrimary} weight="800" style={styles.timeLtrText}>
                  {zoomDetails.meetingId}
                </AppText>
              </View>
            )}
            {zoomDetails.passcode && (
              <View style={[styles.credentialItem, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <KeyRound size={13} color={isDark ? '#fbbf24' : colors.goldDark} style={{ marginEnd: isAr ? 0 : 4, marginStart: isAr ? 4 : 0 }} />
                <AppText variant="caption" color={colors.textMuted} weight="600">
                  {isAr ? 'الرمز:' : 'Pass:'}{' '}
                </AppText>
                <AppText variant="caption" color={colors.textPrimary} weight="800" style={styles.timeLtrText}>
                  {zoomDetails.passcode}
                </AppText>
              </View>
            )}
          </View>
        ) : null}

        {/* GSR (Group Service Representative) Info Row */}
        {(gsrName || gsrPhone) ? (
          <View style={[styles.gsrContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder, flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.gsrLeft, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View style={[styles.gsrIconWrapper, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : colors.primaryLight + '25', marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }]}>
                <UserCheck size={13} color={isDark ? '#38bdf8' : colors.primary} />
              </View>
              <View style={[styles.gsrTextCol, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                <AppText variant="caption" color={colors.textMuted} weight="600" style={{ textAlign: isAr ? 'right' : 'left' }}>
                  {isAr ? 'ممثل خدمة المجموعة (GSR)' : 'GSR Service Representative'}
                </AppText>
                <AppText variant="bodySmall" color={colors.textPrimary} weight="700" style={{ textAlign: isAr ? 'right' : 'left' }}>
                  {gsrName || (isAr ? 'خدمة المجموعة' : 'Group Service')}
                </AppText>
              </View>
            </View>

            {gsrPhone ? (
              <TouchableOpacity
                onPress={handleCallGsr}
                style={[styles.gsrCallBtn, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : colors.successLight, flexDirection: isAr ? 'row-reverse' : 'row' }]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Call GSR ${gsrPhone}`}
              >
                <Phone size={12} color={isDark ? '#34d399' : colors.success} style={{ marginEnd: isAr ? 0 : 4, marginStart: isAr ? 4 : 0 }} />
                <AppText variant="caption" color={isDark ? '#34d399' : colors.success} weight="700">
                  {gsrPhone}
                </AppText>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Topic Row */}
        {topicName ? (
          <View style={[styles.infoRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight, marginEnd: isAr ? 0 : 8, marginStart: isAr ? 8 : 0 }]}>
              <Tag size={13} color={isDark ? '#22d3ee' : colors.accentDark} />
            </View>
            <AppText
              variant="body"
              color={colors.textSecondary}
              weight="600"
              style={[styles.infoText, { textAlign: isAr ? 'right' : 'left' }]}
            >
              {topicName}
            </AppText>
          </View>
        ) : null}

        {/* Optional Notes */}
        {notes ? (
          <View style={[styles.notesContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSolid, alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="bodySmall" color={colors.textSecondary} style={[styles.notesText, { textAlign: isAr ? 'right' : 'left' }]}>
              {notes}
            </AppText>
          </View>
        ) : null}

        {/* Action Button: "Join on Zoom" for Online meetings, "Map Directions" for In-Person */}
        {isOnlineActual ? (
          <TouchableOpacity
            style={[
              styles.onlineJoinButton,
              {
                backgroundColor: computedTimeInfo.isLive
                  ? '#0284c7'
                  : isDark
                  ? colors.primaryDark
                  : colors.primary,
                flexDirection: isAr ? 'row-reverse' : 'row',
              },
            ]}
            onPress={handleJoinOnline}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('meetings.join_zoom')}
          >
            <Video size={16} color="#ffffff" style={{ marginEnd: isAr ? 0 : spacing.xs + 2, marginStart: isAr ? spacing.xs + 2 : 0 }} />
            <AppText variant="label" color="#ffffff" weight="800">
              {computedTimeInfo.isLive
                ? (isAr ? 'الانضمام للاجتماع المباشر الآن' : 'Join Live Meeting Now')
                : t('meetings.join_zoom')}
            </AppText>
            {zoomDetails.joinUrl ? (
              <ExternalLink size={13} color="rgba(255,255,255,0.7)" style={{ marginStart: isAr ? 0 : 6, marginEnd: isAr ? 6 : 0 }} />
            ) : null}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.mapButton, { backgroundColor: isDark ? colors.primaryDark : colors.primary, flexDirection: isAr ? 'row-reverse' : 'row' }]}
            onPress={handleOpenMap}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('meetings.directions')}
          >
            <Navigation size={15} color="#ffffff" style={{ marginEnd: isAr ? 0 : spacing.xs + 2, marginStart: isAr ? spacing.xs + 2 : 0 }} />
            <AppText variant="label" color="#ffffff" weight="700">
              {t('meetings.directions')}
            </AppText>
          </TouchableOpacity>
        )}
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
  onlineJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 8,
    minHeight: 44,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  credentialsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
    marginBottom: 8,
    gap: 12,
    flexWrap: 'wrap',
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
