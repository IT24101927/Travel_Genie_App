import React, { useEffect, useMemo, useCallback, useRef, useState, memo } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  TouchableOpacity, ActivityIndicator, Dimensions,
  ScrollView, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/client';
import colors from '../../constants/colors';
import FallbackImage from '../../components/common/FallbackImage';

const { width } = Dimensions.get('window');
const CARD_SIZE = Math.floor((width - 48) / 2);

/* Province → placeholder color for cards without images */
const PROVINCE_COLORS = {
  'Western':   { bg: '#0C6B4F', icon: 'rgba(255,255,255,0.4)' },
  'Central':   { bg: '#5C4AB8', icon: 'rgba(255,255,255,0.4)' },
  'Southern':  { bg: '#C44D2A', icon: 'rgba(255,255,255,0.4)' },
  'Northern':  { bg: '#1A6EA8', icon: 'rgba(255,255,255,0.4)' },
  'Eastern':   { bg: '#0A7A60', icon: 'rgba(255,255,255,0.4)' },
  'North Western': { bg: '#B87D1A', icon: 'rgba(255,255,255,0.4)' },
  'North Central': { bg: '#8B4513', icon: 'rgba(255,255,255,0.4)' },
  'Uva':       { bg: '#2E7D32', icon: 'rgba(255,255,255,0.4)' },
  'Sabaragamuwa': { bg: '#6A1B9A', icon: 'rgba(255,255,255,0.4)' },
};
const getProvinceColor = (province) => PROVINCE_COLORS[province] || { bg: '#3A5A4A', icon: 'rgba(255,255,255,0.4)' };

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

const CARD_HEIGHT = Math.floor(CARD_SIZE * 1.35);

const getOverviewRegion = (coordinates, options = {}) => {
  const {
    minLatitudeDelta = 0.6,
    minLongitudeDelta = 0.6,
    latitudePadding = 1.7,
    longitudePadding = 2,
  } = options;

  if (!coordinates.length) {
    return {
      latitude: 7.8731,
      longitude: 80.7718,
      latitudeDelta: 5.5,
      longitudeDelta: 3.5,
    };
  }

  const lats = coordinates.map((coord) => coord.latitude);
  const lngs = coordinates.map((coord) => coord.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * latitudePadding, minLatitudeDelta),
    longitudeDelta: Math.max((maxLng - minLng) * longitudePadding, minLongitudeDelta),
  };
};

const SRI_LANKA_REGION = getOverviewRegion(Object.values(DISTRICT_COORDS), {
  minLatitudeDelta: 5.4,
  minLongitudeDelta: 3.5,
  latitudePadding: 1.55,
  longitudePadding: 1.8,
});

/* ── District card (memoized) ── */
const DistrictCard = memo(({ item, isHighlighted, onPress }) => {
  const pColor = getProvinceColor(item.province);
  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_SIZE, height: CARD_HEIGHT }, isHighlighted && styles.cardHighlight]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      {/*
       * FallbackImage fills the card.
       * Gradient children ONLY render when the image has loaded —
       * this prevents colour-band artefacts on flat placeholder backgrounds.
       */}
      <FallbackImage
        uri={item.image_url}
        style={StyleSheet.absoluteFill}
        iconName="map-outline"
        iconSize={44}
        placeholderColor={pColor.bg}
        placeholderIconColor={pColor.icon}
      >
        {/* Single bottom scrim — one layer = zero seam lines on photos */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradBottom} />
      </FallbackImage>

      {/* Province badge — dark background so it reads on any photo, no top scrim needed */}
      <View style={styles.provinceBadge}>
        <Text style={styles.provinceText}>{item.province.toUpperCase()}</Text>
      </View>

      {/* Bottom content — always visible */}
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.arrowBubble}>
            <Ionicons name="arrow-forward" size={11} color={colors.white} />
          </View>
        </View>
        {item.highlights?.length > 0 && (
          <Text style={styles.cardHint} numberOfLines={1}>
            {item.highlights.slice(0, 2).join('  ·  ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function DistrictListScreen({ navigation }) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapLaidOut, setMapLaidOut] = useState(false);
  const listRef = useRef(null);
  const mapViewRef = useRef(null);
  const regionRef = useRef(SRI_LANKA_REGION);

  const filtered = useMemo(() => {
    let result = districts;
    if (selectedProvince !== 'All') {
      result = result.filter((d) => d.province === selectedProvince);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.province.toLowerCase().includes(q) ||
          (d.highlights && d.highlights.some((h) => h.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [districts, selectedProvince, searchQuery]);

  const districtCoordinates = useMemo(
    () => filtered.map((d) => DISTRICT_COORDS[d.name]).filter(Boolean),
    [filtered]
  );

  const fitAllDistrictPins = useCallback((animated = true) => {
    if (!mapViewRef.current || districtCoordinates.length === 0) return;

    const next = districtCoordinates.length === 1
      ? { ...districtCoordinates[0], latitudeDelta: 0.2, longitudeDelta: 0.2 }
      : selectedProvince === 'All'
        ? SRI_LANKA_REGION
        : getOverviewRegion(districtCoordinates);

    regionRef.current = next;
    mapViewRef.current.animateToRegion(next, animated ? 500 : 0);
  }, [districtCoordinates, selectedProvince]);

  const zoomIn = useCallback(() => {
    const r = regionRef.current;
    const next = { ...r, latitudeDelta: Math.max(r.latitudeDelta / 2, 0.05), longitudeDelta: Math.max(r.longitudeDelta / 2, 0.03) };
    regionRef.current = next;
    mapViewRef.current?.animateToRegion(next, 300);
  }, []);

  const zoomOut = useCallback(() => {
    const r = regionRef.current;
    const next = { ...r, latitudeDelta: Math.min(r.latitudeDelta * 2, 12), longitudeDelta: Math.min(r.longitudeDelta * 2, 10) };
    regionRef.current = next;
    mapViewRef.current?.animateToRegion(next, 300);
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (!mapReady || !mapLaidOut || districtCoordinates.length === 0) return;

    const timers = [0, 250, 900].map((delay) =>
      setTimeout(() => fitAllDistrictPins(false), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [mapReady, mapLaidOut, districtCoordinates.length, selectedProvince, fitAllDistrictPins]);

  const fetchDistricts = async () => {
    try {
      const response = await api.get('/districts');
      setDistricts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const provinces = useMemo(() => {
    const set = new Set(districts.map((d) => d.province));
    return ['All', ...Array.from(set).sort()];
  }, [districts]);

  const handleMarkerPress = useCallback((district) => {
    setHighlightedId(district.district_id);
    setSelectedDistrict(district);
    const idx = filtered.findIndex((d) => d.district_id === district.district_id);
    if (idx !== -1 && listRef.current) {
      setTimeout(() => {
        const rowIndex = Math.floor(idx / 2);
        listRef.current?.scrollToIndex({ index: rowIndex, animated: true, viewPosition: 0 });
      }, 100);
    }
  }, [filtered]);

  const handleProvinceChange = useCallback((province) => {
    setSelectedProvince(province);
    setHighlightedId(null);
    setSelectedDistrict(null);

    setTimeout(() => {
      const nextDistricts = province === 'All'
        ? districts
        : districts.filter((district) => district.province === province);
      const nextCoordinates = nextDistricts.map((district) => DISTRICT_COORDS[district.name]).filter(Boolean);

      if (mapViewRef.current && nextCoordinates.length > 0) {
        const nextRegion = nextCoordinates.length === 1
          ? { ...nextCoordinates[0], latitudeDelta: 0.2, longitudeDelta: 0.2 }
          : province === 'All'
            ? SRI_LANKA_REGION
            : getOverviewRegion(nextCoordinates);

        regionRef.current = nextRegion;
        mapViewRef.current.animateToRegion(nextRegion, 450);
      }
    }, 80);
  }, [districts]);

  const handleCardPress = useCallback((item) => {
    navigation.navigate('PlaceList', { districtId: item.district_id, districtName: item.name });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <DistrictCard
      item={item}
      isHighlighted={highlightedId === item.district_id}
      onPress={handleCardPress}
    />
  ), [highlightedId, handleCardPress]);

  const keyExtractor = useCallback((item) => item.district_id.toString(), []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Fixed top section ── */}
      <View style={styles.topSection}>
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Explore Sri Lanka</Text>
            <Text style={styles.screenSub}>{districts.length} districts · tap a pin to jump</Text>
          </View>
          <View style={styles.countPill}>
            <Ionicons name="map" size={13} color={colors.primary} />
            <Text style={styles.countPillText}>{filtered.length}</Text>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapWrap} onLayout={() => setMapLaidOut(true)}>
          <MapView
            ref={mapViewRef}
            style={styles.map}
            initialRegion={SRI_LANKA_REGION}
            onMapReady={() => setMapReady(true)}
            onRegionChangeComplete={(r) => { regionRef.current = r; }}
            onPress={() => { setHighlightedId(null); setSelectedDistrict(null); }}
            scrollEnabled zoomEnabled pitchEnabled={false} rotateEnabled={false}
            mapPadding={{ top: 0, right: 0, bottom: 10, left: 0 }}
          >
            {filtered.map((d) => {
              const coords = DISTRICT_COORDS[d.name];
              if (!coords) return null;
              const isHighlighted = highlightedId === d.district_id;
              return (
                <Marker
                  key={`d_${d.district_id}_${isHighlighted}`}
                  coordinate={coords}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleMarkerPress(d);
                  }}
                  pinColor={isHighlighted ? 'red' : '#17A34A'}
                />
              );
            })}
          </MapView>

          {/* Overlay: passes touches to map, children still receive their own touches */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* District detail popup card */}
            {selectedDistrict && (
              <View style={styles.mapDetailCard}>
                <View style={styles.mapDetailPhotoWrap}>
                  <FallbackImage
                    uri={selectedDistrict.image_url}
                    style={styles.mapDetailPhoto}
                    iconName="map-outline"
                    iconSize={24}
                  />
                </View>
                <View style={styles.mapDetailBody}>
                  <Text style={styles.mapDetailName} numberOfLines={1}>{selectedDistrict.name}</Text>
                  <Text style={styles.mapDetailProv}>{selectedDistrict.province} Province</Text>
                  {selectedDistrict.highlights?.length > 0 && (
                    <Text style={styles.mapDetailHighlights} numberOfLines={1}>
                      {selectedDistrict.highlights.slice(0, 2).join(' · ')}
                    </Text>
                  )}
                </View>
                <View style={styles.mapDetailActions}>
                  <Pressable
                    style={styles.mapDetailExploreBtn}
                    onPress={() => navigation.navigate('PlaceList', { districtId: selectedDistrict.district_id, districtName: selectedDistrict.name })}
                  >
                    <Text style={styles.mapDetailExploreText}>Explore</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.white} />
                  </Pressable>
                  <Pressable style={styles.mapDetailClose} onPress={() => { setHighlightedId(null); setSelectedDistrict(null); }}>
                    <Ionicons name="close" size={15} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable
              style={styles.resetViewBtn}
              onPress={() => { fitAllDistrictPins(true); setSelectedDistrict(null); setHighlightedId(null); }}
            >
              <Ionicons name="scan-outline" size={15} color={colors.textPrimary} />
              <Text style={styles.resetViewText}>Reset</Text>
            </Pressable>

            {/* Zoom controls */}
            <View style={styles.zoomControls}>
              <Pressable style={styles.zoomBtn} onPress={zoomIn}>
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </Pressable>
              <Pressable style={styles.zoomBtn} onPress={zoomOut}>
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Search bar */}
        <View style={[styles.searchRow, { marginTop: 12 }]}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search districts, provinces..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Province filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {provinces.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, selectedProvince === p && styles.chipActive]}
              onPress={() => handleProvinceChange(p)}
            >
              <Text style={[styles.chipText, selectedProvince === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Scrollable grid ── */}
      <FlatList
        ref={listRef}
        data={filtered}
        extraData={highlightedId}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: CARD_HEIGHT + 16,
          offset: (CARD_HEIGHT + 16) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          setTimeout(() => {
            if (filtered.length !== 0 && listRef.current) {
              listRef.current.scrollToIndex({ index: info.index, animated: true, viewPosition: 0 });
            }
          }, 400);
        }}
        windowSize={5}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>No districts in this province</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: colors.textMuted, fontSize: 14 },

  /* Top fixed section */
  topSection: { backgroundColor: colors.background },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  screenSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countPillText: { fontSize: 13, fontWeight: '800', color: colors.primary },

  /* Search */
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingHorizontal: 16, marginBottom: 12,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, paddingHorizontal: 10, height: '100%' },

  mapWrap: { width: '100%', height: 230 },
  map: { width: '100%', height: '100%' },
  zoomControls: {
    position: 'absolute',
    top: 48,
    right: 10,
    gap: 7,
  },
  zoomBtn: {
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
  resetViewBtn: {
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
  resetViewText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  /* Map detail popup card */
  mapDetailCard: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapDetailPhotoWrap: { width: 72, height: 72 },
  mapDetailPhoto: { width: '100%', height: '100%' },
  mapDetailBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  mapDetailName: { fontSize: 14, fontWeight: '900', color: colors.textPrimary, marginBottom: 2 },
  mapDetailProv: { fontSize: 11, color: colors.primary, fontWeight: '700', marginBottom: 3 },
  mapDetailHighlights: { fontSize: 10, color: colors.textMuted },
  mapDetailActions: { flexDirection: 'column', alignItems: 'center', gap: 6, paddingRight: 10 },
  mapDetailExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  mapDetailExploreText: { fontSize: 12, fontWeight: '700', color: colors.white },
  mapDetailClose: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },

  filterRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  /* Grid */
  grid: { paddingHorizontal: 16, paddingBottom: 140, paddingTop: 16 },
  row: { justifyContent: 'space-between', marginBottom: 16 },

  card: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: colors.surface3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardHighlight: {
    borderColor: 'red',
    borderWidth: 2.5,
  },

  /* Single bottom scrim — tall enough to anchor text at the bottom */
  gradBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '72%',
  },

  /* Province badge */
  provinceBadge: {
    position: 'absolute',
    top: 11,
    left: 11,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  provinceText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* Card text content */
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.white,
    flex: 1,
    letterSpacing: -0.3,
  },
  arrowBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.68)',
    fontWeight: '500',
  },

  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
