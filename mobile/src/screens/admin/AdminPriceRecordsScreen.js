import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ScrollView,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../../constants/colors';
import {
  getAdminPriceRecordsApi,
  deleteAdminPriceRecordApi,
  updateAdminPriceRecordApi
} from '../../api/adminExpenseApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency, DISPLAY_CURRENCIES, convertAmt } from '../../utils/currencyFormat';

const AdminPriceRecordsScreen = ({ navigation }) => {
  const [displayCurrency, setDisplayCurrency] = useState('LKR');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [records, setRecords] = useState([]);

  // Edit Form State
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', activity_name: '' });

  const loadData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      setError('');
      const res = await getAdminPriceRecordsApi({ limit: 1000 });
      setRecords(res?.data?.records || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load price records'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const nameMatch = (r.activity_name || r.place?.name || '').toLowerCase().includes(search.toLowerCase());
      const districtMatch = (r.place?.district || '').toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || r.item_type === filterType;
      return (nameMatch || districtMatch) && matchType;
    });
  }, [records, search, filterType]);

  const stats = useMemo(() => {
    const total = records.length;
    const hotels = records.filter(r => r.item_type === 'hotel');
    const hotelAvg = hotels.length > 0 ? hotels.reduce((s, r) => s + r.price, 0) / hotels.length : 0;
    
    const activities = records.filter(r => r.item_type === 'activity');
    const actAvg = activities.length > 0 ? activities.reduce((s, r) => s + r.price, 0) / activities.length : 0;

    return { total, hotelAvg, actAvg, activityCount: activities.length };
  }, [records]);

  const handleDelete = async (id) => {
    Alert.alert('Purge Record', 'This data will be permanently removed from platform benchmarks.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Purge', style: 'destructive', onPress: async () => {
        try {
          await deleteAdminPriceRecordApi(id);
          setRecords(prev => prev.filter(r => r._id !== id));
        } catch (err) {
          Alert.alert('Error', 'Deletion failed');
        }
      }}
    ]);
  };

  const handleEdit = (r) => {
    setEditingId(r._id);
    setEditForm({
      price: String(r.price),
      activity_name: r.activity_name || r.place?.name || ''
    });
    setShowEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.price) return Alert.alert('Error', 'Price is required');
    try {
      await updateAdminPriceRecordApi(editingId, {
        price: parseFloat(editForm.price),
        activity_name: editForm.activity_name
      });
      setShowEditForm(false);
      loadData();
    } catch (err) {
      Alert.alert('Error', 'Update failed');
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Analytics Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.statGradient} />
          <View style={[styles.statIconBox, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="stats-chart" size={16} color={colors.primary} />
          </View>
          <Text style={styles.statLabel}>Total Intel</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statNote}>Active Benchmarks</Text>
        </View>

        <View style={styles.statCard}>
          <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.statGradient} />
          <View style={[styles.statIconBox, { backgroundColor: '#4F46E515' }]}>
            <Ionicons name="bed" size={16} color="#4F46E5" />
          </View>
          <Text style={styles.statLabel}>Avg Hotel</Text>
          <Text style={[styles.statValue, { color: '#4F46E5' }]}>
            {formatCurrency(convertAmt(stats.hotelAvg, 'LKR', displayCurrency), displayCurrency)}
          </Text>
          <Text style={styles.statNote}>Across SL Market</Text>
        </View>
      </View>

      {/* Filter Ledger Chips */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionLabel}>DATA TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'all', label: 'All Records', icon: 'layers' },
            { id: 'hotel', label: 'Hotels', icon: 'bed' },
            { id: 'transport', label: 'Transport', icon: 'bus' },
            { id: 'activity', label: 'Activities', icon: 'ticket' }
          ].map(type => (
            <Pressable 
              key={type.id} 
              style={[styles.filterChip, filterType === type.id && styles.filterChipActive]}
              onPress={() => setFilterType(type.id)}
            >
              <Ionicons 
                name={type.icon} 
                size={14} 
                color={filterType === type.id ? colors.white : colors.textMuted} 
              />
              <Text style={[styles.filterText, filterType === type.id && styles.filterTextActive]}>
                {type.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>MARKET LEDGER</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* High-Fidelity Nav */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.navTitle}>Market Explorer</Text>
            <Text style={styles.navSub}>Admin Financial Ledger</Text>
          </View>
        </View>
        
        <View style={styles.currencyToggle}>
          {DISPLAY_CURRENCIES.map(c => (
            <Pressable 
              key={c.code} 
              style={[styles.currBtn, displayCurrency === c.code && styles.currBtnActive]} 
              onPress={() => setDisplayCurrency(c.code)}
            >
              <Text style={[styles.currBtnText, displayCurrency === c.code && styles.currBtnTextActive]}>{c.code}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Premium Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search names, districts or types..." 
            placeholderTextColor={colors.textMuted}
            value={search} 
            onChangeText={setSearch} 
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Syncing Price Intelligence...</Text>
        </View>
      ) : (
        <FlatList
          ListHeaderComponent={renderHeader}
          data={filteredRecords}
          keyExtractor={item => item._id}
          renderItem={({ item: r }) => (
            <View style={styles.ledgerRow}>
              <View style={[styles.ledgerIconBox, { backgroundColor: (r.item_type === 'hotel' ? '#4F46E5' : r.item_type === 'transport' ? '#10B981' : '#F59E0B') + '12' }]}>
                <Ionicons 
                  name={r.item_type === 'hotel' ? 'bed' : r.item_type === 'transport' ? 'bus' : 'flash'} 
                  size={20} 
                  color={r.item_type === 'hotel' ? '#4F46E5' : r.item_type === 'transport' ? '#10B981' : '#F59E0B'} 
                />
              </View>
              
              <View style={styles.ledgerInfo}>
                <Text style={styles.ledgerName} numberOfLines={1}>
                  {r.activity_name || r.place?.name || 'Standard Entry'}
                </Text>
                <View style={styles.ledgerMetaRow}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.ledgerMetaText}>
                    {r.place?.district || 'General'} · {new Date(r.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>

              <View style={styles.ledgerPriceBox}>
                <Text style={styles.ledgerPrice}>
                  {formatCurrency(convertAmt(r.price, 'LKR', displayCurrency), displayCurrency)}
                </Text>
                <View style={[styles.typeBadge, { backgroundColor: (r.item_type === 'hotel' ? '#4F46E5' : r.item_type === 'transport' ? '#10B981' : '#F59E0B') + '15' }]}>
                  <Text style={[styles.typeBadgeText, { color: r.item_type === 'hotel' ? '#4F46E5' : r.item_type === 'transport' ? '#10B981' : '#F59E0B' }]}>
                    {r.item_type.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable style={styles.ledgerDelete} onPress={() => handleEdit(r)}>
                  <Ionicons name="pencil-outline" size={20} color={colors.primary + '80'} />
                </Pressable>
                <Pressable style={styles.ledgerDelete} onPress={() => handleDelete(r._id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger + '80'} />
                </Pressable>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); loadData(); }} 
              tintColor={colors.primary} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>No records match your criteria</Text>
            </View>
          }
        />
      )}

      {/* Quick Edit Modal */}
      <Modal visible={showEditForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Quick Edit Benchmark</Text>
                <Text style={styles.modalSub}>Update price or name for this intel record</Text>
              </View>
              <Pressable onPress={() => setShowEditForm(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>RECORD NAME</Text>
              <View style={styles.searchBox}>
                <Ionicons name="pencil" size={18} color={colors.textMuted} />
                <TextInput 
                  style={styles.searchInput}
                  value={editForm.activity_name}
                  onChangeText={v => setEditForm(f => ({ ...f, activity_name: v }))}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>BENCHMARK PRICE (LKR)</Text>
              <View style={styles.searchBox}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary }}>Rs</Text>
                <TextInput 
                  style={styles.searchInput}
                  keyboardType="numeric"
                  value={editForm.price}
                  onChangeText={v => setEditForm(f => ({ ...f, price: v }))}
                />
              </View>
            </View>

            <Pressable style={styles.publishBtn} onPress={handleSaveEdit}>
              <Text style={styles.publishBtnText}>Update Benchmark</Text>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  
  // Nav
  topNav: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  navSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  
  currencyToggle: { flexDirection: 'row', backgroundColor: colors.surface2, padding: 3, borderRadius: 10 },
  currBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  currBtnActive: { backgroundColor: colors.primary, elevation: 2 },
  currBtnText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  currBtnTextActive: { color: colors.white },

  // Search
  searchContainer: { padding: 20, backgroundColor: colors.surface },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface2, 
    paddingHorizontal: 15, 
    borderRadius: 16, 
    height: 54, 
    borderWidth: 1, 
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: colors.textPrimary, fontWeight: '600' },

  headerContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  // Stats
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: { flex: 1, padding: 18, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  statGradient: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  statIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginVertical: 4 },
  statNote: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  // Filters
  filterSection: { marginBottom: 15 },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 12 },
  filterScroll: { paddingRight: 20, gap: 10 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 8 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  filterTextActive: { color: colors.white },

  // Ledger List
  listContent: { paddingBottom: 50 },
  ledgerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    padding: 16, 
    marginHorizontal: 20,
    borderRadius: 20, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  ledgerIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ledgerInfo: { flex: 1, marginLeft: 15 },
  ledgerName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  ledgerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ledgerMetaText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  
  ledgerPriceBox: { alignItems: 'flex-end', marginRight: 15 },
  ledgerPrice: { fontSize: 17, fontWeight: '900', color: colors.textPrimary },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  typeBadgeText: { fontSize: 9, fontWeight: '900' },
  ledgerDelete: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Misc
  loadingBox: { marginTop: 60, alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  emptyBox: { marginTop: 60, alignItems: 'center' },
  emptyText: { marginTop: 15, fontSize: 15, color: colors.textMuted, fontWeight: '700' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  modalSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  formSection: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  publishBtn: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  publishBtnText: { color: colors.white, fontSize: 16, fontWeight: '900' },
});

export default AdminPriceRecordsScreen;
