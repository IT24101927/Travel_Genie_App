import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { createReviewApi } from '../../api/reviewApi';
import { getApiErrorMessage } from '../../utils/apiError';

const TARGET_TYPES = ['hotel', 'place'];

const ReviewFormScreen = ({ route, navigation }) => {
  const params = route?.params || {};

  const [form, setForm] = useState({
    targetType: params.targetType || 'hotel',
    targetId: params.targetId || '',
    rating: params.rating || 5,
    comment: params.comment || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.targetId.trim()) return setError('Target ID is required.');
    if (!form.rating) return setError('Please select a rating.');

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await createReviewApi({
        targetType: form.targetType,
        targetId: form.targetId,
        rating: Number(form.rating),
        comment: form.comment
      });
      setSuccess('Review submitted successfully!');
      if (navigation?.canGoBack()) {
        setTimeout(() => navigation.goBack(), 1000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit review'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Review Type</Text>
        <View style={styles.chipRow}>
          {TARGET_TYPES.map((t) => (
            <View
              key={t}
              style={[styles.chip, form.targetType === t && styles.chipSelected]}
            >
              <Text
                style={[styles.chipText, form.targetType === t && styles.chipTextSelected]}
                onPress={() => set('targetType', t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        <AppInput
          label="Target ID"
          value={form.targetId}
          onChangeText={(v) => set('targetId', v)}
          placeholder="Hotel or Place ID"
          leftIcon="key-outline"
        />

        <Text style={styles.sectionLabel}>Rating</Text>
        <View style={styles.ratingPicker}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => set('rating', star)}>
              <Ionicons
                name={star <= form.rating ? 'star' : 'star-outline'}
                size={34}
                color={colors.warning}
                style={{ marginHorizontal: 5 }}
              />
            </Pressable>
          ))}
        </View>

        <AppInput
          label="Comment (optional)"
          value={form.comment}
          onChangeText={(v) => set('comment', v)}
          placeholder="Share your experience..."
          multiline
          style={{ height: 100 }}
        />

        {success ? <Text style={styles.successText}>{success}</Text> : null}
        <ErrorText message={error} />
        <AppButton title="Submit Review" onPress={handleSubmit} loading={loading} />
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
    padding: 18,
    paddingBottom: 120
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 10,
    marginTop: 4
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14
  },
  chipTextSelected: {
    color: colors.white
  },
  ratingPicker: {
    flexDirection: 'row',
    marginBottom: 20
  },
  successText: {
    color: colors.success,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12
  }
});

export default ReviewFormScreen;
