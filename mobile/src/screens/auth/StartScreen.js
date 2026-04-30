import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

const HAS_SEEN_ONBOARDING = 'has_seen_onboarding';
const { width } = Dimensions.get('window');

const StartScreen = ({ navigation }) => {
  const { browseAsGuest } = useAuth();
  
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Animations
  const flyAnim = useRef(new Animated.Value(0)).current; 
  const fadeAnim = useRef(new Animated.Value(0)).current;     
  const panelTranslateY = useRef(new Animated.Value(500)).current; 

  useEffect(() => {
    checkOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem(HAS_SEEN_ONBOARDING);
      if (value !== null) {
        setIsOnboarding(false);
        setIsReady(true);
        startSplashAnimation();
      } else {
        setIsOnboarding(true);
        setIsReady(true);
        startOnboardingAnimation();
      }
    } catch (e) {
      setIsOnboarding(false);
      setIsReady(true);
      startSplashAnimation();
    }
  };

  const startOnboardingAnimation = () => {
    // 1. Plane flies across dramatically
    Animated.timing(flyAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // 2. Text and UI float in right after plane takes off
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    }, 1300);
  };

  const startSplashAnimation = () => {
    // Logo & Plane animation moved to AppLoader (global splash)
    // Here we just slide up the Auth action panel immediately
    Animated.timing(panelTranslateY, {
      toValue: 0,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(HAS_SEEN_ONBOARDING, 'true');
    browseAsGuest();
  };

  if (!isReady) {
    return <View style={styles.safeArea} />;
  }

  // 1. Initial Page Load (Onboarding)
  if (isOnboarding) {
    // Plane path interpolation
    const translateX = flyAnim.interpolate({ inputRange: [0, 1], outputRange: [-200, width + 200] });
    const translateY = flyAnim.interpolate({ inputRange: [0, 1], outputRange: [300, -300] });
    const scale = flyAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.8, 0.3] });

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.onboardingContainer}>
          
          {/* Hero Section containing animations */}
          <View style={styles.heroSection}>
            <Animated.View style={[styles.heroCircle, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
              <Ionicons name="earth" size={200} color={`${colors.primary}15`} />
            </Animated.View>

            <Animated.View style={[
              styles.planeWrapper, 
              { transform: [{ translateX }, { translateY }, { scale }, { rotate: '-25deg' }] }
            ]}>
              <Ionicons name="airplane" size={60} color={colors.primary} />
            </Animated.View>
          </View>

          {/* Fading in text and button */}
          <Animated.View style={[styles.onboardingContent, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
             <View style={styles.logoWrap}>
                <Image source={require('../../../assets/images/TravelGenie.png')} style={styles.logo} resizeMode="contain" />
             </View>
             <Text style={styles.title}>Travel<Text style={styles.titleHighlight}>Genie</Text></Text>
             <Text style={styles.tagline}>Let's start planning...</Text>
             
             <View style={{ height: 50 }} />
             
             <Pressable
                style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
                onPress={handleGetStarted}
             >
                <Ionicons name="rocket-outline" size={20} color={colors.white} />
                <Text style={styles.btnPrimaryText}>Let's plan your trip</Text>
             </Pressable>
          </Animated.View>

        </View>
      </SafeAreaView>
    );
  }

  // 2. Auth Panel (Seen after clicking Log In from guest, or second app launch)
  return (
    <SafeAreaView style={styles.safeAreaAuth} edges={['top', 'bottom']}>
      {/* Brand Splash Splash Area */}
      <View style={[styles.brand, { zIndex: 0 }]}>
        <View style={styles.logoWrap}>
          <Image source={require('../../../assets/images/TravelGenie.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>
          Travel<Text style={styles.titleHighlight}>Genie</Text>
        </Text>
        <Text style={styles.splashTagline}>
          Your smart travel companion
        </Text>
      </View>

      {/* Slide Up Actions Panel */}
      <Animated.View style={[styles.actionsPanel, { transform: [{ translateY: panelTranslateY }] }]}>
        <Pressable
          style={({ pressed }) => [styles.btnTealFilled, pressed && styles.pressed]}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="log-in-outline" size={20} color={colors.white} />
          <Text style={styles.btnTealFilledText}>Sign In</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnTealOutline, pressed && styles.pressed]}
          onPress={() => navigation.navigate('Register')}
        >
          <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          <Text style={styles.btnTealOutlineText}>Create Account</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnGuestAction, pressed && styles.pressed]}
          onPress={browseAsGuest}
        >
          <Ionicons name="compass-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.btnGuestActionText}>Browse as Guest</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={styles.adminLink}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
          <Text style={styles.adminLinkText}>Admin sign in</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  safeAreaAuth: {
    flex: 1,
    backgroundColor: colors.background,
  },
  onboardingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '10%',
  },
  heroCircle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planeWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  onboardingContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
    position: 'absolute',
    bottom: '15%',
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40
  },
  logoWrap: {
    width: 140,
    height: 140,
    marginBottom: 20
  },
  logo: {
    width: '100%',
    height: '100%'
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  titleHighlight: {
    color: colors.primary
  },
  tagline: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 10,
    fontWeight: '600'
  },
  splashTagline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '500'
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: { 
    color: colors.white, 
    fontSize: 17, 
    fontWeight: '700' 
  },
  
  actionsPanel: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 30,
    gap: 16,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  btnTealFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14
  },
  btnTealOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary
  },
  btnGuestAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    paddingVertical: 16,
    borderRadius: 14,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }]
  },
  btnTealFilledText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  btnTealOutlineText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  btnGuestActionText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4
  },
  adminLinkText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600'
  }
});

export default StartScreen;
