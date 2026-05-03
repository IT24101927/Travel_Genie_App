import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { 
  getNotificationsApi, 
  markNotificationReadApi, 
  deleteNotificationApi 
} from '../../api/notificationApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDate } from '../../utils/dateFormat';

const NotificationListScreen = ({ navigation }) => {
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

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Alert', 'Are you sure you want to remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteNotificationApi(id);
          setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
          Alert.alert('Error', 'Failed to delete alert');
        }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          {navigation?.canGoBack() && (
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>Activity Alerts</Text>
        </View>

        <ErrorText message={error} />

        <FlatList
          data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.card, item.isRead === false && styles.cardUnread]}>
            <View style={[styles.iconBox, item.isRead === false ? styles.iconBoxUnread : styles.iconBoxRead]}>
              <Ionicons 
                name={item.type === 'BUDGET_100' ? 'alert-circle' : 'pricetag'} 
                size={20} 
                color={item.isRead === false ? colors.white : colors.textSecondary} 
              />
            </View>
            <View style={styles.content}>
               <View style={styles.row}>
                 <Text style={[styles.title, item.isRead === false && styles.titleUnread]} numberOfLines={1}>
                   {item.title}
                 </Text>
                 <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
               </View>
               <Text style={styles.message}>{item.message}</Text>
               
               <View style={styles.actions}>
                  {!item.isRead && (
                    <Pressable style={styles.actionBtn} onPress={() => handleMarkRead(item._id)}>
                      <Ionicons name="mail-open-outline" size={16} color={colors.primary} />
                      <Text style={styles.actionText}>Read</Text>
                    </Pressable>
                  )}
                  <Pressable style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
                  </Pressable>
               </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    gap: 12
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
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
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
    paddingTop: 10
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  }
});

export default NotificationListScreen;
