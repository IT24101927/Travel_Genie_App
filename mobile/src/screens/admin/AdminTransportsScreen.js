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
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { adminDeleteTransportScheduleApi, adminGetTransportSchedulesApi } from '../../api/transportApi';
import { adminTransportInsightsApi } from '../../api/adminApi';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  SCHEDULE_TYPES,
  formatDuration,
  formatLkr,
  getBookingChannelMeta,
  getTransportTypeMeta
} from '../../utils/transportOptions';

const TYPE_FILTERS = ['all', ...SCHEDULE_TYPES];
const PAGE_SIZE = 30;

/* ─────────────── Header (redesigned) ─────────────── */

const HeroStat = ({ value, label }) => (
  <View style={styles.heroStat}>
    <Text style={styles.heroStatValue}>{value}</Text>
    <Text style={styles.heroStatLabel}>{label}</Text>
  </View>
);

const HeroDivider = () => <View style={styles.heroDivider} />;

const TopHeader = ({ navigation, tab, setTab, schedulesStat, insightsStat }) => {
  const isInsights = tab === 'insights';
  return (
    <View style={styles.topWrap}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.topTitleBlock}>
          <Text style={styles.topEyebrow}>Admin · Catalog</Text>
          <Text style={styles.topTitle}>Transport Management</Text>
        </View>
        <View style={styles.privacyChip}>
          <Ionicons name="shield-checkmark" size={12} color={colors.success} />
          <Text style={styles.privacyChipText}>Privacy-safe</Text>
        </View>
      </View>

      <LinearGradient
        colors={isInsights ? [colors.info, colors.primary] : [colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroIcon}>
          <Ionicons name={isInsights ? 'analytics' : 'bus'} size={22} color={colors.white} />
        </View>
        <View style={styles.heroBody}>
          <Text style={styles.heroEyebrow}>
            {isInsights ? 'Anonymous aggregates' : 'Public route catalog'}
          </Text>
          <View style={styles.heroStatsRow}>
            {isInsights ? (
              <>
                <HeroStat value={insightsStat.totalBookings} label="Bookings" />
                <HeroDivider />
                <HeroStat value={insightsStat.uniqueUsers} label="Users" />
                <HeroDivider />
                <HeroStat value={insightsStat.routes} label="Hot routes" />
              </>
            ) : (
              <>
                <HeroStat value={schedulesStat.total} label="Total" />
                <HeroDivider />
                <HeroStat value={schedulesStat.active} label="Active" />
                <HeroDivider />
                <HeroStat value={schedulesStat.hidden} label="Hidden" />
              </>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === 'schedules' && styles.tabActive]}
          onPress={() => setTab('schedules')}
        >
          <Ionicons
            name="list"
            size={15}
            color={tab === 'schedules' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, tab === 'schedules' && styles.tabTextActive]}>
            Schedules
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'insights' && styles.tabActive]}
          onPress={() => setTab('insights')}
        >
          <Ionicons
            name="bar-chart"
            size={15}
            color={tab === 'insights' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, tab === 'insights' && styles.tabTextActive]}>
            Insights
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

/* ─────────────── Schedule card (existing, kept) ─────────────── */

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
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
        {meta.shortLabel || meta.label}
      </Text>
    </Pressable>
  );
};

const ScheduleAdminCard = ({ item, onEdit, onDelete }) => {
  const meta = getTransportTypeMeta(item.type);
  const bookingMeta = getBookingChannelMeta(item.bookingChannel);
  const routeLabel = [item.routeNo, item.routeName].filter(Boolean).join(' · ') || meta.label;

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
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

/* ─────────────── Insights tab content ─────────────── */

const InsightsBar = ({ label, count, max, color, sub }) => {
  const pct = max > 0 ? Math.max(0.04, count / max) : 0;
  return (
    <View style={styles.barRow}>
      <View style={styles.barMeta}>
        <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.barCount}>
          {count}{sub ? <Text style={styles.barSub}> · {sub}</Text> : null}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const formatWeek = (year, week) => `W${String(week).padStart(2, '0')} '${String(year).slice(-2)}`;

const InsightsTab = ({ data, loading, error, onRefresh, refreshing }) => {
  if (loading) {
    return (
      <View style={styles.insightsLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading insights…</Text>
      </View>
    );
  }

  const byType = data?.byType || [];
  const byStatus = data?.byStatus || [];
  const popularRoutes = data?.popularRoutes || [];
  const avgCostByType = data?.avgCostByType || [];
  const weeklyVolume = data?.weeklyVolume || [];

  const maxByType = Math.max(1, ...byType.map((t) => t.count));
  const maxStatus = Math.max(1, ...byStatus.map((s) => s.count));
  const maxRoute = Math.max(1, ...popularRoutes.map((r) => r.count));
  const maxWeek = Math.max(1, ...weeklyVolume.map((w) => w.count));

  return (
    <ScrollView
      contentContainerStyle={styles.insightsContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <ErrorText message={error} />

      <View style={styles.privacyNote}>
        <Ionicons name="lock-closed" size={15} color={colors.success} />
        <Text style={styles.privacyText}>
          Aggregates only. User identities, booking refs and notes are never shown here.
        </Text>
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Bookings by type</Text>
        {byType.length === 0 ? (
          <Text style={styles.empty}>No bookings yet.</Text>
        ) : (
          byType.map((t) => {
            const meta = getTransportTypeMeta(t.type);
            return (
              <InsightsBar
                key={t.type}
                label={meta.label}
                count={t.count}
                max={maxByType}
                color={meta.color}
              />
            );
          })
        )}
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Status breakdown</Text>
        {byStatus.length === 0 ? (
          <Text style={styles.empty}>No data.</Text>
        ) : (
          byStatus.map((s) => {
            const color =
              s.status === 'completed' ? colors.success
              : s.status === 'cancelled' ? colors.danger
              : colors.warning;
            return (
              <InsightsBar
                key={s.status}
                label={String(s.status || 'unknown').replace(/^./, (c) => c.toUpperCase())}
                count={s.count}
                max={maxStatus}
                color={color}
              />
            );
          })
        )}
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Top routes</Text>
        <Text style={styles.insightSub}>Pairs booked at least twice</Text>
        {popularRoutes.length === 0 ? (
          <Text style={styles.empty}>No repeat routes yet.</Text>
        ) : (
          popularRoutes.map((r, i) => (
            <InsightsBar
              key={`${r.from}-${r.to}-${i}`}
              label={`${r.from || '—'} → ${r.to || '—'}`}
              count={r.count}
              max={maxRoute}
              color={colors.info}
            />
          ))
        )}
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Avg cost by type</Text>
        {avgCostByType.length === 0 ? (
          <Text style={styles.empty}>No cost data.</Text>
        ) : (
          avgCostByType.map((row) => {
            const meta = getTransportTypeMeta(row.type);
            const value = row.avgActual || row.avgEstimated || 0;
            return (
              <View key={row.type} style={styles.costRow}>
                <View style={[styles.costDot, { backgroundColor: meta.color }]} />
                <Text style={styles.costLabel}>{meta.label}</Text>
                <Text style={styles.costValue}>{formatLkr(value)}</Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Weekly volume</Text>
        <Text style={styles.insightSub}>Last 8 weeks (by departure date)</Text>
        {weeklyVolume.length === 0 ? (
          <Text style={styles.empty}>No recent bookings.</Text>
        ) : (
          <View style={styles.weekRow}>
            {weeklyVolume.map((w) => {
              const h = Math.max(8, Math.round((w.count / maxWeek) * 80));
              return (
                <View key={`${w.year}-${w.week}`} style={styles.weekItem}>
                  <View style={styles.weekBarTrack}>
                    <View style={[styles.weekBarFill, { height: h }]} />
                  </View>
                  <Text style={styles.weekCount}>{w.count}</Text>
                  <Text style={styles.weekLabel}>{formatWeek(w.year, w.week)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

/* ─────────────── Main screen ─────────────── */

const AdminTransportsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Tab + shared
  const [tab, setTab] = useState('schedules');

  // Schedules state
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

  // Insights state
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsRefreshing, setInsightsRefreshing] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const insightsLoaded = useRef(false);

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
      setSchedules((prev) => (append ? [...prev, ...newSchedules] : newSchedules));
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

  const loadInsights = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setInsightsLoading(true);
      setInsightsError('');
      const res = await adminTransportInsightsApi();
      setInsightsData(res?.data || null);
      insightsLoaded.current = true;
    } catch (err) {
      setInsightsError(getApiErrorMessage(err, 'Failed to load insights'));
    } finally {
      setInsightsLoading(false);
      setInsightsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    isFirstLoad.current = true;
    loadData();
  }, []));

  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    loadData({ silent: true });
  }, [debouncedSearch, selectedType]);

  useEffect(() => {
    if (tab === 'insights' && !insightsLoaded.current) {
      loadInsights();
    }
  }, [tab, loadInsights]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    loadData({ silent: true, pageNum: page + 1, append: true });
  }, [loadingMore, page, totalPages, loadData]);

  const handleListScroll = useCallback((e) => {
    const next = e.nativeEvent.contentOffset.y > 400;
    setShowToTop((prev) => (prev === next ? prev : next));
  }, []);

  const schedulesStat = useMemo(() => {
    const active = schedules.filter((item) => item.isActive !== false).length;
    const hidden = schedules.length - active;
    return { total, active, hidden };
  }, [schedules, total]);

  const insightsStat = useMemo(() => ({
    totalBookings: insightsData?.totalBookings ?? 0,
    uniqueUsers: insightsData?.uniqueUsers ?? 0,
    routes: insightsData?.popularRoutes?.length ?? 0
  }), [insightsData]);

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
      <TopHeader
        navigation={navigation}
        tab={tab}
        setTab={setTab}
        schedulesStat={schedulesStat}
        insightsStat={insightsStat}
      />

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

  if (loading && !refreshing && tab === 'schedules' && schedules.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TopHeader
          navigation={navigation}
          tab={tab}
          setTab={setTab}
          schedulesStat={schedulesStat}
          insightsStat={insightsStat}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading transport admin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tab === 'insights') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TopHeader
          navigation={navigation}
          tab={tab}
          setTab={setTab}
          schedulesStat={schedulesStat}
          insightsStat={insightsStat}
        />
        <InsightsTab
          data={insightsData}
          loading={insightsLoading}
          error={insightsError}
          refreshing={insightsRefreshing}
          onRefresh={() => { setInsightsRefreshing(true); loadInsights({ silent: true }); }}
        />
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
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  list: { paddingBottom: 100 },

  /* ── Top header (redesigned) ── */
  topWrap: { paddingBottom: 4 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border
  },
  topTitleBlock: { flex: 1 },
  topEyebrow: {
    color: colors.primary, fontSize: 10, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 1
  },
  topTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '900', marginTop: 1 },
  privacyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${colors.success}15`,
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: `${colors.success}30`
  },
  privacyChipText: { color: colors.success, fontSize: 10, fontWeight: '900' },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16
  },
  heroIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center'
  },
  heroBody: { flex: 1 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 1
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8
  },
  heroStat: { gap: 1 },
  heroStatValue: { color: colors.white, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.6
  },
  heroDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.25)' },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 4,
    gap: 4
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '900' },
  tabTextActive: { color: colors.white },

  /* ── Search + filters (kept) ── */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginTop: 14,
    height: 50, paddingHorizontal: 14
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, height: '100%' },
  typeRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  typeChip: {
    height: 36,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 13
  },
  typeChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  typeChipTextActive: { color: colors.white },
  resultHeader: { paddingHorizontal: 16, marginTop: 18, marginBottom: 2 },
  resultTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  resultSub: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },

  /* ── Schedule cards (kept) ── */
  card: {
    backgroundColor: colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
    padding: 14, marginHorizontal: 16, marginTop: 12
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10
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
    flex: 1, minHeight: 32,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 8
  },
  metaText: { flex: 1, color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  cardActions: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    gap: 9, marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border
  },
  editBtn: {
    height: 36, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primary + '10', borderRadius: 12, paddingHorizontal: 13
  },
  editText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.danger + '10',
    alignItems: 'center', justifyContent: 'center'
  },

  /* ── Insights tab ── */
  insightsLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  insightsContent: { paddingBottom: 60 },
  privacyNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 14,
    padding: 12, borderRadius: 14,
    backgroundColor: `${colors.success}12`,
    borderWidth: 1, borderColor: `${colors.success}33`
  },
  privacyText: { color: colors.textSecondary, flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  insightCard: {
    marginHorizontal: 16, marginTop: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    gap: 10
  },
  insightTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  insightSub: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: -6 },
  empty: { color: colors.textMuted, fontSize: 12, fontWeight: '700', paddingVertical: 6 },
  barRow: { gap: 5 },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', flex: 1 },
  barCount: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  barSub: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  barTrack: { height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  costDot: { width: 9, height: 9, borderRadius: 5 },
  costLabel: { flex: 1, color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  costValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  weekRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 4 },
  weekItem: { flex: 1, alignItems: 'center', gap: 4 },
  weekBarTrack: { width: '100%', height: 80, justifyContent: 'flex-end', alignItems: 'center' },
  weekBarFill: { width: '70%', backgroundColor: colors.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  weekCount: { color: colors.textPrimary, fontSize: 10, fontWeight: '900' },
  weekLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },

  /* ── Floating buttons (kept) ── */
  fab: {
    position: 'absolute', right: 22,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 10
  },
  toTopBtn: {
    position: 'absolute', right: 24,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
    zIndex: 999
  }
});

export default AdminTransportsScreen;
