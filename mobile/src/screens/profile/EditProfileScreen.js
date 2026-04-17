import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Text } from 'react-native';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { updateProfileApi } from '../../api/authApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { isRequired } from '../../utils/validators';

const EditProfileScreen = ({ navigation, route }) => {
  const profile = route.params?.profile || {};
  const [form, setForm] = useState({
    fullName: profile?.fullName || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!isRequired(form.fullName)) {
      setError('Full name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await updateProfileApi({ fullName: form.fullName.trim() });
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Update Profile</Text>
          <Text style={styles.subtitle}>Edit your personal information below.</Text>
        </View>

        <AppInput
          label="Full Name"
          value={form.fullName}
          onChangeText={(text) => setForm((p) => ({ ...p, fullName: text }))}
          placeholder="Jane Doe"
        />

        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Email</Text>
          <Text style={styles.readOnlyText}>{profile?.email}</Text>
          <Text style={styles.hintText}>Email cannot be changed at this time.</Text>
        </View>

        <ErrorText message={error} />
        
        <View style={styles.btnWrapper}>
           <AppButton title={saving ? 'Saving...' : 'Save Changes'} onPress={onSave} disabled={saving} />
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
  content: {
    padding: 24,
    paddingBottom: 40
  },
  header: {
    marginBottom: 32
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 8
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16
  },
  readOnlyField: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  readOnlyLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  readOnlyText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600'
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic'
  },
  btnWrapper: {
    marginTop: 24
  }
});

export default EditProfileScreen;
