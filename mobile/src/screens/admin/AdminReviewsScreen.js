import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import colors from '../../constants/colors';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import { getReviewsApi, updateReviewStatusApi, respondToReviewApi, deleteReviewApi } from '../../api/reviewApi';
import { getApiErrorMessage } from '../../utils/apiError';

/* ── UI Components ── */

const StatCard = ({ label, value, color, icon }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '12' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const FilterChip = ({ label, icon, active, onPress, emoji }) => (
  <Pressable 
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
  >
    {emoji ? <Text style={styles.chipEmoji}>{emoji}</Text> : null}
    {icon ? <Ionicons name={icon} size={14} color={active ? colors.white : colors.textSecondary} style={styles.chipIcon} /> : null}
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

const AdminReviewsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [activeTab, setActiveTab] = useState('moderation'); // 'moderation', 'flagged', 'history'
  const [targetType, setTargetType] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modal State
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');
      const res = await getReviewsApi({ limit: 1000 });
      setReviews(res?.data?.reviews || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Platform sync failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    flagged: reviews.filter(r => r.status === 'flagged' || r.isReported).length,
    approved: reviews.filter(r => r.status === 'approved').length,
    avg: reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0'
  }), [reviews]);

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      let matchesTab = false;
      if (activeTab === 'moderation') matchesTab = r.status === 'pending';
      else if (activeTab === 'flagged') matchesTab = r.status === 'flagged' || r.isReported;
      else matchesTab = r.status === 'approved' || r.status === 'rejected';

      const matchesTarget = targetType === 'all' || r.targetType === targetType;
      const matchesRating = ratingFilter === 'all' || r.rating === ratingFilter;
      
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || 
        (r.targetName || '').toLowerCase().includes(q) ||
        (r.userId?.fullName || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q);
        
      return matchesTab && matchesTarget && matchesRating && matchesSearch;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reviews, activeTab, targetType, ratingFilter, search]);

  const handleStatus = async (id, status) => {
    try {
      await updateReviewStatusApi(id, status);
      setReviews(prev => prev.map(r => r._id === id ? { ...r, status, isReported: status === 'approved' ? false : r.isReported, reportCount: status === 'approved' ? 0 : r.reportCount } : r));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Action failed'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReviewApi(id);
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Removal failed'));
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intelligence Dashboard</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Pending" value={stats.pending} icon="time-outline" color={colors.warning} />
          <StatCard label="Reported" value={stats.flagged} icon="flag-outline" color={colors.danger} />
          <StatCard label="Avg Rating" value={stats.avg} icon="star-outline" color={colors.primary} />
          <StatCard label="Total Items" value={stats.total} icon="list-outline" color={colors.textSecondary} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced Filters</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput placeholder="Search records..." style={styles.searchInput} value={search} onChangeText={setSearch} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterChip label="All Resources" active={targetType === 'all'} onPress={() => setTargetType('all')} emoji="🌍" />
          <FilterChip label="Hotels" active={targetType === 'hotel'} onPress={() => setTargetType('hotel')} emoji="🏨" />
          <FilterChip label="Places" active={targetType === 'place'} onPress={() => setTargetType('place')} emoji="📍" />
          <View style={styles.filterSep} />
          <FilterChip label="All Ratings" active={ratingFilter === 'all'} onPress={() => setRatingFilter('all')} icon="star" />
          {[5, 4, 3, 2, 1].map(r => (
            <FilterChip key={r} label={`${r} Star`} active={ratingFilter === r} onPress={() => setRatingFilter(r)} icon="star" />
          ))}
        </ScrollView>

        <View style={styles.tabContainer}>
          <Pressable style={[styles.tab, activeTab === 'moderation' && styles.tabActive]} onPress={() => setActiveTab('moderation')}>
            <Text style={[styles.tabText, activeTab === 'moderation' && styles.tabTextActive]}>Queue</Text>
            {stats.pending > 0 && <View style={styles.dot} />}
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'flagged' && styles.tabActive]} onPress={() => setActiveTab('flagged')}>
            <Text style={[styles.tabText, activeTab === 'flagged' && styles.tabTextActive]}>Reported</Text>
            {stats.flagged > 0 && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={[styles.ledgerRow, item.isReported && styles.ledgerRowFlagged]}>
      <View style={styles.ledgerHeader}>
        <View style={styles.userBox}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{item.userId?.fullName?.charAt(0) || '?'}</Text></View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.userName}>{item.userId?.fullName || 'Traveler'}</Text>
              {item.isReported && <Ionicons name="flag" size={12} color={colors.danger} />}
            </View>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'approved' ? colors.success + '12' : colors.warning + '12' }]}>
          <Text style={[styles.statusText, { color: item.status === 'approved' ? colors.success : colors.warning }]}>
            {item.isReported ? `REPORTED (${item.reportCount})` : item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.targetRow}>
        <Ionicons name={item.targetType === 'hotel' ? 'bed' : 'location'} size={14} color={colors.primary} />
        <Text style={styles.targetName} numberOfLines={1}>{item.targetName}</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color={colors.warning} />
          <Text style={styles.ratingText}>{item.rating}.0</Text>
        </View>
      </View>

      <Text style={styles.commentText} numberOfLines={3}>{item.comment}</Text>

      {item.adminResponse && (
        <View style={styles.adminReply}>
          <Text style={styles.replyLabel}>GENIE RESPONSE:</Text>
          <Text style={styles.replyText}>{item.adminResponse}</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        {item.status !== 'approved' ? (
          <Pressable style={[styles.btn, styles.btnVerify]} onPress={() => handleStatus(item._id, 'approved')}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
            <Text style={styles.btnLabel}>Approve</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.btn, styles.btnReject]} onPress={() => handleStatus(item._id, 'pending')}>
            <Ionicons name="close" size={16} color={colors.white} />
            <Text style={styles.btnLabel}>Reject</Text>
          </Pressable>
        )}

        <Pressable style={[styles.btn, styles.btnReply]} onPress={() => { setSelectedReview(item); setAdminResponse(item.adminResponse || ''); setShowResponseModal(true); }}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textPrimary} />
          <Text style={[styles.btnLabel, { color: colors.textPrimary }]}>Reply</Text>
        </Pressable>

        <Pressable style={styles.btnTrash} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Review Moderation</Text>
        <Pressable onPress={() => load(true)} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <EmptyState title="All Reviewed" subtitle="No matching records found." icon="checkmark-circle" />}
      />

      <Modal visible={showResponseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Official Response</Text>
            <Text style={styles.modalSub}>Replying to {selectedReview?.userId?.fullName}</Text>
            <TextInput style={styles.modalInput} placeholder="Enter official Genie reply..." multiline value={adminResponse} onChangeText={setAdminResponse} />
            <View style={styles.modalActions}>
              <AppButton title="Cancel" variant="outline" onPress={() => setShowResponseModal(false)} style={{ flex: 1, marginRight: 10 }} />
              <AppButton title="Publish" onPress={async () => { setSubmittingResponse(true); try { await respondToReviewApi(selectedReview._id, adminResponse); setShowResponseModal(false); load(true); } finally { setSubmittingResponse(false); } }} loading={submittingResponse} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  
  list: { paddingBottom: 40 },
  headerContent: { paddingHorizontal: 16 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48.5%', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, gap: 10 },
  statIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: -2 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: colors.textPrimary },

  filterScroll: { paddingVertical: 5, gap: 10, paddingBottom: 15 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipEmoji: { fontSize: 14, marginRight: 6 },
  chipIcon: { marginRight: 6 },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  filterSep: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 5 },

  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, gap: 20 },
  tab: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },

  ledgerRow: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginTop: 15, padding: 16, marginHorizontal: 16 },
  ledgerRowFlagged: { borderColor: colors.danger + '40', backgroundColor: colors.danger + '05' },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  userName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  dateText: { fontSize: 11, color: colors.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '900' },

  targetRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  targetName: { fontSize: 13, fontWeight: '800', color: colors.primary, flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '900', color: colors.textPrimary },

  commentText: { fontSize: 14, color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  adminReply: { marginTop: 12, padding: 10, backgroundColor: colors.surface2, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.primary },
  replyLabel: { fontSize: 9, fontWeight: '900', color: colors.primary, marginBottom: 2 },
  replyText: { fontSize: 13, color: colors.textPrimary, fontStyle: 'italic' },

  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 15, paddingTop: 15, gap: 10 },
  btn: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 8 },
  btnVerify: { backgroundColor: colors.success },
  btnReject: { backgroundColor: colors.danger },
  btnReply: { backgroundColor: colors.surface2 },
  btnLabel: { fontSize: 12, fontWeight: '800', color: colors.white },
  btnTrash: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.danger + '10', alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  modalSub: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  modalInput: { backgroundColor: colors.surface2, borderRadius: 12, padding: 15, height: 120, fontSize: 15, color: colors.textPrimary, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row' }
});

export default AdminReviewsScreen;
