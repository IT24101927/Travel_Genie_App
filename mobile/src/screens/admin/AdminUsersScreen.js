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
  View
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: item.isActive ? colors.primary : colors.textMuted }]}>
        <Text style={styles.avatarText}>{(item.fullName || '?').charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
          {item.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
          {!item.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
        <Text style={styles.meta}>
          Joined {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.navigate('AdminUserForm', { user: item })}
          style={styles.editBtn}
        >
          <Ionicons name="pencil-outline" size={17} color={colors.primary} />
        </Pressable>

        <Pressable onPress={() => confirmResetPassword(item)} style={styles.resetBtn}>
          <Ionicons name="key-outline" size={17} color={colors.warning} />
        </Pressable>

        {item.role !== 'admin' && (
          <Pressable onPress={() => confirmDelete(item)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>All Users</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or phone..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={(item) => item._id}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No users yet.</Text>}
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('AdminUserForm', {})}
        style={styles.fab}
      >
        <Ionicons name="person-add-outline" size={24} color={colors.white} />
      </Pressable>

      {showToTop && (
        <Pressable
          style={styles.toTopBtn}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Ionicons name="arrow-up" size={24} color={colors.white} />
        </Pressable>
      )}

      {/* Password reset modal */}
      <Modal visible={!!resetTarget} transparent animationType="fade" onRequestClose={() => setResetTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSub}>
              New password for{' '}
              <Text style={{ fontWeight: '800' }}>{resetTarget?.fullName}</Text>
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={(t) => { setNewPassword(t); setResetError(''); }}
              autoFocus
            />
            {resetError ? <Text style={styles.modalError}>{resetError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setResetTarget(null)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submitResetPassword} style={styles.modalConfirm} disabled={resetLoading}>
                <Text style={styles.modalConfirmText}>{resetLoading ? 'Saving...' : 'Reset'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  errorText: { color: colors.danger, fontSize: 13, paddingHorizontal: 20, marginBottom: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  adminBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  adminBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  inactiveBadge: {
    backgroundColor: colors.surface3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  inactiveBadgeText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  email: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 12, paddingVertical: 8
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1, fontSize: 14, color: colors.textPrimary, height: 32
  },
  actions: { flexDirection: 'column', gap: 6, marginLeft: 6 },
  editBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#EAF4F1',
    alignItems: 'center', justifyContent: 'center'
  },
  resetBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FEF6E4',
    alignItems: 'center', justifyContent: 'center'
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FCE9E6',
    alignItems: 'center', justifyContent: 'center'
  },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 32
  },
  modalBox: {
    backgroundColor: colors.surface, borderRadius: 20,
    padding: 24, width: '100%',
    borderWidth: 1, borderColor: colors.border
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  modalInput: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.textPrimary,
    backgroundColor: colors.surface2
  },
  modalError: { color: colors.danger, fontSize: 12, marginTop: 6 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center'
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  modalConfirm: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center'
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: colors.white },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8
  },
  toTopBtn: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999
  }
});

export default AdminUsersScreen;
