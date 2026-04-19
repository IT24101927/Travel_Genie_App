import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { forgotPasswordRequestApi, forgotPasswordVerifyCodeApi } from '../../api/authApi';
import { isEmail } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/apiError';

const ForgotPasswordVerifyCodeScreen = ({ navigation, route }) => {
  const email = route?.params?.email || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const onVerifyCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.replace(/\D/g, '');

    if (!isEmail(normalizedEmail)) {
      setError('Invalid email address passed.');
      return;
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      setError('Please enter the 6-digit reset code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await forgotPasswordVerifyCodeApi({
        email: normalizedEmail,
        code: normalizedCode
      });

      navigation.navigate('ResetPassword', {
        email: normalizedEmail,
        resetToken: response?.data?.resetToken
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to verify reset code'));
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isEmail(normalizedEmail)) {
      setError('Invalid email address passed.');
      return;
    }

    try {
      setResendLoading(true);
      setError('');
      setSuccess('');
      await forgotPasswordRequestApi({ email: normalizedEmail });
      setSuccess('A new reset code has been sent to your email.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend reset code'));
    } finally {
      setResendLoading(false);
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
              <Ionicons name="mail-unread-outline" size={40} color={colors.primary} />
            </View>
          </View>

          {/* Text Area */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit reset code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* Input Area */}
          <View style={styles.formContainer}>
            <AppInput
              leftIcon="keypad-outline"
              label="Reset Code"
              value={code}
              keyboardType="number-pad"
              onChangeText={(text) => {
                setCode(text.replace(/\D/g, '').slice(0, 6));
                setError('');
                setSuccess('');
              }}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />

            {success ? <Text style={styles.successText}>{success}</Text> : null}
            <ErrorText message={error} />

            <View style={styles.buttonWrap}>
              <AppButton
                title={loading ? 'Verifying...' : 'Verify Code'}
                onPress={onVerifyCode}
                disabled={loading || resendLoading || code.length < 6}
                allowPressWhenKeyboardOpen
              />
            </View>
          </View>

          {/* Bottom Link */}
          <View style={styles.bottomContainer}>
            <Text style={styles.bottomText}>Didn't receive the code? </Text>
            <Pressable onPress={onResendCode} disabled={loading || resendLoading}>
              <Text style={[styles.resendLink, resendLoading && styles.resendLinkDisabled]}>
                {resendLoading ? 'Sending...' : 'Click to resend'}
              </Text>
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
  emailText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  formContainer: {
    marginBottom: 24,
  },
  successText: {
    marginTop: 4,
    color: colors.success,
    fontWeight: '600',
    fontSize: 13,
  },
  buttonWrap: {
    marginTop: 24,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 40,
  },
  bottomText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  resendLinkDisabled: {
    opacity: 0.6,
  }
});

export default ForgotPasswordVerifyCodeScreen;
