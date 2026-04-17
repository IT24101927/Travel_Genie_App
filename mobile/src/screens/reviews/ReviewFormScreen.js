import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { createReviewApi } from '../../api/reviewApi';
import { getApiErrorMessage } from '../../utils/apiError';

const ReviewFormScreen = () => {
  const [form, setForm] = useState({
    targetType: 'hotel',
    targetId: '',
    rating: '5',
    comment: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async () => {
    try {
      setError('');
      setSuccess('');
      await createReviewApi({
        targetType: form.targetType,
        targetId: form.targetId,
        rating: Number(form.rating),
        comment: form.comment
      });
      setSuccess('Review submitted successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit review'));
    }
  };

  return (
    <View style={styles.container}>
      <AppInput label="Target Type (hotel|place)" value={form.targetType} onChangeText={(text) => setForm((p) => ({ ...p, targetType: text }))} />
      <AppInput label="Target ID" value={form.targetId} onChangeText={(text) => setForm((p) => ({ ...p, targetId: text }))} />
      <AppInput label="Rating (1-5)" value={form.rating} keyboardType="number-pad" onChangeText={(text) => setForm((p) => ({ ...p, rating: text }))} />
      <AppInput label="Comment" value={form.comment} onChangeText={(text) => setForm((p) => ({ ...p, comment: text }))} />
      <ErrorText message={error} />
      <ErrorText message={success} />
      <AppButton title="Submit Review" onPress={onSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 18
  }
});

export default ReviewFormScreen;
