import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../../constants/colors';
import TrendChart from '../../components/expenses/TrendChart';
import { getExpensesApi } from '../../api/expenseApi';
import client from '../../api/client';
import { convertAmt, formatCurrency, DISPLAY_CURRENCIES } from '../../utils/currencyFormat';
import { getApiErrorMessage } from '../../utils/apiError';

const PRICE_TRENDS_SEED = {
  accommodation:  [15000, 16500, 18000, 17500, 19000, 22000, 25000, 24000, 21000, 19000, 17000, 16000],
  transportation: [4500, 4800, 5200, 5000, 5500, 6000, 6500, 6300, 5800, 5400, 5000, 4700],
  food:           [2500, 2700, 2900, 2800, 3200, 3500, 3800, 3600, 3300, 3000, 2800, 2600],
  activities:     [8000, 8500, 9200, 9000, 10000, 11500, 13000, 12500, 11000, 10000, 9000, 8500],
  shopping:       [5000, 5200, 5600, 5500, 6000, 7000, 8000, 7800, 6800, 6200, 5500, 5200],
  entertainment:  [3500, 3700, 4000, 3900, 4500, 5200, 6000, 5800, 5000, 4500, 4000, 3700],
  emergency:      [25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000],
  other:          [1500, 1600, 1800, 1700, 2000, 2400, 2800, 2600, 2200, 1900, 1700, 1600],
};

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

const PRICE_RECORD_TO_CAT = {
  hotel:     'accommodation',
  transport: 'transportation',
  ticket:    'activities',
};

// For item_type === 'activity', use the category field to pick the display bucket
const ACTIVITY_CAT_TO_DISPLAY = {
  food:          'food',
  entertainment: 'entertainment',
  shopping:      'shopping',
  amenity:       'other',
  other:         'other',
};

const resolveRecordCat = (row) => {
  const type = (row?.item_type || '').toLowerCase();
  if (type === 'activity') {
    return ACTIVITY_CAT_TO_DISPLAY[(row?.category || '').toLowerCase()] || 'other';
  }
  return PRICE_RECORD_TO_CAT[type] || null;
};

const ExpenseTrendsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [priceRecords, setPriceRecords] = useState([]);
  const [displayCurrency, setDisplayCurrency] = useState('LKR');
  const [error, setError] = useState('');

  const loadTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await client.get('/expenses/price-records?limit=500');
      setPriceRecords(res.data?.data?.records || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load price records'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTrends(); }, [loadTrends]));

  const mergedTrends = useMemo(() => {
    const next = { ...PRICE_TRENDS_SEED };
    const buckets = {};

    priceRecords.forEach(row => {
      const cat = resolveRecordCat(row);
      if (!cat) return;
      const date = new Date(row?.recorded_at);
      if (isNaN(date.getTime())) return;
      const month = date.getMonth();
      const price = Number(row?.price); // Price is now LKR in DB
      if (!isNaN(price)) {
        if (!buckets[cat]) buckets[cat] = {};
        if (!buckets[cat][month]) buckets[cat][month] = [];
        buckets[cat][month].push(price);
      }
    });

    Object.entries(buckets).forEach(([cat, monthMap]) => {
      const arr = [...(next[cat] || new Array(12).fill(0))];
      Object.entries(monthMap).forEach(([m, vals]) => {
        if (vals.length) {
          arr[Number(m)] = Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2));
        }
      });
      next[cat] = arr;
    });

    // Convert everything to display currency for the chart & display
    const converted = {};
    Object.entries(next).forEach(([cat, data]) => {
      converted[cat] = data.map(v => convertAmt(v, 'LKR', displayCurrency));
    });

    return converted;
  }, [priceRecords, displayCurrency]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </Pressable>
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
        <Text style={styles.title}>Market Price Trends</Text>
        <Text style={styles.subtitle}>Historical costs for budgeting ({displayCurrency})</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTrends(); }} tintColor={colors.primary} />}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Trends are calculated using real market records in {displayCurrency} merged with seasonal estimates.
            </Text>
          </View>

          {CATEGORIES.map(cat => {
            const data = mergedTrends[cat.id] || [];
            const currentPrice = data[new Date().getMonth()];
            const prevPrice = data[(new Date().getMonth() - 1 + 12) % 12];
            const diff = currentPrice - prevPrice;

            return (
              <View key={cat.id} style={styles.trendCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons name={cat.icon} size={20} color={cat.color} />
                  </View>
                  <View style={styles.labelBox}>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <Text style={styles.priceText}>
                      Avg: {formatCurrency(currentPrice, displayCurrency)}
                    </Text>
                  </View>
                  <TrendChart data={data} color={cat.color} />
                </View>
                {Math.abs(diff) > 0 && (
                  <View style={styles.diffRow}>
                    <Text style={[styles.diffText, { color: diff > 0 ? colors.danger : colors.success }]}>
                      {diff > 0 ? '+' : ''}{formatCurrency(diff, displayCurrency)} from last month
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 2 },

  currencyToggle: { flexDirection: 'row', backgroundColor: colors.surface2, padding: 4, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  currBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  currBtnActive: { backgroundColor: colors.primary },
  currBtnText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  currBtnTextActive: { color: colors.white },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },

  infoCard: { flexDirection: 'row', backgroundColor: colors.primary + '10', padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center', gap: 10 },
  infoText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18, fontWeight: '500' },

  trendCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  labelBox: { flex: 1, marginLeft: 12 },
  catLabel: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  priceText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },

  diffRow: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  diffText: { fontSize: 11, fontWeight: '700' },
});

export default ExpenseTrendsScreen;
