import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { sendRegisterCodeApi, verifyRegisterCodeApi } from '../../api/authApi';
import { getApiErrorMessage } from '../../utils/apiError';

const RegisterStep2VerifyScreen = ({ navigation, route }) => {
  const { userData } = route.params || {};
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef([]);
  const codeRef = useRef(['', '', '', '', '', '']);

  const handleChange = (text, index) => {
    const digitsOnly = text.replace(/\D/g, '');
    const newCode = [...codeRef.current];

    // Support typing a single digit and pasting multiple digits.
    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 6 - index).split('');
      chars.forEach((digit, offset) => {
        newCode[index + offset] = digit;
      });
      codeRef.current = newCode;
      setCode(newCode);

      const nextIndex = Math.min(index + chars.length, 5);
      if (nextIndex < 5) {
        inputs.current[nextIndex + 1]?.focus();
      } else {
        inputs.current[5]?.blur();
      }
      return;
    }

    newCode[index] = digitsOnly;
    codeRef.current = newCode;
    setCode(newCode);

    if (digitsOnly !== '' && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (error) setError('');
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && code[index] === '') {
      inputs.current[index - 1]?.focus();
    }
  };

  const startCooldown = useCallback(() => {
    setResendCooldown(60);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendCode = useCallback(async () => {
    if (!userData?.email) {
      setError('Missing email. Please go back and enter your details again.');
      return;
    }

    try {
      setSendingCode(true);
      setError('');
      await sendRegisterCodeApi({ email: userData.email });
      startCooldown();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send verification code'));
    } finally {
      setSendingCode(false);
    }
  }, [startCooldown, userData?.email]);

  useEffect(() => {
    sendCode();
  }, [sendCode]);

  const onVerify = async () => {
    if (!userData?.email) {
      setError('Registration session expired. Please go back and enter your details again.');
      return;
    }

    const fullCode = codeRef.current.join('');
    if (!/^\d{6}$/.test(fullCode)) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    // In a real app we would call verifyOtpApi
    try {
      setLoading(true);
      setError('');
      const verifyResponse = await verifyRegisterCodeApi({
        email: userData.email,
        code: fullCode
      });

      navigation.navigate('RegisterStep3', {
        userData,
        verificationToken: verifyResponse?.data?.verificationToken
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = () => {
    if (resendCooldown > 0 || sendingCode) {
      return;
    }

    sendCode();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.topRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.topIconBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.stepPill}>
              <View style={[styles.stepSegment, styles.stepSegmentActive]} />
              <View style={[styles.stepSegment, styles.stepSegmentActive]} />
              <View style={styles.stepSegment} />
            </View>

            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={{fontWeight: '700', color: colors.textPrimary}}>{userData?.email || 'your email'}</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>6-DIGIT VERIFICATION CODE</Text>
            <View style={styles.codeContainer}>
              {code.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => inputs.current[idx] = ref}
                  style={[styles.codeInput, digit ? styles.codeInputActive : null]}
                  keyboardType="number-pad"
                  showSoftInputOnFocus
                  value={digit}
                  onChangeText={(text) => handleChange(text, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  selectTextOnFocus
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                />
              ))}
            </View>

            <ErrorText message={error} />

            <Pressable style={styles.resendWrap} onPress={onResendCode} disabled={resendCooldown > 0}>
              <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextMuted]}>
                {sendingCode ? 'Sending code...' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
              </Text>
            </Pressable>

            <View style={styles.buttonContainer}>
              <AppButton title={loading ? 'Verifying...' : 'Verify Email'} onPress={onVerify} disabled={loading || codeRef.current.join('').length < 6} />
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 10,
  },
  topIconBtn: {
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
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 32,
  },
  stepSegment: {
    width: 15,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
    marginHorizontal: 3
  },
  stepSegmentActive: {
    backgroundColor: colors.primary
  },
  signInText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700'
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.4
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeInput: {
    width: 46,
    height: 56,
    borderWidth: 1,
    borderColor: '#DDE6E1',
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  codeInputActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  resendWrap: {
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 32,
  },
  resendText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  resendTextMuted: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
});

export default RegisterStep2VerifyScreen;
