import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import colors from '../../constants/colors';
import {
  getAdminTripsBudgetHealthApi,
  getAdminAllExpensesApi,
  sendBudgetAlertApi,
  createAdminPriceRecordApi,
} from '../../api/adminExpenseApi';
import { getPlacesApi } from '../../api/placeApi';
import { getDistrictsApi } from '../../api/districtApi';
import { getHotelsApi } from '../../api/hotelApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrency, DISPLAY_CURRENCIES, convertAmt } from '../../utils/currencyFormat';

// ── Circular Progress ─────────────────────────────────────────────────────────
const CircularProgress = ({ pct, size = 55, strokeWidth = 5, color = colors.primary }) => {
  const radius = (size - strokeWidth) / 2;
  const circ = radius * 2 * Math.PI;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border + '50'} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: colors.textPrimary }}>{Math.round(pct)}%</Text>
      </View>
    </View>
  );
};

// ── Step Indicator ─────────────────────────────────────────────────────────────
const StepBar = ({ category }) => {
  const steps = category === 'activity'
    ? [{ icon: 'options-outline', label: 'TYPE' }, { icon: 'create-outline', label: 'DETAIL' }, { icon: 'cash-outline', label: 'PRICE' }]
    : [{ icon: 'options-outline', label: 'TYPE' }, { icon: 'location-outline', label: 'PLACE' }, { icon: 'cash-outline', label: 'PRICE' }];
  return (
    <View style={s.stepBar}>
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <View style={s.stepItem}>
            <View style={s.stepIconWrap}>
              <Ionicons name={step.icon} size={18} color={colors.textMuted} />
            </View>
            <Text style={s.stepLabel}>{step.label}</Text>
          </View>
          {i < steps.length - 1 && <Ionicons name="arrow-forward" size={14} color={colors.border} style={{ marginBottom: 18 }} />}
        </React.Fragment>
      ))}
    </View>
  );
};

// ── Market Intel Modal ─────────────────────────────────────────────────────────
// Each sub maps to { item_type, category } sent to backend
const ACTIVITY_SUBS = [
  { key: 'ticket',        label: 'Activities',    icon: 'ticket-outline',           item_type: 'ticket',   category: undefined },
  { key: 'food',          label: 'Food & Drink',  icon: 'restaurant-outline',       item_type: 'activity', category: 'food' },
  { key: 'entertainment', label: 'Entertainment', icon: 'musical-notes-outline',    item_type: 'activity', category: 'entertainment' },
  { key: 'shopping',      label: 'Shopping',      icon: 'cart-outline',             item_type: 'activity', category: 'shopping' },
  { key: 'amenity',       label: 'Amenity',       icon: 'add-circle-outline',       item_type: 'activity', category: 'amenity' },
  { key: 'other',         label: 'Other',         icon: 'ellipsis-horizontal-outline', item_type: 'activity', category: 'other' },
];

const MarketIntelModal = ({ visible, onClose, onPublished }) => {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('hotel');

  // Hotel: district → hotel flow
  const [districts, setDistricts]                 = useState([]);
  const [districtsLoading, setDistrictsLoading]   = useState(false);
  const [selectedDistrict, setSelectedDistrict]   = useState(null);
  const [hotels, setHotels]                       = useState([]);
  const [hotelsLoading, setHotelsLoading]         = useState(false);
  const [hotelQuery, setHotelQuery]               = useState('');
  const [selectedHotel, setSelectedHotel]         = useState(null);

  // Transport: places search
  const [places, setPlaces]               = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placeQuery, setPlaceQuery]       = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [activitySub, setActivitySub]   = useState('food');
  const [activityName, setActivityName] = useState('');
  const [currency, setCurrency]         = useState('LKR');
  const [price, setPrice]               = useState('');
  const [publishing, setPublishing]     = useState(false);
  const [error, setError]               = useState('');

  // Load districts when hotel category active
  useEffect(() => {
    if (!visible || category !== 'hotel' || districts.length > 0) return;
    (async () => {
      try {
        setDistrictsLoading(true);
        const res = await getDistrictsApi();
        const list = res?.data?.districts || res?.districts || [];
        setDistricts(list);
      } catch {
        setDistricts([]);
      } finally {
        setDistrictsLoading(false);
      }
    })();
  }, [visible, category]);

  // Load hotels when a district is picked
  useEffect(() => {
    if (!selectedDistrict) { setHotels([]); return; }
    (async () => {
      try {
        setHotelsLoading(true);
        setHotels([]);
        const res = await getHotelsApi({ district: selectedDistrict.name, limit: 500 });
        setHotels(res?.data?.hotels || []);
      } catch {
        setHotels([]);
      } finally {
        setHotelsLoading(false);
      }
    })();
  }, [selectedDistrict]);

  // Load transport places when transport category active
  useEffect(() => {
    if (!visible || category !== 'transport' || places.length > 0) return;
    (async () => {
      try {
        setPlacesLoading(true);
        const res = await getPlacesApi({ limit: 1000 });
        setPlaces(res?.data?.places || []);
      } catch {
        setPlaces([]);
      } finally {
        setPlacesLoading(false);
      }
    })();
  }, [visible, category]);

  const filteredHotels = (() => {
    const q = hotelQuery.trim().toLowerCase();
    if (!q) return hotels.slice(0, 50);
    return hotels.filter(h => h.name?.toLowerCase().includes(q)).slice(0, 50);
  })();

  const filteredPlaces = (() => {
    const q = placeQuery.trim().toLowerCase();
    if (!q) return [];
    return places
      .filter(p => p.name?.toLowerCase().includes(q) || p.district?.toLowerCase().includes(q))
      .slice(0, 8);
  })();

  const reset = () => {
    setCategory('hotel');
    setSelectedDistrict(null); setHotels([]);
    setHotelQuery(''); setSelectedHotel(null);
    setPlaceQuery(''); setSelectedPlace(null);
    setActivitySub('food');
    setActivityName(''); setCurrency('LKR'); setPrice(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePublish = async () => {
    const p = Number(price);
    if (!p || p <= 0) { setError('Enter a valid price'); return; }
    if (category === 'hotel' && !selectedHotel) { setError('Pick a district then select a hotel'); return; }
    if (category === 'transport' && !selectedPlace) { setError('Select a location'); return; }
    if (category === 'activity' && activitySub !== 'ticket' && !activityName.trim()) { setError('Enter an activity description'); return; }

    const sub = ACTIVITY_SUBS.find(s => s.key === activitySub);
    setPublishing(true); setError('');
    try {
      await createAdminPriceRecordApi({
        item_type:     category === 'activity' ? (sub?.item_type || 'activity') : category,
        category:      category === 'activity' ? (sub?.category || undefined)   : undefined,
        activity_name: category === 'activity' ? activityName.trim() || undefined : undefined,
        place_id:      category === 'hotel' ? selectedHotel?.place_id : (category === 'transport' ? selectedPlace?.place_id : undefined),
        price:         p,
        currency,
      });
      reset();
      onPublished?.();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to publish record'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={s.overlay} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
        pointerEvents="box-none"
      >
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Sheet header */}
          <View style={s.sheetHeader}>
            <View>
              <Text style={s.sheetTitle}>Market Intel Entry</Text>
              <Text style={s.sheetSub}>Updating user-side budget trends</Text>
            </View>
            <Pressable style={s.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Step bar */}
            <StepBar category={category} />

            {/* 1. Category */}
            <Text style={s.stepNum}>1. SELECT CATEGORY</Text>
            <View style={s.catRow}>
              {[
                { key: 'hotel',     label: 'HOTEL',     icon: 'bed-outline' },
                { key: 'transport', label: 'TRANSPORT',  icon: 'bus-outline' },
                { key: 'activity',  label: 'ACTIVITY',  icon: 'ticket-outline' },
              ].map(c => (
                <Pressable
                  key={c.key}
                  style={[s.catBtn, category === c.key && s.catBtnActive]}
                  onPress={() => {
                    setCategory(c.key);
                    setActivityName(''); setError('');
                    setSelectedDistrict(null); setHotelQuery(''); setSelectedHotel(null);
                    setPlaceQuery(''); setSelectedPlace(null);
                  }}
                >
                  <Ionicons name={c.icon} size={22} color={category === c.key ? colors.white : colors.textSecondary} />
                  <Text style={[s.catLabel, category === c.key && s.catLabelActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* 2a. HOTEL: District → Hotel */}
            {category === 'hotel' && (
              <View style={{ marginBottom: 20 }}>
                <Text style={s.stepNum}>2. SELECT DISTRICT</Text>
                {districtsLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
                ) : (
                  <View style={s.subRow}>
                    {districts.map(d => (
                      <Pressable
                        key={d.district_id || d._id}
                        style={[s.subChip, selectedDistrict?.district_id === d.district_id && s.subChipActive]}
                        onPress={() => {
                          setSelectedDistrict(d);
                          setSelectedHotel(null);
                          setHotelQuery('');
                        }}
                      >
                        <Ionicons name="location-outline" size={13} color={selectedDistrict?.district_id === d.district_id ? colors.white : colors.textSecondary} />
                        <Text style={[s.subChipText, selectedDistrict?.district_id === d.district_id && s.subChipTextActive]}>{d.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {selectedDistrict && (
                  <>
                    <Text style={[s.stepNum, { marginTop: 16 }]}>3. SEARCH HOTEL IN {selectedDistrict.name?.toUpperCase()}</Text>

                    {selectedHotel ? (
                      <Pressable
                        style={s.selectedHotelChip}
                        onPress={() => { setSelectedHotel(null); setHotelQuery(''); }}
                      >
                        <Ionicons name="bed" size={18} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={s.selectedHotelName} numberOfLines={1}>{selectedHotel.name}</Text>
                          <Text style={s.selectedHotelMeta}>{selectedDistrict.name}{selectedHotel.hotel_type ? ` · ${selectedHotel.hotel_type}` : ''}</Text>
                        </View>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                      </Pressable>
                    ) : (
                      <>
                        <View style={s.searchBox2}>
                          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                          <TextInput
                            style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginLeft: 8 }}
                            placeholder={`Filter ${hotels.length} hotels in ${selectedDistrict.name}...`}
                            placeholderTextColor={colors.textMuted}
                            value={hotelQuery}
                            onChangeText={setHotelQuery}
                          />
                          {hotelsLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
                          {hotelQuery.length > 0 && !hotelsLoading && (
                            <Pressable onPress={() => setHotelQuery('')}>
                              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                            </Pressable>
                          )}
                        </View>

                        {!hotelsLoading && (
                          <ScrollView nestedScrollEnabled style={s.hotelDropdownScroll}>
                            {filteredHotels.length > 0 ? filteredHotels.map(h => (
                              <Pressable
                                key={h._id || h.place_id}
                                style={s.hotelDropdownItem}
                                onPress={() => { setSelectedHotel(h); setHotelQuery(''); }}
                              >
                                <Ionicons name="bed-outline" size={15} color={colors.primary} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                  <Text style={s.hotelDropdownName} numberOfLines={1}>{h.name}</Text>
                                  <Text style={s.hotelDropdownMeta}>
                                    {[h.hotel_type, h.star_class ? `${h.star_class}★` : null].filter(Boolean).join(' · ')}
                                  </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={14} color={colors.border} />
                              </Pressable>
                            )) : (
                              <View style={s.hotelNoResults}>
                                <Ionicons name="alert-circle-outline" size={16} color={colors.textMuted} />
                                <Text style={s.hotelNoResultsText}>
                                  {hotelQuery ? `No hotels match "${hotelQuery}"` : 'No hotels in this district'}
                                </Text>
                              </View>
                            )}
                          </ScrollView>
                        )}
                      </>
                    )}
                  </>
                )}
              </View>
            )}

            {/* 2b. TRANSPORT: location search */}
            {category === 'transport' && (
              <View style={{ marginBottom: 20 }}>
                <Text style={s.stepNum}>2. SEARCH LOCATION</Text>
                <View style={s.searchBox2}>
                  <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginLeft: 8 }}
                    placeholder="Enter city name..."
                    placeholderTextColor={colors.textMuted}
                    value={placeQuery}
                    onChangeText={v => { setPlaceQuery(v); setSelectedPlace(null); }}
                  />
                  {placesLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
                  {placeQuery.length > 0 && !placesLoading && (
                    <Pressable onPress={() => { setPlaceQuery(''); setSelectedPlace(null); }}>
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>

                {placeQuery.length > 0 && !selectedPlace && (
                  <View style={s.hotelDropdown}>
                    {filteredPlaces.length > 0 ? filteredPlaces.map(p => (
                      <Pressable
                        key={p.place_id || p._id}
                        style={s.hotelDropdownItem}
                        onPress={() => { setSelectedPlace(p); setPlaceQuery(p.name); }}
                      >
                        <Ionicons name="location-outline" size={15} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={s.hotelDropdownName} numberOfLines={1}>{p.name}</Text>
                          <Text style={s.hotelDropdownMeta}>{[p.type, p.district].filter(Boolean).join(' · ')}</Text>
                        </View>
                      </Pressable>
                    )) : (
                      <View style={s.hotelNoResults}>
                        <Ionicons name="alert-circle-outline" size={16} color={colors.textMuted} />
                        <Text style={s.hotelNoResultsText}>No locations match "{placeQuery}"</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedPlace && (
                  <View style={s.selectedHotelChip}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={[s.selectedHotelName, { marginLeft: 8 }]}>Selected: {selectedPlace.name}</Text>
                  </View>
                )}
              </View>
            )}

            {category === 'activity' && (
              <>
                <Text style={s.stepNum}>2. ACTIVITY SUB-CATEGORY</Text>
                <View style={s.subRow}>
                  {ACTIVITY_SUBS.map(sub => (
                    <Pressable
                      key={sub.key}
                      style={[s.subChip, activitySub === sub.key && s.subChipActive]}
                      onPress={() => setActivitySub(sub.key)}
                    >
                      <Ionicons name={sub.icon} size={13} color={activitySub === sub.key ? colors.white : colors.textSecondary} />
                      <Text style={[s.subChipText, activitySub === sub.key && s.subChipTextActive]}>{sub.label}</Text>
                    </Pressable>
                  ))}
                </View>
                {activitySub !== 'ticket' && (
                  <TextInput
                    style={s.nameInput}
                    placeholder={
                      activitySub === 'food'          ? 'e.g. Street food, restaurant meal…' :
                      activitySub === 'entertainment' ? 'e.g. Live show, nightlife…' :
                      activitySub === 'shopping'      ? 'e.g. Souvenir, clothing…' :
                      activitySub === 'amenity'       ? 'e.g. Spa, guided tour…' :
                      'Describe the expense…'
                    }
                    placeholderTextColor={colors.textMuted}
                    value={activityName}
                    onChangeText={setActivityName}
                  />
                )}
              </>
            )}

            {/* 3. Price */}
            <Text style={s.stepNum}>3. PRICE</Text>
            <View style={s.priceRow}>
              <Pressable
                style={s.currChip}
                onPress={() => {
                  const idx = DISPLAY_CURRENCIES.findIndex(c => c.code === currency);
                  setCurrency(DISPLAY_CURRENCIES[(idx + 1) % DISPLAY_CURRENCIES.length].code);
                }}
              >
                <Text style={s.currChipText}>{currency}</Text>
              </Pressable>
              <TextInput
                style={s.priceInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={price}
                onChangeText={v => setPrice(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
            </View>

            {error ? (
              <View style={s.errorRow}>
                <Ionicons name="warning-outline" size={13} color={colors.danger} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Publish */}
            <Pressable style={[s.publishBtn, publishing && { opacity: 0.6 }]} onPress={handlePublish} disabled={publishing}>
              {publishing
                ? <ActivityIndicator color={colors.white} />
                : <Text style={s.publishBtnText}>Publish to Live Trends</Text>}
            </Pressable>

            <View style={s.secureRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.textMuted} />
              <Text style={s.secureText}>Secure administrator verification required for all live records</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────
const AdminTripHealthScreen = ({ navigation }) => {
  const [displayCurrency, setDisplayCurrency] = useState('LKR');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [trips, setTrips]         = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [intelVisible, setIntelVisible] = useState(false);

  const loadData = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setError('');
      const [tripRes, expRes] = await Promise.all([
        getAdminTripsBudgetHealthApi(),
        getAdminAllExpensesApi({ limit: 5000 }),
      ]);
      setTrips(tripRes?.data?.trips || []);
      setExpenses(expRes?.data?.expenses || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load health metrics'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const tripHealth = useMemo(() => {
    return trips.map(t => {
      const budgetLkr = convertAmt(t.budget || 0, t.currency || 'LKR', 'LKR');
      const usedLkr = expenses
        .filter(e => String(e.tripId?._id || e.tripId) === String(t._id) && e.status === 'paid')
        .reduce((s, e) => s + convertAmt(e.amount, e.currency || 'LKR', 'LKR'), 0);
      const pct = budgetLkr > 0 ? (usedLkr / budgetLkr) * 100 : 0;
      return { ...t, usedLkr, budgetLkr, pct };
    })
    .filter(t =>
      (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.userId?.fullName || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.pct - a.pct);
  }, [trips, expenses, search]);

  const handleSendAlert = (trip) => {
    const defaultMsg = `Budget Alert: You have used ${Math.round(trip.pct)}% of your planned budget for "${trip.title}".`;
    Alert.alert(
      'Send Budget Alert',
      `Target: ${trip.userId?.fullName || 'Traveler'}\n\n${defaultMsg}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          onPress: async () => {
            try {
              await sendBudgetAlertApi({
                userId:  trip.userId?._id || trip.userId,
                tripId:  trip._id,
                type:    'BUDGET_100',
                message: defaultMsg,
              });
              Alert.alert('Sent', 'Budget alert delivered.');
            } catch { Alert.alert('Error', 'Failed to send alert'); }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={s.bellBtn} onPress={() => navigation.navigate('AdminAlerts')}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          </Pressable>
          <View style={s.currencyToggle}>
            {DISPLAY_CURRENCIES.map(c => (
              <Pressable
                key={c.code}
                style={[s.currBtn, displayCurrency === c.code && s.currBtnActive]}
                onPress={() => setDisplayCurrency(c.code)}
              >
                <Text style={[s.currBtnText, displayCurrency === c.code && s.currBtnTextActive]}>{c.code}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={s.headerTitle}>Platform Intelligence</Text>
        <Text style={s.headerSub}>Manage market costs and trip health analytics</Text>
        <View style={s.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search traveler or trip title..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={tripHealth}
          keyExtractor={item => item._id}
          renderItem={({ item: t }) => {
            const ringColor = t.pct >= 100 ? colors.danger : t.pct >= 80 ? colors.warning : colors.primary;
            return (
              <View style={[s.tripCard, t.pct >= 100 && s.tripCardOver]}>
                <CircularProgress pct={t.pct} color={ringColor} />
                <View style={s.tripInfo}>
                  <Text style={s.tripTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={s.tripUser}>{t.userId?.fullName || 'Traveler'}</Text>
                  <Text style={s.tripUsed}>
                    {formatCurrency(convertAmt(t.usedLkr, 'LKR', displayCurrency), displayCurrency)}
                    <Text style={{ color: colors.textMuted }}> / </Text>
                    {formatCurrency(convertAmt(t.budgetLkr, 'LKR', displayCurrency), displayCurrency)}
                  </Text>
                </View>
                {t.pct >= 80 && (
                  <Pressable
                    style={[s.alertBtn, { backgroundColor: t.pct >= 100 ? colors.danger : colors.warning }]}
                    onPress={() => handleSendAlert(t)}
                  >
                    <Ionicons name="notifications" size={15} color={colors.white} />
                    <Text style={s.alertBtnText}>Alert</Text>
                  </Pressable>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.border} />
              <Text style={s.emptyText}>No trip health data yet</Text>
            </View>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(true); }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - open Market Intel */}
      <Pressable style={s.fab} onPress={() => setIntelVisible(true)}>
        <Ionicons name="add" size={26} color={colors.white} />
      </Pressable>

      <MarketIntelModal
        visible={intelVisible}
        onClose={() => setIntelVisible(false)}
        onPublished={() => loadData(true)}
      />
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, padding: 16, paddingBottom: 14, gap: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  bellBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 24, fontWeight: '900', color: colors.textPrimary },
  headerSub: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: -4 },

  currencyToggle: { flexDirection: 'row', backgroundColor: colors.surface2, padding: 3, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginLeft: 'auto' },
  currBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  currBtnActive: { backgroundColor: colors.primary },
  currBtnText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  currBtnTextActive: { color: colors.white },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface2, paddingHorizontal: 12, borderRadius: 12, height: 42, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '700', color: colors.textMuted },

  tripCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  tripCardOver: { borderColor: colors.danger + '40', backgroundColor: colors.danger + '05' },
  tripInfo: { flex: 1, marginLeft: 14 },
  tripTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  tripUser: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  tripUsed: { fontSize: 12, color: colors.textSecondary, fontWeight: '700', marginTop: 4 },
  alertBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  alertBtnText: { fontSize: 12, fontWeight: '900', color: colors.white },

  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },

  // Modal / Sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 20, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  sheetSub: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },

  stepBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 20, gap: 8 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  stepLabel: { fontSize: 10, fontWeight: '900', color: colors.textMuted, letterSpacing: 0.5 },

  stepNum: { fontSize: 11, fontWeight: '900', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  catRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  catBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: colors.surface2, borderWidth: 1.5, borderColor: colors.border },
  catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catLabel: { fontSize: 11, fontWeight: '900', color: colors.textSecondary, letterSpacing: 0.5 },
  catLabelActive: { color: colors.white },

  searchBox2: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface2, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 50 },

  hotelDropdown: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, marginTop: 6, overflow: 'hidden' },
  hotelDropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border + '60' },
  hotelDropdownName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  hotelDropdownMeta: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
  hotelNoResults: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4 },
  hotelNoResultsText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },

  selectedHotelChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '12', borderWidth: 1.5, borderColor: colors.primary + '40', borderRadius: 14, padding: 14 },
  selectedHotelName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  selectedHotelMeta: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 },

  subRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  subChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  subChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  subChipText: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  subChipTextActive: { color: colors.white },
  nameInput: { backgroundColor: colors.surface2, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 50, fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 20 },

  priceRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  currChip: { backgroundColor: colors.primary + '14', borderWidth: 1.5, borderColor: colors.primary + '55', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', minWidth: 60 },
  currChipText: { fontSize: 13, fontWeight: '900', color: colors.primary },
  priceInput: { flex: 1, backgroundColor: colors.surface2, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, height: 54, fontSize: 22, fontWeight: '900', color: colors.textPrimary },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.danger + '12', padding: 10, borderRadius: 10, marginBottom: 12 },
  errorText: { fontSize: 12, fontWeight: '700', color: colors.danger, flex: 1 },

  publishBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  publishBtnText: { color: colors.white, fontSize: 16, fontWeight: '900' },

  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  secureText: { fontSize: 11, fontWeight: '600', color: colors.textMuted, fontStyle: 'italic' },
});

export default AdminTripHealthScreen;
