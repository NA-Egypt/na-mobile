import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Navigation,
  Clock,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../theme';
import { AppText, Badge } from './ui';
import { haptic } from '../utils/haptics';
import { formatDistance } from '../utils/location';

export interface ClosestMeetingHeroProps {
  meeting: {
    id: string;
    groupName: string;
    cityName: string;
    neighborhoodName: string;
    dayName: string;
    startTime: string;
    endTime: string;
    address?: string;
    locationUrl?: string;
    distanceKm?: number;
  };
  onPress?: () => void;
}

export const ClosestMeetingHero: React.FC<ClosestMeetingHeroProps> = ({
  meeting,
  onPress,
}) => {
  const { colors, borderRadius, shadows, isDark } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const handleOpenMap = () => {
    haptic.selection();
    if (
      meeting.locationUrl &&
      (meeting.locationUrl.startsWith('http://') ||
        meeting.locationUrl.startsWith('https://') ||
        meeting.locationUrl.startsWith('geo:') ||
        meeting.locationUrl.startsWith('maps:'))
    ) {
      Linking.openURL(meeting.locationUrl).catch(() => {
        const query = encodeURIComponent(
          `${meeting.groupName}, ${meeting.neighborhoodName}, ${meeting.cityName}, Egypt`
        );
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
      return;
    }

    const query = encodeURIComponent(
      `${meeting.groupName}, ${meeting.neighborhoodName}, ${meeting.cityName}, Egypt`
    );
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

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: isDark ? '#0c2233' : '#e0f2fe',
          borderColor: isDark ? '#0284c7' : '#38bdf8',
          borderRadius: borderRadius.card,
        },
      ]}
    >
      {/* Top Spotlight Header */}
      <View style={[styles.topHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <View style={[styles.titleWrapper, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <View
            style={[
              styles.sparkleIcon,
              { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#bae6fd' },
            ]}
          >
            <Sparkles size={16} color={isDark ? '#38bdf8' : '#0284c7'} />
          </View>
          <AppText
            variant="label"
            weight="800"
            color={isDark ? '#38bdf8' : '#0369a1'}
            style={isAr ? { marginRight: 6 } : { marginLeft: 6 }}
          >
            {t('meetings.closest_meeting_now')}
          </AppText>
        </View>

        {meeting.distanceKm !== undefined && (
          <Badge
            label={formatDistance(meeting.distanceKm, isAr)}
            variant="accent"
            size="sm"
          />
        )}
      </View>

      {/* Main Details */}
      <TouchableOpacity
        onPress={() => {
          haptic.selection();
          onPress?.();
        }}
        activeOpacity={0.85}
        style={styles.contentClickable}
      >
        <AppText
          variant="h3"
          weight="800"
          color={colors.textPrimary}
          style={{ textAlign: isAr ? 'right' : 'left', marginBottom: 6 }}
        >
          {meeting.groupName}
        </AppText>

        <View
          style={[
            styles.infoRow,
            { flexDirection: isAr ? 'row-reverse' : 'row', marginBottom: 4 },
          ]}
        >
          <MapPin
            size={15}
            color={isDark ? '#38bdf8' : colors.primary}
            style={isAr ? { marginLeft: 6 } : { marginRight: 6 }}
          />
          <AppText
            variant="bodySmall"
            weight="600"
            color={colors.textPrimary}
            style={{ textAlign: isAr ? 'right' : 'left', flex: 1 }}
          >
            {meeting.cityName}
            {meeting.neighborhoodName ? ` • ${meeting.neighborhoodName}` : ''}
            {meeting.address ? ` (${meeting.address})` : ''}
          </AppText>
        </View>

        <View
          style={[
            styles.infoRow,
            { flexDirection: isAr ? 'row-reverse' : 'row' },
          ]}
        >
          <Clock
            size={15}
            color={isDark ? '#fbbf24' : colors.goldDark}
            style={isAr ? { marginLeft: 6 } : { marginRight: 6 }}
          />
          <AppText
            variant="bodySmall"
            weight="700"
            color={isDark ? '#fde047' : '#b45309'}
            style={{ textAlign: isAr ? 'right' : 'left' }}
          >
            {meeting.dayName} • {meeting.startTime} - {meeting.endTime}
          </AppText>
        </View>
      </TouchableOpacity>

      {/* Action Bar */}
      <View
        style={[
          styles.actionBar,
          {
            borderTopColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)',
            flexDirection: isAr ? 'row-reverse' : 'row',
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleOpenMap}
          style={[
            styles.directionBtn,
            {
              backgroundColor: isDark ? '#0284c7' : colors.primary,
              flexDirection: isAr ? 'row-reverse' : 'row',
            },
          ]}
          activeOpacity={0.8}
        >
          <Navigation size={16} color="#ffffff" style={isAr ? { marginLeft: 6 } : { marginRight: 6 }} />
          <AppText variant="labelSmall" weight="800" color="#ffffff">
            {t('meetings.get_directions')}
          </AppText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  topHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWrapper: {
    alignItems: 'center',
  },
  sparkleIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentClickable: {
    marginBottom: 12,
  },
  infoRow: {
    alignItems: 'center',
  },
  actionBar: {
    paddingTop: 10,
    borderTopWidth: 1,
    justifyContent: 'flex-end',
  },
  directionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
