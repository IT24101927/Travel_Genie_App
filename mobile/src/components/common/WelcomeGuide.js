import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image, 
  Dimensions, 
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const GUIDE_STORAGE_KEY = 'HAS_SEEN_WELCOME_GUIDE_V1';

const STEPS = [
  {
    title: "Welcome to TravelGenie",
    description: "Your ultimate companion for exploring the wonders of Sri Lanka. Discover hidden gems with ease.",
    icon: "sparkles",
    image: require('../../../assets/onboarding/welcome_hero.jpg'),
    color: colors.primary
  },
  {
    title: "Plan Your Perfect Trip",
    description: "Use our multi-step planner to pick a district, select must-visit places, and find the best hotels.",
    icon: "trail-sign",
    image: require('../../../assets/onboarding/planner_demo.jpg'),
    color: "#0E7C5F"
  },
  {
    title: "Smart Expense Tracking",
    description: "Keep your budget on track with live market price benchmarks and travel smarter than ever.",
    icon: "wallet",
    image: require('../../../assets/onboarding/expense_demo.jpg'),
    color: "#4F46E5"
  }
];

const WelcomeGuide = ({ forceShow = false, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const checkSeen = async () => {
      const hasSeen = await AsyncStorage.getItem(GUIDE_STORAGE_KEY);
      if (!hasSeen || forceShow) {
        setVisible(true);
      }
    };
    checkSeen();
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem(GUIDE_STORAGE_KEY, 'true');
    setVisible(false);
    if (onComplete) onComplete();
  };

  if (!visible) return null;

  const step = STEPS[currentStep];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.imageContainer}>
              <Image source={step.image} style={styles.image} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,1)']}
                style={styles.imageGradient}
              />
            </View>
            
            <View style={styles.textContainer}>
              <View style={[styles.iconBox, { backgroundColor: step.color + '15' }]}>
                <Ionicons name={step.icon} size={32} color={step.color} />
              </View>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.pagination}>
              {STEPS.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    i === currentStep && { backgroundColor: step.color, width: 20 }
                  ]} 
                />
              ))}
            </View>

            <Pressable onPress={handleNext} style={styles.nextBtn}>
              <LinearGradient
                colors={[step.color, step.color + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGrad}
              >
                <Text style={styles.nextBtnText}>
                  {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </LinearGradient>
            </Pressable>
            
            <Pressable onPress={finish} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip Tour</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12
  },
  content: {
    width: '100%'
  },
  imageContainer: {
    width: '100%',
    height: height * 0.32,
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80
  },
  textContainer: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center'
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 5
  },
  footer: {
    padding: 30,
    paddingTop: 10,
    alignItems: 'center'
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border
  },
  nextBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  nextBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10
  },
  nextBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900'
  },
  skipBtn: {
    paddingVertical: 8
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});

export default WelcomeGuide;
