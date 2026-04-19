import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';
import { validateEmail, isRequired } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/apiError';

const AdminLoginScreen = ({ navigation }) => {
  const { adminLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) {
      setError(emailCheck.message);
      return;
    }

    if (!isRequired(form.password)) {
      setError('Password is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await adminLogin(form.email.trim(), form.password);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Admin login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Admin Portal</Text>
            <Text style={styles.subtitle}>Sign in to manage TravelGenie</Text>
          </View>

          <View style={styles.formContainer}>
            <AppInput
              leftIcon="mail-outline"
              label="Admin Email"
              value={form.email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, email: text }));
                setError('');
              }}
              placeholder="admin@travelgenie.com"
            />
            <AppInput
              leftIcon="lock-closed-outline"
              label="Password"
              value={form.password}
              secureTextEntry
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, password: text }));
                setError('');
              }}
              placeholder="••••••••"
            />

            <ErrorText message={error} />

            <View style={styles.buttonContainer}>
              <AppButton title={loading ? 'Authenticating...' : 'Sign In as Admin'} onPress={onSubmit} disabled={loading} />
            </View>

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
              <Text style={styles.linkText}>Not an admin? <Text style={styles.linkHighlight}>User sign in</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 40
  },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDE6E1'
  },
  title: { fontSize: 30, fontWeight: '900', color: colors.textPrimary, letterSpacing: 1 },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginTop: 8 },
  formContainer: { width: '100%' },
  buttonContainer: { marginTop: 16, marginBottom: 16 },
  linkContainer: { paddingVertical: 15, alignItems: 'center', marginTop: 'auto' },
  linkText: { color: colors.textSecondary, fontSize: 15 },
  linkHighlight: { color: colors.primary, fontWeight: '700' }
});

export default AdminLoginScreen;
