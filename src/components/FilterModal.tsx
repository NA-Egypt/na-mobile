import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, Check, RotateCcw } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

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
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  cities,
  days,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [localFilters, setLocalFilters] = React.useState<FilterOptions>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const handleReset = () => {
    const reset: FilterOptions = {
      cityId: null,
      dayId: null,
      groupType: null,
      lang: null,
      type: null,
    };
    setLocalFilters(reset);
    onApplyFilters(reset);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('meetings.filter_button')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {/* 1. Day of Week */}
          <Text style={styles.sectionTitle}>{isAr ? 'يوم الاجتماع' : 'Day of Week'}</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, localFilters.dayId === null && styles.activeChip]}
              onPress={() => setLocalFilters({ ...localFilters, dayId: null })}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, localFilters.dayId === null && styles.activeChipText]}>
                {isAr ? 'كل الأيام' : 'All Days'}
              </Text>
            </TouchableOpacity>
            {days.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, String(localFilters.dayId) === String(d.id) && styles.activeChip]}
                onPress={() => setLocalFilters({ ...localFilters, dayId: String(d.id) })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, String(localFilters.dayId) === String(d.id) && styles.activeChipText]}>
                  {d.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 2. City */}
          <Text style={styles.sectionTitle}>{isAr ? 'المدينة / المحافظة' : 'City / Governorate'}</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, localFilters.cityId === null && styles.activeChip]}
              onPress={() => setLocalFilters({ ...localFilters, cityId: null })}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, localFilters.cityId === null && styles.activeChipText]}>
                {isAr ? 'كل المدن' : 'All Cities'}
              </Text>
            </TouchableOpacity>
            {cities.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, localFilters.cityId === c.id && styles.activeChip]}
                onPress={() => setLocalFilters({ ...localFilters, cityId: c.id })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, localFilters.cityId === c.id && styles.activeChipText]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 3. Group Type (In-Person / Online) */}
          <Text style={styles.sectionTitle}>{isAr ? 'طبيعة الاجتماع (حضوري / أونلاين)' : 'Meeting Format'}</Text>
          <View style={styles.chipRow}>
            {[
              { id: null, label: isAr ? 'الكل' : 'All' },
              { id: 'in_person', label: isAr ? 'حضوري' : 'In-person' },
              { id: 'online', label: isAr ? 'أونلاين (عبر الإنترنت)' : 'Online' },
              { id: 'hybrid', label: isAr ? 'هجين (مزدوج)' : 'Hybrid' },
            ].map((gt) => (
              <TouchableOpacity
                key={gt.label}
                style={[styles.chip, localFilters.groupType === gt.id && styles.activeChip]}
                onPress={() => setLocalFilters({ ...localFilters, groupType: gt.id })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, localFilters.groupType === gt.id && styles.activeChipText]}>
                  {gt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 4. Language */}
          <Text style={styles.sectionTitle}>{isAr ? 'لغة الاجتماع' : 'Language'}</Text>
          <View style={styles.chipRow}>
            {[
              { id: null, label: isAr ? 'الكل' : 'All' },
              { id: 'arabic', label: isAr ? 'عربي' : 'Arabic' },
              { id: 'english', label: isAr ? 'إنجليزي' : 'English' },
              { id: 'both', label: isAr ? 'عربي / إنجليزي (مزدوج)' : 'Bilingual' },
            ].map((l) => (
              <TouchableOpacity
                key={l.label}
                style={[styles.chip, localFilters.lang === l.id && styles.activeChip]}
                onPress={() => setLocalFilters({ ...localFilters, lang: l.id })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, localFilters.lang === l.id && styles.activeChipText]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 5. Meeting Type (Open / Closed) */}
          <Text style={styles.sectionTitle}>{isAr ? 'نوع الحضور (مفتوح / مغلق)' : 'Attendance Type'}</Text>
          <View style={styles.chipRow}>
            {[
              { id: null, label: isAr ? 'الكل' : 'All' },
              { id: 'open', label: isAr ? 'مفتوح (للجميع)' : 'Open (All Welcome)' },
              { id: 'closed', label: isAr ? 'مغلق (للمدمنين فقط)' : 'Closed (Addicts Only)' },
            ].map((tp) => (
              <TouchableOpacity
                key={tp.label}
                style={[styles.chip, localFilters.type === tp.id && styles.activeChip]}
                onPress={() => setLocalFilters({ ...localFilters, type: tp.id })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, localFilters.type === tp.id && styles.activeChipText]}>
                  {tp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
            <RotateCcw size={16} color={colors.textSecondary} style={{ marginEnd: 4 }} />
            <Text style={styles.resetText}>{isAr ? 'إعادة ضبط' : 'Reset'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              onApplyFilters(localFilters);
              onClose();
            }}
            activeOpacity={0.85}
          >
            <Check size={18} color="#ffffff" style={{ marginEnd: 4 }} />
            <Text style={styles.applyText}>{isAr ? 'تطبيق التصفية' : 'Apply Filters'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fbff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
    backgroundColor: '#ffffff',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  activeChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
    gap: spacing.md,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.15)',
    borderRadius: borderRadius.md,
    backgroundColor: '#ffffff',
  },
  resetText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  applyText: {
    ...typography.body,
    color: '#ffffff',
    fontWeight: '700',
  },
});
