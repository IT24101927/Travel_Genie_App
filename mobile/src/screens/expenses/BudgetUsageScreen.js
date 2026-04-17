import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { getBudgetUsageApi } from '../../api/expenseApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency } from '../../utils/currencyFormat';

const BudgetUsageScreen = () => {
  const [tripId, setTripId] = useState('');
  const [trips, setTrips] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const response = await getTripsApi();
        const list = response?.data?.trips || [];
        setTrips(list);
        if (list[0]?._id) {
          setTripId(list[0]._id);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load trips'));
      }
    };

    loadTrips();
  }, []);

  const onCheck = async () => {
    if (!tripId) {
      setError('Please select a trip.');
      return;
    }

    try {
      setChecking(true);
      setError('');
      const response = await getBudgetUsageApi(tripId);
      setResult(response?.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch budget usage'));
    } finally {
      setChecking(false);
    }
  };

  const getProgressColor = (percent) => {
    if (percent < 50) return colors.success;
    if (percent < 85) return colors.warning;
    return colors.danger;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select a Trip</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {trips.length === 0 ? <Text style={styles.emptyText}>No trips available</Text> : trips.map((trip) => (
            <TouchableOpacity
              key={trip._id}
              style={[styles.tripChip, trip._id === tripId && styles.tripChipActive]}
              onPress={() => setTripId(trip._id)}
            >
              <Text style={[styles.tripChoiceText, trip._id === tripId && styles.tripChoiceTextActive]}>
                {trip.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <AppButton title={checking ? 'Analyzing...' : 'Analyze Budget'} onPress={onCheck} disabled={checking || !tripId} />
      <ErrorText message={error} />

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>Budget Analysis</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={styles.statValue}>{formatCurrency(result.tripBudget)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={[styles.statValue, { color: result.remainingBudget < 0 ? colors.danger : colors.success }]}>
                {formatCurrency(result.remainingBudget)}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Total Spent</Text>
              <Text style={styles.progressAmount}>{formatCurrency(result.totalSpent)}</Text>
            </View>

            <View style={styles.track}>
              <View 
                style={[
                  styles.fill, 
                  { 
                    width: `${Math.min(100, result.usagePercentage || 0)}%`,
                    backgroundColor: getProgressColor(result.usagePercentage || 0)
                  }
                ]} 
              />
            </View>
            <Text style={styles.percentageText}>{Number(result.usagePercentage || 0).toFixed(1)}% Used</Text>
          </View>

          {result.usagePercentage > 100 && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={colors.white} />
              <Text style={styles.warningText}>You have exceeded your planned budget for this trip.</Text>
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 12
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic'
  },
  chipRow: {
    gap: 10,
    paddingBottom: 8
  },
  tripChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  tripChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary
  },
  tripChoiceText: {
    color: colors.textSecondary,
    fontWeight: '600'
  },
  tripChoiceTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  resultCard: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 4
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6
  },
  statValue: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18
  },
  progressSection: {
    marginBottom: 16
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600'
  },
  progressAmount: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800'
  },
  track: {
    height: 12,
    backgroundColor: colors.surface2,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8
  },
  fill: {
    height: '100%',
    borderRadius: 6
  },
  percentageText: {
    color: colors.textMuted,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600'
  },
  warningBox: {
    marginTop: 16,
    backgroundColor: colors.danger,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  warningText: {
    color: colors.white,
    flex: 1,
    fontWeight: '600',
    lineHeight: 20
  }
});

export default BudgetUsageScreen;
