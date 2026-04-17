import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { deleteTripApi } from '../../api/tripApi';
import { formatCurrency } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';
import { getApiErrorMessage } from '../../utils/apiError';

const TripDetailsScreen = ({ navigation, route }) => {
  const trip = route.params?.trip;
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const onDelete = () => {
    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            setError('');
            await deleteTripApi(trip._id);
            navigation.navigate('TripList');
          } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to delete trip'));
          } finally {
            setDeleting(false);
          }
        }
      }
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return colors.statusOngoing;
      case 'completed': return colors.statusCompleted;
      case 'cancelled': return colors.statusCancelled;
      case 'planned': default: return colors.statusPlanned;
    }
  };

  if (!trip) {
    return (
      <View style={styles.container}>
        <Text style={styles.metaText}>Trip not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>{trip.title}</Text>
        <View style={styles.heroRow}>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={16} color={colors.accent} />
            <Text style={styles.destination}>{trip.destination}</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>{trip.status || 'planned'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <View style={styles.iconBox}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.detailLabel}>Dates</Text>
            <Text style={styles.detailValue}>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <View style={styles.iconBox}>
            <Ionicons name="wallet" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.detailLabel}>Budget</Text>
            <Text style={styles.detailValue}>{formatCurrency(trip.budget)}</Text>
          </View>
        </View>
        
        {trip.notes ? (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{trip.notes}</Text>
              </View>
            </View>
          </>
        ) : null}
      </View>

      <ErrorText message={error} />

      <View style={styles.actionsContainer}>
        <AppButton title="Edit Trip" onPress={() => navigation.navigate('TripForm', { trip })} />
        <AppButton 
          title="Manage Expenses" 
          variant="secondary"
          onPress={() => navigation.getParent()?.navigate('Expenses')} 
        />
        <AppButton 
          title={deleting ? 'Deleting...' : 'Delete Trip'} 
          variant="danger" 
          onPress={onDelete} 
          disabled={deleting} 
        />
      </View>
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
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center'
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6
  },
  destination: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusText: {
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 12
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  metaText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16
  },
  actionsContainer: {
    gap: 12
  }
});

export default TripDetailsScreen;
