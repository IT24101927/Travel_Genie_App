import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { changePasswordApi } from '../../api/userApi';
import { validatePassword } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/apiError';

const ChangePasswordScreen = ({ navigation }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccess(false);
  };

  const onSubmit = async () => {
    if (!form.currentPassword) { setError('Current password is required.'); return; }

    const passCheck = validatePassword(form.newPassword);
    if (!passCheck.valid) { setError(passCheck.message); return; }

    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match.'); return; }

    try {
      setLoading(true);
      setError('');
      await changePasswordApi({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to change password'));
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
          <Text style={styles.title}>Change Password</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={36} color={colors.primary} />
          </View>
          <Text style={styles.subtitle}>Enter your current password then choose a new one.</Text>

          <AppInput
            label="Current Password"
            leftIcon="lock-closed-outline"
            value={form.currentPassword}
            onChangeText={(t) => set('currentPassword', t)}
            secureTextEntry
            placeholder="Your current password"
          />

          <AppInput
            label="New Password"
            leftIcon="lock-open-outline"
            value={form.newPassword}
            onChangeText={(t) => set('newPassword', t)}
            secureTextEntry
            placeholder="Min. 8 chars, upper, lower, number, symbol"
            helperText="Must include uppercase, lowercase, number and symbol"
          />

          <AppInput
            label="Confirm New Password"
            leftIcon="lock-open-outline"
            value={form.confirmPassword}
            onChangeText={(t) => set('confirmPassword', t)}
            secureTextEntry
            placeholder="Repeat new password"
          />

          {success && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.successText}>Password changed successfully!</Text>
            </View>
          )}

          <ErrorText message={error} />

          <View style={styles.btnWrap}>
            <AppButton title={loading ? 'Changing...' : 'Change Password'} onPress={onSubmit} disabled={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  content: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EAF4F1', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#DDE6E1'
  },
  subtitle: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 28 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EAF7EF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#C3E6CB', marginBottom: 12
  },
  successText: { color: colors.success, fontWeight: '600', fontSize: 14 },
  btnWrap: { marginTop: 8 }
});

export default ChangePasswordScreen;
