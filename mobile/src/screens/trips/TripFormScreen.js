import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { createTripApi, updateTripApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { isRequired } from '../../utils/validators';

const toIsoDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

const TripFormScreen = ({ navigation, route }) => {
  const editingTrip = route.params?.trip;
  const [form, setForm] = useState({
    title: editingTrip?.title || '',
    destination: editingTrip?.destination || '',
    startDate: editingTrip?.startDate ? String(editingTrip.startDate).slice(0, 10) : '',
    endDate: editingTrip?.endDate ? String(editingTrip.endDate).slice(0, 10) : '',
    budget: editingTrip?.budget ? String(editingTrip.budget) : '',
    notes: editingTrip?.notes || '',
    status: editingTrip?.status || 'planned'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const statuses = ['planned', 'ongoing', 'completed', 'cancelled'];

  const onSave = async () => {
    if (!isRequired(form.title) || !isRequired(form.destination)) {
      setError('Title and destination are required.');
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError('Start date and end date are required. Use YYYY-MM-DD.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      startDate: toIsoDate(form.startDate),
      endDate: toIsoDate(form.endDate),
      budget: Number(form.budget || 0),
      notes: form.notes,
      status: form.status
    };

    if (!payload.startDate || !payload.endDate) {
      setError('Please provide valid dates (YYYY-MM-DD).');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editingTrip?._id) {
        await updateTripApi(editingTrip._id, payload);
      } else {
        await createTripApi(payload);
      }
      navigation.navigate('TripList');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save trip'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header & Back Button */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{editingTrip ? 'Edit Trip' : 'New Trip'}</Text>
          <View style={{ width: 36 }} />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <AppInput label="Trip Title" value={form.title} onChangeText={(text) => setForm((p) => ({ ...p, title: text }))} placeholder="Summer Vacation" />
          <AppInput label="Destination" value={form.destination} onChangeText={(text) => setForm((p) => ({ ...p, destination: text }))} placeholder="Paris, France" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline & Budget</Text>
          <View style={styles.row}>
            <View style={styles.flexHalf}>
              <AppInput label="Start Date" value={form.startDate} onChangeText={(text) => setForm((p) => ({ ...p, startDate: text }))} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.flexHalf}>
              <AppInput label="End Date" value={form.endDate} onChangeText={(text) => setForm((p) => ({ ...p, endDate: text }))} placeholder="YYYY-MM-DD" />
            </View>
          </View>
          <AppInput label="Budget Estimate" keyboardType="decimal-pad" value={form.budget} onChangeText={(text) => setForm((p) => ({ ...p, budget: text }))} placeholder="1000" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusContainer}>
            {statuses.map(s => (
              <TouchableOpacity 
                key={s} 
                style={[styles.statusChip, form.status === s && styles.statusChipActive]}
                onPress={() => setForm(p => ({ ...p, status: s }))}
              >
                <Text style={[styles.statusText, form.status === s && styles.statusTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extra Details</Text>
          <AppInput 
            label="Notes (Optional)" 
            value={form.notes} 
            onChangeText={(text) => setForm((p) => ({ ...p, notes: text }))} 
            multiline 
            style={styles.textArea} 
            placeholder="Flight info, packing list..."
          />
        </View>

        <ErrorText message={error} />
        
        <View style={styles.buttonContainer}>
          <AppButton title={saving ? 'Saving...' : (editingTrip ? 'Update Trip' : 'Create Trip')} onPress={onSave} disabled={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 120
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  flexHalf: {
    flex: 1
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  statusChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary
  },
  statusText: {
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  statusTextActive: {
    color: colors.primary
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  buttonContainer: {
    marginTop: 10
  }
});

export default TripFormScreen;
