import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import { adminStatsApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

const STAT_CARDS = [
  { key: 'users',         label: 'Users',     icon: 'people-outline',           color: colors.primary },
  { key: 'admins',        label: 'Admins',    icon: 'shield-checkmark-outline', color: colors.accent },
  { key: 'places',        label: 'Places',    icon: 'location-outline',         color: colors.info,
    subKey: 'districts',  subLabel: 'districts' },
  { key: 'hotels',        label: 'Hotels',    icon: 'bed-outline',              color: colors.primaryDark },
  { key: 'trips',         label: 'Trips',     icon: 'map-outline',              color: colors.statusOngoing },
  { key: 'transports',    label: 'Transport', icon: 'bus-outline',              color: colors.accentDark },
  { key: 'expenses',      label: 'Expenses',  icon: 'wallet-outline',           color: colors.warning },
  { key: 'reviews',       label: 'Reviews',   icon: 'star-outline',             color: colors.success },
  { key: 'notifications', label: 'Alerts',    icon: 'notifications-outline',    color: colors.statusPlanned }
];

const QUICK_ACTIONS = [
  { label: 'Manage Users',  icon: 'people',   color: colors.primary,         screen: 'AdminUsers' },
  { label: 'Manage Places', icon: 'location', color: colors.statusOngoing,   screen: 'AdminDistricts',
    hint: 'Districts → Places' },
  { label: 'Manage Hotels', icon: 'bed',      color: colors.primaryDark,     screen: 'AdminHotels',
    hint: 'Manage accommodations' },
  { label: 'Manage Trips',  icon: 'map',      color: colors.statusOngoing,   screen: 'AdminTrips',
    hint: 'View & manage all trips' },
  { label: 'Manage Transport', icon: 'bus',   color: colors.accentDark,      screen: 'AdminTransports',
    hint: 'Manage SL Transit' }
];

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await adminStatsApi();
      setStats(res?.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load stats'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openStatCard = (key) => {
    if (key === 'users')  { navigation.navigate('AdminUsers');     return; }
    if (key === 'places') { navigation.navigate('AdminDistricts'); return; }
    if (key === 'hotels') { navigation.navigate('AdminHotels'); return; }
    if (key === 'transports') { navigation.navigate('AdminTransports'); return; }
    if (key === 'trips')  { navigation.navigate('AdminTrips'); return; }
    if (key === 'admins') { return; }
    navigation.navigate('AdminResource', {
      resource: key,
      label: STAT_CARDS.find(r => r.key === key)?.label
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.hello}>Welcome back,</Text>
          <Text style={styles.adminName}>{user?.fullName || 'Admin'}</Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutBtn} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.sectionTitle}>Overview</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.grid}>
            {STAT_CARDS.map((r) => {
              const count = stats?.[r.key] ?? 0;
              const subCount = r.subKey ? (stats?.[r.subKey] ?? 0) : null;

              return (
                <Pressable
                  key={r.key}
                  onPress={() => openStatCard(r.key)}
                  style={({ pressed }) => [styles.statCard, pressed && styles.cardPressed]}
                >
                  <View style={[styles.iconBox, { backgroundColor: `${r.color}18` }]}>
                    <Ionicons name={r.icon} size={20} color={r.color} />
                  </View>
                  <Text style={styles.count}>{count}</Text>
                  <Text style={styles.label}>{r.label}</Text>
                  {subCount !== null && (
                    <View style={styles.subRow}>
                      <Ionicons name="globe-outline" size={10} color={colors.textMuted} />
                      <Text style={styles.subText}>{subCount} districts</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.screen}
            onPress={() => navigation.navigate(action.screen)}
            style={({ pressed }) => [styles.actionRow, pressed && styles.cardPressed]}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${action.color}18` }]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>{action.label}</Text>
              {action.hint ? <Text style={styles.actionHint}>{action.hint}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16
  },
  hello: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  adminName: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 1 },
  logoutBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border
  },

  content: { paddingHorizontal: 20, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: colors.textPrimary,
    marginTop: 20, marginBottom: 12
  },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  statCard: {
    width: '30.5%',
    backgroundColor: colors.surface,
    borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2
  },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  iconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10
  },
  count: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, lineHeight: 26 },
  label: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  subRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 5, paddingTop: 5,
    borderTopWidth: 1, borderTopColor: colors.border, width: '100%'
  },
  subText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  actionHint: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '500' }
});

export default AdminDashboardScreen;
