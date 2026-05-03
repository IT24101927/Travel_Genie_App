import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import FallbackImage from '../../components/common/FallbackImage';
import colors from '../../constants/colors';
import { getHotelsApi } from '../../api/hotelApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { getHotelImageCandidates } from '../../utils/hotelImages';
import { HOTEL_CURRENCIES, formatHotelPrice, getHotelNightlyPriceLkr } from '../../utils/currencyFormat';
import { useTripPlanner } from '../../context/TripPlannerContext';
import {
  navigateToPlannerPreferences,
  navigateToPlannerBudget,
  navigateToTripList,
} from '../../navigation/tripPlannerFlow';

// ── Planner helpers ──────────────────────────────────────────────────────
const haversineKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || Number.isNaN(Number(v)))) return Infinity;
  const toRad = (deg) => (Number(deg) * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const computeCentroid = (items) => {
  const coords = (items || [])
    .map((item) => ({ lat: Number(item?.lat), lng: Number(item?.lng) }))
    .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));
  if (!coords.length) return null;
  const lat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
  const lng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
  return { lat, lng };
};

const hotelMatchesPrefType = (hotel, prefType) => {
  if (!prefType || prefType === 'any') return true;
  const type = String(hotel?.hotel_type || '').toLowerCase();
  const price = getHotelNightlyPriceLkr(hotel);
  const stars = Number(hotel?.star_class || 0);
  if (prefType === 'budget') return ['guesthouse', 'hostel', 'lodge'].includes(type) || (price > 0 && price <= 15000);
  if (prefType === 'midrange') return (stars >= 3 && stars <= 4) || (price > 15000 && price <= 35000);
  if (prefType === 'luxury') return stars >= 5 || price > 35000 || ['resort'].includes(type);
  return type === prefType;
};

const { width } = Dimensions.get('window');
const GAP = 12;
const COL_W = Math.floor((width - 32 - GAP) / 2);
const DISTRICT_H = Math.floor(COL_W * 1.15);
const HOTEL_H = Math.floor(COL_W * 1.4);
const HOTEL_ROW_H = HOTEL_H + GAP;
const FEAT_W = Math.floor(width * 0.78);
const FEAT_H = Math.floor(FEAT_W * 0.62);
const NUM_COLUMNS = 2;

const TYPE_META = {
  hotel: { emoji: '🏨', color: '#3498DB', label: 'Hotel' },
  resort: { emoji: '🌴', color: '#4CAF50', label: 'Resort' },
  guesthouse: { emoji: '🏡', color: '#FF9800', label: 'Guesthouse' },
  hostel: { emoji: '🛏️', color: '#9C27B0', label: 'Hostel' },
  villa: { emoji: '🏘️', color: '#E91E63', label: 'Villa' },
  boutique: { emoji: '✨', color: '#F57C00', label: 'Boutique' },
  apartment: { emoji: '🏢', color: '#607D8B', label: 'Apartment' },
  lodge: { emoji: '🛖', color: '#795548', label: 'Lodge' },
  camp: { emoji: '⛺', color: '#8BC34A', label: 'Camp' },
};

const TYPE_FILTERS = [
  { key: 'all', emoji: '🌍', label: 'All', color: colors.primary },
  ...Object.entries(TYPE_META).map(([key, v]) => ({ key, ...v })),
];

// ── Planner-mode filter chips (match TripPreferences hotel types & the web reference) ──
const PREF_FILTERS = [
  { key: 'any', emoji: '🌍', label: 'All', color: colors.primary, sub: 'Show all hotels' },
  { key: 'budget', emoji: '🏚️', label: 'Budget', color: '#FF9800', sub: 'Guesthouses & hostels' },
  { key: 'midrange', emoji: '🏨', label: 'Mid-range', color: '#3498DB', sub: '3–4 star hotels' },
  { key: 'luxury', emoji: '🌴', label: 'Luxury', color: '#4CAF50', sub: '5 star & resorts' },
  { key: 'boutique', emoji: '✨', label: 'Boutique', color: '#F57C00', sub: 'Small unique stays' },
  { key: 'villa', emoji: '🏛️', label: 'Villa', color: '#E91E63', sub: 'Private villa rental' },
];

// Returns the key for the initial planner filter chip (matches the stored pref, defaults to 'any')
const getPrefFilterKey = (prefType) => {
  const key = String(prefType || 'any').toLowerCase();
  return PREF_FILTERS.some(f => f.key === key) ? key : 'any';
};

const SORT_OPTIONS = [
  { key: 'rating', label: 'Top Rated', icon: 'star-outline' },
  { key: 'priceAsc', label: 'Low Price', icon: 'arrow-down-outline' },
  { key: 'priceDesc', label: 'High Price', icon: 'arrow-up-outline' },
];

// Vibrant accent palette for district cards (cycled)
const DISTRICT_ACCENTS = [
  '#0E7C5F', '#D4532B', '#E91E63', '#9C27B0',
  '#3498DB', '#4CAF50', '#FF9800', '#F57C00',
  '#607D8B', '#795548', '#00ACC1', '#5E35B1',
];

const SRI_LANKA_REGION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 4.5,
  longitudeDelta: 4.5,
};

const DISTRICT_TO_PROVINCE = {
  Colombo: 'Western',
  Gampaha: 'Western',
  Kalutara: 'Western',
  Kandy: 'Central',
  Matale: 'Central',
  'Nuwara Eliya': 'Central',
  Galle: 'Southern',
  Matara: 'Southern',
  Hambantota: 'Southern',
  Jaffna: 'Northern',
  Kilinochchi: 'Northern',
  Mannar: 'Northern',
  Vavuniya: 'Northern',
  Mullaitivu: 'Northern',
  Batticaloa: 'Eastern',
  Ampara: 'Eastern',
  Trincomalee: 'Eastern',
  Kurunegala: 'North Western',
  Puttalam: 'North Western',
  Anuradhapura: 'North Central',
  Polonnaruwa: 'North Central',
  Badulla: 'Uva',
  Monaragala: 'Uva',
  Ratnapura: 'Sabaragamuwa',
  Kegalle: 'Sabaragamuwa',
};

const PROVINCES = ['All', 'Central', 'Eastern', 'North Central', 'North Western', 'Northern', 'Sabaragamuwa', 'Southern', 'Uva', 'Western'];

const getPinnedRegion = (coordinates = []) => {
  if (coordinates.length === 0) return SRI_LANKA_REGION;
  if (coordinates.length === 1) {
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.18),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.18),
  };
};

const getDistrictName = (hotel = {}) => {
  const nestedName = hotel.place?.district?.name || hotel.districtData?.name || hotel.districtInfo?.name;
  const directName = typeof hotel.district === 'string' ? hotel.district : hotel.district?.name;
  const fallback = hotel.location || hotel.address_text;
  return String(nestedName || directName || fallback || 'Other').trim() || 'Other';
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getNumericId = (value) => {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : null;
};

const getHotelId = (hotel) => String(hotel?._id || hotel?.hotel_id || hotel?.id || '');

const makeDistrictSelection = (id, name) => {
  const numericId = getNumericId(id);
  const cleanName = String(name || '').trim();
  if (!numericId && !cleanName) return null;
  return { id: numericId, name: cleanName || 'Selected District' };
};

const hotelMatchesDistrict = (hotel, district) => {
  if (!district) return true;

  const hotelDistrictId = getNumericId(hotel?.district_id);
  if (district.id && hotelDistrictId === district.id) return true;

  return !!district.name && normalizeText(getDistrictName(hotel)) === normalizeText(district.name);
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

// ─── Featured Hotel Card ────────────────────────────────────────────────────
const FeaturedCard = memo(({ item, onPress, displayCurrency }) => {
  const meta = getHotelMeta(item);
  const price = getHotelNightlyPriceLkr(item);

  return (
    <TouchableOpacity
      style={[ls.featCard, { width: FEAT_W, height: FEAT_H }]}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
    >
      <FallbackImage
        uri={getHotelImageCandidates(item)}
        style={StyleSheet.absoluteFill}
        iconName="bed-outline"
        iconSize={42}
        placeholderColor={meta.color + '22'}
        placeholderIconColor={meta.color}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.78)']}
          style={StyleSheet.absoluteFill}
        />
      </FallbackImage>

      <View style={ls.featTopRow}>
        <View style={[ls.typeBadge, { backgroundColor: meta.color }]}>
          <Text style={ls.typeBadgeEmoji}>{meta.emoji}</Text>
          <Text style={ls.typeBadgeLabel}>{meta.label}</Text>
        </View>
        {Number(item.rating) > 0 && (
          <View style={ls.featRatingBadge}>
            <Ionicons name="star" size={11} color={colors.warning} />
            <Text style={ls.featRatingText}>{Number(item.rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={ls.featBottom}>
        {Number(item.star_class) > 0 && (
          <View style={ls.starRowInline}>
            {Array.from({ length: Math.min(5, Number(item.star_class)) }).map((_, i) => (
              <Ionicons key={i} name="star" size={10} color={colors.warning} />
            ))}
          </View>
        )}
        <Text style={ls.featName} numberOfLines={1}>{item.name}</Text>
        <View style={ls.featLocRow}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
          <Text style={ls.featLoc} numberOfLines={1}>
            {item.address_text || getDistrictName(item)}
          </Text>
        </View>
        {price ? (
          <View style={ls.featPriceRow}>
            <Text style={ls.featPrice}>{formatHotelPrice(price, displayCurrency)}</Text>
            <Text style={ls.featPriceSub}> /night</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

// ─── District Card (visual picker) ──────────────────────────────────────────
const DistrictCard = memo(({ item, onPress, index }) => {
  const accent = DISTRICT_ACCENTS[index % DISTRICT_ACCENTS.length];
  const cover = item.cover ? getHotelImageCandidates(item.cover) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={[ls.districtCardAlt, { width: COL_W }]}
      onPress={() => onPress(item)}
    >
      {cover ? (
        <FallbackImage
          uri={cover}
          style={StyleSheet.absoluteFill}
          iconName="bed-outline"
          iconSize={44}
          placeholderColor={accent}
          placeholderIconColor="rgba(255,255,255,0.35)"
        />
      ) : (
        <LinearGradient
          colors={[accent, accent + 'CC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.82)']}
        style={ls.cardGradAlt}
      />

      <View style={[ls.cardProvinceBadgeAlt, { backgroundColor: accent }]}>
        <Text style={ls.cardProvinceBadgeTextAlt}>{item.province ? item.province.toUpperCase() : 'SRI LANKA'}</Text>
      </View>

      <View style={ls.cardNumberBadgeAlt}>
        <Ionicons name="bed" size={10} color={colors.white} />
        <Text style={ls.cardNumberTextAlt}>{item.count}</Text>
      </View>

      <View style={ls.cardContentAlt}>
        <View style={ls.cardNameRowAlt}>
          <Text style={ls.cardNameAlt} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={ls.cardHintAlt} numberOfLines={1}>{item.count} stays available</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Hotel Grid Card ───────────────────────────────────────────────────────
const HotelGridCard = memo(({ item, isSelected, onPress, displayCurrency, selectionMode, plannerSelected, onToggleTrip }) => {
  const meta = getHotelMeta(item);
  const price = getHotelNightlyPriceLkr(item);
  const hasPlannerAction = selectionMode;

  return (
    <TouchableOpacity
      style={[
        ls.hotelCard,
        { width: COL_W, height: HOTEL_H },
        isSelected && ls.hotelCardSelected,
        plannerSelected && ls.hotelCardPlannerSelected,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
    >
      <FallbackImage
        uri={getHotelImageCandidates(item)}
        style={StyleSheet.absoluteFill}
        iconName="bed-outline"
        iconSize={36}
        placeholderColor={meta.color + '22'}
        placeholderIconColor={meta.color}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.86)']}
          style={ls.hotelGrad}
        />
      </FallbackImage>

      <View style={[ls.hotelTypePin, { backgroundColor: meta.color + 'EE' }]}>
        <Text style={ls.hotelTypeEmoji}>{meta.emoji}</Text>
      </View>

      {price ? (
        <View style={ls.hotelPriceBadge}>
          <Text style={ls.hotelPriceText}>{formatHotelPrice(price, displayCurrency)}</Text>
          <Text style={ls.hotelPriceSub}>/nt</Text>
        </View>
      ) : null}

      {Number(item.rating) > 0 && (
        <View style={ls.hotelRating}>
          <Ionicons name="star" size={10} color={colors.warning} />
          <Text style={ls.hotelRatingText}>{Number(item.rating).toFixed(1)}</Text>
        </View>
      )}

      <View style={[ls.hotelContent, hasPlannerAction && ls.hotelContentPlanner]}>
        <Text style={ls.hotelName} numberOfLines={1}>{item.name}</Text>
        <View style={ls.hotelLocRow}>
          <Ionicons name="location" size={10} color="rgba(255,255,255,0.85)" />
          <Text style={ls.hotelLoc} numberOfLines={1}>
            {item.address_text || getDistrictName(item)}
          </Text>
        </View>
        {hasPlannerAction ? (
          <View style={ls.hotelActionRow}>
            <View style={ls.detailsHint}>
              <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={ls.detailsHintText}>Details</Text>
            </View>
            {plannerSelected ? (
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Pressable
                  style={[ls.plannerCheck, ls.plannerCheckActive, { paddingHorizontal: 6 }]}
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    // Pass to toggle, which we will change to 'Edit'
                    onToggleTrip?.(item);
                  }}
                >
                  <Text style={ls.plannerCheckText}>{plannerSelected.nights || 1}nt · Edit</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={ls.plannerCheck}
                onPress={(event) => {
                  event?.stopPropagation?.();
                  onToggleTrip?.(item);
                }}
              >
                <Ionicons name="add" size={14} color={colors.white} />
                <Text style={ls.plannerCheckText}>Select</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

// ─── Map Section ────────────────────────────────────────────────────────────
const MapSection = memo(({
  hotels,
  selectedHotelId,
  selectedHotel,
  onMarkerPress,
  onClearSelection,
  onViewDetails,
  displayCurrency,
  onScrollToTop,
  selectionMode,
  isPlannerMode,
  planner,
}) => {
  const mapRef = useRef(null);
  const regionRef = useRef(SRI_LANKA_REGION);
  const [mapReady, setMapReady] = useState(false);
  const [mapLaidOut, setMapLaidOut] = useState(false);

  const pinned = useMemo(
    () => hotels.map((hotel) => ({ hotel, coords: getHotelCoords(hotel) })).filter((item) => item.coords),
    [hotels]
  );

  const region = useMemo(() => {
    const coords = pinned.map((item) => item.coords);
    return getPinnedRegion(coords);
  }, [pinned]);

  const selectedCoordinate = selectedHotel ? getHotelCoords(selectedHotel) : null;

  const fitAllHotels = useCallback((animated = true) => {
    if (!mapRef.current) return;

    if (pinned.length > 1) {
      mapRef.current.fitToCoordinates(
        pinned.map((item) => item.coords),
        { edgePadding: { top: 24, right: 68, bottom: 28, left: 28 }, animated }
      );
      return;
    }

    regionRef.current = region;
    mapRef.current.animateToRegion(region, animated ? 450 : 0);
  }, [pinned, region]);

  const handleResetMap = useCallback(() => {
    onClearSelection();
    fitAllHotels(true);
    onScrollToTop?.();
  }, [fitAllHotels, onClearSelection, onScrollToTop]);

  const changeZoom = useCallback((factor) => {
    const current = regionRef.current || region;
    const nextRegion = {
      ...current,
      latitudeDelta: Math.min(Math.max(current.latitudeDelta * factor, 0.005), 8),
      longitudeDelta: Math.min(Math.max(current.longitudeDelta * factor, 0.005), 8),
    };
    regionRef.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 250);
  }, [region]);

  useEffect(() => {
    if (!mapReady || !mapLaidOut) return;
    regionRef.current = region;
    const timers = [0, 250].map((delay) =>
      setTimeout(() => fitAllHotels(false), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [fitAllHotels, mapLaidOut, mapReady, region]);

  useEffect(() => {
    if (!selectedCoordinate) return;

    const current = regionRef.current || region;
    const latitudeDelta = Math.min(current.latitudeDelta, 0.06);
    const longitudeDelta = Math.min(current.longitudeDelta, 0.06);
    const nextRegion = {
      latitude: selectedCoordinate.latitude - latitudeDelta * 0.22,
      longitude: selectedCoordinate.longitude,
      latitudeDelta,
      longitudeDelta,
    };

    regionRef.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 350);
  }, [region, selectedCoordinate?.latitude, selectedCoordinate?.longitude]);

  const selectedMeta = getHotelMeta(selectedHotel);
  const selectedPrice = selectedHotel ? getHotelNightlyPriceLkr(selectedHotel) : 0;
  const selectedDescription = selectedHotel
    ? selectedHotel.description || selectedHotel.address_text || getDistrictName(selectedHotel)
    : '';

  return (
    <View style={ls.mapWrap}>
      <View style={ls.mapBox} onLayout={() => setMapLaidOut(true)}>
        {pinned.length > 0 ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            scrollEnabled
            zoomEnabled
            zoomTapEnabled
            pitchEnabled={false}
            rotateEnabled={false}
            onMapReady={() => setMapReady(true)}
            onRegionChangeComplete={(nextRegion) => {
              regionRef.current = nextRegion;
            }}
            onPress={(e) => {
              if (e.nativeEvent.action === 'marker-press') return;
              onClearSelection();
            }}
          >
            {pinned.map(({ hotel, coords }) => {
              const hotelId = getHotelId(hotel);
              const isSelected = selectedHotelId === hotelId;
              const isPlannerSelected = isPlannerMode && planner?.selectedHotels?.some(h => getHotelId(h) === hotelId);
              const meta = getHotelMeta(hotel);

              if (Platform.OS === 'ios') {
                return (
                  <Marker
                    key={`${hotelId}_${isSelected}`}
                    coordinate={coords}
                    title={hotel.name}
                    description={hotel.address_text || getDistrictName(hotel)}
                    tracksViewChanges={false}
                    anchor={{ x: 0.5, y: 1 }}
                    zIndex={isSelected ? 10 : 1}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      onMarkerPress(hotel);
                    }}
                  >
                    <View style={ls.markerWrap}>
                      <View style={[
                        ls.markerBubble,
                        { backgroundColor: isSelected ? colors.danger : (isPlannerSelected ? colors.danger : meta.color) },
                        isSelected && ls.markerBubbleSelected,
                      ]}>
                        <Text style={ls.markerEmoji}>{meta.emoji}</Text>
                      </View>
                      <View style={[ls.markerStem, { borderTopColor: isSelected ? colors.danger : (isPlannerSelected ? colors.danger : meta.color) }]} />
                    </View>
                  </Marker>
                );
              }

              return (
                <Marker
                  key={`${hotelId}_${isSelected}`}
                  coordinate={coords}
                  title={hotel.name}
                  description={hotel.address_text || getDistrictName(hotel)}
                  pinColor={isSelected ? colors.danger : (isPlannerSelected ? colors.danger : meta.color)}
                  zIndex={isSelected ? 10 : 1}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onMarkerPress(hotel);
                  }}
                />
              );
            })}
          </MapView>
        ) : (
          <View style={ls.noPinsOverlay}>
            <Ionicons name="map-outline" size={36} color={colors.textMuted} />
            <Text style={ls.noPinsText}>No mapped locations yet</Text>
          </View>
        )}

        {pinned.length > 0 ? (
          <>
            <View style={ls.mapTitleBadge}>
              <Ionicons name="map" size={12} color={colors.primary} />
              <Text style={ls.mapTitleText}>Locations</Text>
              <View style={ls.mapTitleSep} />
              <Ionicons name="location" size={11} color={colors.accent} />
              <Text style={ls.mapPinsCountText}>{pinned.length} pinned</Text>
              {isPlannerMode && planner?.selectedHotels && planner.selectedHotels.length > 0 && (
                <>
                  <View style={ls.mapTitleSep} />
                  <Ionicons name="checkmark-circle" size={11} color={colors.danger} />
                  <Text style={[ls.mapPinsCountText, { color: colors.danger }]}>
                    {planner.selectedHotels.length} selected
                  </Text>
                </>
              )}
            </View>

            <View style={ls.mapZoomControls}>
              <Pressable style={ls.mapIconBtn} onPress={() => changeZoom(0.5)}>
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </Pressable>
              <Pressable style={ls.mapIconBtn} onPress={() => changeZoom(2)}>
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Pressable style={ls.mapResetBtn} onPress={handleResetMap}>
              <Ionicons name="scan-outline" size={14} color={colors.textPrimary} />
              <Text style={ls.mapResetText}>Reset</Text>
            </Pressable>
          </>
        ) : null}

        {selectedHotel && selectedCoordinate ? (
          <View style={ls.mapDetailCard}>
            <View style={[ls.mapDetailThumb, { backgroundColor: selectedMeta.color + '18' }]}>
              <FallbackImage
                uri={getHotelImageCandidates(selectedHotel)}
                style={StyleSheet.absoluteFill}
                iconName="bed-outline"
                iconSize={24}
                placeholderColor={selectedMeta.color + '16'}
                placeholderIconColor={selectedMeta.color}
              />
              <View style={[ls.mapDetailEmojiBadge, { backgroundColor: selectedMeta.color }]}>
                <Text style={ls.mapDetailEmoji}>{selectedMeta.emoji}</Text>
              </View>
            </View>

            <Pressable style={ls.mapDetailBody} onPress={() => onViewDetails(selectedHotel)}>
              <View style={ls.mapDetailTopLine}>
                <View style={[ls.mapDetailTypePill, { backgroundColor: selectedMeta.color + '14' }]}>
                  <Text style={[ls.mapDetailType, { color: selectedMeta.color }]} numberOfLines={1}>
                    {selectedMeta.label}
                  </Text>
                </View>
                <Text style={ls.mapDetailDistrict} numberOfLines={1}>
                  {getDistrictName(selectedHotel)}
                </Text>
              </View>
              <Text style={ls.mapDetailName} numberOfLines={1}>{selectedHotel.name}</Text>
              <Text style={ls.mapDetailSub} numberOfLines={1}>
                {selectedPrice ? `${formatHotelPrice(selectedPrice, displayCurrency)} / night` : 'Tap details to see more'}
              </Text>
              <Text style={ls.mapDetailDescription} numberOfLines={1}>
                {selectedDescription}
              </Text>
            </Pressable>

            <View style={ls.mapDetailActions}>
              <Pressable style={ls.mapDetailClose} onPress={onClearSelection}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
              <Pressable style={ls.mapDetailBtn} onPress={() => onViewDetails(selectedHotel)}>
                <Ionicons name={selectionMode ? 'checkmark' : 'arrow-forward'} size={18} color={colors.white} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
});

// ─── Main Screen ────────────────────────────────────────────────────────────
const HotelListScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { districtId: paramDistrictId, districtName: paramDistrictName, plannerMode } = route?.params || {};
  const planner = useTripPlanner();
  const isPlannerMode = !!plannerMode && !!planner?.isPlanning;
  const plannerDistrict = isPlannerMode
    ? makeDistrictSelection(planner?.selectedDistrict?.district_id, planner?.selectedDistrict?.name)
    : null;
  const routeDistrict = useMemo(
    () => plannerDistrict || makeDistrictSelection(paramDistrictId, paramDistrictName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plannerDistrict?.id, plannerDistrict?.name, paramDistrictId, paramDistrictName]
  );
  const hasRouteDistrict = !!routeDistrict;
  const [selectedDistrict, setSelectedDistrict] = useState(routeDistrict);
  const placeCentroid = useMemo(
    () => (isPlannerMode ? computeCentroid(planner?.selectedPlaces) : null),
    [isPlannerMode, planner?.selectedPlaces]
  );
  const plannerSelectedPlaceIds = useMemo(() => {
    if (!isPlannerMode) return null;
    const set = new Set();
    (planner?.selectedPlaces || []).forEach((p) => {
      const id = Number(p?.place_id || p?.id || 0);
      if (id) set.add(id);
    });
    return set;
  }, [isPlannerMode, planner?.selectedPlaces]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All');
  // In planner mode, pre-select the filter chip that matches the chosen hotel preference
  const initialPrefFilter = isPlannerMode ? getPrefFilterKey(planner?.preferences?.hotelType) : 'all';
  const [typeFilter, setTypeFilter] = useState(initialPrefFilter);
  // Track whether the current filter was auto-set from planner preferences (used for 'Pref' badge)
  const [isPrefFilter, setIsPrefFilter] = useState(isPlannerMode && initialPrefFilter !== 'any');
  const [sortKey, setSortKey] = useState('rating');
  const [displayCurrency, setDisplayCurrency] = useState('LKR');
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showToTop, setShowToTop] = useState(false);

  const [nightsModalHotel, setNightsModalHotel] = useState(null);
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  });

  useEffect(() => {
    if (nightsModalHotel && planner?.selectedHotels) {
      const existing = planner.selectedHotels.find(h => getHotelId(h) === getHotelId(nightsModalHotel));
      if (existing?.checkIn) setCheckInDate(new Date(existing.checkIn));
      if (existing?.checkOut) setCheckOutDate(new Date(existing.checkOut));
    }
  }, [nightsModalHotel, planner?.selectedHotels]);

  const [datePickerMode, setDatePickerMode] = useState(null);
  const listRef = useRef(null);
  const headerHeightRef = useRef(0);

  useEffect(() => {
    setSelectedDistrict(routeDistrict);
    setSelectedHotelId(null);
    setSearch('');
    setSelectedProvince('All');
    // In planner mode keep the preference-driven filter; otherwise reset
    if (!isPlannerMode) {
      setTypeFilter('all');
      setIsPrefFilter(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeDistrict]);

  // Sync filter chip when planner preference changes (e.g. user goes back and picks different type)
  useEffect(() => {
    if (!isPlannerMode) return;
    const nextKey = getPrefFilterKey(planner?.preferences?.hotelType);
    setTypeFilter(nextKey);
    setIsPrefFilter(nextKey !== 'any');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlannerMode, planner?.preferences?.hotelType]);

  const fetchHotels = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const params = {};
      if (routeDistrict?.id) params.districtId = routeDistrict.id;
      else if (routeDistrict?.name) params.district = routeDistrict.name;
      const res = await getHotelsApi(params);
      setHotels(res?.data?.hotels || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load hotels'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [routeDistrict]);

  useFocusEffect(useCallback(() => { fetchHotels(); }, [fetchHotels]));

  const handleHotelPress = useCallback(
    (hotel) => {
      navigation.navigate('HotelDetails', { hotel });
    },
    [navigation]
  );

  const handleToggleTripHotel = useCallback(
    (hotel) => {
      const isExisting = planner?.selectedHotels?.some(h => getHotelId(h) === getHotelId(hotel));
      const tripNightsCap = planner?.preferences?.nights ? Math.max(1, Number(planner?.preferences?.nights)) : null;
      const usedOthers = planner?.selectedHotels?.reduce((sum, h) => {
        if (getHotelId(h) === getHotelId(hotel)) return sum;
        return sum + (h.nights || 1);
      }, 0) || 0;

      if (!isExisting && tripNightsCap && usedOthers >= tripNightsCap) {
        Alert.alert('Nights Limit Reached', `You have already allocated all ${tripNightsCap} nights to other hotels. Remove or reduce nights from other hotels first.`);
        return;
      }

      setNightsModalHotel(hotel);
    },
    [planner]
  );

  const handlePlannerContinue = useCallback(() => {
    if (!planner?.selectedHotels || planner.selectedHotels.length === 0) return;
    navigateToPlannerBudget(navigation);
  }, [navigation, planner?.selectedHotels]);

  const handleDistrictSelect = useCallback((district) => {
    setSelectedDistrict(makeDistrictSelection(district?.id, district?.name));
    setSearch('');
    setSelectedProvince('All');
    setSelectedHotelId(null);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setSelectedHotelId(null);
  }, []);

  const handleTypeFilterChange = useCallback((key) => {
    setTypeFilter(key);
    setIsPrefFilter(false); // user manually changed it, clear pref badge
    setSelectedHotelId(null);
  }, []);

  const handleBackFromDistrict = useCallback(() => {
    if (isPlannerMode) {
      navigateToPlannerPreferences(navigation);
      return;
    }
    if (hasRouteDistrict) {
      navigation.goBack();
    } else {
      setSelectedDistrict(null);
      setSearch('');
      setSelectedProvince('All');
      setTypeFilter('all');
      setSelectedHotelId(null);
    }
  }, [navigation, hasRouteDistrict, isPlannerMode]);

  const districtList = useMemo(() => {
    const map = new Map();
    hotels.forEach((h) => {
      const name = getDistrictName(h);
      const id = getNumericId(h.district_id);
      const key = id ? `id:${id}` : `name:${normalizeText(name)}`;
      if (!map.has(key)) {
        map.set(key, { id, name, count: 0, cover: null, province: DISTRICT_TO_PROVINCE[name] || 'Sri Lanka' });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (!entry.name || entry.name === 'Other') {
        entry.name = name;
        entry.province = DISTRICT_TO_PROVINCE[name] || 'Sri Lanka';
      }
      if (!entry.cover && (h.coverImage || h.image_url)) entry.cover = h;
      if (!entry.cover) entry.cover = h;
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.name === 'Other') return 1;
      if (b.name === 'Other') return -1;
      return b.count - a.count;
    });
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    let list = hotels.slice();
    if (selectedDistrict) {
      list = list.filter((h) => hotelMatchesDistrict(h, selectedDistrict));
    }
    if (isPlannerMode) {
      // In planner mode the chip IS the preference filter — use hotelMatchesPrefType
      // 'any' means show all; any other pref-chip key filters by preference category
      const activePrefKey = typeFilter !== 'all' ? typeFilter : 'any';
      list = list.filter((h) => hotelMatchesPrefType(h, activePrefKey));
    } else if (typeFilter !== 'all') {
      // Normal browse mode: filter by exact hotel_type
      list = list.filter((h) => String(h.hotel_type || '').toLowerCase() === typeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((h) =>
        (h.name || '').toLowerCase().includes(q) ||
        (h.address_text || '').toLowerCase().includes(q) ||
        getDistrictName(h).toLowerCase().includes(q)
      );
    }
    if (isPlannerMode && (placeCentroid || plannerSelectedPlaceIds?.size)) {
      list.sort((a, b) => {
        const aLinked = plannerSelectedPlaceIds?.has(Number(a?.nearby_place_id || a?.place_id || 0));
        const bLinked = plannerSelectedPlaceIds?.has(Number(b?.nearby_place_id || b?.place_id || 0));
        if (aLinked !== bLinked) return aLinked ? -1 : 1;
        if (placeCentroid) {
          const da = haversineKm(placeCentroid.lat, placeCentroid.lng, a?.lat, a?.lng);
          const db = haversineKm(placeCentroid.lat, placeCentroid.lng, b?.lat, b?.lng);
          if (Number.isFinite(da) || Number.isFinite(db)) return (da ?? Infinity) - (db ?? Infinity);
        }
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });
    } else if (sortKey === 'rating') list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    else if (sortKey === 'priceAsc') list.sort((a, b) => getHotelNightlyPriceLkr(a) - getHotelNightlyPriceLkr(b));
    else if (sortKey === 'priceDesc') list.sort((a, b) => getHotelNightlyPriceLkr(b) - getHotelNightlyPriceLkr(a));
    return list;
  }, [hotels, selectedDistrict, typeFilter, search, sortKey, isPlannerMode, placeCentroid, plannerSelectedPlaceIds]);

  const selectedHotel = useMemo(
    () => filteredHotels.find((hotel) => getHotelId(hotel) === selectedHotelId) || null,
    [filteredHotels, selectedHotelId]
  );

  useEffect(() => {
    if (selectedHotelId && !selectedHotel) {
      setSelectedHotelId(null);
    }
  }, [selectedHotelId, selectedHotel]);

  const handleClearHotelSelection = useCallback(() => {
    setSelectedHotelId(null);
  }, []);

  const handleScrollToTop = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  }, []);
  const handleListScroll = useCallback((e) => {
    const next = e.nativeEvent.contentOffset.y > 350;
    setShowToTop((prev) => (prev === next ? prev : next));
  }, []);

  const handleMapMarkerPress = useCallback((hotel) => {
    const hotelId = getHotelId(hotel);
    if (selectedHotelId === hotelId) {
      setSelectedHotelId(null);
      return;
    }

    setSelectedHotelId(hotelId);
    const index = filteredHotels.findIndex((item) => getHotelId(item) === hotelId);
    if (index >= 0) {
      const rowIndex = Math.floor(index / NUM_COLUMNS);
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: rowIndex, animated: true, viewPosition: 0.1 });
      }, 120);
    }
  }, [filteredHotels, selectedHotelId]);

  const featuredHotels = useMemo(() =>
    [...hotels]
      .filter((h) => Number(h.rating) > 0)
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
      .slice(0, 6),
    [hotels]
  );

  const showDistrictPicker = !isPlannerMode && !selectedDistrict && !search.trim() && (typeFilter === 'all' || typeFilter === 'any');
  // In planner mode the pref chip is auto-selected so don't count it as a user filter
  const isDefaultFilter = isPlannerMode
    ? typeFilter === 'all' || typeFilter === getPrefFilterKey(planner?.preferences?.hotelType)
    : typeFilter === 'all';
  const activeFilterCount = [!isDefaultFilter, sortKey !== 'rating', displayCurrency !== 'LKR'].filter(Boolean).length;
  const selectedDistrictName = selectedDistrict?.name || '';

  const filteredDistrictList = useMemo(() => {
    let list = districtList;
    if (selectedProvince !== 'All') {
      list = list.filter((d) => d.province === selectedProvince);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.province.toLowerCase().includes(q)
      );
    }
    return list;
  }, [districtList, selectedProvince, search]);

  const popularDistricts = useMemo(() => districtList.slice(0, 6), [districtList]);

  const data = showDistrictPicker ? filteredDistrictList : filteredHotels;

  const keyExtractor = useCallback(
    (item, idx) => String(item._id || item.id || item.name || idx),
    []
  );

  const renderItem = useCallback(({ item, index }) => {
    if (showDistrictPicker) {
      return <DistrictCard item={item} index={index} onPress={handleDistrictSelect} />;
    }
    const plannerSelectedHotel = isPlannerMode ? planner?.selectedHotels?.find(h => getHotelId(h) === getHotelId(item)) : undefined;
    return (
      <HotelGridCard
        item={item}
        isSelected={getHotelId(item) === selectedHotelId}
        onPress={handleHotelPress}
        displayCurrency={displayCurrency}
        selectionMode={isPlannerMode}
        plannerSelected={plannerSelectedHotel}
        onToggleTrip={handleToggleTripHotel}
      />
    );
  }, [displayCurrency, handleDistrictSelect, handleHotelPress, handleToggleTripHotel, isPlannerMode, planner?.selectedHotels, selectedHotelId, showDistrictPicker]);

  const renderHeader = () => {
    if (showDistrictPicker) {
      return (
        <View style={{ paddingTop: 16, paddingHorizontal: 16 }}>
          {/* Main Green Card */}
          <View style={ls.greenCard}>
            <View style={ls.greenCardTop}>
              <View style={ls.greenCardIconWrap}>
                <Ionicons name="bed" size={24} color={colors.white} />
              </View>
              <View style={ls.greenCardTextWrap}>
                <Text style={ls.greenCardEyebrow}>HOTEL FINDER</Text>
                <Text style={ls.greenCardTitle}>Choose where to stay</Text>
                <Text style={ls.greenCardSub}>Pick a district and browse hotels nearby.</Text>
              </View>
            </View>
            <View style={ls.greenCardBottom}>
              <View style={ls.greenCardPill}>
                <Ionicons name="map-outline" size={14} color={colors.white} />
                <View>
                  <Text style={ls.greenCardPillValue}>{districtList.length}</Text>
                  <Text style={ls.greenCardPillLabel}>Districts</Text>
                </View>
              </View>
              <View style={ls.greenCardPill}>
                <Ionicons name="bed-outline" size={14} color={colors.white} />
                <View>
                  <Text style={ls.greenCardPillValue}>{hotels.length}</Text>
                  <Text style={ls.greenCardPillLabel}>Hotels</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Search Box */}
          <View style={ls.searchBoxOut}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              style={ls.searchInputOut}
              placeholder="Search hotel districts..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Provinces Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={ls.provinceScroll}
            contentContainerStyle={ls.provinceScrollContent}
          >
            {PROVINCES.map((p) => {
              const active = selectedProvince === p;
              return (
                <Pressable
                  key={p}
                  style={[ls.provinceChip, active && ls.provinceChipActive]}
                  onPress={() => setSelectedProvince(p)}
                >
                  <Text style={[ls.provinceChipText, active && ls.provinceChipTextActive]}>{p}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />}

          {/* Popular Stay Districts */}
          {!loading && popularDistricts.length > 0 && !search && selectedProvince === 'All' && (
            <View style={ls.popularSection}>
              <View style={ls.popHeader}>
                <View style={ls.popHeaderTitleWrap}>
                  <Ionicons name="star" size={16} color={colors.warning} />
                  <Text style={ls.popHeaderTitle}>Popular Stay Districts</Text>
                </View>
                <Text style={ls.popHeaderSub}>Most hotels</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={ls.popScrollContent}
              >
                {popularDistricts.map((d, i) => {
                  const cover = d.cover ? getHotelImageCandidates(d.cover) : null;
                  const accent = DISTRICT_ACCENTS[i % DISTRICT_ACCENTS.length];
                  return (
                    <TouchableOpacity
                      key={d.id || d.name}
                      style={ls.popCard}
                      onPress={() => handleDistrictSelect(d)}
                      activeOpacity={0.88}
                    >
                      {cover ? (
                        <FallbackImage
                          uri={cover}
                          style={StyleSheet.absoluteFill}
                          iconName="bed-outline"
                          iconSize={32}
                          placeholderColor={accent + '30'}
                          placeholderIconColor={accent}
                        />
                      ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: accent }]} />
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={ls.popCardTop}>
                        <View style={[ls.popCardPillLeft, { backgroundColor: accent }]}>
                          <Text style={ls.popCardPillLeftText}>{d.province.toUpperCase()}</Text>
                        </View>
                        <View style={ls.popCardPillRight}>
                          <Ionicons name="bed" size={10} color={colors.white} />
                          <Text style={ls.popCardPillRightText}>{d.count}</Text>
                        </View>
                      </View>
                      <View style={ls.popCardBottom}>
                        <Text style={ls.popCardName} numberOfLines={1}>{d.name}</Text>
                        <Text style={ls.popCardCount}>{d.count} stays available</Text>
                        <View style={ls.popCardBtn}>
                          <Text style={ls.popCardBtnText}>Find hotels</Text>
                          <Ionicons name="arrow-forward" size={12} color={colors.white} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Grid Title Row */}
          {!loading && (
            <View style={ls.gridTitleRowOut}>
              <View style={ls.popHeaderTitleWrap}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
                <Text style={ls.popHeaderTitle}>All Hotel Districts</Text>
              </View>
              <Text style={ls.popHeaderSub}>{filteredDistrictList.length} found</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ls.hero}
        >
          <View style={ls.heroTopRow}>
            {selectedDistrict ? (
              <Pressable style={ls.heroIconBtn} onPress={handleBackFromDistrict}>
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>
            ) : (
              <View style={ls.heroIconBtn}>
                <Text style={{ fontSize: 22 }}>🏨</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={ls.heroTag}>
                {isPlannerMode ? 'Trip planner · Step 4' : selectedDistrict ? 'District View' : 'Where to Stay'}
              </Text>
              <Text style={ls.heroTitle} numberOfLines={2}>
                {isPlannerMode
                  ? `Choose a hotel in ${selectedDistrictName || 'your district'}`
                  : selectedDistrict
                    ? selectedDistrictName
                    : 'Find Your Perfect\nStay in Sri Lanka'}
              </Text>
              {isPlannerMode ? (
                <Text style={ls.heroPlannerSub} numberOfLines={1}>
                  Tap a hotel to add it to your trip plan
                </Text>
              ) : null}
            </View>
            {isPlannerMode ? (
              <Pressable
                style={ls.heroCancelBtn}
                onPress={() => {
                  planner?.cancelPlanning?.();
                  navigateToTripList(navigation);
                }}
              >
                <Text style={ls.heroCancelText}>Cancel</Text>
              </Pressable>
            ) : (
              <View style={ls.heroCountPill}>
                <Ionicons name="bed" size={13} color={colors.primary} />
                <Text style={ls.heroCountText}>{filteredHotels.length}</Text>
              </View>
            )}
          </View>

          <View style={ls.searchRow}>
            <View style={ls.searchShell}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={handleSearchChange}
                placeholder={selectedDistrict ? `Search in ${selectedDistrictName}...` : 'Search hotels, areas, districts...'}
                placeholderTextColor={colors.textMuted}
                style={ls.searchInput}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {search ? (
                <Pressable hitSlop={10} onPress={() => handleSearchChange('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        {!showDistrictPicker && (
          <View style={ls.typeFilterWrap}>
            <Pressable style={ls.stickyFilterBtn} onPress={() => setFilterOpen(true)}>
              <Ionicons name="options-outline" size={18} color={colors.primary} />
              {activeFilterCount > 0 && (
                <View style={ls.stickyFilterDot}>
                  <Text style={ls.filterDotText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={ls.typeFilterRow}
              style={{ flex: 1 }}
            >
              {(isPlannerMode ? PREF_FILTERS : TYPE_FILTERS).map((f) => {
                // In planner mode chips use pref keys ('any','budget'…); 'any' acts as 'all'
                const chipKey = isPlannerMode ? f.key : f.key;
                const active = isPlannerMode
                  ? typeFilter === chipKey || (chipKey === 'any' && typeFilter === 'all')
                  : typeFilter === chipKey;
                const col = f.color || colors.primary;
                const isPref = active && isPrefFilter;
                return (
                  <Pressable
                    key={f.key}
                    style={[
                      ls.typeChip,
                      active && { backgroundColor: col, borderColor: col },
                      isPref && ls.typeChipPref,
                    ]}
                    onPress={() => {
                      // In planner mode, map 'any' back to 'all' for the state
                      const nextKey = isPlannerMode && f.key === 'any' ? 'all' : f.key;
                      handleTypeFilterChange(nextKey);
                    }}
                  >
                    <Text style={ls.typeChipEmoji}>{f.emoji}</Text>
                    <Text style={[ls.typeChipLabel, active && ls.typeChipLabelActive]}>
                      {f.label}
                    </Text>
                    {isPref && (
                      <View style={ls.prefBadge}>
                        <Text style={ls.prefBadgeText}>Pref</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <ErrorText message={error} />

        {selectedDistrict && !loading && (
          <MapSection
            hotels={filteredHotels}
            selectedHotelId={selectedHotelId}
            selectedHotel={selectedHotel}
            onMarkerPress={handleMapMarkerPress}
            onClearSelection={handleClearHotelSelection}
            onViewDetails={handleHotelPress}
            displayCurrency={displayCurrency}
            onScrollToTop={handleScrollToTop}
            selectionMode={isPlannerMode}
            isPlannerMode={isPlannerMode}
            planner={planner}
          />
        )}

        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
        )}

        {!loading && data.length > 0 && (
          <View style={ls.gridTitleRow}>
            <View style={ls.sectionTitleGroup}>
              <Ionicons
                name={selectedDistrict ? 'bed' : 'search'}
                size={16}
                color={colors.primary}
              />
              <Text style={ls.sectionTitle}>
                {selectedDistrict
                  ? `Hotels in ${selectedDistrictName}`
                  : `${filteredHotels.length} ${filteredHotels.length === 1 ? 'Hotel' : 'Hotels'}`}
              </Text>
            </View>
            {(search || !isDefaultFilter) ? (
              <Pressable
                style={ls.clearBtn}
                onPress={() => {
                  handleSearchChange('');
                  // In planner mode, reset to the pref chip rather than 'all'
                  const resetKey = isPlannerMode ? getPrefFilterKey(planner?.preferences?.hotelType) : 'all';
                  handleTypeFilterChange(resetKey);
                }}
              >
                <Ionicons name="close" size={11} color={colors.accent} />
                <Text style={ls.clearBtnText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const filterModal = (
    <Modal
      visible={filterOpen}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => setFilterOpen(false)}
    >
      <View style={ls.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterOpen(false)} />
        <View style={[ls.filterSheet, { paddingBottom: Math.max(insets.bottom, 24) + (Platform.OS === 'android' ? 16 : 0) }]}>
          <View style={ls.filterSheetHandle} />
          <View style={ls.filterSheetHeader}>
            <Text style={ls.filterSheetTitle}>Sort & Display</Text>
            <Pressable style={ls.filterSheetClose} onPress={() => setFilterOpen(false)}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            <Text style={ls.filterSectionLabel}>Sort By</Text>
            <View style={ls.filterOptionRow}>
              {SORT_OPTIONS.map((opt) => {
                const active = sortKey === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    style={[ls.filterOption, active && ls.filterOptionActive]}
                    onPress={() => setSortKey(opt.key)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={15}
                      color={active ? colors.white : colors.textSecondary}
                    />
                    <Text style={[ls.filterOptionText, active && ls.filterOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={ls.filterSectionLabel}>Currency</Text>
            <View style={ls.filterOptionRow}>
              {HOTEL_CURRENCIES.map((c) => {
                const active = displayCurrency === c.code;
                return (
                  <Pressable
                    key={c.code}
                    style={[ls.filterOption, active && ls.filterOptionActive]}
                    onPress={() => setDisplayCurrency(c.code)}
                  >
                    <Text style={[ls.filterOptionText, active && ls.filterOptionTextActive]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Pressable style={ls.filterApplyBtn} onPress={() => setFilterOpen(false)}>
            <Text style={ls.filterApplyText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  const plannerBottomBar = isPlannerMode ? (
    <View style={[plannerStyles.bottomBar, { bottom: Math.max(insets.bottom, 15) + 75, zIndex: 999 }]}>
      <View style={plannerStyles.bottomTopRow}>
        <View style={plannerStyles.countPill}>
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
          <Text style={plannerStyles.countPillText}>
            {planner?.selectedHotels?.length || 0} selected
          </Text>
        </View>

        {(planner?.selectedHotels?.length || 0) > 0 ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              planner.clearSelectedHotels?.();
              setSelectedHotelId(null);
            }}
            style={plannerStyles.clearLink}
          >
            <Ionicons name="close-circle" size={14} color={colors.textMuted} />
            <Text style={plannerStyles.clearLinkText}>Clear all</Text>
          </Pressable>
        ) : null}

        <View style={{ flex: 1 }} />

        <Pressable
          style={[plannerStyles.nextBtn, !(planner?.selectedHotels?.length > 0) && plannerStyles.nextBtnDisabled]}
          disabled={!(planner?.selectedHotels?.length > 0)}
          onPress={handlePlannerContinue}
        >
          <Text style={plannerStyles.nextBtnText}>Next</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </Pressable>
      </View>

      {(planner?.selectedHotels?.length || 0) > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={plannerStyles.selectedChipRow}
          style={plannerStyles.bottomChipScroll}
        >
          {(planner.selectedHotels || []).map((hotel) => (
            <View key={getHotelId(hotel)} style={plannerStyles.selectedChip}>
              <FallbackImage
                uri={getHotelImageCandidates(hotel)}
                style={plannerStyles.selectedChipImage}
                iconName="bed-outline"
                iconSize={12}
              />
              <Text style={[plannerStyles.selectedChipText, { flexShrink: 1 }]} numberOfLines={1}>
                {hotel.name}
              </Text>
              {hotel.nights ? (
                <View style={{ backgroundColor: colors.white, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: -2, borderWidth: 1, borderColor: colors.primary + '20' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: colors.primary }}>{hotel.nights}nt</Text>
                </View>
              ) : null}
              <Pressable
                hitSlop={8}
                onPress={() => {
                  planner.removeSelectedHotel?.(getHotelId(hotel));
                  if (selectedHotelId === getHotelId(hotel)) {
                    setSelectedHotelId(null);
                  }
                }}
                style={plannerStyles.selectedChipClose}
              >
                <Ionicons name="close" size={11} color={colors.white} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={plannerStyles.bottomHintText}>
          Tap Select on a card, or tap a card to read details first.
        </Text>
      )}
    </View>
  ) : null;

  if (selectedDistrict) {
    return (
      <SafeAreaView style={ls.safe} edges={['top']}>
        <FlatList
          ref={listRef}
          style={ls.cardList}
          data={filteredHotels}
          extraData={selectedHotelId}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={ls.gridRow}
          renderItem={renderItem}
          ListHeaderComponent={
            <View onLayout={(e) => { headerHeightRef.current = e.nativeEvent.layout.height; }}>
              {renderHeader()}
            </View>
          }
          getItemLayout={(_, index) => {
            const headerHeight = headerHeightRef.current || 550;
            return {
              length: HOTEL_ROW_H,
              offset: headerHeight + HOTEL_ROW_H * index,
              index,
            };
          }}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={
                  !search && typeFilter === 'all'
                    ? `No hotels in ${selectedDistrictName}`
                    : 'No hotels found'
                }
                subtitle="Try another filter or add hotels from the admin panel."
                icon="search-outline"
              />
            ) : null
          }
          contentContainerStyle={[ls.listContent, isPlannerMode && { paddingBottom: insets.bottom + 200 }]}
          onScrollToIndexFailed={(info) => {
            const nextIndex = Math.min(info.index, Math.max(Math.ceil(filteredHotels.length / NUM_COLUMNS) - 1, 0));
            const headerHeight = headerHeightRef.current || 550;
            listRef.current?.scrollToOffset({ offset: Math.max(headerHeight + nextIndex * HOTEL_ROW_H, 0), animated: true });
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewPosition: 0.1 });
            }, 350);
          }}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={60}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchHotels({ silent: true }); }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {showToTop ? (
          <Pressable
            style={[ls.toTopBtn, { bottom: insets.bottom + (isPlannerMode ? 180 : 88) }]}
            onPress={handleScrollToTop}
          >
            <Ionicons name="arrow-up" size={22} color={colors.primary} />
          </Pressable>
        ) : null}

        {plannerBottomBar}

        {filterModal}

        <Modal
          visible={!!nightsModalHotel}
          transparent
          animationType="fade"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setNightsModalHotel(null)}
        >
          <View style={ls.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setNightsModalHotel(null)} />
            <View style={[ls.filterSheet, { maxHeight: '85%', paddingBottom: Math.max(insets.bottom, 24) + (Platform.OS === 'android' ? 16 : 0) }]}>
              <View style={ls.filterSheetHandle} />
              {(() => {
                const tripNightsCap = planner?.preferences?.nights ? Math.max(1, Number(planner?.preferences?.nights)) : null;
                const usedOthers = planner?.selectedHotels?.reduce((sum, h) => {
                  if (getHotelId(h) === getHotelId(nightsModalHotel)) return sum;
                  return sum + (h.nights || 1);
                }, 0) || 0;

                const maxNightsAllowed = tripNightsCap ? Math.max(1, tripNightsCap - usedOthers) : null;

                let currentNights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / 86400000));
                // Automatically adjust if it exceeds cap
                if (maxNightsAllowed && currentNights > maxNightsAllowed) {
                  currentNights = maxNightsAllowed;
                }

                const totalUsed = usedOthers + currentNights;
                const nightlyPrice = nightsModalHotel ? getHotelNightlyPriceLkr(nightsModalHotel) : 0;
                const totalEstimatedCost = nightlyPrice * currentNights;

                const handleIncrement = () => {
                  if (maxNightsAllowed && currentNights >= maxNightsAllowed) return;
                  const newOut = new Date(checkInDate);
                  newOut.setDate(newOut.getDate() + currentNights + 1);
                  setCheckOutDate(newOut);
                };

                const handleDecrement = () => {
                  if (currentNights <= 1) return;
                  const newOut = new Date(checkInDate);
                  newOut.setDate(newOut.getDate() + currentNights - 1);
                  setCheckOutDate(newOut);
                };

                const mapPoints = [];
                if (nightsModalHotel?.lat && nightsModalHotel?.lng) {
                  mapPoints.push({
                    key: 'hotel',
                    latitude: parseFloat(nightsModalHotel.lat),
                    longitude: parseFloat(nightsModalHotel.lng),
                    type: 'hotel',
                    title: nightsModalHotel.name,
                  });
                }
                planner?.selectedPlaces?.forEach((p) => {
                  if (p.lat && p.lng) {
                    mapPoints.push({
                      key: `place-${p._id || p.id}`,
                      latitude: parseFloat(p.lat),
                      longitude: parseFloat(p.lng),
                      type: 'place',
                      title: p.name,
                    });
                  }
                });

                return (
                  <>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
                      {mapPoints.length > 0 && (
                        <View style={{ height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
                          <MapView
                            style={StyleSheet.absoluteFill}
                            initialRegion={getPinnedRegion(mapPoints)}
                            scrollEnabled={true}
                            zoomEnabled={true}
                            pitchEnabled={false}
                            rotateEnabled={false}
                          >
                            {mapPoints.map(pt => {
                              const isHotel = pt.type === 'hotel';
                              const bgColor = isHotel ? colors.warning : colors.primary;

                              if (Platform.OS === 'ios') {
                                return (
                                  <Marker
                                    key={pt.key}
                                    coordinate={pt}
                                    title={pt.title}
                                    anchor={{ x: 0.5, y: 1 }}
                                    zIndex={isHotel ? 10 : 1}
                                  >
                                    <View style={{ alignItems: 'center' }}>
                                      <View style={{ width: isHotel ? 32 : 26, height: isHotel ? 32 : 26, borderRadius: isHotel ? 16 : 13, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white, elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } }}>
                                        <Text style={{ fontSize: isHotel ? 14 : 11 }}>{isHotel ? '🏨' : '📍'}</Text>
                                      </View>
                                      <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: bgColor, marginTop: -2 }} />
                                    </View>
                                  </Marker>
                                );
                              }

                              return (
                                <Marker
                                  key={pt.key}
                                  coordinate={pt}
                                  title={pt.title}
                                  pinColor={bgColor}
                                  zIndex={isHotel ? 10 : 1}
                                />
                              );
                            })}
                          </MapView>
                          <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }}>
                            <Ionicons name="map" size={12} color={colors.primary} />
                            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary }}>
                              Hotel + {Math.max(0, mapPoints.length - 1)} stop{mapPoints.length - 1 !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                      )}
                      <View style={{ marginBottom: 20 }}>
                        <Text style={ls.filterSheetTitle}>📅 Select Your Stay Dates</Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, fontWeight: '600' }} numberOfLines={1}>
                          {nightsModalHotel?.name}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <Pressable style={ls.filterOption} onPress={() => setDatePickerMode('checkIn')}>
                          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                          <View>
                            <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>Check-in</Text>
                            <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '800' }}>{checkInDate.toLocaleDateString()}</Text>
                          </View>
                        </Pressable>
                        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                        <Pressable style={ls.filterOption} onPress={() => setDatePickerMode('checkOut')}>
                          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                          <View>
                            <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>Check-out</Text>
                            <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '800' }}>{checkOutDate.toLocaleDateString()}</Text>
                          </View>
                        </Pressable>
                      </View>

                      <View style={{ backgroundColor: colors.surface2, padding: 12, borderRadius: 12, marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '800' }}>
                            🌙 {currentNights} night{currentNights !== 1 ? 's' : ''} · {checkInDate.toLocaleDateString()} – {checkOutDate.toLocaleDateString()}
                          </Text>
                        </View>
                        {tripNightsCap && (
                          <View style={{ marginBottom: 12 }}>
                            <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' }}>
                              {usedOthers > 0 && <View style={{ width: `${Math.min(100, (usedOthers / tripNightsCap) * 100)}%`, height: '100%', backgroundColor: colors.border }} />}
                              <View style={{ width: `${Math.min(100, (currentNights / tripNightsCap) * 100)}%`, height: '100%', backgroundColor: colors.primary, borderLeftWidth: usedOthers > 0 ? 1 : 0, borderLeftColor: colors.background }} />
                            </View>
                            <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'right', marginTop: 4, fontWeight: '700' }}>
                              {totalUsed} / {tripNightsCap} nights used
                            </Text>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                          <Pressable
                            onPress={handleDecrement}
                            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: currentNights <= 1 ? 0.4 : 1 }}
                          >
                            <Ionicons name="remove" size={20} color={colors.textPrimary} />
                          </Pressable>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>{currentNights}</Text>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase' }}>Night{currentNights !== 1 ? 's' : ''}</Text>
                          </View>
                          <Pressable
                            onPress={handleIncrement}
                            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primary + '14', alignItems: 'center', justifyContent: 'center', opacity: (maxNightsAllowed && currentNights >= maxNightsAllowed) ? 0.4 : 1 }}
                          >
                            <Ionicons name="add" size={20} color={colors.primary} />
                          </Pressable>
                        </View>
                      </View>

                      {nightlyPrice > 0 && (
                        <View style={{ backgroundColor: colors.success + '14', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 }}>
                          <Text style={{ fontSize: 12, color: colors.success, fontWeight: '800' }}>
                            Estimated cost: {formatHotelPrice(totalEstimatedCost, displayCurrency)}
                          </Text>
                          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                            ({currentNights} × {formatHotelPrice(nightlyPrice, displayCurrency)}/night)
                          </Text>
                        </View>
                      )}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                      <Pressable
                        style={[ls.heroCancelBtn, { flex: 1, backgroundColor: colors.surface2, borderColor: colors.border, alignItems: 'center', paddingVertical: 14 }]}
                        onPress={() => {
                          const existing = planner?.selectedHotels?.some(h => getHotelId(h) === getHotelId(nightsModalHotel));
                          if (existing) {
                            planner?.removeSelectedHotel?.(getHotelId(nightsModalHotel));
                            if (selectedHotelId === getHotelId(nightsModalHotel)) {
                              setSelectedHotelId(null);
                            }
                          }
                          setNightsModalHotel(null);
                        }}
                      >
                        <Text style={[ls.heroCancelText, { color: colors.textPrimary, fontSize: 14 }]}>
                          {planner?.selectedHotels?.some(h => getHotelId(h) === getHotelId(nightsModalHotel)) ? 'Remove' : 'Cancel'}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[ls.filterApplyBtn, { flex: 2, marginBottom: 0 }]}
                        onPress={() => {
                          planner?.addOrUpdateSelectedHotel?.(nightsModalHotel, {
                            checkIn: checkInDate.toISOString().slice(0, 10),
                            checkOut: checkOutDate.toISOString().slice(0, 10),
                            nights: currentNights
                          });
                          // Removed setSelectedHotelId(...) so the map no longer zooms/focuses automatically when added to the trip.
                          setNightsModalHotel(null);
                        }}
                      >
                        <Text style={ls.filterApplyText}>
                          {planner?.selectedHotels?.some(h => getHotelId(h) === getHotelId(nightsModalHotel)) ? 'Update Selection' : 'Confirm Selection'}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>

        <DateTimePickerModal
          isVisible={!!datePickerMode}
          mode="date"
          date={datePickerMode === 'checkIn' ? checkInDate : checkOutDate}
          minimumDate={datePickerMode === 'checkOut' ? new Date(checkInDate.getTime() + 86400000) : new Date()}
          onConfirm={(date) => {
            const tripNightsCap = planner?.preferences?.nights ? Math.max(1, Number(planner?.preferences?.nights)) : null;
            const usedOthers = planner?.selectedHotels?.reduce((sum, h) => {
              if (getHotelId(h) === getHotelId(nightsModalHotel)) return sum;
              return sum + (h.nights || 1);
            }, 0) || 0;
            const maxNightsAllowed = tripNightsCap ? Math.max(1, tripNightsCap - usedOthers) : null;

            if (datePickerMode === 'checkIn') {
              setCheckInDate(date);
              let newDiff = Math.ceil((checkOutDate - date) / 86400000);
              if (newDiff < 1) newDiff = 1;
              if (maxNightsAllowed && newDiff > maxNightsAllowed) newDiff = maxNightsAllowed;
              const nextOut = new Date(date);
              nextOut.setDate(nextOut.getDate() + newDiff);
              setCheckOutDate(nextOut);
            } else {
              let diff = Math.ceil((date - checkInDate) / 86400000);
              if (diff < 1) diff = 1;
              if (maxNightsAllowed && diff > maxNightsAllowed) diff = maxNightsAllowed;
              const nextOut = new Date(checkInDate);
              nextOut.setDate(nextOut.getDate() + diff);
              setCheckOutDate(nextOut);
            }
            setDatePickerMode(null);
          }}
          onCancel={() => setDatePickerMode(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ls.safe} edges={['top']}>
      {isPlannerMode ? (
        <View style={plannerStyles.banner}>
          <Pressable style={plannerStyles.bannerBack} onPress={() => navigateToPlannerPreferences(navigation)}>
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={plannerStyles.bannerEyebrow}>Trip planner · Pick hotel</Text>
            <Text style={plannerStyles.bannerTitle} numberOfLines={1}>
              {planner?.preferences?.hotelType && planner.preferences.hotelType !== 'any'
                ? `${planner.preferences.hotelType} · `
                : ''}
              {selectedDistrict?.name || 'Hotels'}
              {placeCentroid ? ' · sorted by nearest places' : ''}
            </Text>
          </View>
        </View>
      ) : null}
      <FlatList
        ref={listRef}
        data={data}
        extraData={selectedHotelId}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={ls.gridRow}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={
                showDistrictPicker
                  ? 'No districts yet'
                  : selectedDistrict && !search && typeFilter === 'all'
                    ? `No hotels in ${selectedDistrictName}`
                    : 'No hotels found'
              }
              subtitle={
                showDistrictPicker
                  ? 'Pull down to refresh.'
                  : selectedDistrict
                    ? 'Try another district or add hotels from the admin panel.'
                    : 'Try a different search or filter.'
              }
              icon={showDistrictPicker ? 'map-outline' : 'search-outline'}
            />
          ) : null
        }
        contentContainerStyle={[ls.listContent, isPlannerMode && { paddingBottom: insets.bottom + 200 }]}
        getItemLayout={(_, index) => {
          const rowH = showDistrictPicker ? 220 + GAP : HOTEL_ROW_H;
          return {
            length: rowH,
            offset: rowH * index,
            index,
          };
        }}
        onScrollToIndexFailed={(info) => {
          const rowH = showDistrictPicker ? 220 + GAP : HOTEL_ROW_H;
          const maxRowIndex = Math.max(Math.ceil(data.length / NUM_COLUMNS) - 1, 0);
          const nextIndex = Math.min(info.index, maxRowIndex);
          listRef.current?.scrollToOffset({
            offset: Math.max(nextIndex * rowH - 6, 0),
            animated: true,
          });
        }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={60}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchHotels({ silent: true }); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {showToTop ? (
        <Pressable
          style={[ls.toTopBtn, { bottom: insets.bottom + (isPlannerMode ? 96 : 88) }]}
          onPress={handleScrollToTop}
        >
          <Ionicons name="arrow-up" size={22} color={colors.white} />
        </Pressable>
      ) : null}

      {plannerBottomBar}

      {/* ── Filter / Sort Modal ── */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={ls.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterOpen(false)} />
          <View style={[ls.filterSheet, { paddingBottom: Math.max(insets.bottom, 24) + (Platform.OS === 'android' ? 16 : 0) }]}>
            <View style={ls.filterSheetHandle} />
            <View style={ls.filterSheetHeader}>
              <Text style={ls.filterSheetTitle}>Sort & Display</Text>
              <Pressable style={ls.filterSheetClose} onPress={() => setFilterOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={ls.filterSectionLabel}>Sort By</Text>
              <View style={ls.filterOptionRow}>
                {SORT_OPTIONS.map((opt) => {
                  const active = sortKey === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      style={[ls.filterOption, active && ls.filterOptionActive]}
                      onPress={() => setSortKey(opt.key)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={15}
                        color={active ? colors.white : colors.textSecondary}
                      />
                      <Text style={[ls.filterOptionText, active && ls.filterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={ls.filterSectionLabel}>Currency</Text>
              <View style={ls.filterOptionRow}>
                {HOTEL_CURRENCIES.map((c) => {
                  const active = displayCurrency === c.code;
                  return (
                    <Pressable
                      key={c.code}
                      style={[ls.filterOption, active && ls.filterOptionActive]}
                      onPress={() => setDisplayCurrency(c.code)}
                    >
                      <Text style={[ls.filterOptionText, active && ls.filterOptionTextActive]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable style={ls.filterApplyBtn} onPress={() => setFilterOpen(false)}>
              <Text style={ls.filterApplyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fixedTopSection: { backgroundColor: colors.background, zIndex: 1 },
  cardList: { flex: 1 },
  listContent: { paddingBottom: 120 },

  // Hero
  hero: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  heroIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTag: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  heroPlannerSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  filterDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterDotText: { color: colors.white, fontSize: 9, fontWeight: '900' },

  // Search
  searchRow: { marginBottom: 6 },
  searchShell: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, height: '100%' },

  // Type filter
  typeFilterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingLeft: 12,
  },
  stickyFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary + '14',
    borderWidth: 1,
    borderColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginVertical: 8,
  },
  stickyFilterDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  heroCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroCancelText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  heroCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  heroCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  typeFilterRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipEmoji: { fontSize: 14 },
  typeChipLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  typeChipLabelActive: { color: colors.white },
  // Extra glow ring when chip was auto-set from planner preferences
  typeChipPref: {
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 6,
  },
  prefBadge: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  prefBadgeText: { fontSize: 9, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },

  // Section
  section: { marginTop: 18 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: colors.textPrimary },
  sectionSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  featRow: { paddingHorizontal: 16, gap: 12 },

  // Grid title row
  gridTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.accent + '14',
  },
  clearBtnText: { color: colors.accent, fontSize: 12, fontWeight: '700' },

  // Featured
  featCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  featTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
  },
  typeBadgeEmoji: { fontSize: 13 },
  typeBadgeLabel: { color: colors.white, fontSize: 11, fontWeight: '800' },
  featRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  featRatingText: { color: colors.textPrimary, fontSize: 11, fontWeight: '900' },
  featBottom: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  starRowInline: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  featName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  featLoc: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '600', flex: 1 },
  featPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  featPrice: { color: colors.white, fontSize: 16, fontWeight: '900' },
  featPriceSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },

  // District grid card
  districtCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
  },
  districtAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 4,
  },
  districtTopRow: {
    position: 'absolute',
    top: 12, right: 12,
  },
  districtCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  districtCountText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  districtBottom: {
    position: 'absolute',
    left: 14, right: 14, bottom: 14,
  },
  districtTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  districtTag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  districtName: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 21,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  districtCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  districtCtaText: { color: colors.white, fontSize: 11, fontWeight: '800' },

  // Map
  mapWrap: { marginTop: 8, marginHorizontal: 16 },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mapHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapHeaderTitle: { fontSize: 15, fontWeight: '900', color: colors.textPrimary },
  mapPinsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent + '14',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  mapPinsCountText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  mapTitleBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  mapTitleText: { fontSize: 11, fontWeight: '800', color: colors.textPrimary },
  mapTitleSep: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  mapBox: {
    height: Platform.OS === 'ios' ? 210 : 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mapZoomControls: {
    position: 'absolute',
    top: 52,
    right: 10,
    gap: 7,
  },
  mapIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  mapResetBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  mapResetText: { fontSize: 11, fontWeight: '800', color: colors.textPrimary },
  noPinsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface3 + 'E0',
    gap: 8,
  },
  noPinsText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },

  // iOS custom markers. Android uses native pins for better map performance.
  markerWrap: { alignItems: 'center' },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerBubbleSelected: {
    borderColor: colors.danger,
    transform: [{ scale: 1.12 }],
  },
  markerEmoji: { fontSize: 16 },
  markerStem: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },

  // Map detail card
  mapDetailCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  mapDetailThumb: {
    width: 66,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapDetailEmojiBadge: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  mapDetailEmoji: { fontSize: 13 },
  mapDetailBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  mapDetailTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  mapDetailTypePill: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  mapDetailName: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  mapDetailType: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mapDetailDistrict: {
    flex: 1,
    minWidth: 0,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  mapDetailSub: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '900',
    marginBottom: 2,
  },
  mapDetailDescription: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  mapDetailActions: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  mapDetailBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  mapDetailClose: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Hotel grid
  gridRow: {
    paddingHorizontal: 16,
    marginBottom: GAP,
    gap: GAP,
  },
  hotelCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
  },
  hotelCardSelected: {
    borderColor: colors.accent,
    elevation: 7,
    shadowOpacity: 0.24,
  },
  hotelCardPlannerSelected: {
    borderColor: colors.primary,
    elevation: 7,
    shadowOpacity: 0.28,
  },
  hotelGrad: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '60%',
  },
  hotelTypePin: {
    position: 'absolute',
    top: 9,
    left: 9,
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelTypeEmoji: { fontSize: 14 },
  hotelPriceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
    maxWidth: '78%',
  },
  hotelPriceText: { color: colors.white, fontSize: 11, fontWeight: '900', flexShrink: 1 },
  hotelPriceSub: { color: 'rgba(255,255,255,0.8)', fontSize: 8, fontWeight: '700' },
  hotelRating: {
    position: 'absolute',
    bottom: 56,
    right: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hotelRatingText: { color: colors.textPrimary, fontSize: 10, fontWeight: '900' },
  hotelSelectBadge: {
    position: 'absolute',
    bottom: 54,
    left: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hotelSelectText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  hotelContent: {
    position: 'absolute',
    left: 11, right: 11, bottom: 11,
  },
  hotelName: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hotelLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hotelLoc: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', flex: 1 },
  hotelContentPlanner: {
    gap: 6,
    paddingBottom: 0,
  },
  hotelActionRow: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  detailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    flex: 1,
  },
  detailsHintText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    fontWeight: '800',
  },
  plannerCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 64,
    height: 30,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  plannerCheckActive: {
    backgroundColor: colors.success,
    borderColor: colors.white,
  },
  plannerCheckText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  hotelSelectBadgeInline: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },

  // Filter modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '70%',
  },
  filterSheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterSheetTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  filterSheetClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  filterOptionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterOptionText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  filterOptionTextActive: { color: colors.white },
  filterApplyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  filterApplyText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  toTopBtn: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 999,
  },
});

const plannerStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerBack: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bannerTitle: { color: colors.white, fontSize: 14, fontWeight: '900', marginTop: 2, textTransform: 'capitalize' },
  bottomBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  bottomTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '14',
    borderWidth: 1,
    borderColor: colors.primary + '33',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countPillText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  clearLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearLinkText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  nextBtnDisabled: { backgroundColor: colors.primary + '55' },
  nextBtnText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  bottomChipScroll: { maxHeight: 44 },
  bottomHintText: { color: colors.textMuted, fontSize: 12, fontWeight: '700', paddingHorizontal: 4 },
  selectedChipRow: { gap: 8, paddingRight: 8 },
  selectedChip: {
    maxWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '35',
    borderRadius: 16,
    paddingLeft: 4,
    paddingRight: 6,
    paddingVertical: 4,
  },
  selectedChipClose: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  selectedChipImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  selectedChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 160,
  },
});

// --- New District / Hotel Pick Styles ---
const extraLs = StyleSheet.create({
  introAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  introCopyAlt: { flex: 1, paddingRight: 12 },
  eyebrowAlt: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleAlt: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 1 },
  subtitleAlt: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  countPillAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '14',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  countPillTextAlt: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  searchWrapAlt: { paddingHorizontal: 16, marginBottom: 16, marginTop: 4 },
  searchBoxAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
  },
  searchInputAlt: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  featuredSectionAlt: { marginBottom: 16 },
  sectionHeaderAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleGroupAlt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitleAlt: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  sectionSubAlt: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  featuredRowAlt: { paddingHorizontal: 16, gap: 12 },
  featureCardAlt: {
    width: 220,
    height: 76,
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  featureImageAlt: { width: 54, height: 54, borderRadius: 12 },
  featureBodyAlt: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  featureNameAlt: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  featureSubAlt: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  featureDotAlt: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  gridTitleRowAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  districtCardAlt: {
    width: COL_W,
    height: 220,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradAlt: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '65%',
  },
  cardProvinceBadgeAlt: {
    position: 'absolute',
    top: 10, left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardProvinceBadgeTextAlt: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  cardNumberBadgeAlt: {
    position: 'absolute',
    top: 10, right: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardNumberTextAlt: { color: colors.white, fontSize: 11, fontWeight: '900' },
  cardContentAlt: {
    position: 'absolute',
    left: 12, right: 12, bottom: 12,
  },
  cardNameRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  cardNameAlt: {
    flex: 1,
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardHintAlt: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },

  // New Styles for the exact screenshot
  greenCard: {
    backgroundColor: '#0E7C5F',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  greenCardTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  greenCardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenCardTextWrap: { flex: 1 },
  greenCardEyebrow: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  greenCardTitle: { color: colors.white, fontSize: 24, fontWeight: '900', marginBottom: 6 },
  greenCardSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  greenCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  greenCardPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greenCardPillValue: { color: colors.white, fontSize: 16, fontWeight: '900' },
  greenCardPillLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
  searchBoxOut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInputOut: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 10,
  },
  provinceScroll: { marginBottom: 24 },
  provinceScrollContent: { gap: 10 },
  provinceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  provinceChipActive: { backgroundColor: '#0E7C5F', borderColor: '#0E7C5F' },
  provinceChipText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  provinceChipTextActive: { color: colors.white },
  popularSection: { marginBottom: 24 },
  popHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  popHeaderTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  popHeaderTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  popHeaderSub: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  popScrollContent: { gap: 16, paddingRight: 16 },
  popCard: {
    width: 280,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
  },
  popCardTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  popCardPillLeft: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  popCardPillLeftText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  popCardPillRight: { backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  popCardPillRightText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  popCardBottom: {
    position: 'absolute',
    left: 16, right: 16, bottom: 16,
  },
  popCardName: { color: colors.white, fontSize: 24, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  popCardCount: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginBottom: 12 },
  popCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  popCardBtnText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  gridTitleRowOut: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});

Object.assign(ls, extraLs);

export default HotelListScreen;
