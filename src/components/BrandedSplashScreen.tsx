import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { colors } from '../theme';

interface BrandedSplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const BrandedSplashScreen: React.FC<BrandedSplashScreenProps> = ({ onFinish, isReady = true }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(15)).current;
  const isAnimationStarted = useRef(false);

  useEffect(() => {
    // Smooth Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnim, {
        toValue: 0,
        duration: 500,
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
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [isReady]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
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
          <Image
            source={require('../../assets/splash-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

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
    backgroundColor: '#ffffff', // Clean white matching native splash for zero flicker
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 160,
  },
  logoImage: {
    width: 280,
    height: 140,
  },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(30, 58, 95, 0.06)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.15)',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b3cf',
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 13,
    color: '#1e3a5f',
    fontWeight: '700',
  },
  footerInfo: {
    position: 'absolute',
    bottom: -110,
  },
  footerUrl: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
