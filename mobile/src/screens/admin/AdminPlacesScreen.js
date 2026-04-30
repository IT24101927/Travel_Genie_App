import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import FallbackImage from '../../components/common/FallbackImage';
import { getPlacesApi, deletePlaceApi, updatePlaceApi } from '../../api/placeApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { getPlaceImageCandidates } from '../../utils/placeImages';

const TYPE_META = {
  'Attraction':          { emoji: '⭐', color: '#E91E63' },
  'Museum':              { emoji: '🏛️', color: '#9C27B0' },
  'Viewpoint':           { emoji: '🔭', color: '#3498DB' },
  'Heritage':            { emoji: '🏯', color: '#795548' },
  'Religious Site':      { emoji: '🕌', color: '#FF9800' },
  'Beach':               { emoji: '🏖️', color: '#2196F3' },
  'Nature':              { emoji: '🌿', color: '#4CAF50' },
  'Park':                { emoji: '🌳', color: '#388E3C' },
  'Nature Reserve':      { emoji: '🦋', color: '#00897B' },
  'Garden':              { emoji: '🌸', color: '#E91E63' },
  'Monument':            { emoji: '🗿', color: '#607D8B' },
  'Archaeological Site': { emoji: '⛏️', color: '#8D6E63' },
  'Memorial':            { emoji: '🕊️', color: '#78909C' },
  'Artwork':             { emoji: '🎨', color: '#AB47BC' },
  'Gallery':             { emoji: '🖼️', color: '#7B1FA2' },
  'Zoo':                 { emoji: '🦁', color: '#F57C00' },
  'Theme Park':          { emoji: '🎡', color: '#D32F2F' },
  'Aquarium':            { emoji: '🐠', color: '#0288D1' },
  'Adventure':           { emoji: '🧗', color: '#FF5722' },
  'Culture':             { emoji: '🎭', color: '#673AB7' },
  'Lake':                { emoji: '🛶', color: '#00BCD4' },
  'Market':              { emoji: '🛍️', color: '#FFC107' },
  'Shopping':            { emoji: '🛒', color: '#E91E63' },
  'Safari':              { emoji: '🚙', color: '#8BC34A' },
  'Temple':              { emoji: '🛕', color: '#FF9800' },
  'Wildlife':            { emoji: '🐘', color: '#795548' }
};

const TYPE_FILTERS = ['All', ...Object.keys(TYPE_META)];

const PlaceCard = ({ item, onEdit, onDelete, onToggleActive }) => {
  const meta = TYPE_META[item.type] || { emoji: '📍', color: '#607D8B' };
  const isActive = item.isActive !== false;

  return (
    <View style={styles.card}>
      {/* Hero image */}
      <View style={styles.photoWrapper}>
        <FallbackImage
          uri={getPlaceImageCandidates(item)}
          style={styles.photo}
          resizeMode="cover"
          iconName="image-outline"
          iconSize={36}
        />

        {/* Rating badge */}
        {item.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating?.toFixed(1)}</Text>
          </View>
        )}

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: `${meta.color}EE` }]}>
          <Text style={styles.typeEmoji}>{meta.emoji}</Text>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>

        {/* Inactive overlay */}
        {!isActive && (
          <View style={styles.inactiveOverlay}>
            <View style={styles.inactivePill}>
              <Ionicons name="eye-off-outline" size={11} color={colors.white} />
              <Text style={styles.inactivePillText}>INACTIVE</Text>
            </View>
          </View>
        )}
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>

        {item.address_text ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={1}>{item.address_text}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {item.review_count > 0
              ? `${item.review_count} review${item.review_count !== 1 ? 's' : ''}`
              : 'No reviews yet'}
          </Text>
          {item.duration ? (
            <>
              <Text style={styles.metaDot}> • </Text>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}> {item.duration}</Text>
            </>
          ) : null}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action bar */}
        <View style={styles.actionBar}>
          <View style={styles.toggleGroup}>
            <Switch
              value={isActive}
              onValueChange={onToggleActive}
              trackColor={{ false: colors.border, true: `${colors.success}55` }}
              thumbColor={isActive ? colors.success : '#ccc'}
              style={styles.switch}
            />
            <Text style={[styles.toggleLabel, { color: isActive ? colors.success : colors.textMuted }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.btnGroup}>
            <Pressable onPress={onEdit} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={14} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const AdminPlacesScreen = ({ route, navigation }) => {
  const district = route.params?.district;

  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    let result = places;
    if (typeFilter !== 'All') result = result.filter((p) => p.type?.toLowerCase() === typeFilter.toLowerCase());
    const q = search.trim().toLowerCase();
    if (q) result = result.filter(
      (p) => p.name?.toLowerCase().includes(q) ||
             p.address_text?.toLowerCase().includes(q) ||
             p.type?.toLowerCase().includes(q)
    );
    return result;
  }, [places, search, typeFilter]);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await getPlacesApi(district ? { districtId: district.district_id } : {});
      setPlaces(res?.data?.places || (Array.isArray(res?.data) ? res.data : []));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load places'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [district]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleToggleActive = async (place) => {
    try {
      await updatePlaceApi(place._id, { isActive: !place.isActive });
      setPlaces((prev) => prev.map((p) => p._id === place._id ? { ...p, isActive: !place.isActive } : p));
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to update status'));
    }
  };

  const handleDelete = (place) => {
    Alert.alert(
      'Delete Place',
      `Remove "${place.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deletePlaceApi(place._id);
              setPlaces((prev) => prev.filter((p) => p._id !== place._id));
            } catch (err) {
              Alert.alert('Error', getApiErrorMessage(err, 'Failed to delete place'));
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{district?.name || 'All Places'}</Text>
          {district?.province ? (
            <Text style={styles.subtitle}>{district.province} Province</Text>
          ) : null}
        </View>
        <View style={{ width: 42 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {TYPE_FILTERS.map((f) => {
          const m = TYPE_META[f];
          const active = typeFilter === f;
          const activeColor = m?.color || colors.primary;
          return (
            <Pressable
              key={f}
              onPress={() => setTypeFilter(f)}
              style={[
                styles.chip,
                active && { backgroundColor: activeColor, borderColor: activeColor }
              ]}
            >
              {m ? <Text style={styles.chipEmoji}>{m.emoji}</Text> : null}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PlaceCard
              item={item}
              onEdit={() => navigation.navigate('AdminPlaceForm', { place: item, district })}
              onDelete={() => handleDelete(item)}
              onToggleActive={() => handleToggleActive(item)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <Text style={styles.listCount}>
              {filtered.length} place{filtered.length !== 1 ? 's' : ''}
              {typeFilter !== 'All' ? ` · ${typeFilter}` : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="location-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>No places here yet</Text>
              <Text style={styles.emptySub}>Tap + to add the first place</Text>
            </View>
          }
        />
      )}

      {/* FAB — Add place */}
      <Pressable
        onPress={() => navigation.navigate('AdminPlaceForm', { district })}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border
  },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 12,
    height: 48, paddingHorizontal: 14
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },

  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: '700' },

  errorText: { color: colors.danger, fontSize: 13, paddingHorizontal: 20, marginBottom: 6 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listCount: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 12, letterSpacing: 0.3 },
  list: { paddingHorizontal: 16, paddingBottom: 110 },

  /* Place Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3
  },

  photoWrapper: { height: 170, position: 'relative' },
  photo: { width: '100%', height: '100%' },

  ratingBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10
  },
  ratingText: { color: colors.white, fontSize: 12, fontWeight: '800' },

  typeBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20
  },
  typeEmoji: { fontSize: 12 },
  typeText: { color: colors.white, fontSize: 11, fontWeight: '700' },

  inactiveOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'flex-end', justifyContent: 'flex-start', padding: 10
  },
  inactivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10
  },
  inactivePillText: { color: colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  cardBody: { padding: 14 },
  placeName: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  addressText: { fontSize: 13, color: colors.textMuted, flex: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaText: { fontSize: 13, color: colors.textMuted },
  metaDot: { fontSize: 13, color: colors.textMuted },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: 12 },

  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  toggleGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  switch: { transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] },
  toggleLabel: { fontSize: 13, fontWeight: '600' },

  btnGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#EAF4F1', borderRadius: 20
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FCE9E6',
    alignItems: 'center', justifyContent: 'center'
  },

  /* Empty */
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  /* FAB */
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8,
    elevation: 8
  }
});

export default AdminPlacesScreen;
