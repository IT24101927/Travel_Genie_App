import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import GenderPicker from '../../components/common/GenderPicker';
import colors from '../../constants/colors';
import { adminCreateUserApi, adminUpdateUserApi } from '../../api/adminApi';
import { getApiErrorMessage } from '../../utils/apiError';

const TRAVEL_STYLES = [
  { id: 'Adventure', label: 'ADVENTURE', icon: '⛰️' },
  { id: 'Relax',     label: 'RELAX',     icon: '🏖️' },
  { id: 'Culture',   label: 'CULTURE',   icon: '🏛️' },
  { id: 'Luxury',    label: 'LUXURY',    icon: '💎' },
  { id: 'Budget',    label: 'BUDGET',    icon: '🎒' },
  { id: 'Family',    label: 'FAMILY',    icon: '👨‍👩‍👧‍👦' },
  { id: 'Backpacker',label: 'BACKPACKER',icon: '🗺️' }
];

const STYLE_INTERESTS = {
  Adventure:   ['Mountains', 'Nature', 'Wildlife', 'Adventure'],
  Relax:       ['Beaches', 'Relax', 'Nature', 'Photography'],
  Culture:     ['Historical', 'Cultural', 'Religious', 'Art'],
  Luxury:      ['Beaches', 'Food', 'Shopping', 'Photography'],
  Budget:      ['Historical', 'Nature', 'Adventure', 'Food'],
  Family:      ['Beaches', 'Nature', 'Wildlife', 'Food'],
  Backpacker:  ['Mountains', 'Nature', 'Historical', 'Adventure']
};

const INTERESTS = [
  'Beaches', 'Mountains', 'Historical', 'Cultural',
  'Adventure', 'Nature', 'Wildlife', 'Religious',
  'Relax', 'Food', 'Nightlife', 'Photography', 'Art', 'Shopping'
];

const WEATHER = [
  { id: 'Sunny', label: 'SUNNY', icon: '☀️' },
  { id: 'Mild',  label: 'MILD',  icon: '⛅' },
  { id: 'Rainy', label: 'RAINY', icon: '🌧️' },
  { id: 'Cold',  label: 'COLD',  icon: '❄️' },
  { id: 'Any',   label: 'ANY',   icon: '🌀' }
];

const CURRENCIES = ['LKR', 'USD', 'EUR'];

const AdminUserFormScreen = ({ route, navigation }) => {
  const existing = route.params?.user || null;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    fullName:          existing?.fullName || '',
    email:             existing?.email || '',
    phone:             existing?.phone || '',
    dob:               existing?.dob || '',
    nic:               existing?.nic || '',
    gender:            existing?.gender || 'MALE',
    password:          '',
    confirmPassword:   '',
    travelStyle:       existing?.travelStyle || 'Culture',
    interests:         Array.isArray(existing?.interests) ? existing.interests : [],
    currency:          existing?.preferences?.currency || 'LKR',
    preferred_weather: existing?.preferences?.preferred_weather || 'Any',
    role:              existing?.role || 'user',
    isActive:          existing?.isActive !== false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleTravelStyleChange = (newStyle) => {
    setForm((prev) => {
      const prevDefaults = STYLE_INTERESTS[prev.travelStyle] || [];
      const withoutOldDefaults = prev.interests.filter((i) => !prevDefaults.includes(i));
      const merged = [...new Set([...withoutOldDefaults, ...(STYLE_INTERESTS[newStyle] || [])])];
      return { ...prev, travelStyle: newStyle, interests: merged };
    });
    setError('');
  };

  const validate = () => {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (form.fullName.trim().length < 2) return 'Name must be at least 2 characters.';
    if (form.phone && !/^0\d{9}$/.test(form.phone.trim())) return 'Phone must be 10 digits starting with 0.';
    if (!isEdit) {
      if (!form.email.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
      if (!form.password) return 'Password is required.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    return null;
  };

  const onSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const shared = {
        fullName:          form.fullName.trim(),
        phone:             form.phone.trim(),
        dob:               form.dob.trim(),
        nic:               form.nic.trim(),
        gender:            form.gender,
        travelStyle:       form.travelStyle,
        interests:         form.interests,
        currency:          form.currency,
        preferred_weather: form.preferred_weather,
        role:              form.role,
        isActive:          form.isActive
      };

      if (isEdit) {
        await adminUpdateUserApi(existing._id, shared);
      } else {
        await adminCreateUserApi({
          ...shared,
          email:    form.email.trim().toLowerCase(),
          password: form.password
        });
      }

      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Operation failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit User' : 'Create User'}</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Basic Info ── */}
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <AppInput
            label="Full Name"
            leftIcon="person-outline"
            value={form.fullName}
            onChangeText={(t) => set('fullName', t)}
            placeholder="Jane Smith"
          />

          <AppInput
            label="Email Address"
            leftIcon="mail-outline"
            value={form.email}
            onChangeText={(t) => set('email', t)}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="jane@example.com"
            editable={!isEdit}
            helperText={isEdit ? 'Email cannot be changed.' : undefined}
          />

          <AppInput
            label="Phone Number"
            leftIcon="call-outline"
            value={form.phone}
            onChangeText={(t) => set('phone', t)}
            keyboardType="phone-pad"
            placeholder="07XXXXXXXX"
          />

          <AppInput
            label="Date of Birth"
            leftIcon="calendar-outline"
            value={form.dob}
            onChangeText={(t) => set('dob', t)}
            placeholder="mm/dd/yyyy"
          />

          <AppInput
            label="NIC Number"
            leftIcon="card-outline"
            value={form.nic}
            onChangeText={(t) => set('nic', t)}
            placeholder="200012345678 or 991234567V"
          />

          <GenderPicker
            label="Gender"
            value={form.gender}
            onChange={(g) => set('gender', g)}
          />

          {!isEdit && (
            <>
              <AppInput
                label="Password"
                leftIcon="lock-closed-outline"
                value={form.password}
                onChangeText={(t) => set('password', t)}
                secureTextEntry
                placeholder="Min. 8 characters"
              />
              <AppInput
                label="Confirm Password"
                leftIcon="lock-closed-outline"
                value={form.confirmPassword}
                onChangeText={(t) => set('confirmPassword', t)}
                secureTextEntry
                placeholder="Repeat password"
              />
            </>
          )}

          {/* ── Travel Style ── */}
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

          {/* ── Interests ── */}
          <View style={styles.section}>
            <Text style={styles.label}>INTERESTS <Text style={styles.sublabel}>(pick any)</Text></Text>
            <View style={styles.pillContainer}>
              {INTERESTS.map((interest) => {
                const selected = form.interests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    style={[styles.pill, selected && styles.pillSelected]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{interest}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Weather ── */}
          <View style={styles.section}>
            <Text style={styles.label}>PREFERRED WEATHER</Text>
            <View style={styles.grid}>
              {WEATHER.map((w) => (
                <Pressable
                  key={w.id}
                  style={[styles.gridItem, form.preferred_weather === w.id && styles.gridItemSelected]}
                  onPress={() => set('preferred_weather', w.id)}
                >
                  <Text style={styles.gridItemIcon}>{w.icon}</Text>
                  <Text style={[styles.gridItemLabel, form.preferred_weather === w.id && styles.gridItemLabelSelected]}>
                    {w.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Currency ── */}
          <View style={styles.section}>
            <Text style={styles.label}>CURRENCY</Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((curr) => (
                <Pressable
                  key={curr}
                  style={[styles.currencyPill, form.currency === curr && styles.pillSelected]}
                  onPress={() => set('currency', curr)}
                >
                  <Text style={[styles.pillText, form.currency === curr && styles.pillTextSelected]}>{curr}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Admin Controls ── */}
          <Text style={styles.sectionTitle}>Admin Controls</Text>

          <Text style={styles.label}>ROLE</Text>
          <View style={styles.roleRow}>
            {['user', 'admin'].map((r) => (
              <Pressable
                key={r}
                onPress={() => set('role', r)}
                style={[styles.roleChip, form.role === r && styles.roleChipActive]}
              >
                <Ionicons
                  name={r === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
                  size={16}
                  color={form.role === r ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.roleChipText, form.role === r && styles.roleChipTextActive]}>
                  {r === 'admin' ? 'Admin' : 'User'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Active Account</Text>
              <Text style={styles.switchHint}>Inactive users cannot sign in</Text>
            </View>
            <Switch
              value={form.isActive}
              onValueChange={(v) => set('isActive', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <ErrorText message={error} />

          <View style={styles.btnContainer}>
            <AppButton
              title={loading
                ? (isEdit ? 'Saving...' : 'Creating...')
                : (isEdit ? 'Save Changes' : 'Create User')}
              onPress={onSubmit}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  content: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 8 },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: colors.textPrimary,
    marginTop: 10, marginBottom: 14
  },
  section: { marginBottom: 24, marginTop: 6 },
  label: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    marginBottom: 12, letterSpacing: 1
  },
  sublabel: { color: colors.textMuted, fontWeight: 'normal', textTransform: 'none', letterSpacing: 0 },

  // Travel style / weather grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    width: '30.5%',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 8,
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02, shadowRadius: 2
  },
  gridItemSelected: { borderColor: colors.primary, backgroundColor: '#F0F7F4' },
  gridItemIcon: { fontSize: 26 },
  gridItemLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  gridItemLabelSelected: { color: colors.primary, fontWeight: '800' },

  // Interests pills
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border
  },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pillTextSelected: { color: colors.white, fontWeight: '700' },

  // Currency
  currencyRow: { flexDirection: 'row', gap: 10 },
  currencyPill: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14
  },

  // Admin controls
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  roleChipTextActive: { color: colors.white },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 20
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  switchHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  btnContainer: { marginTop: 4 }
});

export default AdminUserFormScreen;
