import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ErrorText from '../../components/common/ErrorText';
import FallbackImage from '../../components/common/FallbackImage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import colors from '../../constants/colors';
import { createTripApi, updateTripApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { getHotelNightlyPriceLkr } from '../../utils/currencyFormat';
import { getHotelImageCandidates } from '../../utils/hotelImages';
import { useTripPlanner } from '../../context/TripPlannerContext';
import {
  navigateToPlannerDistrictPicker,
  navigateToPlannerPreferences,
  navigateToPlannerHotelPicker,
  navigateToPlannerBudget,
} from '../../navigation/tripPlannerFlow';

// ── Helpers ───────────────────────────────────────────────────────────────────
const LKR_RATES = { LKR: 1, USD: 0.0033, EUR: 0.0031 };
const CURRENCY_SYMS = { LKR: 'Rs', USD: '$', EUR: '€' };

function fmtMoney(amount, sym) {
  return `${sym || 'Rs'}${(Number(amount) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function convertFromLKR(lkr, code) {
  return Math.round((Number(lkr) || 0) * (LKR_RATES[code] || 1));
}

function normalizeSplit(split) {
  const keys = ['food', 'transport', 'activities_misc'];
  const fallback = { food: 55, transport: 30, activities_misc: 15 };
  const values = keys.map(k => Math.max(Number(split?.[k]) || 0, 0));
  const total = values.reduce((s, v) => s + v, 0);
  if (total <= 0) return fallback;
  const scaled = values.map(v => (v / total) * 100);
  const base = scaled.map(v => Math.floor(v));
  let rem = 100 - base.reduce((s, v) => s + v, 0);
  const order = scaled.map((v, i) => ({ i, frac: v - base[i] })).sort((a, b) => (b.frac - a.frac) || (a.i - b.i));
  let idx = 0;
  while (rem > 0) { base[order[idx % order.length].i] += 1; rem--; idx++; }
  return { food: base[0], transport: base[1], activities_misc: base[2] };
}

const addDays = (value, days) => {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + Number(days || 0));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const diffDays = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const s = new Date(startStr + 'T00:00:00');
  const e = new Date(endStr + 'T00:00:00');
  return Math.max(0, Math.round((e - s) / 86400000));
};

const parseIsoDate = (isoStr) => {
  if (!isoStr) return new Date();
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toIsoDate = (value) => (value ? `${value}T00:00:00.000Z` : '');
const getPlaceId = (p) => String(p?._id || p?.place_id || p?.id || '');
const getHotelId = (h) => String(h?._id || h?.hotel_id || h?.id || '');

const normalizePlaceForTrip = (place) => ({
  id: getPlaceId(place), place_id: place?.place_id || null, name: place?.name || '',
  type: place?.type || '', image: place?.image_url || '',
  rating: Number(place?.rating || 0), address: place?.address_text || '',
  lat: place?.lat ?? null, lng: place?.lng ?? null,
});

const normalizeHotelForTrip = (hotel) => hotel ? ({
  id: getHotelId(hotel), hotel_id: hotel?.hotel_id || null, name: hotel?.name || '',
  type: hotel?.hotel_type || '', image: hotel?.image_url || '',
  rating: Number(hotel?.rating || 0), starClass: Number(hotel?.star_class || 0),
  pricePerNight: getHotelNightlyPriceLkr(hotel), address: hotel?.address_text || '',
  lat: hotel?.lat ?? null, lng: hotel?.lng ?? null,
  nights: Number(hotel?.nights || 0),
  checkIn: hotel?.checkIn || null,
  checkOut: hotel?.checkOut || null,
}) : null;

// ── Context Card ──────────────────────────────────────────────────────────────
const CtxCard = ({ icon, emoji, label, name, sub, onPress }) => (
  <View style={s.ctxCard}>
    {emoji
      ? <View style={s.ctxIconWrap}><Text style={s.ctxEmoji}>{emoji}</Text></View>
      : <View style={s.ctxIconWrap}><Ionicons name={icon} size={18} color={colors.primary} /></View>
    }
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={s.ctxLabel}>{label}</Text>
      <Text style={s.ctxName} numberOfLines={1}>{name}</Text>
      {sub ? <Text style={s.ctxSub} numberOfLines={1}>{sub}</Text> : null}
    </View>
    <Pressable style={s.ctxChangeBtn} onPress={onPress}>
      <Text style={s.ctxChangeBtnText}>Change</Text>
    </Pressable>
  </View>
);

// ── Budget row component ───────────────────────────────────────────────────────
const BudRow = ({ emoji, label, amount, pct, perDay, budDays, sym, dotColor }) => (
  <View>
    <View style={s.budRow}>
      <View style={s.budRowLeft}>
        <View style={[s.budDot, { backgroundColor: dotColor }]} />
        <Text style={s.budRowLabel}>{emoji} {label}</Text>
      </View>
      <View style={s.budRowRight}>
        <Text style={s.budRowAmt}>{fmtMoney(amount, sym)}</Text>
        <Text style={s.budRowPct}>{pct}%</Text>
      </View>
    </View>
    {perDay != null && (
      <Text style={s.budPerDay}>
        {fmtMoney(perDay, sym)} / day
        <Text style={s.budDaysTag}> × {budDays} {budDays === 1 ? 'day' : 'days'}</Text>
      </Text>
    )}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const TripPlannerScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const planner = useTripPlanner();
  const initializedEditTripRef = useRef(null);
  const routeTrip = route?.params?.trip;
  const routeTripId = routeTrip?._id || routeTrip?.id;

  const {
    editingTrip, selectedDistrict, selectedPlaces, preferences,
    selectedHotel, selectedHotels, tripDays, setTripDays,
    tripName, setTripName, totalBudget, hotelBudget, notes, setNotes,
  } = planner;

  const [showDatePicker, setShowDatePicker] = useState(false);

  const { tripType, hotelType, nights, travelers, startDate: prefStartDate } = preferences;
  const startDate = prefStartDate || '';
  const actualDays = tripDays ? Number(tripDays) : nights;
  const endDate = useMemo(() => addDays(startDate, actualDays), [actualDays, startDate]);

  // ── Budget breakdown with split ────────────────────────────────────────────
  const budCurrency = 'LKR';
  const sym = CURRENCY_SYMS[budCurrency] || 'Rs';
  const budTotal = Number(totalBudget || 0);
  const budHotel = Number(hotelBudget || 0);
  const budRemaining = Math.max(budTotal - budHotel, 0);
  const split = normalizeSplit(null); // uses 55/30/15 default
  const budDays = Math.max(actualDays, 1);
  const budFood = Math.round(budRemaining * (split.food / 100));
  const budTravel = Math.round(budRemaining * (split.transport / 100));
  const budMisc = budRemaining - budFood - budTravel;
  const pctHotel = budTotal > 0 ? Math.round((budHotel / budTotal) * 100) : 0;
  const pctFood = budTotal > 0 ? Math.round((budFood / budTotal) * 100) : 0;
  const pctTravel = budTotal > 0 ? Math.round((budTravel / budTotal) * 100) : 0;
  const pctMisc = Math.max(0, 100 - pctHotel - pctFood - pctTravel);
  const foodPerDay = budDays > 0 ? Math.round(budFood / budDays) : 0;
  const travelPerDay = budDays > 0 ? Math.round(budTravel / budDays) : 0;
  const perDayNonHotel = budDays > 0 ? Math.round(budRemaining / budDays) : 0;

  // ── Hotel for display ──────────────────────────────────────────────────────
  const displayHotel = selectedHotel || selectedHotels?.[0] || null;
  const hotelPrice = displayHotel ? getHotelNightlyPriceLkr(displayHotel) : 0;
  const totalHotels = (selectedHotels || []).length;

  useEffect(() => {
    if (!routeTripId || !routeTrip || initializedEditTripRef.current === routeTripId) return;
    planner.startEditTrip?.(routeTrip);
    initializedEditTripRef.current = routeTripId;
  }, [planner, routeTrip, routeTripId]);

  // ── Auto-fill name ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripName && selectedDistrict?.name) {
      setTripName(`My trip to ${selectedDistrict.name}`);
    }
  }, [selectedDistrict?.name, tripName, setTripName]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReturnDateChange = (date) => {
    setShowDatePicker(false);
    if (!date || !startDate) return;
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const newDays = diffDays(startDate, iso);
    if (newDays < 1) {
      setError('Return date must be after departure date.');
      return;
    }
    setTripDays(String(newDays));
  };

  const handleSave = async () => {
    const total = Number(totalBudget || 0);
    const hotel = Number(hotelBudget || 0);
    if (!selectedDistrict) { setError('Choose a district before saving.'); return; }
    if (!selectedPlaces.length) { setError('Pick at least one place before saving.'); return; }
    if (!tripName.trim()) { setError('Trip name is required.'); return; }
    if (!startDate || !endDate) { setError('Choose valid trip dates.'); return; }
    if (!Number.isFinite(total) || total <= 0) { setError('Set a total trip budget.'); return; }
    if (hotel > total) { setError('Hotel budget cannot be greater than total budget.'); return; }

    const hotelsPayload = (selectedHotels || []).length > 0
      ? selectedHotels.map(normalizeHotelForTrip)
      : displayHotel ? [normalizeHotelForTrip(displayHotel)] : [];

    const budgetBreakdown = {
      currency: budCurrency, total, hotel,
      food: budFood, transport: budTravel, activities: budMisc,
      perDay: perDayNonHotel,
    };

    const payload = {
      title: tripName.trim(),
      destination: selectedDistrict.name,
      startDate: toIsoDate(startDate),
      endDate: toIsoDate(endDate),
      budget: total,
      notes: notes.trim(),
      status: editingTrip?.status || 'planned',
      districtId: selectedDistrict.district_id,
      districtName: selectedDistrict.name,
      province: selectedDistrict.province,
      selectedPlaces: selectedPlaces.map(normalizePlaceForTrip),
      selectedHotel: normalizeHotelForTrip(displayHotel),
      selectedHotels: hotelsPayload,
      tripType, travelers, nights: actualDays, hotelType,
      currency: budCurrency, budgetBreakdown,
    };

    try {
      setSaving(true); setError('');
      const response = editingTrip?._id
        ? await updateTripApi(editingTrip._id, payload)
        : await createTripApi(payload);
      const savedTrip = response?.data?.trip;
      planner.finishPlanning?.();
      if (savedTrip) {
        navigation.replace('TripDetails', { trip: savedTrip });
      } else {
        navigation.navigate('TripList');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save trip plan'));
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={s.header}>
        <View style={s.headerRow}>
          <Pressable style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTag}>Trip Planner · Step 6</Text>
            <Text style={s.headerTitle}>{editingTrip ? 'Update Trip' : 'Finalize Trip'}</Text>
          </View>
          <Pressable 
            style={[s.iconBtn, { marginLeft: 8 }]} 
            onPress={() => {
              planner.cancelPlanning?.();
              navigation.navigate('TripList');
            }}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </Pressable>
          <Pressable style={s.saveHeaderBtn} onPress={handleSave} disabled={saving}>
            <Text style={s.saveHeaderText}>{saving ? 'Saving…' : editingTrip ? 'Update' : 'Save'}</Text>
          </Pressable>
        </View>
        {/* summary pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
          {selectedDistrict?.name && (
            <View style={s.pill}><Ionicons name="map-outline" size={12} color={colors.white} />
              <Text style={s.pillText}>{selectedDistrict.name}</Text></View>
          )}
          <View style={s.pill}><Ionicons name="location-outline" size={12} color={colors.white} />
            <Text style={s.pillText}>{selectedPlaces.length} place{selectedPlaces.length !== 1 ? 's' : ''}</Text></View>
          <View style={s.pill}><Ionicons name="moon-outline" size={12} color={colors.white} />
            <Text style={s.pillText}>{actualDays} night{actualDays !== 1 ? 's' : ''}</Text></View>
          <View style={s.pill}><Ionicons name="people-outline" size={12} color={colors.white} />
            <Text style={s.pillText}>{travelers} traveler{travelers !== 1 ? 's' : ''}</Text></View>
          {budTotal > 0 && (
            <View style={s.pill}><Ionicons name="wallet-outline" size={12} color={colors.white} />
              <Text style={s.pillText}>{fmtMoney(budTotal, sym)}</Text></View>
          )}
        </ScrollView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom + 100, 120) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── 1. Trip Details Form ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconWrap}><Ionicons name="create-outline" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Trip Details</Text>
                <Text style={s.cardSub}>Give your trip a name and add notes</Text>
              </View>
            </View>

            {/* Trip name */}
            <View>
              <Text style={s.fieldLabel}>Trip Name</Text>
              <View style={s.inputWrap}>
                <Ionicons name="create-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={s.input}
                  value={tripName}
                  onChangeText={setTripName}
                  placeholder="My Sri Lanka trip"
                  placeholderTextColor={colors.textMuted}
                  maxLength={80}
                />
              </View>
            </View>

            {/* Notes */}
            <View>
              <View style={s.notesLabelRow}>
                <Text style={s.fieldLabel}>Notes <Text style={s.optional}>(optional)</Text></Text>
                <Text style={s.charCount}>{(notes || '').length}/500</Text>
              </View>
              <TextInput
                style={s.textarea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Transport notes, must-see places, dietary needs, reminders…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── 2. Trip Summary ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconWrap}><Ionicons name="list-outline" size={18} color={colors.primary} /></View>
              <Text style={s.cardTitle}>Trip Summary</Text>
            </View>

            <CtxCard
              icon="map-outline"
              label="Destination"
              name={selectedDistrict?.name || 'Not selected'}
              sub={selectedDistrict?.province ? `${selectedDistrict.province} Province` : null}
              onPress={() => navigateToPlannerDistrictPicker(navigation)}
            />
            <CtxCard
              emoji="📅"
              label="Preferences"
              name={`${actualDays} ${actualDays === 1 ? 'night' : 'nights'}`}
              sub={`${travelers} ${travelers === 1 ? 'person' : 'people'} · ${tripType || 'any'}`}
              onPress={() => navigateToPlannerPreferences(navigation)}
            />
            
            <View style={s.datesRow}>
              <View style={s.dateField}>
                <Text style={s.fieldLabel}>Departure</Text>
                <View style={[s.inputWrap, s.inputWrapReadOnly]}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <Text style={s.inputReadOnly}>{startDate || '—'}</Text>
                </View>
                <Pressable onPress={() => navigateToPlannerPreferences(navigation)}>
                  <Text style={s.fieldHint}>🔒 Set in preferences — <Text style={s.fieldHintLink}>change</Text></Text>
                </Pressable>
              </View>
              <View style={s.dateField}>
                <Text style={s.fieldLabel}>Return</Text>
                <Pressable onPress={() => setShowDatePicker(true)}>
                  <View style={s.inputWrap}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={s.inputTextBold}>{endDate || '—'}</Text>
                  </View>
                </Pressable>
                <Text style={s.fieldHint}>Change trip duration</Text>
              </View>
            </View>

            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              date={parseIsoDate(endDate)}
              minimumDate={parseIsoDate(startDate)}
              onConfirm={handleReturnDateChange}
              onCancel={() => setShowDatePicker(false)}
            />

            {actualDays > 0 && (
              <View style={s.nightsBadge}>
                <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                <Text style={s.nightsBadgeText}>{actualDays} night{actualDays !== 1 ? 's' : ''} · {budDays} day{budDays !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>

          {/* ── 3. Your Places ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconWrap}><Ionicons name="location-outline" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Your Places</Text>
                <Text style={s.cardSub}>{selectedPlaces.length} destination{selectedPlaces.length !== 1 ? 's' : ''} selected</Text>
              </View>
            </View>
            <View style={{ gap: 12 }}>
              {selectedPlaces.map((p, i) => (
                <View key={i} style={s.placeRow}>
                  <FallbackImage
                    uri={p.image}
                    style={s.placeImg}
                    iconName="location-outline"
                    iconSize={18}
                    placeholderColor={colors.primary + '10'}
                    placeholderIconColor={colors.primary}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.placeName} numberOfLines={1}>{p.name}</Text>
                    {p.type ? <Text style={s.placeType}>{p.type}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
            <Pressable style={s.adjustBtn} onPress={() => navigateToPlannerDistrictPicker(navigation)}>
              <Text style={s.adjustBtnText}>Adjust Places</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>

          {/* ── 4. Your Hotels ── */}
          {displayHotel && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.cardIconWrap}><Ionicons name="bed-outline" size={18} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Your Hotels</Text>
                  <Text style={s.cardSub}>{totalHotels} hotel{totalHotels !== 1 ? 's' : ''} selected</Text>
                </View>
              </View>

              <View style={{ gap: 14 }}>
                {(selectedHotels && selectedHotels.length > 0 ? selectedHotels : (displayHotel ? [displayHotel] : [])).map((h, i) => {
                  const hPrice = getHotelNightlyPriceLkr(h);
                  const hNights = Number(h.nights) || nights || 1;
                  return (
                    <View key={i} style={s.hotelItemCard}>
                      <View style={s.hotelPreview}>
                        <FallbackImage
                          uri={getHotelImageCandidates(h)}
                          style={s.hotelImg}
                          iconName="bed-outline"
                          iconSize={22}
                          placeholderColor={colors.primary + '18'}
                          placeholderIconColor={colors.primary}
                        />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={s.hotelName} numberOfLines={1}>{h.name}</Text>
                            <View style={s.hotelNightsBadge}>
                              <Text style={s.hotelNightsText}>{hNights} nt{hNights !== 1 ? 's' : ''}</Text>
                            </View>
                          </View>
                          <Text style={s.hotelSub} numberOfLines={1}>
                            {h.address_text || h.hotel_type || 'Hotel'}
                          </Text>
                          {hPrice > 0 && (
                            <Text style={s.hotelPrice}>{fmtMoney(convertFromLKR(hPrice, budCurrency), sym)} / night</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
              
              <Pressable style={s.adjustBtn} onPress={() => navigateToPlannerHotelPicker(navigation)}>
                <Text style={s.adjustBtnText}>Change Hotels</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          )}

          {/* ── 5. Budget Breakdown ── */}
          {budTotal > 0 && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.cardIconWrap}><Ionicons name="pie-chart-outline" size={18} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Budget Breakdown</Text>
                  <Text style={s.cardSub}>How your {fmtMoney(budTotal, sym)} budget is split</Text>
                </View>
              </View>

              <View style={s.budBar}>
                {pctHotel > 0 && <View style={[s.budSeg, { flex: pctHotel, backgroundColor: colors.info }]} />}
                {pctFood > 0 && <View style={[s.budSeg, { flex: pctFood, backgroundColor: colors.success }]} />}
                {pctTravel > 0 && <View style={[s.budSeg, { flex: pctTravel, backgroundColor: colors.warning }]} />}
                {pctMisc > 0 && <View style={[s.budSeg, { flex: pctMisc, backgroundColor: colors.accent }]} />}
              </View>
              
              <View style={{ gap: 4 }}>
                <BudRow emoji="🏨" label="Hotel" amount={budHotel} pct={pctHotel} sym={sym} dotColor={colors.info} />
                <BudRow emoji="🍽️" label="Food" amount={budFood} pct={pctFood} sym={sym} dotColor={colors.success} />
                <BudRow emoji="🚗" label="Travel" amount={budTravel} pct={pctTravel} sym={sym} dotColor={colors.warning} />
              </View>

              <Pressable style={s.adjustBtn} onPress={() => navigateToPlannerBudget(navigation)}>
                <Text style={s.adjustBtnText}>Adjust Budget</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          )}

          {/* ── Ready to go message ── */}
          <View style={s.readySection}>
            <View style={s.readyIcon}>
              <Ionicons name="airplane" size={28} color={colors.white} />
            </View>
            <Text style={s.readyTitle}>Your Trip is Ready!</Text>
            <Text style={s.readyText}>Everything looks perfect. Save your trip now to start your Sri Lankan journey.</Text>
            
            <Pressable 
              style={[s.largeSaveBtn, saving && s.saveBtnDisabled]} 
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={s.largeSaveBtnText}>{saving ? 'Creating Trip...' : 'Confirm & Save Trip'}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
          </View>

          <ErrorText message={error} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Floating bottom bar ── */}
      <View style={[s.bottomBar, { bottom: Math.max(insets.bottom, 12) + 4 }]}>
        <View style={s.bottomRow}>
          {/* Summary chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
            {selectedDistrict?.name && (
              <View style={s.summaryChip}>
                <Text style={s.summaryChipText}>📍 {selectedDistrict.name}</Text>
              </View>
            )}
            {budDays > 0 && (
              <View style={s.summaryChip}>
                <Text style={s.summaryChipText}>🗓️ {budDays}d</Text>
              </View>
            )}
            {budTotal > 0 && (
              <View style={s.summaryChip}>
                <Text style={s.summaryChipText}>💰 {fmtMoney(budTotal, sym)}</Text>
              </View>
            )}
          </ScrollView>
          <Pressable
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <Text style={s.saveBtnText}>Saving…</Text>
              : <>
                <Text style={s.saveBtnText}>{editingTrip ? 'Update Trip' : 'Save Trip'}</Text>
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </>
            }
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTag: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '900' },
  saveHeaderBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.white },
  saveHeaderText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pillText: { color: colors.white, fontSize: 12, fontWeight: '700' },

  scroll: { padding: 16, gap: 14 },

  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary + '14', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  cardSub: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 2 },

  // Context cards
  ctxCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  ctxIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  ctxEmoji: { fontSize: 18 },
  ctxLabel: { fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  ctxName: { fontSize: 14, fontWeight: '900', color: colors.textPrimary, marginTop: 1 },
  ctxSub: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 1 },
  ctxChangeBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.primary + '12', borderWidth: 1, borderColor: colors.primary + '44' },
  ctxChangeBtnText: { fontSize: 12, fontWeight: '900', color: colors.primary },

  // Hotel preview
  hotelPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primary + '08', borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary + '33', padding: 10 },
  hotelImg: { width: 60, height: 60, borderRadius: 12 },
  hotelName: { fontSize: 14, fontWeight: '900', color: colors.textPrimary },
  hotelSub: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  hotelPrice: { fontSize: 12, fontWeight: '900', color: colors.primary, marginTop: 3 },
  extraHotelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  extraHotelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  extraHotelName: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  extraHotelPrice: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  // Form
  fieldLabel: { fontSize: 12, fontWeight: '900', color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 12, height: 48 },
  inputWrapReadOnly: { opacity: 0.75 },
  input: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  inputTextBold: { flex: 1, fontSize: 15, fontWeight: '900', color: colors.textPrimary },
  inputReadOnly: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  datesRow: { flexDirection: 'row', gap: 10 },
  dateField: { flex: 1, gap: 6 },
  fieldHint: { fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 4 },
  fieldHintLink: { color: colors.primary, fontWeight: '900' },
  nightsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '0D', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, alignSelf: 'flex-start' },
  nightsBadgeText: { fontSize: 12, fontWeight: '900', color: colors.primary },
  notesLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  charCount: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  optional: { fontWeight: '700', color: colors.textMuted },
  textarea: { backgroundColor: colors.surface2, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 100 },

  // Budget breakdown
  budBar: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden', backgroundColor: colors.border },
  budSeg: { height: '100%' },
  budRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  budRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budDot: { width: 10, height: 10, borderRadius: 5 },
  budRowLabel: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  budRowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budRowAmt: { fontSize: 13, fontWeight: '900', color: colors.textPrimary },
  budRowPct: { fontSize: 11, fontWeight: '800', color: colors.textMuted, minWidth: 30, textAlign: 'right' },
  budPerDay: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginLeft: 28, marginBottom: 4 },
  budDaysTag: { color: colors.textMuted, fontWeight: '700' },
  budDivider: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border, marginVertical: 2 },
  budDividerText: { fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  adjustBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary + '0D', borderWidth: 1, borderColor: colors.primary + '33', marginTop: 4 },
  adjustBtnText: { fontSize: 13, fontWeight: '900', color: colors.primary },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem: { flex: 1, minWidth: '45%', backgroundColor: colors.surface2, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 3 },
  infoLabel: { fontSize: 10, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 13, fontWeight: '900', color: colors.textPrimary },

  // Bottom bar
  bottomBar: { position: 'absolute', left: 12, right: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, elevation: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryChip: { backgroundColor: colors.primary + '14', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '33' },
  summaryChipText: { fontSize: 11, fontWeight: '900', color: colors.primary },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.white, fontSize: 13, fontWeight: '900' },

  // Ready section
  readySection: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 10, gap: 12 },
  readyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  readyTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  readyText: { fontSize: 14, fontWeight: '700', color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  largeSaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 16, borderRadius: 16, width: '100%', justifyContent: 'center', marginTop: 10, elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  largeSaveBtnText: { color: colors.white, fontSize: 16, fontWeight: '900' },

  // Places summary
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  placeImg: { width: 44, height: 44, borderRadius: 10 },
  placeName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  placeType: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 1 },

  // Hotel items
  hotelItemCard: { gap: 8 },
  hotelNightsBadge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  hotelNightsText: { color: colors.white, fontSize: 11, fontWeight: '900' },
});

export default TripPlannerScreen;
