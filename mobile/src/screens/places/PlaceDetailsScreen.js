import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
import { getPlaceType, getPlaceTypeMeta } from '../../utils/placeTypes';

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

const getPlaceCoordinate = (place = {}) => {
  const latitude = Number(place.lat);
  const longitude = Number(place.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

const getPlaceMapRegion = (coords) => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
});

const DetailPill = ({ icon, emoji, label, value, color = colors.primary }) => (
  <View style={styles.detailPill}>
    <View style={[styles.detailPillIcon, { backgroundColor: color + '16' }]}>
      {emoji ? (
        <Text style={styles.detailPillEmoji}>{emoji}</Text>
      ) : (
        <Ionicons name={icon} size={17} color={color} />
      )}
    </View>
    <Text style={styles.detailPillLabel}>{label}</Text>
    <Text style={styles.detailPillValue} numberOfLines={1}>{value}</Text>
  </View>
);

const PlaceLocationMap = ({ place, coords, onOpenInMaps }) => {
  const meta = getPlaceTypeMeta(place);
  const region = getPlaceMapRegion(coords);

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        {Platform.OS === 'ios' ? (
          <Marker
            coordinate={coords}
            title={place.name || 'Place'}
            description={place.address_text || place.location || place.district || 'Place location'}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerWrap}>
              <View style={[styles.markerBubble, { backgroundColor: meta.color }]}>
                <Text style={styles.markerEmoji}>{meta.emoji}</Text>
              </View>
              <View style={[styles.markerStem, { borderTopColor: meta.color }]} />
            </View>
          </Marker>
        ) : (
          <Marker
            coordinate={coords}
            title={place.name || 'Place'}
            description={place.address_text || place.location || place.district || 'Place location'}
            pinColor={meta.color}
          />
        )}
      </MapView>

      <Pressable style={styles.mapTapOverlay} onPress={onOpenInMaps}>
        <View style={styles.mapTapHint}>
          <Ionicons name="open-outline" size={13} color={colors.white} />
          <Text style={styles.mapTapHintText}>Open in Maps</Text>
        </View>
      </Pressable>
    </View>
  );
};

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

  const displayRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : Number(place.rating || 0) > 0 ? Number(place.rating).toFixed(1) : null;
      
  const displayReviewCount = reviews.length > 0 ? reviews.length : (place.review_count || 0);
  const typeMeta = getPlaceTypeMeta(place);
  const typeLabel = typeMeta.label || getPlaceType(place);
  const coords = getPlaceCoordinate(place);

  const handleOpenInMaps = () => {
    if (!coords) return;
    const label = encodeURIComponent(place.name || 'Place');
    const { latitude, longitude } = coords;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.heroCard}>
          <FallbackImage
            uri={getPlaceImageCandidates(place)}
            style={styles.heroImage}
            iconName="compass-outline"
            iconSize={44}
            placeholderColor={typeMeta.color}
            placeholderIconColor="rgba(255,255,255,0.45)"
          >
            <View style={styles.heroScrim} />
          </FallbackImage>

          <View style={styles.heroTopBar}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </Pressable>
            <View style={[styles.heroTypeBadge, { backgroundColor: typeMeta.color }]}>
              <Text style={styles.heroTypeEmoji}>{typeMeta.emoji}</Text>
              <Text style={styles.heroTypeText}>{typeLabel}</Text>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.placeName} numberOfLines={2}>{place.name}</Text>

            <View style={styles.heroMetaRow}>
              {place.district ? (
                <View style={styles.heroMetaPill}>
                  <Ionicons name="map" size={13} color={colors.white} />
                  <Text style={styles.heroMetaText}>{place.district}</Text>
                </View>
              ) : null}
              {displayRating ? (
                <View style={styles.heroMetaPill}>
                  <Ionicons name="star" size={13} color={colors.warning} />
                  <Text style={styles.heroMetaText}>{displayRating}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          <DetailPill emoji={typeMeta.emoji} label="Type" value={typeLabel} color={typeMeta.color} />
          {place.district ? (
            <DetailPill icon="map-outline" label="District" value={place.district} color={colors.primary} />
          ) : null}
          {place.duration ? (
            <DetailPill icon="time-outline" label="Duration" value={place.duration} color={colors.info} />
          ) : null}
          {displayRating && (
            <DetailPill icon="star" label="Rating" value={`${displayRating} / 5`} color={colors.warning} />
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
        {coords ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <PlaceLocationMap place={place} coords={coords} onOpenInMaps={handleOpenInMaps} />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    minHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.surface2,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heroTopBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTypeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroTypeEmoji: { fontSize: 13 },
  heroContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  placeName: {
    fontSize: 27,
    fontWeight: '900',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    marginBottom: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroMetaText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
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
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  detailPill: {
    width: '47.8%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },
  detailPillIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailPillEmoji: { fontSize: 18 },
  detailPillLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailPillValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
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
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: colors.surface2,
  },
  mapTapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 10,
  },
  mapTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  mapTapHintText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  markerWrap: { alignItems: 'center' },
  markerBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  markerEmoji: { fontSize: 17 },
  markerStem: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
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
