import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';


import AppButton from '../../components/common/AppButton';
import AppDatePicker from '../../components/common/AppDatePicker';
import AppInput from '../../components/common/AppInput';
import AppSelect from '../../components/common/AppSelect';
import ErrorText from '../../components/common/ErrorText';

import colors from '../../constants/colors';
import { createTransportApi } from '../../api/transportApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  bookingMethodOptions,
  formatLkr,
  getTransportTypeMeta,
  onDemandTransportTypeOptions,
  scheduleToTransportDraft,
  statusOptions,
  transportTypeOptions
} from '../../utils/transportOptions';

const dateWithTime = (baseDate, time) => {
  const next = new Date(baseDate);
  const match = String(time || '').match(/^(\d{2}):(\d{2})$/);
  if (!match) return next;
  next.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return next;
};

const addMinutes = (date, minutes) => new Date(new Date(date).getTime() + Number(minutes || 0) * 60000);

const buildInitialForm = (schedule) => {
  const draft = schedule ? scheduleToTransportDraft(schedule) : {};
  const departureDate = schedule?.departureTime
    ? dateWithTime(new Date(), schedule.departureTime)
    : new Date();
  const arrivalDate = schedule?.arrivalTime
    ? addMinutes(departureDate, schedule.duration || 0)
    : null;

  return {
    type: draft.type || 'public-bus',
    fromLocation: draft.fromLocation || '',
    toLocation: draft.toLocation || '',
    departureDate,
    arrivalDate,
    provider: draft.provider || '',
    bookingRef: '',
    seatInfo: draft.seatInfo || '',
    bookingMethod: draft.bookingMethod || 'direct',
    estimatedCost: draft.estimatedCost || '',
    actualCost: '',
    currency: 'LKR',
    notes: draft.notes || '',
    status: 'upcoming',
    tripId: ''
  };
};

const formatDateTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TripChip = ({ title, active, onPress }) => (
  <Pressable style={[styles.tripChip, active && styles.tripChipActive]} onPress={onPress}>
    <Text style={[styles.tripChipText, active && styles.tripChipTextActive]} numberOfLines={1}>
      {title}
    </Text>
  </Pressable>
);

const AddTransportScreen = ({ navigation, route }) => {
  const schedule = route.params?.schedule;
  const presetTripId = route.params?.tripId || '';
  const lockTrip = !!route.params?.lockTrip;
  const presetTripTitle = route.params?.tripTitle || '';
  const quickLog = !!route.params?.quickLog && !schedule;
  const typeOptions = quickLog ? onDemandTransportTypeOptions : transportTypeOptions;
  const [form, setForm] = useState(() => {
    const initial = buildInitialForm(schedule);
    const next = presetTripId ? { ...initial, tripId: presetTripId } : initial;
    if (quickLog && !schedule) next.type = 'tuk-tuk';
    return next;
  });
  const [trips, setTrips] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const typeMeta = useMemo(() => getTransportTypeMeta(form.type), [form.type]);

  useFocusEffect(
    useCallback(() => {
      if (lockTrip) return;
      getTripsApi()
        .then((r) => setTrips(r?.data?.trips || []))
        .catch(() => {});
    }, [lockTrip])
  );

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));



  const handleSubmit = async () => {
    if (!form.fromLocation.trim()) return setError('Departure location is required.');
    if (!form.toLocation.trim()) return setError('Arrival location is required.');
    if (!form.departureDate) return setError('Departure date and time are required.');

    try {
      setLoading(true);
      setError('');
      await createTransportApi({
        ...form,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
        actualCost: form.actualCost ? Number(form.actualCost) : 0,
        tripId: form.tripId || undefined
      });
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save transport'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Add Transport</Text>
            <View style={styles.headerSpacer} />
          </View>

          <LinearGradient
            colors={[typeMeta.color, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIcon}>
              <Ionicons name={typeMeta.icon} size={24} color={colors.white} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{schedule ? 'From route board' : 'Trip leg'}</Text>
              <Text style={styles.heroTitle}>{typeMeta.label}</Text>
              <Text style={styles.heroSub} numberOfLines={2}>
                {form.fromLocation && form.toLocation
                  ? `${form.fromLocation} to ${form.toLocation}`
                  : 'Save buses, trains, tuk tuks, taxis and transfers in one place.'}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Route Details</Text>
            <AppSelect
              label="Transport Type"
              value={form.type}
              options={typeOptions}
              onChange={(value) => set('type', value)}
              leftIcon={typeMeta.icon}
            />
            <AppInput
              label="From"
              value={form.fromLocation}
              onChangeText={(v) => set('fromLocation', v)}
              placeholder="Colombo Fort, BIA, Makumbura..."
              leftIcon="location-outline"
            />
            <AppInput
              label="To"
              value={form.toLocation}
              onChangeText={(v) => set('toLocation', v)}
              placeholder="Kandy, Ella, Galle Fort..."
              leftIcon="flag-outline"
            />
            <AppDatePicker
              label="Departure Date and Time"
              value={form.departureDate}
              onChange={(date) => set('departureDate', date)}
              leftIcon="calendar-outline"
              minimumDate={new Date(new Date().setHours(0,0,0,0))}
            />

            <AppDatePicker
              label="Arrival Date and Time"
              value={form.arrivalDate}
              onChange={(date) => set('arrivalDate', date)}
              leftIcon="time-outline"
              placeholder="Optional"
              minimumDate={form.departureDate ? new Date(form.departureDate) : new Date()}
            />


          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Booking</Text>
            <AppInput
              label="Provider / Operator"
              value={form.provider}
              onChangeText={(v) => set('provider', v)}
              placeholder="Sri Lanka Railways, SLTB, PickMe, Uber..."
              leftIcon="business-outline"
            />
            <AppInput
              label="Booking Reference"
              value={form.bookingRef}
              onChangeText={(v) => set('bookingRef', v)}
              placeholder="Ticket ID, app ride ID or counter slip"
              leftIcon="barcode-outline"
            />
            <AppInput
              label="Seat / Class"
              value={form.seatInfo}
              onChangeText={(v) => set('seatInfo', v)}
              placeholder="1st Class AC, Luxury, Seat 14A..."
              leftIcon="ticket-outline"
            />
            <AppSelect
              label="Booking Method"
              value={form.bookingMethod}
              options={bookingMethodOptions}
              onChange={(value) => set('bookingMethod', value)}
              leftIcon="receipt-outline"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cost and Status</Text>
            {form.estimatedCost ? (
              <View style={styles.farePreview}>
                <Ionicons name="cash-outline" size={18} color={colors.success} />
                <Text style={styles.farePreviewText}>Estimated fare {formatLkr(form.estimatedCost)}</Text>
              </View>
            ) : null}
            <AppInput
              label="Estimated Cost (LKR)"
              value={form.estimatedCost}
              onChangeText={(v) => set('estimatedCost', v)}
              placeholder="0"
              keyboardType="numeric"
              leftIcon="cash-outline"
            />
            <AppInput
              label="Actual Cost (LKR)"
              value={form.actualCost}
              onChangeText={(v) => set('actualCost', v)}
              placeholder="0"
              keyboardType="numeric"
              leftIcon="wallet-outline"
            />
            <AppSelect
              label="Status"
              value={form.status}
              options={statusOptions}
              onChange={(value) => set('status', value)}
              leftIcon="checkmark-circle-outline"
            />
          </View>

          {lockTrip ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Linked Trip</Text>
              <View style={styles.lockedTripRow}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
                <Text style={styles.lockedTripText} numberOfLines={1}>
                  {presetTripTitle || 'This trip'}
                </Text>
              </View>
            </View>
          ) : trips.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Link to Trip</Text>
              <View style={styles.tripList}>
                <TripChip title="None" active={form.tripId === ''} onPress={() => set('tripId', '')} />
                {trips.map((trip) => (
                  <TripChip
                    key={trip._id}
                    title={trip.title}
                    active={form.tripId === trip._id}
                    onPress={() => set('tripId', trip._id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <AppInput
              value={form.notes}
              onChangeText={(v) => set('notes', v)}
              placeholder="Platform, pickup point, conductor note, tolls..."
              multiline
              style={styles.notesInput}
            />
          </View>

          <ErrorText message={error} />
          <AppButton title="Save Transport" onPress={handleSubmit} loading={loading} />
          <View style={styles.buttonGap} />
          <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>


      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  headerSpacer: { width: 42 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 15,
    marginBottom: 14
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroCopy: { flex: 1 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  heroTitle: { color: colors.white, fontSize: 20, fontWeight: '900', marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700', marginTop: 3, lineHeight: 17 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 12 },
  farePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success + '12',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12
  },
  farePreviewText: { color: colors.success, fontSize: 13, fontWeight: '900' },
  tripList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tripChip: {
    maxWidth: 160,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border
  },
  tripChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tripChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  tripChipTextActive: { color: colors.white },
  notesInput: { minHeight: 98, alignItems: 'flex-start' },
  buttonGap: { height: 10 },
  lockedTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '12',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary + '33'
  },
  lockedTripText: { color: colors.primary, fontSize: 13, fontWeight: '900', flex: 1 }
});

export default AddTransportScreen;
