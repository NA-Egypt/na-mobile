import React, { useEffect } from 'react';
import { ViewStyle, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius,
  style,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.borderSolid,
          borderRadius: radius !== undefined ? radius : borderRadius.sm,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const MeetingCardSkeleton: React.FC = () => {
  const { colors, borderRadius, shadows } = useAppTheme();

  return (
    <Animated.View
      style={[
        styles.cardSkeleton,
        shadows.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.card,
        },
      ]}
    >
      <Animated.View style={styles.rowBetween}>
        <Animated.View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={70} height={24} borderRadius={12} />
        </Animated.View>
        <Skeleton width={32} height={32} borderRadius={16} />
      </Animated.View>

      <Skeleton width="75%" height={22} style={{ marginVertical: 12 }} />
      <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={16} style={{ marginBottom: 16 }} />

      <Animated.View style={styles.footerRow}>
        <Skeleton width={110} height={32} borderRadius={8} />
        <Skeleton width={110} height={32} borderRadius={8} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
