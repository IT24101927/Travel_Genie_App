import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { getPlacesApi } from '../../api/placeApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { Pressable } from 'react-native';

const PlaceListScreen = () => {
  const [search, setSearch] = useState('');
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPlaces = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPlacesApi(search ? { search } : {});
      setPlaces(response?.data?.places || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load places'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Discover</Text>
      
      <View style={styles.searchContainer}>
        <AppInput 
          label="" 
          value={search} 
          onChangeText={setSearch} 
          placeholder="Search places, categories..." 
          style={styles.searchInput}
        />
        <Pressable style={styles.searchBtn} onPress={loadPlaces}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Ionicons name="search" size={20} color={colors.white} />}
        </Pressable>
      </View>

      <ErrorText message={error} />

      <FlatList
        data={places}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.headerRow}>
               <Text style={styles.title}>{item.name}</Text>
               <View style={styles.catBadge}>
                 <Text style={styles.catText}>{item.category}</Text>
               </View>
            </View>
            
            <View style={styles.districtRow}>
              <Ionicons name="map" size={14} color={colors.accent} />
              <Text style={styles.district}>{item.district}</Text>
            </View>
            
            {item.description ? (
              <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
            ) : null}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState title="No places found" subtitle="Try testing a different keyword." icon="compass-outline" />}
      />
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8
  },
  searchInput: {
    flex: 1,
    marginBottom: 0
  },
  searchBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16 
  },
  listContent: {
    paddingBottom: 40
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    elevation: 3
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
    flex: 1,
    marginRight: 8
  },
  catBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary
  },
  catText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase'
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  district: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600'
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});

export default PlaceListScreen;
