import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getPlacesApi } from '../../api/placeApi';
import { getHotelsApi } from '../../api/hotelApi';
import { getApiErrorMessage } from '../../utils/apiError';

const FEATURES = [
  { icon: 'map-outline',       label: 'Plan Trips' },
  { icon: 'bed-outline',       label: 'Find Hotels' },
  { icon: 'wallet-outline',    label: 'Track Expenses' },
  { icon: 'bus-outline',       label: 'Book Transport' },
  { icon: 'star-outline',      label: 'Write Reviews' },
  { icon: 'notifications-outline', label: 'Get Alerts' }
];

const PlaceCard = ({ item, onPress }) => (
  <Pressable style={styles.hCard} onPress={onPress}>
    {item.image ? (
      <Image source={{ uri: item.image }} style={styles.hCardImage} />
    ) : (
      <View style={[styles.hCardImage, styles.hCardImagePlaceholder]}>
        <Ionicons name="image-outline" size={28} color={colors.textMuted} />
      </View>
    )}
    <View style={styles.hCardBody}>
      <Text style={styles.hCardTitle} numberOfLines={1}>{item.name || 'Place'}</Text>
      {item.location || item.city ? (
        <View style={styles.hCardRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.hCardSub} numberOfLines={1}>{item.location || item.city}</Text>
        </View>
      ) : null}
    </View>
  </Pressable>
);

const HotelCard = ({ item, onPress }) => (
  <Pressable style={styles.hCard} onPress={onPress}>
    {item.image ? (
      <Image source={{ uri: item.image }} style={styles.hCardImage} />
    ) : (
      <View style={[styles.hCardImage, styles.hCardImagePlaceholder]}>
        <Ionicons name="bed-outline" size={28} color={colors.textMuted} />
      </View>
    )}
    <View style={styles.hCardBody}>
      <Text style={styles.hCardTitle} numberOfLines={1}>{item.name || 'Hotel'}</Text>
      {item.location || item.city ? (
        <View style={styles.hCardRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.hCardSub} numberOfLines={1}>{item.location || item.city}</Text>
        </View>
      ) : null}
      {item.pricePerNight ? (
        <Text style={styles.hCardPrice}>LKR {item.pricePerNight?.toLocaleString()}/night</Text>
      ) : null}
    </View>
  </Pressable>
);

const GuestScreen = ({ navigation }) => {
  const { exitGuest } = useAuth();
  const [places, setPlaces] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [pRes, hRes] = await Promise.allSettled([
        getPlacesApi({}),
        getHotelsApi({})
      ]);
      if (pRes.status === 'fulfilled') setPlaces(pRes.value?.data?.places || []);
      if (hRes.status === 'fulfilled') setHotels(hRes.value?.data?.hotels || []);
    } finally {
      setLoadingPlaces(false);
      setLoadingHotels(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const onLoginPress = () => {
    exitGuest();
  };

  const promptLogin = () => {
    navigation.navigate('GuestSignInPrompt');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="airplane" size={22} color={colors.primary} />
          <Text style={styles.headerTitle}>TravelGenie</Text>
        </View>
        <Pressable onPress={onLoginPress} style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Log In</Text>
          <Ionicons name="log-in-outline" size={16} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Explore Sri Lanka</Text>
          <Text style={styles.heroSub}>Discover amazing places, find the best stays</Text>
          <Pressable onPress={onLoginPress} style={styles.heroBtn}>
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={styles.heroBtnText}>Sign up — it's free</Text>
          </Pressable>
        </View>

        {/* Places section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Places</Text>
            <Ionicons name="map-outline" size={18} color={colors.primary} />
          </View>
          {loadingPlaces ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : places.length === 0 ? (
            <Text style={styles.emptyText}>No places yet.</Text>
          ) : (
            <FlatList
              data={places}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <PlaceCard item={item} onPress={promptLogin} />}
              contentContainerStyle={styles.hList}
            />
          )}
        </View>

        {/* Hotels section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Hotels</Text>
            <Ionicons name="bed-outline" size={18} color={colors.primary} />
          </View>
          {loadingHotels ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : hotels.length === 0 ? (
            <Text style={styles.emptyText}>No hotels yet.</Text>
          ) : (
            <FlatList
              data={hotels}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <HotelCard item={item} onPress={promptLogin} />}
              contentContainerStyle={styles.hList}
            />
          )}
        </View>

        {/* What you unlock */}
        <View style={styles.unlockCard}>
          <Text style={styles.unlockTitle}>Unlock full access</Text>
          <Text style={styles.unlockSub}>Create a free account to access all features</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
            onPress={onLoginPress}
          >
            <Text style={styles.ctaBtnText}>Sign In</Text>
          </Pressable>
          <Pressable style={styles.ctaSecondary} onPress={onLoginPress}>
            <Text style={styles.ctaSecondaryText}>New here? <Text style={styles.ctaSecondaryLink}>Create an account</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, letterSpacing: 0.5 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10
  },
  loginBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  scroll: { paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 8
  },
  heroTitle: { fontSize: 28, fontWeight: '900', color: colors.white, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: '#A8E6D0', lineHeight: 22 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, marginTop: 10
  },
  heroBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  // Sections
  section: { paddingTop: 24, paddingBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 14
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  emptyText: { color: colors.textMuted, paddingHorizontal: 20, fontSize: 14 },
  hList: { paddingHorizontal: 20, gap: 12 },

  // Horizontal cards
  hCard: {
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  hCardImage: { width: '100%', height: 110 },
  hCardImagePlaceholder: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hCardBody: { padding: 10 },
  hCardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  hCardRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hCardSub: { fontSize: 12, color: colors.textMuted, flex: 1 },
  hCardPrice: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 4 },

  // Unlock card
  unlockCard: {
    margin: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border
  },
  unlockTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary, marginBottom: 4 },
  unlockSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  },
  featureItem: { width: '30%', alignItems: 'center', gap: 6 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EAF4F1',
    alignItems: 'center', justifyContent: 'center'
  },
  featureLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  ctaBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  ctaBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  ctaSecondary: { alignItems: 'center' },
  ctaSecondaryText: { color: colors.textSecondary, fontSize: 14 },
  ctaSecondaryLink: { color: colors.primary, fontWeight: '700' }
});

export default GuestScreen;
