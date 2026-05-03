import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtMoney = (lkr) => `LKR ${Number(lkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const fmtDate  = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
};
const safeArr  = (v) => (Array.isArray(v) ? v : []);

const STATUS_META = {
  planned:   { label: 'Planned',   color: colors.statusPlanned,   icon: 'calendar-outline' },
  ongoing:   { label: 'Ongoing',   color: colors.statusOngoing,   icon: 'navigate-outline' },
  completed: { label: 'Completed', color: colors.statusCompleted, icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelled', color: colors.statusCancelled, icon: 'close-circle-outline' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
  const meta = STATUS_META[status] || { label: status || 'Unknown', color: colors.textMuted, icon: 'ellipse-outline' };
  return (
    <View style={[st.statusBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
      <View style={[st.statusDot, { backgroundColor: meta.color }]} />
      <Text style={[st.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
};

const ProvinceBadge = ({ province }) => {
  if (!province) return null;
  return (
    <View style={st.provinceBadge}>
      <Text style={st.provinceBadgeText}>{province.toUpperCase()}</Text>
    </View>
  );
};

const InfoRow = ({ icon, label, value, valueColor }) => (
  <View style={st.infoRow}>
    <Ionicons name={icon} size={14} color={colors.textMuted} style={{ marginTop: 1 }} />
    <Text style={st.infoLabel}>{label}</Text>
    <Text style={[st.infoValue, valueColor && { color: valueColor }]} numberOfLines={2}>{value}</Text>
  </View>
);

const Section = ({ title, icon, children }) => (
  <View style={st.section}>
    <View style={st.sectionHeader}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={st.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────
const AdminTripDetailScreen = ({ navigation, route }) => {
  const { trip } = route.params;

  const places = safeArr(trip.selectedPlaces);
  // schema stores a single hotel object — normalise to array for display
  const hotels = trip.selectedHotel
    ? (Array.isArray(trip.selectedHotel) ? trip.selectedHotel : [trip.selectedHotel])
    : safeArr(trip.selectedHotels);
  const budget      = Number(trip.budget || 0);
  const hotelBudget = Number(trip.budgetBreakdown?.hotel || trip.hotelBudget || 0);
  const remaining   = Math.max(budget - hotelBudget, 0);
  const nights      = trip.nights || trip.preferences?.nights || 0;
  const travelers   = trip.travelers || trip.preferences?.travelers || 1;
  const tripType    = trip.tripType  || trip.preferences?.tripType  || '—';
  const hotelType   = trip.hotelType || trip.preferences?.hotelType || '—';
  const meta        = STATUS_META[trip.status] || {};

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* Top bar */}
      <View style={st.topBar}>
        <Pressable style={st.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={st.topTitle} numberOfLines={1}>Trip Details</Text>
        <Pressable style={st.editBtn} onPress={() => navigation.navigate('AdminTripEdit', { trip })}>
          <Ionicons name="create-outline" size={15} color={colors.white} />
          <Text style={st.editBtnText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero card — mirrors the list card style ── */}
        <View style={st.heroCard}>
          {/* Title row */}
          <View style={st.heroTitleRow}>
            <Text style={st.heroTitle} numberOfLines={2}>{trip.title || 'Untitled Trip'}</Text>
            <StatusDot status={trip.status} />
          </View>

          {/* District + province */}
          <View style={st.heroLocRow}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={st.heroLoc} numberOfLines={1}>
              {trip.districtName || trip.destination || '—'}
            </Text>
            <ProvinceBadge province={trip.province} />
          </View>

          {/* Pills — nights / travelers / places */}
          <View style={st.pillRow}>
            <View style={st.pill}>
              <Ionicons name="moon-outline" size={12} color={colors.textMuted} />
              <Text style={st.pillText}>{nights} night{nights !== 1 ? 's' : ''}</Text>
            </View>
            <View style={st.pill}>
              <Ionicons name="people-outline" size={12} color={colors.textMuted} />
              <Text style={st.pillText}>{travelers} traveler{travelers !== 1 ? 's' : ''}</Text>
            </View>
            <View style={st.pill}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={st.pillText}>{places.length} place{places.length !== 1 ? 's' : ''}</Text>
            </View>
            {hotels.length > 0 && (
              <View style={st.pill}>
                <Ionicons name="bed-outline" size={12} color={colors.textMuted} />
                <Text style={st.pillText}>{hotels.length} hotel{hotels.length !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>

          {/* Dates + budget — bottom row exactly like the list card */}
          <View style={st.heroBtmRow}>
            <View style={st.heroDatesWrap}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={st.heroDates}>
                {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}
              </Text>
            </View>
            <Text style={st.heroBudget}>{fmtMoney(budget)}</Text>
          </View>
        </View>

        {/* ── Trip Details ── */}
        <Section title="Trip Details" icon="information-circle-outline">
          <InfoRow icon="airplane-outline"  label="Trip Type"   value={tripType.charAt(0).toUpperCase() + tripType.slice(1)} />
          <InfoRow icon="bed-outline"       label="Hotel Pref"  value={hotelType.charAt(0).toUpperCase() + hotelType.slice(1)} />
          <InfoRow icon="moon-outline"      label="Nights"      value={String(nights)} />
          <InfoRow icon="people-outline"    label="Travelers"   value={String(travelers)} />
          {trip.notes ? (
            <InfoRow icon="document-text-outline" label="Notes" value={trip.notes} />
          ) : null}
        </Section>

        {/* ── Budget ── */}
        <Section title="Budget Breakdown" icon="wallet-outline">
          <InfoRow icon="wallet-outline"      label="Total"       value={fmtMoney(budget)}      valueColor={colors.primary} />
          <InfoRow icon="bed-outline"         label="Hotels"      value={fmtMoney(hotelBudget)} />
          <InfoRow icon="restaurant-outline"  label="Other"       value={fmtMoney(remaining)} />
          {trip.budgetBreakdown?.perDay > 0 && (
            <InfoRow icon="trending-up-outline" label="Per Day" value={fmtMoney(trip.budgetBreakdown.perDay)} />
          )}
        </Section>

        {/* ── Selected Places ── */}
        <Section title={`Selected Places (${places.length})`} icon="location-outline">
          {places.length === 0 ? (
            <Text style={st.emptyText}>No places selected.</Text>
          ) : (
            places.map((p, i) => (
              <View key={i} style={st.listRow}>
                <View style={st.listDot} />
                <View style={{ flex: 1 }}>
                  <Text style={st.listName}>{p.name || `Place ${i + 1}`}</Text>
                  {(p.type || p.category) ? (
                    <Text style={st.listMeta}>{p.type || p.category}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </Section>

        {/* ── Selected Hotels ── */}
        <Section title={`Selected Hotels (${hotels.length})`} icon="bed-outline">
          {hotels.length === 0 ? (
            <Text style={st.emptyText}>No hotels selected.</Text>
          ) : (
            hotels.map((h, i) => {
              const ppn = Number(h.pricePerNight || h.price_per_night || 0);
              return (
                <View key={i} style={st.listRow}>
                  <View style={[st.listDot, { backgroundColor: colors.primaryDark }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.listName}>{h.name || `Hotel ${i + 1}`}</Text>
                    {ppn > 0 ? (
                      <Text style={st.listMeta}>Rs {ppn.toLocaleString()} / night</Text>
                    ) : null}
                    {h.checkIn ? (
                      <Text style={st.listMeta}>{fmtDate(h.checkIn)} → {fmtDate(h.checkOut)}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </Section>

        {/* Timestamp */}
        <View style={st.timestampRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={st.timestampText}>
            Created {fmtDate(trip.createdAt)}
            {trip.updatedAt && trip.updatedAt !== trip.createdAt
              ? `  ·  Updated ${fmtDate(trip.updatedAt)}`
              : ''}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  // Top bar
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  topTitle:    { flex: 1, fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  editBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  editBtnText: { fontSize: 13, fontWeight: '900', color: colors.white },

  // Hero card — mirrors the list TripCard exactly
  heroCard:       { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 },
  heroTitleRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  heroTitle:      { flex: 1, fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  heroLocRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroLoc:        { fontSize: 13, fontWeight: '700', color: colors.textSecondary, flex: 1 },
  heroBtmRow:     { flexDirection: 'row', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  heroDatesWrap:  { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  heroDates:      { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  heroBudget:     { fontSize: 14, fontWeight: '900', color: colors.primary },

  // Status badge (dot style)
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusDot:       { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },

  // Province badge — green pill matching the card
  provinceBadge:     { backgroundColor: colors.primary + 'CC', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  provinceBadgeText: { fontSize: 10, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },

  // Pills
  pillRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },

  // Section cards
  section:       { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 },
  sectionTitle:  { fontSize: 12, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 3 },
  infoLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, width: 90, paddingTop: 1 },
  infoValue: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.textPrimary, textAlign: 'right' },

  listRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.border },
  listDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
  listName: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  listMeta: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 2 },

  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: '600', fontStyle: 'italic', paddingVertical: 4 },

  timestampRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 4 },
  timestampText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
});

export default AdminTripDetailScreen;
