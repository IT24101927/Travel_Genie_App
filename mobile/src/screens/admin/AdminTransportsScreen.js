import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { adminDeleteTransportScheduleApi, adminGetTransportSchedulesApi } from '../../api/transportApi';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  SCHEDULE_TYPES,
  formatDuration,
  formatLkr,
  getBookingChannelMeta,
  getTransportTypeMeta
} from '../../utils/transportOptions';

const normalize = (value) => String(value || '').trim().toLowerCase();
const TYPE_FILTERS = ['all', ...SCHEDULE_TYPES];

const StatPill = ({ icon, value, label }) => (
  <View style={styles.statPill}>
    <Ionicons name={icon} size={15} color={colors.white} />
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const TypeFilter = ({ type, active, onPress }) => {
  const meta = type === 'all'
    ? { label: 'All', shortLabel: 'All', icon: 'apps-outline', color: colors.primary }
    : getTransportTypeMeta(type);

  return (
    <Pressable
      style={[styles.typeChip, active && { backgroundColor: meta.color, borderColor: meta.color }]}
      onPress={onPress}
    >
      <Ionicons name={meta.icon} size={14} color={active ? colors.white : meta.color} />
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{meta.shortLabel || meta.label}</Text>
    </Pressable>
  );
};

const ScheduleAdminCard = ({ item, onEdit, onDelete }) => {
  const meta = getTransportTypeMeta(item.type);
  const bookingMeta = getBookingChannelMeta(item.bookingChannel);
  const routeLabel = [item.routeNo, item.routeName].filter(Boolean).join(' · ') || meta.label;

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardTypeTag, { backgroundColor: `${meta.color}15` }]}>
          <Ionicons name={meta.icon} size={13} color={meta.color} />
          <Text style={[styles.cardTypeText, { color: meta.color }]}>{meta.shortLabel || meta.label}</Text>
        </View>
        <Text style={styles.cardRouteName} numberOfLines={1}>{routeLabel}</Text>
        <View style={[styles.activeBadge, item.isActive ? styles.activeBadgeOn : styles.activeBadgeOff]}>
          <Text style={[styles.activeBadgeText, item.isActive ? styles.activeBadgeTextOn : styles.activeBadgeTextOff]}>
            {item.isActive ? 'Active' : 'Hidden'}
          </Text>
        </View>
      </View>

      {/* Ticket-style route row */}
      <View style={styles.ticketRow}>
        <View style={styles.ticketSide}>
          <Text style={styles.ticketTime}>{item.departureTime || '--:--'}</Text>
          <Text style={styles.ticketStation} numberOfLines={2}>{item.departureStation || 'Departure'}</Text>
        </View>
        <View style={styles.ticketMid}>
          <View style={styles.ticketDot} />
          <View style={[styles.ticketLine, { backgroundColor: meta.color }]} />
          <Ionicons name={meta.icon} size={18} color={meta.color} />
          <View style={[styles.ticketLine, { backgroundColor: meta.color }]} />
          <View style={[styles.ticketDot, { backgroundColor: meta.color }]} />
          <Text style={[styles.ticketDuration, { color: meta.color }]}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={[styles.ticketSide, styles.ticketSideRight]}>
          <Text style={styles.ticketTime}>{item.arrivalTime || '--:--'}</Text>
          <Text style={[styles.ticketStation, styles.ticketStationRight]} numberOfLines={2}>{item.arrivalStation || 'Arrival'}</Text>
        </View>
      </View>

      {/* Provider + meta */}
      <View style={styles.cardProviderRow}>
        <Text style={styles.cardProviderName} numberOfLines={1}>{item.provider || 'Unknown provider'}</Text>
        {item.serviceClass ? <Text style={styles.cardServiceClass} numberOfLines={1}>{item.serviceClass}</Text> : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>{item.district || 'No district'}</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons name={bookingMeta.icon} size={12} color={bookingMeta.color} />
          <Text style={[styles.metaText, { color: bookingMeta.color }]} numberOfLines={1}>{bookingMeta.shortLabel}</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons name="cash-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatLkr(item.ticketPriceLKR)}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable style={styles.editBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
};

const PAGE_SIZE = 30;

const AdminTransportsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [showToTop, setShowToTop] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const listRef = useRef(null);
  const searchTimer = useRef(null);
  const isFirstLoad = useRef(true);

  const handleSearchChange = useCallback((text) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(text), 400);
  }, []);

  const loadData = useCallback(async ({ silent = false, pageNum = 1, append = false } = {}) => {
    try {
      if (!silent && !append) setLoading(true);
      if (append) setLoadingMore(true);
      setError('');

      const params = { page: pageNum, limit: PAGE_SIZE };
      if (selectedType !== 'all') params.type = selectedType;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await adminGetTransportSchedulesApi(params);
      const data = res?.data || {};
      const newSchedules = data.schedules || [];
      setSchedules(prev => append ? [...prev, ...newSchedules] : newSchedules);
      setPage(data.page || pageNum);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || newSchedules.length);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch transport schedules.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [selectedType, debouncedSearch]);

  // Initial load on screen focus
  useFocusEffect(useCallback(() => {
    isFirstLoad.current = true;
    loadData();
  }, []));

  // Re-fetch when filters change
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    loadData({ silent: true });
  }, [debouncedSearch, selectedType]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    loadData({ silent: true, pageNum: page + 1, append: true });
  }, [loadingMore, page, totalPages, loadData]);

  const handleListScroll = useCallback((e) => {
    const next = e.nativeEvent.contentOffset.y > 400;
    setShowToTop((prev) => (prev === next ? prev : next));
  }, []);

  const stats = useMemo(() => {
    const activeCount = schedules.filter((item) => item.isActive !== false).length;
    const inactiveCount = schedules.length - activeCount;
    return { activeCount, inactiveCount };
  }, [schedules]);

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Schedule',
      `Delete ${item.provider} from ${item.departureStation} to ${item.arrivalStation}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminDeleteTransportScheduleApi(item._id);
              await loadData({ silent: true });
            } catch (err) {
              setLoading(false);
              Alert.alert('Error', getApiErrorMessage(err, 'Failed to delete schedule.'));
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.eyebrow}>Admin Routes</Text>
          <Text style={styles.title}>Transport Management</Text>
        </View>
        <View style={styles.headerBtnPlaceholder} />
      </View>

      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <StatPill icon="bus-outline" value={total} label="Total" />
        <StatPill icon="checkmark-circle-outline" value={stats.activeCount} label="Active" />
        <StatPill icon="layers-outline" value={`${page}/${totalPages}`} label="Page" />
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search route, station, district..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
        {TYPE_FILTERS.map((type) => (
          <TypeFilter
            key={type}
            type={type}
            active={selectedType === type}
            onPress={() => setSelectedType(type)}
          />
        ))}
      </ScrollView>

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{total} schedules</Text>
        <Text style={styles.resultSub}>Sri Lankan public and private routes</Text>
      </View>

      <ErrorText message={error} />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading transport admin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        ref={listRef}
        data={schedules}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <ScheduleAdminCard
            item={item}
            onEdit={() => navigation.navigate('AdminTransportForm', { transportId: item._id })}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData({ silent: true }); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No transport schedules"
            subtitle="Add train, bus, ferry, taxi or van routes for travelers."
            icon="bus-outline"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {showToTop && (
        <Pressable
          style={[styles.toTopBtn, { bottom: insets.bottom + 88 }]}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Ionicons name="arrow-up" size={24} color={colors.white} />
        </Pressable>
      )}

      {/* ── FAB ── */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('AdminTransportForm')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  toTopBtn: {
    position: 'absolute',
    right: 24,
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
  },
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  list: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  headerBtnPlaceholder: { width: 42 },
  headerTitleBlock: { flex: 1, paddingHorizontal: 12 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 1 },
  hero: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 13
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  statValue: { color: colors.white, fontSize: 16, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginTop: 14,
    height: 50,
    paddingHorizontal: 14
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, height: '100%' },
  typeRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  typeChip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13
  },
  typeChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  typeChipTextActive: { color: colors.white },
  resultHeader: { paddingHorizontal: 16, marginTop: 18, marginBottom: 2 },
  resultTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  resultSub: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  cardTypeText: { fontSize: 10, fontWeight: '900' },
  cardRouteName: { flex: 1, fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginLeft: 2 },
  activeBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  activeBadgeOn: { backgroundColor: colors.success + '15' },
  activeBadgeOff: { backgroundColor: colors.danger + '12' },
  activeBadgeText: { fontSize: 10, fontWeight: '900' },
  activeBadgeTextOn: { color: colors.success },
  activeBadgeTextOff: { color: colors.danger },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10
  },
  ticketSide: { flex: 1, gap: 3 },
  ticketSideRight: { alignItems: 'flex-end' },
  ticketTime: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  ticketStation: { color: colors.textMuted, fontSize: 11, fontWeight: '700', lineHeight: 14 },
  ticketStationRight: { textAlign: 'right' },
  ticketMid: { alignItems: 'center', gap: 3, paddingHorizontal: 8 },
  ticketDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryDark },
  ticketLine: { height: 2, width: 28, borderRadius: 1 },
  ticketDuration: { fontSize: 9, fontWeight: '900', marginTop: 3 },
  cardProviderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardProviderName: { flex: 1, fontSize: 13, fontWeight: '900', color: colors.textPrimary },
  cardServiceClass: { fontSize: 11, fontWeight: '700', color: colors.textMuted, backgroundColor: colors.surface2, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  metaRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  metaPill: {
    flex: 1,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8
  },
  metaText: { flex: 1, color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  editBtn: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    paddingHorizontal: 13
  },
  editText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.danger + '10',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default AdminTransportsScreen;
