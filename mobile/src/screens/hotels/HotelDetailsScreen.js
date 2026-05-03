import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import ErrorText from '../../components/common/ErrorText';
import EmptyState from '../../components/common/EmptyState';
import colors from '../../constants/colors';
import { getHotelApi } from '../../api/hotelApi';
import { getReviewsApi, createReviewApi } from '../../api/reviewApi';
import { getApiErrorMessage } from '../../utils/apiError';

const StarRow = ({ rating, size = 16 }) => {
  const num = Number(rating) || 0;
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= num ? 'star' : 'star-outline'}
          size={size}
          color={colors.warning}
        />
      ))}
    </View>
  );
};

const ReviewCard = ({ review }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>
          {review.userId?.fullName ? review.userId.fullName.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.reviewName}>{review.userId?.fullName || 'Traveler'}</Text>
        <StarRow rating={review.rating} size={13} />
      </View>
    </View>
    {review.comment ? (
      <Text style={styles.reviewComment}>{review.comment}</Text>
    ) : null}
  </View>
);

const HotelDetailsScreen = ({ route, navigation }) => {
  const { hotel: initial } = route.params;
  const [hotel, setHotel] = useState(initial);
  const [reviews, setReviews] = useState([]);
  const [loadingHotel, setLoadingHotel] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadHotel = useCallback(async () => {
    try {
      setLoadingHotel(true);
      const res = await getHotelApi(initial._id);
      setHotel(res?.data?.hotel || initial);
    } catch {
      // Keep initial data if fetch fails
    } finally {
      setLoadingHotel(false);
    }
  }, [initial._id]);

  const loadReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const res = await getReviewsApi({ targetType: 'hotel', targetId: initial._id });
      setReviews(res?.data?.reviews || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load reviews'));
    } finally {
      setLoadingReviews(false);
    }
  }, [initial._id]);

  useFocusEffect(
    useCallback(() => {
      loadHotel();
      loadReviews();
    }, [loadHotel, loadReviews])
  );

  const handleSubmitReview = async () => {
    if (!reviewRating) return setReviewError('Please select a rating.');
    try {
      setSubmitting(true);
      setReviewError('');
      await createReviewApi({
        targetType: 'hotel',
        targetId: initial._id,
        rating: reviewRating,
        comment: reviewComment
      });
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      loadReviews();
    } catch (err) {
      setReviewError(getApiErrorMessage(err, 'Failed to submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : hotel.rating || 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.heroCard}>
          <View style={styles.hotelIconBox}>
            <Ionicons name="bed" size={40} color={colors.primary} />
          </View>
          <Text style={styles.hotelName}>{hotel.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={15} color={colors.accent} />
            <Text style={styles.hotelLocation}>{hotel.location}</Text>
          </View>
          <View style={styles.ratingRow}>
            <StarRow rating={avgRating} size={18} />
            <Text style={styles.ratingNum}>{avgRating}</Text>
            <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
          </View>
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Price / Night</Text>
            <Text style={styles.infoValue}>
              {hotel.priceRange ? `$${hotel.priceRange}` : 'Contact'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="star" size={20} color={colors.warning} />
            <Text style={styles.infoLabel}>Rating</Text>
            <Text style={styles.infoValue}>{avgRating} / 5</Text>
          </View>
        </View>

        {/* Description */}
        {hotel.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{hotel.description}</Text>
          </View>
        ) : null}

        {/* Amenities */}
        {hotel.amenities && hotel.amenities.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {hotel.amenities.map((a, i) => (
                <View key={i} style={styles.amenityChip}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <ErrorText message={error} />

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewsTitleRow}>
            <Text style={styles.sectionTitle}>
              Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
            </Text>
            <Pressable
              style={styles.writeReviewBtn}
              onPress={() => setShowReviewForm((v) => !v)}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={styles.writeReviewText}>
                {showReviewForm ? 'Cancel' : 'Write Review'}
              </Text>
            </Pressable>
          </View>

          {showReviewForm && (
            <View style={styles.reviewForm}>
              <Text style={styles.ratingPickerLabel}>Your Rating</Text>
              <View style={styles.ratingPicker}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setReviewRating(star)}>
                    <Ionicons
                      name={star <= reviewRating ? 'star' : 'star-outline'}
                      size={30}
                      color={colors.warning}
                      style={{ marginHorizontal: 4 }}
                    />
                  </Pressable>
                ))}
              </View>
              <AppInput
                label="Your Comment (optional)"
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Share your experience..."
                multiline
                style={{ height: 80 }}
              />
              <ErrorText message={reviewError} />
              <AppButton
                title="Submit Review"
                onPress={handleSubmitReview}
                loading={submitting}
              />
            </View>
          )}

          {loadingReviews ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              subtitle="Be the first to review this hotel."
              icon="chatbubble-outline"
            />
          ) : (
            reviews.map((r) => <ReviewCard key={r._id} review={r} />)
          )}
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
    padding: 16,
    paddingBottom: 40
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3
  },
  hotelIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  hotelName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12
  },
  hotelLocation: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600'
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  starRow: {
    flexDirection: 'row',
    gap: 2
  },
  ratingNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  reviewCount: {
    fontSize: 13,
    color: colors.textMuted
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    elevation: 2
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12
  },
  descriptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  amenityText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  reviewsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primary + '15'
  },
  writeReviewText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13
  },
  reviewForm: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16
  },
  ratingPickerLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 10
  },
  ratingPicker: {
    flexDirection: 'row',
    marginBottom: 14
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    marginTop: 8
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center'
  },
  reviewAvatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15
  },
  reviewName: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2
  },
  reviewComment: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  }
});

export default HotelDetailsScreen;
