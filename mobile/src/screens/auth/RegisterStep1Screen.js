import React, { useState } from 'react';
import { KeyboardAvoidingView, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import GenderPicker from '../../components/common/GenderPicker';
import colors from '../../constants/colors';
import { validateEmail, validateName, validatePhone, validateNic, validatePassword, isRequired } from '../../utils/validators';
import { Ionicons } from '@expo/vector-icons';

const RegisterStep1Screen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    nic: '',
    gender: 'MALE',
    password: '',
    confirmPassword: '',
    photo: null
  });
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const [dobDate, setDobDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const formatDate = (date) => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const onContinue = () => {
    const next = {};

    const nameCheck = validateName(form.fullName);
    if (!nameCheck.valid) next.fullName = nameCheck.message;

    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) next.email = emailCheck.message;

    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) next.phone = phoneCheck.message;

    const nicCheck = validateNic(form.nic);
    if (!nicCheck.valid) next.nic = nicCheck.message;

    if (!isRequired(form.dob)) next.dob = 'Date of Birth is required.';

    const passCheck = validatePassword(form.password);
    if (!passCheck.valid) next.password = passCheck.message;

    if (isRequired(form.password) && form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    navigation.navigate('RegisterStep2', { userData: form });
  };

  const handleGenderChange = (gender) => {
    setForm(prev => ({ ...prev, gender }));
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      setPhotoError('Please allow gallery access to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoError('');
      setForm(prev => ({ ...prev, photo: result.assets[0].uri }));
    }
  };

  const handleOpenDatePicker = () => {
    Keyboard.dismiss();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dobDate,
        mode: 'date',
        display: 'calendar',
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleDateConfirm(selectedDate);
          }
        }
      });
      return;
    }

    setShowDatePicker(true);
  };

  const handleDateConfirm = (selectedDate) => {
    setDobDate(selectedDate);
    setForm(prev => ({ ...prev, dob: formatDate(selectedDate) }));
    setErrors(prev => ({ ...prev, dob: '' }));
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 8, paddingBottom: Math.max(insets.bottom + 102, 110) }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.topIconBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.stepPill}>
              <View style={[styles.stepSegment, styles.stepSegmentActive]} />
              <View style={styles.stepSegment} />
              <View style={styles.stepSegment} />
            </View>

            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Step 1 of 3. Add your basic details.</Text>
          </View>

          <Pressable style={styles.photoCard} onPress={handlePickImage}>
            <View style={styles.photoUploadCircle}>
              {form.photo ? (
                <Image source={{ uri: form.photo }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person-outline" size={34} color={colors.primary} />
              )}
              <View style={styles.photoUploadBadge}>
                <Ionicons name="camera" size={11} color={colors.white} />
              </View>
            </View>
            <View style={styles.photoTextWrap}>
              <Text style={styles.photoTitle}>Profile photo</Text>
              <Text style={styles.photoSubtitle}>Tap to upload an optional image</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          {photoError ? (
            <Text style={styles.photoErrorText}>{photoError}</Text>
          ) : null}

          <View style={styles.formCard}>
            <AppInput
              label="Full Name"
              leftIcon="person-outline"
              value={form.fullName}
              error={errors.fullName}
              onChangeText={(text) => setField('fullName', text)}
              placeholder="Jane Smith"
            />

            <AppInput
              label="Email Address"
              leftIcon="mail-outline"
              value={form.email}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
              onChangeText={(text) => setField('email', text)}
              placeholder="jane@example.com"
            />

            <AppInput
              label="Phone Number"
              leftIcon="call-outline"
              value={form.phone}
              keyboardType="phone-pad"
              error={errors.phone}
              onChangeText={(text) => setField('phone', text.replace(/\D/g, '').slice(0, 10))}
              placeholder="07XXXXXXXX"
              helperText={errors.phone ? undefined : '10 digits starting with 0 (e.g. 0771234567)'}
            />

            <AppInput
              label="Date of Birth"
              leftIcon="calendar-outline"
              value={form.dob}
              error={errors.dob}
              onContainerPress={handleOpenDatePicker}
              editable={false}
              placeholder="mm/dd/yyyy"
              helperText={errors.dob ? undefined : 'Tap to choose your birth date'}
            />

            <AppInput
              label="NIC Number"
              leftIcon="card-outline"
              value={form.nic}
              error={errors.nic}
              onChangeText={(text) => setField('nic', text.replace(/\s/g, '').replace(/[vVxX]$/, (m) => m.toUpperCase()))}
              placeholder="e.g. 200012345678 or 991234567V"
              helperText={errors.nic ? undefined : '12 digits or old format ending with V/X'}
            />

            <GenderPicker
              label="Gender"
              value={form.gender}
              onChange={handleGenderChange}
            />

            <AppInput
              label="Password"
              leftIcon="lock-closed-outline"
              value={form.password}
              secureTextEntry
              error={errors.password}
              onChangeText={(text) => setField('password', text)}
              placeholder="Create password"
              helperText={errors.password ? undefined : 'Needs uppercase, lowercase, number and symbol'}
            />

            <AppInput
              label="Confirm Password"
              leftIcon="lock-closed-outline"
              value={form.confirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
              onChangeText={(text) => setField('confirmPassword', text)}
              placeholder="Repeat password"
            />
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <AppButton title="Continue" onPress={onContinue} />
        </View>

        {Platform.OS === 'ios' ? (
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            display="spinner"
            isDarkModeEnabled={false}
            themeVariant="light"
            date={dobDate}
            maximumDate={new Date()}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
          />
        ) : null}
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
    paddingHorizontal: 24,
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
    height: 32
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
    marginBottom: 12
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.4
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7F4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCEBE4',
    marginBottom: 6
  },
  photoUploadCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29
  },
  photoUploadBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F7F4'
  },
  photoTextWrap: {
    flex: 1
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3
  },
  photoSubtitle: {
    fontSize: 12,
    color: colors.textMuted
  },
  photoErrorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4
  },
  formCard: {
    paddingHorizontal: 2,
    paddingVertical: 8
  },
  bottomBar: {
    paddingTop: 8,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background
  }
});

export default RegisterStep1Screen;
