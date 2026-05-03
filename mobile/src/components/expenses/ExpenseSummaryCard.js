import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { formatCurrency } from '../../utils/currencyFormat';

const ExpenseSummaryCard = ({ total, count, budgetUsed = 0 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bgGlow} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Total User Expenses</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count} Entries</Text>
          </View>
        </View>
        <Text style={styles.total}>{formatCurrency(total)}</Text>
        {budgetUsed > 0 && (
           <View style={styles.budgetRow}>
             <Ionicons name="pie-chart" size={16} color={colors.accent} />
             <Text style={styles.budgetText}>{budgetUsed}% of avg budget used</Text>
           </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface
  },
  bgGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primary,
    opacity: 0.15,
    transform: [{ scale: 1.5 }]
  },
  content: {
    padding: 24
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12
  },
  countBadge: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  countText: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 12
  },
  total: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800'
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  budgetText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14
  }
});

export default ExpenseSummaryCard;
