import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import ErrorText from '../../components/common/ErrorText';
import EmptyState from '../../components/common/EmptyState';
import FallbackImage from '../../components/common/FallbackImage';
import colors from '../../constants/colors';
import { getPlaceApi } from '../../api/placeApi';
import { getReviewsApi, createReviewApi } from '../../api/reviewApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { getPlaceImageCandidates } from '../../utils/placeImages';

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

const PlaceDetailsScreen = ({ route, navigation }) => {
  const { place: initial } = route.params;
  const [place, setPlace] = useState(initial);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadPlace = useCallback(async () => {
    try {
      const res = await getPlaceApi(initial._id);
      setPlace(res?.data?.place || initial);
    } catch {
      // Keep initial data
    }
  }, [initial._id]);

  const loadReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const res = await getReviewsApi({ targetType: 'place', targetId: initial._id });
      setReviews(res?.data?.reviews || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load reviews'));
    } finally {
      setLoadingReviews(false);
    }
  }, [initial._id]);

  useFocusEffect(
    useCallback(() => {
      loadPlace();
      loadReviews();
    }, [loadPlace, loadReviews])
  );

  const handleSubmitReview = async () => {
    if (!reviewRating) return setReviewError('Please select a rating.');
    try {
      setSubmitting(true);
      setReviewError('');
      await createReviewApi({
        targetType: 'place',
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
      : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header & Back Button */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.imageWrap}>
            <FallbackImage
              uri={getPlaceImageCandidates(place)}
              style={StyleSheet.absoluteFill}
              iconName="compass-outline"
              iconSize={40}
            />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.placeName}>{place.name}</Text>
            
            {place.district ? (
              <View style={styles.locationRow}>
                <Ionicons name="map" size={15} color={colors.accent} />
                <Text style={styles.placeDistrict}>{place.district}</Text>
              </View>
            ) : null}
            
            {(place.category || place.type) ? (
              <View style={styles.catRow}>
                <View style={styles.catBadge}>
                  <Text style={styles.catText}>{place.category || place.type}</Text>
                </View>
              </View>
            ) : null}
          {avgRating && (
            <View style={styles.ratingRow}>
              <StarRow rating={avgRating} size={18} />
              <Text style={styles.ratingNum}>{avgRating}</Text>
              <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
            </View>
          )}
          </View>
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          {place.estimatedCost > 0 && (
            <View style={styles.infoCard}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Est. Cost</Text>
              <Text style={styles.infoValue}>LKR {place.estimatedCost}</Text>
            </View>
          )}
          {place.duration ? (
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{place.duration}</Text>
            </View>
          ) : null}
          {reviews.length > 0 && (
            <View style={styles.infoCard}>
              <Ionicons name="star" size={20} color={colors.warning} />
              <Text style={styles.infoLabel}>Avg Rating</Text>
              <Text style={styles.infoValue}>{avgRating} / 5</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {place.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{place.description}</Text>
          </View>
        ) : null}

        {/* Tags */}
        {place.tags && place.tags.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {place.tags.map((tag, i) => (
                <View key={i} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Location Map */}
        {place.lat && place.lng ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={StyleSheet.absoluteFill}
                initialRegion={{
                  latitude: Number(place.lat),
                  longitude: Number(place.lng),
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: Number(place.lat), longitude: Number(place.lng) }}
                  pinColor={colors.primary}
                />
              </MapView>
            </View>
            <Text style={styles.addressText}>
              {place.address_text || place.location || `${place.district || 'Sri Lanka'}`}
            </Text>
          </View>
        ) : null}

        <ErrorText message={error} />

        {/* Reviews */}
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
              subtitle="Be the first to review this place."
              icon="chatbubble-outline"
            />
          ) : (
            reviews.map((r) => <ReviewCard key={r._id} review={r} />)
          )}
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
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 120
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  imageWrap: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surface2,
  },
  heroContent: {
    padding: 20,
    alignItems: 'center',
  },
  placeName: {
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
    marginBottom: 10
  },
  placeDistrict: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600'
  },
  catRow: {
    marginBottom: 12
  },
  catBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary
  },
  catText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase'
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tagChip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  tagText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12
  },
  mapContainer: {
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: colors.surface2,
  },
  addressText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
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

export default PlaceDetailsScreen;
