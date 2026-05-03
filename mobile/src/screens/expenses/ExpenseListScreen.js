import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import ExpenseCard from '../../components/expenses/ExpenseCard';
import ExpenseFilterBar from '../../components/expenses/ExpenseFilterBar';
import ExpenseSummaryCard from '../../components/expenses/ExpenseSummaryCard';
import { getExpensesApi, getUserExpenseTotalApi } from '../../api/expenseApi';
import { getApiErrorMessage } from '../../utils/apiError';
import colors from '../../constants/colors';
import { Pressable } from 'react-native';

const ExpenseListScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalSpent: 0, count: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');

      const [expenseResponse, summaryResponse] = await Promise.all([
        getExpensesApi(activeCategory ? { category: activeCategory } : {}),
        getUserExpenseTotalApi()
      ]);

      const loadedExpenses = expenseResponse?.data?.expenses || [];
      setExpenses(loadedExpenses);
      setSummary({
        totalSpent: summaryResponse?.data?.totalAmount || 0,
        count: summaryResponse?.data?.count || loadedExpenses.length
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load expenses'));
    } finally {
      setRefreshing(false);
    }
  }, [activeCategory]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const budgetUsed = useMemo(() => 0, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Ledger</Text>
      
      <ExpenseSummaryCard total={summary.totalSpent} count={summary.count} budgetUsed={budgetUsed} />

      <View style={styles.filterContainer}>
        <ExpenseFilterBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      </View>
      
      <ErrorText message={error} />

      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onPress={() => navigation.navigate('EditExpense', { expense: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={!refreshing ? <EmptyState title="No expenses yet" subtitle="Track spending by adding your first expense." icon="wallet-outline" /> : null}
      />
      
      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddExpense')}>
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 16,
    marginBottom: 20
  },
  filterContainer: {
    marginBottom: 8
  },
  listContent: {
    paddingBottom: 160
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  }
});

export default ExpenseListScreen;
