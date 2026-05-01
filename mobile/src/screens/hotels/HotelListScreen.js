import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  ActivityIndicator,
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

const TYPE_FILTERS = [
  { key: 'all', emoji: '🌍', label: 'All', color: colors.primary },
  ...Object.entries(TYPE_META).map(([key, v]) => ({ key, ...v })),
];

const SORT_OPTIONS = [
  { key: 'rating',    label: 'Top Rated',  icon: 'star-outline' },
  { key: 'priceAsc',  label: 'Low Price',  icon: 'arrow-down-outline' },
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
      style={[ls.districtCard, { width: COL_W, height: DISTRICT_H }]}
      onPress={() => onPress(item)}
      activeOpacity={0.9}
    >
      {cover ? (
        <FallbackImage
          uri={cover}
          style={StyleSheet.absoluteFill}
          iconName="map-outline"
          iconSize={32}
          placeholderColor={accent + '30'}
          placeholderIconColor={accent}
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
        colors={['transparent', 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[ls.districtAccent, { backgroundColor: accent }]} />

      <View style={ls.districtTopRow}>
        <View style={ls.districtCountPill}>
          <Ionicons name="bed" size={11} color={colors.white} />
          <Text style={ls.districtCountText}>{item.count}</Text>
        </View>
      </View>

      <View style={ls.districtBottom}>
        <View style={ls.districtTagRow}>
          <Ionicons name="location" size={11} color="rgba(255,255,255,0.85)" />
          <Text style={ls.districtTag}>DISTRICT</Text>
        </View>
        <Text style={ls.districtName} numberOfLines={2}>{item.name}</Text>
        <View style={ls.districtCta}>
          <Text style={ls.districtCtaText}>Explore</Text>
          <Ionicons name="arrow-forward" size={12} color={colors.white} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Hotel Grid Card ───────────────────────────────────────────────────────
const HotelGridCard = memo(({ item, isSelected, onPress, displayCurrency }) => {
  const meta = getHotelMeta(item);
  const price = getHotelNightlyPriceLkr(item);

  return (
    <TouchableOpacity
      style={[ls.hotelCard, { width: COL_W, height: HOTEL_H }, isSelected && ls.hotelCardSelected]}
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

      <View style={ls.hotelContent}>
        <Text style={ls.hotelName} numberOfLines={1}>{item.name}</Text>
        <View style={ls.hotelLocRow}>
          <Ionicons name="location" size={10} color="rgba(255,255,255,0.85)" />
          <Text style={ls.hotelLoc} numberOfLines={1}>
            {item.address_text || getDistrictName(item)}
          </Text>
        </View>
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
                        { backgroundColor: meta.color },
                        isSelected && ls.markerBubbleSelected,
                      ]}>
                        <Text style={ls.markerEmoji}>{meta.emoji}</Text>
                      </View>
                      <View style={[ls.markerStem, { borderTopColor: meta.color }]} />
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
                  pinColor={isSelected ? colors.accent : meta.color}
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
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
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
  const { districtId: paramDistrictId, districtName: paramDistrictName } = route?.params || {};
  const routeDistrict = useMemo(
    () => makeDistrictSelection(paramDistrictId, paramDistrictName),
    [paramDistrictId, paramDistrictName]
  );
  const hasRouteDistrict = !!routeDistrict;
  const [selectedDistrict, setSelectedDistrict] = useState(routeDistrict);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState('rating');
  const [displayCurrency, setDisplayCurrency] = useState('LKR');
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showToTop, setShowToTop] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    setSelectedDistrict(routeDistrict);
    setSelectedHotelId(null);
    setSearch('');
    setTypeFilter('all');
  }, [routeDistrict]);

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
    (hotel) => navigation.navigate('HotelDetails', { hotel }),
    [navigation]
  );

  const handleDistrictSelect = useCallback((district) => {
    setSelectedDistrict(makeDistrictSelection(district?.id, district?.name));
    setSearch('');
    setSelectedHotelId(null);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setSelectedHotelId(null);
  }, []);

  const handleTypeFilterChange = useCallback((key) => {
    setTypeFilter(key);
    setSelectedHotelId(null);
  }, []);

  const handleBackFromDistrict = useCallback(() => {
    if (hasRouteDistrict) {
      navigation.goBack();
    } else {
      setSelectedDistrict(null);
      setSearch('');
      setTypeFilter('all');
      setSelectedHotelId(null);
    }
  }, [navigation, hasRouteDistrict]);

  const districtList = useMemo(() => {
    const map = new Map();
    hotels.forEach((h) => {
      const name = getDistrictName(h);
      const id = getNumericId(h.district_id);
      const key = id ? `id:${id}` : `name:${normalizeText(name)}`;
      if (!map.has(key)) {
        map.set(key, { id, name, count: 0, cover: null });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (!entry.name || entry.name === 'Other') entry.name = name;
      if (!entry.cover && (h.coverImage || h.image_url || h.image)) entry.cover = h;
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
    if (typeFilter !== 'all') {
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
    if (sortKey === 'rating') list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    else if (sortKey === 'priceAsc') list.sort((a, b) => getHotelNightlyPriceLkr(a) - getHotelNightlyPriceLkr(b));
    else if (sortKey === 'priceDesc') list.sort((a, b) => getHotelNightlyPriceLkr(b) - getHotelNightlyPriceLkr(a));
    return list;
  }, [hotels, selectedDistrict, typeFilter, search, sortKey]);

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
        listRef.current?.scrollToIndex({ index: rowIndex, animated: true, viewPosition: 0.15 });
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

  const showDistrictPicker = !selectedDistrict && !search.trim() && typeFilter === 'all';
  const activeFilterCount = [typeFilter !== 'all', sortKey !== 'rating', displayCurrency !== 'LKR'].filter(Boolean).length;
  const selectedDistrictName = selectedDistrict?.name || '';

  const data = showDistrictPicker ? districtList : filteredHotels;

  const keyExtractor = useCallback(
    (item, idx) => String(item._id || item.id || item.name || idx),
    []
  );

  const renderItem = useCallback(({ item, index }) => {
    if (showDistrictPicker) {
      return <DistrictCard item={item} index={index} onPress={handleDistrictSelect} />;
    }
    return (
      <HotelGridCard
        item={item}
        isSelected={getHotelId(item) === selectedHotelId}
        onPress={handleHotelPress}
        displayCurrency={displayCurrency}
      />
    );
  }, [displayCurrency, handleDistrictSelect, handleHotelPress, selectedHotelId, showDistrictPicker]);

  const renderHeader = () => (
    <View>
      {/* ── Hero ── */}
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
              {selectedDistrict ? 'District View' : 'Where to Stay'}
            </Text>
            <Text style={ls.heroTitle} numberOfLines={2}>
              {selectedDistrict ? selectedDistrictName : 'Find Your Perfect\nStay in Sri Lanka'}
            </Text>
          </View>
          <Pressable style={ls.heroIconBtn} onPress={() => setFilterOpen(true)}>
            <Ionicons name="options-outline" size={20} color={colors.white} />
            {activeFilterCount > 0 && (
              <View style={ls.filterDot}>
                <Text style={ls.filterDotText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Search */}
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

      {/* ── Type chips (only when in hotel mode) ── */}
      {!showDistrictPicker && (
        <View style={ls.typeFilterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={ls.typeFilterRow}
          >
            {TYPE_FILTERS.map((f) => {
              const active = typeFilter === f.key;
              const col = f.color || colors.primary;
              return (
                  <Pressable
                    key={f.key}
                    style={[ls.typeChip, active && { backgroundColor: col, borderColor: col }]}
                    onPress={() => handleTypeFilterChange(f.key)}
                  >
                  <Text style={ls.typeChipEmoji}>{f.emoji}</Text>
                  <Text style={[ls.typeChipLabel, active && ls.typeChipLabelActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ErrorText message={error} />

      {/* ── Map (when district selected) ── */}
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
        />
      )}

      {loading && (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
      )}

      {/* ── Featured (only in pure discover mode) ── */}
      {showDistrictPicker && !loading && featuredHotels.length > 0 && (
        <View style={ls.section}>
          <View style={ls.sectionHeaderRow}>
            <View style={ls.sectionTitleGroup}>
              <Ionicons name="flame" size={16} color={colors.accent} />
              <Text style={ls.sectionTitle}>Top Picks</Text>
            </View>
            <Text style={ls.sectionSub}>Highest rated stays</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={ls.featRow}
          >
            {featuredHotels.map((h) => (
              <FeaturedCard
                key={h._id}
                item={h}
                onPress={handleHotelPress}
                displayCurrency={displayCurrency}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Section title for grid below ── */}
      {!loading && data.length > 0 && (
        <View style={ls.gridTitleRow}>
          <View style={ls.sectionTitleGroup}>
            <Ionicons
              name={showDistrictPicker ? 'map' : selectedDistrict ? 'bed' : 'search'}
              size={16}
              color={colors.primary}
            />
            <Text style={ls.sectionTitle}>
              {showDistrictPicker
                ? 'Explore by District'
                : selectedDistrict
                  ? `Hotels in ${selectedDistrictName}`
                  : `${filteredHotels.length} ${filteredHotels.length === 1 ? 'Hotel' : 'Hotels'}`}
            </Text>
          </View>
          {showDistrictPicker ? (
            <Text style={ls.sectionSub}>{districtList.length} districts</Text>
          ) : (search || typeFilter !== 'all') ? (
            <Pressable
              style={ls.clearBtn}
              onPress={() => { handleSearchChange(''); handleTypeFilterChange('all'); }}
            >
              <Ionicons name="close" size={11} color={colors.accent} />
              <Text style={ls.clearBtnText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );

  const filterModal = (
    <Modal
      visible={filterOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterOpen(false)}
    >
      <View style={ls.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterOpen(false)} />
        <View style={ls.filterSheet}>
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

  if (selectedDistrict) {
    return (
      <SafeAreaView style={ls.safe} edges={['top']}>
        <View style={ls.fixedTopSection}>
          {renderHeader()}
        </View>

        <FlatList
          ref={listRef}
          style={ls.cardList}
          data={filteredHotels}
          extraData={selectedHotelId}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={ls.gridRow}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: HOTEL_ROW_H,
            offset: HOTEL_ROW_H * index,
            index,
          })}
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
          contentContainerStyle={ls.listContent}
          onScrollToIndexFailed={(info) => {
            const nextIndex = Math.min(info.index, Math.max(Math.ceil(filteredHotels.length / NUM_COLUMNS) - 1, 0));
            listRef.current?.scrollToOffset({ offset: Math.max(nextIndex * HOTEL_ROW_H, 0), animated: true });
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewPosition: 0.15 });
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
            style={[ls.toTopBtn, { bottom: insets.bottom + 88 }]}
            onPress={handleScrollToTop}
          >
            <Ionicons name="arrow-up" size={22} color={colors.white} />
          </Pressable>
        ) : null}

        {filterModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ls.safe} edges={['top']}>
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
        contentContainerStyle={ls.listContent}
        onScrollToIndexFailed={(info) => {
          const maxRowIndex = Math.max(Math.ceil(data.length / NUM_COLUMNS) - 1, 0);
          const nextIndex = Math.min(info.index, maxRowIndex);
          listRef.current?.scrollToOffset({
            offset: Math.max(nextIndex * HOTEL_ROW_H - 6, 0),
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
          style={[ls.toTopBtn, { bottom: insets.bottom + 88 }]}
          onPress={handleScrollToTop}
        >
          <Ionicons name="arrow-up" size={22} color={colors.white} />
        </Pressable>
      ) : null}

      {/* ── Filter / Sort Modal ── */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={ls.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterOpen(false)} />
          <View style={ls.filterSheet}>
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderColor: colors.accent,
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
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
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

export default HotelListScreen;
