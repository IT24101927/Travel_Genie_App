import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppInput   from '../../components/common/AppInput';
import AppButton  from '../../components/common/AppButton';
import ErrorText  from '../../components/common/ErrorText';
import colors     from '../../constants/colors';
import { getDistrictsApi }    from '../../api/districtApi';
import { getPlacesApi }       from '../../api/placeApi';
import { getHotelsApi }       from '../../api/hotelApi';
import { updateTripApi }      from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';

// ── helpers ───────────────────────────────────────────────────────────────────
const safeArr = (v) => (Array.isArray(v) ? v : []);
const keyOf   = (x) => String(x?._id || x?.id || x?.place_id || x?.hotel_id || '');
const toIso   = (v) => { if (!v) return ''; const d = new Date(v); return isNaN(d) ? '' : d.toISOString().slice(0,10); };
const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate()+Math.max(1,Number(n)||1)); return toIso(d); };
const calcNights = (s,e) => { if (!s||!e) return 1; return Math.max(1,Math.round((new Date(e)-new Date(s))/86400000)); };

const STATUS_OPTS = [
  {id:'planned',  label:'Planned',   icon:'📅'},
  {id:'ongoing',  label:'Ongoing',   icon:'🚀'},
  {id:'completed',label:'Completed', icon:'✅'},
  {id:'cancelled',label:'Cancelled', icon:'❌'},
];
const HOTEL_TYPE_OPTS = [
  {id:'any',     label:'Any',      icon:'🏠'},
  {id:'budget',  label:'Budget',   icon:'💰'},
  {id:'midrange',label:'Midrange', icon:'🏨'},
  {id:'luxury',  label:'Luxury',   icon:'💎'},
  {id:'boutique',label:'Boutique', icon:'🌿'},
  {id:'villa',   label:'Villa',    icon:'🏡'},
];
const QUICK_BUDGETS = [25000,50000,100000,150000,200000,300000];

// ── SearchDropdown ─────────────────────────────────────────────────────────────
// Shows selected value; tap opens inline searchable list; tap item selects it.
const SearchDropdown = ({ label, icon, value, placeholder, options, onSelect }) => {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => (o.label||o.name||'').toLowerCase().includes(q));
  }, [options, query]);

  return (
    <View style={dd.wrap}>
      <Text style={dd.lbl}>{label}</Text>
      <Pressable style={[dd.box, open && dd.boxOpen]} onPress={() => { setOpen(v=>!v); setQuery(''); }}>
        <Ionicons name={icon} size={18} color={open ? colors.primary : colors.textMuted} />
        <Text style={[dd.val, !value && dd.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </Pressable>
      {open && (
        <View style={dd.panel}>
          <View style={dd.searchRow}>
            <Ionicons name="search-outline" size={15} color={colors.textMuted} />
            <TextInput
              style={dd.searchInput}
              placeholder="Search…"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query ? <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={15} color={colors.textMuted}/></Pressable> : null}
          </View>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0
              ? <Text style={dd.empty}>No results</Text>
              : filtered.map(o => (
                  <Pressable key={keyOf(o)} style={dd.opt} onPress={() => { onSelect(o); setOpen(false); setQuery(''); }}>
                    <Text style={dd.optText} numberOfLines={1}>{o.label||o.name}</Text>
                    {o.sub ? <Text style={dd.optSub} numberOfLines={1}>{o.sub}</Text> : null}
                  </Pressable>
                ))
            }
          </ScrollView>
        </View>
      )}
    </View>
  );
};
const dd = StyleSheet.create({
  wrap:        { marginBottom: 16 },
  lbl:         { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  box:         { flexDirection:'row', alignItems:'center', gap:10, borderWidth:1, borderColor:'#DDE6E1', backgroundColor:'#F7FAF8', borderRadius:14, height:54, paddingHorizontal:14 },
  boxOpen:     { borderColor: colors.primary, backgroundColor: colors.surface },
  val:         { flex:1, fontSize:15, color: colors.textPrimary, fontWeight:'500' },
  placeholder: { color: colors.textMuted },
  panel:       { borderWidth:1, borderColor:colors.border, borderRadius:14, backgroundColor:colors.surface, overflow:'hidden', marginTop:4 },
  searchRow:   { flexDirection:'row', alignItems:'center', gap:8, borderBottomWidth:1, borderBottomColor:colors.border, paddingHorizontal:12, paddingVertical:8 },
  searchInput: { flex:1, fontSize:14, color:colors.textPrimary, height:36 },
  opt:         { paddingHorizontal:14, paddingVertical:11, borderBottomWidth:1, borderBottomColor:colors.border },
  optText:     { fontSize:14, fontWeight:'700', color:colors.textPrimary },
  optSub:      { fontSize:12, fontWeight:'600', color:colors.textMuted, marginTop:2 },
  empty:       { padding:14, textAlign:'center', color:colors.textMuted, fontSize:13 },
});

// ── SelectionTag  ──────────────────────────────────────────────────────────────
const TagRow = ({ items, onRemove, getName, getSub }) => (
  items.length === 0 ? null : (
    <View style={tg.row}>
      {items.map(item => (
        <View key={keyOf(item)} style={tg.tag}>
          <View style={{ flex:1 }}>
            <Text style={tg.name} numberOfLines={1}>{getName(item)}</Text>
            {getSub && getSub(item) ? <Text style={tg.sub} numberOfLines={1}>{getSub(item)}</Text> : null}
          </View>
          <Pressable onPress={() => onRemove(item)} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  )
);
const tg = StyleSheet.create({
  row:  { gap:6, marginBottom:10 },
  tag:  { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:colors.primary+'10', borderWidth:1, borderColor:colors.primary+'33', borderRadius:12, paddingVertical:8, paddingHorizontal:12 },
  name: { fontSize:13, fontWeight:'800', color:colors.textPrimary, flex:1 },
  sub:  { fontSize:11, fontWeight:'600', color:colors.textMuted },
});

// ── GridPicker ─────────────────────────────────────────────────────────────────
const GridPicker = ({ options, value, onSelect }) => (
  <View style={gp.grid}>
    {options.map(o => (
      <Pressable key={o.id} style={[gp.item, value===o.id && gp.sel]} onPress={() => onSelect(o.id)}>
        <Text style={gp.icon}>{o.icon}</Text>
        <Text style={[gp.lbl, value===o.id && gp.lblSel]}>{o.label.toUpperCase()}</Text>
      </Pressable>
    ))}
  </View>
);
const gp = StyleSheet.create({
  grid:   { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:4 },
  item:   { width:'30.5%', backgroundColor:colors.surface, borderWidth:1, borderColor:colors.border, borderRadius:14, padding:10, alignItems:'center', gap:6 },
  sel:    { borderColor:colors.primary, backgroundColor:'#F0F7F4' },
  icon:   { fontSize:20 },
  lbl:    { fontSize:10, fontWeight:'700', color:colors.textSecondary, textAlign:'center' },
  lblSel: { color:colors.primary, fontWeight:'800' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function AdminTripEditScreen({ navigation, route }) {
  const { trip, onSaved } = route.params;

  const initStart  = toIso(trip.startDate);
  const initEnd    = toIso(trip.endDate);
  const initNights = String(trip.nights || trip.preferences?.nights || calcNights(initStart,initEnd) || 1);

  const [form, setForm] = useState({
    title:       trip.title || '',
    notes:       trip.notes || '',
    status:      trip.status || 'planned',
    hotelType:   trip.hotelType || trip.preferences?.hotelType || 'any',
    startDate:   initStart,
    endDate:     initEnd,
    nights:      initNights,
    travelers:   String(trip.travelers || trip.preferences?.travelers || 1),
    budget:      String(trip.budget || ''),
    hotelBudget: String(trip.budgetBreakdown?.hotel || trip.hotelBudget || ''),
  });
  const set = (k, v) => { setForm(p => ({...p,[k]:v})); setError(''); };

  // district
  const [district,   setDistrict]   = useState(null);   // { _id, name, province }
  const [districts,  setDistricts]  = useState([]);

  // selections
  const [selPlaces, setSelPlaces] = useState(safeArr(trip.selectedPlaces));
  // schema stores a single hotel object — normalise to array for editing
  const initialHotels = trip.selectedHotel
    ? (Array.isArray(trip.selectedHotel) ? trip.selectedHotel : [trip.selectedHotel])
    : safeArr(trip.selectedHotels);
  const [selHotels, setSelHotels] = useState(initialHotels);

  // options for current district
  const [placeOpts, setPlaceOpts] = useState([]);
  const [hotelOpts, setHotelOpts] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Load places+hotels for a district
  const loadOpts = useCallback(async (distId) => {
    if (!distId) return;
    setLoadingOpts(true);
    try {
      const [pr, hr] = await Promise.all([
        getPlacesApi({ districtId: distId, limit: 200 }),
        getHotelsApi({ districtId: distId, limit: 200 }),
      ]);
      setPlaceOpts(safeArr(pr?.data?.places || pr?.data || []));
      setHotelOpts(safeArr(hr?.data?.hotels || hr?.data || []));
    } catch (err) {
      console.error(err);
    }
    finally { setLoadingOpts(false); }
  }, []);

  // Load districts, then match current district by ID OR by name
  useEffect(() => {
    (async () => {
      try {
        const res  = await getDistrictsApi();
        const list = safeArr(res?.data || res);
        setDistricts(list);
        const curId   = String(trip.districtId || trip.district?._id || '');
        const curName = (trip.districtName || trip.destination || '').trim().toLowerCase();
        const found = list.find(d => {
          const dId   = String(d._id || d.id || '');
          const dName = (d.name || '').trim().toLowerCase();
          return (curId && dId === curId) || (curName && dName === curName);
        });
        if (found) {
          setDistrict(found);
          loadOpts(String(found._id || found.id || ''));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [loadOpts]);

  const handleDistrictSelect = (d) => {
    setDistrict(d);
    setSelPlaces([]);
    setSelHotels([]);
    loadOpts(String(d._id||d.id||''));
  };

  // Smart date links
  const handleStartDate = v => setForm(p => ({...p, startDate:v, endDate: v ? addDays(v, p.nights) : p.endDate}));
  const handleNights    = v => { const c=v.replace(/[^0-9]/g,''); setForm(p=>({...p,nights:c,endDate:p.startDate?addDays(p.startDate,c):p.endDate})); };
  const handleEndDate   = v => setForm(p => ({...p, endDate:v, nights:String(calcNights(p.startDate,v))}));

  // Add/remove places
  const addPlace    = (p) => { if (!selPlaces.some(x=>keyOf(x)===keyOf(p))) setSelPlaces(prev=>[...prev,p]); };
  const removePlace = (p) => setSelPlaces(prev=>prev.filter(x=>keyOf(x)!==keyOf(p)));
  const addHotel    = (h) => { if (!selHotels.some(x=>keyOf(x)===keyOf(h))) setSelHotels(prev=>[...prev,{...h,nights:Number(form.nights)||1}]); };
  const removeHotel = (h) => setSelHotels(prev=>prev.filter(x=>keyOf(x)!==keyOf(h)));

  // Available (not yet selected)
  const availPlaces = useMemo(() => placeOpts.filter(p=>!selPlaces.some(s=>keyOf(s)===keyOf(p))), [placeOpts,selPlaces]);
  const availHotels = useMemo(() => hotelOpts.filter(h=>!selHotels.some(s=>keyOf(s)===keyOf(h))), [hotelOpts,selHotels]);

  // Auto hotel budget
  const autoHotelBudget = useMemo(() =>
    selHotels.reduce((sum,h) => sum + Number(h.pricePerNight||h.price_per_night||0) * Number(h.nights||form.nights||1), 0)
  , [selHotels, form.nights]);

  // Validate & save
  const validate = () => {
    if (!form.title.trim() || form.title.trim().length < 3) return 'Trip title must be at least 3 characters.';
    if (!form.startDate) return 'Start date is required.';
    if (Number(form.nights) < 1) return 'Nights must be at least 1.';
    if (Number(form.travelers) < 1) return 'Travelers must be at least 1.';
    if (Number(form.budget) <= 0)   return 'Budget must be a positive number.';
    return null;
  };

  const onSubmit = async () => {
    const ve = validate(); if (ve) { setError(ve); return; }
    try {
      setLoading(true); setError('');
      const payload = {
        title:       form.title.trim(),
        notes:       form.notes.trim(),
        status:      form.status,
        hotelType:   form.hotelType,
        budget:      Number(form.budget),
        hotelBudget: Number(form.hotelBudget)||0,
        travelers:   Number(form.travelers)||1,
        nights:      Number(form.nights)||1,
        selectedPlaces: selPlaces,
        selectedHotel:  selHotels.length > 0 ? selHotels[0] : null,
        selectedHotels: selHotels,
        ...(district && { districtId: String(district._id||district.id||'') }),
        ...(form.startDate && { startDate: `${form.startDate}T00:00:00.000Z` }),
        ...(form.endDate   && { endDate:   `${form.endDate}T00:00:00.000Z`   }),
      };
      const res = await updateTripApi(trip._id, payload);
      const updated = res?.data?.trip || { ...trip, ...payload };
      if (onSaved) onSaved(updated);
      navigation.goBack();
    } catch (e) {
      setError(getApiErrorMessage(e,'Failed to update trip'));
    } finally { setLoading(false); }
  };

  // District options formatted for dropdown
  const districtOpts = useMemo(() =>
    districts.map(d => ({ ...d, label: d.name, sub: d.province||'' }))
  , [districts]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={{flex:1}}>
            <Text style={s.headerTitle}>Edit Trip</Text>
            <Text style={s.headerSub} numberOfLines={1}>{trip.title||'Untitled Trip'}</Text>
          </View>
          <View style={{width:42}} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Title ── */}
          <Text style={s.secTitle}>Basic Information</Text>
          <AppInput label="Trip Title" leftIcon="map-outline" value={form.title} onChangeText={t=>set('title',t)} placeholder="e.g. Kandy Heritage Tour" />
          <AppInput label="Notes (optional)" leftIcon="document-text-outline" value={form.notes} onChangeText={v=>set('notes',v)} placeholder="Any special notes…" multiline style={{height:90,alignItems:'flex-start',paddingTop:14}} />

          {/* ── Status ── */}
          <Text style={s.secTitle}>Status</Text>
          <GridPicker options={STATUS_OPTS} value={form.status} onSelect={v=>set('status',v)} />

          {/* ── District ── */}
          <Text style={s.secTitle}>Destination District</Text>
          <SearchDropdown
            label="District"
            icon="location-outline"
            value={district ? `${district.name}${district.province ? ` · ${district.province}` : ''}` : ''}
            placeholder="Select district…"
            options={districtOpts}
            onSelect={handleDistrictSelect}
          />

          {/* ── Places ── */}
          <Text style={s.secTitle}>Selected Places</Text>
          <TagRow
            items={selPlaces}
            onRemove={removePlace}
            getName={p => p.name||'Unnamed'}
            getSub={p => p.type||p.category||''}
          />
          {loadingOpts
            ? <ActivityIndicator color={colors.primary} style={{marginBottom:12}} />
            : <SearchDropdown
                label="Add a place"
                icon="add-circle-outline"
                value=""
                placeholder={district ? `Search places in ${district.name}…` : 'Select a district first'}
                options={availPlaces.map(p=>({...p,label:p.name||'',sub:p.type||p.category||''}))}
                onSelect={addPlace}
              />
          }

          {/* ── Hotel Preference ── */}
          <Text style={s.secTitle}>Hotel Preference</Text>
          <GridPicker options={HOTEL_TYPE_OPTS} value={form.hotelType} onSelect={v=>set('hotelType',v)} />

          {/* ── Hotels ── */}
          <Text style={s.secTitle}>Selected Hotels</Text>
          <TagRow
            items={selHotels}
            onRemove={removeHotel}
            getName={h => h.name||'Unnamed'}
            getSub={h => {
              const ppn = Number(h.pricePerNight||h.price_per_night||0);
              return ppn>0 ? `Rs ${ppn.toLocaleString()} / night` : (h.category||'');
            }}
          />
          {loadingOpts
            ? null
            : <SearchDropdown
                label="Add a hotel"
                icon="add-circle-outline"
                value=""
                placeholder={district ? `Search hotels in ${district.name}…` : 'Select a district first'}
                options={availHotels.map(h=>({...h,label:h.name||'',sub:(()=>{const p=Number(h.pricePerNight||h.price_per_night||0);return p>0?`Rs ${p.toLocaleString()} / night`:(h.category||'');})()} ))}
                onSelect={addHotel}
              />
          }

          {/* ── Nights ── */}
          <Text style={s.secTitle}>Travel Dates</Text>
          <AppInput label="Start Date" leftIcon="calendar-outline" value={form.startDate} onChangeText={handleStartDate} placeholder="YYYY-MM-DD" helperText="Changing start date auto-updates end date." keyboardType="numeric" />
          <AppInput label="Nights" leftIcon="moon-outline" value={form.nights} onChangeText={handleNights} placeholder="e.g. 3" helperText="Changing nights auto-updates end date." keyboardType="numeric" />
          <AppInput label="End Date" leftIcon="calendar-outline" value={form.endDate} onChangeText={handleEndDate} placeholder="YYYY-MM-DD" helperText="Or set end date to recalculate nights." keyboardType="numeric" />
          <AppInput label="Travelers" leftIcon="people-outline" value={form.travelers} onChangeText={v=>set('travelers',v.replace(/[^0-9]/g,''))} placeholder="e.g. 2" keyboardType="numeric" />

          {/* ── Budget ── */}
          <Text style={s.secTitle}>Budget (LKR)</Text>
          <AppInput label="Total Budget" leftIcon="wallet-outline" value={form.budget} onChangeText={v=>set('budget',v.replace(/[^0-9]/g,''))} placeholder="e.g. 100000" keyboardType="numeric" />

          {/* Quick presets */}
          <View style={s.pillRow}>
            {QUICK_BUDGETS.map(b => {
              const sel = form.budget===String(b);
              return (
                <Pressable key={b} style={[s.pill,sel&&s.pillSel]} onPress={()=>set('budget',String(b))}>
                  <Text style={[s.pillText,sel&&s.pillTextSel]}>Rs {b.toLocaleString()}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Hotel budget + auto */}
          <View style={s.hotelBudRow}>
            <View style={{flex:1}}>
              <AppInput label="Hotel Budget" leftIcon="bed-outline" value={form.hotelBudget} onChangeText={v=>set('hotelBudget',v.replace(/[^0-9]/g,''))} placeholder="e.g. 40000" keyboardType="numeric" />
            </View>
            {autoHotelBudget>0 && (
              <Pressable style={s.autoBtn} onPress={()=>set('hotelBudget',String(Math.round(autoHotelBudget)))}>
                <Ionicons name="calculator-outline" size={15} color={colors.primary} />
                <Text style={s.autoBtnText}>Auto{'\n'}Rs {Math.round(autoHotelBudget).toLocaleString()}</Text>
              </Pressable>
            )}
          </View>

          <ErrorText message={error} />
          <View style={{marginTop:4}}>
            <AppButton title={loading?'Saving…':'Save Changes'} onPress={onSubmit} disabled={loading} loading={loading} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:colors.background },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10 },
  backBtn:     { width:42, height:42, borderRadius:21, backgroundColor:colors.surface2, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border },
  headerTitle: { fontSize:18, fontWeight:'800', color:colors.textPrimary },
  headerSub:   { fontSize:12, fontWeight:'600', color:colors.textMuted, marginTop:1 },
  content:     { paddingHorizontal:20, paddingBottom:50, paddingTop:8 },
  secTitle:    { fontSize:16, fontWeight:'800', color:colors.textPrimary, marginTop:14, marginBottom:12 },
  pillRow:     { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  pill:        { paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:colors.surface, borderWidth:1, borderColor:colors.border },
  pillSel:     { backgroundColor:colors.primary, borderColor:colors.primary },
  pillText:    { fontSize:13, fontWeight:'600', color:colors.textSecondary },
  pillTextSel: { color:colors.white, fontWeight:'700' },
  hotelBudRow: { flexDirection:'row', alignItems:'flex-start', gap:10 },
  autoBtn:     { backgroundColor:colors.primary+'12', borderWidth:1, borderColor:colors.primary+'33', borderRadius:12, paddingHorizontal:10, paddingVertical:8, alignItems:'center', marginTop:22, height:54, justifyContent:'center' },
  autoBtnText: { fontSize:10, fontWeight:'800', color:colors.primary, textAlign:'center', marginTop:2 },
});
