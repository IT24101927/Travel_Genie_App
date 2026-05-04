import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../../constants/colors';
import { useTripPlanner } from '../../context/TripPlannerContext';
import { getHotelNightlyPriceLkr } from '../../utils/currencyFormat';
import { navigateToPlannerHotelPicker, navigateToPlannerSummary, navigateToTripList } from '../../navigation/tripPlannerFlow';

// ── Currency ──────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'LKR', symbol: 'Rs', label: 'LKR', flag: '🇱🇰' },
  { code: 'USD', symbol: '$',  label: 'USD', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',  label: 'EUR', flag: '🇪🇺' },
];
const LKR_RATES = { LKR: 1, USD: 0.0033, EUR: 0.0031 };
const convertFromLKR = (lkr, code) => Math.round((Number(lkr) || 0) * (LKR_RATES[code] || 1));
const convertToLKR  = (amount, code) => {
  const v = Number(amount);
  return (Number.isFinite(v) && v > 0) ? v / (LKR_RATES[code] || 1) : 0;
};
const fmt = (amount, symbol) => `${symbol}${(Number(amount) || 0).toLocaleString()}`;

// ── Quick picks ───────────────────────────────────────────────────────────────
const QUICK_LKR = [25000, 50000, 100000, 150000, 200000, 300000];
const QUICK_USD = [100, 250, 500, 1000, 2000, 5000];
const QUICK_EUR = [100, 250, 500, 1000, 2000, 5000];
const getQuick = (code) => code === 'LKR' ? QUICK_LKR : code === 'USD' ? QUICK_USD : QUICK_EUR;
const DAY_PICKS = [1, 2, 3, 5, 7, 10, 14];

// ── Split helpers (ported from web budgetPlanning.js) ─────────────────────────
const DAILY_SPLIT_DEFAULT = { food: 55, transport: 30, activities_misc: 15 };

function normalizeDailySplit(split) {
  const keys = ['food', 'transport', 'activities_misc'];
  const raw = keys.map(k => Math.max(Number(split?.[k]) || 0, 0));
  const total = raw.reduce((s, v) => s + v, 0);
  if (total <= 0) return { ...DAILY_SPLIT_DEFAULT };
  const scaled = raw.map(v => (v / total) * 100);
  const base = scaled.map(v => Math.floor(v));
  let rem = 100 - base.reduce((s, v) => s + v, 0);
  const order = scaled.map((v, i) => ({ i, frac: v - base[i] })).sort((a, b) => (b.frac - a.frac) || (a.i - b.i));
  let idx = 0;
  while (rem > 0) { base[order[idx % order.length].i] += 1; rem--; idx++; }
  return { food: base[0], transport: base[1], activities_misc: base[2] };
}

const SPLIT_LABELS = { food: 'Food & Dining', transport: 'Transport', activities_misc: 'Activities & Misc' };
const SPLIT_EMOJIS = { food: '🍽️', transport: '🚗', activities_misc: '✨' };
const SPLIT_COLORS = { food: '#FF6B6B', transport: '#4ECDC4', activities_misc: '#FFE66D' };

const SOURCE_LABELS = {
  'rule-default': 'Balanced (55/30/15)',
  custom:         'Custom',
  default:        'Default',
};

const diffDaysLocal = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const s = new Date(startStr + 'T00:00:00');
  const e = new Date(endStr + 'T00:00:00');
  return Math.max(0, Math.round((e - s) / 86400000));
};

// ── Screen ────────────────────────────────────────────────────────────────────
const TripPlannerBudgetScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { 
    preferences, selectedHotels, selectedDistrict, 
    totalBudget: plannerTotalBudget, setTotalBudget: saveTotalBudget, 
    hotelBudget: plannerHotelBudget, setHotelBudget: saveHotelBudget,
    tripDays, setTripDays, cancelPlanning
  } = useTripPlanner();

  const [currency, setCurrency]               = useState('LKR');
  const [totalRaw, setTotalRaw]               = useState(plannerTotalBudget ? String(plannerTotalBudget) : '');
  const [hotelRaw, setHotelRaw]               = useState(plannerHotelBudget ? String(plannerHotelBudget) : '');
  const [split, setSplit]               = useState({ ...DAILY_SPLIT_DEFAULT });
  const [splitTouched, setSplitTouched] = useState(false);
  const [splitSource, setSplitSource]   = useState('rule-default');

  const canonicalRef = useRef({ totalLkr: null, hotelLkr: null });

  // ── Derived values ──────────────────────────────────────────────────────────
  const sym          = CURRENCIES.find(c => c.code === currency)?.symbol || 'Rs';
  const totalNum     = Number(totalRaw) || 0;
  const hotelNum     = Number(hotelRaw) || 0;
  const nights       = Number(preferences?.nights) || 1;
  const lastCheckOut = useMemo(() => 
    (selectedHotels || []).reduce((max, h) => (h.checkOut && h.checkOut > max ? h.checkOut : max), ''),
    [selectedHotels]
  );
  const autoTripDays = useMemo(() => 
    (preferences?.startDate && lastCheckOut)
      ? Math.max(1, diffDaysLocal(preferences.startDate, lastCheckOut))
      : nights,
    [preferences?.startDate, lastCheckOut, nights]
  );
  const minDays      = Math.max(autoTripDays, nights);
  const ruleDays     = Math.max(Number(tripDays) || minDays, 1);
  const remaining    = Math.max(totalNum - hotelNum, 0);
  const perDayBudget = ruleDays > 0 ? Math.round(remaining / ruleDays) : 0;
  const hotelPct     = totalNum > 0 && hotelNum > 0 ? Math.min(100, Math.round((hotelNum / totalNum) * 100)) : 0;
  const isHotelOverTotal  = hotelNum > 0 && totalNum > 0 && hotelNum > totalNum;
  const isTripDaysInvalid = !tripDays || Number(tripDays) < minDays;
  const canContinue       = totalNum > 0 && hotelNum > 0 && !isHotelOverTotal && !isTripDaysInvalid;

  // Selected hotels total calculations
  const totalNightsUsed = useMemo(() =>
    (selectedHotels || []).reduce((s, h) => s + Math.max(1, Number(h.nights) || 1), 0),
    [selectedHotels]
  );
  const selectedHotelsTotalLkr = useMemo(() =>
    (selectedHotels || []).reduce((sum, h) => {
      const price = getHotelNightlyPriceLkr(h);
      return sum + price * Math.max(1, Number(h.nights) || 1);
    }, 0),
    [selectedHotels]
  );
  const selectedHotelsTotal = convertFromLKR(selectedHotelsTotalLkr, currency);
  const selectedVsHotelBudgetDiff = hotelNum > 0 && selectedHotelsTotal > 0 ? hotelNum - selectedHotelsTotal : null;

  // Auto-set tripDays to minDays on mount / when nights change
  useEffect(() => {
    setTripDays(prev => {
      const cur = Number(prev) || 0;
      return cur < minDays ? String(minDays) : prev;
    });
  }, [minDays]);

  // Estimated hotel cost from selected hotels
  const estHotelLkr = useMemo(() =>
    (selectedHotels || []).reduce((sum, h) => sum + getHotelNightlyPriceLkr(h) * (Number(h.nights) || nights), 0),
    [selectedHotels, nights]
  );
  const estHotel = convertFromLKR(estHotelLkr, currency);

  // Quick picks for hotel budget
  const hotelQuickPicks = totalNum > 0
    ? [30, 40, 50, 60, 70].map(p => ({ label: fmt(Math.round(totalNum * p / 100), sym), amount: Math.round(totalNum * p / 100) }))
    : getQuick(currency).map(a => ({ label: fmt(a, sym), amount: a }));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const setCanonicalAmount = useCallback((kind, amount, code) => {
    const key = kind === 'total' ? 'totalLkr' : 'hotelLkr';
    canonicalRef.current[key] = convertToLKR(amount, code || currency);
  }, [currency]);

  const handleCurrencyChange = (newCode) => {
    if (newCode === currency) return;
    const totalLkr = canonicalRef.current.totalLkr ?? (totalNum ? convertToLKR(totalNum, currency) : 0);
    const hotelLkr = canonicalRef.current.hotelLkr ?? (hotelNum ? convertToLKR(hotelNum, currency) : 0);
    const nextTotal = totalLkr > 0 ? convertFromLKR(totalLkr, newCode) : 0;
    const nextHotel = hotelLkr > 0 ? convertFromLKR(hotelLkr, newCode) : 0;
    setCurrency(newCode);
    setTotalRaw(nextTotal > 0 ? String(nextTotal) : '');
    setHotelRaw(nextHotel > 0 ? String(nextHotel) : '');
    if (nextTotal > 0) setCanonicalAmount('total', nextTotal, newCode);
    if (nextHotel > 0) setCanonicalAmount('hotel', nextHotel, newCode);
  };

  const handleTotalChange = (t) => {
    const num = t.replace(/[^0-9]/g, '');
    setTotalRaw(num);
    setCanonicalAmount('total', num);
  };

  const handleHotelChange = (t) => {
    const num = t.replace(/[^0-9]/g, '');
    setHotelRaw(num);
    setCanonicalAmount('hotel', num);
  };

  const adjustSplit = (key, delta) => {
    setSplit(prev => {
      const next = { ...prev, [key]: Math.min(90, Math.max(5, prev[key] + delta)) };
      const others = Object.keys(prev).filter(k => k !== key);
      const rest = 100 - next[key];
      const otherSum = others.reduce((s, k) => s + prev[k], 0);
      others.forEach(k => {
        next[k] = otherSum > 0 ? Math.round((prev[k] / otherSum) * rest) : Math.floor(rest / 2);
      });
      const tot = Object.values(next).reduce((s, v) => s + v, 0);
      if (tot !== 100) next[others[0]] += (100 - tot);
      return next;
    });
    setSplitTouched(true);
    setSplitSource('custom');
  };

  const resetSplit = () => {
    setSplit({ ...DAILY_SPLIT_DEFAULT });
    setSplitTouched(false);
    setSplitSource('rule-default');
  };

  const handleContinue = () => {
    if (!canContinue) return;
    saveTotalBudget(String(totalNum));
    saveHotelBudget(String(hotelNum));
    navigateToPlannerSummary(navigation);
  };

  // ── Derived split amounts ──────────────────────────────────────────────────
  const normalizedSplit = normalizeDailySplit(split);
  const splitAmounts = {
    food:             Math.round((remaining * normalizedSplit.food) / 100),
    transport:        Math.round((remaining * normalizedSplit.transport) / 100),
    activities_misc:  Math.round((remaining * normalizedSplit.activities_misc) / 100),
  };
  const splitPerDay = {
    food:             ruleDays > 0 ? Math.round(splitAmounts.food / ruleDays) : 0,
    transport:        ruleDays > 0 ? Math.round(splitAmounts.transport / ruleDays) : 0,
    activities_misc:  ruleDays > 0 ? Math.round(splitAmounts.activities_misc / ruleDays) : 0,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={s.header}>
        <View style={s.headerRow}>
          <Pressable style={s.iconBtn} onPress={() => navigateToPlannerHotelPicker(navigation)}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTag}>Trip Planner · Step 5</Text>
            <Text style={s.headerTitle}>Set Your Budget</Text>
          </View>
          <Pressable style={s.cancelBtn} onPress={() => { cancelPlanning?.(); navigateToTripList(navigation); }}>
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
          <View style={s.pill}>
            <Ionicons name="map-outline" size={12} color={colors.white} />
            <Text style={s.pillText}>{selectedDistrict?.name || 'District'}</Text>
          </View>
          <View style={s.pill}>
            <Ionicons name="bed-outline" size={12} color={colors.white} />
            <Text style={s.pillText}>{selectedHotels?.length || 0} hotel{selectedHotels?.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={s.pill}>
            <Ionicons name="moon-outline" size={12} color={colors.white} />
            <Text style={s.pillText}>{nights} night{nights !== 1 ? 's' : ''}</Text>
          </View>
          <View style={s.pill}>
            <Ionicons name="calendar-outline" size={12} color={colors.white} />
            <Text style={s.pillText}>{ruleDays} day{ruleDays !== 1 ? 's' : ''}</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Currency ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconWrap}><Ionicons name="cash-outline" size={18} color={colors.primary} /></View>
            <Text style={s.cardTitle}>Currency</Text>
          </View>
          <View style={s.currencyRow}>
            {CURRENCIES.map(c => (
              <Pressable
                key={c.code}
                style={[s.currencyChip, currency === c.code && s.currencyChipActive]}
                onPress={() => handleCurrencyChange(c.code)}
              >
                <Text style={s.currencyFlag}>{c.flag}</Text>
                <Text style={[s.currencyLabel, currency === c.code && s.currencyLabelActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Total Budget ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconWrap}><Ionicons name="wallet-outline" size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Total Trip Budget</Text>
              <Text style={s.cardSub}>Your overall spend limit including food, transport & accommodation</Text>
            </View>
          </View>
          <View style={s.inputWrap}>
            <Text style={s.inputSymbol}>{sym}</Text>
            <TextInput
              style={s.budgetInput}
              value={totalRaw}
              onChangeText={handleTotalChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={s.inputCode}>{currency}</Text>
          </View>
          <View style={s.quickRow}>
            {getQuick(currency).map(q => (
              <Pressable key={q} style={[s.quickChip, totalNum === q && s.quickChipActive]} onPress={() => { setTotalRaw(String(q)); setCanonicalAmount('total', q); }}>
                <Text style={[s.quickChipText, totalNum === q && s.quickChipTextActive]}>{fmt(q, sym)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Hotel Budget ── */}
        <View style={[s.card, isHotelOverTotal && s.cardError]}>
          <View style={s.cardHeader}>
            <View style={[s.cardIconWrap, isHotelOverTotal && { backgroundColor: colors.danger + '22' }]}>
              <Ionicons name="bed-outline" size={18} color={isHotelOverTotal ? colors.danger : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Hotel Budget</Text>
              <Text style={s.cardSub}>Amount allocated for accommodation</Text>
            </View>
            {estHotel > 0 && (
              <View style={s.estPill}>
                <Text style={s.estPillText}>Est. {fmt(estHotel, sym)}</Text>
              </View>
            )}
          </View>

          <View style={[s.inputWrap, isHotelOverTotal && s.inputWrapError]}>
            <Text style={[s.inputSymbol, isHotelOverTotal && { color: colors.danger }]}>{sym}</Text>
            <TextInput
              style={[s.budgetInput, isHotelOverTotal && { color: colors.danger }]}
              value={hotelRaw}
              onChangeText={handleHotelChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[s.inputCode, isHotelOverTotal && { color: colors.danger }]}>{currency}</Text>
          </View>

          {isHotelOverTotal && (
            <View style={s.errorBanner}>
              <Ionicons name="warning-outline" size={14} color={colors.danger} />
              <Text style={s.errorText}>Hotel budget exceeds total budget</Text>
            </View>
          )}

          <View style={s.quickRow}>
            {hotelQuickPicks.map((q, i) => (
              <Pressable key={i} style={[s.quickChip, hotelNum === q.amount && s.quickChipActive]} onPress={() => { setHotelRaw(String(q.amount)); setCanonicalAmount('hotel', q.amount); }}>
                <Text style={[s.quickChipText, hotelNum === q.amount && s.quickChipTextActive]}>{q.label}</Text>
              </Pressable>
            ))}
          </View>

          {hotelPct > 0 && (
            <View style={s.progressWrap}>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${hotelPct}%`, backgroundColor: isHotelOverTotal ? colors.danger : colors.primary }]} />
                <View style={[s.progressFillOther, { width: `${Math.max(0, 100 - hotelPct)}%` }]} />
              </View>
              <View style={s.progressLegend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={s.legendText}>Hotel {hotelPct}%</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: colors.surface3 }]} />
                  <Text style={s.legendText}>Other {Math.max(0, 100 - hotelPct)}%</Text>
                </View>
                {remaining > 0 && <Text style={s.remainingHint}>{fmt(remaining, sym)} remaining for food & activities</Text>}
              </View>
            </View>
          )}

          {/* Selected Hotels Full Total box */}
          {selectedHotelsTotal > 0 && (
            <View style={s.hotelTotalBox}>
              <Text style={s.hotelTotalBoxLabel}>SELECTED HOTELS FULL TOTAL</Text>
              <Text style={s.hotelTotalBoxValue}>
                {fmt(selectedHotelsTotal, sym)}
                <Text style={s.hotelTotalBoxCur}> {currency}</Text>
              </Text>
              <Text style={s.hotelTotalBoxMeta}>
                {totalNightsUsed} night{totalNightsUsed !== 1 ? 's' : ''} across {(selectedHotels || []).length} hotel{(selectedHotels || []).length !== 1 ? 's' : ''}
                {selectedVsHotelBudgetDiff !== null && (
                  <Text style={selectedVsHotelBudgetDiff >= 0 ? s.hotelTotalOk : s.hotelTotalOver}>
                    {selectedVsHotelBudgetDiff >= 0
                      ? `  ·  within hotel budget by ${fmt(selectedVsHotelBudgetDiff, sym)}`
                      : `  ·  over hotel budget by ${fmt(Math.abs(selectedVsHotelBudgetDiff), sym)}`}
                  </Text>
                )}
              </Text>
              <Pressable
                style={s.hotelTotalQuickBtn}
                onPress={() => { setHotelRaw(String(selectedHotelsTotal)); setCanonicalAmount('hotel', selectedHotelsTotal); }}
              >
                <Text style={s.hotelTotalQuickBtnText}>Quick select full total</Text>
              </Pressable>
            </View>
          )}

          {/* Selected Hotels list inline */}
          {(selectedHotels || []).length > 0 && (
            <View style={s.inlineHotelsWrap}>
              <View style={s.inlineHotelsHeader}>
                <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                <Text style={s.inlineHotelsTitle}>Currently Selected Hotels</Text>
                <Text style={s.inlineHotelsHint}>{(selectedHotels || []).length} selected · adjust nights or remove in hotel step</Text>
              </View>
              {selectedHotels.map((h, i) => {
                const price = getHotelNightlyPriceLkr(h);
                const hotelNights = Math.max(1, Number(h.nights) || 1);
                const total = convertFromLKR(price * hotelNights, currency);
                return (
                  <View key={i} style={s.inlineHotelRow}>
                    <View style={s.inlineHotelDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.inlineHotelName} numberOfLines={1}>{h.name}</Text>
                      <Text style={s.inlineHotelMeta}>
                        {hotelNights} night{hotelNights !== 1 ? 's' : ''} · {price > 0 ? fmt(total, sym) : 'Price not listed'}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {estHotel > 0 && (
                <View style={s.inlineEstTotal}>
                  <Text style={s.inlineEstLabel}>Estimated hotel total</Text>
                  <Text style={s.inlineEstAmt}>{fmt(estHotel, sym)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Trip Days ── */}
        <View style={[s.card, isTripDaysInvalid && totalNum > 0 && s.cardWarn]}>
          <View style={s.cardHeader}>
            <View style={s.cardIconWrap}><Ionicons name="calendar-outline" size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Total Trip Days</Text>
              <Text style={s.cardSub}>Full duration including non-hotel days</Text>
            </View>
          </View>

          <View style={s.stepperRow}>
            <Pressable
              style={[s.stepBtn, Number(tripDays) <= minDays && s.stepBtnDisabled]}
              onPress={() => setTripDays(d => String(Math.max(minDays, (Number(d) || minDays) - 1)))}
              disabled={Number(tripDays) <= minDays}
            >
              <Ionicons name="remove" size={20} color={Number(tripDays) <= minDays ? colors.textMuted : colors.primary} />
            </Pressable>
            <View style={s.stepperDisplay}>
              <Text style={s.stepperNumber}>{tripDays || minDays}</Text>
              <Text style={s.stepperUnit}>{Number(tripDays || minDays) === 1 ? 'day' : 'days'}</Text>
            </View>
            <Pressable
              style={s.stepBtn}
              onPress={() => setTripDays(d => String(Math.min(365, Math.max(minDays, (Number(d) || 0) + 1))))}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <View style={s.quickRow}>
            {DAY_PICKS.map(d => (
              <Pressable
                key={d}
                style={[s.quickChip, String(tripDays) === String(d) && s.quickChipActive, d < minDays && s.quickChipDisabled]}
                onPress={() => d >= minDays && setTripDays(String(d))}
                disabled={d < minDays}
              >
                <Text style={[s.quickChipText, String(tripDays) === String(d) && s.quickChipTextActive, d < minDays && { color: colors.textMuted }]}>{d}d</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.daysInfo}>
            <Ionicons name="bed-outline" size={13} color={colors.textMuted} />
            <Text style={s.daysInfoText}>
              Hotel stay: <Text style={s.daysInfoBold}>{nights} night{nights !== 1 ? 's' : ''}</Text> · min {minDays} day{minDays !== 1 ? 's' : ''}
            </Text>
          </View>

          {totalNum > 0 && remaining > 0 && (
            <View style={s.perDayRow}>
              <Ionicons name="trending-up-outline" size={13} color={colors.primary} />
              <Text style={s.perDayText}>
                <Text style={{ fontWeight: '900', color: colors.primary }}>{fmt(perDayBudget, sym)}</Text> / day non-hotel budget
              </Text>
            </View>
          )}
        </View>

        {/* ── Daily Split ── */}
        {totalNum > 0 && hotelNum > 0 && !isHotelOverTotal && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconWrap}><Ionicons name="pie-chart-outline" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Daily Split</Text>
                <Text style={s.cardSub}>
                  {fmt(remaining, sym)} across {ruleDays} day{ruleDays !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={s.sourceBadge}>
                <Text style={s.sourceBadgeText}>{SOURCE_LABELS[splitSource] || splitSource}</Text>
              </View>
            </View>

            {/* Full budget breakdown bar */}
            <View style={s.fullBarWrap}>
              <View style={s.fullBar}>
                <View style={[s.fullBarSeg, { flex: hotelPct, backgroundColor: colors.primary }]} />
                {hotelPct < 100 && Object.entries(normalizedSplit).map(([key, pct]) => (
                  <View key={key} style={[s.fullBarSeg, { flex: Math.round(pct * (100 - hotelPct) / 100), backgroundColor: SPLIT_COLORS[key] }]} />
                ))}
              </View>
              <View style={s.fullBarLegend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={s.legendText}>Hotel {hotelPct}%</Text>
                </View>
                {Object.entries(normalizedSplit).map(([key, pct]) => (
                  <View key={key} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: SPLIT_COLORS[key] }]} />
                    <Text style={s.legendText}>{SPLIT_LABELS[key].split(' ')[0]} {Math.round(pct * (100 - hotelPct) / 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {Object.entries(split).map(([key, pct]) => {
              const amount = splitAmounts[key];
              const perDay = splitPerDay[key];
              const color  = SPLIT_COLORS[key];
              return (
                <View key={key} style={s.splitRow}>
                  <View style={[s.splitDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <View style={s.splitTopRow}>
                      <Text style={s.splitLabel}>{SPLIT_EMOJIS[key]} {SPLIT_LABELS[key]}</Text>
                      <Text style={s.splitAmt}>{fmt(amount, sym)}</Text>
                    </View>
                    <View style={s.splitBarTrack}>
                      <View style={[s.splitBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                    <View style={s.splitBotRow}>
                      <Text style={s.splitPerDay}>{fmt(perDay, sym)} / day · {ruleDays} day{ruleDays !== 1 ? 's' : ''}</Text>
                      <View style={s.splitPctRow}>
                        <Pressable style={s.splitBtn} onPress={() => adjustSplit(key, -5)}>
                          <Ionicons name="remove" size={14} color={colors.textSecondary} />
                        </Pressable>
                        <Text style={s.splitPct}>{pct}%</Text>
                        <Pressable style={s.splitBtn} onPress={() => adjustSplit(key, 5)}>
                          <Ionicons name="add" size={14} color={colors.textSecondary} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Quick summary */}
            <View style={s.summaryBox}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Plan type</Text>
                <Text style={s.summaryValue}>{SOURCE_LABELS[splitSource] || splitSource}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Non-hotel / day</Text>
                <Text style={[s.summaryValue, { color: colors.primary }]}>{fmt(perDayBudget, sym)} / day</Text>
              </View>
              {isHotelOverTotal && (
                <View style={s.summaryRow}>
                  <Text style={[s.summaryTip, { color: colors.danger }]}>Hotel budget exceeds total — please adjust to continue.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Validation warnings ── */}
        {(isTripDaysInvalid || isHotelOverTotal) && totalNum > 0 && (
          <View style={s.validWarn}>
            <Ionicons name="warning-outline" size={15} color={colors.warning} />
            <Text style={s.validWarnText}>
              {isTripDaysInvalid
                ? `Trip days must be at least ${minDays} (your hotel nights).`
                : 'Hotel budget cannot exceed total trip budget.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Floating Bottom Bar ── */}
      <View style={[s.bottomBar, { bottom: Math.max(insets.bottom, 15) + 75 }]}>
        <View style={s.bottomRow}>
          {totalNum > 0 && (
            <View style={s.budgetSummaryPill}>
              <Ionicons name="wallet-outline" size={12} color={colors.primary} />
              <Text style={s.budgetSummaryText}>{fmt(totalNum, sym)}</Text>
              {hotelNum > 0 && !isHotelOverTotal && (
                <Text style={s.budgetSummaryText}> · {fmt(remaining, sym)} other</Text>
              )}
              <Text style={s.budgetSummaryText}> · {ruleDays}d</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Pressable
            style={[s.nextBtn, !canContinue && s.nextBtnDisabled]}
            disabled={!canContinue}
            onPress={handleContinue}
          >
            <Text style={s.nextBtnText}>Save Trip</Text>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTag: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '900' },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  cancelText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pillText: { color: colors.white, fontSize: 12, fontWeight: '700' },

  scroll: { padding: 16, gap: 14 },

  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  cardError: { borderColor: colors.danger + '55' },
  cardWarn: { borderColor: colors.warning + '55' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary + '14', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  cardSub: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 2 },

  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1.5, borderColor: 'transparent', gap: 4 },
  currencyChipActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  currencyFlag: { fontSize: 20 },
  currencyLabel: { fontSize: 12, fontWeight: '900', color: colors.textSecondary },
  currencyLabelActive: { color: colors.primary },

  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, height: 56 },
  inputWrapError: { borderColor: colors.danger },
  inputSymbol: { fontSize: 20, fontWeight: '900', color: colors.primary, marginRight: 8 },
  budgetInput: { flex: 1, fontSize: 24, fontWeight: '900', color: colors.textPrimary },
  inputCode: { fontSize: 13, fontWeight: '800', color: colors.textMuted, marginLeft: 6 },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  quickChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickChipDisabled: { opacity: 0.4 },
  quickChipText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  quickChipTextActive: { color: colors.white },

  estPill: { backgroundColor: colors.success + '18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  estPillText: { fontSize: 11, fontWeight: '800', color: colors.success },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.danger + '12', padding: 10, borderRadius: 10 },
  errorText: { fontSize: 12, fontWeight: '700', color: colors.danger },

  progressWrap: { gap: 8 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.border },
  progressFill: { height: '100%' },
  progressFillOther: { height: '100%', backgroundColor: colors.surface3 },
  progressLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  remainingHint: { fontSize: 11, fontWeight: '700', color: colors.primary, marginLeft: 'auto' },

  // Trip Days
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary + '14', borderWidth: 1.5, borderColor: colors.primary + '33', alignItems: 'center', justifyContent: 'center' },
  stepBtnDisabled: { backgroundColor: colors.surface2, borderColor: colors.border },
  stepperDisplay: { alignItems: 'center', minWidth: 80 },
  stepperNumber: { fontSize: 40, fontWeight: '900', color: colors.textPrimary, lineHeight: 46 },
  stepperUnit: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  daysInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface2, padding: 10, borderRadius: 10 },
  daysInfoText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  daysInfoBold: { fontWeight: '900', color: colors.textPrimary },
  perDayRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '0D', padding: 10, borderRadius: 10 },
  perDayText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },

  // Split card
  sourceBadge: { backgroundColor: colors.primary + '14', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '33' },
  sourceBadgeText: { fontSize: 10, fontWeight: '900', color: colors.primary },
  fullBarWrap: { gap: 8 },
  fullBar: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  fullBarSeg: { height: '100%' },
  fullBarLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  splitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  splitDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  splitTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  splitLabel: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  splitAmt: { fontSize: 13, fontWeight: '900', color: colors.textPrimary },
  splitBarTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  splitBarFill: { height: '100%', borderRadius: 3 },
  splitBotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  splitPerDay: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  splitPctRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  splitPct: { fontSize: 13, fontWeight: '900', color: colors.primary, minWidth: 32, textAlign: 'center' },

  summaryBox: { backgroundColor: colors.surface2, borderRadius: 12, padding: 12, gap: 6, borderTopWidth: 1, borderTopColor: colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  summaryValue: { fontSize: 12, fontWeight: '900', color: colors.textPrimary },
  summaryTip: { fontSize: 11, fontWeight: '700', color: colors.textMuted, fontStyle: 'italic' },

  // Hotel total box
  hotelTotalBox: { backgroundColor: colors.primary + '0A', borderRadius: 14, borderWidth: 1, borderColor: colors.primary + '33', padding: 14, gap: 6 },
  hotelTotalBoxLabel: { fontSize: 10, fontWeight: '900', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  hotelTotalBoxValue: { fontSize: 22, fontWeight: '900', color: colors.primary },
  hotelTotalBoxCur: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  hotelTotalBoxMeta: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  hotelTotalOk: { color: colors.success, fontWeight: '800' },
  hotelTotalOver: { color: colors.danger, fontWeight: '800' },
  hotelTotalQuickBtn: { alignSelf: 'flex-start', marginTop: 4, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  hotelTotalQuickBtnText: { color: colors.white, fontSize: 13, fontWeight: '900' },

  hotelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  hotelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  hotelName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  hotelMeta: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  estTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  estTotalLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  estTotalAmt: { fontSize: 15, fontWeight: '900', color: colors.primary },

  // Inline hotels (inside Hotel Budget card)
  inlineHotelsWrap: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 0 },
  inlineHotelsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  inlineHotelsTitle: { fontSize: 13, fontWeight: '900', color: colors.primary },
  inlineHotelsHint: { fontSize: 11, fontWeight: '700', color: colors.textMuted, flex: 1 },
  inlineHotelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.border },
  inlineHotelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  inlineHotelName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  inlineHotelMeta: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  inlineEstTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 2 },
  inlineEstLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  inlineEstAmt: { fontSize: 15, fontWeight: '900', color: colors.primary },

  validWarn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warning + '18', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.warning + '44' },
  validWarnText: { fontSize: 13, fontWeight: '700', color: colors.warning, flex: 1 },

  bottomBar: { position: 'absolute', left: 12, right: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, elevation: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetSummaryPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary + '14', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '33' },
  budgetSummaryText: { fontSize: 11, fontWeight: '900', color: colors.primary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12 },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { color: colors.white, fontSize: 13, fontWeight: '900' },
});

export default TripPlannerBudgetScreen;
