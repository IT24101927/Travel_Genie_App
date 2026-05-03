import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';
import { isEmail, isRequired, isStrongPassword } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/apiError';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!isRequired(form.fullName)) {
      setError('Full name is required.');
      return;
    }

    if (!isEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
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
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start planning smart trips</Text>
        </View>

        <View style={styles.formContainer}>
          <AppInput
            label="Full Name"
            value={form.fullName}
            onChangeText={(text) => setForm((prev) => ({ ...prev, fullName: text }))}
            placeholder="John Doe"
          />
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
            <AppButton title={loading ? 'Creating Account...' : 'Register'} onPress={onSubmit} disabled={loading} />
          </View>

          <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
            <Text style={styles.linkText}>Already joined? <Text style={styles.linkHighlight}>Sign In</Text></Text>
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
    padding: 24,
    justifyContent: 'center'
  },
  header: {
    marginBottom: 40,
    marginTop: Platform.OS === 'ios' ? 40 : 20
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
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

export default RegisterScreen;
