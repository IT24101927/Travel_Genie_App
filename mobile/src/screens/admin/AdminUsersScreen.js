import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import { adminListUsersApi, adminDeleteUserApi, adminResetUserPasswordApi } from '../../api/adminApi';
import { getApiErrorMessage } from '../../utils/apiError';

const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [showToTop, setShowToTop] = useState(false);

  const listRef = useRef(null);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      inactive: users.filter(u => !u.isActive).length
    };
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
    );
  }, [users, search]);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await adminListUsersApi();
      setUsers(res?.data?.users || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load users'));
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

  const handleListScroll = useCallback((e) => {
    const next = e.nativeEvent.contentOffset.y > 400;
    setShowToTop((prev) => (prev === next ? prev : next));
  }, []);

  const confirmResetPassword = (user) => {
    setResetTarget(user);
    setNewPassword('');
    setResetError('');
  };

  const submitResetPassword = async () => {
    const missing = [];
    if (newPassword.length < 8) missing.push('8+ characters');
    if (!/[A-Z]/.test(newPassword)) missing.push('uppercase letter');
    if (!/[a-z]/.test(newPassword)) missing.push('lowercase letter');
    if (!/\d/.test(newPassword)) missing.push('number');
    if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(newPassword)) missing.push('special character');
    if (missing.length > 0) {
      setResetError(`Password needs: ${missing.join(', ')}.`);
      return;
    }
    try {
      setResetLoading(true);
      setResetError('');
      await adminResetUserPasswordApi(resetTarget._id, { newPassword });
      setResetTarget(null);
      Alert.alert('Done', `Password for ${resetTarget.fullName} has been reset.`);
    } catch (err) {
      setResetError(getApiErrorMessage(err, 'Failed to reset password'));
    } finally {
      setResetLoading(false);
    }
  };

  const confirmDelete = (user) => {
    Alert.alert(
      'Delete User',
      `Remove "${user.fullName}" (${user.email})? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteUserApi(user._id);
              setUsers((prev) => prev.filter((u) => u._id !== user._id));
            } catch (err) {
              Alert.alert('Error', getApiErrorMessage(err, 'Failed to delete user'));
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: `${colors.accent}12` }]}>
          <Text style={[styles.statValue, { color: colors.accent }]}>{stats.admins}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        {stats.inactive > 0 && (
          <View style={[styles.statPill, { backgroundColor: `${colors.danger}12` }]}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        )}
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.cardMain}>
        <View style={[styles.avatar, { backgroundColor: item.isActive ? `${colors.primary}15` : `${colors.textMuted}15` }]}>
          <Text style={[styles.avatarText, { color: item.isActive ? colors.primary : colors.textMuted }]}>
            {(item.fullName || '?').charAt(0).toUpperCase()}
          </Text>
          {!item.isActive && <View style={styles.inactiveDot} />}
        </View>

        <View style={styles.userDetails}>
          <View style={styles.nameHeader}>
            <Text style={styles.userName} numberOfLines={1}>{item.fullName}</Text>
            {item.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={10} color={colors.white} />
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={12} color={colors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
          </View>
          
          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={12} color={colors.textMuted} />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.dateText}>
              Joined {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </Text>
            {!item.isActive && <Text style={styles.inactiveLabel}>Account Disabled</Text>}
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable 
          style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
          onPress={() => navigation.navigate('AdminUserForm', { user: item })}
        >
          <Ionicons name="pencil-sharp" size={18} color={colors.primary} />
        </Pressable>

        <Pressable 
          style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
          onPress={() => confirmResetPassword(item)}
        >
          <Ionicons name="key-sharp" size={18} color={colors.warning} />
        </Pressable>

        {item.role !== 'admin' && (
          <Pressable 
            style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
            onPress={() => confirmDelete(item)}
          >
            <Ionicons name="trash-sharp" size={18} color={colors.danger} />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>Manage and monitor all users</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching users...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={(item) => item._id}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or add a new user</Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('AdminUserForm', {})}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="person-add" size={26} color={colors.white} />
      </Pressable>

      {showToTop && (
        <Pressable
          style={styles.toTopBtn}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Ionicons name="chevron-up" size={24} color={colors.white} />
        </Pressable>
      )}

      {/* Password reset modal */}
      <Modal visible={!!resetTarget} transparent animationType="fade" onRequestClose={() => setResetTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Ionicons name="key" size={24} color={colors.warning} />
              </View>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSub}>
                Update password for <Text style={styles.boldText}>{resetTarget?.fullName}</Text>
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Minimum 8 characters..."
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); setResetError(''); }}
                autoFocus
              />
              {resetError ? <Text style={styles.modalError}>{resetError}</Text> : null}
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setResetTarget(null)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submitResetPassword} style={styles.modalConfirm} disabled={resetLoading}>
                {resetLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 }
    })
  },
  titleContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 1 },

  listContent: { paddingBottom: 100 },
  listHeader: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 },
  
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statPill: {
    flex: 1,
    backgroundColor: `${colors.primary}10`,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center'
  },
  statValue: { fontSize: 18, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 }
    })
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },

  userCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 }
    })
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative'
  },
  avatarText: { fontSize: 22, fontWeight: '900' },
  inactiveDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface
  },
  userDetails: { flex: 1 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  userName: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  adminBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  adminBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  infoText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  dateText: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  inactiveLabel: { fontSize: 10, color: colors.danger, fontWeight: '700', textTransform: 'uppercase' },

  cardActions: { 
    marginLeft: 12, 
    paddingLeft: 12, 
    borderLeftWidth: 1, 
    borderLeftColor: colors.border,
    gap: 8
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPressed: { opacity: 0.7, transform: [{ scale: 0.9 }] },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 8 }
    })
  },
  fabPressed: { transform: [{ scale: 0.92 }] },

  toTopBtn: {
    position: 'absolute',
    right: 24,
    bottom: 106,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9
  },

  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  errorContainer: { paddingHorizontal: 20, marginBottom: 12 },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600' },

  emptyState: { paddingVertical: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(26, 43, 35, 0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24
  },
  modalBox: {
    backgroundColor: colors.surface, borderRadius: 28,
    padding: 24, width: '100%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 }
    })
  },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalIconBox: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: `${colors.warning}15`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  modalSub: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  boldText: { fontWeight: '800', color: colors.textPrimary },
  
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, marginLeft: 4 },
  modalInput: {
    backgroundColor: colors.surface2,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border
  },
  modalError: { color: colors.danger, fontSize: 12, marginTop: 6, fontWeight: '600', marginLeft: 4 },
  
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, paddingVertical: 15, borderRadius: 16,
    backgroundColor: colors.surface2, alignItems: 'center'
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  modalConfirm: {
    flex: 2, paddingVertical: 15, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 4 }
    })
  },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: colors.white }
});

export default AdminUsersScreen;

