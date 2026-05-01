import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

import { LinearGradient } from 'expo-linear-gradient';
import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import FallbackImage from '../../components/common/FallbackImage';
import { getDistrictsApi } from '../../api/districtApi';
import colors from '../../constants/colors';
import { getApiErrorMessage } from '../../utils/apiError';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMPACT_LAYOUT = SCREEN_HEIGHT < 700;
const GAP = 14;
const CARD_W = Math.floor((width - 32 - GAP) / 2);
const CARD_H = Math.floor(CARD_W * 1.3);
const FEATURE_W = Math.min(220, Math.floor(width * 0.62));
const FEATURE_H = COMPACT_LAYOUT ? 52 : 76;
const FEATURE_IMG = COMPACT_LAYOUT ? 38 : 54;
const MAP_H = COMPACT_LAYOUT ? 220 : 300;

const PROVINCE_ORDER = [
  'All',
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
];

const PROVINCE_ACCENTS = {
  Western: '#0E7C5F',
  Central: '#5C4AB8',
  Southern: '#D4532B',
  Northern: '#1A6EA8',
  Eastern: '#0A7A60',
  'North Western': '#B87D1A',
  'North Central': '#8B4513',
  Uva: '#2E7D32',
  Sabaragamuwa: '#6A1B9A',
};

const DISTRICT_COORDS = {
  Colombo: { latitude: 6.9271, longitude: 79.8612 },
  Gampaha: { latitude: 7.0917, longitude: 80.0000 },
  Kalutara: { latitude: 6.5854, longitude: 79.9607 },
  Kandy: { latitude: 7.2906, longitude: 80.6337 },
  Matale: { latitude: 7.4675, longitude: 80.6234 },
  'Nuwara Eliya': { latitude: 6.9497, longitude: 80.7891 },
  Galle: { latitude: 6.0535, longitude: 80.2210 },
  Matara: { latitude: 5.9549, longitude: 80.5550 },
  Hambantota: { latitude: 6.1429, longitude: 81.1212 },
  Jaffna: { latitude: 9.6615, longitude: 80.0255 },
  Kilinochchi: { latitude: 9.3803, longitude: 80.4000 },
  Mannar: { latitude: 8.9810, longitude: 79.9044 },
  Vavuniya: { latitude: 8.7514, longitude: 80.4971 },
  Mullaitivu: { latitude: 9.2671, longitude: 80.8128 },
  Batticaloa: { latitude: 7.7310, longitude: 81.6747 },
  Ampara: { latitude: 7.2910, longitude: 81.6724 },
  Trincomalee: { latitude: 8.5874, longitude: 81.2152 },
  Kurunegala: { latitude: 7.4863, longitude: 80.3647 },
  Puttalam: { latitude: 8.0362, longitude: 79.8283 },
  Anuradhapura: { latitude: 8.3114, longitude: 80.4037 },
  Polonnaruwa: { latitude: 7.9403, longitude: 81.0188 },
  Badulla: { latitude: 6.9934, longitude: 81.0550 },
  Monaragala: { latitude: 6.8728, longitude: 81.3507 },
  Ratnapura: { latitude: 6.6828, longitude: 80.4125 },
  Kegalle: { latitude: 7.2513, longitude: 80.3464 },
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();
const getAccent = (province) => PROVINCE_ACCENTS[province] || colors.primary;
const getDistrictCoords = (district) => DISTRICT_COORDS[district?.name];

const sortByDistrictId = (a, b) => {
  const aId = Number(a.district_id);
  const bId = Number(b.district_id);
  if (Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId;
  if (Number.isFinite(aId)) return -1;
  if (Number.isFinite(bId)) return 1;
  return String(a.name || '').localeCompare(String(b.name || ''));
};

const getOverviewRegion = (coordinates, options = {}) => {
  const {
    minLatitudeDelta = 0.58,
    minLongitudeDelta = 0.5,
    latitudePadding = 1.45,
    longitudePadding = 1.55,
  } = options;

  if (!coordinates.length) {
    return {
      latitude: 7.8731,
      longitude: 80.7718,
      latitudeDelta: 5.4,
      longitudeDelta: 3.4,
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
  minLongitudeDelta: 3.4,
  latitudePadding: 1.45,
  longitudePadding: 1.65,
});

const getDistrictNote = (district) => {
  const highlights = district.highlights || district.best_for || [];
  return highlights.length ? highlights.slice(0, 2).join(' / ') : 'Places, routes and local highlights';
};

const DistrictCard = memo(({ item, highlighted, onPress }) => {
  const accent = getAccent(item.province);

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={[styles.districtCard, highlighted && styles.cardHighlighted]}
      onPress={() => onPress(item)}
    >
      <FallbackImage
        uri={item.image_url}
        style={StyleSheet.absoluteFill}
        iconName="map-outline"
        iconSize={44}
        placeholderColor={accent}
        placeholderIconColor="rgba(255,255,255,0.35)"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.82)']}
        style={styles.cardGrad}
      />

      <View style={[styles.cardProvinceBadge, { backgroundColor: accent }]}>
        <Text style={styles.cardProvinceBadgeText}>{(item.province || 'Sri Lanka').toUpperCase()}</Text>
      </View>

      <View style={[styles.cardNumberBadge, { backgroundColor: accent }]}>
        <Text style={styles.cardNumberText}>{item.district_id || '-'}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={10} color={colors.white} />
          </View>
        </View>
        <Text style={styles.cardHint} numberOfLines={1}>{getDistrictNote(item)}</Text>
      </View>
    </TouchableOpacity>
  );
});

const FeatureDistrict = ({ item, onPress }) => {
  const accent = getAccent(item.province);

  return (
    <Pressable style={styles.featureCard} onPress={() => onPress(item)}>
      <FallbackImage
        uri={item.image_url}
        style={styles.featureImage}
        iconName="map-outline"
        iconSize={24}
        placeholderColor={accent}
        placeholderIconColor="rgba(255,255,255,0.45)"
      />
      <View style={styles.featureBody}>
        <Text style={styles.featureName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.featureSub} numberOfLines={1}>{getDistrictNote(item)}</Text>
      </View>
      <View style={[styles.featureDot, { backgroundColor: accent }]} />
    </Pressable>
  );
};

export default function DistrictListScreen({ route, navigation }) {
  const nextScreen = route?.params?.nextScreen || 'PlaceList';
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapLaidOut, setMapLaidOut] = useState(false);

  const listRef = useRef(null);
  const mapRef = useRef(null);
  const regionRef = useRef(SRI_LANKA_REGION);
  const headerHeightRef = useRef(0);

  const fetchDistricts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getDistrictsApi();
      setDistricts((response?.data || []).slice().sort(sortByDistrictId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load districts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  const provinces = useMemo(() => {
    const available = new Set(districts.map((district) => district.province).filter(Boolean));
    return PROVINCE_ORDER.filter((province) => province === 'All' || available.has(province));
  }, [districts]);

  const filtered = useMemo(() => {
    const q = normalizeText(searchQuery);
    return districts
      .filter((district) => selectedProvince === 'All' || district.province === selectedProvince)
      .filter((district) => {
        if (!q) return true;
        return (
          normalizeText(district.name).includes(q) ||
          normalizeText(district.province).includes(q) ||
          (district.highlights || []).some((highlight) => normalizeText(highlight).includes(q)) ||
          (district.best_for || []).some((item) => normalizeText(item).includes(q))
        );
      })
      .sort(sortByDistrictId);
  }, [districts, searchQuery, selectedProvince]);

  const featured = useMemo(
    () => districts
      .filter((district) => (district.highlights || district.best_for || []).length > 0)
      .slice()
      .sort((a, b) => {
        const bScore = (b.highlights || []).length + (b.best_for || []).length;
        const aScore = (a.highlights || []).length + (a.best_for || []).length;
        return bScore - aScore || sortByDistrictId(a, b);
      })
      .slice(0, 6),
    [districts]
  );

  const districtCoordinates = useMemo(
    () => filtered.map(getDistrictCoords).filter(Boolean),
    [filtered]
  );
  const selectedCoordinate = selectedDistrict ? getDistrictCoords(selectedDistrict) : null;

  const fitDistrictPins = useCallback((animated = true) => {
    if (!mapRef.current || !districtCoordinates.length) return;

    const region = districtCoordinates.length === 1
      ? { ...districtCoordinates[0], latitudeDelta: 0.42, longitudeDelta: 0.38 }
      : getOverviewRegion(districtCoordinates);

    regionRef.current = region;

    if (districtCoordinates.length > 1) {
      mapRef.current.fitToCoordinates(districtCoordinates, {
        edgePadding: { top: 34, right: 50, bottom: 38, left: 50 },
        animated,
      });
      return;
    }

    mapRef.current.animateToRegion(region, animated ? 420 : 0);
  }, [districtCoordinates]);

  useEffect(() => {
    if (!mapReady || !mapLaidOut || !districtCoordinates.length) return undefined;

    const timers = [0, 260, 820].map((delay) =>
      setTimeout(() => fitDistrictPins(false), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [districtCoordinates.length, fitDistrictPins, mapLaidOut, mapReady, selectedProvince]);

  useEffect(() => {
    if (!selectedCoordinate || !mapReady || !mapLaidOut) return;

    const latitudeDelta = 0.52;
    const longitudeDelta = 0.46;
    const region = {
      latitude: selectedCoordinate.latitude - latitudeDelta * 0.12,
      longitude: selectedCoordinate.longitude,
      latitudeDelta,
      longitudeDelta,
    };

    regionRef.current = region;
    mapRef.current?.animateToRegion(region, 360);
  }, [mapLaidOut, mapReady, selectedCoordinate?.latitude, selectedCoordinate?.longitude]);

  const zoomIn = useCallback(() => {
    const current = regionRef.current;
    const next = {
      ...current,
      latitudeDelta: Math.max(current.latitudeDelta / 1.75, 0.06),
      longitudeDelta: Math.max(current.longitudeDelta / 1.75, 0.04),
    };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 260);
  }, []);

  const zoomOut = useCallback(() => {
    const current = regionRef.current;
    const next = {
      ...current,
      latitudeDelta: Math.min(current.latitudeDelta * 1.75, 8),
      longitudeDelta: Math.min(current.longitudeDelta * 1.75, 6),
    };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 260);
  }, []);

  const openDistrict = useCallback((district) => {
    navigation.navigate(nextScreen, {
      districtId: district.district_id,
      districtName: district.name,
    });
  }, [navigation, nextScreen]);

  const scrollToDistrictCard = useCallback((district) => {
    const itemIndex = filtered.findIndex((item) => item.district_id === district.district_id);
    if (itemIndex < 0 || !listRef.current) return;

    const rowIndex = Math.floor(itemIndex / 2);
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: rowIndex, animated: true, viewPosition: 0 });
    }, 150);
  }, [filtered]);

  const handleMarkerPress = useCallback((district) => {
    setHighlightedId(district.district_id);
    setSelectedDistrict(district);
    scrollToDistrictCard(district);
  }, [scrollToDistrictCard]);

  const handleProvinceChange = useCallback((province) => {
    setSelectedProvince(province);
    setHighlightedId(null);
    setSelectedDistrict(null);
  }, []);

  const renderDistrict = useCallback(({ item }) => (
    <DistrictCard
      item={item}
      highlighted={highlightedId === item.district_id}
      onPress={openDistrict}
    />
  ), [highlightedId, openDistrict]);

  const keyExtractor = useCallback((item) => String(item.district_id || item.name), []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading place districts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Fixed top: intro + map (never scrolls away) ── */}
      <View style={styles.fixedTop}>
        <View style={styles.intro}>
          <View style={styles.introCopy}>
            <Text style={styles.eyebrow}>District Atlas</Text>
            <Text style={styles.title}>Explore Sri Lanka</Text>
            <Text style={styles.subtitle}>Use the map first, then jump into local places.</Text>
          </View>
          <View style={styles.countPill}>
            <Ionicons name="map" size={14} color={colors.primary} />
            <Text style={styles.countPillText}>{filtered.length}</Text>
          </View>
        </View>

        <View style={styles.mapPanel} onLayout={() => setMapLaidOut(true)}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={SRI_LANKA_REGION}
            onMapReady={() => setMapReady(true)}
            onRegionChangeComplete={(region) => { regionRef.current = region; }}
            onPress={() => {
              setHighlightedId(null);
              setSelectedDistrict(null);
            }}
            scrollEnabled
            zoomEnabled
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {filtered.map((district) => {
              const coordinate = getDistrictCoords(district);
              if (!coordinate) return null;
              const highlighted = highlightedId === district.district_id;
              return (
                <Marker
                  key={`district_${district.district_id}_${highlighted}`}
                  coordinate={coordinate}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    handleMarkerPress(district);
                  }}
                  pinColor={highlighted ? colors.accent : colors.success}
                />
              );
            })}
          </MapView>

          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={styles.mapBadge}>
              <Ionicons name="navigate" size={13} color={colors.primary} />
              <Text style={styles.mapBadgeText}>{districtCoordinates.length} mapped</Text>
            </View>

            <Pressable
              style={styles.resetButton}
              onPress={() => {
                fitDistrictPins(true);
                setHighlightedId(null);
                setSelectedDistrict(null);
                setTimeout(() => {
                  listRef.current?.scrollToOffset({ offset: 0, animated: true });
                }, 150);
              }}
            >
              <Ionicons name="scan-outline" size={15} color={colors.textPrimary} />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>

            <View style={styles.zoomControls}>
              <Pressable style={styles.zoomButton} onPress={zoomIn}>
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </Pressable>
              <Pressable style={styles.zoomButton} onPress={zoomOut}>
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            {selectedDistrict ? (
              <View style={styles.mapPreview}>
                <View style={[styles.mapPreviewThumb, { backgroundColor: getAccent(selectedDistrict.province) + '16' }]}>
                  <FallbackImage
                    uri={selectedDistrict.image_url}
                    style={StyleSheet.absoluteFill}
                    iconName="map-outline"
                    iconSize={24}
                    placeholderColor={getAccent(selectedDistrict.province) + '16'}
                    placeholderIconColor={getAccent(selectedDistrict.province)}
                  />
                  <View style={[styles.mapPreviewNumber, { backgroundColor: getAccent(selectedDistrict.province) }]}>
                    <Text style={styles.mapPreviewNumberText}>{selectedDistrict.district_id || '-'}</Text>
                  </View>
                </View>

                <Pressable style={styles.mapPreviewBody} onPress={() => openDistrict(selectedDistrict)}>
                  <View style={[styles.mapPreviewProvincePill, { backgroundColor: getAccent(selectedDistrict.province) + '14' }]}>
                    <Text style={[styles.mapPreviewProvinceText, { color: getAccent(selectedDistrict.province) }]} numberOfLines={1}>
                      {selectedDistrict.province || 'Sri Lanka'}
                    </Text>
                  </View>
                  <Text style={styles.mapPreviewTitle} numberOfLines={1}>{selectedDistrict.name}</Text>
                  <Text style={styles.mapPreviewSub} numberOfLines={1}>
                    {getDistrictNote(selectedDistrict)}
                  </Text>
                </Pressable>

                <View style={styles.mapPreviewActions}>
                  <Pressable
                    style={styles.mapPreviewClose}
                    onPress={() => {
                      setSelectedDistrict(null);
                      setHighlightedId(null);
                    }}
                  >
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </Pressable>
                  <Pressable style={styles.mapPreviewAction} onPress={() => openDistrict(selectedDistrict)}>
                    <Ionicons name="arrow-forward" size={18} color={colors.white} />
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Scrollable: search + filters + quick picks + cards ── */}
      <FlatList
        ref={listRef}
        style={styles.cardList}
        data={filtered}
        extraData={highlightedId}
        keyExtractor={keyExtractor}
        renderItem={renderDistrict}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={40}
        removeClippedSubviews
        getItemLayout={(_, index) => ({
          length: CARD_H + GAP,
          offset: (CARD_H + GAP) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: Math.max(info.index * (CARD_H + GAP), 0),
            animated: true,
          });
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0 });
          }, 350);
        }}
        ListHeaderComponent={
          <View onLayout={(e) => { headerHeightRef.current = e.nativeEvent.layout.height; }}>
            <View style={styles.searchWrap}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  placeholder="Search districts, provinces..."
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="search"
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.provinceRow}
            >
              {provinces.map((province) => {
                const active = selectedProvince === province;
                return (
                  <Pressable
                    key={province}
                    style={[styles.provinceChip, active && styles.provinceChipActive]}
                    onPress={() => handleProvinceChange(province)}
                  >
                    <Text style={[styles.provinceChipText, active && styles.provinceChipTextActive]}>
                      {province}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ErrorText message={error} />

            {featured.length > 0 && !searchQuery && selectedProvince === 'All' ? (
              <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleGroup}>
                    <Ionicons name="compass" size={15} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Quick District Picks</Text>
                  </View>
                  <Text style={styles.sectionSub}>Highlights</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}
                >
                  {featured.map((district) => (
                    <FeatureDistrict
                      key={`featured_${district.district_id || district.name}`}
                      item={district}
                      onPress={openDistrict}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.gridTitleRow}>
              <View style={styles.sectionTitleGroup}>
                <Ionicons name="trail-sign-outline" size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>
                  {selectedProvince === 'All' ? 'District Guide' : `${selectedProvince} Province`}
                </Text>
              </View>
              <Text style={styles.sectionSub}>{filtered.length} found</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No districts found"
            subtitle="Try another province or search term."
            icon="map-outline"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fixedTop: { backgroundColor: colors.background },
  cardList: { flex: 1 },
  listContent: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 120 },

  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  introCopy: { flex: 1, paddingRight: 12 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: { color: colors.textPrimary, fontSize: COMPACT_LAYOUT ? 21 : 24, fontWeight: '900', marginTop: 1 },
  subtitle: { color: colors.textMuted, fontSize: COMPACT_LAYOUT ? 11 : 12, fontWeight: '700', marginTop: 2 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '14',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: COMPACT_LAYOUT ? 6 : 7,
  },
  countPillText: { color: colors.primary, fontSize: 13, fontWeight: '900' },

  mapPanel: {
    height: MAP_H,
    marginHorizontal: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    borderWidth: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  map: { width: '100%', height: '100%' },
  mapBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  resetButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
  },
  resetText: { color: colors.textPrimary, fontSize: 11, fontWeight: '800' },
  zoomControls: {
    position: 'absolute',
    top: 53,
    right: 10,
    gap: 8,
  },
  zoomButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
  },
  mapPreview: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  mapPreviewThumb: {
    width: 62,
    height: 62,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPreviewNumber: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.white,
  },
  mapPreviewNumberText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  mapPreviewBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  mapPreviewProvincePill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 4,
  },
  mapPreviewProvinceText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mapPreviewTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900', marginBottom: 3 },
  mapPreviewSub: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  mapPreviewActions: {
    width: 38,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapPreviewClose: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPreviewAction: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: { paddingHorizontal: 12, paddingTop: COMPACT_LAYOUT ? 5 : 14 },
  searchBox: {
    height: COMPACT_LAYOUT ? 42 : 50,
    borderRadius: COMPACT_LAYOUT ? 14 : 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, height: '100%', color: colors.textPrimary, fontSize: 14 },
  provinceRow: { paddingHorizontal: 12, paddingVertical: COMPACT_LAYOUT ? 5 : 12, gap: 8 },
  provinceChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  provinceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  provinceChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  provinceChipTextActive: { color: colors.white },

  featuredSection: { marginTop: COMPACT_LAYOUT ? 0 : 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: COMPACT_LAYOUT ? 6 : 10,
  },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  sectionTitle: { color: colors.textPrimary, fontSize: COMPACT_LAYOUT ? 15 : 16, fontWeight: '900' },
  sectionSub: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  featuredRow: { paddingHorizontal: 16, gap: COMPACT_LAYOUT ? 8 : 10 },
  featureCard: {
    width: FEATURE_W,
    minHeight: FEATURE_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: COMPACT_LAYOUT ? 8 : 10,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: COMPACT_LAYOUT ? 8 : 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  featureImage: { width: FEATURE_IMG, height: FEATURE_IMG, borderRadius: COMPACT_LAYOUT ? 11 : 14 },
  featureBody: { flex: 1 },
  featureName: { color: colors.textPrimary, fontSize: COMPACT_LAYOUT ? 13 : 14, fontWeight: '900' },
  featureSub: { color: colors.textMuted, fontSize: COMPACT_LAYOUT ? 10 : 11, fontWeight: '700', marginTop: COMPACT_LAYOUT ? 0 : 3 },
  featureDot: { width: 9, height: 9, borderRadius: 5 },

  gridTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  gridRow: {
    paddingHorizontal: 16,
    gap: GAP,
    marginBottom: GAP,
  },

  districtCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardHighlighted: {
    borderColor: colors.accent,
    elevation: 7,
    shadowOpacity: 0.28,
  },
  cardGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  cardProvinceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cardProvinceBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardNumberBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardNumberText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 11,
    paddingBottom: 11,
    paddingTop: 6,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  cardName: { fontSize: 14, fontWeight: '900', color: colors.white, flex: 1, letterSpacing: -0.2 },
  cardArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardHint: { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
});
