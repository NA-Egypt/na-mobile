import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  Platform,
} from 'react-native';
import { Search, X, SlidersHorizontal, Clock, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { haptic } from '../../utils/haptics';
import { AppText } from './AppText';
import { Badge } from './Badge';

export interface SearchBarProps {
  query: string;
  onChangeQuery: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  activeFilterCount?: number;
  recentSearches?: string[];
  onSelectRecentSearch?: (term: string) => void;
  onClearRecentSearches?: () => void;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChangeQuery,
  placeholder,
  onFilterPress,
  activeFilterCount = 0,
  recentSearches = [],
  onSelectRecentSearch,
  onClearRecentSearches,
  style,
}) => {
  const { colors, borderRadius, shadows } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    haptic.light();
    onChangeQuery('');
  };

  const handleFilterPress = () => {
    haptic.selection();
    if (onFilterPress) {
      onFilterPress();
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.inputRow}>
        <View
          style={[
            styles.inputContainer,
            shadows.sm,
            {
              backgroundColor: colors.cardBg,
              borderColor: isFocused ? colors.accent : colors.cardBorder,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Search
            size={18}
            color={isFocused ? colors.accent : colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || (isAr ? 'ابحث باسم الاجتماع، الحي، أو المدينة...' : 'Search by group, area, or city...')}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                textAlign: isAr ? 'right' : 'left',
              },
            ]}
            returnKeyType="search"
            accessibilityRole="search"
            accessibilityLabel={placeholder || 'Search input'}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
            >
              <View
                style={[
                  styles.clearCircle,
                  { backgroundColor: colors.borderSolid },
                ]}
              >
                <X size={12} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {onFilterPress && (
          <TouchableOpacity
            onPress={handleFilterPress}
            style={[
              styles.filterButton,
              shadows.sm,
              {
                backgroundColor: activeFilterCount > 0 ? colors.accent : colors.cardBg,
                borderColor: activeFilterCount > 0 ? colors.accent : colors.cardBorder,
                borderRadius: borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Filter meetings. ${activeFilterCount} active filters.`}
          >
            <SlidersHorizontal
              size={18}
              color={activeFilterCount > 0 ? colors.primaryDark : colors.textSecondary}
            />
            {activeFilterCount > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: colors.gold },
                ]}
              >
                <AppText
                  variant="caption"
                  color="#ffffff"
                  weight="700"
                  style={styles.filterBadgeText}
                >
                  {activeFilterCount}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Searches Chips when focused and query is empty */}
      {isFocused && query.length === 0 && recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <View style={styles.recentTitleRow}>
              <Clock size={13} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textMuted} weight="600" style={{ marginStart: 4 }}>
                {isAr ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
              </AppText>
            </View>
            {onClearRecentSearches && (
              <TouchableOpacity onPress={onClearRecentSearches} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <AppText variant="caption" color={colors.accent} weight="600">
                  {isAr ? 'مسح الكل' : 'Clear All'}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentChipsContainer}
            keyboardShouldPersistTaps="handled"
          >
            {recentSearches.map((term, index) => (
              <TouchableOpacity
                key={`${term}-${index}`}
                onPress={() => {
                  haptic.selection();
                  if (onSelectRecentSearch) {
                    onSelectRecentSearch(term);
                  } else {
                    onChangeQuery(term);
                  }
                }}
                style={[
                  styles.recentChip,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.cardBorder,
                    borderRadius: borderRadius.pill,
                  },
                ]}
              >
                <AppText variant="caption" color={colors.textSecondary} weight="500">
                  {term}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  filterBadgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  recentSection: {
    marginTop: 8,
    paddingVertical: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentChipsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  recentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
});
