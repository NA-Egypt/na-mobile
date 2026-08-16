import React, { useState, useEffect } from 'react';
import {
  View,
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
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { database } from '../../src/database';
import EventModel from '../../src/database/models/Event';
import { pullMasterData } from '../../src/database/sync';
import { useAppTheme } from '../../src/theme';
import { AppText, Badge, AppButton, EmptyState, LanguageSwitcher } from '../../src/components/ui';
import { haptic } from '../../src/utils/haptics';

export default function EventsScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, borderRadius, shadows } = useAppTheme();

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
    haptic.light();
    await pullMasterData();
    await loadEvents();
    setIsRefreshing(false);
  };

  const handleScheduleNotification = async (event: EventModel) => {
    if (Platform.OS === 'web') return;

    haptic.light();
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      haptic.warning();
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

    haptic.success();
    setNotifiedEvents((prev) => ({ ...prev, [event.id]: true }));
    Alert.alert(
      isAr ? 'تم التفعيل' : 'Activated',
      isAr ? 'تم تفعيل التنبيه بنجاح للفعالية.' : 'Reminder notification activated successfully.'
    );
  };

  const handleOpenMap = (location: string, title: string) => {
    haptic.selection();
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
    haptic.selection();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    haptic.selection();
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
    <View style={[styles.screenWrapper, { backgroundColor: colors.primaryDark }]}>
      <SafeAreaView style={[styles.safeHeader, { backgroundColor: colors.primaryDark }]} edges={['top']}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight + '40' }]}>
            <CalendarIcon size={20} color={colors.accent} />
          </View>
          <View style={styles.headerTextCol}>
            <AppText variant="h3" color="#ffffff" weight="800">
              {isAr ? 'فعاليات وأنشطة الزمالة' : 'Events & Activities'}
            </AppText>
            <AppText variant="caption" color="rgba(224, 248, 252, 0.75)">
              {isAr
                ? 'مواعيد المؤتمرات، الأيام التعليمية، واجتماعات لجان الخدمة'
                : 'Conventions, Learning Days, and Regional Committee Meetings'}
            </AppText>
          </View>
          <LanguageSwitcher />
        </View>

        {/* View Mode Segmented Switch (Calendar / List) */}
        <View style={styles.modeSwitchWrapper}>
          <View style={[styles.modeSwitchContainer, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                viewMode === 'calendar' && [styles.modeButtonActive, { backgroundColor: colors.cardBg }],
              ]}
              onPress={() => {
                haptic.selection();
                setViewMode('calendar');
              }}
              activeOpacity={0.8}
            >
              <CalendarIcon
                size={16}
                color={viewMode === 'calendar' ? colors.primary : '#ffffff'}
                style={{ marginEnd: 6 }}
              />
              <AppText
                variant="label"
                color={viewMode === 'calendar' ? colors.primary : '#ffffff'}
                weight="700"
              >
                {isAr ? 'التقويم الشهري' : 'Calendar View'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                viewMode === 'list' && [styles.modeButtonActive, { backgroundColor: colors.cardBg }],
              ]}
              onPress={() => {
                haptic.selection();
                setViewMode('list');
              }}
              activeOpacity={0.8}
            >
              <List
                size={16}
                color={viewMode === 'list' ? colors.primary : '#ffffff'}
                style={{ marginEnd: 6 }}
              />
              <AppText
                variant="label"
                color={viewMode === 'list' ? colors.primary : '#ffffff'}
                weight="700"
              >
                {isAr ? 'عرض القائمة' : 'List View'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.contentBody, { backgroundColor: colors.bgPrimary }]}>
        {viewMode === 'calendar' ? (
          <ScrollView
            contentContainerStyle={styles.calendarScrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.accent, colors.primary]}
                tintColor={colors.accent}
              />
            }
          >
            {/* Month Header Navigation */}
            <View
              style={[
                styles.monthCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <View style={styles.monthHeaderRow}>
                <TouchableOpacity
                  onPress={isAr ? nextMonth : prevMonth}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.navArrowBtn, { backgroundColor: colors.bgSecondary }]}
                >
                  <ChevronRight size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                <AppText variant="h3" color={colors.textPrimary} weight="700">
                  {isAr ? `${monthNamesAr[month]} ${year}` : `${monthNamesEn[month]} ${year}`}
                </AppText>

                <TouchableOpacity
                  onPress={isAr ? prevMonth : nextMonth}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.navArrowBtn, { backgroundColor: colors.bgSecondary }]}
                >
                  <ChevronLeft size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers */}
              <View style={[styles.dayLabelsRow, { borderColor: colors.borderSubtle }]}>
                {(isAr ? dayLabelsAr : dayLabelsEn).map((lbl, idx) => (
                  <AppText key={idx} variant="caption" color={colors.textMuted} weight="700" style={styles.dayLabelText}>
                    {lbl}
                  </AppText>
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
                        isSelected && { backgroundColor: colors.primary },
                        hasEvents && !isSelected && { backgroundColor: colors.accentLight },
                      ]}
                      onPress={() => {
                        haptic.selection();
                        setSelectedDateStr(dateStr);
                      }}
                      activeOpacity={0.7}
                    >
                      <AppText
                        variant="labelSmall"
                        color={
                          isSelected
                            ? '#ffffff'
                            : hasEvents
                            ? colors.accentDark
                            : colors.textPrimary
                        }
                        weight={isSelected || hasEvents ? '700' : '500'}
                      >
                        {dayNum}
                      </AppText>
                      {hasEvents && (
                        <View
                          style={[
                            styles.eventDot,
                            {
                              backgroundColor: isSelected ? '#ffffff' : colors.accent,
                            },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected Day Events Section */}
            <View style={styles.dayAgendaSection}>
              <View style={styles.dayAgendaHeaderRow}>
                <AppText variant="h4" color={colors.textPrimary} weight="700">
                  {isAr ? `أجندة يوم: ${selectedDateStr}` : `Schedule for ${selectedDateStr}`}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} weight="700">
                  {isAr ? `${selectedDayEvents.length} فعالية` : `${selectedDayEvents.length} events`}
                </AppText>
              </View>

              {selectedDayEvents.length === 0 ? (
                <EmptyState
                  icon={<CalendarX size={36} color={colors.textMuted} />}
                  title={isAr ? 'لا توجد فعاليات مجدولة' : 'No Events Scheduled'}
                  description={
                    isAr
                      ? 'لا توجد فعاليات أو اجتماعات عامة مسجلة في هذا اليوم.'
                      : 'No events or committee meetings scheduled for this date.'
                  }
                />
              ) : (
                selectedDayEvents.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.card,
                      shadows.card,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                        borderRadius: borderRadius.card,
                      },
                    ]}
                  >
                    <AppText variant="h3" color={colors.textPrimary} weight="700" style={styles.cardTitle}>
                      {item.title}
                    </AppText>

                    {item.organizer ? (
                      <View style={styles.infoRow}>
                        <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
                          <UserCheck size={14} color={colors.accentDark} />
                        </View>
                        <AppText variant="bodySmall" color={colors.textSecondary}>
                          {isAr ? `المنظم: ${item.organizer}` : `Organizer: ${item.organizer}`}
                        </AppText>
                      </View>
                    ) : null}

                    {item.description ? (
                      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.cardDescription}>
                        {item.description}
                      </AppText>
                    ) : null}

                    {item.location ? (
                      <TouchableOpacity
                        style={styles.infoRow}
                        onPress={() => handleOpenMap(item.location || '', item.title || '')}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
                          <MapPin size={14} color={colors.accentDark} />
                        </View>
                        <AppText variant="bodySmall" color={colors.accentDark} style={styles.locationLink}>
                          {item.location}
                        </AppText>
                      </TouchableOpacity>
                    ) : null}

                    <AppButton
                      title={notifiedEvents[item.id] ? (isAr ? 'تم تفعيل التنبيه' : 'Reminder Active') : t('events.notify_me')}
                      onPress={() => handleScheduleNotification(item)}
                      variant={notifiedEvents[item.id] ? 'secondary' : 'primary'}
                      size="sm"
                      icon={
                        notifiedEvents[item.id] ? (
                          <CheckCircle size={15} color="#ffffff" />
                        ) : (
                          <Bell size={15} color="#ffffff" />
                        )
                      }
                      style={{ marginTop: 12 }}
                    />
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
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.accent, colors.primary]}
                tintColor={colors.accent}
              />
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
                <View
                  style={[
                    styles.card,
                    shadows.card,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.card,
                    },
                  ]}
                >
                  <View style={styles.badgeRow}>
                    {formattedDate ? (
                      <Badge
                        label={formattedDate}
                        variant="accent"
                        size="sm"
                        icon={<CalendarIcon size={12} color={colors.accentDark} />}
                      />
                    ) : null}

                    {item.recurrence ? (
                      <Badge
                        label={item.recurrence}
                        variant="neutral"
                        size="sm"
                        icon={<Repeat size={12} color={colors.textSecondary} />}
                      />
                    ) : null}
                  </View>

                  <AppText variant="h3" color={colors.textPrimary} weight="700" style={styles.cardTitle}>
                    {item.title}
                  </AppText>

                  {item.organizer ? (
                    <View style={styles.infoRow}>
                      <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
                        <UserCheck size={14} color={colors.accentDark} />
                      </View>
                      <AppText variant="bodySmall" color={colors.textSecondary}>
                        {isAr ? `الجهة المنظمة: ${item.organizer}` : `Organizer: ${item.organizer}`}
                      </AppText>
                    </View>
                  ) : null}

                  {item.description ? (
                    <AppText variant="bodySmall" color={colors.textSecondary} style={styles.cardDescription}>
                      {item.description}
                    </AppText>
                  ) : null}

                  {item.location ? (
                    <TouchableOpacity
                      style={styles.infoRow}
                      onPress={() => handleOpenMap(item.location || '', item.title || '')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
                        <MapPin size={14} color={colors.accentDark} />
                      </View>
                      <AppText variant="bodySmall" color={colors.accentDark} style={styles.locationLink}>
                        {item.location}
                      </AppText>
                    </TouchableOpacity>
                  ) : null}

                  <AppButton
                    title={notifiedEvents[item.id] ? (isAr ? 'تم تفعيل التنبيه' : 'Reminder Active') : t('events.notify_me')}
                    onPress={() => handleScheduleNotification(item)}
                    variant={notifiedEvents[item.id] ? 'secondary' : 'primary'}
                    size="sm"
                    icon={
                      notifiedEvents[item.id] ? (
                        <CheckCircle size={15} color="#ffffff" />
                      ) : (
                        <Bell size={15} color="#ffffff" />
                      )
                    }
                    style={{ marginTop: 12 }}
                  />
                </View>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon={<CalendarX size={44} color={colors.accent} />}
                title={isAr ? 'لا توجد فعاليات مسجلة حالياً' : 'No Events Registered'}
                description={
                  isAr
                    ? 'سيتم عرض المؤتمرات والأيام التعليمية فور جدولتها.'
                    : 'Conventions and learning days will appear here once scheduled.'
                }
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  safeHeader: {
    paddingBottom: 4,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  modeSwitchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  modeSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentBody: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  calendarScrollContent: {
    padding: 16,
  },
  monthCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navArrowBtn: {
    padding: 6,
    borderRadius: 16,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  dayLabelText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  dayAgendaSection: {
    marginTop: 4,
  },
  dayAgendaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cardTitle: {
    marginBottom: 6,
  },
  cardDescription: {
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 8,
  },
  locationLink: {
    textDecorationLine: 'underline',
  },
});
