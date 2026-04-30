import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import FallbackImage from '../../components/common/FallbackImage';
import { getDistrictsApi } from '../../api/districtApi';
import { getApiErrorMessage } from '../../utils/apiError';

const PROVINCES = [
  'All', 'Western', 'Central', 'Southern', 'Northern',
  'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
];

const PROVINCE_META = {
  'Western':       { color: '#0E7C5F' },
  'Central':       { color: '#3498DB' },
  'Southern':      { color: '#27AE60' },
  'Northern':      { color: '#D4532B' },
  'Eastern':       { color: '#E8A830' },
  'North Western': { color: '#0A5E48' },
  'North Central': { color: '#3498DB' },
  'Uva':           { color: '#BA4522' },
  'Sabaragamuwa':  { color: '#12A080' }
};

const DistrictCard = ({ item, onEdit, onViewPlaces }) => {
  const meta = PROVINCE_META[item.province] || { color: colors.primary };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onViewPlaces}
    >
      {/* Photo */}
      <View style={styles.photoWrapper}>
        <FallbackImage
          uri={item.image_url}
          style={styles.photo}
          resizeMode="cover"
          iconName="map-outline"
          iconSize={40}
        />
        <View style={[styles.provincePill, { backgroundColor: `${meta.color}EE` }]}>
          <Text style={styles.provincePillText}>{item.province}</Text>
        </View>
        <View style={styles.idBadge}>
          <Text style={styles.idBadgeText}>#{item.district_id}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.districtName} numberOfLines={1}>{item.name}</Text>
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {item.highlights?.length > 0 && (
          <View style={styles.highlightsRow}>
            {item.highlights.slice(0, 3).map((h, i) => (
              <View key={i} style={styles.highlightChip}>
                <Text style={styles.highlightChipText} numberOfLines={1}>{h}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action bar */}
        <View style={styles.actionBar}>
          <View style={styles.placesHint}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.placesHintText}>Tap card to view places</Text>
          </View>

          <Pressable onPress={onEdit} style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const AdminDistrictsScreen = ({ navigation }) => {
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    let result = districts;
    if (province !== 'All') result = result.filter((d) => d.province === province);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter(
      (d) => d.name?.toLowerCase().includes(q) || d.province?.toLowerCase().includes(q)
    );
    return result;
  }, [districts, search, province]);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await getDistrictsApi();
      setDistricts(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load districts'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Districts</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search districts..."
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

      {/* Province filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {PROVINCES.map((p) => {
          const meta = PROVINCE_META[p];
          const active = province === p;
          const activeColor = meta?.color || colors.primary;
          return (
            <Pressable
              key={p}
              onPress={() => setProvince(p)}
              style={[
                styles.chip,
                active && { backgroundColor: activeColor, borderColor: activeColor }
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {p === 'All' ? 'All Provinces' : p}
              </Text>
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
            <DistrictCard
              item={item}
              onEdit={() => navigation.navigate('AdminDistrictForm', { district: item })}
              onViewPlaces={() => navigation.navigate('AdminPlaces', { district: item })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <Text style={styles.listCount}>
              {filtered.length} district{filtered.length !== 1 ? 's' : ''}
              {province !== 'All' ? ` · ${province}` : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="map-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>No districts found</Text>
              <Text style={styles.emptySub}>
                {province !== 'All' ? `No districts in ${province} Province` : 'Try a different search'}
              </Text>
            </View>
          }
        />
      )}
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
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },

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
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: '700' },

  errorText: { color: colors.danger, fontSize: 13, paddingHorizontal: 20, marginBottom: 6 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listCount: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 12, letterSpacing: 0.3 },
  list: { paddingHorizontal: 16, paddingBottom: 110 },

  /* Card */
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

  photoWrapper: { height: 140, position: 'relative' },
  photo: { width: '100%', height: '100%' },

  provincePill: {
    position: 'absolute', bottom: 10, left: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20
  },
  provincePillText: { color: colors.white, fontSize: 11, fontWeight: '700' },

  idBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10
  },
  idBadgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },

  cardBody: { padding: 14 },

  nameRow: { marginBottom: 6 },
  districtName: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },

  description: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 10 },

  highlightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  highlightChip: {
    backgroundColor: colors.surface2, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 9, paddingVertical: 4
  },
  highlightChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  cardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },

  /* Action bar */
  actionBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border
  },
  placesHint: {
    flexDirection: 'row', alignItems: 'center', gap: 5
  },
  placesHintText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EAF4F1',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  /* Empty */
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }
});

export default AdminDistrictsScreen;
