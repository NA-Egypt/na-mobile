import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MapPinOff } from 'lucide-react-native';
import { database } from '../../src/database';
import Meeting from '../../src/database/models/Meeting';
import City from '../../src/database/models/City';
import Day from '../../src/database/models/Day';
import { MeetingCard } from '../../src/components/MeetingCard';
import { FilterModal, FilterOptions } from '../../src/components/FilterModal';
import { NALogo } from '../../src/components/NALogo';
import {
  AppText,
  SearchBar,
  FilterChips,
  ActiveFilterItem,
  EmptyState,
  MeetingCardSkeleton,
  LanguageSwitcher,
} from '../../src/components/ui';
import { pullMasterData } from '../../src/database/sync';
import { useAppTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/appStore';
import { haptic } from '../../src/utils/haptics';

export default function MeetingFinderScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, spacing, borderRadius } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

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
          ? m.groupNameAr || m.groupNameEn || 'اجتماع زمالة NA'
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
          type: m.type || 'open',
          lang: m.lang || 'arabic',
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

  useEffect(() => {
    loadDataFromLocalDB();
    pullMasterData().then(() => {
      loadDataFromLocalDB();
    });

    const subscription = database
      .get<Meeting>('meetings')
      .query()
      .observe()
      .subscribe(() => {
        loadDataFromLocalDB();
      });

    return () => subscription.unsubscribe();
  }, [loadDataFromLocalDB]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    haptic.light();
    await pullMasterData();
    await loadDataFromLocalDB();
    setIsRefreshing(false);
  };

  const handleSearchSubmit = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      addRecentSearch(text.trim());
    }
  };

  // Filter calculation
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
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
  }, [meetings, searchQuery, filters, cities]);

  // Active filter items for chips
  const activeFilterItems: ActiveFilterItem[] = useMemo(() => {
    const list: ActiveFilterItem[] = [];

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
  }, [filters, days, cities, isAr]);

  const handleRemoveFilter = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: null }));
  };

  const handleClearAllFilters = () => {
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
        startTime={item.startTime}
        endTime={item.endTime}
        type={item.type}
        lang={item.lang}
        notes={item.notes}
        isBookmarked={!!bookmarks[item.id]}
        onToggleBookmark={toggleBookmark}
        index={index}
      />
    ),
    [bookmarks, toggleBookmark]
  );

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.primaryDark }]}>
      <SafeAreaView style={[styles.safeHeader, { backgroundColor: colors.primaryDark }]} edges={['top']}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLeft}>
            <NALogo size={40} />
            <View style={styles.brandTitleContainer}>
              <AppText variant="h3" color="#ffffff" weight="800" style={styles.brandTitleAr}>
                زمالة المدمنين المجهولين
              </AppText>
              <AppText variant="caption" color="rgba(224, 248, 252, 0.8)" style={styles.brandTitleEn}>
                Narcotics Anonymous • Egypt
              </AppText>
            </View>
          </View>

          <LanguageSwitcher />
        </View>

        {/* Search Bar & Filter Trigger */}
        <View style={styles.searchSection}>
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
        </View>

        {/* Active Filter Chips */}
        {activeFilterItems.length > 0 && (
          <FilterChips
            items={activeFilterItems}
            onRemoveItem={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            style={styles.filterChipsRow}
          />
        )}
      </SafeAreaView>

      {/* Content Body */}
      <View style={[styles.contentBody, { backgroundColor: colors.bgPrimary }]}>
        {/* Results Header */}
        <View style={styles.resultsHeaderRow}>
          <AppText variant="label" color={colors.primary} weight="700">
            {isAr ? `${filteredMeetings.length} اجتماع متاح` : `${filteredMeetings.length} meetings found`}
          </AppText>
          {activeFilterItems.length > 0 && (
            <AppText
              variant="labelSmall"
              color={colors.accentDark}
              weight="700"
              onPress={handleClearAllFilters}
              style={{ paddingVertical: 2, paddingHorizontal: 6 }}
            >
              {isAr ? 'إلغاء كل التصفية' : 'Clear Filters'}
            </AppText>
          )}
        </View>

        {/* List / Loading / Empty State */}
        {isLoading ? (
          <View style={{ paddingTop: 8 }}>
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
            renderItem={renderMeetingItem}
            ListEmptyComponent={
              <EmptyState
                icon={<MapPinOff size={44} color={colors.accent} />}
                title={t('meetings.no_results')}
                description={
                  activeFilterItems.length > 0
                    ? isAr
                      ? 'لا توجد اجتماعات تطابق الفلاتر المحددة. جرب إزالة بعض الفلاتر أو تغيير كلمة البحث.'
                      : 'No meetings match your selected filters. Try removing some filters or changing search keywords.'
                    : isAr
                    ? 'لم يتم العثور على اجتماعات مطابقة لبحثك.'
                    : 'No meetings found matching your search.'
                }
                primaryActionTitle={activeFilterItems.length > 0 ? (isAr ? 'إلغاء الفلاتر' : 'Clear Filters') : undefined}
                onPrimaryAction={activeFilterItems.length > 0 ? handleClearAllFilters : undefined}
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
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandTitleContainer: {
    marginStart: 10,
  },
  brandTitleAr: {
    fontSize: 15,
  },
  brandTitleEn: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterChipsRow: {
    paddingBottom: 4,
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
  },
});
