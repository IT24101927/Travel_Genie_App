import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import TripCard from '../../components/trips/TripCard';
import colors from '../../constants/colors';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { useTripPlanner } from '../../context/TripPlannerContext';
import { navigateToPlannerDistrictPicker, navigateToPlannerSummary } from '../../navigation/tripPlannerFlow';
import WelcomeGuide from '../../components/common/WelcomeGuide';

const StatBox = ({ icon, value, label, color }) => (
  <View style={styles.statBox}>
    <View style={[styles.statIconBox, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TripListScreen = ({ navigation }) => {
  const planner = useTripPlanner();
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      const response = await getTripsApi();
      setTrips(response?.data?.trips || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load trips'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const plannedCount = trips.filter((t) => t.status === 'planned').length;
  const ongoingCount = trips.filter((t) => t.status === 'ongoing').length;
  const completedCount = trips.filter((t) => t.status === 'completed').length;
  const startTripPlanner = () => {
    planner.startNewTrip();
    navigateToPlannerDistrictPicker(navigation);
  };

  const resumeTripPlanner = () => {
    planner.resumePlanning();
    navigateToPlannerSummary(navigation);
  };

  const ListHeader = () => (
    <View style={styles.headerBlock}>
      <View style={styles.heroSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.greeting}>My Trips</Text>
          <Pressable onPress={() => setShowHelp(true)} style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={26} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.subtext}>Plan, track and relive your Sri Lanka adventures.</Text>
      </View>

      {trips.length > 0 ? (
        <View style={styles.statsRow}>
          <StatBox icon="calendar-outline" value={plannedCount} label="Planned" color={colors.statusPlanned} />
          <StatBox icon="trail-sign-outline" value={ongoingCount} label="Ongoing" color={colors.statusOngoing} />
          <StatBox icon="checkmark-circle-outline" value={completedCount} label="Done" color={colors.statusCompleted} />
        </View>
      ) : null}

      {planner.hasDraft && (
        <Pressable onPress={resumeTripPlanner} style={styles.resumeBanner}>
          <View style={styles.resumeIconBox}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumeTitle}>Resume Trip Plan</Text>
            <Text style={styles.resumeSub}>
              Continue with {planner.selectedDistrict?.name || 'your draft'}
            </Text>
          </View>
          <View style={styles.resumeBadge}>
            <Text style={styles.resumeBadgeText}>DRAFT</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 4 }} />
        </Pressable>
      )}

      <Pressable onPress={startTripPlanner} style={styles.planCta}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCtaGrad}
        >
          <View style={styles.planCtaIconBox}>
            <Ionicons name="trail-sign-outline" size={24} color={colors.white} />
          </View>
          <View style={styles.planCtaCopy}>
            <Text style={styles.planCtaTitle}>Plan a new trip</Text>
            <Text style={styles.planCtaSub}>Pick district, places, hotel & budget</Text>
          </View>
          <View style={styles.planCtaArrow}>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </View>
        </LinearGradient>
      </Pressable>

      {trips.length > 0 ? (
        <Text style={styles.sectionLabel}>Your trips</Text>
      ) : null}

      <ErrorText message={error} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => navigation.navigate('TripDetails', { trip: item })}
          />
        )}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTrips}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState
              title="No trips yet"
              subtitle="Hit the plan button above to build your first Sri Lanka trip."
              icon="airplane"
            />
          ) : null
        }
      />

      <WelcomeGuide 
        forceShow={showHelp} 
        onComplete={() => setShowHelp(false)} 
      />

      {trips.length > 0 ? (
        <Pressable style={styles.fab} onPress={startTripPlanner}>
          <Ionicons name="add" size={30} color={colors.white} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  headerBlock: {
    gap: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heroSection: {
    gap: 4,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  helpBtn: {
    padding: 5,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planCta: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginBottom: 8,
  },
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  resumeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  resumeSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 1,
  },
  resumeBadge: {
    backgroundColor: colors.warning + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resumeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.warning,
  },
  planCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  planCtaIconBox: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCtaCopy: {
    flex: 1,
  },
  planCtaTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  planCtaSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  planCtaArrow: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});

export default TripListScreen;
