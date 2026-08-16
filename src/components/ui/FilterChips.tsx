import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../theme';
import { AppText } from './AppText';
import { haptic } from '../../utils/haptics';

export interface ActiveFilterItem {
  key: string;
  label: string;
  value: string;
}

export interface FilterChipsProps {
  items: ActiveFilterItem[];
  onRemoveItem: (key: string) => void;
  onClearAll?: () => void;
  style?: ViewStyle;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  items,
  onRemoveItem,
  onClearAll,
  style,
}) => {
  const { colors, borderRadius } = useAppTheme();

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <View
            key={item.key}
            style={[
              styles.chip,
              {
                backgroundColor: colors.accentLight,
                borderColor: colors.accent + '40',
                borderRadius: borderRadius.pill,
              },
            ]}
          >
            <AppText
              variant="labelSmall"
              color={colors.accentDark}
              weight="600"
              style={styles.chipText}
            >
              {item.label}: {item.value}
            </AppText>
            <TouchableOpacity
              onPress={() => {
                haptic.selection();
                onRemoveItem(item.key);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={`Remove filter ${item.label}`}
            >
              <X size={12} color={colors.accentDark} />
            </TouchableOpacity>
          </View>
        ))}

        {items.length > 1 && onClearAll && (
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              onClearAll();
            }}
            style={[
              styles.clearAllChip,
              {
                backgroundColor: colors.dangerLight,
                borderColor: colors.danger + '40',
                borderRadius: borderRadius.pill,
              },
            ]}
          >
            <AppText
              variant="labelSmall"
              color={colors.danger}
              weight="700"
            >
              مسح الفلاتر
            </AppText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 2,
  },
  clearAllChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
});
