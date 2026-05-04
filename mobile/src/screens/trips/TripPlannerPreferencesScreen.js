import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppDatePicker from '../../components/common/AppDatePicker';
import colors from '../../constants/colors';

import { useTripPlanner } from '../../context/TripPlannerContext';
import {
  navigateToPlannerHotelPicker,
  navigateToPlannerPlacePicker,
  navigateToTripList,
} from '../../navigation/tripPlannerFlow';

const TRIP_TYPES = [
  { value: 'solo', label: 'Solo', icon: 'person-outline', people: 1, sub: 'Just me' },
  { value: 'couple', label: 'Couple', icon: 'people-outline', people: 2, sub: '2 people' },
  { value: 'family', label: 'Family', icon: 'home-outline', people: 4, sub: 'With kids' },
  { value: 'group', label: 'Group', icon: 'people-circle-outline', people: 5, sub: 'Friends / squad' },
];

const HOTEL_TYPES = [
  { value: 'any', label: 'Any', icon: 'apps-outline', sub: 'Show all options' },
  { value: 'budget', label: 'Budget', icon: 'cash-outline', sub: 'Guesthouses & hostels' },
  { value: 'midrange', label: 'Mid-range', icon: 'business-outline', sub: '3-4 star hotels' },
  { value: 'luxury', label: 'Luxury', icon: 'diamond-outline', sub: '5 star & resorts' },
  { value: 'boutique', label: 'Boutique', icon: 'sparkles-outline', sub: 'Small unique stays' },
  { value: 'villa', label: 'Villa', icon: 'home-outline', sub: 'Private villa rental' },
];

const NIGHT_PRESETS = [1, 2, 3, 5, 7, 10, 14];

const formatInputDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseInputDate = (value) => {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const todayInput = () => formatInputDate(new Date());

const tomorrowInput = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatInputDate(d);
};

const addDays = (value, days) => {
  const date = parseInputDate(value);
  if (!date) return '';
  date.setDate(date.getDate() + Number(days || 0));
  return formatInputDate(date);
};

const PrefCard = ({ icon, label, sub, active, onPress }) => (
  <Pressable style={[styles.prefCard, active && styles.prefCardActive]} onPress={onPress}>
    <View style={[styles.prefIconBox, active && styles.prefIconBoxActive]}>
      <Ionicons name={icon} size={22} color={active ? colors.white : colors.primary} />
    </View>
    <Text style={[styles.prefCardLabel, active && styles.prefCardLabelActive]}>{label}</Text>
    {sub ? <Text style={[styles.prefCardSub, active && styles.prefCardSubActive]} numberOfLines={1}>{sub}</Text> : null}
  </Pressable>
);

const TripPlannerPreferencesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const planner = useTripPlanner();


  const { preferences, updatePreferences, selectedDistrict } = planner;
  const { tripType, hotelType, nights, travelers, startDate: prefStartDate } = preferences;
  const startDate = prefStartDate || tomorrowInput();
  const endDate = addDays(startDate, nights);

  useEffect(() => {
    if (!prefStartDate) {
      updatePreferences({ startDate });
    }
  }, [prefStartDate, startDate, updatePreferences]);

  const handleTripType = (value) => {
    updatePreferences({ tripType: value });
    if (value === 'solo') updatePreferences({ travelers: 1 });
    else if (value === 'couple') updatePreferences({ travelers: 2 });
    else if (value === 'family' && travelers < 3) updatePreferences({ travelers: 3 });
    else if (value === 'group' && travelers < 3) updatePreferences({ travelers: 3 });
  };

  const autoFixed = tripType === 'solo' || tripType === 'couple';
  const minTravelers = tripType === 'solo' ? 1 : tripType === 'couple' ? 2 : 2;
  const maxTravelers = tripType === 'solo' ? 1 : tripType === 'couple' ? 2 : 20;
  const decDisabled =
    (tripType === 'solo' && travelers <= 1) ||
    (tripType === 'couple' && travelers <= 2) ||
    ((tripType === 'family' || tripType === 'group') && travelers <= 2);
  const incDisabled =
    (tripType === 'solo' && travelers >= 1) ||
    (tripType === 'couple' && travelers >= 2) ||
    travelers >= maxTravelers;



  const tripTypeOption = TRIP_TYPES.find((t) => t.value === tripType);
  const hotelTypeOption = HOTEL_TYPES.find((h) => h.value === hotelType);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigateToPlannerPlacePicker(navigation, selectedDistrict)}>
          <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Trip Preferences</Text>
          <Text style={styles.topSub}>Step 3 · {selectedDistrict?.name || 'Set up your trip'}</Text>
        </View>
        <Pressable
          style={styles.cancelBtn}
          onPress={() => {
            planner?.cancelPlanning?.();
            navigateToTripList(navigation);
          }}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 220 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContent}>
          <View style={styles.sectionIntro}>
            <Text style={styles.eyebrow}>Trip preferences</Text>
            <Text style={styles.screenTitle}>Tell us about your trip</Text>
            <Text style={styles.screenSub}>We'll use this to find the right hotels for you in {selectedDistrict?.name || 'your destination'}.</Text>
          </View>

          {/* Who's travelling? */}
          <View style={styles.prefBlock}>
            <View style={styles.prefHeader}>
              <View style={styles.prefHeaderIcon}>
                <Ionicons name="people-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefBlockTitle}>Who's travelling?</Text>
                <Text style={styles.prefBlockSub}>Select the type that best describes your group</Text>
              </View>
            </View>
            <View style={styles.prefGrid}>
              {TRIP_TYPES.map((item) => (
                <PrefCard
                  key={item.value}
                  icon={item.icon}
                  label={item.label}
                  sub={item.sub}
                  active={tripType === item.value}
                  onPress={() => handleTripType(item.value)}
                />
              ))}
            </View>
          </View>

          {/* How many people? */}
          <View style={styles.prefBlock}>
            <View style={styles.prefHeader}>
              <View style={styles.prefHeaderIcon}>
                <Ionicons name="people-circle-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefBlockTitle}>How many people?</Text>
                <Text style={styles.prefBlockSub}>
                  {autoFixed
                    ? 'Count auto-set based on your trip type'
                    : `Set the exact number of travellers in your ${tripType}`}
                </Text>
              </View>
            </View>

            <View style={styles.bigCounter}>
              <Pressable
                style={[styles.bigCounterBtn, decDisabled && styles.counterButtonDisabled]}
                onPress={() => updatePreferences({ travelers: Math.max(minTravelers, travelers - 1) })}
                disabled={decDisabled}
              >
                <Ionicons name="remove" size={22} color={colors.textPrimary} />
              </Pressable>
              <View style={styles.bigCounterValueWrap}>
                <Text style={styles.bigCounterValue}>{travelers}</Text>
                <Text style={styles.bigCounterLabel}>{travelers === 1 ? 'person' : 'people'}</Text>
              </View>
              <Pressable
                style={[styles.bigCounterBtn, incDisabled && styles.counterButtonDisabled]}
                onPress={() => updatePreferences({ travelers: Math.min(maxTravelers, travelers + 1) })}
                disabled={incDisabled}
              >
                <Ionicons name="add" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>

            {tripType === 'family' && travelers >= 3 ? (
              <Text style={styles.peopleHint}>Family of {travelers} — we'll suggest family-friendly hotels & activities</Text>
            ) : null}
            {tripType === 'group' && travelers >= 3 ? (
              <Text style={styles.peopleHint}>Group of {travelers} — we'll look for rooms & rates that suit larger parties</Text>
            ) : null}
          </View>

          {/* Hotel preference */}
          <View style={styles.prefBlock}>
            <View style={styles.prefHeader}>
              <View style={styles.prefHeaderIcon}>
                <Ionicons name="bed-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefBlockTitle}>Hotel preference</Text>
                <Text style={styles.prefBlockSub}>We'll filter hotels in {selectedDistrict?.name || 'this district'} based on your choice</Text>
              </View>
            </View>
            <View style={styles.prefGrid}>
              {HOTEL_TYPES.map((item) => (
                <PrefCard
                  key={item.value}
                  icon={item.icon}
                  label={item.label}
                  sub={item.sub}
                  active={hotelType === item.value}
                  onPress={() => {
                    updatePreferences({ hotelType: item.value });
                    planner.setSelectedHotel(null);
                  }}
                />
              ))}
            </View>
          </View>

          {/* How many nights? */}
          <View style={styles.prefBlock}>
            <View style={styles.prefHeader}>
              <View style={styles.prefHeaderIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefBlockTitle}>How many nights?</Text>
                <Text style={styles.prefBlockSub}>Choose your total hotel nights in {selectedDistrict?.name || 'this district'}</Text>
              </View>
            </View>

            <AppDatePicker
              label="Trip start date"
              value={parseInputDate(startDate)}
              onChange={(date) => updatePreferences({ startDate: formatInputDate(date) })}
              mode="date"
              minimumDate={parseInputDate(todayInput()) || new Date()}
              placeholder="Select Start Date"
            />
            {endDate ? (
              <View style={styles.endDateHint}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                <Text style={styles.endDateHintText}>Return date: {endDate}</Text>
              </View>
            ) : null}


            <View style={styles.bigCounter}>
              <Pressable
                style={[styles.bigCounterBtn, nights <= 1 && styles.counterButtonDisabled]}
                onPress={() => updatePreferences({ nights: Math.max(1, nights - 1) })}
                disabled={nights <= 1}
              >
                <Ionicons name="remove" size={22} color={colors.textPrimary} />
              </Pressable>
              <View style={styles.bigCounterValueWrap}>
                <Text style={styles.bigCounterValue}>{nights}</Text>
                <Text style={styles.bigCounterLabel}>nights</Text>
              </View>
              <Pressable
                style={[styles.bigCounterBtn, nights >= 21 && styles.counterButtonDisabled]}
                onPress={() => updatePreferences({ nights: Math.min(21, nights + 1) })}
                disabled={nights >= 21}
              >
                <Ionicons name="add" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.nightsRow}>
              {NIGHT_PRESETS.map((n) => (
                <Pressable
                  key={n}
                  style={[styles.nightChip, nights === n && styles.nightChipActive]}
                  onPress={() => updatePreferences({ nights: n })}
                >
                  <Text style={[styles.nightChipText, nights === n && styles.nightChipTextActive]}>{n}n</Text>
                </Pressable>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Floating bottom bar — matches places picker pattern */}
      <View style={[styles.bottomBar, { bottom: Math.max(insets.bottom, 15) + 75 }]}>
        <View style={styles.bottomTopRow}>
          <View style={styles.countPill}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={styles.countPillText}>Your trip</Text>
          </View>
          <Text style={styles.bottomDates} numberOfLines={1}>{startDate} → {endDate}</Text>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.nextBtn} onPress={() => navigateToPlannerHotelPicker(navigation)}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryChipRow}
          style={styles.bottomChipScroll}
        >
          <View style={styles.summaryChip}>
            <Ionicons name={tripTypeOption?.icon || 'people-outline'} size={13} color={colors.primary} />
            <Text style={styles.summaryChipText}>{tripTypeOption?.label || 'Trip'}</Text>
          </View>
          <View style={styles.summaryChip}>
            <Ionicons name="person-outline" size={13} color={colors.primary} />
            <Text style={styles.summaryChipText}>{travelers} {travelers === 1 ? 'person' : 'people'}</Text>
          </View>
          <View style={styles.summaryChip}>
            <Ionicons name={hotelTypeOption?.icon || 'bed-outline'} size={13} color={colors.primary} />
            <Text style={styles.summaryChipText}>{hotelTypeOption?.label || 'Any'}</Text>
          </View>
          <View style={styles.summaryChip}>
            <Ionicons name="moon-outline" size={13} color={colors.primary} />
            <Text style={styles.summaryChipText}>{nights} night{nights !== 1 ? 's' : ''}</Text>
          </View>
        </ScrollView>
      </View>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonGhost: { width: 42, height: 42 },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
  },
  selectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectionTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  topTitleWrap: { flex: 1, alignItems: 'center' },
  topTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  topSub: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  scrollContent: { paddingHorizontal: 16 },
  stepContent: { gap: 16 },
  sectionIntro: { paddingTop: 4 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  screenTitle: { color: colors.textPrimary, fontSize: 26, fontWeight: '900', lineHeight: 31 },
  screenSub: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: 4 },

  // Pref blocks
  prefBlock: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  prefHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefBlockTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  prefBlockSub: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  prefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prefCard: {
    width: '47.5%',
    backgroundColor: colors.surface2,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  prefCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
  },
  dateInput: {
    backgroundColor: colors.surface2,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateInputLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  dateInputText: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  endDateHint: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: -8, 
    marginBottom: 12, 
    marginLeft: 4 
  },
  endDateHintText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  prefIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefIconBoxActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  prefCardLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  prefCardLabelActive: { color: colors.white },
  prefCardSub: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  prefCardSubActive: { color: 'rgba(255,255,255,0.78)' },

  // Counter
  bigCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  bigCounterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCounterValueWrap: { alignItems: 'center' },
  bigCounterValue: { color: colors.primary, fontSize: 40, fontWeight: '900', lineHeight: 44 },
  bigCounterLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: 2 },
  counterButtonDisabled: { opacity: 0.4 },
  peopleHint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },

  nightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  nightChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nightChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  nightChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  nightChipTextActive: { color: colors.white },

  // Floating bottom bar
  bottomBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  bottomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '14',
    borderWidth: 1,
    borderColor: colors.primary + '33',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countPillText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  bottomDates: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  nextBtnText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  bottomChipScroll: { maxHeight: 38 },
  summaryChipRow: { gap: 6, paddingRight: 6 },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '35',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  summaryChipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
});

export default TripPlannerPreferencesScreen;
