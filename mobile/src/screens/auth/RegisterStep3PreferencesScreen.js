import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import colors from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const TRAVEL_STYLES = [
  { id: 'Adventure', label: 'ADVENTURE', icon: '⛰️' },
  { id: 'Relax', label: 'RELAX', icon: '🏖️' },
  { id: 'Culture', label: 'CULTURE', icon: '🏛️' },
  { id: 'Luxury', label: 'LUXURY', icon: '💎' },
  { id: 'Budget', label: 'BUDGET', icon: '🎒' },
  { id: 'Family', label: 'FAMILY', icon: '👨‍👩‍👧‍👦' },
  { id: 'Backpacker', label: 'BACKPACKER', icon: '🗺️' }
];

const STYLE_INTERESTS = {
  Adventure: ['Mountains', 'Nature', 'Wildlife', 'Adventure'],
  Relax: ['Beaches', 'Relax', 'Nature', 'Photography'],
  Culture: ['Historical', 'Cultural', 'Religious', 'Art'],
  Luxury: ['Beaches', 'Food', 'Shopping', 'Photography'],
  Budget: ['Historical', 'Nature', 'Adventure', 'Food'],
  Family: ['Beaches', 'Nature', 'Wildlife', 'Food'],
  Backpacker: ['Mountains', 'Nature', 'Historical', 'Adventure']
};

const INTERESTS = [
  'Beaches', 'Mountains', 'Historical', 'Cultural',
  'Adventure', 'Nature', 'Wildlife', 'Religious',
  'Relax', 'Food', 'Nightlife', 'Photography', 'Art', 'Shopping'
];

const WEATHER = [
  { id: 'Sunny', label: 'SUNNY', icon: '☀️' },
  { id: 'Mild', label: 'MILD', icon: '⛅' },
  { id: 'Rainy', label: 'RAINY', icon: '🌧️' },
  { id: 'Cold', label: 'COLD', icon: '❄️' },
  { id: 'Any', label: 'ANY / NO PREF', icon: '🌀' }
];

const CURRENCIES = ['LKR (Rs)', 'USD ($)', 'EUR (€)'];

const RegisterStep3PreferencesScreen = ({ navigation, route }) => {
  const { userData } = route.params || {};
  const verificationToken = route.params?.verificationToken;
  const { register } = useAuth();
  
  const [preferences, setPreferences] = useState({
    style: 'Culture',
    interests: STYLE_INTERESTS.Culture,
    weather: 'Any',
    currency: 'LKR (Rs)'
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleTravelStyleChange = (newStyle) => {
    setPreferences((prev) => {
      const prevDefaults = STYLE_INTERESTS[prev.style] || [];
      const withoutOldDefaults = prev.interests.filter((interest) => !prevDefaults.includes(interest));
      const merged = [...new Set([...withoutOldDefaults, ...(STYLE_INTERESTS[newStyle] || [])])];

      return {
        ...prev,
        style: newStyle,
        interests: merged
      };
    });
  };

  const onCreateAccount = async () => {
    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions.');
      return;
    }

    if (!verificationToken) {
      setError('Email verification is required. Please go back and verify your code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Call register API via context
      // Note: we're sending standard fields (fullName, email, password)
      // plus the extra fields collected. We may need to update backend to save all of them.
      await register({
        fullName: userData?.fullName?.trim() || '',
        email: userData?.email?.trim() || '',
        password: userData?.password || '',
        verificationToken,
        travelStyle: preferences.style,
        interests: preferences.interests,
        currency: preferences.currency.split(' ')[0],
        preferred_weather: preferences.weather,
        phone: userData?.phone,
        dob: userData?.dob,
        nic: userData?.nic,
        gender: userData?.gender,
        preferences
      });
      // AuthContext will automatically redirect to MainApp flow on successful registration
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
            contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: 8, paddingBottom: Math.max(insets.bottom + 100, 110) }
            ]} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.topIconBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.stepPill}>
              <View style={[styles.stepSegment, styles.stepSegmentActive]} />
              <View style={[styles.stepSegment, styles.stepSegmentActive]} />
              <View style={[styles.stepSegment, styles.stepSegmentActive]} />
            </View>

            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Your travel preferences</Text>
            <Text style={styles.subtitle}>Personalize your recommendations in one minute.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>TRAVEL STYLE</Text>
            <View style={styles.grid}>
              {TRAVEL_STYLES.map((ts) => (
                <Pressable
                  key={ts.id}
                  style={[styles.gridItem, preferences.style === ts.id && styles.gridItemSelected]}
                  onPress={() => handleTravelStyleChange(ts.id)}
                >
                  <Text style={styles.gridItemIcon}>{ts.icon}</Text>
                  <Text style={[styles.gridItemLabel, preferences.style === ts.id && styles.gridItemLabelSelected]}>{ts.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>INTERESTS <Text style={styles.sublabel}>(pick any)</Text></Text>
            <View style={styles.pillContainer}>
              {INTERESTS.map((interest) => {
                const isSelected = preferences.interests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{interest}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>PREFERRED WEATHER</Text>
            <View style={styles.grid}>
              {WEATHER.map((w) => (
                <Pressable
                  key={w.id}
                  style={[styles.gridItem, preferences.weather === w.id && styles.gridItemSelected]}
                  onPress={() => setPreferences(prev => ({ ...prev, weather: w.id }))}
                >
                  <Text style={styles.gridItemIcon}>{w.icon}</Text>
                  <Text style={[styles.gridItemLabel, preferences.weather === w.id && styles.gridItemLabelSelected]}>{w.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>CURRENCY</Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((curr) => (
                <Pressable
                  key={curr}
                  style={[styles.currencyPill, preferences.currency === curr && styles.pillSelected]}
                  onPress={() => setPreferences(prev => ({ ...prev, currency: curr }))}
                >
                  <Text style={[styles.pillText, preferences.currency === curr && styles.pillTextSelected]}>{curr}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable 
            style={styles.termsWrapper} 
            onPress={() => setAgreeTerms(!agreeTerms)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
                name={agreeTerms ? "checkbox" : "square-outline"} 
                size={22} 
                color={agreeTerms ? colors.primary : colors.textMuted} 
            />
            <Text style={styles.termsText}>
              I agree to the <Text style={{fontWeight: '700', color: colors.primary}}>Terms & Conditions</Text>
            </Text>
          </Pressable>

        </ScrollView>
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}> 
          <ErrorText message={error} />
          <AppButton 
            title={loading ? 'Creating Account...' : 'Complete Setup'} 
            onPress={onCreateAccount} 
            disabled={loading || !agreeTerms}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 10,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 32,
  },
  stepSegment: {
    width: 15,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
    marginHorizontal: 3
  },
  stepSegmentActive: {
    backgroundColor: colors.primary
  },
  signInText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700'
  },
  header: {
    marginBottom: 32
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.4
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22
  },
  section: {
    marginBottom: 28
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1
  },
  sublabel: {
    color: colors.textMuted,
    fontWeight: 'normal',
    textTransform: 'none',
    letterSpacing: 0
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  gridItem: {
    width: '30.5%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  gridItemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F7F4'
  },
  gridItemIcon: {
    fontSize: 26
  },
  gridItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center'
  },
  gridItemLabelSelected: {
    color: colors.primary,
    fontWeight: '800'
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  pillTextSelected: {
    color: colors.white,
    fontWeight: '700'
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10
  },
  currencyPill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14
  },
  termsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  termsText: {
    marginLeft: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface
  }
});

export default RegisterStep3PreferencesScreen;