import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import FallbackImage from '../../components/common/FallbackImage';
import { getPlacesApi, deletePlaceApi, updatePlaceApi } from '../../api/placeApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { getPlaceImageCandidates } from '../../utils/placeImages';
import { PLACE_TYPE_META, getPlaceTypeMeta } from '../../utils/placeTypes';

const TYPE_FILTERS = ['All', ...Object.keys(PLACE_TYPE_META)];
const DISTRICT_PREVIEW_LIMIT = 10;
const STATUS_FILTERS = ['All', 'Active', 'Inactive'];
const RATING_FILTERS = ['All', 'Rated', 'Unrated'];

const getDistrictName = (place = {}) => {
  const nestedName = place.districtData?.name || place.districtInfo?.name;
  const directName = typeof place.district === 'string' ? place.district : place.district?.name;
  return String(nestedName || directName || 'Other').trim() || 'Other';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ icon, value, label, color }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <View style={[styles.statIconBox, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const FilterChip = ({ label, icon, active, color = colors.primary, onPress, emoji }) => (
  <Pressable
    onPress={onPress}
    style={[styles.filterChip, active && { backgroundColor: color, borderColor: color }]}
  >
    {emoji ? <Text style={styles.filterChipEmoji}>{emoji}</Text> : null}
    {icon ? <Ionicons name={icon} size={13} color={active ? colors.white : color} /> : null}
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

const PlaceCard = ({ item, onEdit, onDelete, onToggleActive }) => {
  const meta = getPlaceTypeMeta(item.type);
  const isActive = item.isActive !== false;

  return (
    <View style={[styles.card, { borderTopColor: meta.color }]}>
      {/* Top: image + content */}
      <View style={styles.cardTop}>
        {/* Left: image */}
        <View style={styles.photoWrapper}>
          <FallbackImage
            uri={getPlaceImageCandidates(item)}
            style={styles.photo}
            resizeMode="cover"
            iconName="image-outline"
            iconSize={28}
          />
          {item.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1)}</Text>
            </View>
          )}
          <View style={[styles.typeEmojiBox, { backgroundColor: meta.color + 'DD' }]}>
            <Text style={styles.typeEmojiText}>{meta.emoji}</Text>
          </View>
          {!isActive && (
            <View style={styles.inactiveOverlay}>
              <View style={styles.inactivePill}>
                <Ionicons name="eye-off-outline" size={9} color={colors.white} />
                <Text style={styles.inactivePillText}>HIDDEN</Text>
              </View>
            </View>
          )}
        </View>

        {/* Right: content */}
        <View style={styles.cardContent}>
          <Text style={styles.placeName} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.typeLine, { color: meta.color }]}>{item.type}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={11} color={colors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{getDistrictName(item)}</Text>
          </View>

          {item.address_text ? (
            <View style={styles.infoRow}>
              <Ionicons name="map-outline" size={11} color={colors.textMuted} />
              <Text style={styles.infoText} numberOfLines={1}>{item.address_text}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="chatbubble-outline" size={11} color={colors.textMuted} />
            <Text style={styles.infoText}>
              {item.review_count > 0
                ? `${item.review_count} review${item.review_count !== 1 ? 's' : ''}`
                : 'No reviews'}
            </Text>
          </View>

          {item.duration ? (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={11} color={colors.textMuted} />
              <Text style={styles.infoText}>{item.duration}</Text>
            </View>
          ) : null}

          <View style={[
            styles.statusPill,
            isActive
              ? { backgroundColor: colors.success + '18', borderColor: colors.success + '45' }
              : { backgroundColor: colors.surface2, borderColor: colors.border }
          ]}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? colors.success : colors.textMuted }]} />
            <Text style={[styles.statusText, { color: isActive ? colors.success : colors.textMuted }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <View style={styles.toggleGroup}>
          <Switch
            value={isActive}
            onValueChange={onToggleActive}
            trackColor={{ false: colors.border, true: colors.success + '55' }}
            thumbColor={isActive ? colors.success : '#ccc'}
            style={styles.switch}
          />
          <Text style={[styles.toggleLabel, { color: isActive ? colors.success : colors.textMuted }]}>
            {isActive ? 'Live' : 'Hidden'}
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
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const AdminPlacesScreen = ({ route, navigation }) => {
  const district = route.params?.district;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 380;
  const drawerWidth = Math.min(width - (isCompactPhone ? 8 : 18), 390);
  const drawerRadius = isCompactPhone ? 18 : 24;

  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [collapsedDistricts, setCollapsedDistricts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showToTop, setShowToTop] = useState(false);

  const listRef = useRef(null);

  const filtered = useMemo(() => {
    let result = places;
    if (typeFilter !== 'All') result = result.filter((p) => p.type?.toLowerCase() === typeFilter.toLowerCase());
    if (districtFilter !== 'All') result = result.filter((p) => getDistrictName(p) === districtFilter);
    if (statusFilter === 'Active') result = result.filter((p) => p.isActive !== false);
    if (statusFilter === 'Inactive') result = result.filter((p) => p.isActive === false);
    if (ratingFilter === 'Rated') result = result.filter((p) => Number(p.rating) > 0);
    if (ratingFilter === 'Unrated') result = result.filter((p) => !Number(p.rating));
    const q = search.trim().toLowerCase();
    if (q) result = result.filter(
      (p) => p.name?.toLowerCase().includes(q) ||
             p.address_text?.toLowerCase().includes(q) ||
             getDistrictName(p).toLowerCase().includes(q) ||
             p.type?.toLowerCase().includes(q)
    );
    return result;
  }, [districtFilter, places, ratingFilter, search, statusFilter, typeFilter]);

  const districtOptions = useMemo(() => {
    const names = Array.from(new Set(places.map(getDistrictName)))
      .filter(Boolean)
      .sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return a.localeCompare(b);
      });
    return ['All', ...names];
  }, [places]);

  const stats = useMemo(() => {
    const active = places.filter((p) => p.isActive !== false).length;
    const inactive = places.length - active;
    const rated = places.filter((p) => Number(p.rating) > 0).length;
    const districtCount = new Set(places.map(getDistrictName)).size;
    return { active, inactive, rated, districtCount };
  }, [places]);

  const groupedPlaces = useMemo(() => {
    const map = new Map();
    filtered.forEach((place) => {
      const key = getDistrictName(place);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(place);
    });
    return Array.from(map.entries())
      .map(([title, allPlaces]) => {
        const isExpanded = !!expandedDistricts[title];
        const isCollapsed = !!collapsedDistricts[title];
        const hasMore = allPlaces.length > DISTRICT_PREVIEW_LIMIT;
        return {
          title, count: allPlaces.length, hasMore, isExpanded, isCollapsed,
          data: isCollapsed ? [] : isExpanded ? allPlaces : allPlaces.slice(0, DISTRICT_PREVIEW_LIMIT)
        };
      })
      .sort((a, b) => {
        if (a.title === 'Other') return 1;
        if (b.title === 'Other') return -1;
        return a.title.localeCompare(b.title);
      });
  }, [collapsedDistricts, expandedDistricts, filtered]);

  const useDistrictSections = !district;

  const toggleDistrictCollapsed = (title) =>
    setCollapsedDistricts((prev) => ({ ...prev, [title]: !prev[title] }));

  const toggleDistrictExpanded = (title) =>
    setExpandedDistricts((prev) => ({ ...prev, [title]: !prev[title] }));

  // drawer-only count (type is handled inline)
  const activeFilterCount = [
    !district && districtFilter !== 'All',
    statusFilter !== 'All',
    ratingFilter !== 'All'
  ].filter(Boolean).length;

  const hasFilters = search || typeFilter !== 'All' || activeFilterCount > 0;

  const clearDrawerFilters = () => {
    setDistrictFilter('All');
    setStatusFilter('All');
    setRatingFilter('All');
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    clearDrawerFilters();
  };

  const handleListScroll = useCallback((e) => {
    const next = e.nativeEvent.contentOffset.y > 400;
    setShowToTop((prev) => (prev === next ? prev : next));
  }, []);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await getPlacesApi({
        includeInactive: true,
        ...(district ? { districtId: district.district_id } : {})
      });
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
    const nextActive = place.isActive === false;
    try {
      await updatePlaceApi(place._id, { isActive: nextActive });
      setPlaces((prev) => prev.map((p) => p._id === place._id ? { ...p, isActive: nextActive } : p));
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

  const renderItem = ({ item }) => (
    <PlaceCard
      item={item}
      onEdit={() => navigation.navigate('AdminPlaceForm', { place: item, district })}
      onDelete={() => handleDelete(item)}
      onToggleActive={() => handleToggleActive(item)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {district?.name || 'Place Management'}
          </Text>
          <Text style={styles.screenSub} numberOfLines={1}>
            {district?.province ? `${district.province} Province` : 'Manage all places'}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Ionicons name="location-outline" size={13} color={colors.primary} />
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <StatCard icon="location-outline" value={places.length} label="Total" color={colors.primary} />
        <StatCard icon="checkmark-circle-outline" value={stats.active} label="Active" color={colors.success} />
        <StatCard icon="eye-off-outline" value={stats.inactive} label="Inactive" color={colors.textMuted} />
        <StatCard
          icon={district ? 'star-outline' : 'map-outline'}
          value={district ? stats.rated : stats.districtCount}
          label={district ? 'Rated' : 'Districts'}
          color={colors.info}
        />
      </View>

      {/* ── Controls ── */}
      <View style={styles.controlsCard}>
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, district, type..."
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

        {/* Type filter chips + filter button */}
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.advancedFilterBtn, activeFilterCount > 0 && styles.advancedFilterBtnActive]}
            onPress={() => setFiltersOpen(true)}
          >
            <Ionicons name="options-outline" size={15}
              color={activeFilterCount > 0 ? colors.white : colors.textSecondary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickFilterRow}
          >
            {TYPE_FILTERS.map((f) => {
              const m = f === 'All' ? null : getPlaceTypeMeta(f);
              const active = typeFilter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setTypeFilter(f)}
                  style={[
                    styles.quickChip,
                    active && { backgroundColor: m?.color || colors.primary, borderColor: m?.color || colors.primary }
                  ]}
                >
                  {m ? <Text style={styles.quickChipEmoji}>{m.emoji}</Text> : null}
                  <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>
                    {f === 'All' ? 'All Types' : f}
                  </Text>
                </Pressable>
              );
            })}

            {hasFilters && (
              <Pressable onPress={clearFilters} style={styles.clearChip}>
                <Ionicons name="close" size={12} color={colors.accent} />
                <Text style={styles.clearChipText}>Clear all</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        <Text style={styles.resultSummary}>
          {filtered.length} place{filtered.length !== 1 ? 's' : ''}
          {activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active` : ''}
          {typeFilter !== 'All' ? ` · ${typeFilter}` : ''}
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : useDistrictSections ? (
        <SectionList
          ref={listRef}
          style={{ flex: 1 }}
          sections={groupedPlaces}
          keyExtractor={(item) => item._id}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Pressable
              style={styles.districtHeader}
              onPress={() => toggleDistrictCollapsed(section.title)}
            >
              <View style={styles.districtHeaderLeft}>
                <Ionicons
                  name={section.isCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={13} color={colors.primary}
                />
                <Ionicons name="location" size={13} color={colors.primary} />
                <Text style={styles.districtTitle}>{section.title}</Text>
              </View>
              <View style={styles.districtCountPill}>
                <Text style={styles.districtCountText}>
                  {section.count} place{section.count !== 1 ? 's' : ''}
                </Text>
              </View>
            </Pressable>
          )}
          renderItem={renderItem}
          renderSectionFooter={({ section }) =>
            !section.isCollapsed && section.hasMore ? (
              <Pressable
                style={styles.showMoreBtn}
                onPress={() => toggleDistrictExpanded(section.title)}
              >
                <Text style={styles.showMoreText}>
                  {section.isExpanded ? 'Show less' : `Show all ${section.count} places`}
                </Text>
                <Ionicons
                  name={section.isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={13} color={colors.primary}
                />
              </Pressable>
            ) : null
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 88 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="location-outline" size={36} color={colors.primary + '60'} />
              </View>
              <Text style={styles.emptyTitle}>No places found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item._id}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 88 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="location-outline" size={36} color={colors.primary + '60'} />
              </View>
              <Text style={styles.emptyTitle}>No places yet</Text>
              <Text style={styles.emptySub}>Tap + to add the first place in this district</Text>
            </View>
          }
        />
      )}

      {/* ── FAB ── */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('AdminPlaceForm', { district })}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* ── Filter drawer ── */}
      {showToTop && (
        <Pressable
          style={[styles.toTopBtn, { bottom: insets.bottom + 88 }]}
          onPress={() => {
            if (useDistrictSections) {
              listRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, viewPosition: 0, animated: true });
            } else {
              listRef.current?.scrollToOffset({ offset: 0, animated: true });
            }
          }}
        >
          <Ionicons name="arrow-up" size={24} color={colors.white} />
        </Pressable>
      )}

      <Modal
        visible={filtersOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setFiltersOpen(false)}
      >
        <View style={styles.drawerLayer}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setFiltersOpen(false)} />
          <View style={[
            styles.filterDrawer,
            {
              width: drawerWidth,
              marginTop: Math.max(insets.top, 10),
              marginBottom: Math.max(insets.bottom, 10),
              borderTopRightRadius: drawerRadius,
              borderBottomRightRadius: drawerRadius
            }
          ]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerTitleBlock}>
                <Text style={styles.drawerTitle}>Filters</Text>
                <Text style={styles.drawerSubtitle}>Refine the place list</Text>
              </View>
              <Pressable style={styles.drawerClose} onPress={() => setFiltersOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.drawerContent}
              contentContainerStyle={styles.drawerContentInner}
              showsVerticalScrollIndicator={false}
            >
              {!district && (
                <View style={styles.drawerSection}>
                  <Text style={styles.drawerSectionTitle}>District</Text>
                  <View style={styles.drawerFilterRow}>
                    {districtOptions.map((name) => (
                      <FilterChip
                        key={name}
                        label={name === 'All' ? 'All Districts' : name}
                        icon={name === 'All' ? 'map-outline' : 'location-outline'}
                        active={districtFilter === name}
                        color={colors.primary}
                        onPress={() => setDistrictFilter(name)}
                      />
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.drawerSection}>
                <Text style={styles.drawerSectionTitle}>Status</Text>
                <View style={styles.drawerFilterRow}>
                  {STATUS_FILTERS.map((name) => (
                    <FilterChip
                      key={name}
                      label={name}
                      icon={name === 'Inactive' ? 'eye-off-outline' : name === 'Active' ? 'checkmark-circle-outline' : 'options-outline'}
                      active={statusFilter === name}
                      color={colors.success}
                      onPress={() => setStatusFilter(name)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.drawerSection}>
                <Text style={styles.drawerSectionTitle}>Rating</Text>
                <View style={styles.drawerFilterRow}>
                  {RATING_FILTERS.map((name) => (
                    <FilterChip
                      key={name}
                      label={name}
                      icon={name === 'Unrated' ? 'star-outline' : name === 'Rated' ? 'star' : 'options-outline'}
                      active={ratingFilter === name}
                      color={colors.warning}
                      onPress={() => setRatingFilter(name)}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.drawerFooter}>
              <Pressable onPress={clearDrawerFilters} style={styles.drawerClearBtn}>
                <Text style={styles.drawerClearText}>Reset</Text>
              </Pressable>
              <Pressable onPress={() => setFiltersOpen(false)} style={styles.drawerApplyBtn}>
                <Text style={styles.drawerApplyText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerCenter: { flex: 1, minWidth: 0 },
  screenTitle: { fontSize: 21, fontWeight: '900', color: colors.textPrimary },
  screenSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary + '14',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '30',
  },
  countText: { fontSize: 13, fontWeight: '800', color: colors.primary },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    borderTopWidth: 3,
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, gap: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  statLabel: {
    fontSize: 9, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },

  // Controls card
  controlsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 18, borderWidth: 1, borderColor: colors.border,
    paddingTop: 12, paddingBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface2, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 12, marginBottom: 10,
    height: 46, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 12, paddingBottom: 4, gap: 8,
  },
  quickFilterRow: { paddingRight: 12, gap: 8, alignItems: 'center' },
  advancedFilterBtn: {
    width: 36, height: 34, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  advancedFilterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBadge: {
    position: 'absolute', top: -5, right: -5,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '900', color: colors.white },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface2, height: 34,
  },
  quickChipEmoji: { fontSize: 12 },
  quickChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white, fontWeight: '800' },
  clearChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: colors.accent + '40',
    backgroundColor: colors.accent + '10', height: 34,
  },
  clearChipText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  resultSummary: {
    color: colors.textMuted, fontSize: 11, fontWeight: '700',
    paddingHorizontal: 16, marginTop: 8, marginBottom: 2,
  },

  // Loading / error
  errorText: { color: colors.danger, fontSize: 13, paddingHorizontal: 20, marginBottom: 6 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // List
  list: { paddingHorizontal: 16, paddingTop: 4 },

  // District headers
  districtHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, marginBottom: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.primary + '0C',
    borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '22',
  },
  districtHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  districtTitle: { color: colors.primary, fontSize: 14, fontWeight: '900', flex: 1 },
  districtCountPill: {
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
  },
  districtCountText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  showMoreBtn: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
    backgroundColor: colors.primary + '12', marginTop: -2, marginBottom: 16,
  },
  showMoreText: { color: colors.primary, fontSize: 12, fontWeight: '800' },

  // Place card
  card: {
    backgroundColor: colors.surface, borderRadius: 18, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border, borderTopWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row' },
  photoWrapper: {
    width: 118, height: 162,
    backgroundColor: colors.surface3, position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  ratingBadge: {
    position: 'absolute', bottom: 8, right: 7,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  ratingText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  typeEmojiBox: {
    position: 'absolute', top: 8, left: 8,
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  typeEmojiText: { fontSize: 14 },
  inactiveOverlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8,
  },
  inactivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  inactivePillText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  cardContent: {
    flex: 1, paddingHorizontal: 12, paddingTop: 11, paddingBottom: 10,
  },
  placeName: {
    fontSize: 15, fontWeight: '900', color: colors.textPrimary,
    lineHeight: 20, marginBottom: 3,
  },
  typeLine: { fontSize: 11, fontWeight: '800', marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  infoText: { fontSize: 12, color: colors.textMuted, flex: 1, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },

  // Action bar
  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface2,
  },
  toggleGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  switch: { transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] },
  toggleLabel: { fontSize: 12, fontWeight: '700' },
  btnGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 10,
    backgroundColor: colors.primary + '14', borderWidth: 1, borderColor: colors.primary + '30',
  },
  editBtnText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.danger + '12', borderWidth: 1, borderColor: colors.danger + '30',
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // FAB
  fab: {
    position: 'absolute', right: 22,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 10,
  },

  // Filter drawer
  drawerLayer: { flex: 1, flexDirection: 'row', justifyContent: 'flex-start' },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,20,28,0.45)' },
  filterDrawer: {
    flex: 1, backgroundColor: colors.surface, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 14,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  drawerTitleBlock: { flex: 1, minWidth: 0 },
  drawerTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  drawerSubtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  drawerClose: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  drawerContent: { flex: 1 },
  drawerContentInner: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
  drawerSection: { marginBottom: 20 },
  drawerSectionTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', marginBottom: 10 },
  drawerFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  drawerFooter: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  drawerClearBtn: {
    flex: 1, minHeight: 46, borderRadius: 13,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  drawerClearText: { color: colors.textSecondary, fontSize: 13, fontWeight: '900' },
  drawerApplyBtn: {
    flex: 1, minHeight: 46, borderRadius: 13,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  drawerApplyText: { color: colors.white, fontSize: 13, fontWeight: '900' },

  // Filter chips (drawer)
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface2, minHeight: 34,
  },
  filterChipEmoji: { fontSize: 13 },
  filterChipText: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
  filterChipTextActive: { color: colors.white, fontWeight: '900' },
  toTopBtn: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999
  }
});

export default AdminPlacesScreen;
