import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import expenseCategories from '../../constants/expenseCategories';
import { deleteExpenseApi, updateExpenseApi } from '../../api/expenseApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';

const EditExpenseScreen = ({ navigation, route }) => {
  const expense = route.params?.expense;
  const [form, setForm] = useState({
    tripId: expense?.tripId || '',
    category: expense?.category || 'transport',
    amount: expense?.amount ? String(expense.amount) : '',
    date: expense?.date ? new Date(expense.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    paymentMethod: expense?.paymentMethod || 'cash',
    notes: expense?.notes || ''
  });
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const paymentMethods = ['cash', 'card', 'wallet', 'bank_transfer', 'other'];

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const response = await getTripsApi();
        setTrips(response?.data?.trips || []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load trips'));
      }
    };

    loadTrips();
  }, []);

  const onSave = async () => {
    if (!form.tripId) {
      setError('Please select a trip ID.');
      return;
    }

    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    const payload = {
      ...form,
      amount,
      date: new Date(form.date).toISOString()
    };

    try {
      setSaving(true);
      setError('');
      await updateExpenseApi(expense._id, payload);
      navigation.navigate('ExpenseList');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update expense'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            setError('');
            await deleteExpenseApi(expense._id);
            navigation.navigate('ExpenseList');
          } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to delete expense'));
          } finally {
            setDeleting(false);
          }
        }
      }
    ]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link to Trip</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {trips.length === 0 ? <Text style={styles.noTrips}>No trips found</Text> : trips.map((trip) => (
              <TouchableOpacity
                key={trip._id}
                style={[styles.tripChip, form.tripId === trip._id && styles.tripChipActive]}
                onPress={() => setForm((p) => ({ ...p, tripId: trip._id }))}
              >
                <Ionicons name="airplane" size={14} color={form.tripId === trip._id ? colors.primary : colors.textSecondary} />
                <Text style={[styles.tripText, form.tripId === trip._id && styles.tripTextActive]}>
                  {trip.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.amountContainer}>
             <Text style={styles.currencySymbol}>$</Text>
             <AppInput 
               label="" 
               style={styles.amountInput} 
               keyboardType="decimal-pad" 
               value={form.amount} 
               onChangeText={(text) => setForm((p) => ({ ...p, amount: text }))}
               placeholder="0.00" 
             />
          </View>
          
          <AppInput label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(text) => setForm((p) => ({ ...p, date: text }))} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipGrid}>
             {expenseCategories.map(cat => (
               <TouchableOpacity 
                 key={cat} 
                 style={[styles.catChip, form.category === cat && styles.catChipActive]}
                 onPress={() => setForm(p => ({ ...p, category: cat }))}
               >
                 <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>{cat}</Text>
               </TouchableOpacity>
             ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.chipGrid}>
             {paymentMethods.map(method => (
               <TouchableOpacity 
                 key={method} 
                 style={[styles.catChip, form.paymentMethod === method && styles.catChipActive]}
                 onPress={() => setForm(p => ({ ...p, paymentMethod: method }))}
               >
                 <Text style={[styles.catText, form.paymentMethod === method && styles.catTextActive]}>{method.replace('_', ' ')}</Text>
               </TouchableOpacity>
             ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <AppInput 
            label="Optional Notes" 
            value={form.notes} 
            onChangeText={(text) => setForm((p) => ({ ...p, notes: text }))} 
            multiline 
            style={styles.textArea}
            placeholder="Dinner with crew..."
          />
        </View>

        <ErrorText message={error} />
        <View style={styles.buttons}>
          <AppButton title={saving ? 'Saving...' : 'Update Expense'} onPress={onSave} disabled={saving} />
          <View style={styles.gap} />
          <AppButton title={deleting ? 'Deleting...' : 'Delete Expense'} variant="danger" onPress={onDelete} disabled={deleting} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 40
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
  chipRow: {
    gap: 10,
    paddingBottom: 8
  },
  noTrips: {
    color: colors.textMuted,
    fontStyle: 'italic'
  },
  tripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  tripChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15'
  },
  tripText: {
    color: colors.textSecondary,
    fontWeight: '700'
  },
  tripTextActive: {
    color: colors.primary
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 24
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '800',
    paddingVertical: 18,
    flex: 1
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  catChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary
  },
  catText: {
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  catTextActive: {
    color: colors.primary
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  buttons: {
    marginTop: 10
  },
  gap: {
    height: 12
  }
});

export default EditExpenseScreen;
