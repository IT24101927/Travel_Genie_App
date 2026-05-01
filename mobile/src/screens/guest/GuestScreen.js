import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../../constants/colors';
import FallbackImage from '../../components/common/FallbackImage';
import { useAuth } from '../../context/AuthContext';
import { getPlacesApi } from '../../api/placeApi';
import { getHotelsApi } from '../../api/hotelApi';
import { getTransportSchedulesApi } from '../../api/transportApi';
import api from '../../api/client';
import { getPlaceImageCandidates } from '../../utils/placeImages';
import { getHotelImageCandidates } from '../../utils/hotelImages';
import { formatHotelPrice, getHotelNightlyPriceLkr } from '../../utils/currencyFormat';
import {
  formatDuration,
  formatLkr,
  getBookingChannelMeta,
  getTransportTypeMeta
} from '../../utils/transportOptions';

const DISTRICT_COORDS = {
  'Colombo':      { latitude: 6.9271, longitude: 79.8612 },
  'Gampaha':      { latitude: 7.0917, longitude: 80.0000 },
  'Kalutara':     { latitude: 6.5854, longitude: 79.9607 },
  'Kandy':        { latitude: 7.2906, longitude: 80.6337 },
  'Matale':       { latitude: 7.4675, longitude: 80.6234 },
  'Nuwara Eliya': { latitude: 6.9497, longitude: 80.7891 },
  'Galle':        { latitude: 6.0535, longitude: 80.2210 },
  'Matara':       { latitude: 5.9549, longitude: 80.5550 },
  'Hambantota':   { latitude: 6.1429, longitude: 81.1212 },
  'Jaffna':       { latitude: 9.6615, longitude: 80.0255 },
  'Kilinochchi':  { latitude: 9.3803, longitude: 80.4000 },
  'Mannar':       { latitude: 8.9810, longitude: 79.9044 },
  'Vavuniya':     { latitude: 8.7514, longitude: 80.4971 },
  'Mullaitivu':   { latitude: 9.2671, longitude: 80.8128 },
  'Batticaloa':   { latitude: 7.7310, longitude: 81.6747 },
  'Ampara':       { latitude: 7.2910, longitude: 81.6724 },
  'Trincomalee':  { latitude: 8.5874, longitude: 81.2152 },
  'Kurunegala':   { latitude: 7.4863, longitude: 80.3647 },
  'Puttalam':     { latitude: 8.0362, longitude: 79.8283 },
  'Anuradhapura': { latitude: 8.3114, longitude: 80.4037 },
  'Polonnaruwa':  { latitude: 7.9403, longitude: 81.0188 },
  'Badulla':      { latitude: 6.9934, longitude: 81.0550 },
  'Monaragala':   { latitude: 6.8728, longitude: 81.3507 },
  'Ratnapura':    { latitude: 6.6828, longitude: 80.4125 },
  'Kegalle':      { latitude: 7.2513, longitude: 80.3464 },
};

const SRI_LANKA_REGION = {
  latitude: 7.85,
  longitude: 80.65,
  latitudeDelta: 8.0,
  longitudeDelta: 5.0,
};

const PROVINCE_COLORS = {
  'Western': '#0C6B4F', 'Central': '#5C4AB8', 'Southern': '#C44D2A',
  'Northern': '#1A6EA8', 'Eastern': '#0A7A60', 'North Western': '#B87D1A',
  'North Central': '#8B4513', 'Uva': '#2E7D32', 'Sabaragamuwa': '#6A1B9A',
};

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

const getHotelMeta = (hotel) =>
  TYPE_META[String(hotel?.hotel_type || '').toLowerCase()] ||
  { emoji: '🏩', color: colors.primary, label: 'Hotel' };

const FEATURES = [
  { icon: 'map-outline', label: 'Plan Trips' },
  { icon: 'bed-outline', label: 'Find Hotels' },
  { icon: 'wallet-outline', label: 'Track Expenses' },
  { icon: 'bus-outline', label: 'Book Transport' },
  { icon: 'star-outline', label: 'Write Reviews' },
  { icon: 'notifications-outline', label: 'Get Alerts' },
];

/* ── District Mini Card ── */
const DistrictMiniCard = ({ item, isHighlighted, onPress }) => {
  const bgColor = PROVINCE_COLORS[item.province] || '#3A5A4A';
  return (
    <Pressable
      style={[styles.districtCard, isHighlighted && styles.districtCardHighlight]}
      onPress={() => onPress(item)}
    >
      <FallbackImage
        uri={item.image_url}
        style={styles.districtCardImage}
        iconName="map-outline"
        iconSize={24}
        placeholderColor={bgColor}
        placeholderIconColor="rgba(255,255,255,0.4)"
      />
      <View style={styles.districtCardBody}>
        <Text style={styles.districtCardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.districtCardProv} numberOfLines={1}>{item.province}</Text>
        {item.highlights?.length > 0 && (
          <Text style={styles.districtCardHint} numberOfLines={1}>
            {item.highlights.slice(0, 2).join(' · ')}
          </Text>
        )}
      </View>
      <View style={styles.districtCardArrow}>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </View>
    </Pressable>
  );
};

/* ── Place Card (Premium) ── */
const PlaceCard = ({ item, onPress, isHighlighted }) => (
  <Pressable style={[styles.placeCard, isHighlighted && styles.placeCardHighlight]} onPress={onPress}>
    <View style={styles.placeCardImageWrap}>
      <FallbackImage
        uri={getPlaceImageCandidates(item)}
        style={styles.placeCardImage}
        iconName="image-outline"
        iconSize={28}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.placeCardGradient}
        />
      </FallbackImage>
      {item.type && (
        <View style={styles.placeTypeBadge}>
          <Ionicons name="bookmark" size={9} color={colors.white} />
          <Text style={styles.placeTypeBadgeText}>{item.type}</Text>
        </View>
      )}
    </View>
    <View style={styles.placeCardBody}>
      <Text style={styles.placeCardTitle} numberOfLines={1}>{item.name || 'Place'}</Text>
      {(item.location || item.city || item.type) ? (
        <View style={styles.placeCardRow}>
          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
          <Text style={styles.placeCardSub} numberOfLines={1}>
            {item.location || item.city || item.type}
          </Text>
        </View>
      ) : null}
    </View>
  </Pressable>
);

/* ── Hotel Card (Premium) ── */
const HotelCard = ({ item, onPress, isHighlighted }) => {
  const nightlyPrice = getHotelNightlyPriceLkr(item);
  const meta = getHotelMeta(item);
  const starClass = Number(item.star_class || 0);
  const location = item.address_text || item.location || item.city || '';

  return (
    <Pressable style={[styles.hotelCard, isHighlighted && styles.hotelCardHighlight]} onPress={onPress}>
      {/* Image with gradient overlay */}
      <View style={styles.hotelCardImageWrap}>
        <FallbackImage
          uri={getHotelImageCandidates(item)}
          style={styles.hotelCardImage}
          iconName="bed-outline"
          iconSize={32}
          placeholderColor={meta.color + '22'}
          placeholderIconColor={meta.color}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={styles.hotelCardGradient}
          />
        </FallbackImage>

        {/* Type badge */}
        <View style={[styles.hotelTypeBadge, { backgroundColor: meta.color }]}>
          <Text style={styles.hotelTypeBadgeEmoji}>{meta.emoji}</Text>
          <Text style={styles.hotelTypeBadgeLabel}>{meta.label}</Text>
        </View>

        {/* Rating badge */}
        {Number(item.rating) > 0 && (
          <View style={styles.hotelRatingBadge}>
            <Ionicons name="star" size={10} color={colors.warning} />
            <Text style={styles.hotelRatingText}>{Number(item.rating).toFixed(1)}</Text>
          </View>
        )}

        {/* Price tag on image */}
        {nightlyPrice ? (
          <View style={styles.hotelPriceTag}>
            <Text style={styles.hotelPriceTagText}>{formatHotelPrice(nightlyPrice, 'LKR')}</Text>
            <Text style={styles.hotelPriceTagSub}>/night</Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.hotelCardBody}>
        {/* Star row */}
        {starClass > 0 && (
          <View style={styles.hotelStarRow}>
            {Array.from({ length: Math.min(5, starClass) }).map((_, i) => (
              <Ionicons key={i} name="star" size={9} color={colors.warning} />
            ))}
            <Text style={styles.hotelStarLabel}>{starClass}-Star</Text>
          </View>
        )}
        <Text style={styles.hotelCardTitle} numberOfLines={1}>{item.name || 'Hotel'}</Text>
        {location ? (
          <View style={styles.hotelLocRow}>
            <Ionicons name="location-outline" size={11} color={colors.textMuted} />
            <Text style={styles.hotelLocText} numberOfLines={1}>{location}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

/* ── Transport Route Card ── */
const TransportRouteCard = ({ item, onPress }) => {
  const meta = getTransportTypeMeta(item.type);
  const bookingMeta = getBookingChannelMeta(item.bookingChannel);
  const routeTitle = item.routeName || item.routeNo || `${item.departureStation} to ${item.arrivalStation}`;

  return (
    <Pressable style={[styles.routeCard, { borderLeftColor: meta.color }]} onPress={onPress}>
      <View style={styles.routeCardTop}>
        <View style={[styles.routeTypeBadge, { backgroundColor: `${meta.color}12` }]}>
          <Ionicons name={meta.icon} size={13} color={meta.color} />
          <Text style={[styles.routeTypeText, { color: meta.color }]}>{meta.shortLabel || meta.label}</Text>
        </View>
        <View style={styles.routePricePill}>
          <Text style={styles.routePrice}>{formatLkr(item.ticketPriceLKR)}</Text>
        </View>
      </View>

      <Text style={styles.routeProvider} numberOfLines={1}>{item.provider || routeTitle}</Text>
      <Text style={styles.routeName} numberOfLines={1}>{routeTitle}</Text>

      <View style={styles.routeTicket}>
        <View style={styles.routeTicketSide}>
          <Text style={styles.routeTime}>{item.departureTime || '--:--'}</Text>
          <Text style={styles.routeStation} numberOfLines={2}>{item.departureStation}</Text>
        </View>
        <View style={styles.routeTicketMid}>
          <View style={styles.routeDot} />
          <View style={[styles.routeLine, { backgroundColor: meta.color }]} />
          <Ionicons name={meta.icon} size={18} color={meta.color} />
          <View style={[styles.routeLine, { backgroundColor: meta.color }]} />
          <Text style={[styles.routeDuration, { color: meta.color }]}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={[styles.routeTicketSide, { alignItems: 'flex-end' }]}>
          <Text style={styles.routeTime}>{item.arrivalTime || '--:--'}</Text>
          <Text style={[styles.routeStation, { textAlign: 'right' }]} numberOfLines={2}>{item.arrivalStation}</Text>
        </View>
      </View>

      <View style={styles.routeMetaRow}>
        <View style={styles.routeMetaPill}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={styles.routeMetaText} numberOfLines={1}>{(item.operatingDays || ['Daily']).slice(0, 2).join(', ')}</Text>
        </View>
        <View style={styles.routeMetaPill}>
          <Ionicons name={bookingMeta.icon} size={11} color={bookingMeta.color} />
          <Text style={[styles.routeMetaText, { color: bookingMeta.color }]} numberOfLines={1}>{bookingMeta.shortLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
};

/* ── Section Header ── */
const SectionHeader = ({ title, icon, onSeeMore }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {onSeeMore && (
      <Pressable onPress={onSeeMore} style={styles.seeMoreBtn}>
        <Text style={styles.seeMoreText}>See more</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </Pressable>
    )}
  </View>
);

/* ══════════════════════════════════════════════════ */
/* ══ MAIN GUEST SCREEN                           ══ */
/* ══════════════════════════════════════════════════ */
const GuestScreen = ({ navigation }) => {
  const { exitGuest } = useAuth();
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transportRoutes, setTransportRoutes] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingTransport, setLoadingTransport] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const mapRef = useRef(null);
  const districtListRef = useRef(null);
  const placesListRef = useRef(null);
  const hotelsListRef = useRef(null);
  const regionRef = useRef(SRI_LANKA_REGION);

  const zoomIn = useCallback(() => {
    const r = regionRef.current;
    const next = { ...r, latitudeDelta: Math.max(r.latitudeDelta / 2, 0.05), longitudeDelta: Math.max(r.longitudeDelta / 2, 0.03) };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 300);
  }, []);

  const zoomOut = useCallback(() => {
    const r = regionRef.current;
    const next = { ...r, latitudeDelta: Math.min(r.latitudeDelta * 2, 12), longitudeDelta: Math.min(r.longitudeDelta * 2, 10) };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 300);
  }, []);

  const resetMap = useCallback(() => {
    regionRef.current = SRI_LANKA_REGION;
    mapRef.current?.animateToRegion(SRI_LANKA_REGION, 500);
    setHighlightedId(null);
    setSelectedDistrict(null);
    setSelectedPlace(null);
    setSelectedHotel(null);
  }, []);

  const loadData = async () => {
    try {
      const [dRes, pRes, hRes, tRes] = await Promise.allSettled([
        api.get('/districts'),
        getPlacesApi({}),
        getHotelsApi({}),
        getTransportSchedulesApi({ page: 1, limit: 10 }),
      ]);
      if (dRes.status === 'fulfilled') setDistricts(dRes.value?.data?.data || []);
      if (pRes.status === 'fulfilled') setPlaces(pRes.value?.data?.places || pRes.value?.data || []);
      if (hRes.status === 'fulfilled') setHotels(hRes.value?.data?.hotels || hRes.value?.data || []);
      if (tRes.status === 'fulfilled') setTransportRoutes(tRes.value?.data?.schedules || []);
    } finally {
      setLoadingDistricts(false);
      setLoadingPlaces(false);
      setLoadingHotels(false);
      setLoadingTransport(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Force map to show all of Sri Lanka on load
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(SRI_LANKA_REGION, 0);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };
  const onLoginPress = useCallback(() => exitGuest(), [exitGuest]);
  const promptLogin = useCallback(() => navigation.navigate('GuestSignInPrompt'), [navigation]);

  const handleMarkerPress = useCallback((district) => {
    setHighlightedId(district.district_id);
    setSelectedDistrict(district);
    setSelectedPlace(null);
    setSelectedHotel(null);
    // Zoom into the district to show place pins
    const coords = DISTRICT_COORDS[district.name];
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        ...coords,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }, 500);
    }
    const idx = districts.findIndex((d) => d.district_id === district.district_id);
    if (idx !== -1 && districtListRef.current) {
      districtListRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
    }
  }, [districts]);

  const handleDistrictCardPress = useCallback((item) => {
    const coords = DISTRICT_COORDS[item.name];
    if (coords && mapRef.current) {
      setHighlightedId(item.district_id);
      setSelectedDistrict(item);
      setSelectedPlace(null);
      setSelectedHotel(null);
      mapRef.current.animateToRegion({
        ...coords,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      }, 500);
    } else {
      promptLogin();
    }
  }, [promptLogin]);

  // Places filtered by selected district — keeps list in sync with map pins
  const filteredPlaces = selectedDistrict
    ? places.filter((p) => {
        if (p.district_id && selectedDistrict.district_id) {
          return p.district_id === selectedDistrict.district_id;
        }
        const distName = selectedDistrict.name?.toLowerCase();
        return (
          (p.district || '').toLowerCase() === distName ||
          (p.address_text || '').toLowerCase().includes(distName)
        );
      })
    : places;

  const visiblePlaces = filteredPlaces.slice(0, 10);

  // Hotels filtered by selected district
  const filteredHotels = selectedDistrict
    ? hotels.filter((h) => {
        if (h.district_id && selectedDistrict.district_id) {
          return h.district_id === selectedDistrict.district_id;
        }
        const distName = selectedDistrict.name?.toLowerCase();
        const hotelDist = h.district || h.location || '';
        return hotelDist.toLowerCase() === distName ||
          (h.address_text || '').toLowerCase().includes(distName);
      })
    : hotels;

  const visibleHotels = filteredHotels.slice(0, 8);

  const filteredTransportRoutes = selectedDistrict
    ? transportRoutes.filter((route) => {
        const distName = selectedDistrict.name?.toLowerCase();
        return (
          Number(route.district_id) === Number(selectedDistrict.district_id) ||
          (route.district || '').toLowerCase() === distName ||
          (route.departureStation || '').toLowerCase().includes(distName) ||
          (route.arrivalStation || '').toLowerCase().includes(distName)
        );
      })
    : transportRoutes;

  const visibleTransportRoutes = filteredTransportRoutes.slice(0, 8);

  const handlePlaceMarkerPress = useCallback((place) => {
    setSelectedPlace(place);
    setSelectedHotel(null);
    const idx = visiblePlaces.findIndex((p) => p._id === place._id);
    if (idx !== -1 && placesListRef.current) {
      const CARD_W = 190;
      const GAP = 12;
      const offset = Math.max(0, idx * (CARD_W + GAP));
      setTimeout(() => {
        placesListRef.current?.scrollToOffset({ offset, animated: true });
      }, 200);
    }
  }, [visiblePlaces]);

  const handleHotelMarkerPress = useCallback((hotel) => {
    setSelectedHotel(hotel);
    setSelectedPlace(null);
    const idx = visibleHotels.findIndex((h) => h._id === hotel._id);
    if (idx !== -1 && hotelsListRef.current) {
      const CARD_W = 200;
      const GAP = 12;
      const offset = Math.max(0, idx * (CARD_W + GAP));
      setTimeout(() => {
        hotelsListRef.current?.scrollToOffset({ offset, animated: true });
      }, 200);
    }
  }, [visibleHotels]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="airplane" size={22} color={colors.primary} />
          <Text style={styles.headerTitle}>TravelGenie</Text>
        </View>
        <Pressable onPress={onLoginPress} style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Log In</Text>
          <Ionicons name="log-in-outline" size={16} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Banner ── */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, '#12A080']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroEyebrow}>✈️  TRAVEL GENIE</Text>
            <Text style={styles.heroTitle}>Explore{`\n`}Sri Lanka</Text>
            <Text style={styles.heroSub}>Discover amazing places, find the best stays, and plan your perfect trip</Text>
          </View>

          {/* Live stats */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatNum}>{districts.length}</Text>
              <Text style={styles.heroStatLbl}>Districts</Text>
            </View>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatNum}>{places.length}</Text>
              <Text style={styles.heroStatLbl}>Places</Text>
            </View>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatNum}>{hotels.length}</Text>
              <Text style={styles.heroStatLbl}>Hotels</Text>
            </View>
          </View>

          <Pressable onPress={onLoginPress} style={styles.heroBtn}>
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={styles.heroBtnText}>Sign up — it's free</Text>
          </Pressable>
        </LinearGradient>

        {/* ── Map Section ── */}
        <View style={styles.mapSection}>
          <SectionHeader title="Interactive Map" icon="map" onSeeMore={null} />
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={SRI_LANKA_REGION}
              scrollEnabled={true}
              zoomEnabled={true}
              pitchEnabled={false}
              rotateEnabled={false}
              mapPadding={{ top: 0, right: 0, bottom: 10, left: 0 }}
              onRegionChangeComplete={(r) => { regionRef.current = r; }}
              onPress={() => { setHighlightedId(null); setSelectedDistrict(null); setSelectedPlace(null); setSelectedHotel(null); }}
            >
              {/* Show all district pins */}
              {districts.map((d) => {
                const coords = DISTRICT_COORDS[d.name];
                if (!coords) return null;
                const isHL = highlightedId === d.district_id;
                return (
                  <Marker
                    key={`d_${d.district_id}_${isHL}`}
                    coordinate={coords}
                    pinColor={isHL ? 'red' : '#17A34A'}
                    onPress={(e) => { e.stopPropagation?.(); handleMarkerPress(d); }}
                  />
                );
              })}

              {/* Show place pins when a district is selected */}
              {selectedDistrict && places
                .filter((p) => {
                  if (p.district_id && selectedDistrict.district_id) {
                    return p.district_id === selectedDistrict.district_id;
                  }
                  const distName = selectedDistrict.name?.toLowerCase();
                  return (
                    (p.district || '').toLowerCase() === distName ||
                    (p.address_text || '').toLowerCase().includes(distName)
                  );
                })
                .slice(0, 8)
                .map((p) => {
                  if (!p.lat || !p.lng) return null;
                  const isPlaceHL = selectedPlace?._id === p._id;
                  return (
                    <Marker
                      key={`p_${p._id}_${isPlaceHL}`}
                      coordinate={{ latitude: Number(p.lat), longitude: Number(p.lng) }}
                      pinColor={isPlaceHL ? '#E74C3C' : '#3498DB'}
                      onPress={(e) => { e.stopPropagation?.(); handlePlaceMarkerPress(p); }}
                    />
                  );
                })
              }

              {/* Show hotel pins when a district is selected */}
              {selectedDistrict && hotels
                .filter((h) => {
                  if (h.district_id && selectedDistrict.district_id) {
                    return h.district_id === selectedDistrict.district_id;
                  }
                  const distName = selectedDistrict.name?.toLowerCase();
                  const hotelDist = h.district || h.location || '';
                  return hotelDist.toLowerCase() === distName ||
                    (h.address_text || '').toLowerCase().includes(distName);
                })
                .slice(0, 8)
                .map((h) => {
                  if (!h.lat || !h.lng) return null;
                  const isHotelHL = selectedHotel?._id === h._id;
                  return (
                    <Marker
                      key={`h_${h._id}_${isHotelHL}`}
                      coordinate={{ latitude: Number(h.lat), longitude: Number(h.lng) }}
                      pinColor={isHotelHL ? '#E74C3C' : '#FF9800'}
                      onPress={(e) => { e.stopPropagation?.(); handleHotelMarkerPress(h); }}
                    />
                  );
                })
              }
            </MapView>

            {/* Popup card — district, place, or hotel */}
            {(selectedDistrict || selectedPlace || selectedHotel) && (
              <View style={styles.mapPopup} pointerEvents="box-none">
                {selectedHotel ? (
                  <View style={styles.mapPopupCard}>
                    <FallbackImage
                      uri={getHotelImageCandidates(selectedHotel)}
                      style={styles.mapPopupImg}
                      iconName="bed-outline"
                      iconSize={20}
                    />
                    <View style={styles.mapPopupBody}>
                      <Text style={styles.mapPopupName} numberOfLines={1}>{selectedHotel.name}</Text>
                      <Text style={styles.mapPopupProv}>
                        {getHotelMeta(selectedHotel).emoji} {getHotelMeta(selectedHotel).label}
                        {getHotelNightlyPriceLkr(selectedHotel) ? ` · ${formatHotelPrice(getHotelNightlyPriceLkr(selectedHotel), 'LKR')}` : ''}
                      </Text>
                    </View>
                    <Pressable style={styles.mapPopupExplore} onPress={promptLogin}>
                      <Text style={styles.mapPopupExploreText}>View</Text>
                    </Pressable>
                    <Pressable style={styles.mapPopupClose} onPress={() => setSelectedHotel(null)}>
                      <Ionicons name="close" size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ) : selectedPlace ? (
                  <View style={styles.mapPopupCard}>
                    <FallbackImage
                      uri={getPlaceImageCandidates(selectedPlace)}
                      style={styles.mapPopupImg}
                      iconName="location-outline"
                      iconSize={20}
                    />
                    <View style={styles.mapPopupBody}>
                      <Text style={styles.mapPopupName} numberOfLines={1}>{selectedPlace.name}</Text>
                      <Text style={styles.mapPopupProv}>{selectedPlace.type || selectedPlace.category || selectedPlace.district || ''}</Text>
                    </View>
                    <Pressable style={styles.mapPopupExplore} onPress={promptLogin}>
                      <Text style={styles.mapPopupExploreText}>View</Text>
                    </Pressable>
                    <Pressable style={styles.mapPopupClose} onPress={() => setSelectedPlace(null)}>
                      <Ionicons name="close" size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.mapPopupCard}>
                    <FallbackImage
                      uri={selectedDistrict.image_url}
                      style={styles.mapPopupImg}
                      iconName="map-outline"
                      iconSize={20}
                    />
                    <View style={styles.mapPopupBody}>
                      <Text style={styles.mapPopupName} numberOfLines={1}>{selectedDistrict.name}</Text>
                      <Text style={styles.mapPopupProv}>{selectedDistrict.province} Province</Text>
                    </View>
                    <Pressable style={styles.mapPopupExplore} onPress={promptLogin}>
                      <Text style={styles.mapPopupExploreText}>Explore</Text>
                    </Pressable>
                    <Pressable style={styles.mapPopupClose} onPress={() => { setHighlightedId(null); setSelectedDistrict(null); setSelectedPlace(null); setSelectedHotel(null); }}>
                      <Ionicons name="close" size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Zoom + / - controls */}
            <View style={styles.mapZoomControls} pointerEvents="box-none">
              <Pressable style={styles.mapIconBtn} onPress={zoomIn}>
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </Pressable>
              <Pressable style={styles.mapIconBtn} onPress={zoomOut}>
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Reset button */}
            <Pressable style={styles.mapResetBtn} onPress={resetMap}>
              <Ionicons name="scan-outline" size={14} color={colors.textPrimary} />
              <Text style={styles.mapResetText}>Reset</Text>
            </Pressable>
          </View>

          {/* Map Legend */}
          <View style={styles.mapLegend}>
            <Text style={styles.mapLegendTitle}>Map Legend</Text>
            <View style={styles.mapLegendRow}>
              <View style={styles.mapLegendItem}>
                <View style={[styles.mapLegendDot, { backgroundColor: '#17A34A' }]} />
                <Text style={styles.mapLegendText}>Districts</Text>
              </View>
              <View style={styles.mapLegendItem}>
                <View style={[styles.mapLegendDot, { backgroundColor: '#3498DB' }]} />
                <Text style={styles.mapLegendText}>Places</Text>
              </View>
              <View style={styles.mapLegendItem}>
                <View style={[styles.mapLegendDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.mapLegendText}>Hotels</Text>
              </View>
            </View>
            <Text style={styles.mapLegendHint}>Tap a district pin to see places & hotels nearby</Text>
          </View>

          {/* Sign up CTA */}
          <Pressable style={styles.exploreMoreBtn} onPress={onLoginPress}>
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            <Text style={styles.exploreMoreText}>Sign Up to Explore All</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>

        {/* ── Districts List Section ── */}
        <View style={styles.section}>
          <SectionHeader title="Districts" icon="map" onSeeMore={promptLogin} />
          {loadingDistricts ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : districts.length > 0 ? (
            <FlatList
              ref={districtListRef}
              data={districts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.district_id?.toString()}
              renderItem={({ item }) => (
                <DistrictMiniCard
                  item={item}
                  isHighlighted={highlightedId === item.district_id}
                  onPress={handleDistrictCardPress}
                />
              )}
              contentContainerStyle={styles.hList}
              onScrollToIndexFailed={() => {}}
            />
          ) : null}
        </View>

        {/* ── Places ── */}
        <View style={styles.section}>
          <SectionHeader
            title={selectedDistrict ? `Places in ${selectedDistrict.name}` : 'Popular Places'}
            icon="location"
            onSeeMore={promptLogin}
          />
          {loadingPlaces ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : visiblePlaces.length === 0 ? (
            <Text style={styles.emptyText}>{selectedDistrict ? `No places found in ${selectedDistrict.name}.` : 'No places yet.'}</Text>
          ) : (
            <FlatList
              ref={placesListRef}
              data={visiblePlaces}
              extraData={selectedPlace}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <PlaceCard
                  item={item}
                  isHighlighted={selectedPlace?._id === item._id}
                  onPress={promptLogin}
                />
              )}
              ListFooterComponent={
                <Pressable style={styles.seeMoreCardTall} onPress={onLoginPress}>
                  <View style={styles.seeMoreCardIcon}>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.seeMoreCardText}>See All{"\n"}Places</Text>
                </Pressable>
              }
              contentContainerStyle={styles.hList}
              getItemLayout={(data, index) => ({
                length: 192,
                offset: 192 * index + 20,
                index,
              })}
              onScrollToIndexFailed={() => {}}
            />
          )}
        </View>

        {/* ── Transport Routes ── */}
        <View style={styles.section}>
          <SectionHeader
            title={selectedDistrict ? `Transit from ${selectedDistrict.name}` : 'Popular Transit Routes'}
            icon="bus"
            onSeeMore={promptLogin}
          />
          {loadingTransport ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : visibleTransportRoutes.length === 0 ? (
            <Text style={styles.emptyText}>
              {selectedDistrict ? `No transport routes found for ${selectedDistrict.name}.` : 'No transport routes yet.'}
            </Text>
          ) : (
            <FlatList
              data={visibleTransportRoutes}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TransportRouteCard item={item} onPress={promptLogin} />
              )}
              ListFooterComponent={
                <Pressable style={styles.seeMoreCardTall} onPress={onLoginPress}>
                  <View style={styles.seeMoreCardIcon}>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.seeMoreCardText}>See All{"\n"}Routes</Text>
                </Pressable>
              }
              contentContainerStyle={styles.hList}
            />
          )}
        </View>

        {/* ── Inline Promo Card ── */}
        <View style={styles.promoCard}>
          <View style={styles.promoIconWrap}>
            <Ionicons name="diamond-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.promoBody}>
            <Text style={styles.promoTitle}>Want the full experience?</Text>
            <Text style={styles.promoSub}>Sign up to save trips, write reviews, track expenses & more</Text>
          </View>
          <Pressable style={styles.promoBtn} onPress={onLoginPress}>
            <Text style={styles.promoBtnText}>Join Free</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.white} />
          </Pressable>
        </View>

        {/* ── Featured Hotels ── */}
        <View style={styles.section}>
          <SectionHeader
            title={selectedDistrict ? `Hotels in ${selectedDistrict.name}` : 'Featured Hotels'}
            icon="bed"
            onSeeMore={promptLogin}
          />

          {loadingHotels ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : visibleHotels.length === 0 ? (
            <Text style={styles.emptyText}>{selectedDistrict ? `No hotels found in ${selectedDistrict.name}.` : 'No hotels yet.'}</Text>
          ) : (
            <FlatList
              ref={hotelsListRef}
              data={visibleHotels}
              extraData={selectedHotel}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <HotelCard
                  item={item}
                  isHighlighted={selectedHotel?._id === item._id}
                  onPress={promptLogin}
                />
              )}
              ListFooterComponent={
                <Pressable style={styles.seeMoreCardTall} onPress={onLoginPress}>
                  <View style={styles.seeMoreCardIcon}>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.seeMoreCardText}>See All{"\n"}Hotels</Text>
                </Pressable>
              }
              contentContainerStyle={styles.hList}
            />
          )}
        </View>

        {/* ── Unlock Full Access CTA ── */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.unlockCard}
        >
          <View style={styles.unlockIconRow}>
            <View style={styles.unlockIconCircle}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.unlockTitle}>Unlock full access</Text>
          <Text style={styles.unlockSub}>Create a free account to access all features</Text>

          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={18} color={colors.white} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
            onPress={onLoginPress}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={styles.ctaBtnText}>Create Free Account</Text>
          </Pressable>
          <Pressable style={styles.ctaSecondary} onPress={onLoginPress}>
            <Text style={styles.ctaSecondaryText}>
              Already have an account? <Text style={styles.ctaSecondaryLink}>Sign In</Text>
            </Text>
          </Pressable>
        </LinearGradient>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerLogoRow}>
            <Ionicons name="airplane" size={16} color={colors.primary} />
            <Text style={styles.footerLogoText}>TravelGenie</Text>
          </View>
          <Text style={styles.footerTagline}>Your Smart Sri Lanka Travel Companion</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.footerCopy}>© 2026 TravelGenie · Made with ❤️ in Sri Lanka</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, letterSpacing: 0.5 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  loginBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  scroll: { paddingBottom: 40 },

  /* Hero */
  hero: {
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, gap: 10,
  },
  heroTextWrap: { marginBottom: 4 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6,
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: colors.white, letterSpacing: -0.5, lineHeight: 38 },
  heroSub: { fontSize: 14, color: '#A8E6D0', lineHeight: 21, marginTop: 6 },
  heroStatsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 4,
  },
  heroStatPill: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroStatNum: { fontSize: 18, fontWeight: '900', color: colors.white },
  heroStatLbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12,
  },
  heroBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  /* Section */
  section: { paddingTop: 24, paddingBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  seeMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeMoreText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  emptyText: { color: colors.textMuted, paddingHorizontal: 20, fontSize: 14 },
  hList: { paddingHorizontal: 20, gap: 12 },

  /* Map */
  mapSection: { paddingTop: 24 },
  mapWrap: {
    height: 320, marginHorizontal: 20, marginBottom: 12,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: { width: '100%', height: '100%' },
  mapZoomControls: {
    position: 'absolute',
    top: 48,
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
  exploreMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 8, marginTop: 4,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#EAF4F1', borderWidth: 1, borderColor: '#DCEBE4',
  },
  exploreMoreText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  seeMoreCard: {
    width: 100, height: 75, borderRadius: 14,
    backgroundColor: '#EAF4F1', borderWidth: 1.5, borderColor: '#DCEBE4',
    alignItems: 'center', justifyContent: 'center', gap: 6, marginLeft: 4,
  },
  seeMoreCardTall: {
    width: 120, height: 185, borderRadius: 16,
    backgroundColor: '#EAF4F1', borderWidth: 1.5, borderColor: '#DCEBE4',
    alignItems: 'center', justifyContent: 'center', gap: 6, marginLeft: 4,
  },
  seeMoreCardIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  seeMoreCardText: {
    fontSize: 11, fontWeight: '700', color: colors.primary, textAlign: 'center',
  },
  mapPopup: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end', paddingHorizontal: 10, paddingBottom: 10,
  },
  mapPopupCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 14, overflow: 'hidden',
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  mapPopupImg: { width: 60, height: 60 },
  mapPopupBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  mapPopupName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  mapPopupProv: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 2 },
  mapPopupExplore: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, marginRight: 6,
  },
  mapPopupExploreText: { fontSize: 12, fontWeight: '700', color: colors.white },
  mapPopupClose: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },

  /* District cards */
  districtCard: {
    width: 220, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  districtCardHighlight: { borderColor: colors.primary, borderWidth: 2 },
  districtCardImage: { width: 70, height: 75 },
  districtCardBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  districtCardName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  districtCardProv: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 2 },
  districtCardHint: { fontSize: 10, color: colors.textMuted, marginTop: 3 },
  districtCardArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EAF4F1', alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },

  /* Place cards (Premium) */
  placeCard: {
    width: 190, backgroundColor: colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5,
  },
  placeCardHighlight: { borderColor: colors.primary, borderWidth: 2 },
  placeCardImageWrap: { width: '100%', height: 125, position: 'relative' },
  placeCardImage: { width: '100%', height: '100%' },
  placeCardGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%',
  },
  placeTypeBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  placeTypeBadgeText: { color: colors.white, fontSize: 9, fontWeight: '800', textTransform: 'capitalize' },
  placeCardBody: { padding: 10 },
  placeCardTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  placeCardRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  placeCardSub: { fontSize: 11, color: colors.textMuted, flex: 1 },

  /* Hotel cards (Premium) */
  hotelCard: {
    width: 200, backgroundColor: colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  hotelCardHighlight: { borderColor: colors.primary, borderWidth: 2 },
  hotelCardImageWrap: { width: '100%', height: 135, position: 'relative' },
  hotelCardImage: { width: '100%', height: '100%' },
  hotelCardGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
  },
  hotelTypeBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  hotelTypeBadgeEmoji: { fontSize: 10 },
  hotelTypeBadgeLabel: { color: colors.white, fontSize: 9, fontWeight: '800' },
  hotelRatingBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  hotelRatingText: { fontSize: 11, fontWeight: '900', color: colors.textPrimary },
  hotelPriceTag: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'baseline', gap: 1,
    backgroundColor: 'rgba(14,124,95,0.92)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  hotelPriceTagText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  hotelPriceTagSub: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '700' },
  hotelCardBody: { padding: 10 },
  hotelStarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 3,
  },
  hotelStarLabel: {
    fontSize: 9, fontWeight: '700', color: colors.textMuted, marginLeft: 2,
  },
  hotelCardTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  hotelLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hotelLocText: { fontSize: 11, color: colors.textMuted, flex: 1 },

  /* Transport route cards */
  routeCard: {
    width: 310,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: colors.border,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  routeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
  },
  routeTypeText: { fontSize: 11, fontWeight: '900' },
  routePricePill: {
    backgroundColor: '#E9F8F2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  routePrice: { fontSize: 12, fontWeight: '900', color: colors.success },
  routeProvider: { fontSize: 15, fontWeight: '900', color: colors.textPrimary },
  routeName: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginTop: 2 },
  routeTicket: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#F8F7F3',
  },
  routeTicketSide: { flex: 1 },
  routeTime: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  routeStation: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', lineHeight: 14, marginTop: 2 },
  routeTicketMid: { width: 64, alignItems: 'center' },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginBottom: 3,
  },
  routeLine: { width: 2, height: 14, borderRadius: 1 },
  routeDuration: { fontSize: 10, fontWeight: '900', marginTop: 4 },
  routeMetaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  routeMetaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  routeMetaText: { flex: 1, fontSize: 10, fontWeight: '800', color: colors.textMuted },

  /* Unlock card (dark themed) */
  unlockCard: {
    margin: 20, borderRadius: 20,
    padding: 24, overflow: 'hidden',
  },
  unlockIconRow: { alignItems: 'center', marginBottom: 16 },
  unlockIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  unlockTitle: { fontSize: 20, fontWeight: '900', color: colors.white, textAlign: 'center', marginBottom: 4 },
  unlockSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 20 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  featureItem: { width: '30%', alignItems: 'center', gap: 6 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.white, paddingVertical: 14, borderRadius: 12, marginBottom: 12,
  },
  ctaBtnText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  ctaSecondary: { alignItems: 'center' },
  ctaSecondaryText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  ctaSecondaryLink: { color: colors.white, fontWeight: '700' },

  /* Map Legend */
  mapLegend: {
    marginHorizontal: 20, marginTop: 10, marginBottom: 6,
    backgroundColor: colors.surface, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  mapLegendTitle: {
    fontSize: 11, fontWeight: '800', color: colors.textPrimary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  mapLegendRow: { flexDirection: 'row', gap: 16 },
  mapLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  mapLegendDot: { width: 10, height: 10, borderRadius: 5 },
  mapLegendText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  mapLegendHint: {
    fontSize: 10, color: colors.textMuted, marginTop: 6, fontStyle: 'italic',
  },

  /* Promo Card */
  promoCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 8, marginBottom: 4,
    backgroundColor: colors.surface, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
    borderWidth: 1, borderColor: colors.primary + '25',
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  promoIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primary + '14',
    alignItems: 'center', justifyContent: 'center',
  },
  promoBody: { flex: 1 },
  promoTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  promoSub: { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
  promoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  promoBtnText: { color: colors.white, fontSize: 11, fontWeight: '800' },

  /* Footer */
  footer: {
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20,
    marginTop: 8,
  },
  footerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  footerLogoText: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  footerTagline: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 12 },
  footerDivider: {
    width: 40, height: 2, backgroundColor: colors.primary + '30',
    borderRadius: 1, marginBottom: 12,
  },
  footerCopy: { fontSize: 11, color: colors.textMuted },
});

export default GuestScreen;
