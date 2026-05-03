import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, View,
  Dimensions
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

const { width } = Dimensions.get('window');

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

/* ── Animated Stat Value ── */
const StatValue = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (isNaN(end) || end <= 0) {
      setDisplayValue(value);
      return;
    }

    const duration = 1500; // 1.5 seconds
    const increment = Math.ceil(end / (duration / 16)); // ~60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <Text style={styles.statVal}>{displayValue.toLocaleString()}</Text>;
};

/* ── District Mini Card ── */
const DistrictMiniCard = ({ item, isHighlighted, onPress }) => {
  const bgColor = PROVINCE_COLORS[item.province] || '#3A5A4A';
  return (
    <Pressable
      style={[styles.districtCard, isHighlighted && styles.districtCardHighlight]}
      onPress={() => onPress(item)}
    >
      <View style={styles.districtCardImgWrapper}>
        <FallbackImage
          uri={item.image_url}
          style={styles.districtCardImage}
          iconName="map-outline"
          iconSize={24}
          placeholderColor={bgColor}
          placeholderIconColor="rgba(255,255,255,0.4)"
        />
        <View style={[styles.districtCardBadge, { backgroundColor: bgColor }]}>
          <Text style={styles.districtCardBadgeText}>{item.province.charAt(0)}</Text>
        </View>
      </View>
      <View style={styles.districtCardBody}>
        <Text style={styles.districtCardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.districtCardProv} numberOfLines={1}>{item.province} Prov.</Text>
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
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.placeCardGradient}
        />
      </FallbackImage>
      {item.type && (
        <View style={styles.placeTypeBadge}>
          <Text style={styles.placeTypeBadgeText}>{item.type.toUpperCase()}</Text>
        </View>
      )}
      {item.duration && (
        <View style={styles.placeDurationBadge}>
          <Ionicons name="time-outline" size={10} color={colors.white} />
          <Text style={styles.placeDurationText}>{item.duration}</Text>
        </View>
      )}
    </View>
    <View style={styles.placeCardBody}>
      <Text style={styles.placeCardTitle} numberOfLines={1}>{item.name || 'Place'}</Text>
      
      <View style={styles.placeInfoRow}>
        <View style={styles.placeLocRow}>
          <Ionicons name="location" size={11} color={colors.primary} />
          <Text style={styles.placeCardSub} numberOfLines={1}>
            {item.city || item.district || 'Sri Lanka'}
          </Text>
        </View>
        <View style={styles.placeRatingRow}>
          <Ionicons name="star" size={10} color="#FFD700" />
          <Text style={styles.placeRatingText}>{Number(item.rating || 5).toFixed(1)}</Text>
          <Text style={styles.placeReviewText}>({item.review_count || 0})</Text>
        </View>
      </View>
    </View>
  </Pressable>
);

/* ── Hotel Card (Premium) ── */
const HotelCard = ({ item, onPress, isHighlighted }) => {
  const nightlyPrice = getHotelNightlyPriceLkr(item);
  const meta = getHotelMeta(item);
  const starClass = Number(item.star_class || 0);

  return (
    <Pressable style={[styles.hotelCard, isHighlighted && styles.hotelCardHighlight]} onPress={onPress}>
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
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.hotelCardGradient}
          />
        </FallbackImage>

        <View style={[styles.hotelTypeBadge, { backgroundColor: meta.color }]}>
          <Text style={styles.hotelTypeBadgeLabel}>{meta.label}</Text>
        </View>

        {Number(item.rating) > 0 && (
          <View style={styles.hotelRatingBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.hotelRatingText}>{Number(item.rating).toFixed(1)}</Text>
          </View>
        )}

        {nightlyPrice ? (
          <View style={styles.hotelPriceTag}>
            <Text style={styles.hotelPriceTagText}>{formatHotelPrice(nightlyPrice, 'LKR')}</Text>
            <Text style={styles.hotelPriceTagSub}>/nt</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.hotelCardBody}>
        <View style={styles.hotelHeaderRow}>
          <Text style={styles.hotelCardTitle} numberOfLines={1}>{item.name || 'Hotel'}</Text>
        </View>
        <View style={styles.hotelFooterRow}>
          <View style={styles.hotelLocRow}>
            <Ionicons name="navigate-outline" size={11} color={colors.textMuted} />
            <Text style={styles.hotelLocText} numberOfLines={1}>{item.city || item.district}</Text>
          </View>
          {starClass > 0 && (
            <View style={styles.hotelStarPill}>
              <Ionicons name="star" size={8} color={colors.warning} />
              <Text style={styles.hotelStarLabel}>{starClass}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

/* ── Transport Route Card ── */
const TransportRouteCard = ({ item, onPress }) => {
  const meta = getTransportTypeMeta(item.type);

  return (
    <Pressable style={styles.routeCard} onPress={onPress}>
      <View style={styles.routeTop}>
        <View style={[styles.routeBadge, { backgroundColor: `${meta.color}15` }]}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
          <Text style={[styles.routeBadgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.routePriceText}>{formatLkr(item.ticketPriceLKR)}</Text>
      </View>

      <View style={styles.routeMain}>
        <View style={styles.routeStationBox}>
          <Text style={styles.routeTimeText}>{item.departureTime || '--:--'}</Text>
          <Text style={styles.routeStationText} numberOfLines={1}>{item.departureStation}</Text>
        </View>
        
        <View style={styles.routePathBox}>
          <View style={[styles.routePathLine, { backgroundColor: meta.color }]} />
          <View style={[styles.routePathCircle, { borderColor: meta.color }]}>
            <Ionicons name={meta.icon} size={12} color={meta.color} />
          </View>
          <Text style={[styles.routeDurationText, { color: meta.color }]}>{formatDuration(item.duration)}</Text>
        </View>

        <View style={[styles.routeStationBox, { alignItems: 'flex-end' }]}>
          <Text style={styles.routeTimeText}>{item.arrivalTime || '--:--'}</Text>
          <Text style={[styles.routeStationText, { textAlign: 'right' }]} numberOfLines={1}>{item.arrivalStation}</Text>
        </View>
      </View>

      <View style={styles.routeFooter}>
        <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
        <Text style={styles.routeFooterText} numberOfLines={1}>
          {(item.operatingDays || ['Daily']).join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
};

/* ── Section Header ── */
const SectionHeader = ({ title, icon, onSeeMore }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <View style={styles.sectionIconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {onSeeMore && (
      <Pressable onPress={onSeeMore} style={styles.seeMoreBtn}>
        <Text style={styles.seeMoreText}>Explore All</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </Pressable>
    )}
  </View>
);

const GuestScreen = ({ navigation }) => {
  const { exitGuest } = useAuth();
  const [placeCount, setPlaceCount] = useState(4271);
  const [hotelCount, setHotelCount] = useState(3933);
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
      if (dRes.status === 'fulfilled') setDistricts(dRes.value?.data?.data || dRes.value?.data || []);
      if (pRes.status === 'fulfilled') {
        const data = pRes.value?.data || pRes.value || {};
        setPlaces(data.places || (Array.isArray(data) ? data : []));
        if (data.total) setPlaceCount(data.total);
      }
      if (hRes.status === 'fulfilled') {
        const data = hRes.value?.data || hRes.value || {};
        const hList = data.hotels || (Array.isArray(data) ? data : []);
        setHotels(hList);
        if (data.total) setHotelCount(data.total);
        else if (hList.length > 0) setHotelCount(hList.length);
      }
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

  const filteredHotels = selectedDistrict
    ? hotels.filter((h) => {
        if (h.district_id && selectedDistrict.district_id) {
          return h.district_id === selectedDistrict.district_id;
        }
        const distName = selectedDistrict.name?.toLowerCase();
        const hotelDist = h.district || '';
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
      const CARD_W = 200;
      const GAP = 14;
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
      const CARD_W = 220;
      const GAP = 14;
      const offset = Math.max(0, idx * (CARD_W + GAP));
      setTimeout(() => {
        hotelsListRef.current?.scrollToOffset({ offset, animated: true });
      }, 200);
    }
  }, [visibleHotels]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── App Bar ── */}
      <View style={styles.appBar}>
        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Ionicons name="airplane" size={16} color={colors.white} />
          </View>
          <Text style={styles.appBarTitle}>TravelGenie</Text>
        </View>
        <Pressable onPress={onLoginPress} style={styles.navLoginBtn}>
          <Text style={styles.navLoginText}>Log In</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero Experience ── */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={12} color={colors.white} />
                <Text style={styles.heroBadgeText}>YOUR NEXT ADVENTURE AWAITS</Text>
              </View>
              <Text style={styles.heroTitle}>Discover the Magic of Sri Lanka</Text>
              <Text style={styles.heroSub}>The smartest way to explore, plan, and experience the Pearl of the Indian Ocean.</Text>
              
              <View style={styles.heroStats}>
                <View style={styles.glassStat}>
                  <StatValue value={districts.length || 25} />
                  <Text style={styles.statLbl}>Districts</Text>
                </View>
                <View style={styles.glassStat}>
                  <StatValue value={placeCount} />
                  <Text style={styles.statLbl}>Places</Text>
                </View>
                <View style={styles.glassStat}>
                  <StatValue value={hotelCount} />
                  <Text style={styles.statLbl}>Hotels</Text>
                </View>
              </View>

              <Pressable onPress={onLoginPress} style={styles.heroCTA}>
                <Text style={styles.heroCTAText}>Start Your Journey</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* ── Map Explorer ── */}
        <View style={styles.mapSection}>
          <SectionHeader title="Map Explorer" icon="map-outline" onSeeMore={null} />
          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={SRI_LANKA_REGION}
              onPress={() => { setHighlightedId(null); setSelectedDistrict(null); setSelectedPlace(null); setSelectedHotel(null); }}
            >
              {districts.map((d) => {
                const coords = DISTRICT_COORDS[d.name];
                if (!coords) return null;
                const isHL = highlightedId === d.district_id;
                return (
                  <Marker
                    key={`d_${d.district_id}_${isHL}`}
                    coordinate={coords}
                    pinColor={isHL ? '#E74C3C' : colors.primary}
                    onPress={(e) => { e.stopPropagation?.(); handleMarkerPress(d); }}
                  />
                );
              })}

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

              {selectedDistrict && hotels
                .filter((h) => {
                  if (h.district_id && selectedDistrict.district_id) {
                    return h.district_id === selectedDistrict.district_id;
                  }
                  const distName = selectedDistrict.name?.toLowerCase();
                  const hotelDist = h.district || '';
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

            {(selectedDistrict || selectedPlace || selectedHotel) && (
              <View style={styles.popupWrapper} pointerEvents="box-none">
                <View style={styles.floatingPopup}>
                  <FallbackImage
                    uri={selectedHotel ? getHotelImageCandidates(selectedHotel) : (selectedPlace ? getPlaceImageCandidates(selectedPlace) : selectedDistrict.image_url)}
                    style={styles.popupThumb}
                    iconName="image"
                    iconSize={20}
                  />
                  <View style={styles.popupInfo}>
                    <Text style={styles.popupTitle} numberOfLines={1}>
                      {selectedHotel?.name || selectedPlace?.name || selectedDistrict?.name}
                    </Text>
                    <Text style={styles.popupSubtitle}>
                      {selectedHotel ? `${getHotelMeta(selectedHotel).emoji} ${getHotelMeta(selectedHotel).label}` : (selectedPlace ? (selectedPlace.type || 'Point of Interest') : `${selectedDistrict.province} Prov.`)}
                    </Text>
                  </View>
                  <Pressable style={styles.popupBtn} onPress={promptLogin}>
                    <Ionicons name="eye" size={16} color={colors.white} />
                  </Pressable>
                  <Pressable style={styles.popupClose} onPress={() => { setSelectedHotel(null); setSelectedPlace(null); setSelectedDistrict(null); setHighlightedId(null); }}>
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.mapControls}>
              <Pressable style={styles.mapBtn} onPress={zoomIn}><Ionicons name="add" size={20} color={colors.textPrimary} /></Pressable>
              <Pressable style={styles.mapBtn} onPress={zoomOut}><Ionicons name="remove" size={20} color={colors.textPrimary} /></Pressable>
              <Pressable style={styles.mapBtn} onPress={resetMap}><Ionicons name="refresh" size={18} color={colors.textPrimary} /></Pressable>
            </View>
          </View>
        </View>

        {/* ── Districts Horizontal ── */}
        <View style={styles.section}>
          <SectionHeader title="Top Districts" icon="navigate-circle-outline" onSeeMore={promptLogin} />
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
            contentContainerStyle={styles.hListContent}
          />
        </View>

        {/* ── Places ── */}
        <View style={styles.section}>
          <SectionHeader
            title={selectedDistrict ? `Places in ${selectedDistrict.name}` : 'Must-Visit Places'}
            icon="camera-outline"
            onSeeMore={promptLogin}
          />
          <FlatList
            ref={placesListRef}
            data={visiblePlaces}
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
            contentContainerStyle={styles.hListContent}
            ListEmptyComponent={loadingPlaces ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.emptyText}>No places found.</Text>}
          />
        </View>

        {/* ── Transport Promo ── */}
        <View style={styles.promoBanner}>
          <View style={styles.promoIcon}>
            <Ionicons name="bus" size={24} color={colors.primary} />
          </View>
          <View style={styles.promoTextRow}>
            <Text style={styles.promoTitleText}>Traveling across the island?</Text>
            <Text style={styles.promoSubText}>Check real-time transport schedules and ticket prices.</Text>
          </View>
          <Pressable style={styles.promoPill} onPress={onLoginPress}>
            <Text style={styles.promoPillText}>Try It</Text>
          </Pressable>
        </View>

        {/* ── Hotels ── */}
        <View style={styles.section}>
          <SectionHeader
            title={selectedDistrict ? `Stays in ${selectedDistrict.name}` : 'Featured Stays'}
            icon="bed-outline"
            onSeeMore={promptLogin}
          />
          <FlatList
            ref={hotelsListRef}
            data={visibleHotels}
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
            contentContainerStyle={styles.hListContent}
            ListEmptyComponent={loadingHotels ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.emptyText}>No hotels found.</Text>}
          />
        </View>

        {/* ── Transit ── */}
        <View style={styles.section}>
          <SectionHeader title="Popular Routes" icon="git-branch-outline" onSeeMore={promptLogin} />
          <FlatList
            data={visibleTransportRoutes}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <TransportRouteCard item={item} onPress={promptLogin} />}
            contentContainerStyle={styles.hListContent}
          />
        </View>

        {/* ── Call to Action ── */}
        <View style={styles.ctaBox}>
          <LinearGradient
            colors={[colors.textPrimary, '#2C3E50']}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaIconBox}>
              <Ionicons name="lock-open" size={32} color={colors.white} />
            </View>
            <Text style={styles.ctaTitle}>Unlock the full experience</Text>
            <Text style={styles.ctaDesc}>Join thousands of travelers planning their perfect Sri Lankan getaway with TravelGenie.</Text>
            
            <View style={styles.featurePills}>
              {['Smart Itineraries', 'Expense Tracking', 'Verified Reviews'].map(f => (
                <View key={f} style={styles.featPill}><Text style={styles.featPillText}>{f}</Text></View>
              ))}
            </View>

            <Pressable style={styles.finalBtn} onPress={onLoginPress}>
              <Text style={styles.finalBtnText}>Create Your Free Account</Text>
            </Pressable>
          </LinearGradient>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Made with ❤️ for Sri Lanka</Text>
          <Text style={styles.footerCopy}>© 2026 TravelGenie Mobile</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  
  /* App Bar */
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.background,
  },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'
  },
  appBarTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  navLoginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: `${colors.primary}10`,
  },
  navLoginText: { fontSize: 13, fontWeight: '800', color: colors.primary },

  scrollContent: { paddingBottom: 10 },

  /* Hero */
  heroContainer: { marginHorizontal: 20, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  heroGradient: { padding: 24, minHeight: 320 },
  heroContent: { flex: 1, justifyContent: 'center' },
  heroBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 16
  },
  heroBadgeText: { color: colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { fontSize: 34, fontWeight: '900', color: colors.white, lineHeight: 40, letterSpacing: -1 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 12, lineHeight: 22 },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: 24 },
  glassStat: { 
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', 
    paddingVertical: 12, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  statVal: { fontSize: 20, fontWeight: '900', color: colors.white },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  heroCTA: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, alignSelf: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 18, marginTop: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8
  },
  heroCTAText: { color: colors.primary, fontWeight: '900', fontSize: 15 },

  /* Sections */
  section: { marginTop: 32 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, marginBottom: 16
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIconBox: { 
    width: 36, height: 36, borderRadius: 12, 
    backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center'
  },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  seeMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeMoreText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  hListContent: { paddingHorizontal: 20, gap: 14 },
  emptyText: { color: colors.textMuted, paddingHorizontal: 24, fontStyle: 'italic' },

  /* Map Explorer */
  mapSection: { marginTop: 32 },
  mapWrapper: { 
    height: 360, marginHorizontal: 20, borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10
  },
  map: { flex: 1 },
  mapControls: { position: 'absolute', right: 12, top: 12, gap: 8 },
  mapBtn: { 
    width: 40, height: 40, borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, elevation: 2
  },
  popupWrapper: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  floatingPopup: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 20,
    padding: 8, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 12
  },
  popupThumb: { width: 48, height: 48, borderRadius: 14 },
  popupInfo: { flex: 1, marginLeft: 12 },
  popupTitle: { fontSize: 14, fontWeight: '900', color: colors.textPrimary },
  popupSubtitle: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 1 },
  popupBtn: { 
    width: 36, height: 36, borderRadius: 12, 
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 4
  },
  popupClose: { 
    width: 32, height: 32, borderRadius: 10, 
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginLeft: 4
  },

  /* District Cards */
  districtCard: { 
    width: 160, padding: 12, borderRadius: 24, 
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5
  },
  districtCardHighlight: { borderColor: colors.primary, backgroundColor: `${colors.primary}05` },
  districtCardImgWrapper: { width: 136, height: 90, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  districtCardImage: { width: '100%', height: '100%' },
  districtCardBadge: { 
    position: 'absolute', top: 6, right: 6, width: 22, height: 22, 
    borderRadius: 7, alignItems: 'center', justifyContent: 'center', elevation: 2
  },
  districtCardBadgeText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  districtCardBody: { marginTop: 10, alignItems: 'center' },
  districtCardName: { fontSize: 15, fontWeight: '900', color: colors.textPrimary },
  districtCardProv: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginTop: 1 },

  /* Place Cards */
  placeCard: { 
    width: 200, borderRadius: 24, backgroundColor: colors.surface, 
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8
  },
  placeCardHighlight: { borderColor: colors.primary },
  placeCardImageWrap: { width: '100%', height: 140 },
  placeCardImage: { width: '100%', height: '100%' },
  placeCardGradient: { ...StyleSheet.absoluteFillObject },
  placeTypeBadge: { 
    position: 'absolute', top: 12, left: 12, 
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
  },
  placeTypeBadgeText: { fontSize: 9, fontWeight: '900', color: colors.textPrimary },
  placeCardBody: { padding: 14 },
  placeCardTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  placeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  placeLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  placeCardSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  placeRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  placeRatingText: { fontSize: 11, fontWeight: '800', color: colors.textPrimary },
  placeReviewText: { fontSize: 10, color: colors.textMuted, marginLeft: 2 },
  placeDurationBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4
  },
  placeDurationText: { color: colors.white, fontSize: 10, fontWeight: '800' },

  /* Hotel Cards */
  hotelCard: { 
    width: 220, borderRadius: 24, backgroundColor: colors.surface, 
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10
  },
  hotelCardHighlight: { borderColor: colors.primary },
  hotelCardImageWrap: { width: '100%', height: 150 },
  hotelCardImage: { width: '100%', height: '100%' },
  hotelCardGradient: { ...StyleSheet.absoluteFillObject },
  hotelTypeBadge: { 
    position: 'absolute', top: 12, left: 12, 
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10
  },
  hotelTypeBadgeLabel: { color: colors.white, fontSize: 10, fontWeight: '900' },
  hotelRatingBadge: { 
    position: 'absolute', top: 12, right: 12, 
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 5, 
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 3
  },
  hotelRatingText: { fontSize: 12, fontWeight: '900', color: colors.textPrimary },
  hotelPriceTag: { 
    position: 'absolute', bottom: 12, right: 12, 
    backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 6, 
    borderRadius: 12, flexDirection: 'row', alignItems: 'baseline', gap: 2
  },
  hotelPriceTagText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  hotelPriceTagSub: { fontSize: 9, color: colors.textMuted, fontWeight: '700' },
  hotelCardBody: { padding: 14 },
  hotelHeaderRow: { marginBottom: 6 },
  hotelCardTitle: { fontSize: 17, fontWeight: '900', color: colors.textPrimary },
  hotelFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hotelLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hotelLocText: { fontSize: 12, color: colors.textMuted, fontWeight: '600', maxWidth: 100 },
  hotelStarPill: { 
    flexDirection: 'row', alignItems: 'center', gap: 2, 
    backgroundColor: `${colors.warning}15`, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6
  },
  hotelStarLabel: { fontSize: 10, fontWeight: '900', color: colors.warning },

  /* Transport Promo */
  promoBanner: { 
    marginHorizontal: 20, marginTop: 32, padding: 20, borderRadius: 24, 
    backgroundColor: `${colors.primary}08`, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: `${colors.primary}20`
  },
  promoIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  promoTextRow: { flex: 1, marginLeft: 16 },
  promoTitleText: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  promoSubText: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  promoPill: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  promoPillText: { color: colors.white, fontSize: 13, fontWeight: '800' },

  /* Transit Cards */
  routeCard: { 
    width: 280, padding: 18, borderRadius: 24, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, elevation: 3
  },
  routeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  routeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  routeBadgeText: { fontSize: 11, fontWeight: '900' },
  routePriceText: { fontSize: 16, fontWeight: '900', color: colors.success },
  routeMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  routeStationBox: { flex: 1 },
  routeTimeText: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  routeStationText: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', marginTop: 2 },
  routePathBox: { width: 80, alignItems: 'center', marginHorizontal: 8 },
  routePathLine: { width: '100%', height: 2, borderRadius: 1 },
  routePathCircle: { 
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white, 
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: -13 
  },
  routeDurationText: { fontSize: 10, fontWeight: '900', marginTop: 4 },
  routeFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  routeFooterText: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },

  /* CTA Box */
  ctaBox: { marginHorizontal: 20, marginTop: 40 },
  ctaGradient: { padding: 32, borderRadius: 32, alignItems: 'center' },
  ctaIconBox: { 
    width: 72, height: 72, borderRadius: 24, 
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20
  },
  ctaTitle: { fontSize: 26, fontWeight: '900', color: colors.white, textAlign: 'center' },
  ctaDesc: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 12, lineHeight: 22 },
  featurePills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 20 },
  featPill: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  featPillText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  finalBtn: { 
    backgroundColor: colors.primary, width: '100%', paddingVertical: 18, 
    borderRadius: 20, alignItems: 'center', marginTop: 32,
    elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10
  },
  finalBtnText: { color: colors.white, fontSize: 17, fontWeight: '900' },

  /* Footer */
  footer: { paddingVertical: 32, alignItems: 'center' },
  footerLine: { width: 40, height: 3, backgroundColor: colors.border, borderRadius: 2, marginBottom: 16 },
  footerText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  footerCopy: { fontSize: 12, color: colors.textMuted, marginTop: 4 }
});

export default GuestScreen;
