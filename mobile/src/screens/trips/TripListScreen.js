import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import TripCard from '../../components/trips/TripCard';
import colors from '../../constants/colors';
import { getTripsApi } from '../../api/tripApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { Pressable } from 'react-native';

const TripListScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTrips = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      const response = await getTripsApi();
      setTrips(response?.data?.trips || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load trips'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Adventure Awaits</Text>
        <Text style={styles.subtext}>Where to next?</Text>
      </View>
    
      <ErrorText message={error} />

      <FlatList
        data={trips}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => navigation.navigate('TripDetails', { trip: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={loadTrips}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={!refreshing ? <EmptyState title="No trips planned" subtitle="Tap the + button to create your first journey." icon="airplane" /> : null}
      />
      
      <Pressable style={styles.fab} onPress={() => navigation.navigate('TripForm')}>
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
    </View>
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
  greeting: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 4
  },
  listContent: {
    paddingBottom: 100
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
  }
});

export default TripListScreen;
