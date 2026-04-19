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

const RESOURCES = [
  { key: 'users', label: 'Users', icon: 'people-outline', color: colors.primary },
  { key: 'admins', label: 'Admins', icon: 'shield-checkmark-outline', color: colors.accent, readOnly: true },
  { key: 'trips', label: 'Trips', icon: 'map-outline', color: colors.statusOngoing },
  { key: 'places', label: 'Places', icon: 'location-outline', color: colors.info },
  { key: 'hotels', label: 'Hotels', icon: 'bed-outline', color: colors.primaryDark },
  { key: 'expenses', label: 'Expenses', icon: 'wallet-outline', color: colors.warning },
  { key: 'reviews', label: 'Reviews', icon: 'star-outline', color: colors.success },
  { key: 'notifications', label: 'Alerts', icon: 'notifications-outline', color: colors.statusPlanned },
  { key: 'transports', label: 'Transport', icon: 'bus-outline', color: colors.accentDark }
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openResource = (resource) => {
    if (resource.key === 'users') {
      navigation.navigate('AdminUsers');
      return;
    }
    if (resource.readOnly) return;
    navigation.navigate('AdminResource', { resource: resource.key, label: resource.label });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.hello}>Welcome back,</Text>
          <Text style={styles.adminName}>{user?.fullName || 'Admin'}</Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.sectionTitle}>Overview</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.grid}>
            {RESOURCES.map((r) => (
              <Pressable key={r.key} onPress={() => openResource(r)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={[styles.cardIcon, { backgroundColor: `${r.color}22` }]}>
                  <Ionicons name={r.icon} size={22} color={r.color} />
                </View>
                <Text style={styles.cardCount}>{stats?.[r.key] ?? 0}</Text>
                <Text style={styles.cardLabel}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Pressable onPress={() => navigation.navigate('AdminUsers')} style={styles.actionRow}>
          <Ionicons name="people" size={22} color={colors.primary} />
          <Text style={styles.actionText}>Manage Users</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14
  },
  hello: { color: colors.textMuted, fontSize: 13 },
  adminName: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  logoutBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border
  },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: colors.textPrimary,
    marginTop: 16, marginBottom: 12
  },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start'
  },
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  cardIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10
  },
  cardCount: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  cardLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10
  },
  actionText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: colors.textPrimary }
});

export default AdminDashboardScreen;
