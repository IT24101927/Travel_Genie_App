import React, { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { getTransportsApi } from '../../api/transportApi';
import { getApiErrorMessage } from '../../utils/apiError';

const TYPE_ICONS = {
  flight: 'airplane',
  bus: 'bus',
  train: 'train',
  car: 'car',
  ferry: 'boat',
  other: 'navigate'
};

const STATUS_COLORS = {
  upcoming: colors.info,
  completed: colors.success,
  cancelled: colors.danger
};

const TransportCard = ({ item, onPress }) => {
  const icon = TYPE_ICONS[item.type] || 'navigate';
  const statusColor = STATUS_COLORS[item.status] || colors.textMuted;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.cardMain}>
          <View style={styles.routeRow}>
            <Text style={styles.location} numberOfLines={1}>{item.fromLocation}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textMuted} style={styles.arrow} />
            <Text style={styles.location} numberOfLines={1}>{item.toLocation}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.departureDate)}</Text>
          {item.provider ? <Text style={styles.provider}>{item.provider}</Text> : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
        </View>
        {item.cost > 0 && (
          <Text style={styles.cost}>${item.cost.toFixed(2)}</Text>
        )}
        {item.bookingRef ? (
          <Text style={styles.bookingRef}>Ref: {item.bookingRef}</Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const TransportListScreen = ({ navigation }) => {
  const [transports, setTransports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTransports = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      const response = await getTransportsApi();
      setTransports(response?.data?.transports || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load transport records'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransports();
    }, [loadTransports])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Transport</Text>
          <Text style={styles.subtitle}>All your journeys</Text>
        </View>

      <ErrorText message={error} />

      <FlatList
        data={transports}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TransportCard
            item={item}
            onPress={() => navigation.navigate('EditTransport', { transport: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTransports}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState
              title="No transport added"
              subtitle="Tap + to log a flight, bus, train or car journey."
              icon="bus-outline"
            />
          ) : null
        }
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddTransport')}>
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16
  },
  header: {
    marginTop: 16,
    marginBottom: 20
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 4
  },
  listContent: {
    paddingBottom: 100
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cardMain: {
    flex: 1
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4
  },
  location: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
    maxWidth: 100
  },
  arrow: {
    marginHorizontal: 6
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 2
  },
  provider: {
    color: colors.textMuted,
    fontSize: 12
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700'
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  typeBadge: {
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  typeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800'
  },
  cost: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14
  },
  bookingRef: {
    color: colors.textMuted,
    fontSize: 12
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  }
});

export default TransportListScreen;
