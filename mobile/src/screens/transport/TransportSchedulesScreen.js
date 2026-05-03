import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import { getTransportSchedulesApi } from '../../api/transportApi';
import colors from '../../constants/colors';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  SCHEDULE_TYPES,
  formatDuration,
  formatLkr,
  getBookingActionLabel,
  getBookingChannelMeta,
  getTransportTypeMeta
} from '../../utils/transportOptions';
import { RouteResultCard, RouteDetailModal } from './TransportListScreen';

const TYPE_FILTERS = ['all', ...SCHEDULE_TYPES];

const FilterChip = ({ label, active, onPress, icon, color = colors.primary }) => (
  <Pressable
    style={[styles.filterChip, active && { backgroundColor: color, borderColor: color }]}
    onPress={onPress}
  >
    {icon ? <Ionicons name={icon} size={14} color={active ? colors.white : color} /> : null}
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

const PAGE_SIZE = 30;

const TransportSchedulesScreen = ({ navigation, route }) => {
  const initialDistrict = route.params?.districtId
    ? String(route.params.districtId)
    : route.params?.districtName || 'all';
  const [schedules, setSchedules] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [selectedType, setSelectedType] = useState(route.params?.type || 'all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchTimer = useRef(null);
  const isFirstLoad = useRef(true);

  // Debounce search input
  const handleSearchChange = useCallback((text) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(text), 400);
  }, []);

  const loadSchedules = useCallback(async ({ silent = false, pageNum = 1, append = false, type, district, searchText } = {}) => {
    try {
      if (!silent && !append) setLoading(true);
      if (append) setLoadingMore(true);
      setError('');

      const params = { page: pageNum, limit: PAGE_SIZE };
      const t = type ?? selectedType;
      const d = district ?? selectedDistrict;
      const s = searchText ?? debouncedSearch;
      if (t !== 'all') params.type = t;
      if (d !== 'all') {
        if (/^\d+$/.test(d)) params.districtId = d;
        else params.district = d;
      }
      if (s.trim()) params.search = s.trim();

      const response = await getTransportSchedulesApi(params);
      const data = response?.data || {};
      const newSchedules = data.schedules || [];
      setSchedules(prev => append ? [...prev, ...newSchedules] : newSchedules);
      setPage(data.page || pageNum);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || newSchedules.length);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load transit schedules.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [selectedType, selectedDistrict, debouncedSearch]);

  // Initial load on screen focus
  useFocusEffect(useCallback(() => {
    isFirstLoad.current = true;
    loadSchedules();
  }, []));

  // Re-fetch when filters change (skip the very first render)
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    loadSchedules({ silent: true });
  }, [debouncedSearch, selectedType, selectedDistrict]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    loadSchedules({ silent: true, pageNum: page + 1, append: true });
  }, [loadingMore, page, totalPages, loadSchedules]);

  const selectedDistrictLabel = useMemo(() => {
    if (selectedDistrict === 'all') return 'Sri Lanka';
    return route.params?.districtName || selectedDistrict || 'District';
  }, [route.params?.districtName, selectedDistrict]);

  const renderFixedControls = () => (
    <View>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Transit Route Board</Text>
          <Text style={styles.title}>{selectedDistrictLabel}</Text>
          <Text style={styles.subtitle}>{total} scheduled routes available</Text>
        </View>
      </View>

      <View style={[styles.searchBox, { marginTop: 8 }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={handleSearchChange}
          style={styles.searchInput}
          placeholder="Search station, route, operator..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {TYPE_FILTERS.map((type) => {
          const meta = type === 'all'
            ? { label: 'All modes', icon: 'apps-outline', color: colors.primary }
            : getTransportTypeMeta(type);
          return (
            <FilterChip
              key={type}
              label={meta.label}
              active={selectedType === type}
              onPress={() => setSelectedType(type)}
              icon={meta.icon}
              color={meta.color}
            />
          );
        })}
      </ScrollView>

      <ErrorText message={error} />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading more routes...</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading route board...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {renderFixedControls()}
      <FlatList
        data={schedules}
        keyExtractor={(item) => item._id}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <RouteResultCard
            item={item}
            onDetails={() => setDetailItem(item)}
            onLog={() => navigation.navigate('AddTransport', { schedule: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadSchedules({ silent: true }); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No transport routes found"
            subtitle="Try another mode or search term."
            icon="bus-outline"
          />
        }
        showsVerticalScrollIndicator={false}
      />
      <RouteDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  listContent: { paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 2 },
  subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  summaryPanel: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center'
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.white, fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  summaryDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.22)' },
  searchBox: {
    height: 50,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14
  },
  searchInput: { flex: 1, height: '100%', color: colors.textPrimary, fontSize: 14 },
  filterRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  filterChip: {
    height: 36,
    maxWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', flexShrink: 1 },
  filterChipTextActive: { color: colors.white },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  providerName: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  serviceText: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  priceTag: { backgroundColor: colors.success + '14', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  priceText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  routePanel: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 15,
    marginTop: 12,
    padding: 12
  },
  routePoint: { flex: 1 },
  timeText: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  stationText: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 4, lineHeight: 16 },
  routeMiddle: { width: 42, alignItems: 'center', justifyContent: 'center' },
  routeDot: { width: 11, height: 11, borderRadius: 6 },
  routeLine: { width: 1, height: 26, backgroundColor: colors.border, marginVertical: 3 },
  infoGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  infoPill: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 9
  },
  infoPillText: { color: colors.textMuted, fontSize: 11, fontWeight: '800', flex: 1 },
  bookingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 13,
    padding: 10,
    marginTop: 10
  },
  bookingIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bookingCopy: { flex: 1, minWidth: 0 },
  bookingTitle: { fontSize: 12, fontWeight: '900' },
  bookingSub: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2, lineHeight: 15 },
  tipBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent + '10',
    borderRadius: 13,
    padding: 10,
    marginTop: 10
  },
  tipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', lineHeight: 17, flex: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '10',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexShrink: 1
  },
  contactText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  bookButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primary + '10'
  },
  bookButtonText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  logButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 12
  },
  logButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' }
});

export default TransportSchedulesScreen;
