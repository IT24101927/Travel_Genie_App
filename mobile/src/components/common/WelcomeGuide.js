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
    description: "Your ultimate companion for exploring the wonders of Sri Lanka. Let's get you started with a quick tour!",
    icon: "sparkles",
    image: require('../../../assets/onboarding/welcome_hero.png'),
    color: colors.primary
  },
  {
    title: "Plan Your Perfect Trip",
    description: "Use our multi-step planner to pick a district, select must-visit places, find the best hotels, and set your budget—all in one flow.",
    icon: "trail-sign",
    image: require('../../../assets/onboarding/planner_demo.png'),
    color: "#0E7C5F"
  },
  {
    title: "Smart Expense Tracking",
    description: "Keep your budget on track with live market price benchmarks. Compare your spending with local trends and travel smarter.",
    icon: "wallet",
    image: require('../../../assets/onboarding/expense_demo.png'),
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
            <Image source={step.image} style={styles.image} resizeMode="cover" />
            
            <View style={styles.textContainer}>
              <View style={[styles.iconBox, { backgroundColor: step.color + '15' }]}>
                <Ionicons name={step.icon} size={28} color={step.color} />
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
                    i === currentStep && { backgroundColor: step.color, width: 24 }
                  ]} 
                />
              ))}
            </View>

            <Pressable onPress={handleNext} style={styles.nextBtn}>
              <LinearGradient
                colors={[step.color, step.color + 'CC']}
                style={styles.nextBtnGrad}
              >
                <Text style={styles.nextBtnText}>
                  {currentStep === STEPS.length - 1 ? "Let's Go!" : "Next"}
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  content: {
    width: '100%'
  },
  image: {
    width: '100%',
    height: height * 0.35,
  },
  textContainer: {
    padding: 30,
    alignItems: 'center',
    textAlign: 'center'
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10
  },
  footer: {
    padding: 30,
    paddingTop: 0,
    alignItems: 'center'
  },
  pagination: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 25
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border
  },
  nextBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 15
  },
  nextBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8
  },
  nextBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900'
  },
  skipBtn: {
    paddingVertical: 5
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700'
  }
});

export default WelcomeGuide;
