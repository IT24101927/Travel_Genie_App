import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import ExpenseCard from '../../components/expenses/ExpenseCard';
import ExpenseFilterBar from '../../components/expenses/ExpenseFilterBar';
import CategoryBreakdown from '../../components/expenses/CategoryBreakdown';
import {
  getExpensesApi, getBudgetUsageApi, getUserExpenseTotalApi,
} from '../../api/expenseApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency, DISPLAY_CURRENCIES, convertAmt } from '../../utils/currencyFormat';
import colors from '../../constants/colors';

/* ── Budget progress helpers ── */
const getProgressColor = (pct) => {
  if (pct < 50) return colors.success;
  if (pct < 85) return '#F59E0B';
  return colors.danger;
};

const getStatusConfig = (pct) => {
  if (pct < 50) return { icon: 'checkmark-circle', label: 'On Track', color: colors.success };
  if (pct < 85) return { icon: 'alert-circle', label: 'Watch Out', color: '#F59E0B' };
  if (pct <= 100) return { icon: 'warning', label: 'Critical', color: colors.danger };
  return { icon: 'close-circle', label: 'Over Budget', color: colors.danger };
};

/* ── Trip Selector Pill ── */
const TripPill = ({ trip, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tripPill, isActive && styles.tripPillActive]}
    onPress={onPress}
  >
    <Ionicons
      name={trip ? 'airplane' : 'globe-outline'}
      size={13}
      color={isActive ? colors.white : colors.textMuted}
    />
    <Text
      style={[styles.tripPillText, isActive && styles.tripPillTextActive]}
      numberOfLines={1}
    >
      {trip ? trip.title : 'All Trips'}
    </Text>
  </TouchableOpacity>
);

export default function ExpenseListScreen({ navigation }) {
  /* ── State ── */
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState('');      // '' = all trips
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [globalCurrency, setGlobalCurrency] = useState('LKR');

  /* ── Derived ── */
  const isAllTrips = !activeTripId;
  const activeTrip = trips.find((t) => t._id === activeTripId);

  /* ── Load Data ── */
  const fetchBaseData = async () => {
    try {
      const tripsRes = await getTripsApi();
      setTrips(tripsRes?.data?.trips || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load trips'));
    }
  };

  const fetchExpenses = async () => {
    try {
      setRefreshing(true);
      setError('');
      // Fetch ALL expenses to accurately calculate global totals across currencies
      const expRes = await getExpensesApi({});
      setExpenses(expRes?.data?.expenses || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load expenses'));
    } finally {
      setRefreshing(false);
    }
  };

  // Run once on focus to refresh data
  useFocusEffect(
    useCallback(() => {
      fetchBaseData();
      fetchExpenses();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // When active category changes, nothing to fetch since we have all expenses locally
  useEffect(() => {
    // If we wanted to re-fetch on category, we'd do it here. 
    // But frontend filtering is instantly faster and mathematically safer.
  }, [activeCategory]);

  const computeTotal = (list, targetCurrency) => {
    return list.reduce((sum, e) => {
      const amt = Number(e.amount || 0);
      const cur = e.currency || 'LKR';
      return sum + convertAmt(amt, cur, targetCurrency);
    }, 0);
  };

  /* ── Front-end category filter (fallback) ── */
  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (activeTripId) {
      result = result.filter((e) => {
        const eTripId = e.tripId?._id || e.tripId;
        return eTripId === activeTripId;
      });
    }
    if (activeCategory) {
      result = result.filter((e) => e.category === activeCategory);
    }
    return result;
  }, [expenses, activeCategory, activeTripId]);

  /* ── Computed totals for current view ── */
  const currentTotal = useMemo(() => computeTotal(filteredExpenses, globalCurrency), [filteredExpenses, globalCurrency]);
  
  // Real global total computed locally from all fetched expenses
  const globalTotal = useMemo(() => {
    return {
      total: computeTotal(expenses, globalCurrency),
      count: expenses.length,
    };
  }, [expenses, globalCurrency]);

  /* ── Trip selection handler ── */
  const selectTrip = (id) => {
    setActiveTripId(id);
    setActiveCategory('');        // reset category when switching trips
  };

  /* ── Navigate to add expense (with pre-selected trip) ── */
  const goToAddExpense = () => {
    navigation.navigate('AddExpense', {
      tripId: activeTripId || '',
      tripTitle: activeTrip?.title || '',
    });
  };

  /* ── Budget display values ── */
  const budgetData = useMemo(() => {
    if (!activeTrip) return null;
    const rawBudget = Number(activeTrip.budget || activeTrip.totalBudget || activeTrip.total_budget || 0);
    const tripCurrency = activeTrip.currency || 'LKR';
    const budgetInGlobal = convertAmt(rawBudget, tripCurrency, globalCurrency);
    const spentInGlobal = currentTotal;
    const remainingInGlobal = budgetInGlobal - spentInGlobal;
    const pct = budgetInGlobal > 0 ? (spentInGlobal / budgetInGlobal) * 100 : 0;

    return {
      budget: budgetInGlobal,
      totalSpent: spentInGlobal,
      remainingBudget: remainingInGlobal,
      usagePercentage: pct,
    };
  }, [activeTrip, currentTotal, globalCurrency]);

  const budgetPct = budgetData?.usagePercentage || 0;
  const barColor = getProgressColor(budgetPct);
  const status = getStatusConfig(budgetPct);

  /* ═══════════════════════════════════════════════
     LIST HEADER
     ═══════════════════════════════════════════════ */
  const listHeaderElement = (
    <View style={styles.headerBlock}>
      {/* Page Title & Currency Toggle */}
      <View style={styles.pageTitleRow}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Expense Tracker</Text>
          <Pressable 
            style={styles.trendsBtn} 
            onPress={() => navigation.navigate('ExpenseTrends')}
          >
            <Ionicons name="trending-up" size={18} color={colors.primary} />
            <Text style={styles.trendsBtnText}>Trends</Text>
          </Pressable>
        </View>
        <View style={styles.currencyToggleContainer}>
          {DISPLAY_CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.code}
              onPress={() => setGlobalCurrency(c.code)}
              style={[
                styles.currencyBtn,
                globalCurrency === c.code && styles.currencyBtnActive,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.currencyBtnFlag}>{c.flag}</Text>
              <Text
                style={[
                  styles.currencyBtnText,
                  globalCurrency === c.code && styles.currencyBtnTextActive,
                ]}
              >
                {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Trip Selector Row ── */}
      <View style={styles.tripSection}>
        <Text style={styles.tripSectionLabel}>SELECT TRIP</Text>
        <FlatList
          horizontal
          data={[null, ...trips]}
          keyExtractor={(item) => (item ? item._id : 'all')}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tripRow}
          renderItem={({ item }) => (
            <TripPill
              trip={item}
              isActive={item ? activeTripId === item._id : isAllTrips}
              onPress={() => selectTrip(item ? item._id : '')}
            />
          )}
        />
      </View>

      {/* ── Budget / Summary Card ── */}
      {activeTripId && budgetData ? (
        /* Trip-specific budget card */
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.budgetTripTitle} numberOfLines={1}>
                {activeTrip?.title || 'Trip Budget'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                <Ionicons name={status.icon} size={14} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <Pressable
              style={styles.addBtnSmall}
              onPress={goToAddExpense}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </Pressable>
          </View>

          {/* Progress bar */}
          <View style={styles.progressArea}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {formatCurrency(budgetData.totalSpent || 0, globalCurrency)} spent
              </Text>
              <Text style={[styles.progressPct, { color: barColor }]}>
                {budgetPct.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.track}>
              <LinearGradient
                colors={[barColor, barColor + 'BB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${Math.min(100, budgetPct)}%` }]}
              />
            </View>
          </View>

          {/* Budget vs Remaining */}
          <View style={styles.budgetStatsRow}>
            <View style={styles.budgetStat}>
              <Text style={styles.budgetStatLabel}>Budget</Text>
              <Text style={styles.budgetStatValue}>
                {formatCurrency(budgetData.budget || 0, globalCurrency)}
              </Text>
            </View>
            <View style={styles.budgetDivider} />
            <View style={styles.budgetStat}>
              <Text style={styles.budgetStatLabel}>Remaining</Text>
              <Text
                style={[
                  styles.budgetStatValue,
                  { color: (budgetData.remainingBudget || 0) < 0 ? colors.danger : colors.success },
                ]}
              >
                {formatCurrency(budgetData.remainingBudget || 0, globalCurrency)}
              </Text>
            </View>
          </View>

          {/* Over-budget warning */}
          {budgetPct > 100 && (
            <View style={styles.overBudgetBanner}>
              <Ionicons name="warning" size={16} color={colors.white} />
              <Text style={styles.overBudgetText}>
                Over budget by {formatCurrency(Math.abs(budgetData.remainingBudget || 0), globalCurrency)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* All-trips summary card */
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroHeader}>
            <View style={styles.heroLabelRow}>
              <Ionicons name="wallet" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroLabel}>
                {isAllTrips ? 'TOTAL EXPENSES' : 'TRIP EXPENSES'}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {isAllTrips ? `${globalTotal.count} entries` : `${filteredExpenses.length} entries`}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTotal}>
            {isAllTrips ? formatCurrency(globalTotal.total, globalCurrency) : formatCurrency(currentTotal, globalCurrency)}
          </Text>
        </LinearGradient>
      )}

      {/* ── Category Breakdown (for selected trip) ── */}
      {activeTripId && filteredExpenses.length > 0 && (
        <CategoryBreakdown 
          expenses={filteredExpenses} 
          displayCurrency={globalCurrency}
          plannedBudget={activeTrip?.budgetBreakdown}
          tripCurrency={activeTrip?.currency || 'LKR'}
        />
      )}

      {/* ── Category Filter ── */}
      <ExpenseFilterBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* ── Section label ── */}
      <View style={styles.listLabelRow}>
        <Text style={styles.listLabel}>
          {isAllTrips ? 'All Expenses' : `${activeTrip?.title || 'Trip'} Expenses`}
        </Text>
        <Text style={styles.listCount}>{filteredExpenses.length}</Text>
      </View>

      <ErrorText message={error} />
    </View>
  );

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            displayCurrency={globalCurrency}
            onPress={() => navigation.navigate('EditExpense', { expense: item })}
          />
        )}
        ListHeaderComponent={listHeaderElement}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              fetchBaseData();
              fetchExpenses();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState
              title={isAllTrips ? 'No expenses yet' : 'No expenses for this trip'}
              subtitle={
                isAllTrips
                  ? 'Select a trip above and start tracking your spending.'
                  : 'Tap the + button to add your first expense.'
              }
              icon="wallet-outline"
            />
          ) : null
        }
      />

      {/* FAB - Only show when a specific trip is selected */}
      {!isAllTrips && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={goToAddExpense}
        >
          <Ionicons name="add" size={30} color={colors.white} />
        </Pressable>
      )}
    </SafeAreaView>
  );
};

/* ═══════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },

  headerBlock: { paddingTop: 12, paddingBottom: 4 },
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  currencyToggleContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  trendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trendsBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  notifyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  currencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyBtnActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  currencyBtnFlag: {
    fontSize: 14,
  },
  currencyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  currencyBtnTextActive: {
    color: colors.primary,
  },

  /* ── Trip selector ── */
  tripSection: { marginBottom: 16 },
  tripSectionLabel: {
    color: colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2,
  },
  tripRow: { gap: 8, paddingBottom: 2 },
  tripPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  tripPillActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  tripPillText: {
    color: colors.textSecondary, fontWeight: '700', fontSize: 13, maxWidth: 110,
  },
  tripPillTextActive: { color: colors.white },

  /* ── Budget card (trip selected) ── */
  budgetCard: {
    backgroundColor: colors.surface, borderRadius: 22, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  budgetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  budgetTripTitle: {
    color: colors.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
  },
  statusText: { fontWeight: '700', fontSize: 11 },
  addBtnSmall: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  progressArea: { marginBottom: 16 },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6,
  },
  progressLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  progressPct: { fontSize: 14, fontWeight: '900' },
  track: {
    height: 12, backgroundColor: colors.surface2, borderRadius: 6, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 6 },
  budgetStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface2, borderRadius: 14, padding: 14,
  },
  budgetStat: { flex: 1, alignItems: 'center' },
  budgetStatLabel: {
    color: colors.textMuted, fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3,
  },
  budgetStatValue: { color: colors.textPrimary, fontWeight: '900', fontSize: 14 },
  budgetDivider: { width: 1, height: 28, backgroundColor: colors.border },
  overBudgetBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.danger, borderRadius: 10,
    padding: 10, marginTop: 12,
  },
  overBudgetText: { color: colors.white, fontWeight: '700', fontSize: 12, flex: 1 },

  /* ── Hero gradient card (all trips) ── */
  heroGradient: {
    borderRadius: 22, padding: 22, marginBottom: 16, overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12,
  },
  heroDecor1: {
    position: 'absolute', top: -30, right: -20, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroDecor2: {
    position: 'absolute', bottom: -40, left: -30, width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  heroBadgeText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 11 },
  heroTotal: {
    color: colors.white, fontSize: 34, fontWeight: '900', letterSpacing: 0.5,
  },
  heroAddBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 6, backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 14,
  },
  heroAddText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  /* ── List label ── */
  listLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, marginTop: 4,
  },
  listLabel: { color: colors.textPrimary, fontWeight: '800', fontSize: 16 },
  listCount: {
    color: colors.textMuted, fontWeight: '700', fontSize: 12,
    backgroundColor: colors.surface2, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },

  /* ── FAB ── */
  fab: {
    position: 'absolute', right: 20, bottom: 100,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
  fabPressed: { transform: [{ scale: 0.92 }] },
});


