import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { getNotificationsApi } from '../../api/notificationApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDate } from '../../utils/dateFormat';

const NotificationListScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      setError('');
      const response = await getNotificationsApi();
      setNotifications(response?.data?.notifications || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load notifications'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Activity Alerts</Text>

        <ErrorText message={error} />

        <FlatList
          data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.card, item.read === false && styles.cardUnread]}>
            <View style={[styles.iconBox, item.read === false ? styles.iconBoxUnread : styles.iconBoxRead]}>
              <Ionicons 
                name="pricetag" 
                size={20} 
                color={item.read === false ? colors.white : colors.textSecondary} 
              />
            </View>
            <View style={styles.content}>
               <View style={styles.row}>
                 <Text style={[styles.title, item.read === false && styles.titleUnread]} numberOfLines={1}>
                   {item.title}
                 </Text>
                 <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
               </View>
               <Text style={styles.message}>{item.message}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState title="No alerts" subtitle="You are all caught up with your journey." icon="notifications-off-outline" />}
      />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 16,
    marginBottom: 20
  },
  listContent: {
    paddingBottom: 120
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent'
  },
  cardUnread: {
    backgroundColor: colors.surface2,
    borderLeftColor: colors.primary
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  iconBoxRead: {
    backgroundColor: colors.surface2
  },
  iconBoxUnread: {
    backgroundColor: colors.primary
  },
  content: {
    flex: 1
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8
  },
  titleUnread: {
    fontWeight: '900'
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  }
});

export default NotificationListScreen;
