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
  // Plane Fly (8 Planes)
  const planesAnim = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
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

    // 4. Multiple Planes Fly
    const planesConfig = [
      { id: 0, duration: 3500, delay: 0, x: [-width/2 - 200, width/2 + 200], y: [height/2 + 200, -height/2 - 200], rot: '-45deg', size: 48, opacity: 1 },
      { id: 1, duration: 4200, delay: 800, x: [-width/2 - 200, width/2 + 200], y: [-height/2 - 200, height/2 + 200], rot: '45deg', size: 28, opacity: 0.6 },
      { id: 2, duration: 5000, delay: 1500, x: [-width/2 - 200, width/2 + 200], y: [150, 150], rot: '0deg', size: 36, opacity: 0.4 },
      { id: 3, duration: 3800, delay: 400, x: [-width/2 - 200, width/2 + 200], y: [-height/4, -height/3], rot: '-10deg', size: 20, opacity: 0.3 },
      { id: 4, duration: 4500, delay: 2000, x: [-width/2 - 200, width/2 + 200], y: [-height/2 - 200, height/4 + 200], rot: '40deg', size: 24, opacity: 0.5 },
      // New planes from Bottom-Right to Top-Left
      { id: 5, duration: 4000, delay: 500, x: [width/2 + 200, -width/2 - 200], y: [height/2 + 200, -height/2 - 200], rot: '-135deg', size: 40, opacity: 0.8 },
      { id: 6, duration: 4800, delay: 1800, x: [width/2 + 200, -width/2 - 200], y: [height/4 + 200, -height/2 - 200], rot: '-150deg', size: 26, opacity: 0.5 },
      { id: 7, duration: 5500, delay: 2800, x: [width/4 + 200, -width/2 - 200], y: [height/2 + 200, -height/4 - 200], rot: '-120deg', size: 20, opacity: 0.3 },
    ];

    planesConfig.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(planesAnim[p.id], { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(p.delay),
          Animated.timing(planesAnim[p.id], {
            toValue: 1,
            duration: p.duration,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ])
      ).start();
    });

  }, [textAnim, logoPulse, ring1, ring2, ring3, ...planesAnim]);

  // Interpolations
  const logoScale = logoPulse.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.07] });

  // Array of plane configurations for rendering
  const planesData = [
    { id: 0, x: [-width/2 - 200, width/2 + 200], y: [height/2 + 200, -height/2 - 200], rot: '-45deg', size: 48, opacity: 1 },
    { id: 1, x: [-width/2 - 200, width/2 + 200], y: [-height/2 - 200, height/2 + 200], rot: '45deg', size: 28, opacity: 0.6 },
    { id: 2, x: [-width/2 - 200, width/2 + 200], y: [150, 150], rot: '0deg', size: 36, opacity: 0.4 },
    { id: 3, x: [-width/2 - 200, width/2 + 200], y: [-height/4, -height/3], rot: '-10deg', size: 20, opacity: 0.3 },
    { id: 4, x: [-width/2 - 200, width/2 + 200], y: [-height/2 - 200, height/4 + 200], rot: '40deg', size: 24, opacity: 0.5 },
    { id: 5, x: [width/2 + 200, -width/2 - 200], y: [height/2 + 200, -height/2 - 200], rot: '-135deg', size: 40, opacity: 0.8 },
    { id: 6, x: [width/2 + 200, -width/2 - 200], y: [height/4 + 200, -height/2 - 200], rot: '-150deg', size: 26, opacity: 0.5 },
    { id: 7, x: [width/4 + 200, -width/2 - 200], y: [height/2 + 200, -height/4 - 200], rot: '-120deg', size: 20, opacity: 0.3 },
  ];

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

      {/* Globe at top */}
      <View style={styles.globeContainer}>
        <Ionicons name="earth" size={180} color={`${colors.primary}15`} />
      </View>

      <View style={styles.centerAnchor}>

        {/* Animated Expanding Rings */}
        {renderRing(ring1)}
        {renderRing(ring2)}
        {renderRing(ring3)}

        {/* Center Pulsing Logo */}
        <Animated.View style={[styles.mainLogoWrapper, { transform: [{ scale: logoScale }] }]}>
           <Image source={require('../../../assets/images/TravelGenie.png')} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>

      </View>

      {/* Flying Planes */}
      {planesData.map((p) => (
        <Animated.View key={p.id} style={[
          styles.flyingPlane, 
          { 
            opacity: p.opacity,
            transform: [
              { translateX: planesAnim[p.id].interpolate({ inputRange: [0, 1], outputRange: p.x }) }, 
              { translateY: planesAnim[p.id].interpolate({ inputRange: [0, 1], outputRange: p.y }) }, 
              { rotate: p.rot }
            ] 
          }
        ]}>
          <Ionicons name="airplane" size={p.size} color={colors.primary} />
        </Animated.View>
      ))}

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
  globeContainer: {
    position: 'absolute',
    top: 40,
    right: -40,
    zIndex: 1,
  },
  flyingPlane: {
    position: 'absolute',
    zIndex: 20,
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
