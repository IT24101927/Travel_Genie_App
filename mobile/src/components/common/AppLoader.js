import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const AppLoader = ({ message = 'Loading...' }) => {
  // Center Logo Pulse
  const logoPulse = useRef(new Animated.Value(0)).current; 
  // Background rings
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  // Plane Orbit
  const orbitAnim = useRef(new Animated.Value(0)).current;
  // Text Breathing
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Text Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(textAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(textAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true })
      ])
    ).start();

    // 2. Logo Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    // 3. Rings Expansion
    const createRing = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 3000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      ).start();
    };

    createRing(ring1, 0);
    createRing(ring2, 1000);
    createRing(ring3, 2000);

    // 4. Orbit Plane (Continuous 360 rotation)
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

  }, [textAnim, logoPulse, ring1, ring2, ring3, orbitAnim]);

  // Interpolations
  const logoScale = logoPulse.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.07] });
  
  const orbitRotate = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const renderRing = (anim) => (
    <Animated.View style={[
      styles.ring,
      {
        opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.6, 0.1, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.5] }) }]
      }
    ]} />
  );

  return (
    <View style={styles.container}>
      {/* Decorative Blobs */}
      <View style={styles.topBlob} />
      <View style={styles.bottomBlob} />

      <View style={styles.centerAnchor}>
        
        {/* Animated Expanding Rings */}
        {renderRing(ring1)}
        {renderRing(ring2)}
        {renderRing(ring3)}

        {/* Orbiting Plane */}
        <Animated.View style={[styles.orbitContainer, { transform: [{ rotate: orbitRotate }] }]}>
          <View style={styles.planeWrapper}>
            <Ionicons name="airplane" size={32} color={colors.primary} style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
        </Animated.View>

        {/* Center Pulsing Logo replacing the standard ActivityIndicator */}
        <Animated.View style={[styles.mainLogoWrapper, { transform: [{ scale: logoScale }] }]}>
           <Image source={require('../../../assets/images/TravelGenie.png')} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>

      </View>

      {/* Breathing Text Locked to Bottom Width */}
      <Animated.View style={[styles.textContainer, { opacity: textAnim }]}>
         <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerAnchor: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLogoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  logoImage: {
    width: 75,
    height: 75,
  },
  orbitContainer: {
    position: 'absolute',
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'flex-start', // Anchors the plane to the top edge before rotating
    zIndex: 5,
  },
  planeWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10, // Pulls the plane slightly outside the orbit bounding box
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  textContainer: {
    position: 'absolute',
    bottom: '20%',
    alignItems: 'center',
    width: '100%',
  },
  message: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  topBlob: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${colors.primary}08`,
  },
  bottomBlob: {
    position: 'absolute',
    bottom: -150,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: `${colors.primary}08`,
  }
});

export default AppLoader;
