import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Text, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { updateMyProfileApi } from '../../api/userApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { isRequired, validateName, validatePhone } from '../../utils/validators';

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
  { id: 'Any', label: 'ANY', icon: '🌀' }
];

const CURRENCIES = ['LKR', 'USD', 'EUR'];

const EditProfileScreen = ({ navigation, route }) => {
  const profile = route.params?.profile || {};
  const initialInterests = Array.isArray(profile?.interests) ? profile.interests : [];
  const [form, setForm] = useState({
    fullName: profile?.fullName || '',
    phone: profile?.phone || '',
    travelStyle: profile?.travelStyle || 'Culture',
    interests: initialInterests,
    currency: profile?.preferences?.currency || 'LKR',
    preferred_weather: profile?.preferences?.preferred_weather || 'Any',
    photo: profile?.profileImage || null
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleInterest = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleTravelStyleChange = (newStyle) => {
    setForm((prev) => {
      const prevDefaults = STYLE_INTERESTS[prev.travelStyle] || [];
      const withoutOldDefaults = prev.interests.filter((interest) => !prevDefaults.includes(interest));
      const merged = [...new Set([...withoutOldDefaults, ...(STYLE_INTERESTS[newStyle] || [])])];

      return {
        ...prev,
        travelStyle: newStyle,
        interests: merged
      };
    });
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      setError('Please allow gallery access to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setError('');
      setForm(prev => ({ ...prev, photo: result.assets[0].uri }));
    }
  };

  const onSave = async () => {
    const nameCheck = validateName(form.fullName);
    if (!nameCheck.valid) {
      setError(nameCheck.message);
      return;
    }

    if (form.phone) {
       const phoneCheck = validatePhone(form.phone);
       if (!phoneCheck.valid) {
          setError(phoneCheck.message);
          return;
       }
    }

    try {
      setSaving(true);
      setError('');
      const parsedInterests = form.interests.filter(Boolean);

      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        travelStyle: form.travelStyle,
        currency: form.currency.trim(),
        preferred_weather: form.preferred_weather.trim(),
        interests: parsedInterests,
      };

      if (form.photo && !form.photo.startsWith('http')) {
        const localUri = form.photo;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        payload.profileImage = { uri: localUri, name: filename, type };
      }

      await updateMyProfileApi(payload);
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Update Profile</Text>
          <Text style={styles.subtitle}>Edit your personal information below.</Text>
        </View>

        <Pressable style={styles.photoCard} onPress={handlePickImage}>
          <View style={styles.photoUploadCircle}>
            {form.photo ? (
              <Image source={{ uri: form.photo }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-outline" size={34} color={colors.primary} />
            )}
            <View style={styles.photoUploadBadge}>
              <Ionicons name="camera" size={11} color={colors.white} />
            </View>
          </View>
          <View style={styles.photoTextWrap}>
            <Text style={styles.photoTitle}>Profile photo</Text>
            <Text style={styles.photoSubtitle}>Tap to change your picture</Text>
          </View>
        </Pressable>

        <AppInput
          label="Full Name"
          value={form.fullName}
          onChangeText={(text) => setForm((p) => ({ ...p, fullName: text }))}
          placeholder="Jane Doe"
        />

        <AppInput
          label="Phone"
          value={form.phone}
          onChangeText={(text) => setForm((p) => ({ ...p, phone: text }))}
          placeholder="+94xxxxxxxxx"
        />

        <View style={styles.section}>
          <Text style={styles.label}>TRAVEL STYLE</Text>
          <View style={styles.grid}>
            {TRAVEL_STYLES.map((ts) => (
              <Pressable
                key={ts.id}
                style={[styles.gridItem, form.travelStyle === ts.id && styles.gridItemSelected]}
                onPress={() => handleTravelStyleChange(ts.id)}
              >
                <Text style={styles.gridItemIcon}>{ts.icon}</Text>
                <Text style={[styles.gridItemLabel, form.travelStyle === ts.id && styles.gridItemLabelSelected]}>
                  {ts.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>INTERESTS <Text style={styles.sublabel}>(pick any)</Text></Text>
          <View style={styles.pillContainer}>
            {INTERESTS.map((interest) => {
              const isSelected = form.interests.includes(interest);
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
                style={[styles.gridItem, form.preferred_weather === w.id && styles.gridItemSelected]}
                onPress={() => setForm(p => ({ ...p, preferred_weather: w.id }))}
              >
                <Text style={styles.gridItemIcon}>{w.icon}</Text>
                <Text style={[styles.gridItemLabel, form.preferred_weather === w.id && styles.gridItemLabelSelected]}>
                  {w.label}
                </Text>
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
                style={[styles.currencyPill, form.currency === curr && styles.pillSelected]}
                onPress={() => setForm(p => ({ ...p, currency: curr }))}
              >
                <Text style={[styles.pillText, form.currency === curr && styles.pillTextSelected]}>{curr}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Email</Text>
          <Text style={styles.readOnlyText}>{profile?.email}</Text>
          <Text style={styles.hintText}>Email cannot be changed at this time.</Text>
        </View>

        <ErrorText message={error} />
        
        <View style={styles.btnWrapper}>
           <AppButton title={saving ? 'Saving...' : 'Save Changes'} onPress={onSave} disabled={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 24,
    paddingBottom: 40
  },
  header: {
    marginBottom: 32
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 8
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16
  },
  readOnlyField: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  readOnlyLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  readOnlyText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600'
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic'
  },
  btnWrapper: {
    marginTop: 24
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border
  },
  photoUploadCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30
  },
  photoUploadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface
  },
  photoTextWrap: {
    flex: 1
  },
  photoTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4
  },
  photoSubtitle: {
    color: colors.textSecondary,
    fontSize: 13
  },
  section: {
    marginBottom: 28,
    marginTop: 10
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
  }
});

export default EditProfileScreen;
