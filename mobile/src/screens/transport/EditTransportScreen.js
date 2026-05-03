import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { LinearGradient } from 'expo-linear-gradient';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppSelect from '../../components/common/AppSelect';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { deleteTransportApi, updateTransportApi } from '../../api/transportApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  bookingMethodOptions,
  formatLkr,
  getStatusMeta,
  getTransportTypeMeta,
  statusOptions,
  transportTypeOptions
} from '../../utils/transportOptions';

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

const EditTransportScreen = ({ route, navigation }) => {
  const { transport } = route.params;
  const [form, setForm] = useState({
    type: transport.type || 'public-bus',
    fromLocation: transport.fromLocation || '',
    toLocation: transport.toLocation || '',
    departureDate: transport.departureDate ? new Date(transport.departureDate) : new Date(),
    arrivalDate: transport.arrivalDate ? new Date(transport.arrivalDate) : null,
    provider: transport.provider || '',
    bookingRef: transport.bookingRef || '',
    seatInfo: transport.seatInfo || '',
    bookingMethod: transport.bookingMethod || 'direct',
    estimatedCost: transport.estimatedCost ? String(transport.estimatedCost) : '',
    actualCost: transport.actualCost ? String(transport.actualCost) : '',
    currency: transport.currency || 'LKR',
    notes: transport.notes || '',
    status: transport.status || 'upcoming',
    tripId: transport.tripId?._id || transport.tripId || ''
  });
  const [trips, setTrips] = useState([]);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const typeMeta = useMemo(() => getTransportTypeMeta(form.type), [form.type]);
  const statusMeta = useMemo(() => getStatusMeta(form.status), [form.status]);

  useFocusEffect(
    useCallback(() => {
      getTripsApi()
        .then((r) => setTrips(r?.data?.trips || []))
        .catch(() => {});
    }, [])
  );

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleDateConfirm = (date) => {
    if (pickerTarget === 'departure') set('departureDate', date);
    if (pickerTarget === 'arrival') set('arrivalDate', date);
    setPickerTarget(null);
  };

  const handleUpdate = async () => {
    if (!form.fromLocation.trim()) return setError('Departure location is required.');
    if (!form.toLocation.trim()) return setError('Arrival location is required.');

    try {
      setLoading(true);
      setError('');
      await updateTransportApi(transport._id, {
        ...form,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
        actualCost: form.actualCost ? Number(form.actualCost) : 0,
        tripId: form.tripId || undefined
      });
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update transport'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transport',
      'Are you sure you want to delete this transport leg?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteTransportApi(transport._id);
              navigation.goBack();
            } catch (err) {
              setError(getApiErrorMessage(err, 'Failed to delete transport'));
              setDeleting(false);
            }
          }
        }
      ]
    );
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
            <Text style={styles.headerTitle}>Edit Transport</Text>
            <Pressable style={styles.deleteTopBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
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
              <Text style={styles.heroEyebrow}>{statusMeta.label}</Text>
              <Text style={styles.heroTitle}>{form.fromLocation || 'Start'} to {form.toLocation || 'Destination'}</Text>
              <Text style={styles.heroSub} numberOfLines={1}>
                {[typeMeta.label, form.provider].filter(Boolean).join(' - ')}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.statusStrip}>
            <View style={[styles.statusIcon, { backgroundColor: statusMeta.color + '16' }]}>
              <Ionicons name={statusMeta.icon} size={17} color={statusMeta.color} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Current Status</Text>
              <Text style={[styles.statusValue, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
            {Number(form.actualCost || form.estimatedCost || 0) > 0 ? (
              <Text style={styles.statusFare}>{formatLkr(form.actualCost || form.estimatedCost)}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Route Details</Text>
            <AppSelect
              label="Transport Type"
              value={form.type}
              options={transportTypeOptions}
              onChange={(value) => set('type', value)}
              leftIcon={typeMeta.icon}
            />
            <AppInput
              label="From"
              value={form.fromLocation}
              onChangeText={(v) => set('fromLocation', v)}
              placeholder="Departure point"
              leftIcon="location-outline"
            />
            <AppInput
              label="To"
              value={form.toLocation}
              onChangeText={(v) => set('toLocation', v)}
              placeholder="Arrival point"
              leftIcon="flag-outline"
            />
            <AppInput
              label="Departure Date and Time"
              value={formatDateTime(form.departureDate)}
              editable={false}
              onContainerPress={() => setPickerTarget('departure')}
              leftIcon="calendar-outline"
              rightIcon="chevron-down-outline"
            />
            <AppInput
              label="Arrival Date and Time"
              value={formatDateTime(form.arrivalDate)}
              editable={false}
              onContainerPress={() => setPickerTarget('arrival')}
              leftIcon="time-outline"
              rightIcon="chevron-down-outline"
              placeholder="Optional"
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
              placeholder="Ticket ID or ride ID"
              leftIcon="barcode-outline"
            />
            <AppInput
              label="Seat / Class"
              value={form.seatInfo}
              onChangeText={(v) => set('seatInfo', v)}
              placeholder="Seat 14A, 1st Class AC..."
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
              leftIcon={statusMeta.icon}
            />
          </View>

          {trips.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Linked Trip</Text>
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
              placeholder="Pickup point, platform, seat notes..."
              multiline
              style={styles.notesInput}
            />
          </View>

          <ErrorText message={error} />
          <AppButton title="Save Changes" onPress={handleUpdate} loading={loading} />
          <View style={styles.buttonGap} />
          <AppButton title="Delete Transport" variant="danger" onPress={handleDelete} loading={deleting} />
          <View style={styles.buttonGap} />
          <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>

        <DateTimePickerModal
          isVisible={!!pickerTarget}
          mode="datetime"
          date={
            pickerTarget === 'arrival' && form.arrivalDate
              ? new Date(form.arrivalDate)
              : new Date(form.departureDate)
          }
          onConfirm={handleDateConfirm}
          onCancel={() => setPickerTarget(null)}
        />
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
  deleteTopBtn: {
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  heroTitle: { color: colors.white, fontSize: 18, fontWeight: '900', marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700', marginTop: 3 },
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12
  },
  statusIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  statusValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  statusFare: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 12 },
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
  buttonGap: { height: 10 }
});

export default EditTransportScreen;
