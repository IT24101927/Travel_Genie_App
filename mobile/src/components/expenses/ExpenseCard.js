import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { getCategoryMeta } from '../../constants/expenseCategories';
import { formatCurrency, convertAmt } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';

const PAYMENT_ICONS = {
  cash: 'cash-outline',
  card: 'card-outline',
  wallet: 'phone-portrait-outline',
  bank_transfer: 'swap-horizontal-outline',
  other: 'ellipsis-horizontal-outline',
};

const ExpenseCard = ({ expense, onPress, displayCurrency = 'LKR' }) => {
  const cat = getCategoryMeta(expense.category);
  const tripTitle = expense.tripId?.title || expense.tripTitle || '';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Category Icon */}
      <View style={[styles.iconContainer, { backgroundColor: cat.color + '15' }]}>
        <Ionicons name={cat.icon} size={22} color={cat.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleArea}>
            <Text style={styles.category} numberOfLines={1}>
              {expense.title || cat.label}
            </Text>
            {expense.status === 'planned' && (
              <View style={[styles.tripBadge, { backgroundColor: colors.warning + '20', borderColor: colors.warning + '40' }]}>
                <Ionicons name="calendar-outline" size={10} color={colors.warning} />
                <Text style={[styles.tripText, { color: colors.warning }]} numberOfLines={1}>Planned</Text>
              </View>
            )}
            {tripTitle ? (
              <View style={styles.tripBadge}>
                <Ionicons name="airplane" size={10} color={colors.primary} />
                <Text style={styles.tripText} numberOfLines={1}>{tripTitle}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.amountArea}>
            <Text style={styles.amount}>
              -{formatCurrency(
                convertAmt(expense.amount, expense.currency, displayCurrency),
                displayCurrency
              )}
            </Text>
            {expense.currency !== displayCurrency && (
              <Text style={styles.originalAmount}>
                {formatCurrency(expense.amount, expense.currency)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaLeft}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(expense.date)}</Text>
          </View>
          <View style={styles.paymentChip}>
            <Ionicons
              name={PAYMENT_ICONS[expense.paymentMethod] || 'cash-outline'}
              size={12}
              color={colors.textSecondary}
            />
            <Text style={styles.paymentText}>
              {(expense.paymentMethod || 'cash').replace('_', ' ')}
            </Text>
          </View>
        </View>

        {expense.notes ? (
          <Text style={styles.notes} numberOfLines={1}>"{expense.notes}"</Text>
        ) : null}
      </View>

      {/* Chevron */}
      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  category: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  tripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tripText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  amountArea: {
    alignItems: 'flex-end',
  },
  amount: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  originalAmount: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface2,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paymentText: {
    color: colors.textSecondary,
    fontSize: 10,
    textTransform: 'capitalize',
    fontWeight: '700',
  },
  notes: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  chevron: {
    marginLeft: 4,
  },
});

export default ExpenseCard;
