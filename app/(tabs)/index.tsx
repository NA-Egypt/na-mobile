import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, MapPinOff, RefreshCw, Languages, Check } from 'lucide-react-native';
import { database } from '../../src/database';
import Meeting from '../../src/database/models/Meeting';
import City from '../../src/database/models/City';
import Day from '../../src/database/models/Day';
import { MeetingCard } from '../../src/components/MeetingCard';
import { FilterModal, FilterOptions } from '../../src/components/FilterModal';
import { NALogo } from '../../src/components/NALogo';
import { pullMasterData } from '../../src/database/sync';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

export default function MeetingFinderScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

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

  const toggleLanguage = () => {
    const nextLang = isAr ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  const loadDataFromLocalDB = useCallback(async () => {
    try {
      const meetingsCollection = database.get<Meeting>('meetings');
      const allMeetings = await meetingsCollection.query().fetch();

      const citiesCollection = database.get<City>('cities');
      const daysCollection = database.get<Day>('days');

      const allCities = await citiesCollection.query().fetch();
      const allDays = await daysCollection.query().fetch();

      // Populate filter dropdowns from live database
      setCities(allCities.map((c) => ({
        id: c.remoteId || c.id,
        name: isAr ? (c.arName || c.enName || '') : (c.enName || c.arName || ''),
      })));

      setDays(allDays.map((d) => ({
        id: d.remoteId || d.id,
        name: isAr ? (d.arName || d.enName || '') : (d.enName || d.arName || ''),
      })));

      const populated = allMeetings.map((m) => {
        const day = allDays.find((d) => String(d.remoteId) === String(m.dayId) || String(d.id) === String(m.dayId));

        const groupName = isAr
          ? (m.groupNameAr || m.groupNameEn || 'اجتماع زمالة NA')
          : (m.groupNameEn || m.groupNameAr || 'NA Meeting');

        const cityName = isAr
          ? (m.cityNameAr || m.cityNameEn || '')
          : (m.cityNameEn || m.cityNameAr || '');

        const neighborhoodName = isAr
          ? (m.neighborhoodNameAr || m.neighborhoodNameEn || '')
          : (m.neighborhoodNameEn || m.neighborhoodNameAr || '');

        const dayName = isAr
          ? (day?.arName || day?.enName || `يوم ${m.dayId}`)
          : (day?.enName || day?.arName || `Day ${m.dayId}`);

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
          address: isAr ? (m.addressAr || m.addressEn || '') : (m.addressEn || m.addressAr || ''),
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
    await pullMasterData();
    await loadDataFromLocalDB();
    setIsRefreshing(false);
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Robust live filtering
  const filteredMeetings = meetings.filter((m) => {
    // 1. Text Search
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      m.groupName.toLowerCase().includes(query) ||
      m.cityName.toLowerCase().includes(query) ||
      m.neighborhoodName.toLowerCase().includes(query) ||
      m.address.toLowerCase().includes(query);

    // 2. Day Filter
    const matchesDay = !filters.dayId || String(m.dayId) === String(filters.dayId);

    // 3. City Filter
    const matchesCity = (() => {
      if (!filters.cityId) return true;
      const selectedCity = cities.find((c) => c.id === filters.cityId);
      if (!selectedCity) return true;
      return (
        m.cityName.toLowerCase().includes(selectedCity.name.toLowerCase()) ||
        selectedCity.name.toLowerCase().includes(m.cityName.toLowerCase())
      );
    })();

    // 4. Group Type Filter
    const matchesGroupType = !filters.groupType || m.groupType === filters.groupType;

    // 5. Language Filter
    const matchesLang =
      !filters.lang ||
      m.lang === filters.lang ||
      m.lang === 'both' ||
      (filters.lang === 'arabic' && (m.lang === 'ar' || m.lang === 'arabic')) ||
      (filters.lang === 'english' && (m.lang === 'en' || m.lang === 'english'));

    // 6. Meeting Type Filter (Open/Closed)
    const matchesType = !filters.type || m.type === filters.type;

    return matchesSearch && matchesDay && matchesCity && matchesGroupType && matchesLang && matchesType;
  });

  const hasActiveFilters =
    filters.dayId !== null ||
    filters.cityId !== null ||
    filters.groupType !== null ||
    filters.lang !== null ||
    filters.type !== null;

  return (
    <View style={styles.screenWrapper}>
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLeft}>
            <NALogo size={42} />
            <View style={styles.brandTitleContainer}>
              <Text style={styles.brandTitleAr}>زمالة المدمنين المجهولين في مصر</Text>
              <Text style={styles.brandTitleEn}>Narcotics Anonymous • Egypt</Text>
            </View>
          </View>

          {/* Language Toggle */}
          <TouchableOpacity style={styles.langToggleBtn} onPress={toggleLanguage} activeOpacity={0.8}>
            <Languages size={14} color="#ffffff" style={{ marginEnd: 4 }} />
            <Text style={styles.langToggleText}>{isAr ? 'EN' : 'عربي'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Controls */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { textAlign: isAr ? 'right' : 'left' }]}
              placeholder={t('meetings.search_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={[styles.filterIconButton, hasActiveFilters && styles.filterIconButtonActive]}
            onPress={() => setIsFilterVisible(true)}
            activeOpacity={0.85}
          >
            <SlidersHorizontal size={19} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshIconButton} onPress={handleRefresh} activeOpacity={0.85}>
            <RefreshCw size={17} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Content Area */}
      <View style={styles.contentBody}>
        {/* Results Counter */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            {isAr ? `${filteredMeetings.length} اجتماع متاح` : `${filteredMeetings.length} meetings found`}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() =>
                setFilters({ cityId: null, dayId: null, groupType: null, lang: null, type: null })
              }
            >
              <Text style={styles.clearFiltersText}>{isAr ? 'إلغاء التصفية' : 'Clear Filters'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {isAr ? 'جاري تحميل الاجتماعات من قاعدة البيانات...' : 'Loading meetings...'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMeetings}
            keyExtractor={(item) => item.id || item.remoteId}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
            }
            renderItem={({ item }) => (
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
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MapPinOff size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('meetings.no_results')}</Text>
              </View>
            }
          />
        )}
      </View>

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
    backgroundColor: '#11253e',
  },
  safeHeader: {
    backgroundColor: '#11253e',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#11253e',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandTitleContainer: {
    marginStart: spacing.sm + 2,
  },
  brandTitleAr: {
    ...typography.h3,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  brandTitleEn: {
    ...typography.caption,
    color: 'rgba(224, 248, 252, 0.8)',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  langToggleText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#11253e',
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginEnd: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  filterIconButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterIconButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  refreshIconButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  contentBody: {
    flex: 1,
    backgroundColor: colors.bgLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.xs,
  },
  resultsCountText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    fontSize: 13,
  },
  clearFiltersBtn: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 179, 207, 0.2)',
  },
  clearFiltersText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.accentDark,
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContainer: {
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
