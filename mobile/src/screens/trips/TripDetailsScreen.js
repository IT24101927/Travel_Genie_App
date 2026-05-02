import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { deleteTripApi } from '../../api/tripApi';
import { formatCurrency } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';
import { getApiErrorMessage } from '../../utils/apiError';

const formatPlanAmount = (amount) =>
  `LKR ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const getStatusColor = (status) => {
  switch (status) {
    case 'ongoing': return colors.statusOngoing;
    case 'completed': return colors.statusCompleted;
    case 'cancelled': return colors.statusCancelled;
    case 'planned':
    default: return colors.statusPlanned;
  }
};

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBox}>
      <Ionicons name={icon} size={19} color={colors.primary} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const StatBubble = ({ icon, value, label }) => (
  <View style={styles.statBubble}>
    <Ionicons name={icon} size={18} color={colors.primary} />
    <Text style={styles.statBubbleValue}>{value}</Text>
    <Text style={styles.statBubbleLabel}>{label}</Text>
  </View>
);

const BudgetBar = ({ label, amount, total, color }) => {
  const pct = total > 0 ? Math.min(1, (Number(amount) || 0) / total) : 0;
  return (
    <View style={styles.budgetBarRow}>
      <View style={styles.budgetBarMeta}>
        <View style={[styles.budgetBarDot, { backgroundColor: color }]} />
        <Text style={styles.budgetBarLabel}>{label}</Text>
        <Text style={styles.budgetBarAmount}>{formatPlanAmount(amount)}</Text>
      </View>
      <View style={styles.budgetBarTrack}>
        <View style={[styles.budgetBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

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
        },
      },
    ]);
  };

  if (!trip) {
    return (
      <View style={styles.container}>
        <Text style={styles.fallbackText}>Trip not found.</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(trip.status);
  const selectedPlaces = Array.isArray(trip.selectedPlaces) ? trip.selectedPlaces : [];
  const selectedHotel = trip.selectedHotel && typeof trip.selectedHotel === 'object' ? trip.selectedHotel : null;
  const rawBudgetBreakdown = trip.budgetBreakdown && typeof trip.budgetBreakdown === 'object' ? trip.budgetBreakdown : null;
  const budgetBreakdown = rawBudgetBreakdown && Object.keys(rawBudgetBreakdown).length ? rawBudgetBreakdown : null;
  const hasPlannerDetails = !!(
    trip.districtName || trip.province || selectedPlaces.length || selectedHotel || trip.travelers || trip.nights || budgetBreakdown
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Gradient Hero ── */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[statusColor + 'CC', statusColor + '44', colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroGrad}
          >
            <Pressable style={styles.backBtn} onPress={() => navigation.navigate('TripList')}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.heroCenter}>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
                <View style={[styles.statusPillDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusPillText, { color: statusColor }]}>{trip.status || 'planned'}</Text>
              </View>

              <Text style={styles.heroTitle}>{trip.title}</Text>

              <View style={styles.heroDestRow}>
                <Ionicons name="location" size={16} color={colors.accent} />
                <Text style={styles.heroDestText}>{trip.destination}</Text>
                {trip.province ? (
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillText}>{trip.province}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Planner Stats ── */}
        {hasPlannerDetails && (trip.nights || trip.travelers || selectedPlaces.length > 0) ? (
          <View style={styles.statsStrip}>
            {trip.nights ? <StatBubble icon="moon-outline" value={trip.nights} label="Nights" /> : null}
            {trip.travelers ? <StatBubble icon="people-outline" value={trip.travelers} label="Travelers" /> : null}
            {selectedPlaces.length > 0 ? <StatBubble icon="location-outline" value={selectedPlaces.length} label="Places" /> : null}
          </View>
        ) : null}

        {/* ── Core Details ── */}
        <View style={styles.card}>
          <InfoRow icon="calendar" label="Travel dates" value={`${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`} />
          <View style={styles.cardDivider} />
          <InfoRow icon="wallet" label="Total budget" value={formatCurrency(trip.budget)} />
          {trip.notes ? (
            <>
              <View style={styles.cardDivider} />
              <InfoRow icon="document-text" label="Notes" value={trip.notes} />
            </>
          ) : null}
        </View>

        {/* ── Itinerary Plan ── */}
        {hasPlannerDetails ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardEyebrow}>Itinerary</Text>
                <Text style={styles.cardTitle}>{trip.districtName || trip.destination}</Text>
              </View>
              {trip.province ? (
                <View style={styles.provincePill}>
                  <Text style={styles.provincePillText}>{trip.province}</Text>
                </View>
              ) : null}
            </View>

            {selectedHotel ? (
              <View style={styles.hotelRow}>
                <View style={styles.hotelIconBox}>
                  <Ionicons name="bed-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Selected hotel</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{selectedHotel.name}</Text>
                  {selectedHotel.pricePerNight ? (
                    <Text style={styles.hotelPrice}>{formatPlanAmount(selectedHotel.pricePerNight)} / night</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {selectedPlaces.length > 0 ? (
              <View style={styles.placesSection}>
                <Text style={styles.cardSectionTitle}>Places</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placesScroll}>
                  {selectedPlaces.map((place) => (
                    <View key={String(place.id || place.place_id || place.name)} style={styles.placeChip}>
                      <Ionicons name="location" size={12} color={colors.accent} />
                      <Text style={styles.placeChipText} numberOfLines={1}>{place.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── Budget Breakdown ── */}
        {budgetBreakdown ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Budget breakdown</Text>
            <View style={styles.budgetBars}>
              <BudgetBar label="Hotel" amount={budgetBreakdown.hotel} total={budgetBreakdown.total} color={colors.info} />
              <BudgetBar label="Food" amount={budgetBreakdown.food} total={budgetBreakdown.total} color={colors.success} />
              <BudgetBar label="Transport" amount={budgetBreakdown.transport} total={budgetBreakdown.total} color={colors.warning} />
              <BudgetBar label="Activities" amount={budgetBreakdown.activities} total={budgetBreakdown.total} color={colors.accent} />
            </View>
            {budgetBreakdown.perDay ? (
              <Text style={styles.perDayNote}>Non-hotel estimate: {formatPlanAmount(budgetBreakdown.perDay)} per day</Text>
            ) : null}
          </View>
        ) : null}

        <ErrorText message={error} />

        {/* ── Actions ── */}
        <View style={styles.actionsBlock}>
          {hasPlannerDetails ? (
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionBtn, styles.actionBtnPrimary, { width: '100%' }]}
                onPress={() => navigation.navigate('TripPlanner', { trip })}
              >
                <Ionicons name="map-outline" size={18} color={colors.white} />
                <Text style={styles.actionBtnTextPrimary}>Edit Plan</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            style={[styles.actionBtn, styles.actionBtnSecondary, { width: '100%' }]}
            onPress={() => navigation.getParent()?.navigate('Expenses')}
          >
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnTextSecondary}>Manage Expenses</Text>
          </Pressable>

          <AppButton
            title={deleting ? 'Deleting...' : 'Delete Trip'}
            variant="danger"
            onPress={onDelete}
            disabled={deleting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 120,
  },
  fallbackText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },

  // Hero
  heroWrap: {
    marginBottom: 8,
  },
  heroGrad: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  heroCenter: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    paddingHorizontal: 8,
  },
  heroDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDestText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  heroPill: {
    backgroundColor: colors.primary + '16',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroPillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBubbleValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  statBubbleLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  cardSectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },

  // Province pill
  provincePill: {
    backgroundColor: colors.primary + '14',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  provincePillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },

  // Hotel row
  hotelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hotelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hotelPrice: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },

  // Places
  placesSection: {
    gap: 8,
  },
  placesScroll: {
    gap: 8,
    paddingRight: 4,
    paddingBottom: 2,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 120,
  },

  // Budget bars
  budgetBars: {
    gap: 12,
  },
  budgetBarRow: {
    gap: 6,
  },
  budgetBarMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetBarDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  budgetBarLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  budgetBarAmount: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  budgetBarTrack: {
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  perDayNote: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 6,
  },

  // Actions
  actionsBlock: {
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnTextPrimary: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnTextSecondary: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default TripDetailsScreen;
