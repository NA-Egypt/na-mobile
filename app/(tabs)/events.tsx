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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Calendar as CalendarIcon,
  MapPin,
  Bell,
  CheckCircle,
  CalendarX,
  UserCheck,
  Repeat,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { database } from '../../src/database';
import EventModel from '../../src/database/models/Event';
import { pullMasterData } from '../../src/database/sync';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

export default function EventsScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [events, setEvents] = useState<EventModel[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [notifiedEvents, setNotifiedEvents] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

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

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

  // Map events to date strings (YYYY-MM-DD)
  const eventsByDate = events.reduce((acc, ev) => {
    if (ev.startDate) {
      const d = ev.startDate.slice(0, 10);
      if (!acc[d]) acc[d] = [];
      acc[d].push(ev);
    }
    return acc;
  }, {} as Record<string, EventModel[]>);

  const selectedDayEvents = eventsByDate[selectedDateStr] || [];

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayLabelsAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const dayLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.screenWrapper}>
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.iconCircle}>
            <CalendarIcon size={22} color="#ffffff" />
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

        {/* View Mode Segmented Switch (Calendar / List) */}
        <View style={styles.modeSwitchWrapper}>
          <View style={styles.modeSwitchContainer}>
            <TouchableOpacity
              style={[styles.modeButton, viewMode === 'calendar' && styles.modeButtonActive]}
              onPress={() => setViewMode('calendar')}
              activeOpacity={0.8}
            >
              <CalendarIcon size={16} color={viewMode === 'calendar' ? '#ffffff' : colors.primary} style={{ marginEnd: 6 }} />
              <Text style={[styles.modeButtonText, viewMode === 'calendar' && styles.modeButtonTextActive]}>
                {isAr ? 'عرض التقويم الشهري' : 'Calendar View'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, viewMode === 'list' && styles.modeButtonActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <List size={16} color={viewMode === 'list' ? '#ffffff' : colors.primary} style={{ marginEnd: 6 }} />
              <Text style={[styles.modeButtonText, viewMode === 'list' && styles.modeButtonTextActive]}>
                {isAr ? 'عرض القائمة' : 'List View'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {viewMode === 'calendar' ? (
        <ScrollView
          contentContainerStyle={styles.calendarScrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          {/* Month Header Navigation */}
          <View style={[styles.monthCard, shadows.card]}>
            <View style={styles.monthHeaderRow}>
              <TouchableOpacity onPress={isAr ? nextMonth : prevMonth} hitSlop={10} style={styles.navArrowBtn}>
                <ChevronRight size={22} color={colors.primary} />
              </TouchableOpacity>

              <Text style={styles.monthTitleText}>
                {isAr ? `${monthNamesAr[month]} ${year}` : `${monthNamesEn[month]} ${year}`}
              </Text>

              <TouchableOpacity onPress={isAr ? prevMonth : nextMonth} hitSlop={10} style={styles.navArrowBtn}>
                <ChevronLeft size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Day of Week Headers */}
            <View style={styles.dayLabelsRow}>
              {(isAr ? dayLabelsAr : dayLabelsEn).map((lbl, idx) => (
                <Text key={idx} style={styles.dayLabelText}>{lbl}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const hasEvents = !!eventsByDate[dateStr]?.length;
                const isSelected = selectedDateStr === dateStr;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      hasEvents && !isSelected && styles.dayCellHasEvents,
                    ]}
                    onPress={() => setSelectedDateStr(dateStr)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSelected && styles.dayNumberTextSelected,
                        hasEvents && !isSelected && styles.dayNumberTextHasEvents,
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {hasEvents && (
                      <View
                        style={[
                          styles.eventDot,
                          isSelected && { backgroundColor: '#ffffff' },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Selected Day Events List */}
          <View style={styles.dayAgendaSection}>
            <View style={styles.dayAgendaHeaderRow}>
              <Text style={[styles.dayAgendaTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                {isAr
                  ? `أجندة يوم: ${selectedDateStr}`
                  : `Schedule for ${selectedDateStr}`}
              </Text>
              <Text style={styles.dayAgendaCount}>
                {isAr ? `${selectedDayEvents.length} فعالية` : `${selectedDayEvents.length} events`}
              </Text>
            </View>

            {selectedDayEvents.length === 0 ? (
              <View style={[styles.emptyDayCard, shadows.card]}>
                <CalendarX size={36} color={colors.textMuted} />
                <Text style={[styles.emptyDayText, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                  {isAr
                    ? 'لا توجد فعاليات أو اجتماعات مجدولة في هذا اليوم.'
                    : 'No events scheduled for this day.'}
                </Text>
              </View>
            ) : (
              selectedDayEvents.map((item) => (
                <View key={item.id} style={[styles.card, shadows.card]}>
                  <Text style={[styles.cardTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {item.title}
                  </Text>

                  {item.organizer ? (
                    <View style={styles.infoRow}>
                      <View style={styles.iconWrapper}>
                        <UserCheck size={14} color={colors.primary} />
                      </View>
                      <Text style={[styles.infoText, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                        {isAr ? `المنظم: ${item.organizer}` : `Organizer: ${item.organizer}`}
                      </Text>
                    </View>
                  ) : null}

                  {item.description ? (
                    <Text style={[styles.cardDescription, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                      {item.description}
                    </Text>
                  ) : null}

                  {item.location ? (
                    <TouchableOpacity
                      style={styles.infoRow}
                      onPress={() => handleOpenMap(item.location || '', item.title || '')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconWrapper}>
                        <MapPin size={14} color={colors.primary} />
                      </View>
                      <Text style={[styles.infoText, styles.locationLink, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                        {item.location}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.notifyButton, notifiedEvents[item.id] && styles.notifyButtonActive]}
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
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        /* Full Chronological List View */
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
                <View style={styles.badgeRow}>
                  {formattedDate ? (
                    <View style={styles.dateBadge}>
                      <CalendarIcon size={13} color="#0891b2" style={{ marginEnd: 4 }} />
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

                <Text style={[styles.cardTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                  {item.title}
                </Text>

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

                {item.description ? (
                  <Text style={[styles.cardDescription, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                    {item.description}
                  </Text>
                ) : null}

                {item.location ? (
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => handleOpenMap(item.location || '', item.title || '')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconWrapper}>
                      <MapPin size={14} color={colors.primary} />
                    </View>
                    <Text style={[styles.infoText, styles.locationLink, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                      {item.location}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[styles.notifyButton, notifiedEvents[item.id] && styles.notifyButtonActive]}
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
                {isAr ? 'لا توجد فعاليات مسجلة حالياً' : 'No events registered'}
              </Text>
            </View>
          }
        />
      )}
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
  modeSwitchWrapper: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  modeSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm - 1,
    borderRadius: 11,
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
  },
  modeButtonText: {
    ...typography.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  modeButtonTextActive: {
    color: colors.primary,
  },
  calendarScrollContent: {
    padding: spacing.md,
  },
  monthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthTitleText: {
    ...typography.h3,
    color: colors.primary,
    fontSize: 17,
  },
  navArrowBtn: {
    padding: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#f1f5f9',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: spacing.xs,
  },
  dayLabelText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    width: 38,
    textAlign: 'center',
    fontSize: 11,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellHasEvents: {
    backgroundColor: '#e4f7fa',
  },
  dayNumberText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dayNumberTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayNumberTextHasEvents: {
    color: colors.primary,
    fontWeight: '700',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  dayAgendaSection: {
    marginTop: spacing.xs,
  },
  dayAgendaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  dayAgendaTitle: {
    ...typography.h3,
    color: colors.primary,
    fontSize: 15,
  },
  dayAgendaCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  emptyDayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  emptyDayText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
});
