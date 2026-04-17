import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { formatCurrency } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';

const getCategoryIcon = (category) => {
  const map = {
    food: 'restaurant',
    transport: 'train',
    accommodation: 'bed',
    activities: 'ticket',
    shopping: 'bag-handle',
    other: 'wallet'
  };
  return map[category] || 'cash';
};

const ExpenseCard = ({ expense, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={getCategoryIcon(expense.category)} size={24} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.category}>{expense.category}</Text>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{formatDate(expense.date)}</Text>
          <View style={styles.paymentChip}>
            <Text style={styles.paymentText}>{expense.paymentMethod || 'N/A'}</Text>
          </View>
        </View>
        {expense.notes ? <Text style={styles.notes} numberOfLines={2}>{expense.notes}</Text> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  category: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'capitalize'
  },
  amount: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13
  },
  paymentChip: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  paymentText: {
    color: colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  notes: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic'
  }
});

export default ExpenseCard;
