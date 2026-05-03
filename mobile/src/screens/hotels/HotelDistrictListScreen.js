import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import FallbackImage from '../../components/common/FallbackImage';
import colors from '../../constants/colors';
import { getDistrictsApi } from '../../api/districtApi';
import { getHotelsApi } from '../../api/hotelApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { getHotelImageCandidates } from '../../utils/hotelImages';

const { width } = Dimensions.get('window');
const GAP = 14;
const CARD_W = Math.floor((width - 32 - GAP) / 2);
const CARD_H = Math.floor(CARD_W * 1.28);
const FEATURE_W = Math.floor(width * 0.74);
const FEATURE_H = Math.floor(FEATURE_W * 0.68);

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

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getDistrictName = (hotel = {}) => {
  const nestedName = hotel.place?.district?.name || hotel.districtData?.name || hotel.districtInfo?.name;
  const directName = typeof hotel.district === 'string' ? hotel.district : hotel.district?.name;
  return String(nestedName || directName || hotel.location || '').trim();
};

const getHotelDistrictKey = (hotel = {}) => {
  const id = Number(hotel.district_id);
  if (Number.isFinite(id) && id > 0) return `id:${id}`;
  const name = getDistrictName(hotel);
  return name ? `name:${normalizeText(name)}` : '';
};

const getDistrictKey = (district = {}) => {
  const id = Number(district.district_id);
  if (Number.isFinite(id) && id > 0) return `id:${id}`;
  return `name:${normalizeText(district.name)}`;
};

const getCoverCandidates = (district, hotel) => {
  const candidates = [
    district?.image_url,
    district?.image,
    ...(hotel ? getHotelImageCandidates(hotel) : []),
  ];
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = String(candidate || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getAccent = (province) => PROVINCE_ACCENTS[province] || colors.primary;

const StatPill = ({ icon, value, label }) => (
  <View style={styles.statPill}>
    <Ionicons name={icon} size={15} color={colors.white} />
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const StayDistrictCard = ({ item, onPress, compact = false }) => {
  const accent = getAccent(item.province);
  const cover = getCoverCandidates(item, item.coverHotel);

  return (
    <Pressable
      style={[
        styles.districtCard,
        compact
          ? { width: CARD_W, height: CARD_H }
          : { width: FEATURE_W, height: FEATURE_H },
      ]}
      onPress={() => onPress(item)}
    >
      <FallbackImage
        uri={cover}
        style={StyleSheet.absoluteFill}
        iconName="bed-outline"
        iconSize={compact ? 36 : 46}
        placeholderColor={accent}
        placeholderIconColor="rgba(255,255,255,0.42)"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.88)']}
          style={StyleSheet.absoluteFill}
        />
      </FallbackImage>

      <View style={[styles.provinceBadge, { backgroundColor: accent }]}>
        <Text style={styles.provinceBadgeText}>{item.province || 'Sri Lanka'}</Text>
      </View>

      <View style={styles.hotelCountBadge}>
        <Ionicons name="bed" size={12} color={colors.white} />
        <Text style={styles.hotelCountText}>{item.hotelCount}</Text>
      </View>

      <View style={styles.cardBottom}>
        <Text style={[styles.cardName, compact && styles.cardNameCompact]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {item.hotelCount > 0
            ? `${item.hotelCount} stay${item.hotelCount !== 1 ? 's' : ''} available`
            : 'Browse stays in this district'}
        </Text>
        {!compact ? (
          <View style={styles.cardAction}>
            <Text style={styles.cardActionText}>Find hotels</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.white} />
          </View>
        ) : (
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={13} color={colors.white} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const HotelDistrictListScreen = ({ navigation }) => {
  const [districts, setDistricts] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [province, setProvince] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const [districtRes, hotelRes] = await Promise.all([
        getDistrictsApi(),
        getHotelsApi({}),
      ]);
      setDistricts(districtRes?.data || []);
      setHotels(hotelRes?.data?.hotels || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load hotel districts'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const hotelCountMap = useMemo(() => {
    const map = new Map();
    hotels.forEach((hotel) => {
      const key = getHotelDistrictKey(hotel);
      if (!key) return;
      const current = map.get(key) || { count: 0, coverHotel: null };
      current.count += 1;
      if (!current.coverHotel && (hotel.image || hotel.image_url || hotel.coverImage)) {
        current.coverHotel = hotel;
      }
      if (!current.coverHotel) current.coverHotel = hotel;
      map.set(key, current);
    });
    return map;
  }, [hotels]);

  const enrichedDistricts = useMemo(() => (
    districts.map((district) => {
      const hit = hotelCountMap.get(getDistrictKey(district));
      return {
        ...district,
        hotelCount: hit?.count || 0,
        coverHotel: hit?.coverHotel || null,
      };
    })
  ), [districts, hotelCountMap]);

  const provinces = useMemo(() => {
    const values = Array.from(new Set(enrichedDistricts.map((d) => d.province).filter(Boolean))).sort();
    return ['All', ...values];
  }, [enrichedDistricts]);

  const filtered = useMemo(() => {
    const q = normalizeText(search);
    return enrichedDistricts
      .filter((district) => province === 'All' || district.province === province)
      .filter((district) => {
        if (!q) return true;
        return (
          normalizeText(district.name).includes(q) ||
          normalizeText(district.province).includes(q) ||
          (district.highlights || []).some((h) => normalizeText(h).includes(q))
        );
      })
      .sort((a, b) => {
        const aId = Number(a.district_id);
        const bId = Number(b.district_id);
        if (Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId;
        if (Number.isFinite(aId)) return -1;
        if (Number.isFinite(bId)) return 1;
        return String(a.name).localeCompare(String(b.name));
      });
  }, [enrichedDistricts, province, search]);

  const featured = useMemo(
    () => enrichedDistricts
      .filter((district) => district.hotelCount > 0)
      .sort((a, b) => b.hotelCount - a.hotelCount)
      .slice(0, 6),
    [enrichedDistricts]
  );

  const handleOpenDistrict = useCallback((district) => {
    navigation.navigate('HotelList', {
      districtId: district.district_id,
      districtName: district.name,
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <StayDistrictCard item={item} compact onPress={handleOpenDistrict} />
  ), [handleOpenDistrict]);

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="bed" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>Hotel Finder</Text>
            <Text style={styles.heroTitle}>Choose where to stay</Text>
            <Text style={styles.heroSub}>Pick a district and browse hotels nearby.</Text>
          </View>
        </View>

        <View style={styles.heroStatsRow}>
          <StatPill icon="map-outline" value={districts.length} label="Districts" />
          <StatPill icon="bed-outline" value={hotels.length} label="Hotels" />
        </View>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Search hotel districts..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
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
        {provinces.map((item) => {
          const active = province === item;
          return (
            <Pressable
              key={item}
              style={[styles.provinceChip, active && styles.provinceChipActive]}
              onPress={() => setProvince(item)}
            >
              <Text style={[styles.provinceChipText, active && styles.provinceChipTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ErrorText message={error} />

      {featured.length > 0 && !search && province === 'All' ? (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="star" size={15} color={colors.warning} />
              <Text style={styles.sectionTitle}>Popular Stay Districts</Text>
            </View>
            <Text style={styles.sectionSub}>Most hotels</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
          >
            {featured.map((item) => (
              <StayDistrictCard
                key={`featured_${item.district_id || item.name}`}
                item={item}
                onPress={handleOpenDistrict}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.gridTitleRow}>
        <View style={styles.sectionTitleGroup}>
          <Ionicons name="business-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>
            {province === 'All' ? 'All Hotel Districts' : `${province} Province`}
          </Text>
        </View>
        <Text style={styles.sectionSub}>{filtered.length} found</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading hotel districts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.district_id || item.name)}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load({ silent: true }); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No hotel districts found"
            subtitle="Try another search or province."
            icon="bed-outline"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  listContent: { paddingBottom: 120 },

  hero: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 22,
    padding: 16,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: { color: colors.white, fontSize: 24, fontWeight: '900', marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 3 },
  heroStatsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flex: 1,
  },
  statValue: { color: colors.white, fontSize: 16, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: '800' },

  searchWrap: { paddingHorizontal: 12, paddingTop: 14 },
  searchBox: {
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, height: '100%', color: colors.textPrimary, fontSize: 14 },
  provinceRow: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  provinceChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  provinceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  provinceChipText: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
  provinceChipTextActive: { color: colors.white },

  featuredSection: { marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  sectionSub: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  featuredRow: { paddingHorizontal: 16, gap: 12 },
  gridTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  gridRow: { paddingHorizontal: 16, gap: GAP, marginBottom: GAP },

  districtCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  provinceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
  },
  provinceBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hotelCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  hotelCountText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  cardBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  cardName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardNameCompact: { fontSize: 16 },
  cardSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardActionText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
});

export default HotelDistrictListScreen;
