import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Bookmark, Navigation, Globe } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface MeetingCardProps {
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
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
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
  isBookmarked,
  onToggleBookmark,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const handleOpenMap = () => {
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

  const getLanguageLabel = () => {
    if (lang === 'arabic' || lang === 'ar') return isAr ? 'عربي' : 'Arabic';
    if (lang === 'english' || lang === 'en') return isAr ? 'إنجليزي' : 'English';
    return isAr ? 'عربي / إنجليزي' : 'Bilingual';
  };

  return (
    <View style={[styles.card, shadows.card]}>
      {/* Top badges & Bookmark */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, type === 'open' ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.badgeText, type === 'open' ? styles.openBadgeText : styles.closedBadgeText]}>
              {type === 'open' ? t('meetings.type_open') : t('meetings.type_closed')}
            </Text>
          </View>
          <View style={styles.langBadge}>
            <Globe size={12} color={colors.primary} style={{ marginEnd: 4 }} />
            <Text style={styles.langBadgeText}>{getLanguageLabel()}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onToggleBookmark(meetingId)}
          hitSlop={12}
          style={styles.bookmarkBtn}
        >
          <Bookmark
            size={22}
            color={isBookmarked ? colors.gold : colors.textMuted}
            fill={isBookmarked ? colors.gold : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Group Title */}
      <Text style={[styles.groupTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
        {groupName}
      </Text>

      {/* Location Row */}
      <View style={styles.infoRow}>
        <View style={styles.iconWrapper}>
          <MapPin size={15} color={colors.accent} />
        </View>
        <Text style={[styles.infoText, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
          {cityName}{neighborhoodName ? ` • ${neighborhoodName}` : ''}
        </Text>
      </View>

      {/* Time & Day Row with strict LTR time range */}
      <View style={styles.infoRow}>
        <View style={styles.iconWrapper}>
          <Clock size={15} color={colors.accent} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.dayHighlight, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
            {dayName}
          </Text>
          <Text style={styles.timeDivider}> | </Text>
          <Text style={styles.timeLtrText}>
            {`\u200E${startTime} \u2013 ${endTime}`}
          </Text>
        </View>
      </View>

      {/* Optional Notes */}
      {notes ? (
        <View style={styles.notesContainer}>
          <Text style={[styles.notesText, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
            {notes}
          </Text>
        </View>
      ) : null}

      {/* Map Directions Button */}
      <TouchableOpacity
        style={styles.mapButton}
        onPress={handleOpenMap}
        activeOpacity={0.85}
      >
        <Navigation size={15} color={colors.white} style={{ marginEnd: spacing.xs + 2 }} />
        <Text style={styles.mapButtonText}>{t('meetings.directions')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.card,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  openBadge: {
    backgroundColor: '#e0f8fc',
  },
  closedBadge: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  openBadgeText: {
    color: '#08899f',
  },
  closedBadgeText: {
    color: '#d97706',
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.06)',
  },
  langBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
    color: colors.primary,
  },
  bookmarkBtn: {
    padding: 2,
  },
  groupTitle: {
    ...typography.h2,
    fontSize: 17,
    color: colors.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(16, 179, 207, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  dayHighlight: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 14,
  },
  timeDivider: {
    color: colors.textMuted,
    fontSize: 14,
  },
  timeLtrText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  notesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  notesText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 3,
    marginTop: spacing.md,
  },
  mapButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

