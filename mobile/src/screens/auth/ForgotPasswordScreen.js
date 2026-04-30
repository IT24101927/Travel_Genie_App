import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { forgotPasswordRequestApi } from '../../api/authApi';
import { validateEmail } from '../../utils/validators';
import { getApiErrorMessage } from '../../utils/apiError';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const onRequestReset = async () => {
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setEmailError(emailCheck.message);
      setSuccess('');
      return;
    }

    if (cooldown > 0 || loading) {
      return;
    }

    try {
      setLoading(true);
      setEmailError('');
      setApiError('');
      setSuccess('');
      await forgotPasswordRequestApi({ email: email.trim() });
      setSuccess('If that email exists, a reset code has been sent.');
      setCooldown(60);
      navigation.navigate('ForgotPasswordVerifyCode', { email: email.trim().toLowerCase() });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to request password reset');
      setApiError(message);
      if (typeof message === 'string') {
        const match = message.match(/(\d+)s/);
        if (match?.[1]) {
          setCooldown(Number(match[1]));
        }
      }
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
              <Ionicons name="lock-closed-outline" size={40} color={colors.primary} />
            </View>
          </View>

          {/* Text Area */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Don't worry! It happens. Please enter the email address linked to your account.
            </Text>
          </View>

          {/* Input Area */}
          <View style={styles.formContainer}>
            <AppInput
              leftIcon="mail-outline"
              label="Email Address"
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              error={emailError}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
                setApiError('');
                setSuccess('');
              }}
              placeholder="Enter your email"
            />

            {success ? <Text style={styles.successText}>{success}</Text> : null}
            <ErrorText message={apiError} />

            <View style={styles.buttonWrap}>
              <AppButton
                title={loading ? 'Sending...' : cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Send Reset Code'}
                onPress={onRequestReset}
                disabled={loading || cooldown > 0}
                allowPressWhenKeyboardOpen
              />
            </View>
          </View>

          {/* Bottom Link */}
          <View style={styles.bottomContainer}>
            <Text style={styles.bottomText}>Remember password? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log in</Text>
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
    backgroundColor: colors.background,
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
    lineHeight: 22,
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
  loginLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
