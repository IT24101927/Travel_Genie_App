import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '../../components/common/EmptyState';
import ErrorText from '../../components/common/ErrorText';
import colors from '../../constants/colors';
import { getHotelsApi } from '../../api/hotelApi';
import { getApiErrorMessage } from '../../utils/apiError';

const HotelListScreen = ({ navigation }) => {
  const [location, setLocation] = useState('');
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const locationRef = useRef('');

  const fetchHotels = useCallback(async (locationFilter = '') => {
    try {
      setLoading(true);
      setError('');
      const cleanLocation = String(locationFilter).trim();
      const response = await getHotelsApi(cleanLocation ? { location: cleanLocation } : {});
      setHotels(response?.data?.hotels || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load hotels'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHotels(locationRef.current);
    }, [fetchHotels])
  );

  const handleLocationChange = useCallback((text) => {
    locationRef.current = text;
    setLocation(text);
  }, []);

  const handleSearch = useCallback(() => {
    fetchHotels(location);
  }, [fetchHotels, location]);

  const handleClearSearch = useCallback(() => {
    locationRef.current = '';
    setLocation('');
    fetchHotels('');
  }, [fetchHotels]);

  const renderStars = (rating) => {
    const num = Number(rating) || 0;
    return (
      <View style={styles.starsRow}>
         {[1, 2, 3, 4, 5].map((i) => (
           <Ionicons 
             key={i} 
             name={i <= num ? "star" : "star-outline"} 
             size={14} 
             color={colors.warning} 
           />
         ))}
         <Text style={styles.ratingText}>{num > 0 ? num.toFixed(1) : 'New'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Find Stays</Text>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputShell}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={location}
              onChangeText={handleLocationChange}
              placeholder="Search by city"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
              onSubmitEditing={handleSearch}
              style={styles.searchInput}
            />
            {location ? (
              <Pressable
                hitSlop={10}
                onPress={handleClearSearch}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.searchBtn} onPress={handleSearch}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Ionicons name="arrow-forward" size={22} color={colors.white} />
            )}
          </Pressable>
        </View>

        <ErrorText message={error} />

        <FlatList
          data={hotels}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('HotelDetails', { hotel: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                <View style={styles.priceChip}>
                   <Text style={styles.priceText}>{item.priceRange ? `$${item.priceRange}` : 'Contact'}</Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.accent} />
                <Text style={styles.location}>{item.location}</Text>
              </View>

              {renderStars(item.rating)}

              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>Tap to view details & reviews</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="No hotels found" subtitle="Try another location for stays." icon="bed-outline" />}
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
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  searchInputShell: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE6E1',
    backgroundColor: '#F7FAF8',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 10,
    minWidth: 0
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listContent: {
    paddingBottom: 120
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
    flex: 1,
    marginRight: 10
  },
  priceChip: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  priceText: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 12
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8
  },
  location: {
    color: colors.textSecondary,
    fontSize: 14
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  ratingText: {
    marginLeft: 6,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 2
  },
  tapHintText: {
    color: colors.textMuted,
    fontSize: 11
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  }
});

export default HotelListScreen;
