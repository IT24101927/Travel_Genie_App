import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import ErrorText from '../../components/common/ErrorText';
import CategoryBreakdown from '../../components/expenses/CategoryBreakdown';
import { getCategoryMeta } from '../../constants/expenseCategories';
import { getExpensesApi, getRecentExpensesApi, getUserExpenseTotalApi } from '../../api/expenseApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';

const ExpenseSummaryScreen = ({ navigation }) => {
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      const [totalResponse, recentResponse, allResponse] = await Promise.all([
        getUserExpenseTotalApi(),
        getRecentExpensesApi(10),
        getExpensesApi({}),
      ]);

      setTotal(totalResponse?.data?.totalUserExpenses || totalResponse?.data?.totalAmount || 0);
      setCount(totalResponse?.data?.expenseCount || totalResponse?.data?.count || 0);
      setRecent(recentResponse?.data?.recentExpenses || []);
      setAllExpenses(allResponse?.data?.expenses || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load expense summary'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const avgExpense = count > 0 ? total / count : 0;

  const ListHeader = () => (
    <View style={styles.headerBlock}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Expense Summary</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero Card */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />

        <View style={styles.heroHeader}>
          <View style={styles.heroLabelRow}>
            <Ionicons name="analytics" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroLabel}>LIFETIME OVERVIEW</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{count} logs</Text>
          </View>
        </View>

        <Text style={styles.heroTotal}>{formatCurrency(total)}</Text>
        <Text style={styles.heroSub}>total money spent across all trips</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(avgExpense)}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Budget Usage Button */}
      <Pressable
        style={({ pressed }) => [styles.budgetCta, pressed && styles.budgetCtaPressed]}
        onPress={() => navigation.navigate('BudgetUsage')}
      >
        <View style={styles.budgetCtaIcon}>
          <Ionicons name="pie-chart" size={22} color={colors.warning} />
        </View>
        <View style={styles.budgetCtaCopy}>
          <Text style={styles.budgetCtaTitle}>Trip Budget Analysis</Text>
          <Text style={styles.budgetCtaSub}>Compare spending vs planned budgets</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <ErrorText message={error} />

      {/* Category Breakdown */}
      <CategoryBreakdown expenses={allExpenses} />

      {/* Recent Activity Header */}
      {recent.length > 0 && (
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Ionicons name="time-outline" size={18} color={colors.textMuted} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={recent}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={<ListHeader />}
        renderItem={({ item }) => {
          const cat = getCategoryMeta(item.category);
          return (
            <View style={styles.recentItem}>
              <View style={[styles.recentIcon, { backgroundColor: cat.color + '15' }]}>
                <Ionicons name={cat.icon} size={18} color={cat.color} />
              </View>
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle}>{cat.label}</Text>
                <Text style={styles.recentDate}>{formatDate(item.date)}</Text>
              </View>
              <Text style={styles.recentAmount}>-{formatCurrency(item.amount)}</Text>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadSummary}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBlock: {
    paddingBottom: 4,
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
  heroCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  heroDecor1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroDecor2: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    fontSize: 11,
  },
  heroTotal: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  budgetCtaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  budgetCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F59E0B15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCtaCopy: {
    flex: 1,
  },
  budgetCtaTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  budgetCtaSub: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  recentDate: {
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 12,
  },
  recentAmount: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14,
  },
});

export default ExpenseSummaryScreen;
