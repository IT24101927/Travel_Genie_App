import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ErrorText from '../../components/common/ErrorText';
import CategoryBreakdown from '../../components/expenses/CategoryBreakdown';
import colors from '../../constants/colors';
import { getBudgetUsageApi, getExpensesApi } from '../../api/expenseApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency } from '../../utils/currencyFormat';

const getProgressColor = (percent) => {
  if (percent < 50) return colors.success;
  if (percent < 85) return '#F59E0B';
  return colors.danger;
};

const getStatusConfig = (percent) => {
  if (percent < 50) return { icon: 'checkmark-circle', label: 'On Track', color: colors.success, bg: colors.success + '12' };
  if (percent < 85) return { icon: 'alert-circle', label: 'Watch Out', color: '#F59E0B', bg: '#F59E0B12' };
  if (percent <= 100) return { icon: 'warning', label: 'Critical', color: colors.danger, bg: colors.danger + '12' };
  return { icon: 'close-circle', label: 'Over Budget', color: colors.danger, bg: colors.danger + '15' };
};

const BudgetUsageScreen = ({ navigation }) => {
  const [tripId, setTripId] = useState('');
  const [trips, setTrips] = useState([]);
  const [result, setResult] = useState(null);
  const [tripExpenses, setTripExpenses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const response = await getTripsApi();
      const list = response?.data?.trips || [];
      setTrips(list);
      if (!tripId && list[0]?._id) {
        setTripId(list[0]._id);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load trips'));
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  // Auto-fetch budget usage when tripId changes
  useEffect(() => {
    if (!tripId) return;

    const fetchBudget = async () => {
      try {
        setLoading(true);
        setError('');
        const [budgetResponse, expensesResponse] = await Promise.all([
          getBudgetUsageApi(tripId),
          getExpensesApi({ tripId }),
        ]);
        setResult(budgetResponse?.data || null);
        setTripExpenses(expensesResponse?.data?.expenses || []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to fetch budget usage'));
        setResult(null);
        setTripExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [tripId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    if (tripId) {
      try {
        const [budgetResponse, expensesResponse] = await Promise.all([
          getBudgetUsageApi(tripId),
          getExpensesApi({ tripId }),
        ]);
        setResult(budgetResponse?.data || null);
        setTripExpenses(expensesResponse?.data?.expenses || []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to refresh'));
      }
    }
    setRefreshing(false);
  };

  const usagePct = result?.usagePercentage || 0;
  const barColor = getProgressColor(usagePct);
  const status = getStatusConfig(usagePct);
  const selectedTrip = trips.find((t) => t._id === tripId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Budget Analysis</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Trip Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Trip</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {trips.length === 0 ? (
              <Text style={styles.emptyText}>No trips available</Text>
            ) : (
              trips.map((trip) => (
                <TouchableOpacity
                  key={trip._id}
                  style={[styles.tripChip, trip._id === tripId && styles.tripChipActive]}
                  onPress={() => setTripId(trip._id)}
                >
                  <Ionicons
                    name="airplane"
                    size={13}
                    color={trip._id === tripId ? colors.white : colors.textMuted}
                  />
                  <Text
                    style={[styles.tripText, trip._id === tripId && styles.tripTextActive]}
                    numberOfLines={1}
                  >
                    {trip.title}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <ErrorText message={error} />

        {/* Loading skeleton */}
        {loading && !result && (
          <View style={styles.loadingCard}>
            <View style={styles.loadingBar} />
            <View style={[styles.loadingBar, { width: '60%' }]} />
            <View style={[styles.loadingBar, { width: '40%' }]} />
          </View>
        )}

        {/* Budget Result */}
        {result && (
          <>
            {/* Main Budget Card */}
            <View style={styles.budgetCard}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Ionicons name={status.icon} size={16} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>

              {/* Trip Title */}
              {selectedTrip && (
                <Text style={styles.tripTitle} numberOfLines={1}>
                  {selectedTrip.title}
                </Text>
              )}

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Budget Used</Text>
                  <Text style={[styles.progressPct, { color: barColor }]}>
                    {usagePct.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.track}>
                  <LinearGradient
                    colors={[barColor, barColor + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.fill,
                      { width: `${Math.min(100, usagePct)}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <View style={[styles.statIconBox, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.statLabel}>Budget</Text>
                  <Text style={styles.statValue}>{formatCurrency(result.budget || result.tripBudget || 0)}</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={[styles.statIconBox, { backgroundColor: colors.accent + '15' }]}>
                    <Ionicons name="trending-down-outline" size={18} color={colors.accent} />
                  </View>
                  <Text style={styles.statLabel}>Spent</Text>
                  <Text style={[styles.statValue, { color: colors.accent }]}>
                    {formatCurrency(result.totalSpent || 0)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <View style={[styles.statIconBox, { backgroundColor: (result.remainingBudget < 0 ? colors.danger : colors.success) + '15' }]}>
                    <Ionicons
                      name={result.remainingBudget < 0 ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                      size={18}
                      color={result.remainingBudget < 0 ? colors.danger : colors.success}
                    />
                  </View>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: result.remainingBudget < 0 ? colors.danger : colors.success },
                    ]}
                  >
                    {formatCurrency(result.remainingBudget || 0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Over-budget Warning */}
            {usagePct > 100 && (
              <View style={styles.warningBox}>
                <LinearGradient
                  colors={[colors.danger, '#C0392B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.warningGrad}
                >
                  <Ionicons name="warning" size={22} color={colors.white} />
                  <View style={styles.warningContent}>
                    <Text style={styles.warningTitle}>Budget Exceeded</Text>
                    <Text style={styles.warningText}>
                      You're {formatCurrency(Math.abs(result.remainingBudget || 0))} over your planned budget.
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Category Breakdown for this trip */}
            {tripExpenses.length > 0 && (
              <CategoryBreakdown expenses={tripExpenses} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  chipRow: {
    gap: 8,
    paddingBottom: 4,
  },
  tripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tripChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tripText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
    maxWidth: 120,
  },
  tripTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingBar: {
    height: 14,
    backgroundColor: colors.surface2,
    borderRadius: 7,
    width: '80%',
  },
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  tripTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 18,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressPct: {
    fontSize: 16,
    fontWeight: '900',
  },
  track: {
    height: 14,
    backgroundColor: colors.surface2,
    borderRadius: 7,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 5,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 13,
  },
  warningBox: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  warningGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 2,
  },
  warningText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default BudgetUsageScreen;
