import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, RotateCcw, Check } from 'lucide-react-native';
import { useAppTheme } from '../theme';
import { AppText, AppButton, Badge } from './ui';
import { haptic } from '../utils/haptics';

export interface FilterOptions {
  cityId: string | null;
  dayId: string | null;
  groupType: string | null; // 'in_person' | 'online' | 'hybrid'
  lang: string | null;      // 'arabic' | 'english' | 'both'
  type: string | null;      // 'open' | 'closed'
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (newFilters: FilterOptions) => void;
  cities: Array<{ id: string; name: string }>;
  days: Array<{ id: string; name: string }>;
  isOnlineTab?: boolean;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  cities,
  days,
  isOnlineTab = false,
}) => {
  const { colors, borderRadius, shadows } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const [localFilters, setLocalFilters] = React.useState<FilterOptions>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const countActiveFilters = (): number => {
    let count = 0;
    if (localFilters.cityId) count++;
    if (localFilters.dayId) count++;
    if (localFilters.groupType) count++;
    if (localFilters.lang) count++;
    if (localFilters.type) count++;
    return count;
  };

  const handleReset = () => {
    haptic.light();
    const reset: FilterOptions = {
      cityId: null,
      dayId: null,
      groupType: null,
      lang: null,
      type: null,
    };
    setLocalFilters(reset);
  };

  const handleApply = () => {
    haptic.success();
    onApplyFilters(localFilters);
    onClose();
  };

  const activeCount = countActiveFilters();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={onClose}
        />

        {/* Sheet Content */}
        <View
          style={[
            styles.sheetContainer,
            shadows.bottomSheet,
            {
              backgroundColor: colors.cardBg,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.borderSolid }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.titleRow}>
              <AppText variant="h2" color={colors.textPrimary} weight="700">
                {t('meetings.filter_button')}
              </AppText>
              {activeCount > 0 && (
                <Badge
                  label={`${activeCount} نشط`}
                  variant="accent"
                  size="sm"
                  style={{ marginStart: 8 }}
                />
              )}
            </View>

            <View style={styles.headerActions}>
              {activeCount > 0 && (
                <TouchableOpacity
                  onPress={handleReset}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.resetBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Reset all filters"
                >
                  <RotateCcw size={14} color={colors.danger} />
                  <AppText variant="labelSmall" color={colors.danger} weight="600" style={{ marginStart: 4 }}>
                    {isAr ? 'إعادة ضبط' : 'Reset'}
                  </AppText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
                accessibilityRole="button"
                accessibilityLabel="Close filter modal"
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Filters */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Day of Week */}
            <AppText
              variant="h4"
              color={colors.textPrimary}
              weight="700"
              style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}
            >
              {isAr ? 'يوم الاجتماع' : 'Day of Week'}
            </AppText>
            <View style={[styles.chipRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: localFilters.dayId === null ? colors.accent : colors.bgSecondary,
                    borderColor: localFilters.dayId === null ? colors.accent : colors.borderSolid,
                    borderRadius: borderRadius.pill,
                  },
                ]}
                onPress={() => {
                  haptic.selection();
                  setLocalFilters({ ...localFilters, dayId: null });
                }}
              >
                <AppText
                  variant="label"
                  color={localFilters.dayId === null ? colors.primaryDark : colors.textSecondary}
                  weight={localFilters.dayId === null ? '700' : '500'}
                >
                  {isAr ? 'كل الأيام' : 'All Days'}
                </AppText>
              </TouchableOpacity>
              {days.map((d) => {
                const isSelected = String(localFilters.dayId) === String(d.id);
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.bgSecondary,
                        borderColor: isSelected ? colors.accent : colors.borderSolid,
                        borderRadius: borderRadius.pill,
                      },
                    ]}
                    onPress={() => {
                      haptic.selection();
                      setLocalFilters({ ...localFilters, dayId: String(d.id) });
                    }}
                  >
                    <AppText
                      variant="label"
                      color={isSelected ? colors.primaryDark : colors.textSecondary}
                      weight={isSelected ? '700' : '500'}
                    >
                      {d.name}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. City (In-Person only) */}
            {!isOnlineTab && (
              <>
                <AppText
                  variant="h4"
                  color={colors.textPrimary}
                  weight="700"
                  style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}
                >
                  {isAr ? 'المدينة / المحافظة' : 'City / Governorate'}
                </AppText>
                <View style={[styles.chipRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        backgroundColor: localFilters.cityId === null ? colors.accent : colors.bgSecondary,
                        borderColor: localFilters.cityId === null ? colors.accent : colors.borderSolid,
                        borderRadius: borderRadius.pill,
                      },
                    ]}
                    onPress={() => {
                      haptic.selection();
                      setLocalFilters({ ...localFilters, cityId: null });
                    }}
                  >
                    <AppText
                      variant="label"
                      color={localFilters.cityId === null ? colors.primaryDark : colors.textSecondary}
                      weight={localFilters.cityId === null ? '700' : '500'}
                    >
                      {isAr ? 'كل المدن' : 'All Cities'}
                    </AppText>
                  </TouchableOpacity>
                  {cities.map((c) => {
                    const isSelected = String(localFilters.cityId) === String(c.id);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.bgSecondary,
                            borderColor: isSelected ? colors.accent : colors.borderSolid,
                            borderRadius: borderRadius.pill,
                          },
                        ]}
                        onPress={() => {
                          haptic.selection();
                          setLocalFilters({ ...localFilters, cityId: String(c.id) });
                        }}
                      >
                        <AppText
                          variant="label"
                          color={isSelected ? colors.primaryDark : colors.textSecondary}
                          weight={isSelected ? '700' : '500'}
                        >
                          {c.name}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 3. Meeting Type */}
                <AppText
                  variant="h4"
                  color={colors.textPrimary}
                  weight="700"
                  style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}
                >
                  {isAr ? 'نوع الحضور' : 'Attendance Type'}
                </AppText>
                <View style={[styles.chipRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  {[
                    { id: null, label: isAr ? 'الكل' : 'All' },
                    { id: 'in_person', label: isAr ? 'حضوري' : 'In-Person' },
                    { id: 'online', label: isAr ? 'أونلاين' : 'Online' },
                    { id: 'hybrid', label: isAr ? 'مختلط' : 'Hybrid' },
                  ].map((opt) => {
                    const isSelected = localFilters.groupType === opt.id;
                    return (
                      <TouchableOpacity
                        key={String(opt.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.bgSecondary,
                            borderColor: isSelected ? colors.accent : colors.borderSolid,
                            borderRadius: borderRadius.pill,
                          },
                        ]}
                        onPress={() => {
                          haptic.selection();
                          setLocalFilters({ ...localFilters, groupType: opt.id });
                        }}
                      >
                        <AppText
                          variant="label"
                          color={isSelected ? colors.primaryDark : colors.textSecondary}
                          weight={isSelected ? '700' : '500'}
                        >
                          {opt.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* 4. Language */}
            <AppText
              variant="h4"
              color={colors.textPrimary}
              weight="700"
              style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}
            >
              {isAr ? 'لغة الاجتماع' : 'Meeting Language'}
            </AppText>
            <View style={[styles.chipRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              {[
                { id: null, label: isAr ? 'كل اللغات' : 'All Languages' },
                { id: 'arabic', label: isAr ? 'عربي' : 'Arabic' },
                { id: 'english', label: isAr ? 'إنجليزي' : 'English' },
                { id: 'both', label: isAr ? 'عربي / إنجليزي' : 'Bilingual' },
              ].map((opt) => {
                const isSelected = localFilters.lang === opt.id;
                return (
                  <TouchableOpacity
                    key={String(opt.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.bgSecondary,
                        borderColor: isSelected ? colors.accent : colors.borderSolid,
                        borderRadius: borderRadius.pill,
                      },
                    ]}
                    onPress={() => {
                      haptic.selection();
                      setLocalFilters({ ...localFilters, lang: opt.id });
                    }}
                  >
                    <AppText
                      variant="label"
                      color={isSelected ? colors.primaryDark : colors.textSecondary}
                      weight={isSelected ? '700' : '500'}
                    >
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Access Type (Open/Closed) */}
            <AppText
              variant="h4"
              color={colors.textPrimary}
              weight="700"
              style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}
            >
              {isAr ? 'طبيعة الحضور' : 'Access Policy'}
            </AppText>
            <View style={[styles.chipRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              {[
                { id: null, label: isAr ? 'الكل' : 'All' },
                { id: 'open', label: isAr ? 'مفتوح (للجميع)' : 'Open (All)' },
                { id: 'closed', label: isAr ? 'مغلق (للمدمنين فقط)' : 'Closed (Addicts Only)' },
              ].map((opt) => {
                const isSelected = localFilters.type === opt.id;
                return (
                  <TouchableOpacity
                    key={String(opt.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.bgSecondary,
                        borderColor: isSelected ? colors.accent : colors.borderSolid,
                        borderRadius: borderRadius.pill,
                      },
                    ]}
                    onPress={() => {
                      haptic.selection();
                      setLocalFilters({ ...localFilters, type: opt.id });
                    }}
                  >
                    <AppText
                      variant="label"
                      color={isSelected ? colors.primaryDark : colors.textSecondary}
                      weight={isSelected ? '700' : '500'}
                    >
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer CTA */}
          <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
            <AppButton
              title={isAr ? `تطبيق الفلاتر ${activeCount > 0 ? `(${activeCount})` : ''}` : `Apply Filters ${activeCount > 0 ? `(${activeCount})` : ''}`}
              onPress={handleApply}
              variant="primary"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as object),
  },
  sheetContainer: {
    maxHeight: '85%',
    minHeight: '55%',
    width: '100%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    marginBottom: 10,
    marginTop: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
