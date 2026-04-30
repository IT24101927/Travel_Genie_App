import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import { adminListResourceApi } from '../../api/adminApi';
import { getApiErrorMessage } from '../../utils/apiError';

const pickTitle = (item, resource) => {
  if (resource === 'trips') return item.title || item.destination || 'Trip';
  if (resource === 'places') return item.name || item.title || 'Place';
  if (resource === 'hotels') return item.name || item.title || 'Hotel';
  if (resource === 'reviews') return item.title || `Rating: ${item.rating ?? '-'}`;
  if (resource === 'expenses') return item.title || item.category || 'Expense';
  if (resource === 'notifications') return item.title || item.type || 'Notification';
  if (resource === 'transports') return item.name || item.type || 'Transport';
  return item.name || item.title || 'Item';
};

const pickSubtitle = (item, resource) => {
  if (resource === 'trips') {
    const parts = [];
    if (item.status) parts.push(item.status);
    if (item.destination) parts.push(item.destination);
    return parts.join(' • ');
  }
  if (resource === 'expenses') {
    return `${item.currency || ''} ${item.amount ?? ''}${item.category ? ' • ' + item.category : ''}`.trim();
  }
  if (resource === 'reviews') {
    return item.comment || '';
  }
  if (resource === 'hotels' || resource === 'places') {
    return item.location || item.city || item.address || '';
  }
  if (resource === 'notifications') return item.message || '';
  if (resource === 'transports') return item.route || item.from || '';
  return '';
};

const AdminResourceListScreen = ({ route, navigation }) => {
  const { resource, label } = route.params || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await adminListResourceApi(resource);
      setItems(res?.data?.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resource]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{pickTitle(item, resource)}</Text>
        {pickSubtitle(item, resource) ? (
          <Text style={styles.meta} numberOfLines={2}>{pickSubtitle(item, resource)}</Text>
        ) : null}
        <Text style={styles.date}>
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{label || 'Records'}</Text>
        <View style={{ width: 42 }} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, idx) => (item._id || idx).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No records yet.</Text>}
        />
      )}
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
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#EAF4F1',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 }
});

export default AdminResourceListScreen;
