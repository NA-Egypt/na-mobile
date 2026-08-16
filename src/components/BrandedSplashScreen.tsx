import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { NALogo } from './NALogo';
import { colors } from '../theme';

interface BrandedSplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const BrandedSplashScreen: React.FC<BrandedSplashScreenProps> = ({ onFinish, isReady = true }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(20)).current;
  const isAnimationStarted = useRef(false);

  useEffect(() => {
    // Entrance animation sequence
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isReady || isAnimationStarted.current) return;

    const timer = setTimeout(() => {
      isAnimationStarted.current = true;
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, [isReady]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Decorative radial gradient backdrop effect */}
      <View style={styles.glowCircle} />
      <View style={styles.secondaryGlow} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoRing}>
            <NALogo size={115} />
          </View>
        </View>

        <Text style={styles.titleAr}>زمالة المدمنين المجهولين في مصر</Text>
        <Text style={styles.titleEn}>Narcotics Anonymous • Egypt</Text>

        <Animated.View
          style={[
            styles.badge,
            {
              transform: [{ translateY: badgeAnim }],
            },
          ]}
        >
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>حيث نساعد بعضنا البعض لنبقى ممتنعين</Text>
        </Animated.View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerUrl}>egyptna.org</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#11253e', // Deep Navy Dark matching website
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  glowCircle: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(16, 179, 207, 0.08)',
  },
  secondaryGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoRing: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)', // Golden emblem ring
    shadowColor: '#10b3cf',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  titleAr: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  titleEn: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(224, 248, 252, 0.85)',
    textAlign: 'center',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 28,
    backgroundColor: 'rgba(16, 179, 207, 0.12)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 179, 207, 0.3)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  footerInfo: {
    position: 'absolute',
    bottom: -100,
  },
  footerUrl: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});

