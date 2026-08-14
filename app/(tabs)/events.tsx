import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Bell, CheckCircle, CalendarX, UserCheck, Repeat, Navigation } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { database } from '../../src/database';
import EventModel from '../../src/database/models/Event';
import { pullMasterData } from '../../src/database/sync';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

export default function EventsScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [events, setEvents] = useState<EventModel[]>([]);
  const [notifiedEvents, setNotifiedEvents] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const eventsCollection = database.get<EventModel>('events');
      const allEvents = await eventsCollection.query().fetch();
      setEvents(allEvents);
    } catch (e) {
      console.warn('Error loading events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    pullMasterData().then(() => loadEvents());

    const subscription = database
      .get<EventModel>('events')
      .query()
      .observe()
      .subscribe(() => {
        loadEvents();
      });

    return () => subscription.unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await pullMasterData();
    await loadEvents();
    setIsRefreshing(false);
  };

  const handleScheduleNotification = async (event: EventModel) => {
    if (Platform.OS === 'web') return;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        isAr ? 'الصلاحيات مطلوبة' : 'Permission Required',
        isAr ? 'يرجى تفعيل صلاحيات الإشعارات من إعدادات الهاتف.' : 'Please enable notifications in device settings.'
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: isAr ? `تذكير: ${event.title}` : `Reminder: ${event.title}`,
        body: `${event.organizer ? event.organizer + ' • ' : ''}${event.location || ''}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });

    setNotifiedEvents((prev) => ({ ...prev, [event.id]: true }));
    Alert.alert(
      isAr ? 'تم التفعيل' : 'Activated',
      isAr ? 'تم تفعيل التنبيه بنجاح للفعالية.' : 'Reminder notification activated successfully.'
    );
  };

  const handleOpenMap = (location: string, title: string) => {
    const query = encodeURIComponent(`${title}, ${location}, Egypt`);
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
    <View style={styles.screenWrapper}>
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        <View style={styles.headerBanner}>
          <View style={styles.iconCircle}>
            <Calendar size={22} color="#ffffff" />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'فعاليات وأنشطة الزمالة' : 'Events & Activities'}
            </Text>
            <Text style={[styles.headerSubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr
                ? 'مواعيد المؤتمرات، الأيام التعليمية، واجتماعات لجان الخدمة العامة'
                : 'Conventions, Learning Days, and Regional Committee Meetings'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        renderItem={({ item }) => {
          const startDateObj = item.startDate ? new Date(item.startDate) : null;
          const formattedDate = startDateObj
            ? startDateObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <View style={[styles.card, shadows.card]}>
              {/* Header Badges */}
              <View style={styles.badgeRow}>
                {formattedDate ? (
                  <View style={styles.dateBadge}>
                    <Calendar size={13} color="#0891b2" style={{ marginEnd: 4 }} />
                    <Text style={styles.dateBadgeText}>{formattedDate}</Text>
                  </View>
                ) : null}

                {item.recurrence ? (
                  <View style={styles.recurrenceBadge}>
                    <Repeat size={12} color={colors.primary} style={{ marginEnd: 4 }} />
                    <Text style={styles.recurrenceBadgeText}>{item.recurrence}</Text>
                  </View>
                ) : null}
              </View>

              {/* Title */}
              <Text style={[styles.cardTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {item.title}
              </Text>

              {/* Organizer */}
              {item.organizer ? (
                <View style={styles.infoRow}>
                  <View style={styles.iconWrapper}>
                    <UserCheck size={14} color={colors.primary} />
                  </View>
                  <Text style={[styles.infoText, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {isAr ? `الجهة المنظمة: ${item.organizer}` : `Organizer: ${item.organizer}`}
                  </Text>
                </View>
              ) : null}

              {/* Description */}
              {item.description ? (
                <Text style={[styles.cardDescription, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                  {item.description}
                </Text>
              ) : null}

              {/* Location */}
              {item.location ? (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleOpenMap(item.location || '', item.title || '')}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconWrapper}>
                    <MapPin size={14} color={colors.primary} />
                  </View>
                  <Text
                    style={[
                      styles.infoText,
                      styles.locationLink,
                      { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {item.location}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Reminder Button */}
              <TouchableOpacity
                style={[
                  styles.notifyButton,
                  notifiedEvents[item.id] && styles.notifyButtonActive,
                ]}
                onPress={() => handleScheduleNotification(item)}
                activeOpacity={0.85}
              >
                {notifiedEvents[item.id] ? (
                  <>
                    <CheckCircle size={16} color="#ffffff" style={{ marginEnd: spacing.xs }} />
                    <Text style={styles.notifyButtonText}>
                      {isAr ? 'تم تفعيل التنبيه بنجاح' : 'Reminder Scheduled'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Bell size={16} color="#ffffff" style={{ marginEnd: spacing.xs }} />
                    <Text style={styles.notifyButtonText}>{t('events.notify_me')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CalendarX size={52} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'لا توجد فعاليات مسجلة حالياً' : 'No events currently scheduled'}
            </Text>
            <Text style={[styles.emptySubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr
                ? 'يتم تحديث الفعاليات والمؤتمرات الإقليمية تلقائياً من خادم زمالة NA مصر فور إضافتها.'
                : 'Events from egyptna.org will synchronize automatically.'}
            </Text>
          </View>
        }
      />
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4f7fa',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  dateBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#0891b2',
    fontSize: 11,
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.08)',
  },
  recurrenceBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
    fontSize: 11,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.primary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    lineHeight: 21,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.xs + 2,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  locationLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.md,
  },
  notifyButtonActive: {
    backgroundColor: colors.success,
  },
  notifyButtonText: {
    ...typography.body,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl * 1.5,
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
});
