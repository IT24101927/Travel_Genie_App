import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';
import { validateEmail, isRequired } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/apiError';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    setApiError('');
  };

  const onSubmit = async () => {
    const next = {};

    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) next.email = emailCheck.message;

    if (!isRequired(form.password)) next.password = 'Password is required.';

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      await login(form.email.trim(), form.password);
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Login failed'));
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
              <Ionicons name="airplane" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>TravelGenie</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          <View style={styles.formContainer}>
            <AppInput
              leftIcon="mail-outline"
              label="Email Address"
              value={form.email}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
              onChangeText={(text) => setField('email', text)}
              placeholder="john@example.com"
            />
            <AppInput
              leftIcon="lock-closed-outline"
              label="Password"
              value={form.password}
              secureTextEntry
              error={errors.password}
              onChangeText={(text) => setField('password', text)}
              placeholder="••••••••"
            />

            <ErrorText message={apiError} />

            <View style={styles.buttonContainer}>
              <AppButton title={loading ? 'Authenticating...' : 'Sign In'} onPress={onSubmit} disabled={loading} />
            </View>

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkContainer}>
              <Text style={styles.linkText}>New explorer? <Text style={styles.linkHighlight}>Create an account</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
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
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
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
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 8
  },
  formContainer: {
    width: '100%'
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16
  },
  forgotContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  forgotText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14
  },
  linkContainer: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 'auto',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 15
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: '700'
  }
});

export default LoginScreen;
