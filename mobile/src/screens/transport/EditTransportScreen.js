import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { updateTransportApi, deleteTransportApi } from '../../api/transportApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';

const TYPES = ['flight', 'bus', 'train', 'car', 'ferry', 'other'];
const STATUSES = ['upcoming', 'completed', 'cancelled'];

const STATUS_COLORS = {
  upcoming: colors.info,
  completed: colors.success,
  cancelled: colors.danger
};

const ChipRow = ({ options, selected, onSelect, colorMap }) => (
  <View style={styles.chipRow}>
    {options.map((opt) => {
      const isSelected = selected === opt;
      const chipColor = colorMap?.[opt] || colors.primary;
      return (
        <View
          key={opt}
          style={[
            styles.chip,
            isSelected && { backgroundColor: chipColor, borderColor: chipColor }
          ]}
        >
          <Text
            style={[styles.chipText, isSelected && styles.chipTextSelected]}
            onPress={() => onSelect(opt)}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </Text>
        </View>
      );
    })}
  </View>
);

const EditTransportScreen = ({ route, navigation }) => {
  const { transport } = route.params;

  const [form, setForm] = useState({
    type: transport.type || 'flight',
    fromLocation: transport.fromLocation || '',
    toLocation: transport.toLocation || '',
    departureDate: transport.departureDate ? new Date(transport.departureDate) : new Date(),
    arrivalDate: transport.arrivalDate ? new Date(transport.arrivalDate) : null,
    provider: transport.provider || '',
    bookingRef: transport.bookingRef || '',
    seatInfo: transport.seatInfo || '',
    cost: transport.cost ? String(transport.cost) : '',
    notes: transport.notes || '',
    status: transport.status || 'upcoming',
    tripId: transport.tripId?._id || transport.tripId || ''
  });
  const [trips, setTrips] = useState([]);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      getTripsApi()
        .then((r) => setTrips(r?.data?.trips || []))
        .catch(() => {});
    }, [])
  );

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  };

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
      const payload = {
        ...form,
        cost: form.cost ? Number(form.cost) : 0,
        tripId: form.tripId || undefined
      };
      await updateTransportApi(transport._id, payload);
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
      'Are you sure you want to delete this transport record?',
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Transport Type</Text>
        <ChipRow options={TYPES} selected={form.type} onSelect={(v) => set('type', v)} />

        <AppInput
          label="From"
          value={form.fromLocation}
          onChangeText={(v) => set('fromLocation', v)}
          placeholder="Departure city or airport"
          leftIcon="location-outline"
        />
        <AppInput
          label="To"
          value={form.toLocation}
          onChangeText={(v) => set('toLocation', v)}
          placeholder="Arrival city or airport"
          leftIcon="location"
        />

        <AppInput
          label="Departure Date"
          value={formatDate(form.departureDate)}
          editable={false}
          onContainerPress={() => setPickerTarget('departure')}
          leftIcon="calendar-outline"
          rightIcon="chevron-down-outline"
        />
        <AppInput
          label="Arrival Date (optional)"
          value={formatDate(form.arrivalDate)}
          editable={false}
          onContainerPress={() => setPickerTarget('arrival')}
          leftIcon="calendar"
          rightIcon="chevron-down-outline"
        />

        <AppInput
          label="Provider / Operator"
          value={form.provider}
          onChangeText={(v) => set('provider', v)}
          placeholder="e.g. Emirates, FlixBus"
          leftIcon="business-outline"
        />
        <AppInput
          label="Booking Reference"
          value={form.bookingRef}
          onChangeText={(v) => set('bookingRef', v)}
          placeholder="e.g. ABC123"
          leftIcon="barcode-outline"
        />
        <AppInput
          label="Seat / Berth Info"
          value={form.seatInfo}
          onChangeText={(v) => set('seatInfo', v)}
          placeholder="e.g. 14A"
          leftIcon="person-outline"
        />
        <AppInput
          label="Cost"
          value={form.cost}
          onChangeText={(v) => set('cost', v)}
          placeholder="0.00"
          keyboardType="numeric"
          leftIcon="cash-outline"
        />

        <Text style={styles.sectionLabel}>Status</Text>
        <ChipRow
          options={STATUSES}
          selected={form.status}
          onSelect={(v) => set('status', v)}
          colorMap={STATUS_COLORS}
        />

        {trips.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Link to Trip</Text>
            <View style={styles.tripList}>
              {[{ _id: '', title: 'None' }, ...trips].map((t) => (
                <View
                  key={t._id}
                  style={[
                    styles.tripChip,
                    form.tripId === t._id && styles.tripChipSelected
                  ]}
                >
                  <Text
                    style={[
                      styles.tripChipText,
                      form.tripId === t._id && styles.tripChipTextSelected
                    ]}
                    onPress={() => set('tripId', t._id)}
                    numberOfLines={1}
                  >
                    {t.title}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <AppInput
          label="Notes"
          value={form.notes}
          onChangeText={(v) => set('notes', v)}
          placeholder="Terminal info, gate, etc."
          multiline
          style={{ height: 80 }}
        />

        <ErrorText message={error} />
        <AppButton title="Update Transport" onPress={handleUpdate} loading={loading} />
        <AppButton
          title="Delete Transport"
          variant="danger"
          onPress={handleDelete}
          loading={deleting}
        />
        <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>

      <DateTimePickerModal
        isVisible={!!pickerTarget}
        mode="date"
        date={
          pickerTarget === 'arrival' && form.arrivalDate
            ? new Date(form.arrivalDate)
            : new Date(form.departureDate)
        }
        onConfirm={handleDateConfirm}
        onCancel={() => setPickerTarget(null)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 18,
    paddingBottom: 40
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 10,
    marginTop: 4
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  chipTextSelected: {
    color: colors.white
  },
  tripList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18
  },
  tripChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 160
  },
  tripChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tripChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  tripChipTextSelected: {
    color: colors.white
  }
});

export default EditTransportScreen;
