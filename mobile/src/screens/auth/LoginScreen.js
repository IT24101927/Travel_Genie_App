import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';
import { isEmail, isRequired } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/apiError';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!isEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isRequired(form.password)) {
      setError('Password is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="airplane" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>TravelGenie</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        <View style={styles.formContainer}>
          <AppInput
            label="Email Address"
            value={form.email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
            placeholder="john@example.com"
          />
          <AppInput
            label="Password"
            value={form.password}
            secureTextEntry
            onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
            placeholder="••••••••"
          />

          <ErrorText message={error} />

          <View style={styles.buttonContainer}>
            <AppButton title={loading ? 'Authenticating...' : 'Sign In'} onPress={onSubmit} disabled={loading} />
          </View>

          <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkContainer}>
            <Text style={styles.linkText}>New explorer? <Text style={styles.linkHighlight}>Create an account</Text></Text>
          </Pressable>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border
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
    marginTop: 10,
    marginBottom: 24
  },
  linkContainer: {
    paddingVertical: 10,
    alignItems: 'center'
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
