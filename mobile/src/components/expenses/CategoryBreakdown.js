import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { getCategoryMeta } from '../../constants/expenseCategories';
import { formatCurrency, convertAmt } from '../../utils/currencyFormat';

const CategoryBreakdown = ({ 
  expenses = [], 
  displayCurrency = 'LKR', 
  plannedBudget = null, 
  tripCurrency = 'LKR' 
}) => {
  if (expenses.length === 0) return null;

  // Aggregate by category
  const categoryTotals = {};
  let grandTotal = 0;

  expenses.forEach((exp) => {
    const cat = exp.category || 'other';
    const convertedAmount = convertAmt(exp.amount, exp.currency || 'LKR', displayCurrency);
    
    if (!categoryTotals[cat]) categoryTotals[cat] = 0;
    categoryTotals[cat] += convertedAmount;
    grandTotal += convertedAmount;
  });

  // Helper to find planned value in breakdown (handling potential plural/casing differences)
  const getPlannedFor = (id) => {
    if (!plannedBudget) return 0;
    // Common keys: food, hotel, transport, activity/activities
    const normalizedId = id.toLowerCase();
    const keys = Object.keys(plannedBudget);
    const match = keys.find(k => k.toLowerCase() === normalizedId || k.toLowerCase() === normalizedId + 's' || (normalizedId === 'activity' && k.toLowerCase() === 'activities'));
    return match ? Number(plannedBudget[match]) || 0 : 0;
  };

  // Build sorted list with spent vs planned
  const sorted = Object.entries(categoryTotals)
    .map(([id, total]) => {
      const rawPlanned = getPlannedFor(id);
      const planned = convertAmt(rawPlanned, tripCurrency, displayCurrency);
      return { id, total, planned, meta: getCategoryMeta(id) };
    })
    .sort((a, b) => b.total - a.total);

  // If there's a planned budget, we might have categories that HAVE budget but NO expenses yet
  // Let's add them to the list if we are in "Trip Mode"
  if (plannedBudget) {
    Object.keys(plannedBudget).forEach(key => {
      // Normalize key back to our internal IDs if possible
      let internalId = key.toLowerCase();
      if (internalId === 'activities') internalId = 'activity';
      
      if (!categoryTotals[internalId] && getCategoryMeta(internalId).id !== 'other') {
        const rawPlanned = plannedBudget[key];
        const planned = convertAmt(rawPlanned, tripCurrency, displayCurrency);
        if (planned > 0) {
          sorted.push({ id: internalId, total: 0, planned, meta: getCategoryMeta(internalId) });
        }
      }
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spending by Category</Text>
        <Ionicons name="pie-chart-outline" size={18} color={colors.textMuted} />
      </View>

      {sorted.map((item) => {
        const hasPlanned = plannedBudget !== null && item.planned > 0;
        const pct = hasPlanned 
          ? (item.total / item.planned) * 100 
          : (grandTotal > 0 ? (item.total / grandTotal) * 100 : 0);
        
        const isOver = hasPlanned && item.total > item.planned;
        const barColor = isOver ? colors.danger : item.meta.color;

        return (
          <View key={item.id} style={styles.row}>
            <View style={[styles.catIcon, { backgroundColor: item.meta.color + '15' }]}>
              <Ionicons name={item.meta.icon} size={18} color={item.meta.color} />
            </View>
            <View style={styles.barArea}>
              <View style={styles.labelRow}>
                <Text style={styles.catLabel}>{item.meta.label}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.catAmount}>{formatCurrency(item.total, displayCurrency)}</Text>
                  {hasPlanned && (
                    <Text style={styles.plannedAmount}>
                      of {formatCurrency(item.planned, displayCurrency)}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.min(Math.max(pct, 2), 100)}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <View style={styles.pctRow}>
                <Text style={[styles.pctText, isOver && { color: colors.danger, fontWeight: '800' }]}>
                  {pct.toFixed(1)}% {isOver ? 'OVER' : 'USED'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barArea: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  catAmount: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  track: {
    height: 8,
    backgroundColor: colors.surface2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  pctRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  pctText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  plannedAmount: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

export default CategoryBreakdown;
