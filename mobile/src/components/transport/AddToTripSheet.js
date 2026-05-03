import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import { getTripsApi } from '../../api/tripApi';
import { formatDate } from '../../utils/dateFormat';

const ATTACHABLE_STATUSES = new Set(['planned', 'ongoing']);

const AddToTripSheet = ({ visible, schedule, onClose, onPick }) => {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getTripsApi()
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.trips || [];
        const active = list.filter(
          (t) => !t.status || ATTACHABLE_STATUSES.has(String(t.status).toLowerCase())
        );
        setTrips(active);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your trips.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [visible]);

  const headerLine = schedule
    ? `${schedule.departureStation || schedule.fromLocation || ''} → ${schedule.arrivalStation || schedule.toLocation || ''}`
    : '';

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="airplane-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Add to a trip</Text>
              {headerLine ? (
                <Text style={styles.subtitle} numberOfLines={1}>{headerLine}</Text>
              ) : null}
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading your trips…</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : trips.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="airplane-outline" size={26} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No active trips</Text>
              <Text style={styles.emptyText}>
                You can still log this route to your transport history.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.tripList} showsVerticalScrollIndicator={false}>
              {trips.map((trip) => (
                <Pressable
                  key={trip._id}
                  style={styles.tripRow}
                  onPress={() => onPick({ tripId: trip._id, tripTitle: trip.title })}
                >
                  <View style={styles.tripIcon}>
                    <Ionicons name="map-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripTitle} numberOfLines={1}>{trip.title}</Text>
                    <Text style={styles.tripMeta} numberOfLines={1}>
                      {trip.destination || trip.districtName || 'Trip'}
                      {trip.startDate ? ` · ${formatDate(trip.startDate)}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </ScrollView>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '78%'
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 14
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2
  },
  loadingBox: { paddingVertical: 28, alignItems: 'center', gap: 8 },
  loadingText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '700', paddingVertical: 16, textAlign: 'center' },
  emptyBox: { paddingVertical: 22, alignItems: 'center', gap: 6 },
  emptyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  emptyText: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },
  tripList: { maxHeight: 360 },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8
  },
  tripIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tripTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  tripMeta: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
});

export default AddToTripSheet;
