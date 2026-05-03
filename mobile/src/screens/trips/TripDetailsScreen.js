import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { deleteTripApi } from '../../api/tripApi';
import { getTransportsApi } from '../../api/transportApi';
import { formatCurrency } from '../../utils/currencyFormat';
import { formatDate } from '../../utils/dateFormat';
import { getApiErrorMessage } from '../../utils/apiError';
import { getTransportTypeMeta, getStatusMeta, formatLkr } from '../../utils/transportOptions';

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
  const [transports, setTransports] = useState([]);
  const [loadingTransports, setLoadingTransports] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!trip?._id) return;
      let cancelled = false;
      setLoadingTransports(true);
      getTransportsApi({ tripId: trip._id })
        .then((res) => {
          if (cancelled) return;
          const list = res?.data?.transports || res?.data || [];
          setTransports(Array.isArray(list) ? list : []);
        })
        .catch(() => { if (!cancelled) setTransports([]); })
        .finally(() => { if (!cancelled) setLoadingTransports(false); });
      return () => { cancelled = true; };
    }, [trip?._id])
  );

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

        {/* ── Transport ── */}
        {(() => {
          const plannedTransport = Number(budgetBreakdown?.transport || 0);
          const bookedTransport = transports.reduce(
            (sum, t) => sum + Number(t.actualCost || t.estimatedCost || 0),
            0
          );
          const pct = plannedTransport > 0 ? Math.min(1, bookedTransport / plannedTransport) : 0;
          const overBudget = plannedTransport > 0 && bookedTransport > plannedTransport;
          const goToTransportTab = () =>
            navigation.getParent()?.navigate('Transport');

          return (
        <View style={styles.card}>
          <View style={styles.transportHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>Transport</Text>
              <Text style={styles.cardTitle}>
                {transports.length ? `${transports.length} leg${transports.length > 1 ? 's' : ''}` : 'No transport yet'}
              </Text>
            </View>
          </View>

          {plannedTransport > 0 ? (
            <View style={styles.budgetBlock}>
              <View style={styles.budgetBlockRow}>
                <Text style={styles.budgetBlockLabel}>
                  Booked <Text style={styles.budgetBlockBooked}>{formatLkr(bookedTransport)}</Text>
                </Text>
                <Text style={styles.budgetBlockLabel}>
                  Planned <Text style={styles.budgetBlockPlanned}>{formatLkr(plannedTransport)}</Text>
                </Text>
              </View>
              <View style={styles.budgetBlockTrack}>
                <View
                  style={[
                    styles.budgetBlockFill,
                    {
                      width: `${Math.round(pct * 100)}%`,
                      backgroundColor: overBudget ? colors.danger : colors.warning
                    }
                  ]}
                />
              </View>
              {overBudget ? (
                <Text style={styles.budgetOverNote}>
                  Over plan by {formatLkr(bookedTransport - plannedTransport)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {loadingTransports ? (
            <Text style={styles.transportEmptyText}>Loading transport…</Text>
          ) : transports.length === 0 ? (
            <View style={styles.transportEmpty}>
              <View style={styles.transportEmptyHead}>
                <Ionicons name="bus-outline" size={22} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.transportEmptyText}>
                    Browse trains, buses & flights — or quick-log a tuk-tuk, taxi or PickMe.
                  </Text>
                </View>
              </View>
              <View style={styles.transportEmptyActions}>
                <Pressable style={styles.emptyActionPrimary} onPress={goToTransportTab}>
                  <Ionicons name="search-outline" size={15} color={colors.white} />
                  <Text style={styles.emptyActionPrimaryText}>Browse routes</Text>
                </Pressable>
                <Pressable
                  style={styles.emptyActionSecondary}
                  onPress={() =>
                    navigation.navigate('TripAddTransport', {
                      tripId: trip._id,
                      tripTitle: trip.title,
                      lockTrip: true,
                      quickLog: true
                    })
                  }
                >
                  <Ionicons name="flash-outline" size={15} color={colors.primary} />
                  <Text style={styles.emptyActionSecondaryText}>Quick log</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.transportList}>
              {transports.map((item) => {
                const typeMeta = getTransportTypeMeta(item.type);
                const statusMeta = getStatusMeta(item.status);
                const cost = item.actualCost || item.estimatedCost || 0;
                return (
                  <Pressable
                    key={item._id}
                    style={styles.transportItem}
                    onPress={() => navigation.navigate('TripEditTransport', { transport: item })}
                  >
                    <View style={[styles.transportIcon, { backgroundColor: typeMeta.color + '22' }]}>
                      <Ionicons name={typeMeta.icon} size={18} color={typeMeta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.transportRoute} numberOfLines={1}>
                        {item.fromLocation} → {item.toLocation}
                      </Text>
                      <Text style={styles.transportMeta} numberOfLines={1}>
                        {typeMeta.label} · {formatDate(item.departureDate)}
                      </Text>
                    </View>
                    <View style={styles.transportRight}>
                      {cost ? <Text style={styles.transportCost}>{formatLkr(cost)}</Text> : null}
                      {statusMeta ? (
                        <View style={[styles.transportStatus, { backgroundColor: (statusMeta.color || colors.primary) + '22' }]}>
                          <Text style={[styles.transportStatusText, { color: statusMeta.color || colors.primary }]}>
                            {statusMeta.label || item.status}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
              <View style={styles.transportEmptyActions}>
                <Pressable style={styles.emptyActionPrimary} onPress={goToTransportTab}>
                  <Ionicons name="search-outline" size={15} color={colors.white} />
                  <Text style={styles.emptyActionPrimaryText}>Browse routes</Text>
                </Pressable>
                <Pressable
                  style={styles.emptyActionSecondary}
                  onPress={() =>
                    navigation.navigate('TripAddTransport', {
                      tripId: trip._id,
                      tripTitle: trip.title,
                      lockTrip: true,
                      quickLog: true
                    })
                  }
                >
                  <Ionicons name="flash-outline" size={15} color={colors.primary} />
                  <Text style={styles.emptyActionSecondaryText}>Quick log</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
          );
        })()}

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

  // Transport section
  transportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transportEmpty: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  transportEmptyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transportEmptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  transportEmptyActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  emptyActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 11,
  },
  emptyActionPrimaryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyActionSecondaryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  budgetBlock: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 8,
  },
  budgetBlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetBlockLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetBlockBooked: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'none',
    letterSpacing: 0,
  },
  budgetBlockPlanned: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'none',
    letterSpacing: 0,
  },
  budgetBlockTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetBlockFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetOverNote: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '900',
  },
  transportList: {
    gap: 10,
  },
  transportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transportIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportRoute: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  transportMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  transportRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transportCost: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  transportStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  transportStatusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
});

export default TripDetailsScreen;
