import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { forgotPasswordResetApi } from '../../api/authApi';
import { isRequired } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/apiError';

const ResetPasswordScreen = ({ navigation, route }) => {
  const email = route?.params?.email || '';
  const resetToken = route?.params?.resetToken || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onResetPassword = async () => {
    if (!isRequired(email) || !isRequired(resetToken)) {
      setError('Reset session expired. Please request and verify a new reset code.');
      return;
    }

    if (!isRequired(password) || password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await forgotPasswordResetApi({
        email,
        resetToken,
        newPassword: password
      });

      Alert.alert('Password Updated', 'Your password has been changed successfully. You can now log in with your new password.', [
        {
          text: 'Sign In',
          onPress: () => navigation.navigate('Login')
        }
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Icon/Illustration Area */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={40} color={colors.primary} />
            </View>
          </View>

          {/* Text Area */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from previous used passwords.
            </Text>
          </View>

          {/* Input Area */}
          <View style={styles.formContainer}>
            <AppInput
              leftIcon="lock-closed-outline"
              label="New Password"
              value={password}
              secureTextEntry
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              placeholder="At least 6 characters"
            />

            <AppInput
              leftIcon="lock-closed-outline"
              label="Confirm New Password"
              value={confirmPassword}
              secureTextEntry
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              placeholder="Re-enter new password"
            />

            <ErrorText message={error} />

            <View style={styles.buttonWrap}>
              <AppButton
                title={loading ? 'Saving...' : 'Reset Password'}
                onPress={onResetPassword}
                disabled={loading || password.length < 6 || confirmPassword.length < 6}
                allowPressWhenKeyboardOpen
              />
            </View>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
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
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  buttonWrap: {
    marginTop: 24,
  }
});

export default ResetPasswordScreen;
