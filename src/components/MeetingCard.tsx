import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Bookmark, Navigation, Globe, Share2 } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAppTheme } from '../theme';
import { AppText, Badge } from './ui';
import { haptic } from '../utils/haptics';

export interface MeetingCardProps {
  meetingId: string;
  groupName: string;
  cityName: string;
  neighborhoodName: string;
  dayName: string;
  startTime: string;
  endTime: string;
  type: 'open' | 'closed' | string;
  lang: 'ar' | 'en' | 'both' | 'arabic' | 'english' | string;
  notes?: string;
  locationUrl?: string;
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
  startTime,
  endTime,
  type,
  lang,
  notes,
  locationUrl,
  isBookmarked,
  onToggleBookmark,
  index = 0,
}) => {
  const { colors, spacing, borderRadius, shadows } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

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

  const getLanguageLabel = () => {
    if (lang === 'arabic' || lang === 'ar') return isAr ? 'عربي' : 'Arabic';
    if (lang === 'english' || lang === 'en') return isAr ? 'إنجليزي' : 'English';
    return isAr ? 'عربي / إنجليزي' : 'Bilingual';
  };

  const isOpen = type === 'open';

  return (
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
          <Badge
            label={dayName}
            variant="gold"
            size="sm"
          />
          <Badge
            label={isOpen ? t('meetings.type_open') : t('meetings.type_closed')}
            variant={isOpen ? 'accent' : 'neutral'}
            size="sm"
          />
          <Badge
            label={getLanguageLabel()}
            variant="primary"
            size="sm"
            icon={<Globe size={11} color={colors.primary} />}
          />
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.iconButton, { backgroundColor: colors.bgSecondary }]}
            accessibilityRole="button"
            accessibilityLabel={isAr ? 'مشاركة تفاصيل الاجتماع' : 'Share meeting details'}
          >
            <Share2 size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBookmarkPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.iconButton, { backgroundColor: isBookmarked ? colors.goldLight : colors.bgSecondary }]}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark meeting'}
          >
            <Bookmark
              size={17}
              color={isBookmarked ? colors.goldDark : colors.textMuted}
              fill={isBookmarked ? colors.goldDark : 'transparent'}
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
          <MapPin size={14} color={colors.accentDark} />
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
          <Clock size={14} color={colors.accentDark} />
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
        </View>
      </View>

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
        style={[styles.mapButton, { backgroundColor: colors.primary }]}
        onPress={handleOpenMap}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('meetings.directions')}
      >
        <Navigation size={15} color={colors.white} style={{ marginEnd: spacing.xs + 2 }} />
        <AppText variant="label" color={colors.white} weight="700">
          {t('meetings.directions')}
        </AppText>
      </TouchableOpacity>
    </Animated.View>
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
  },
  dayHighlight: {
    fontWeight: '700',
  },
  timeDivider: {
    marginHorizontal: 4,
  },
  timeLtrText: {
    fontVariant: ['tabular-nums'],
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
});
