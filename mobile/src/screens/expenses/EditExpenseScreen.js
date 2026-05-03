import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import expenseCategories from '../../constants/expenseCategories';
import { deleteExpenseApi, updateExpenseApi } from '../../api/expenseApi';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';

const PAYMENT_METHODS = [
  { id: 'cash',          label: 'Cash',          icon: 'cash-outline' },
  { id: 'card',          label: 'Card',          icon: 'card-outline' },
  { id: 'wallet',        label: 'Wallet',        icon: 'phone-portrait-outline' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'swap-horizontal-outline' },
  { id: 'other',         label: 'Other',         icon: 'ellipsis-horizontal-outline' },
];

import { DISPLAY_CURRENCIES as CURRENCIES } from '../../utils/currencyFormat';

const EditExpenseScreen = ({ navigation, route }) => {
  const expense = route.params?.expense;
  const expenseTripId = expense?.tripId?._id || expense?.tripId || '';
  const expenseTripTitle = expense?.tripId?.title || '';

  const [form, setForm] = useState({
    tripId: expenseTripId,
    title: expense?.title || '',
    category: expense?.category || 'food',
    status: expense?.status || 'paid',
    amount: expense?.amount ? String(expense.amount) : '',
    currency: expense?.currency || 'LKR',
    date: expense?.date ? new Date(expense.date) : new Date(),
    paymentMethod: expense?.paymentMethod || 'cash',
    tags: expense?.tags?.join(', ') || '',
    notes: expense?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setForm((p) => ({ ...p, date: selectedDate }));
    }
  };

  const formatDisplayDate = (d) => {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const onSave = async () => {
    if (!form.tripId) { setError('Please select a trip.'); return; }
    if (!form.title.trim()) { setError('Description is required.'); return; }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setError('Amount must be greater than 0.'); return; }

    const tagsArray = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      ...form,
      amount,
      tags: tagsArray,
      date: form.date.toISOString(),
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
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
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
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Edit Expense</Text>
              {expenseTripTitle ? (
                <Text style={styles.headerSub} numberOfLines={1}>{expenseTripTitle}</Text>
              ) : null}
            </View>
            <Pressable style={styles.deleteBtn} onPress={onDelete} disabled={deleting}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>

          {/* Amount Section */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <View style={styles.amountRow}>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text style={styles.currencySymbol}>
                  {CURRENCIES.find(c => c.code === form.currency)?.flag} {form.currency}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.amountInput}
                keyboardType="decimal-pad"
                value={form.amount}
                onChangeText={(text) => setForm((p) => ({ ...p, amount: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                maxLength={10}
              />
            </View>
          </View>

          {/* Currency Picker Modal */}
          {showCurrencyPicker && (
            <Modal transparent animationType="fade">
              <Pressable style={styles.dateOverlay} onPress={() => setShowCurrencyPicker(false)}>
                <View style={styles.currencyModal}>
                  <Text style={styles.currencyModalTitle}>Select Currency</Text>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={styles.currencyOption}
                      onPress={() => {
                        setForm((p) => ({ ...p, currency: c.code }));
                        setShowCurrencyPicker(false);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 20 }}>{c.flag}</Text>
                        <Text style={[styles.currencyCode, form.currency === c.code && styles.currencyCodeActive]}>
                          {c.code}
                        </Text>
                      </View>
                      {form.currency === c.code && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <AppInput
              label=""
              value={form.title}
              onChangeText={(text) => setForm((p) => ({ ...p, title: text }))}
              placeholder="e.g. Lunch at a beachside café"
            />
          </View>

          {/* Expense Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Status</Text>
            <View style={styles.catGrid}>
              <TouchableOpacity
                style={[styles.payChip, form.status === 'planned' && styles.payChipActive]}
                onPress={() => setForm(p => ({ ...p, status: 'planned' }))}
              >
                <Ionicons name="calendar-outline" size={16} color={form.status === 'planned' ? colors.primary : colors.textMuted} />
                <Text style={[styles.payText, form.status === 'planned' && styles.payTextActive]}>Planned</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.payChip, form.status === 'paid' && styles.payChipActive]}
                onPress={() => setForm(p => ({ ...p, status: 'paid' }))}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={form.status === 'paid' ? colors.primary : colors.textMuted} />
                <Text style={[styles.payText, form.status === 'paid' && styles.payTextActive]}>Paid</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.dateText}>{formatDisplayDate(form.date)}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          {showDatePicker && Platform.OS === 'ios' && (
            <Modal transparent animationType="fade">
              <Pressable style={styles.dateOverlay} onPress={() => setShowDatePicker(false)}>
                <View style={styles.dateModal}>
                  <View style={styles.dateModalHeader}>
                    <Text style={styles.dateModalTitle}>Select Date</Text>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateModalDone}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={form.date}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    textColor={colors.textPrimary}
                  />
                </View>
              </Pressable>
            </Modal>
          )}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={form.date}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.catGrid}>
              {expenseCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    form.category === cat.id && {
                      backgroundColor: cat.color + '18',
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setForm((p) => ({ ...p, category: cat.id }))}
                >
                  <Ionicons
                    name={cat.icon}
                    size={18}
                    color={form.category === cat.id ? cat.color : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.catText,
                      form.category === cat.id && { color: cat.color },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.catGrid}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.payChip,
                    form.paymentMethod === method.id && styles.payChipActive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, paymentMethod: method.id }))}
                >
                  <Ionicons
                    name={method.icon}
                    size={16}
                    color={form.paymentMethod === method.id ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.payText,
                      form.paymentMethod === method.id && styles.payTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <AppInput
              label=""
              value={form.tags}
              onChangeText={(text) => setForm((p) => ({ ...p, tags: text }))}
              placeholder="e.g. food, drinks, beach"
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <AppInput
              label=""
              value={form.notes}
              onChangeText={(text) => setForm((p) => ({ ...p, notes: text }))}
              multiline
              style={styles.textArea}
              placeholder="Any additional details..."
            />
          </View>

          <ErrorText message={error} />

          <View style={styles.buttons}>
            <AppButton
              title="Update Expense"
              onPress={onSave}
              disabled={saving}
              loading={saving}
            />
            <View style={styles.gap} />
            <AppButton
              title="Delete Expense"
              variant="danger"
              onPress={onDelete}
              disabled={deleting}
              loading={deleting}
            />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.danger + '10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 200,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  amountInput: {
    fontSize: 34,
    fontWeight: '900',
    paddingVertical: 8,
    flex: 1,
    color: colors.textPrimary,
  },
  currencyModal: {
    backgroundColor: colors.surface,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  currencyModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currencyCodeActive: {
    color: colors.primary,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 4,
  },
  noTrips: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  tripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tripText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    maxWidth: 120,
  },
  tripTextActive: {
    color: colors.white,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  dateText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dateModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateModalTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  dateModalDone: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  payChipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  payText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  payTextActive: {
    color: colors.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttons: {
    marginTop: 10,
  },
  gap: {
    height: 12,
  },
});

export default EditExpenseScreen;
