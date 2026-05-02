import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { formatCurrency } from '../../utils/currencyFormat';

const ExpenseSummaryCard = ({ total = 0, count = 0, title = 'Total Expenses' }) => {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <Ionicons name="wallet" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count} {count === 1 ? 'entry' : 'entries'}</Text>
        </View>
      </View>

      <Text style={styles.total}>{formatCurrency(total)}</Text>
      <Text style={styles.subtitle}>across all your trips</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    fontSize: 11,
  },
  total: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ExpenseSummaryCard;
