import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import ErrorText from '../../components/common/ErrorText';
import AppButton from '../../components/common/AppButton';
import { getRecentExpensesApi, getUserExpenseTotalApi } from '../../api/expenseApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';

const ExpenseSummaryScreen = ({ navigation }) => {
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    try {
      setError('');
      const [totalResponse, recentResponse] = await Promise.all([
        getUserExpenseTotalApi(),
        getRecentExpensesApi(10)
      ]);

      setTotal(totalResponse?.data?.totalAmount || 0);
      setCount(totalResponse?.data?.count || 0);
      setRecent(recentResponse?.data?.recentExpenses || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load expense summary'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.container}>
      {/* Header & Back Button */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Expense Summary</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.bgGlow} />
        <View style={styles.cardHeader}>
          <Text style={styles.title}>Lifetime Overview</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count} logs</Text>
          </View>
        </View>
        <Text style={styles.total}>{formatCurrency(total)}</Text>
        <Text style={styles.subtitle}>total money spent across all trips</Text>
      </View>

      <ErrorText message={error} />

      <View style={styles.actionRow}>
        <AppButton title="Trip Budgets" onPress={() => navigation.navigate('BudgetUsage')} />
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
      </View>

      <FlatList
        data={recent}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
           <View style={styles.item}>
             <View style={styles.itemIcon}>
                <Ionicons name="receipt" size={20} color={colors.primary} />
             </View>
             <View style={styles.itemContent}>
               <Text style={styles.itemTitle}>{item.category}</Text>
               <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
             </View>
             <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
           </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    padding: 16,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4
  },
  bgGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    color: colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12
  },
  countBadge: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  countText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12
  },
  total: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 14
  },
  actionRow: {
    marginBottom: 24
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18
  },
  listContent: {
    paddingBottom: 120
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  itemContent: {
    flex: 1
  },
  itemTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'capitalize'
  },
  itemDate: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 13
  },
  itemAmount: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16
  }
});

export default ExpenseSummaryScreen;
