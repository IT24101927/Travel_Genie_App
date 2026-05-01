import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
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

import FallbackImage from '../../components/common/FallbackImage';
import colors from '../../constants/colors';
import { getPlacesApi } from '../../api/placeApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { getPlaceImageCandidates } from '../../utils/placeImages';
import { getPlaceType, getPlaceTypeMeta } from '../../utils/placeTypes';

const { width } = Dimensions.get('window');
const CARD_W = Math.floor((width - 48) / 2);
const CARD_H = Math.floor(CARD_W * 1.3);
const NUM_COLUMNS = 2;
const ROW_GAP = 14;
const ROW_H = CARD_H + ROW_GAP;
const MAP_H  = 250;

/* District centre coords for map context */
const DISTRICT_COORDS = {
  'Colombo':      { latitude: 6.9271,  longitude: 79.8612 },
  'Gampaha':      { latitude: 7.0917,  longitude: 80.0000 },
  'Kalutara':     { latitude: 6.5854,  longitude: 79.9607 },
  'Kandy':        { latitude: 7.2906,  longitude: 80.6337 },
  'Matale':       { latitude: 7.4675,  longitude: 80.6234 },
  'Nuwara Eliya': { latitude: 6.9497,  longitude: 80.7891 },
  'Galle':        { latitude: 6.0535,  longitude: 80.2210 },
  'Matara':       { latitude: 5.9549,  longitude: 80.5550 },
  'Hambantota':   { latitude: 6.1429,  longitude: 81.1212 },
  'Jaffna':       { latitude: 9.6615,  longitude: 80.0255 },
  'Kilinochchi':  { latitude: 9.3803,  longitude: 80.4000 },
  'Mannar':       { latitude: 8.9810,  longitude: 79.9044 },
  'Vavuniya':     { latitude: 8.7514,  longitude: 80.4971 },
  'Mullaitivu':   { latitude: 9.2671,  longitude: 80.8128 },
  'Batticaloa':   { latitude: 7.7310,  longitude: 81.6747 },
  'Ampara':       { latitude: 7.2910,  longitude: 81.6724 },
  'Trincomalee':  { latitude: 8.5874,  longitude: 81.2152 },
  'Kurunegala':   { latitude: 7.4863,  longitude: 80.3647 },
  'Puttalam':     { latitude: 8.0362,  longitude: 79.8283 },
  'Anuradhapura': { latitude: 8.3114,  longitude: 80.4037 },
  'Polonnaruwa':  { latitude: 7.9403,  longitude: 81.0188 },
  'Badulla':      { latitude: 6.9934,  longitude: 81.0550 },
  'Monaragala':   { latitude: 6.8728,  longitude: 81.3507 },
  'Ratnapura':    { latitude: 6.6828,  longitude: 80.4125 },
  'Kegalle':      { latitude: 7.2513,  longitude: 80.3464 },
};

const getPlaceId = (place) => String(place?._id || place?.place_id || place?.id || '');

const getPlaceCoordinate = (place) => {
  const latitude = Number(place?.lat);
  const longitude = Number(place?.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

const getMapRegion = (places, districtName) => {
  const coords = places.map((place) => getPlaceCoordinate(place)).filter(Boolean);
  if (coords.length === 0) {
    const fallback = DISTRICT_COORDS[districtName] || { latitude: 7.8731, longitude: 80.7718 };
    return { ...fallback, latitudeDelta: 0.35, longitudeDelta: 0.3 };
  }

  if (coords.length === 1) {
    return { ...coords[0], latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }

  const lats = coords.map((coord) => coord.latitude);
  const lngs = coords.map((coord) => coord.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.08),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.08),
  };
};

/* ─── Place card ─── */
const PlaceCard = memo(({ item, isSelected, onPress }) => {
  const cat = getPlaceType(item);
  const meta = getPlaceTypeMeta(item);

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_W, height: CARD_H }, isSelected && styles.cardSelected]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      {/*
       * FallbackImage fills the card.
       * Gradient children ONLY render when the image has loaded —
       * prevents colour-band artefacts on flat placeholder backgrounds.
       */}
      <FallbackImage
        uri={getPlaceImageCandidates(item)}
        style={StyleSheet.absoluteFill}
        iconName="compass-outline"
        iconSize={40}
        placeholderColor={meta.color}
        placeholderIconColor="rgba(255,255,255,0.45)"
      >
        {/* Single bottom scrim — one layer = zero seam lines on photos */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradBottom} />
      </FallbackImage>

      {/* Category badge — always visible */}
      {cat ? (
        <View style={[styles.catBadge, { backgroundColor: meta.color }]}>
          <Text style={styles.catBadgeEmoji}>{meta.emoji}</Text>
          <Text style={styles.catBadgeText}>{meta.label.toUpperCase()}</Text>
        </View>
      ) : null}

      {/* Rating badge — always visible if exists */}
      {Number(item.rating) > 0 ? (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color={colors.warning} />
          <Text style={styles.ratingBadgeText}>{Number(item.rating).toFixed(1)}</Text>
        </View>
      ) : null}

      {/* Bottom info — always visible */}
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.arrowBubble}>
            <Ionicons name="arrow-forward" size={10} color={colors.white} />
          </View>
        </View>
        {item.description ? (
          <Text style={styles.cardSub} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

/* ─── Places map — pins come from Mongo lat/lng ─── */
const PlacesMap = memo(({ districtName, places, selectedPlaceId, selectedPlace, onMarkerPress, onClose, onViewDetails, onScrollToTop }) => {
  const mapRef = useRef(null);
  const regionRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapLaidOut, setMapLaidOut] = useState(false);
  const mappedPlaces = useMemo(
    () => places.map((place) => ({ place, coordinate: getPlaceCoordinate(place) })).filter((item) => item.coordinate),
    [places]
  );
  const region = useMemo(() => getMapRegion(places, districtName), [places, districtName]);
  const selectedCoordinate = selectedPlace ? getPlaceCoordinate(selectedPlace) : null;

  const fitAllPlaces = useCallback((animated = true) => {
    if (!mapRef.current || !mapReady || !mapLaidOut) return;

    if (mappedPlaces.length > 1) {
      mapRef.current.fitToCoordinates(
        mappedPlaces.map((item) => item.coordinate),
        { edgePadding: { top: 34, right: 60, bottom: 38, left: 34 }, animated }
      );
    } else {
      regionRef.current = region;
      mapRef.current.animateToRegion(region, animated ? 400 : 0);
    }
  }, [mapLaidOut, mapReady, mappedPlaces, region]);

  const handleResetMap = useCallback(() => {
    onClose();
    fitAllPlaces(true);
    setTimeout(() => {
      onScrollToTop?.();
    }, 150);
  }, [fitAllPlaces, onClose, onScrollToTop]);

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

  const zoomIn = useCallback(() => changeZoom(0.5), [changeZoom]);
  const zoomOut = useCallback(() => changeZoom(2), [changeZoom]);

  useEffect(() => {
    if (!mapReady || !mapLaidOut) return;
    regionRef.current = region;
    const timers = [0, 250].map((delay) =>
      setTimeout(() => fitAllPlaces(false), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [fitAllPlaces, mapLaidOut, mapReady, region]);

  useEffect(() => {
    if (!selectedCoordinate || !mapReady || !mapLaidOut) return;
    const latitudeDelta = 0.028;
    const longitudeDelta = 0.028;
    const nextRegion = {
      latitude: selectedCoordinate.latitude - latitudeDelta * 0.22,
      longitude: selectedCoordinate.longitude,
      latitudeDelta,
      longitudeDelta,
    };
    regionRef.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 350);
  }, [mapLaidOut, mapReady, region, selectedCoordinate?.latitude, selectedCoordinate?.longitude]);

  const selectedMeta = selectedPlace ? getPlaceTypeMeta(selectedPlace) : null;

  return (
    <View style={styles.mapWrap} onLayout={() => setMapLaidOut(true)}>
      {mappedPlaces.length > 0 ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          scrollEnabled={true}
          zoomEnabled={true}
          zoomTapEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
          toolbarEnabled={false}
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={(nextRegion) => {
            regionRef.current = nextRegion;
          }}
          onPress={(e) => {
            if (e.nativeEvent.action === 'marker-press') return;
            onClose();
          }}
        >
          {mappedPlaces.map(({ place, coordinate }) => {
            const placeId = getPlaceId(place);
            const isSelected = selectedPlaceId === placeId;
            const meta = getPlaceTypeMeta(place);

            if (Platform.OS === 'ios') {
              return (
                <Marker
                  key={`${placeId}_${isSelected}`}
                  coordinate={coordinate}
                  title={place.name}
                  description={place.address_text || place.description || districtName}
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 1 }}
                  zIndex={isSelected ? 10 : 1}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onMarkerPress(place);
                  }}
                >
                  <View style={styles.markerWrap}>
                    <View style={[
                      styles.markerBubble,
                      { backgroundColor: meta.color },
                      isSelected && styles.markerBubbleSelected,
                    ]}>
                      <Text style={styles.markerEmoji}>{meta.emoji}</Text>
                    </View>
                    <View style={[styles.markerStem, { borderTopColor: meta.color }]} />
                  </View>
                </Marker>
              );
            }

            return (
              <Marker
                key={`${placeId}_${isSelected}`}
                coordinate={coordinate}
                title={place.name}
                description={place.address_text || place.description || districtName}
                pinColor={isSelected ? colors.accent : meta.color}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onMarkerPress(place);
                }}
              />
            );
          })}
        </MapView>
      ) : (
        <View style={styles.noMapPlaces}>
          <Ionicons name="location-outline" size={28} color={colors.textMuted} />
          <Text style={styles.noMapPlacesTitle}>No mapped places yet</Text>
          <Text style={styles.noMapPlacesSub}>Add latitude and longitude in MongoDB or the admin form.</Text>
        </View>
      )}

      <View style={styles.mapOverlay}>
        <Ionicons name="location" size={14} color={colors.primary} />
        <Text style={styles.mapOverlayText}>
          {mappedPlaces.length} pinned place{mappedPlaces.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {mappedPlaces.length > 0 ? (
        <>
          <View style={styles.mapZoomControls}>
            <Pressable style={styles.mapIconBtn} onPress={zoomIn}>
              <Ionicons name="add" size={18} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.mapIconBtn} onPress={zoomOut}>
              <Ionicons name="remove" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Pressable style={styles.mapResetBtn} onPress={handleResetMap}>
            <Ionicons name="scan-outline" size={14} color={colors.textPrimary} />
            <Text style={styles.mapResetText}>Reset</Text>
          </Pressable>
        </>
      ) : null}

      {selectedPlace && selectedCoordinate ? (
        <View style={styles.mapDetailCard}>
          <View
            style={[
              styles.mapDetailThumb,
              { backgroundColor: selectedMeta ? selectedMeta.color + '18' : colors.surface2 },
            ]}
          >
            <FallbackImage
              uri={getPlaceImageCandidates(selectedPlace)}
              style={StyleSheet.absoluteFill}
              iconName={selectedMeta?.icon || 'compass-outline'}
              iconSize={24}
              placeholderColor={selectedMeta ? selectedMeta.color + '16' : colors.surface2}
              placeholderIconColor={selectedMeta?.color || colors.primary}
            />
            {selectedMeta ? (
              <View style={[styles.mapDetailEmojiBadge, { backgroundColor: selectedMeta.color }]}>
                <Text style={styles.mapDetailTypeEmoji}>{selectedMeta.emoji}</Text>
              </View>
            ) : null}
          </View>

          <Pressable style={styles.mapDetailBody} onPress={() => onViewDetails(selectedPlace)}>
            <View style={styles.mapDetailTopLine}>
              <View
                style={[
                  styles.mapDetailTypePill,
                  { backgroundColor: selectedMeta ? selectedMeta.color + '14' : colors.primary + '14' },
                ]}
              >
                <Text
                  style={[
                    styles.mapDetailType,
                    { color: selectedMeta?.color || colors.primary },
                  ]}
                  numberOfLines={1}
                >
                  {selectedMeta?.label || getPlaceType(selectedPlace)}
                </Text>
              </View>
            </View>
            <Text style={styles.mapDetailName} numberOfLines={1}>{selectedPlace.name}</Text>
            <Text style={styles.mapDetailSub} numberOfLines={1}>
              {selectedPlace.address_text || selectedPlace.description || districtName || 'Tap details to see more'}
            </Text>
          </Pressable>

          <View style={styles.mapDetailActions}>
            <Pressable style={styles.mapDetailClose} onPress={onClose}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
            <Pressable style={styles.mapDetailBtn} onPress={() => onViewDetails(selectedPlace)}>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
});

/* ─── Memoised list header ─── */
const ListHeader = memo(({ districtName, search, onSearchChange, onSearchSubmit,
                           categories, selectedCat, onCatChange, count,
                           places, selectedPlaceId, selectedPlace, onMarkerPress, onClearSelection, onViewDetails, onScrollToTop }) => (
  <>
    <PlacesMap
      districtName={districtName}
      places={places}
      selectedPlaceId={selectedPlaceId}
      selectedPlace={selectedPlace}
      onMarkerPress={onMarkerPress}
      onClose={onClearSelection}
      onViewDetails={onViewDetails}
      onScrollToTop={onScrollToTop}
    />

    {/* Search bar */}
    <View style={styles.searchRow}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search in ${districtName || 'places'}...`}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={onSearchChange}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          </Pressable>
        )}
      </View>
      <Pressable style={styles.searchBtn} onPress={onSearchSubmit}>
        <Ionicons name="search" size={18} color={colors.white} />
      </Pressable>
    </View>

    {/* Results count */}
    <Text style={styles.resultCount}>
      {count} place{count !== 1 ? 's' : ''} found
    </Text>

    {/* Category chips */}
    {categories.length > 1 && (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {categories.map((cat) => (
          (() => {
            const active = selectedCat === cat;
            const meta = cat === 'All'
              ? { emoji: '🌐', icon: 'globe', color: colors.primary, label: 'All' }
              : getPlaceTypeMeta(cat);
            return (
              <Pressable
                key={cat}
                style={[styles.chip, active && { backgroundColor: meta.color, borderColor: meta.color }]}
                onPress={() => onCatChange(cat)}
              >
                <Text style={styles.chipEmoji}>{meta.emoji}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{meta.label}</Text>
              </Pressable>
            );
          })()
        ))}
      </ScrollView>
    )}
  </>
));

/* ─── Main screen ─── */
export default function PlaceListScreen({ navigation, route }) {
  const { districtId, districtName } = route?.params || {};

  const [allPlaces, setAllPlaces]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  const listRef = useRef(null);

  /* Fetch — prefer districtId (numeric, matches seeded data) over district name string */
  const load = useCallback(async (searchTerm = '') => {
    try {
      setLoading(true);
      const params = {};
      if (districtId)        params.districtId = districtId;   // seeded places
      else if (districtName) params.district   = districtName; // admin-created places
      if (searchTerm.trim()) params.search     = searchTerm.trim();
      const res = await getPlacesApi(params);
      /* Response shape: { success, data: { places: [...] } } */
      setAllPlaces(res?.data?.places || res?.data || []);
    } catch (err) {
      console.error('Error fetching places:', getApiErrorMessage(err, ''));
    } finally {
      setLoading(false);
    }
  }, [districtId, districtName]);

  useEffect(() => { load(); }, [load]);

  /* Categories from loaded places */
  const categories = useMemo(() => {
    const set = new Set(allPlaces.map((p) => p.category || p.type).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [allPlaces]);

  /* Client-side category filter */
  const filtered = useMemo(() => {
    if (selectedCat === 'All') return allPlaces;
    return allPlaces.filter((p) => (p.category || p.type) === selectedCat);
  }, [allPlaces, selectedCat]);

  const selectedPlace = useMemo(
    () => filtered.find((place) => getPlaceId(place) === selectedPlaceId) || null,
    [filtered, selectedPlaceId]
  );

  useEffect(() => {
    if (selectedPlaceId && !selectedPlace) {
      setSelectedPlaceId(null);
    }
  }, [selectedPlaceId, selectedPlace]);

  /* Stable handlers */
  const handleCatChange    = useCallback((c) => {
    setSelectedCat(c);
    setSelectedPlaceId(null);
  }, []);
  const handleSearchChange = useCallback((t) => {
    setSearch(t);
    setSelectedPlaceId(null);
    if (t === '') load('');   // clear → reload all
  }, [load]);
  const handleSearchSubmit = useCallback(() => {
    setSelectedPlaceId(null);
    load(search);
  }, [load, search]);
  const handleCardPress    = useCallback((p) => navigation.navigate('PlaceDetails', { place: p }), [navigation]);
  const handleClearSelection = useCallback(() => setSelectedPlaceId(null), []);
  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);
  const handleMarkerPress = useCallback((place) => {
    const placeId = getPlaceId(place);
    if (selectedPlaceId === placeId) {
      setSelectedPlaceId(null);
      return;
    }

    setSelectedPlaceId(placeId);

    const index = filtered.findIndex((item) => getPlaceId(item) === placeId);
    if (index >= 0) {
      const rowIndex = Math.floor(index / NUM_COLUMNS);
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: rowIndex, animated: true, viewPosition: 0.15 });
      }, 120);
    }
  }, [filtered, selectedPlaceId]);

  const renderItem = useCallback(({ item }) => (
    <PlaceCard
      item={item}
      isSelected={getPlaceId(item) === selectedPlaceId}
      onPress={handleCardPress}
    />
  ), [handleCardPress, selectedPlaceId]);

  const keyExtractor = useCallback((item) => String(item._id || item.place_id || item.id), []);

  /* Stable header memo */
  const listHeader = useMemo(() => (
    <ListHeader
      districtName={districtName}
      search={search}
      onSearchChange={handleSearchChange}
      onSearchSubmit={handleSearchSubmit}
      categories={categories}
      selectedCat={selectedCat}
      onCatChange={handleCatChange}
      count={filtered.length}
      places={filtered}
      selectedPlaceId={selectedPlaceId}
      selectedPlace={selectedPlace}
      onMarkerPress={handleMarkerPress}
      onClearSelection={handleClearSelection}
      onViewDetails={handleCardPress}
      onScrollToTop={handleScrollToTop}
    />
  ), [districtName, search, handleSearchChange, handleSearchSubmit,
      categories, selectedCat, handleCatChange, filtered, selectedPlaceId,
      selectedPlace, handleMarkerPress, handleClearSelection, handleCardPress, handleScrollToTop]);

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {districtName ? `Loading places in ${districtName}…` : 'Loading places…'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ─── Top header ─── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {districtName || 'Discover Places'}
          </Text>
          <Text style={styles.screenSub}>Explore places in this district</Text>
        </View>
        <View style={styles.countPill}>
          <Ionicons name="compass" size={13} color={colors.primary} />
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      <View style={styles.topSection}>
        {listHeader}
      </View>

      <FlatList
        ref={listRef}
        style={styles.cardList}
        data={filtered}
        extraData={selectedPlaceId}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={renderItem}
        getItemLayout={(data, index) => ({
          length: ROW_H,
          offset: ROW_H * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: Math.max(info.index * ROW_H, 0),
            animated: true,
          });
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.15 });
          }, 350);
        }}
        removeClippedSubviews={false}
        maxToRenderPerBatch={8}
        initialNumToRender={8}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={44} color={colors.border} />
            <Text style={styles.emptyText}>No places found</Text>
            <Text style={styles.emptySubText}>
              {districtName
                ? `No places in ${districtName} yet. Add some from the admin panel.`
                : 'Try a different search term.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.textMuted, fontSize: 14 },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  screenTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  screenSub:   { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface2, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
  },
  countText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  topSection: { backgroundColor: colors.background },

  /* Map */
  mapWrap: {
    height: MAP_H, marginHorizontal: 16, marginBottom: 14,
    borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface2,
  },
  mapOverlay: {
    position: 'absolute', top: 10, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  mapOverlayText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
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
  markerWrap: { alignItems: 'center' },
  markerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  markerBubbleSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderColor: colors.accent,
  },
  markerStem: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  markerEmoji: { fontSize: 16 },
  noMapPlaces: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 6,
  },
  noMapPlacesTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  noMapPlacesSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  mapDetailCard: {
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  mapDetailThumb: {
    width: 62,
    height: 62,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapDetailEmojiBadge: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  mapDetailBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  mapDetailTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
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
  mapDetailSub: {
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
  mapDetailTypeEmoji: { fontSize: 13 },
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

  /* Search */
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingHorizontal: 16, marginBottom: 8,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, paddingHorizontal: 10, height: '100%' },
  searchBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  /* Result count */
  resultCount: {
    fontSize: 12, color: colors.textMuted, fontWeight: '600',
    paddingHorizontal: 16, marginBottom: 8,
  },

  /* Category chips */
  filterRow: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipEmoji: { fontSize: 13 },
  chipText:       { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  /* Grid */
  cardList: { flex: 1 },
  grid: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120 },
  row:  { justifyContent: 'space-between', marginBottom: 14 },

  /* Card */
  card: {
    borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface3,
    borderWidth: 2, borderColor: 'transparent',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardSelected: {
    borderColor: colors.accent,
    elevation: 7,
    shadowOpacity: 0.28,
  },
  gradBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },

  catBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  catBadgeText: { color: colors.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  catBadgeEmoji: { fontSize: 11 },
  ratingBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 7, paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBadgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: '800' },

  cardContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 11, paddingBottom: 11, paddingTop: 6,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  cardName: { fontSize: 14, fontWeight: '900', color: colors.white, flex: 1, letterSpacing: -0.2 },
  arrowBubble: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center',
    marginLeft: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  cardSub: { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  /* Empty */
  empty:       { alignItems: 'center', paddingTop: 50, gap: 10, paddingHorizontal: 32 },
  emptyText:   { color: colors.textMuted, fontSize: 16, fontWeight: '700' },
  emptySubText:{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
