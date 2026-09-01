import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  MapPinOff,
  Navigation,
  Sparkles,
  MapPin,
  Check,
  X,
  RotateCcw,
  Compass,
  SlidersHorizontal,
} from 'lucide-react-native';
import { database } from '../../src/database';
import Meeting from '../../src/database/models/Meeting';
import City from '../../src/database/models/City';
import Day from '../../src/database/models/Day';
import { MeetingCard } from '../../src/components/MeetingCard';
import { ClosestMeetingHero } from '../../src/components/ClosestMeetingHero';
import { FilterModal, FilterOptions } from '../../src/components/FilterModal';
import {
  AppText,
  SearchBar,
  FilterChips,
  ActiveFilterItem,
  EmptyState,
  MeetingCardSkeleton,
  AppHeader,
  Badge,
} from '../../src/components/ui';
import { pullMasterData } from '../../src/database/sync';
import { homeApi } from '../../src/api/home';
import { FrontpageStats } from '../../src/api/types';
import { useAppTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/appStore';
import { haptic } from '../../src/utils/haptics';
import {
  GeoCoordinates,
  requestDeviceLocation,
  calculateHaversineDistance,
  getMeetingCoordinates,
  EGYPT_CENTROIDS,
} from '../../src/utils/location';

const EGYPT_CITY_CENTROID_OPTIONS = [
  { key: 'cairo', ar: 'القاهرة', en: 'Cairo' },
  { key: 'giza', ar: 'الجيزة', en: 'Giza' },
  { key: 'alexandria', ar: 'الإسكندرية', en: 'Alexandria' },
  { key: 'mansoura', ar: 'المنصورة', en: 'Mansoura' },
  { key: 'tanta', ar: 'طنطا', en: 'Tanta' },
  { key: 'zagazig', ar: 'الزقازيق', en: 'Zagazig' },
  { key: 'ismailia', ar: 'الإسماعيلية', en: 'Ismailia' },
  { key: 'port said', ar: 'بورسعيد', en: 'Port Said' },
  { key: 'suez', ar: 'السويس', en: 'Suez' },
  { key: 'assiut', ar: 'أسيوط', en: 'Assiut' },
  { key: 'sohag', ar: 'سوهاج', en: 'Sohag' },
  { key: 'minya', ar: 'المنيا', en: 'Minya' },
  { key: 'fayoum', ar: 'الفيوم', en: 'Fayoum' },
  { key: 'beni_suef', ar: 'بني سويف', en: 'Beni Suef' },
  { key: 'qena', ar: 'قنا', en: 'Qena' },
  { key: 'luxor', ar: 'الأقصر', en: 'Luxor' },
  { key: 'aswan', ar: 'أسوان', en: 'Aswan' },
  { key: 'hurghada', ar: 'الغردقة', en: 'Hurghada' },
  { key: 'sharm', ar: 'شرم الشيخ', en: 'Sharm El Sheikh' },
  { key: 'dahab', ar: 'دهب', en: 'Dahab' },
  { key: 'damietta', ar: 'دمياط', en: 'Damietta' },
];

export default function MeetingsScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, borderRadius, shadows, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ nearest?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [frontpageStats, setFrontpageStats] = useState<FrontpageStats | null>(null);

  // Nearest Mode States
  const [isNearestMode, setIsNearestMode] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<GeoCoordinates | null>(null);
  const [selectedCityCenter, setSelectedCityCenter] = useState<string | null>(null);
  const [nearestDayScope, setNearestDayScope] = useState<'today' | 'all'>('today');
  const [isCityPickerVisible, setIsCityPickerVisible] = useState(false);

  const {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    bookmarks,
    toggleBookmark,
  } = useAppStore();

  const [filters, setFilters] = useState<FilterOptions>({
    cityId: null,
    dayId: null,
    groupType: null,
    lang: null,
    type: null,
  });

  const [meetings, setMeetings] = useState<any[]>([]);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [days, setDays] = useState<Array<{ id: string; name: string }>>([]);

  const loadDataFromLocalDB = useCallback(async () => {
    try {
      const meetingsCollection = database.get<Meeting>('meetings');
      const allMeetings = await meetingsCollection.query().fetch();

      const citiesCollection = database.get<City>('cities');
      const daysCollection = database.get<Day>('days');

      const allCities = await citiesCollection.query().fetch();
      const allDays = await daysCollection.query().fetch();

      setCities(
        allCities.map((c) => ({
          id: c.remoteId || c.id,
          name: isAr ? c.arName || c.enName || '' : c.enName || c.arName || '',
        }))
      );

      setDays(
        allDays.map((d) => ({
          id: d.remoteId || d.id,
          name: isAr ? d.arName || d.enName || '' : d.enName || d.arName || '',
        }))
      );

      const populated = allMeetings.map((m) => {
        const day = allDays.find(
          (d) => String(d.remoteId) === String(m.dayId) || String(d.id) === String(m.dayId)
        );

        const groupName = isAr
          ? m.groupNameAr || m.groupNameEn || 'اجتماع زمالة المدمنين المجهولين'
          : m.groupNameEn || m.groupNameAr || 'NA Meeting';

        const cityName = isAr
          ? m.cityNameAr || m.cityNameEn || ''
          : m.cityNameEn || m.cityNameAr || '';

        const neighborhoodName = isAr
          ? m.neighborhoodNameAr || m.neighborhoodNameEn || ''
          : m.neighborhoodNameEn || m.neighborhoodNameAr || '';

        const dayName = isAr
          ? day?.arName || day?.enName || `يوم ${m.dayId}`
          : day?.enName || day?.arName || `Day ${m.dayId}`;

        const gsrName = isAr ? m.gsrNameAr || m.gsrNameEn : m.gsrNameEn || m.gsrNameAr;
        const topicName = isAr
          ? m.topicNameAr || m.topicName || ''
          : m.topicNameEn || m.topicNameAr || m.topicName || '';

        return {
          id: m.id,
          remoteId: m.remoteId,
          groupName,
          groupType: m.groupType || 'in_person',
          cityName,
          neighborhoodName,
          dayName,
          dayId: String(m.dayId || ''),
          startTime: m.formattedStartTime || m.startTime || '',
          endTime: m.formattedEndTime || m.endTime || '',
          address: isAr ? m.addressAr || m.addressEn || '' : m.addressEn || m.addressAr || '',
          locationUrl: m.locationUrl || '',
          topicName,
          type: m.type || 'open',
          lang: m.lang || 'arabic',
          gsrName: gsrName || '',
          gsrPhone: m.gsrPhone || '',
          notes: m.notes || '',
        };
      });

      setMeetings(populated);
    } catch (e) {
      console.error('Error loading meetings:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAr]);

  const handleActivateNearestMode = useCallback(async () => {
    setIsLocating(true);
    haptic.selection();
    const locResult = await requestDeviceLocation();
    setIsLocating(false);

    if (locResult.status === 'granted' && locResult.coordinates) {
      setUserCoordinates(locResult.coordinates);
      setSelectedCityCenter(null);
      setIsNearestMode(true);
      haptic.success();
    } else {
      // Graceful fallback: set default Cairo center and prompt user to pick their city
      setUserCoordinates(EGYPT_CENTROIDS.cairo);
      setSelectedCityCenter(isAr ? 'القاهرة (مركز تقريبي)' : 'Cairo (Approx. Center)');
      setIsNearestMode(true);
      setIsCityPickerVisible(true);
    }
  }, [isAr]);

  const handleDeactivateNearestMode = useCallback(() => {
    setIsNearestMode(false);
    setUserCoordinates(null);
    setSelectedCityCenter(null);
    haptic.light();
  }, []);

  const handleSelectCityCenter = (cityOption: typeof EGYPT_CITY_CENTROID_OPTIONS[0]) => {
    haptic.selection();
    const coords = EGYPT_CENTROIDS[cityOption.key] || EGYPT_CENTROIDS.cairo;
    setUserCoordinates(coords);
    setSelectedCityCenter(isAr ? cityOption.ar : cityOption.en);
    setIsNearestMode(true);
    setIsCityPickerVisible(false);
  };

  useEffect(() => {
    loadDataFromLocalDB();
    pullMasterData().then(() => {
      loadDataFromLocalDB();
    });

    homeApi
      .getStats()
      .then((st) => setFrontpageStats(st))
      .catch(() => { });

    const subscription = database
      .get<Meeting>('meetings')
      .query()
      .observe()
      .subscribe(() => {
        loadDataFromLocalDB();
      });

    return () => subscription.unsubscribe();
  }, [loadDataFromLocalDB]);

  // Handle URL param ?nearest=1 when arriving from Home screen
  useEffect(() => {
    if (params?.nearest === '1' || params?.nearest === 'true') {
      handleActivateNearestMode();
    }
  }, [params?.nearest, handleActivateNearestMode]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    haptic.light();
    await Promise.allSettled([
      pullMasterData(),
      homeApi.getStats().then((st) => setFrontpageStats(st)),
    ]);
    await loadDataFromLocalDB();
    if (isNearestMode && !selectedCityCenter) {
      const loc = await requestDeviceLocation();
      if (loc.coordinates) {
        setUserCoordinates(loc.coordinates);
      }
    }
    setIsRefreshing(false);
  };

  const getTodayDayNames = (): { ar: string; en: string } => {
    const dayIdx = new Date().getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const map: Record<number, { ar: string; en: string }> = {
      6: { ar: 'السبت', en: 'Saturday' },
      0: { ar: 'الأحد', en: 'Sunday' },
      1: { ar: 'الاثنين', en: 'Monday' },
      2: { ar: 'الثلاثاء', en: 'Tuesday' },
      3: { ar: 'الأربعاء', en: 'Wednesday' },
      4: { ar: 'الخميس', en: 'Thursday' },
      5: { ar: 'الجمعة', en: 'Friday' },
    };
    return map[dayIdx] || { ar: 'السبت', en: 'Saturday' };
  };

  // Filter calculation & Distance Ranking
  const filteredMeetings = useMemo(() => {
    const baseList = meetings.filter((m) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        m.groupName.toLowerCase().includes(query) ||
        m.cityName.toLowerCase().includes(query) ||
        m.neighborhoodName.toLowerCase().includes(query) ||
        m.address.toLowerCase().includes(query);

      const matchesDay = !filters.dayId || String(m.dayId) === String(filters.dayId);

      const matchesCity = (() => {
        if (!filters.cityId) return true;
        const selectedCity = cities.find((c) => c.id === filters.cityId);
        if (!selectedCity) return true;
        return (
          m.cityName.toLowerCase().includes(selectedCity.name.toLowerCase()) ||
          selectedCity.name.toLowerCase().includes(m.cityName.toLowerCase())
        );
      })();

      const matchesGroupType = !filters.groupType || m.groupType === filters.groupType;

      const matchesLang =
        !filters.lang ||
        m.lang === filters.lang ||
        m.lang === 'both' ||
        (filters.lang === 'arabic' && (m.lang === 'ar' || m.lang === 'arabic')) ||
        (filters.lang === 'english' && (m.lang === 'en' || m.lang === 'english'));

      const matchesType = !filters.type || m.type === filters.type;

      return matchesSearch && matchesDay && matchesCity && matchesGroupType && matchesLang && matchesType;
    });

    if (!isNearestMode || !userCoordinates) {
      return baseList;
    }

    // Attach calculated distance to each meeting
    const withDistance = baseList.map((m) => {
      const coords = getMeetingCoordinates(m);
      const distanceKm = calculateHaversineDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        coords.latitude,
        coords.longitude
      );
      return { ...m, distanceKm };
    });

    const todayNames = getTodayDayNames();

    if (nearestDayScope === 'today') {
      const todayMeetings = withDistance.filter((m) => {
        const dayNameLower = (m.dayName || '').toLowerCase();
        return (
          dayNameLower.includes(todayNames.ar.toLowerCase()) ||
          dayNameLower.includes(todayNames.en.toLowerCase())
        );
      });

      if (todayMeetings.length > 0) {
        return todayMeetings.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }
    }

    // Fallback or All days scope: sort by physical proximity
    return withDistance.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [meetings, searchQuery, filters, cities, isNearestMode, userCoordinates, nearestDayScope]);

  // Closest single meeting for Hero Spotlight
  const closestMeeting = useMemo(() => {
    if (!isNearestMode || filteredMeetings.length === 0) return null;
    return filteredMeetings[0];
  }, [isNearestMode, filteredMeetings]);

  // Active filter items for chips
  const activeFilterItems: ActiveFilterItem[] = useMemo(() => {
    const list: ActiveFilterItem[] = [];

    if (isNearestMode) {
      list.push({
        key: 'nearest',
        label: isAr ? 'الموقع' : 'Location',
        value: selectedCityCenter
          ? selectedCityCenter
          : isAr
          ? 'الأقرب لموقعي (GPS)'
          : 'Nearest to Me (GPS)',
      });
    }

    if (filters.dayId) {
      const d = days.find((item) => String(item.id) === String(filters.dayId));
      list.push({
        key: 'dayId',
        label: isAr ? 'اليوم' : 'Day',
        value: d ? d.name : filters.dayId,
      });
    }

    if (filters.cityId) {
      const c = cities.find((item) => String(item.id) === String(filters.cityId));
      list.push({
        key: 'cityId',
        label: isAr ? 'المدينة' : 'City',
        value: c ? c.name : filters.cityId,
      });
    }

    if (filters.groupType) {
      const labels: Record<string, string> = {
        in_person: isAr ? 'حضوري' : 'In-Person',
        online: isAr ? 'أونلاين' : 'Online',
        hybrid: isAr ? 'مختلط' : 'Hybrid',
      };
      list.push({
        key: 'groupType',
        label: isAr ? 'النوع' : 'Type',
        value: labels[filters.groupType] || filters.groupType,
      });
    }

    if (filters.lang) {
      const labels: Record<string, string> = {
        arabic: isAr ? 'عربي' : 'Arabic',
        english: isAr ? 'إنجليزي' : 'English',
        both: isAr ? 'عربي / إنجليزي' : 'Bilingual',
      };
      list.push({
        key: 'lang',
        label: isAr ? 'اللغة' : 'Lang',
        value: labels[filters.lang] || filters.lang,
      });
    }

    if (filters.type) {
      const labels: Record<string, string> = {
        open: isAr ? 'مفتوح' : 'Open',
        closed: isAr ? 'مغلق' : 'Closed',
      };
      list.push({
        key: 'type',
        label: isAr ? 'الصفة' : 'Access',
        value: labels[filters.type] || filters.type,
      });
    }

    return list;
  }, [filters, days, cities, isAr, isNearestMode, selectedCityCenter]);

  const handleRemoveFilter = (key: string) => {
    if (key === 'nearest') {
      handleDeactivateNearestMode();
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: null }));
  };

  const handleClearAllFilters = () => {
    handleDeactivateNearestMode();
    setFilters({
      cityId: null,
      dayId: null,
      groupType: null,
      lang: null,
      type: null,
    });
  };

  const renderMeetingItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <MeetingCard
        meetingId={item.id}
        groupName={item.groupName}
        cityName={item.cityName}
        neighborhoodName={item.neighborhoodName}
        dayName={item.dayName}
        dayId={item.dayId}
        startTime={item.startTime}
        endTime={item.endTime}
        type={item.type}
        lang={item.lang}
        gsrName={item.gsrName}
        gsrPhone={item.gsrPhone}
        notes={item.notes}
        locationUrl={item.locationUrl}
        topicName={item.topicName}
        isBookmarked={!!bookmarks[item.id]}
        onToggleBookmark={toggleBookmark}
        index={index}
        distanceKm={item.distanceKm}
      />
    ),
    [bookmarks, toggleBookmark]
  );

  return (
    <View style={[styles.screenWrapper, { backgroundColor: isDark ? colors.bgDark : colors.primaryDark }]}>
      <AppHeader
        title={isAr ? 'دليل الاجتماعات' : 'Meetings Directory'}
        subtitle={isAr ? 'مصر • NA Egypt Fellowship' : 'Egypt • NA Fellowship'}
        bottomSlot={
          <View>
            <SearchBar
              query={searchQuery}
              onChangeQuery={setSearchQuery}
              placeholder={t('meetings.search_placeholder')}
              onFilterPress={() => setIsFilterVisible(true)}
              activeFilterCount={activeFilterItems.length}
              recentSearches={recentSearches}
              onSelectRecentSearch={(term) => {
                setSearchQuery(term);
                addRecentSearch(term);
              }}
              onClearRecentSearches={clearRecentSearches}
            />

            {/* Quick Action Nearest Mode Bar */}
            <View style={[styles.nearestBarRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                onPress={isNearestMode ? handleDeactivateNearestMode : handleActivateNearestMode}
                disabled={isLocating}
                style={[
                  styles.nearestToggleBtn,
                  {
                    backgroundColor: isNearestMode
                      ? isDark
                        ? '#0284c7'
                        : colors.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.15)',
                    borderColor: isNearestMode ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)',
                    flexDirection: isAr ? 'row-reverse' : 'row',
                  },
                ]}
                activeOpacity={0.8}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#ffffff" style={isAr ? { marginLeft: 6 } : { marginRight: 6 }} />
                ) : (
                  <Navigation
                    size={15}
                    color="#ffffff"
                    style={isAr ? { marginLeft: 6 } : { marginRight: 6 }}
                  />
                )}
                <AppText variant="labelSmall" weight="800" color="#ffffff">
                  {isLocating
                    ? t('meetings.locating')
                    : isNearestMode
                    ? t('meetings.nearest_active')
                    : t('meetings.nearest_to_me')}
                </AppText>
                {isNearestMode && (
                  <View style={[styles.activeDot, { backgroundColor: '#34d399', marginStart: isAr ? 0 : 6, marginEnd: isAr ? 6 : 0 }]} />
                )}
              </TouchableOpacity>

              {isNearestMode && (
                <TouchableOpacity
                  onPress={() => setIsCityPickerVisible(true)}
                  style={[
                    styles.cityPickerTrigger,
                    {
                      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.2)',
                      flexDirection: isAr ? 'row-reverse' : 'row',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <MapPin size={13} color="#ffffff" style={isAr ? { marginLeft: 4 } : { marginRight: 4 }} />
                  <AppText variant="caption" weight="700" color="#ffffff">
                    {selectedCityCenter || (isAr ? 'تغيير المدينة' : 'Change City')}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            {/* Scope Switcher when Nearest Mode is active */}
            {isNearestMode && (
              <View style={[styles.scopeSwitcherRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  onPress={() => {
                    haptic.selection();
                    setNearestDayScope('today');
                  }}
                  style={[
                    styles.scopeTab,
                    nearestDayScope === 'today' && {
                      backgroundColor: isDark ? '#38bdf8' : '#ffffff',
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight="800"
                    color={
                      nearestDayScope === 'today'
                        ? isDark
                          ? '#0f172a'
                          : colors.primary
                        : 'rgba(255, 255, 255, 0.75)'
                    }
                  >
                    {t('meetings.today_only')}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    haptic.selection();
                    setNearestDayScope('all');
                  }}
                  style={[
                    styles.scopeTab,
                    nearestDayScope === 'all' && {
                      backgroundColor: isDark ? '#38bdf8' : '#ffffff',
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight="800"
                    color={
                      nearestDayScope === 'all'
                        ? isDark
                          ? '#0f172a'
                          : colors.primary
                        : 'rgba(255, 255, 255, 0.75)'
                    }
                  >
                    {t('meetings.all_days')}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {activeFilterItems.length > 0 && (
              <FilterChips
                items={activeFilterItems}
                onRemoveItem={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
                style={styles.filterChipsRow}
              />
            )}
          </View>
        }
      />

      {/* Content Body */}
      <View style={[styles.contentBody, { backgroundColor: colors.bgPrimary }]}>
        {/* Results Header */}
        <View style={[styles.resultsHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <AppText variant="label" color={isDark ? '#38bdf8' : colors.primary} weight="700">
            {isAr
              ? `${filteredMeetings.length} اجتماع ${isNearestMode ? 'مرتب بالأقرب' : 'متاح'}${
                  frontpageStats?.governorates ? ` (${frontpageStats.governorates} محافظة)` : ''
                }`
              : `${filteredMeetings.length} meetings ${isNearestMode ? 'near you' : 'found'}${
                  frontpageStats?.governorates ? ` (${frontpageStats.governorates} governorates)` : ''
                }`}
          </AppText>
          {activeFilterItems.length > 0 && (
            <TouchableOpacity onPress={handleClearAllFilters}>
              <AppText
                variant="labelSmall"
                color={isDark ? '#22d3ee' : colors.accentDark}
                weight="700"
                style={{ paddingVertical: 2, paddingHorizontal: 6 }}
              >
                {isAr ? 'إلغاء كل التصفية' : 'Clear Filters'}
              </AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* List / Loading / Empty State */}
        {isLoading ? (
          <View style={{ paddingTop: 8, paddingHorizontal: 16 }}>
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={filteredMeetings}
            keyExtractor={(item) => item.id || item.remoteId}
            contentContainerStyle={styles.listContainer}
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
            ListHeaderComponent={
              isNearestMode && closestMeeting ? (
                <ClosestMeetingHero meeting={closestMeeting} />
              ) : null
            }
            renderItem={renderMeetingItem}
            ListEmptyComponent={
              <EmptyState
                icon={<MapPinOff size={44} color={colors.accent} />}
                title={t('meetings.no_results')}
                description={
                  isNearestMode && nearestDayScope === 'today'
                    ? isAr
                      ? 'لا توجد اجتماعات متبقية اليوم في منطقتك. جرب التبديل إلى "جميع الأيام" لمشاهدة أقرب الاجتماعات خلال الأسبوع.'
                      : 'No more meetings remaining today near you. Try switching to "All Days" to see upcoming meetings this week.'
                    : activeFilterItems.length > 0
                    ? isAr
                      ? 'لا توجد اجتماعات تطابق الفلاتر المحددة. جرب إزالة بعض الفلاتر أو تغيير كلمة البحث.'
                      : 'No meetings match your selected filters. Try removing some filters or changing search keywords.'
                    : isAr
                    ? 'لم يتم العثور على اجتماعات مطابقة لبحثك.'
                    : 'No meetings found matching your search.'
                }
                primaryActionTitle={
                  isNearestMode && nearestDayScope === 'today'
                    ? isAr
                      ? 'عرض جميع الأيام'
                      : 'View All Days'
                    : activeFilterItems.length > 0
                    ? isAr
                      ? 'إلغاء الفلاتر'
                      : 'Clear Filters'
                    : undefined
                }
                onPrimaryAction={
                  isNearestMode && nearestDayScope === 'today'
                    ? () => setNearestDayScope('all')
                    : activeFilterItems.length > 0
                    ? handleClearAllFilters
                    : undefined
                }
                secondaryActionTitle={searchQuery ? (isAr ? 'مسح البحث' : 'Clear Search') : undefined}
                onSecondaryAction={searchQuery ? () => setSearchQuery('') : undefined}
              />
            }
          />
        )}
      </View>

      {/* Filter Bottom Sheet */}
      <FilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        filters={filters}
        onApplyFilters={setFilters}
        cities={cities}
        days={days}
      />

      {/* City Center Picker Modal (Location Fallback) */}
      <Modal
        visible={isCityPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCityPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
            onPress={() => setIsCityPickerVisible(false)}
          />
          <View
            style={[
              styles.citySheetContainer,
              shadows.bottomSheet,
              {
                backgroundColor: colors.cardBg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              },
            ]}
          >
            {/* Sheet Header */}
            <View style={[styles.sheetHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View style={{ alignItems: isAr ? 'flex-end' : 'flex-start', flex: 1 }}>
                <AppText variant="h3" weight="800" color={colors.textPrimary}>
                  {isAr ? 'اختر المدينة كمركز للبحث' : 'Select City Reference'}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {isAr
                    ? 'سيتم حساب أقرب الاجتماعات بالنسبة لمركز المدينة المختارة'
                    : 'Nearest meetings will be calculated relative to the chosen city'}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setIsCityPickerVisible(false)}
                style={styles.closeSheetBtn}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Use GPS Button */}
            <TouchableOpacity
              onPress={handleActivateNearestMode}
              style={[
                styles.gpsQuickBtn,
                {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : colors.primaryLight + '20',
                  borderColor: isDark ? '#38bdf8' : colors.primary,
                  flexDirection: isAr ? 'row-reverse' : 'row',
                },
              ]}
            >
              <Navigation size={18} color={isDark ? '#38bdf8' : colors.primary} />
              <AppText
                variant="label"
                weight="800"
                color={isDark ? '#38bdf8' : colors.primary}
                style={isAr ? { marginRight: 8 } : { marginLeft: 8 }}
              >
                {isAr ? 'استخدام موقع GPS الحالي' : 'Use Live GPS Location'}
              </AppText>
            </TouchableOpacity>

            {/* City Options List */}
            <ScrollView
              style={{ maxHeight: 360 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {EGYPT_CITY_CENTROID_OPTIONS.map((c) => {
                const isSelected = selectedCityCenter === (isAr ? c.ar : c.en);
                return (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => handleSelectCityCenter(c)}
                    style={[
                      styles.cityItemRow,
                      {
                        borderBottomColor: colors.borderSubtle,
                        flexDirection: isAr ? 'row-reverse' : 'row',
                      },
                      isSelected && {
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : colors.accentLight,
                      },
                    ]}
                  >
                    <View style={[styles.cityTextCol, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="body" weight="700" color={colors.textPrimary}>
                        {isAr ? c.ar : c.en}
                      </AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        {isAr ? c.en : c.ar}
                      </AppText>
                    </View>
                    {isSelected && (
                      <Check size={18} color={isDark ? '#38bdf8' : colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  filterChipsRow: {
    marginTop: 6,
    paddingBottom: 2,
  },
  nearestBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  nearestToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  cityPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  scopeSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 3,
    marginTop: 8,
    gap: 4,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  contentBody: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  listContainer: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 28,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  citySheetContainer: {
    padding: 18,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  closeSheetBtn: {
    padding: 6,
  },
  gpsQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  cityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  cityTextCol: {
    flex: 1,
  },
});
