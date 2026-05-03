import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { formatCurrency } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';

const getStatusColor = (status) => {
  switch (status) {
    case 'ongoing': return colors.statusOngoing;
    case 'completed': return colors.statusCompleted;
    case 'cancelled': return colors.statusCancelled;
    case 'planned':
    default: return colors.statusPlanned;
  }
};

const StatPill = ({ icon, value, label }) => (
  <View style={styles.statPill}>
    <Ionicons name={icon} size={12} color={colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TripCard = ({ trip, onPress }) => {
  const statusColor = getStatusColor(trip.status);
  const nights = trip.nights ? Number(trip.nights) : null;
  const travelers = trip.travelers ? Number(trip.travelers) : null;
  const placesCount = Array.isArray(trip.selectedPlaces) ? trip.selectedPlaces.length : 0;
  const hasStats = nights || travelers || placesCount > 0;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      android_ripple={{ color: colors.border, borderless: false }}
    >
      <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{trip.title}</Text>
          <View style={[styles.statusChip, { borderColor: statusColor + '55', backgroundColor: statusColor + '14' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{trip.status || 'planned'}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={colors.accent} />
          <Text style={styles.destination} numberOfLines={1}>{trip.destination}</Text>
          {trip.province ? (
            <View style={styles.provincePill}>
              <Text style={styles.provinceText}>{trip.province}</Text>
            </View>
          ) : null}
        </View>

        {hasStats ? (
          <View style={styles.statsRow}>
            {nights ? <StatPill icon="moon-outline" value={nights} label="nights" /> : null}
            {travelers ? <StatPill icon="people-outline" value={travelers} label="travelers" /> : null}
            {placesCount > 0 ? <StatPill icon="location-outline" value={placesCount} label="places" /> : null}
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</Text>
          </View>
          <View style={styles.budgetBadge}>
            <Text style={styles.budget}>{formatCurrency(trip.budget)}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accentBar: {
    width: 5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  destination: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  provincePill: {
    backgroundColor: colors.primary + '14',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  provinceText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  budgetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  budget: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 15,
  },
});

export default TripCard;
