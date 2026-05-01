import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import ErrorText from '../../components/common/ErrorText';
import EmptyState from '../../components/common/EmptyState';
import FallbackImage from '../../components/common/FallbackImage';
import colors from '../../constants/colors';
import { getHotelApi } from '../../api/hotelApi';
import { getReviewsApi, createReviewApi } from '../../api/reviewApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { getHotelImageCandidates } from '../../utils/hotelImages';
import { HOTEL_CURRENCIES, formatHotelPrice, getHotelNightlyPriceLkr } from '../../utils/currencyFormat';

const { width } = Dimensions.get('window');
const HERO_H = Math.floor(width * 0.85);

const TYPE_META = {
  hotel:      { emoji: '🏨', color: '#3498DB', label: 'Hotel' },
  resort:     { emoji: '🌴', color: '#4CAF50', label: 'Resort' },
  guesthouse: { emoji: '🏡', color: '#FF9800', label: 'Guesthouse' },
  hostel:     { emoji: '🛏️', color: '#9C27B0', label: 'Hostel' },
  villa:      { emoji: '🏘️', color: '#E91E63', label: 'Villa' },
  boutique:   { emoji: '✨', color: '#F57C00', label: 'Boutique' },
  apartment:  { emoji: '🏢', color: '#607D8B', label: 'Apartment' },
  lodge:      { emoji: '🛖', color: '#795548', label: 'Lodge' },
  camp:       { emoji: '⛺', color: '#8BC34A', label: 'Camp' },
};

const AMENITY_EMOJI = {
  wifi: '📶', 'free wifi': '📶', internet: '📶',
  pool: '🏊', 'swimming pool': '🏊',
  spa: '💆', restaurant: '🍽️', gym: '🏋️', fitness: '🏋️',
  parking: '🅿️', bar: '🍸', kitchen: '🍳', garden: '🌿',
  laundry: '👕', breakfast: '🥐', rooftop: '🌇',
  'beach access': '🏖️', 'airport shuttle': '🚐',
  'air conditioning': '❄️', ac: '❄️',
  tv: '📺', 'room service': '🛎️', concierge: '🛎️',
  'pet friendly': '🐾', pet: '🐾',
  fireplace: '🔥', butler: '🎩',
  'bicycle rental': '🚲', cycling: '🚲',
  hiking: '🥾', 'water sports': '🏄', surfing: '🏄',
  snorkelling: '🤿', safari: '🦁', 'bird watching': '🦅',
  'tea tours': '🍵', 'cooking class': '👨‍🍳',
  'kids club': '🧒', 'business center': '💼',
  kayaking: '🛶', 'boat tours': '⛵', rafting: '🌊',
  library: '📚',
};

const getAmenityEmoji = (name) => {
  const key = String(name || '').toLowerCase().trim();
  if (AMENITY_EMOJI[key]) return AMENITY_EMOJI[key];
  for (const k of Object.keys(AMENITY_EMOJI)) {
    if (key.includes(k)) return AMENITY_EMOJI[k];
  }
  return '✓';
};

const getHotelMeta = (hotel) =>
  TYPE_META[String(hotel?.hotel_type || '').toLowerCase()] ||
  { emoji: '🏩', color: colors.primary, label: 'Hotel' };

const getHotelCoords = (hotel) => {
  const lat = Number(hotel?.lat);
  const lng = Number(hotel?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return { latitude: lat, longitude: lng };
  }
  const c = hotel?.location?.coordinates;
  if (Array.isArray(c) && c.length === 2) {
    const [lo, la] = c;
    if (Number.isFinite(la) && Number.isFinite(lo) && la !== 0 && lo !== 0) {
      return { latitude: la, longitude: lo };
    }
  }
  return null;
};

const getHotelMapRegion = (coords) => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  latitudeDelta: 0.018,
  longitudeDelta: 0.018,
});

// ─── Star Row ───────────────────────────────────────────────────────────────
const StarRow = ({ rating, size = 16, interactive = false, onPress }) => {
  const filled = Math.round(Number(rating) || 0);
  return (
    <View style={ds.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={interactive ? () => onPress(i) : undefined} disabled={!interactive}>
          <Ionicons
            name={i <= filled ? 'star' : 'star-outline'}
            size={size}
            color={colors.warning}
            style={{ marginHorizontal: 1 }}
          />
        </Pressable>
      ))}
    </View>
  );
};

// ─── Review Card ────────────────────────────────────────────────────────────
const ReviewCard = ({ review }) => (
  <View style={ds.reviewCard}>
    <View style={ds.reviewHeader}>
      <View style={ds.reviewAvatar}>
        <Text style={ds.reviewAvatarText}>
          {review.userId?.fullName ? review.userId.fullName.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ds.reviewName}>{review.userId?.fullName || 'Traveler'}</Text>
        <StarRow rating={review.rating} size={12} />
      </View>
      <View style={ds.reviewRatingPill}>
        <Ionicons name="star" size={10} color={colors.warning} />
        <Text style={ds.reviewRatingPillText}>{review.rating}</Text>
      </View>
    </View>
    {review.comment ? (
      <Text style={ds.reviewComment}>{review.comment}</Text>
    ) : null}
  </View>
);

// ─── Info Stat Card ──────────────────────────────────────────────────────────
const InfoCard = ({ icon, iconBg, label, value, sub }) => (
  <View style={ds.infoCard}>
    <View style={[ds.infoIconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={colors.white} />
    </View>
    <Text style={ds.infoLabel}>{label}</Text>
    <Text style={ds.infoValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    {sub ? <Text style={ds.infoSub}>{sub}</Text> : null}
  </View>
);

const HotelLocationMap = ({ hotel, coords, onOpenInMaps }) => {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapLaidOut, setMapLaidOut] = useState(false);
  const region = getHotelMapRegion(coords);
  const meta = getHotelMeta(hotel);

  useEffect(() => {
    if (!mapReady || !mapLaidOut) return;

    const timers = [0, 250].map((delay) =>
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 0);
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [mapLaidOut, mapReady, region.latitude, region.longitude]);

  return (
    <View style={ds.mapBox} onLayout={() => setMapLaidOut(true)}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        onMapReady={() => setMapReady(true)}
      >
        {Platform.OS === 'ios' ? (
          <Marker
            coordinate={coords}
            title={hotel.name || 'Hotel'}
            description={hotel.address_text || hotel.location || 'Hotel location'}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={ds.markerWrap}>
              <View style={[ds.markerBubble, { backgroundColor: meta.color }]}>
                <Text style={ds.markerEmoji}>{meta.emoji}</Text>
              </View>
              <View style={[ds.markerStem, { borderTopColor: meta.color }]} />
            </View>
          </Marker>
        ) : (
          <Marker
            coordinate={coords}
            title={hotel.name || 'Hotel'}
            description={hotel.address_text || hotel.location || 'Hotel location'}
            pinColor={meta.color}
          />
        )}
      </MapView>

      <Pressable style={ds.mapTapOverlay} onPress={onOpenInMaps}>
        <View style={ds.mapTapHint}>
          <Ionicons name="open-outline" size={13} color={colors.white} />
          <Text style={ds.mapTapHintText}>Open in Maps</Text>
        </View>
      </Pressable>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const HotelDetailsScreen = ({ route, navigation }) => {
  const { hotel: initial } = route.params;
  const [hotel, setHotel] = useState(initial);
  const [displayCurrency, setDisplayCurrency] = useState('LKR');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadHotel = useCallback(async () => {
    try {
      const res = await getHotelApi(initial._id);
      setHotel(res?.data?.hotel || initial);
    } catch {
      // keep initial data
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
        comment: reviewComment,
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

  const meta = getHotelMeta(hotel);
  const nightlyPrice = getHotelNightlyPriceLkr(hotel);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : null;

  const handleCall = () => {
    if (hotel.contact?.phone) Linking.openURL(`tel:${hotel.contact.phone}`);
  };

  const handleEmail = () => {
    if (hotel.contact?.email) Linking.openURL(`mailto:${hotel.contact.email}`);
  };

  const handleWebsite = () => {
    if (hotel.contact?.website) {
      const url = hotel.contact.website.startsWith('http')
        ? hotel.contact.website
        : `https://${hotel.contact.website}`;
      Linking.openURL(url);
    }
  };

  const handleBook = () => {
    if (hotel.contact?.phone) handleCall();
    else if (hotel.contact?.website) handleWebsite();
    else if (hotel.contact?.email) handleEmail();
  };

  const handleOpenInMaps = () => {
    const coords = getHotelCoords(hotel);
    if (!coords) return;
    const { latitude, longitude } = coords;
    const label = encodeURIComponent(hotel.name || 'Hotel');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    });
  };

  const hasContact = hotel.contact && (hotel.contact.phone || hotel.contact.email || hotel.contact.website);
  const hotelCoords = getHotelCoords(hotel);

  return (
    <SafeAreaView style={ds.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={ds.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={[ds.heroWrap, { height: HERO_H }]}>
            <FallbackImage
              uri={getHotelImageCandidates(hotel)}
              style={StyleSheet.absoluteFill}
              iconName="bed-outline"
              iconSize={54}
              placeholderColor={meta.color + '22'}
              placeholderIconColor={meta.color}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.75)']}
                style={StyleSheet.absoluteFill}
              />
            </FallbackImage>

            {/* Back button */}
            <Pressable style={ds.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>

            {/* Type badge top-right */}
            <View style={[ds.heroTypeBadge, { backgroundColor: meta.color }]}>
              <Text style={ds.heroTypeEmoji}>{meta.emoji}</Text>
              <Text style={ds.heroTypeLabel}>{meta.label}</Text>
            </View>

            {/* Rating badge */}
            {Number(hotel.rating) > 0 && (
              <View style={ds.heroRating}>
                <Ionicons name="star" size={13} color={colors.warning} />
                <Text style={ds.heroRatingText}>{Number(hotel.rating).toFixed(1)}</Text>
              </View>
            )}

            {/* Bottom info on hero */}
            <View style={ds.heroBottom}>
              {Number(hotel.star_class) > 0 && (
                <View style={ds.heroStarRow}>
                  {Array.from({ length: Math.min(5, Number(hotel.star_class)) }).map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color={colors.warning} />
                  ))}
                  <Text style={ds.heroStarLabel}>{hotel.star_class}-Star</Text>
                </View>
              )}
              <Text style={ds.heroName} numberOfLines={2}>{hotel.name}</Text>
              <View style={ds.heroLocRow}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={ds.heroLoc} numberOfLines={2}>
                  {hotel.address_text || hotel.location || 'Sri Lanka'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Quick info cards ── */}
          <View style={ds.infoRow}>
            <InfoCard
              icon="cash-outline"
              iconBg={colors.primary}
              label="Per Night"
              value={nightlyPrice ? formatHotelPrice(nightlyPrice, displayCurrency) : 'Contact'}
            />
            <InfoCard
              icon="star"
              iconBg={colors.warning}
              label="Class"
              value={hotel.star_class ? `${hotel.star_class} ★` : 'N/A'}
            />
            <InfoCard
              icon="chatbubbles-outline"
              iconBg={colors.info}
              label="Reviews"
              value={String(reviews.length)}
              sub={avgRating ? `Avg ${avgRating}` : null}
            />
          </View>

          {/* ── Currency toggle ── */}
          {nightlyPrice ? (
            <View style={ds.currencyRow}>
              <Text style={ds.currencyLabel}>Currency</Text>
              <View style={ds.currencyPills}>
                {HOTEL_CURRENCIES.map((c) => {
                  const active = displayCurrency === c.code;
                  return (
                    <Pressable
                      key={c.code}
                      style={[ds.currencyPill, active && ds.currencyPillActive]}
                      onPress={() => setDisplayCurrency(c.code)}
                    >
                      <Text style={[ds.currencyPillText, active && ds.currencyPillTextActive]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ── About ── */}
          {hotel.description ? (
            <View style={ds.section}>
              <View style={ds.sectionHeader}>
                <View style={[ds.sectionIconBox, { backgroundColor: colors.info + '20' }]}>
                  <Ionicons name="information-circle-outline" size={17} color={colors.info} />
                </View>
                <Text style={ds.sectionTitle}>About this Stay</Text>
              </View>
              <Text style={ds.bodyText}>{hotel.description}</Text>
            </View>
          ) : null}

          {/* ── Amenities ── */}
          {hotel.amenities && hotel.amenities.length > 0 ? (
            <View style={ds.section}>
              <View style={ds.sectionHeader}>
                <View style={[ds.sectionIconBox, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name="sparkles-outline" size={17} color={colors.primary} />
                </View>
                <Text style={ds.sectionTitle}>Amenities</Text>
                <Text style={ds.sectionCount}>{hotel.amenities.length} included</Text>
              </View>
              <View style={ds.amenitiesGrid}>
                {hotel.amenities.map((a, i) => (
                  <View key={`${a}-${i}`} style={ds.amenityChip}>
                    <Text style={ds.amenityEmoji}>{getAmenityEmoji(a)}</Text>
                    <Text style={ds.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* ── Contact ── */}
          {hasContact ? (
            <View style={ds.section}>
              <View style={ds.sectionHeader}>
                <View style={[ds.sectionIconBox, { backgroundColor: colors.success + '18' }]}>
                  <Ionicons name="call-outline" size={17} color={colors.success} />
                </View>
                <Text style={ds.sectionTitle}>Contact</Text>
              </View>
              <View style={ds.contactButtons}>
                {hotel.contact.phone && (
                  <Pressable style={[ds.contactBtn, { backgroundColor: colors.success + '14', borderColor: colors.success + '30' }]} onPress={handleCall}>
                    <Ionicons name="call" size={16} color={colors.success} />
                    <Text style={[ds.contactBtnText, { color: colors.success }]}>{hotel.contact.phone}</Text>
                  </Pressable>
                )}
                {hotel.contact.email && (
                  <Pressable style={[ds.contactBtn, { backgroundColor: colors.info + '12', borderColor: colors.info + '30' }]} onPress={handleEmail}>
                    <Ionicons name="mail" size={16} color={colors.info} />
                    <Text style={[ds.contactBtnText, { color: colors.info }]} numberOfLines={1}>{hotel.contact.email}</Text>
                  </Pressable>
                )}
                {hotel.contact.website && (
                  <Pressable style={[ds.contactBtn, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '28' }]} onPress={handleWebsite}>
                    <Ionicons name="globe-outline" size={16} color={colors.accent} />
                    <Text style={[ds.contactBtnText, { color: colors.accent }]} numberOfLines={1}>{hotel.contact.website}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : null}

          {/* ── Location Map ── */}
          {hotelCoords ? (
            <View style={ds.section}>
              <View style={ds.sectionHeader}>
                <View style={[ds.sectionIconBox, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="map-outline" size={17} color={colors.accent} />
                </View>
                <Text style={ds.sectionTitle}>Location</Text>
                <Pressable style={ds.openMapsBtn} onPress={handleOpenInMaps}>
                  <Ionicons name="navigate" size={12} color={colors.primary} />
                  <Text style={ds.openMapsBtnText}>Directions</Text>
                </Pressable>
              </View>

              {hotel.address_text ? (
                <View style={ds.addressRow}>
                  <Ionicons name="location" size={14} color={colors.textMuted} />
                  <Text style={ds.addressText} numberOfLines={2}>{hotel.address_text}</Text>
                </View>
              ) : null}

              <HotelLocationMap
                hotel={hotel}
                coords={hotelCoords}
                onOpenInMaps={handleOpenInMaps}
              />

              <View style={ds.coordsRow}>
                <Text style={ds.coordsText}>
                  {hotelCoords.latitude.toFixed(4)}°, {hotelCoords.longitude.toFixed(4)}°
                </Text>
              </View>
            </View>
          ) : null}

          <ErrorText message={error} />

          {/* ── Reviews ── */}
          <View style={ds.section}>
            {/* Header */}
            <View style={ds.reviewsTitleRow}>
              <View style={ds.sectionHeader}>
                <View style={[ds.sectionIconBox, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={17} color={colors.warning} />
                </View>
                <Text style={ds.sectionTitle}>
                  Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
                </Text>
              </View>
              <Pressable
                style={ds.writeReviewBtn}
                onPress={() => setShowReviewForm((v) => !v)}
              >
                <Ionicons
                  name={showReviewForm ? 'close' : 'create-outline'}
                  size={14}
                  color={colors.primary}
                />
                <Text style={ds.writeReviewText}>
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </Text>
              </Pressable>
            </View>

            {/* Rating summary */}
            {avgRating && (
              <View style={ds.ratingSummary}>
                <Text style={ds.ratingSummaryNum}>{avgRating}</Text>
                <View>
                  <StarRow rating={Math.round(Number(avgRating))} size={15} />
                  <Text style={ds.ratingSummaryLbl}>
                    Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              </View>
            )}

            {/* Review form */}
            {showReviewForm && (
              <View style={ds.reviewForm}>
                <Text style={ds.reviewFormTitle}>Your Rating</Text>
                <StarRow
                  rating={reviewRating}
                  size={34}
                  interactive
                  onPress={setReviewRating}
                />
                <View style={{ marginTop: 14 }}>
                  <AppInput
                    label="Comment (optional)"
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    placeholder="Share your experience..."
                    multiline
                    style={{ height: 80 }}
                  />
                </View>
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
                subtitle="Be the first to share your experience."
                icon="chatbubble-outline"
              />
            ) : (
              reviews.map((r) => <ReviewCard key={r._id} review={r} />)
            )}
          </View>
        </ScrollView>

        {/* ── Bottom action bar ── */}
        <View style={ds.bottomBar}>
          {nightlyPrice ? (
            <View style={ds.bottomPriceBlock}>
              <Text style={ds.bottomPriceLabel}>From</Text>
              <Text style={ds.bottomPrice}>{formatHotelPrice(nightlyPrice, displayCurrency)}</Text>
              <Text style={ds.bottomPriceSub}>/night</Text>
            </View>
          ) : (
            <View style={ds.bottomPriceBlock}>
              <Text style={ds.bottomPriceLabel}>Price</Text>
              <Text style={[ds.bottomPrice, { fontSize: 14 }]}>Contact for price</Text>
            </View>
          )}
          <Pressable
            style={[ds.bookBtn, !hasContact && ds.bookBtnDisabled]}
            onPress={handleBook}
            disabled={!hasContact}
          >
            <Ionicons name="call-outline" size={17} color={colors.white} />
            <Text style={ds.bookBtnText}>Contact Hotel</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const ds = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },

  // Hero
  heroWrap: {
    width: '100%',
    backgroundColor: colors.surface3,
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    top: 14,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  heroTypeBadge: {
    position: 'absolute',
    top: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
  },
  heroTypeEmoji: { fontSize: 13 },
  heroTypeLabel: { color: colors.white, fontSize: 11, fontWeight: '800' },
  heroRating: {
    position: 'absolute',
    top: 62,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroRatingText: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  heroBottom: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 20,
  },
  heroStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  heroStarLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  heroName: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroLocRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  heroLoc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },

  // Info cards
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: -26,
    marginBottom: 14,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  infoSub: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },

  // Currency
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  currencyLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  currencyPills: { flexDirection: 'row', gap: 6 },
  currencyPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  currencyPillText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  currencyPillTextActive: { color: colors.white },

  // Section
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary, flex: 1 },
  sectionCount: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  bodyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '25',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
  },
  amenityEmoji: { fontSize: 14 },
  amenityText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },

  // Contact
  contactButtons: { gap: 10 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
  },
  contactBtnText: { fontSize: 14, fontWeight: '700', flex: 1 },

  // Reviews
  reviewsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.primary + '14',
    marginTop: 2,
  },
  writeReviewText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.warning + '10',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.warning + '25',
  },
  ratingSummaryNum: { fontSize: 38, fontWeight: '900', color: colors.textPrimary },
  ratingSummaryLbl: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 4 },
  reviewForm: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  reviewFormTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 14, marginBottom: 10 },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    marginTop: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { color: colors.primary, fontWeight: '900', fontSize: 15 },
  reviewName: { color: colors.textPrimary, fontWeight: '800', fontSize: 14, marginBottom: 3 },
  reviewRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warning + '18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  reviewRatingPillText: { color: colors.textPrimary, fontSize: 11, fontWeight: '900' },
  reviewComment: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  // Star row
  starRow: { flexDirection: 'row', alignItems: 'center' },

  // Map section
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: colors.primary + '15',
  },
  openMapsBtnText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  addressText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  mapBox: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapTapOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 10,
  },
  mapTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  mapTapHintText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  coordsRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  coordsText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  // iOS custom marker. Android uses native pins for better map reliability.
  markerWrap: { alignItems: 'center' },
  markerBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerEmoji: { fontSize: 18 },
  markerStem: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 14,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bottomPriceBlock: { flex: 1 },
  bottomPriceLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  bottomPrice: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  bottomPriceSub: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 3,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bookBtnDisabled: { backgroundColor: colors.textMuted },
  bookBtnText: { color: colors.white, fontSize: 14, fontWeight: '900' },
});

export default HotelDetailsScreen;
