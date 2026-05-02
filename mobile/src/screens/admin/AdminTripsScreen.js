import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import { adminListResourceApi } from '../../api/adminApi';
import { deleteTripApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['planned', 'ongoing', 'completed', 'cancelled'];
const STATUS_META = {
  planned:   { label: 'Planned',   color: colors.statusPlanned,   icon: 'calendar-outline' },
  ongoing:   { label: 'Ongoing',   color: colors.statusOngoing,   icon: 'navigate-outline' },
  completed: { label: 'Completed', color: colors.statusCompleted, icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelled', color: colors.statusCancelled, icon: 'close-circle-outline' },
};
const FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];
const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'name',   label: 'Name' },
  { key: 'budget', label: 'Budget' },
];

const LKR_RATES   = { LKR: 1, USD: 0.0033, EUR: 0.0031 };
const CURRENCY_SYMS = { LKR: 'Rs', USD: '$', EUR: '€' };
const fmtMoney = (lkr, code = 'LKR') => {
  const rate = LKR_RATES[code] || 1;
  const sym  = CURRENCY_SYMS[code] || 'Rs';
  const val  = Math.round((Number(lkr) || 0) * rate);
  return `${sym}${val.toLocaleString()}`;
};
const fmtDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const safeArr = (v) => (Array.isArray(v) ? v : []);

// ── Sub-components ─────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color }) => (
  <View style={[st.statCard, { borderTopColor: color }]}>
    <View style={[st.statIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={[st.statValue, { color }]}>{value}</Text>
    <Text style={st.statLabel}>{label}</Text>
  </View>
);

const FilterChip = ({ label, active, color = colors.primary, onPress }) => (
  <Pressable
    onPress={onPress}
    style={[st.chip, active && { backgroundColor: color, borderColor: color }]}
  >
    <Text style={[st.chipText, active && { color: colors.white }]}>{label}</Text>
  </Pressable>
);

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, color: colors.textMuted };
  return (
    <View style={[st.statusBadge, { backgroundColor: meta.color + '20', borderColor: meta.color + '55' }]}>
      <Text style={[st.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
};

const TripCard = ({ item, onView, onEdit, onDelete }) => {
  const places    = safeArr(item.selectedPlaces).length;
  const hotelObj  = item.selectedHotel;
  const hotels    = hotelObj ? (Array.isArray(hotelObj) ? hotelObj.length : 1) : safeArr(item.selectedHotels).length;
  const nights    = item.nights || 0;
  const travelers = item.travelers || item.preferences?.travelers || 1;

  return (
    <View style={st.card}>
      <View style={st.cardTop}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={st.cardTitle} numberOfLines={1}>{item.title || 'Untitled Trip'}</Text>
          <View style={st.cardRow}>
            <Ionicons name="location-outline" size={13} color={colors.primary} />
            <Text style={st.cardDist} numberOfLines={1}>{item.districtName || item.destination || '—'}</Text>
            {item.province ? <Text style={st.cardProv}>{item.province}</Text> : null}
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Info pills */}
      <View style={st.pillRow}>
        <View style={st.pill}>
          <Ionicons name="moon-outline" size={11} color={colors.textMuted} />
          <Text style={st.pillText}>{nights} night{nights !== 1 ? 's' : ''}</Text>
        </View>
        <View style={st.pill}>
          <Ionicons name="people-outline" size={11} color={colors.textMuted} />
          <Text style={st.pillText}>{travelers} traveler{travelers !== 1 ? 's' : ''}</Text>
        </View>
        <View style={st.pill}>
          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
          <Text style={st.pillText}>{places} place{places !== 1 ? 's' : ''}</Text>
        </View>
        {hotels > 0 && (
          <View style={st.pill}>
            <Ionicons name="bed-outline" size={11} color={colors.textMuted} />
            <Text style={st.pillText}>{hotels} hotel{hotels !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Dates + Budget */}
      <View style={st.cardMeta}>
        <View style={st.cardMetaLeft}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={st.cardMetaText}>
            {fmtDate(item.startDate)} → {fmtDate(item.endDate)}
          </Text>
        </View>
        <Text style={st.cardBudget}>{fmtMoney(item.budget || 0, 'LKR')}</Text>
      </View>

      {/* Actions */}
      <View style={st.cardActions}>
        <Pressable style={st.btnView} onPress={() => onView(item)}>
          <Ionicons name="eye-outline" size={14} color={colors.primary} />
          <Text style={st.btnViewText}>View</Text>
        </Pressable>
        <Pressable style={st.btnEdit} onPress={() => onEdit(item)}>
          <Ionicons name="create-outline" size={14} color={colors.white} />
          <Text style={st.btnEditText}>Edit</Text>
        </Pressable>
        <Pressable style={st.btnDelete} onPress={() => onDelete(item)}>
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────
const AdminTripsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [trips, setTrips]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const [sort, setSort]             = useState('newest');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const res = await adminListResourceApi('trips');
      const raw = Array.isArray(res?.data?.items) ? res.data.items : [];
      setTrips(raw);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load trips'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const stats = useMemo(() => ({
    total:     trips.length,
    active:    trips.filter(t => t.status === 'planned' || t.status === 'ongoing').length,
    completed: trips.filter(t => t.status === 'completed').length,
    cancelled: trips.filter(t => t.status === 'cancelled').length,
  }), [trips]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = trips.filter(t => {
      const matchQ = !q
        || (t.title || '').toLowerCase().includes(q)
        || (t.destination || '').toLowerCase().includes(q)
        || (t.districtName || '').toLowerCase().includes(q);
      const matchF = filter === 'All' || t.status === filter;
      return matchQ && matchF;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'name')   return (a.title || '').localeCompare(b.title || '');
      if (sort === 'budget') return (b.budget || 0) - (a.budget || 0);
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
    });
    return list;
  }, [trips, search, filter, sort]);

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Trip',
      `Delete "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteTripApi(item._id);
              setTrips(prev => prev.filter(t => t._id !== item._id));
            } catch (err) {
              Alert.alert('Error', getApiErrorMessage(err, 'Failed to delete trip'));
            }
          },
        },
      ]
    );
  };

  // Navigate to fully separate pages
  const handleView = (item) => {
    navigation.navigate('AdminTripDetail', { trip: item });
  };

  const handleEdit = (item) => {
    navigation.navigate('AdminTripEdit', {
      trip: item,
      onSaved: (updated) => {
        setTrips(prev => prev.map(t => t._id === updated._id ? { ...t, ...updated } : t));
      },
    });
  };

  const renderHeader = () => (
    <View style={st.headerWrap}>
      {/* Stats */}
      <View style={st.statsRow}>
        <StatCard icon="map-outline"              value={stats.total}     label="Total"     color={colors.primary} />
        <StatCard icon="navigate-outline"         value={stats.active}    label="Active"    color={colors.statusOngoing} />
        <StatCard icon="checkmark-circle-outline" value={stats.completed} label="Done"      color={colors.statusCompleted} />
        <StatCard icon="close-circle-outline"     value={stats.cancelled} label="Cancelled" color={colors.statusCancelled} />
      </View>

      {/* Search */}
      <View style={st.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={st.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search trips…"
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Status filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipRow}>
        {FILTER_OPTIONS.map(f => (
          <FilterChip
            key={f}
            label={f}
            active={filter === f}
            color={f === 'All' ? colors.primary : STATUS_META[f]?.color || colors.primary}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      {/* Sort */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipRow}>
        {SORT_OPTIONS.map(s => (
          <FilterChip
            key={s.key}
            label={s.label}
            active={sort === s.key}
            color={colors.textSecondary}
            onPress={() => setSort(s.key)}
          />
        ))}
      </ScrollView>

      {error ? (
        <View style={st.errorBanner}>
          <Ionicons name="warning-outline" size={14} color={colors.danger} />
          <Text style={st.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <Text style={st.resultCount}>{filtered.length} trip{filtered.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* Top bar */}
      <View style={st.topBar}>
        <Pressable style={st.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={st.topTitle}>Manage Trips</Text>
        <Pressable style={st.refreshBtn} onPress={() => { setRefreshing(true); load(true); }}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={st.loadingText}>Loading trips…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id || item.id || Math.random())}
          renderItem={({ item }) => (
            <TripCard item={item} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={st.center}>
              <Ionicons name="map-outline" size={48} color={colors.border} />
              <Text style={st.emptyText}>{search || filter !== 'All' ? 'No matching trips' : 'No trips yet'}</Text>
            </View>
          }
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '14', alignItems: 'center', justifyContent: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  loadingText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },

  headerWrap: { gap: 10, marginBottom: 6 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, borderTopWidth: 3, alignItems: 'center', padding: 10, gap: 4 },
  statIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '600' },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipText: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.danger + '12', padding: 10, borderRadius: 10 },
  errorBannerText: { fontSize: 12, fontWeight: '700', color: colors.danger, flex: 1 },

  resultCount: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  // Trip Card
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: colors.textPrimary },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDist: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, flex: 1 },
  cardProv: { fontSize: 11, fontWeight: '700', color: colors.white, backgroundColor: colors.primary + 'CC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  cardMetaText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  cardBudget: { fontSize: 13, fontWeight: '900', color: colors.primary },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  btnView: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary + '12', paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '33' },
  btnViewText: { fontSize: 12, fontWeight: '900', color: colors.primary },
  btnEdit: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, paddingVertical: 8, borderRadius: 10 },
  btnEditText: { fontSize: 12, fontWeight: '900', color: colors.white },
  btnDelete: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.danger + '12', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.danger + '33' },

  // Status badge
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusBadgeText: { fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
});

export default AdminTripsScreen;
