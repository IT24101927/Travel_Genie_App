import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import colors from '../../constants/colors';
import {
  getAdminAllExpensesApi,
  getAdminPriceRecordsApi,
  createAdminPriceRecordApi,
  deleteAdminPriceRecordApi,
  updateAdminPriceRecordApi,
  getAdminTripsBudgetHealthApi,
  getAdminAlertHistoryApi,
  sendBudgetAlertApi,
} from '../../api/adminExpenseApi';
import { getDistrictsApi } from '../../api/districtApi';
import { getPlacesApi } from '../../api/placeApi';
import { getHotelsApi } from '../../api/hotelApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency, DISPLAY_CURRENCIES, convertAmt } from '../../utils/currencyFormat';

/* ── UI Components ────────────────────────────────────────── */

const CircularProgress = ({ pct, size = 65, strokeWidth = 6, color = colors.primary }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference;
  
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border + '50'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: colors.textPrimary }}>{Math.round(pct)}%</Text>
      </View>
    </View>
  );
};

const StatCard = ({ label, value, color, icon, note }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    {note ? <Text style={styles.statNote}>{note}</Text> : null}
  </View>
);

/* ── Main Screen ─────────────────────────────────────────── */

const CATEGORIES = [
  { id: 'accommodation',  label: 'Accommodation', icon: 'bed',      color: '#0E7C5F' },
  { id: 'transportation', label: 'Transport',     icon: 'bus',      color: '#3b82f6' },
  { id: 'food',           label: 'Food & Drink',  icon: 'restaurant', color: '#f59e0b' },
  { id: 'activities',     label: 'Activities',    icon: 'ticket',     color: '#8b5cf6' },
  { id: 'shopping',       label: 'Shopping',      icon: 'cart',       color: '#ec4899' },
  { id: 'entertainment',  label: 'Entertainment', icon: 'musical-notes', color: '#06b6d4' },
  { id: 'emergency',      label: 'Emergency',     icon: 'alert-circle', color: '#ef4444' },
  { id: 'other',          label: 'Other',         icon: 'ellipsis-horizontal', color: '#6b7280' },
];

const AdminExpensesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [displayCurrency, setDisplayCurrency] = useState('LKR');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [priceRecords, setPriceRecords] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [districtSearch, setDistrictSearch] = useState('');
  const [hotels, setHotels] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Price Record Form
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [placeSearch, setPlaceSearch] = useState('');
  const [prForm, setPrForm] = useState({ 
    district_id: '', 
    place_id: '', 
    item_type: 'hotel', 
    price: '', 
    activity_name: '', 
    category: 'other' 
  });
  const scrollRef = React.useRef(null);

  const loadAll = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      setError('');
      const [expRes, tripRes, prRes, alertRes, placeRes, distRes, hotelRes] = await Promise.all([
        getAdminAllExpensesApi({ limit: 5000 }),
        getAdminTripsBudgetHealthApi(),
        getAdminPriceRecordsApi({ limit: 100 }),
        getAdminAlertHistoryApi(),
        getPlacesApi({ limit: 1000 }),
        getDistrictsApi(),
        getHotelsApi({ limit: 2000 })
      ]);

      setExpenses(expRes?.data?.expenses || []);
      setTrips(tripRes?.data?.trips || []);
      setPriceRecords(prRes?.data?.records || []);
      setAlertHistory(alertRes?.data?.alerts || []);
      setPlaces(placeRes?.data?.places || []);
      setDistricts(distRes?.data || []);
      setHotels(hotelRes?.data?.hotels || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to sync platform analytics'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  // ── Aggregations ──
  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + convertAmt(e.amount, e.currency || 'LKR', displayCurrency), 0);
    const actual = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + convertAmt(e.amount, e.currency || 'LKR', displayCurrency), 0);
    const estimated = total - actual;
    return { count: expenses.length, total, actual, estimated };
  }, [expenses, displayCurrency]);

  const marketStats = useMemo(() => {
    const categories = [
      { id: 'hotel', label: 'Accommodation', icon: 'bed', color: '#4F46E5' },
      { id: 'transport', label: 'Transit/Fuel', icon: 'bus', color: '#10B981' },
      { id: 'activity', label: 'Activities', icon: 'ticket', color: '#F59E0B' }
    ];
    return categories.map(cat => {
      const recs = priceRecords.filter(r => r.item_type === cat.id);
      const avg = recs.length > 0 ? recs.reduce((s, r) => s + r.price, 0) / recs.length : 0;
      return { ...cat, avg, count: recs.length };
    });
  }, [priceRecords]);

  const catBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += convertAmt(e.amount, e.currency || 'LKR', displayCurrency);
      map[cat].count++;
    });
    return map;
  }, [expenses, displayCurrency]);

  const tripHealth = useMemo(() => {
    return trips.map(t => {
      const budgetLkr = convertAmt(t.budget || 0, t.currency || 'LKR', 'LKR');
      // Find actual expenses for this trip
      const usedLkr = expenses
        .filter(e => String(e.tripId?._id || e.tripId) === String(t._id) && e.status === 'paid')
        .reduce((s, e) => s + convertAmt(e.amount, e.currency || 'LKR', 'LKR'), 0);
      
      const pct = budgetLkr > 0 ? (usedLkr / budgetLkr) * 100 : 0;
      return { ...t, usedLkr, budgetLkr, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [trips, expenses]);

  const handleDeletePr = (id) => {
    Alert.alert('Delete Record', 'This price record will be removed from trend calculations.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteAdminPriceRecordApi(id);
          setPriceRecords(prev => prev.filter(r => r._id !== id));
        } catch {}
      }}
    ]);
  };

  const handleEditPr = (r) => {
    setEditingId(r._id);
    setPrForm({
      district_id: r.place?.district_id || '',
      place_id: String(r.place_id || ''),
      item_type: r.item_type,
      price: String(r.price),
      activity_name: r.activity_name || '',
      category: r.category || 'other'
    });
    setPlaceSearch(r.activity_name || r.place?.name || '');
    setShowPriceForm(true);
  };

  const handleSavePr = async () => {
    if (prForm.item_type === 'activity' && !prForm.activity_name) {
      Alert.alert('Error', 'Please enter activity name');
      return;
    }
    if (prForm.item_type !== 'activity' && !prForm.place_id) {
      Alert.alert('Error', 'Please select a specific location/hotel'); 
      return; 
    }
    if (!prForm.price) { 
      Alert.alert('Error', 'Please enter a price'); 
      return; 
    }

    try {
      const payload = {
        place_id: prForm.place_id ? parseInt(prForm.place_id) : undefined,
        item_type: prForm.item_type,
        price: parseFloat(prForm.price),
        activity_name: prForm.activity_name,
        category: prForm.category
      };

      if (editingId) {
        await updateAdminPriceRecordApi(editingId, payload);
      } else {
        await createAdminPriceRecordApi(payload);
      }

      setShowPriceForm(false);
      setEditingId(null);
      setPrForm({ district_id: '', place_id: '', item_type: 'hotel', price: '', activity_name: '', category: 'other' });
      setPlaceSearch('');
      setDistrictSearch('');
      loadAll();
    } catch (err) { Alert.alert('Error', editingId ? 'Failed to update' : 'Failed to save'); }
  };

  const handleSendAlert = async (trip) => {
    const defaultMsg = `Budget Alert: You have used ${Math.round(trip.pct)}% of your planned budget for "${trip.title}". Please review your expenses.`;
    
    Alert.prompt(
      'Send Budget Alert',
      `Target: ${trip.userId?.fullName}\n\nCustomize your message:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Now', 
          onPress: async (msg) => {
            try {
              await sendBudgetAlertApi({
                userId: trip.userId?._id || trip.userId,
                tripId: trip._id,
                type: 'BUDGET_100',
                message: msg?.trim() || defaultMsg
              });
              Alert.alert('Success', 'Alert sent to traveler');
              loadAll();
            } catch (err) {
              Alert.alert('Error', 'Failed to send notification');
            }
          }
        }
      ],
      'plain-text',
      defaultMsg
    );
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Synchronizing Platform Analytics...</Text>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={colors.primary} />}
      >
        {/* ── Overview Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Platform Spending Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Records" value={stats.count} icon="list" color={colors.primary} />
            <StatCard 
              label="Total Volume" 
              value={formatCurrency(stats.total, displayCurrency)} 
              icon="wallet" color={colors.primaryDark} 
              note={displayCurrency}
            />
            <StatCard 
              label="Actual Paid" 
              value={formatCurrency(stats.actual, displayCurrency)} 
              icon="checkmark-circle" color={colors.success} 
              note={`${stats.total > 0 ? ((stats.actual / stats.total) * 100).toFixed(1) : 0}% of total`}
            />
            <StatCard 
              label="Estimated" 
              value={formatCurrency(stats.estimated, displayCurrency)} 
              icon="time" color={colors.warning} 
            />
          </View>

          <View style={styles.progressBox}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Paid vs Total Budget</Text>
              <Text style={styles.progressValue}>{stats.total > 0 ? ((stats.actual / stats.total) * 100).toFixed(1) : 0}%</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient 
                colors={[colors.primary, '#10b981']} 
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(100, (stats.actual / (stats.total || 1)) * 100)}%` }]}
              />
            </View>
          </View>
        </View>

        {/* ── Category Breakdown ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Category Breakdown</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {CATEGORIES.map(c => {
              const data = catBreakdown[c.id];
              if (!data) return null;
              return (
                <View key={c.id} style={styles.catCard}>
                  <View style={[styles.catIconBox, { backgroundColor: c.color + '15' }]}>
                    <Ionicons name={c.icon} size={18} color={c.color} />
                  </View>
                  <Text style={styles.catLabel}>{c.label}</Text>
                  <Text style={styles.catValue}>{formatCurrency(data.total, displayCurrency)}</Text>
                  <Text style={styles.catCount}>{data.count} entries</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Trip Health ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Trip Budget Health</Text>
          <Text style={styles.sectionSub}>Monitoring real-time spend vs user-defined limits</Text>
          
          {tripHealth.slice(0, 4).map(t => (
            <View key={t._id} style={[styles.tripCard, t.pct >= 100 && styles.tripCardOver]}>
              <View style={styles.tripCardLeft}>
                <CircularProgress 
                  size={48} 
                  strokeWidth={4} 
                  pct={t.pct} 
                  color={t.pct >= 100 ? colors.danger : t.pct >= 85 ? colors.warning : colors.success} 
                />
                <View style={styles.tripInfo}>
                  <Text style={styles.tripTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.tripUser}>{t.userId?.fullName || 'Traveler'}</Text>
                </View>
              </View>
              
              <View style={styles.tripCardRight}>
                <View style={styles.spendInfo}>
                  <Text style={styles.tripUsed}>
                    {formatCurrency(convertAmt(t.usedLkr, 'LKR', displayCurrency), displayCurrency)}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: (t.pct >= 100 ? colors.danger : t.pct >= 85 ? colors.warning : colors.success) + '15' }]}>
                    <Text style={[styles.statusPillText, { color: t.pct >= 100 ? colors.danger : t.pct >= 85 ? colors.warning : colors.success }]}>
                      {t.pct >= 100 ? 'CRITICAL' : t.pct >= 85 ? 'WARNING' : 'HEALTHY'}
                    </Text>
                  </View>
                </View>
                
                {t.pct >= 100 && (
                  <Pressable style={styles.alertActionBtn} onPress={() => handleSendAlert(t)}>
                    <Ionicons name="notifications" size={14} color={colors.white} />
                    <Text style={styles.alertActionText}>Alert</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
          <Pressable 
            style={styles.viewMoreBtn} 
            onPress={() => navigation.navigate('AdminTripHealth')}
          >
            <Text style={styles.viewMoreText}>See all trip insights →</Text>
          </Pressable>
        </View>

        {/* ── Market Intelligence Redesign ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>📉 Market Intelligence</Text>
              <Text style={styles.sectionSub}>Live price benchmarks across Sri Lanka</Text>
            </View>
            <Pressable style={styles.addPrBtn} onPress={() => setShowPriceForm(true)}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addPrText}>New Entry</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {marketStats.map(stat => (
              <View key={stat.id} style={styles.catCard}>
                <View style={[styles.catIconBox, { backgroundColor: stat.color + '15' }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                <Text style={styles.catLabel}>{stat.label}</Text>
                <Text style={styles.catValue}>
                  {formatCurrency(convertAmt(stat.avg, 'LKR', displayCurrency), displayCurrency)}
                </Text>
                <Text style={styles.catCount}>{stat.count} records tracked</Text>
              </View>
            ))}
          </ScrollView>

          <View style={{ marginTop: 25 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Recent Market Benchmarks</Text>
            </View>
            
            {priceRecords.slice(0, 3).map(r => (
              <View key={r._id} style={styles.ledgerRowMini}>
                <View style={[styles.ledgerIconBoxMini, { backgroundColor: (r.item_type === 'hotel' ? '#4F46E5' : r.item_type === 'transport' ? '#10B981' : '#F59E0B') + '12' }]}>
                  <Ionicons 
                    name={r.item_type === 'hotel' ? 'bed' : r.item_type === 'transport' ? 'bus' : 'flash'} 
                    size={16} 
                    color={r.item_type === 'hotel' ? '#4F46E5' : r.item_type === 'transport' ? '#10B981' : '#F59E0B'} 
                  />
                </View>
                
                <View style={styles.ledgerInfoMini}>
                  <Text style={styles.ledgerNameMini} numberOfLines={1}>
                    {r.activity_name || r.place?.name || 'Standard Entry'}
                  </Text>
                  <Text style={styles.ledgerMetaMini}>
                    {r.place?.district || 'General'} · {new Date(r.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                <View style={styles.ledgerPriceBoxMini}>
                  <Text style={styles.ledgerPriceMini}>
                    {formatCurrency(convertAmt(r.price, 'LKR', displayCurrency), displayCurrency)}
                  </Text>
                  <View style={[styles.typeBadgeMini, { backgroundColor: (r.item_type === 'hotel' ? '#4F46E5' : r.item_type === 'transport' ? '#10B981' : '#F59E0B') + '15' }]}>
                    <Text style={[styles.typeBadgeTextMini, { color: r.item_type === 'hotel' ? '#4F46E5' : r.item_type === 'transport' ? '#10B981' : '#F59E0B' }]}>
                      {r.item_type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable style={styles.ledgerDeleteMini} onPress={() => handleEditPr(r)}>
                    <Ionicons name="pencil-outline" size={16} color={colors.primary + '80'} />
                  </Pressable>
                  <Pressable style={styles.ledgerDeleteMini} onPress={() => handleDeletePr(r._id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger + '80'} />
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable 
              style={styles.viewMoreBtn} 
              onPress={() => navigation.navigate('AdminPriceRecords')}
            >
              <Text style={styles.viewMoreText}>Explore all market data →</Text>
            </Pressable>
          </View>
        </View>


      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Premium Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable style={styles.headerActionBtn} onPress={() => navigation.navigate('AdminAlerts')}>
              <Ionicons name="notifications" size={20} color={colors.warning} />
              {alertHistory.length > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{alertHistory.length}</Text></View>
              )}
            </Pressable>
            <View style={styles.currencyToggle}>
              {DISPLAY_CURRENCIES.map(c => (
                <Pressable key={c.code} style={[styles.currBtn, displayCurrency === c.code && styles.currBtnActive]} onPress={() => setDisplayCurrency(c.code)}>
                  <Text style={[styles.currBtnText, displayCurrency === c.code && styles.currBtnTextActive]}>{c.code}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <Text style={styles.headerTitle}>Platform Intelligence</Text>
        <Text style={styles.headerSub}>Manage market costs and trip health analytics</Text>
      </View>

      {renderContent()}

      <Modal visible={showPriceForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 25) }]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Intel Entry' : 'Market Intel Entry'}</Text>
                <Text style={styles.modalSub}>{editingId ? 'Updating existing platform benchmark' : 'Updating user-side budget trends'}</Text>
              </View>
              <Pressable 
                onPress={() => {
                  setShowPriceForm(false);
                  setEditingId(null);
                  setPrForm({ district_id: '', place_id: '', item_type: 'hotel', price: '', activity_name: '', category: 'other' });
                  setPlaceSearch('');
                }} 
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView 
              style={styles.modalScroll} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              {/* Mini-Flow Progress Indicator */}
              <View style={styles.flowRow}>
                <View style={styles.flowStep}>
                  <View style={styles.flowIcon}><Ionicons name="options" size={14} color={colors.primary} /></View>
                  <Text style={styles.flowText}>Type</Text>
                </View>
                <Ionicons name="arrow-forward" size={12} color={colors.border} />
                <View style={styles.flowStep}>
                  <View style={styles.flowIcon}><Ionicons name={prForm.item_type === 'activity' ? 'pencil' : 'location'} size={14} color={colors.primary} /></View>
                  <Text style={styles.flowText}>{prForm.item_type === 'activity' ? 'Detail' : 'Place'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={12} color={colors.border} />
                <View style={styles.flowStep}>
                  <View style={styles.flowIcon}><Ionicons name="cash" size={14} color={colors.primary} /></View>
                  <Text style={styles.flowText}>Price</Text>
                </View>
              </View>

              {/* 1. Category Selection */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>1. SELECT CATEGORY</Text>
                <View style={styles.typeGrid}>
                  {[
                    { id: 'hotel', label: 'Hotel', icon: 'bed' },
                    { id: 'transport', label: 'Transport', icon: 'bus' },
                    { id: 'activity', label: 'Activity', icon: 'ticket' }
                  ].map(t => (
                    <Pressable 
                      key={t.id} 
                      style={[styles.typeChip, prForm.item_type === t.id && styles.typeChipActive]}
                      onPress={() => {
                        setPrForm(f => ({ ...f, item_type: t.id, district_id: '', place_id: '', activity_name: '', category: 'other' }));
                        setPlaceSearch('');
                      }}
                    >
                      <Ionicons name={t.icon} size={20} color={prForm.item_type === t.id ? colors.white : colors.textMuted} />
                      <Text style={[styles.typeChipText, prForm.item_type === t.id && { color: colors.white }]}>{t.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 3. Hotel/Location Search (Hidden for Activity) */}
              {prForm.item_type !== 'activity' && (
                <View style={[styles.formSection, { zIndex: 1000 }]}>
                  <Text style={styles.inputLabel}>
                    {prForm.item_type === 'hotel' ? '3. SEARCH HOTEL' : '2. SEARCH LOCATION'}
                  </Text>
                  
                  {/* For Hotels, only enable search if district is selected */}
                  <View style={[styles.searchWrapper, prForm.item_type === 'hotel' && !prForm.district_id && { opacity: 0.5, backgroundColor: colors.surface2 }]}>
                    <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
                    <TextInput 
                      style={styles.formInput} 
                      placeholder={
                        prForm.item_type === 'hotel' 
                          ? "Search hotels across Sri Lanka..." 
                          : "Enter city/location name..."
                      }
                      value={placeSearch}
                      onChangeText={setPlaceSearch}
                    />
                    {placeSearch.length > 0 && (
                      <Pressable onPress={() => {setPlaceSearch(''); setPrForm(f=>({...f, place_id:''}))}} style={styles.clearSearch}>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                      </Pressable>
                    )}
                  </View>

                  {placeSearch.length > 0 && !prForm.place_id && (
                    <View style={[styles.floatingDropdown, { zIndex: 9999, elevation: 15 }]}>
                      {loadingHotels ? (
                        <View style={styles.dropdownItem}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.dropdownItemName, { marginLeft: 10, color: colors.textMuted }]}>Searching properties...</Text>
                        </View>
                      ) : (
                        <>
                          {(Array.isArray(prForm.item_type === 'hotel' ? hotels : places) ? (prForm.item_type === 'hotel' ? hotels : places) : [])
                            .filter(p => p.name.toLowerCase().includes(placeSearch.toLowerCase()))
                            .slice(0, 5)
                            .map(p => (
                              <Pressable 
                                key={p.place_id || p.hotel_id} 
                                style={styles.dropdownItem}
                                onPress={() => { 
                                  setPrForm(f => ({ ...f, place_id: String(p.place_id || p.hotel_id) })); 
                                  setPlaceSearch(p.name);
                                }}
                              >
                                <Ionicons name={prForm.item_type === 'hotel' ? 'bed' : 'location'} size={16} color={colors.primary} />
                                <View style={{ marginLeft: 10 }}>
                                  <Text style={styles.dropdownItemName}>{p.name}</Text>
                                  <Text style={styles.dropdownItemDist}>{p.district || districtSearch}</Text>
                                </View>
                              </Pressable>
                            ))}
                          {((Array.isArray(prForm.item_type === 'hotel' ? hotels : places) ? (prForm.item_type === 'hotel' ? hotels : places) : []).filter(p => p.name.toLowerCase().includes(placeSearch.toLowerCase())).length === 0) && (
                            <View style={styles.dropdownItem}>
                              <Text style={[styles.dropdownItemName, { color: colors.textMuted }]}>
                                {prForm.item_type === 'hotel' ? 'No hotels found in this district' : 'No locations found'}
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* 3. Activity Details (Only for Activity) */}
              {prForm.item_type === 'activity' && (
                <>
                  <View style={styles.formSection}>
                    <Text style={styles.inputLabel}>2. ACTIVITY CLASSIFICATION</Text>
                    <View style={styles.typeGrid}>
                      {[
                        { id: 'food', label: 'Food', icon: 'restaurant' },
                        { id: 'entertainment', label: 'Fun', icon: 'star' },
                        { id: 'shopping', label: 'Store', icon: 'cart' },
                        { id: 'amenity', label: 'Service', icon: 'construct' },
                        { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' }
                      ].map(cat => (
                        <Pressable 
                          key={cat.id} 
                          style={[styles.typeChip, prForm.category === cat.id && styles.typeChipActive, { width: '31%' }]}
                          onPress={() => setPrForm(f => ({ ...f, category: cat.id }))}
                        >
                          <Ionicons name={cat.icon} size={18} color={prForm.category === cat.id ? colors.white : colors.textMuted} />
                          <Text style={[styles.typeChipText, prForm.category === cat.id && { color: colors.white }]}>{cat.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.inputLabel}>3. ACTIVITY NAME</Text>
                    <View style={styles.searchWrapper}>
                      <Ionicons name="pencil" size={18} color={colors.textMuted} style={styles.searchIcon} />
                      <TextInput 
                        style={styles.formInput} 
                        placeholder="e.g. Dinner Buffet, City Tour..."
                        value={prForm.activity_name}
                        onChangeText={(v) => setPrForm(f => ({ ...f, activity_name: v }))}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* 4. Price */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>3. PRICE</Text>
                <View style={styles.priceInputRow}>
                  <View style={styles.currencyFlag}>
                    <Text style={styles.currencyFlagText}>{displayCurrency}</Text>
                  </View>
                  <TextInput 
                    style={styles.bigPriceInput} 
                    keyboardType="numeric" 
                    placeholder="0.00" 
                    value={prForm.price}
                    onChangeText={v => setPrForm(f => ({ ...f, price: v }))}
                  />
                </View>
              </View>

              <Pressable style={styles.publishBtn} onPress={handleSavePr}>
                <Text style={styles.publishBtnText}>{editingId ? 'Update Intelligence' : 'Publish to Live Trends'}</Text>
              </Pressable>

              <View style={styles.guaranteeBox}>
                <Ionicons name="shield-checkmark" size={16} color={colors.textMuted} />
                <Text style={styles.guaranteeText}>Secure administrator verification required for all live records.</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 24, fontWeight: '900', color: colors.textPrimary },
  headerSub: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  
  headerActionBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: colors.danger, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '900' },

  currencyToggle: { flexDirection: 'row', backgroundColor: colors.surface2, padding: 4, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  currBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  currBtnActive: { backgroundColor: colors.primary, elevation: 2, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2 },
  currBtnText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  currBtnTextActive: { color: colors.white },

  scrollBody: { padding: 20 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 15, fontSize: 13, color: colors.textMuted, fontWeight: '600' },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: colors.textPrimary, marginBottom: 12 },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginTop: -8, marginBottom: 15, fontWeight: '500' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48.5%', backgroundColor: colors.surface, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: colors.border },
  statIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  statNote: { fontSize: 10, color: colors.textMuted, marginTop: 4, fontWeight: '600' },

  progressBox: { marginTop: 20, backgroundColor: colors.surface, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  progressValue: { fontSize: 13, fontWeight: '900', color: colors.primary },
  progressBar: { height: 8, backgroundColor: colors.surface2, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  catScroll: { gap: 12, paddingRight: 20 },
  catCard: { backgroundColor: colors.surface, width: 140, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  catIconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  catLabel: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
  catValue: { fontSize: 14, fontWeight: '900', color: colors.textPrimary, marginTop: 2 },
  catCount: { fontSize: 10, color: colors.textMuted, marginTop: 6, fontWeight: '600' },

  tripCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: colors.surface, 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  tripCardOver: { 
    borderColor: colors.danger, 
    backgroundColor: Platform.OS === 'android' ? '#FFF9F9' : colors.danger + '08',
    borderWidth: 1.2,
    elevation: 4
  },
  tripCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tripCardRight: { alignItems: 'flex-end', marginLeft: 10 },
  tripInfo: { marginLeft: 12, flex: 1 },
  tripTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  tripUser: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  spendInfo: { alignItems: 'flex-end', marginBottom: 4 },
  tripUsed: { fontSize: 13, color: colors.textPrimary, fontWeight: '800' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusPillText: { fontSize: 9, fontWeight: '900' },
  alertActionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: colors.danger, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  alertActionText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  
  viewMoreBtn: { paddingVertical: 12, alignItems: 'center' },
  viewMoreText: { color: colors.primary, fontSize: 13, fontWeight: '700' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  addPrBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
  addPrText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  prRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  prTypeIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  prPlaceName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  prDate: { fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  prValue: { fontSize: 15, fontWeight: '900', color: colors.success, marginRight: 12 },
  prDelete: { padding: 6 },

  alertCard: { backgroundColor: colors.surface, padding: 15, borderRadius: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: colors.warning },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertTripTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginLeft: 6 },
  alertTime: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  alertMsg: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  alertUser: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: colors.background, 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    padding: 25, 
    maxHeight: '90%', 
    overflow: 'hidden' 
  },
  modalGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  modalSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },

  flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 12, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: colors.border },
  flowStep: { alignItems: 'center', gap: 4 },
  flowIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  flowText: { fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase' },

  formSection: { marginBottom: 22 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: colors.textMuted, letterSpacing: 1, marginBottom: 10 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  searchIcon: { marginRight: 10 },
  formInput: { flex: 1, height: 48, fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  clearSearch: { padding: 4 },

  placeResults: { marginTop: 10, backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  placeItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  placeItemActive: { backgroundColor: colors.primary },
  placeItemName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  placeItemDist: { fontSize: 11, color: colors.textMuted },

  typeGrid: { flexDirection: 'row', gap: 10 },
  typeChip: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 4 },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencyBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  currencyBadgeText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  priceInput: { flex: 1, height: 56, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, fontSize: 22, fontWeight: '900', color: colors.success, paddingHorizontal: 15 },
  
  conversionInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: colors.success + '10', padding: 10, borderRadius: 10, alignSelf: 'flex-start' },
  conversionText: { fontSize: 12, color: colors.success, fontWeight: '600' },

  floatingDropdown: { 
    position: 'absolute', 
    top: 80, 
    left: 0, 
    right: 0, 
    backgroundColor: colors.surface, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: colors.border, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 15, 
    zIndex: 9999 
  },
  dropdownItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  dropdownItemName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  dropdownItemDist: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  publishBtn: { 
    backgroundColor: colors.primary, 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  publishBtnText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  
  subCatGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  subCatChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  subCatChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  subCatChipText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },

  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencyFlag: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  currencyFlagText: { fontSize: 15, fontWeight: '900', color: colors.primary },
  bigPriceInput: { flex: 1, height: 60, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, fontSize: 26, fontWeight: '900', color: colors.success, paddingHorizontal: 15 },

  guaranteeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 25 },
  guaranteeText: { fontSize: 11, color: colors.textMuted, fontWeight: '600', fontStyle: 'italic' },

  // Mini Ledger Styles
  ledgerRowMini: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  ledgerIconBoxMini: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ledgerInfoMini: { flex: 1, marginLeft: 12 },
  ledgerNameMini: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  ledgerMetaMini: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  ledgerPriceBoxMini: { alignItems: 'flex-end', marginRight: 10 },
  ledgerPriceMini: { fontSize: 14, fontWeight: '900', color: colors.success },
  typeBadgeMini: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  typeBadgeTextMini: { fontSize: 8, fontWeight: '900' },
  ledgerDeleteMini: { padding: 4 },
});

export default AdminExpensesScreen;
