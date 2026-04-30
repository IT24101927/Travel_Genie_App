import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, Image, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

import colors from '../../constants/colors';
import FallbackImage from '../../components/common/FallbackImage';
import { useAuth } from '../../context/AuthContext';
import { getPlacesApi } from '../../api/placeApi';
import { getHotelsApi } from '../../api/hotelApi';
import api from '../../api/client';
import { getPlaceImageCandidates } from '../../utils/placeImages';

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

/* ── Place Card ── */
const PlaceCard = ({ item, onPress, isHighlighted }) => (
  <Pressable style={[styles.placeCard, isHighlighted && styles.placeCardHighlight]} onPress={onPress}>
    <FallbackImage
      uri={getPlaceImageCandidates(item)}
      style={styles.placeCardImage}
      iconName="image-outline"
      iconSize={28}
    />
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

/* ── Hotel Card ── */
const HotelCard = ({ item, onPress }) => (
  <Pressable style={styles.hotelCard} onPress={onPress}>
    {item.image ? (
      <Image source={{ uri: item.image }} style={styles.hotelCardImage} />
    ) : (
      <View style={[styles.hotelCardImage, styles.hotelCardImagePlaceholder]}>
        <Ionicons name="bed-outline" size={28} color={colors.textMuted} />
      </View>
    )}
    <View style={styles.hotelCardBody}>
      <Text style={styles.hotelCardTitle} numberOfLines={1}>{item.name || 'Hotel'}</Text>
      {(item.location || item.city) ? (
        <View style={styles.placeCardRow}>
          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
          <Text style={styles.placeCardSub} numberOfLines={1}>{item.location || item.city}</Text>
        </View>
      ) : null}
      {item.pricePerNight ? (
        <Text style={styles.hotelCardPrice}>LKR {item.pricePerNight?.toLocaleString()}/night</Text>
      ) : null}
    </View>
  </Pressable>
);

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
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);
  const districtListRef = useRef(null);
  const placesListRef = useRef(null);
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
  }, []);

  const loadData = async () => {
    try {
      const [dRes, pRes, hRes] = await Promise.allSettled([
        api.get('/districts'),
        getPlacesApi({}),
        getHotelsApi({}),
      ]);
      if (dRes.status === 'fulfilled') setDistricts(dRes.value?.data?.data || []);
      if (pRes.status === 'fulfilled') setPlaces(pRes.value?.data?.places || []);
      if (hRes.status === 'fulfilled') setHotels(hRes.value?.data?.hotels || []);
    } finally {
      setLoadingDistricts(false);
      setLoadingPlaces(false);
      setLoadingHotels(false);
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
  const onLoginPress = () => exitGuest();
  const promptLogin = () => navigation.navigate('GuestSignInPrompt');

  const handleMarkerPress = useCallback((district) => {
    setHighlightedId(district.district_id);
    setSelectedDistrict(district);
    setSelectedPlace(null);
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
      mapRef.current.animateToRegion({
        ...coords,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      }, 500);
    } else {
      promptLogin();
    }
  }, []);

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

  const handlePlaceMarkerPress = useCallback((place) => {
    setSelectedPlace(place);
    // Scroll to the matching card in the places list
    const idx = visiblePlaces.findIndex((p) => p._id === place._id);
    if (idx !== -1 && placesListRef.current) {
      const CARD_W = 180;
      const GAP = 12;
      const offset = Math.max(0, idx * (CARD_W + GAP));
      setTimeout(() => {
        placesListRef.current?.scrollToOffset({ offset, animated: true });
      }, 200);
    }
  }, [visiblePlaces]);

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
        <View style={styles.hero}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Explore{'\n'}Sri Lanka</Text>
            <Text style={styles.heroSub}>Discover amazing places, find the best stays, and plan your perfect trip</Text>
          </View>
          <Pressable onPress={onLoginPress} style={styles.heroBtn}>
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={styles.heroBtnText}>Sign up — it's free</Text>
          </Pressable>
        </View>

        {/* ── Map Section ── */}
        <View style={styles.mapSection}>
          <SectionHeader title="Map" icon="navigate" onSeeMore={null} />
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
              onPress={() => { setHighlightedId(null); setSelectedDistrict(null); setSelectedPlace(null); }}
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
            </MapView>

            {/* Popup card — district or place */}
            {(selectedDistrict || selectedPlace) && (
              <View style={styles.mapPopup} pointerEvents="box-none">
                {selectedPlace ? (
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
                    <Pressable style={styles.mapPopupClose} onPress={() => { setHighlightedId(null); setSelectedDistrict(null); setSelectedPlace(null); }}>
                      <Ionicons name="close" size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Zoom + / - controls */}
            <View style={styles.zoomControls} pointerEvents="box-none">
              <Pressable style={styles.zoomBtn} onPress={zoomIn}>
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </Pressable>
              <Pressable style={styles.zoomBtn} onPress={zoomOut}>
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Reset button */}
            <Pressable style={styles.resetViewBtn} onPress={resetMap}>
              <Ionicons name="scan-outline" size={15} color={colors.textPrimary} />
              <Text style={styles.resetViewText}>Reset</Text>
            </Pressable>
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

        {/* ── Featured Hotels ── */}
        <View style={styles.section}>
          <SectionHeader title="Featured Hotels" icon="bed" onSeeMore={promptLogin} />
          {loadingHotels ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : hotels.length === 0 ? (
            <Text style={styles.emptyText}>No hotels yet.</Text>
          ) : (
            <FlatList
              data={hotels.slice(0, 8)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <HotelCard item={item} onPress={promptLogin} />}
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
        <View style={styles.unlockCard}>
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
                  <Ionicons name={f.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
            onPress={onLoginPress}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.white} />
            <Text style={styles.ctaBtnText}>Create Free Account</Text>
          </Pressable>
          <Pressable style={styles.ctaSecondary} onPress={onLoginPress}>
            <Text style={styles.ctaSecondaryText}>
              Already have an account? <Text style={styles.ctaSecondaryLink}>Sign In</Text>
            </Text>
          </Pressable>
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
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, gap: 8,
  },
  heroTextWrap: { marginBottom: 8 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: colors.white, letterSpacing: -0.5, lineHeight: 38 },
  heroSub: { fontSize: 14, color: '#A8E6D0', lineHeight: 21, marginTop: 6 },
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
  mapWrap: { width: '100%', height: 300, marginBottom: 12 },
  map: { width: '100%', height: '100%' },
  zoomControls: {
    position: 'absolute', left: 8, top: '35%', gap: 6,
  },
  zoomBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
  resetViewBtn: {
    position: 'absolute', top: '35%', right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
  resetViewText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
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
    width: 120, height: 160, borderRadius: 14,
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
    justifyContent: 'flex-start', paddingHorizontal: 10, paddingTop: 10,
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

  /* Place cards */
  placeCard: {
    width: 180, backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  placeCardHighlight: { borderColor: colors.primary, borderWidth: 2 },
  placeCardImage: { width: '100%', height: 115 },
  placeCardBody: { padding: 10 },
  placeCardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  placeCardRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  placeCardSub: { fontSize: 12, color: colors.textMuted, flex: 1 },

  /* Hotel cards */
  hotelCard: {
    width: 180, backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  hotelCardImage: { width: '100%', height: 115 },
  hotelCardImagePlaceholder: {
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  hotelCardBody: { padding: 10 },
  hotelCardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  hotelCardPrice: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 4 },

  /* Unlock card */
  unlockCard: {
    margin: 20, backgroundColor: colors.surface, borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: colors.border,
  },
  unlockIconRow: { alignItems: 'center', marginBottom: 16 },
  unlockIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#EAF4F1', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#DCEBE4',
  },
  unlockTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  unlockSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  featureItem: { width: '30%', alignItems: 'center', gap: 6 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EAF4F1', alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, marginBottom: 12,
  },
  ctaBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  ctaSecondary: { alignItems: 'center' },
  ctaSecondaryText: { color: colors.textSecondary, fontSize: 14 },
  ctaSecondaryLink: { color: colors.primary, fontWeight: '700' },
});

export default GuestScreen;
