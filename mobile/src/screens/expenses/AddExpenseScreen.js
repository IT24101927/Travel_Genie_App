import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import expenseCategories from '../../constants/expenseCategories';
import { createExpenseApi } from '../../api/expenseApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';

const AddExpenseScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    tripId: '',
    category: 'transport',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    notes: ''
  });
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const paymentMethods = ['cash', 'card', 'wallet', 'bank_transfer', 'other'];

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const response = await getTripsApi();
        const list = response?.data?.trips || [];
        setTrips(list);
        if (!form.tripId && list.length > 0) {
          setForm((p) => ({ ...p, tripId: list[0]._id }));
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load trips'));
      }
    };

    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await createExpenseApi(payload);
      navigation.navigate('ExpenseList');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create expense'));
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
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 36 }} />
        </View>
        
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
        <View style={styles.buttonContainer}>
          <AppButton title={saving ? 'Saving...' : 'Save Expense'} onPress={onSave} disabled={saving} />
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
  buttonContainer: {
    marginTop: 10
  }
});

export default AddExpenseScreen;
