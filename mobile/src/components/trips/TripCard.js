import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { formatCurrency } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';

const TripCard = ({ trip, onPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return colors.statusOngoing;
      case 'completed': return colors.statusCompleted;
      case 'cancelled': return colors.statusCancelled;
      case 'planned':
      default:
        return colors.statusPlanned;
    }
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{trip.title}</Text>
        <View style={[styles.statusChip, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
            {trip.status || 'planned'}
          </Text>
        </View>
      </View>
      
      <View style={styles.locationRow}>
        <Ionicons name="location" size={16} color={colors.accent} />
        <Text style={styles.destination}>{trip.destination}</Text>
      </View>
      
      <View style={styles.footerRow}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</Text>
        </View>
        <Text style={styles.budget}>{formatCurrency(trip.budget)}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginRight: 10
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  destination: {
    marginLeft: 6,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  budget: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16
  }
});

export default TripCard;
