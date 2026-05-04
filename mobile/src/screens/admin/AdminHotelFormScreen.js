import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import FallbackImage from '../../components/common/FallbackImage';
import AppSelect from '../../components/common/AppSelect';
import colors from '../../constants/colors';
import { createHotelApi, getHotelApi, updateHotelApi, uploadHotelImageApi } from '../../api/hotelApi';
import { getDistrictsApi } from '../../api/districtApi';
import { getPlacesApi } from '../../api/placeApi';
import { getApiErrorMessage } from '../../utils/apiError';

const HOTEL_TYPES = [
  { id: 'hotel', emoji: '🏨', color: '#3498DB' },
  { id: 'resort', emoji: '🌴', color: '#4CAF50' },
  { id: 'guesthouse', emoji: '🏡', color: '#FF9800' },
  { id: 'hostel', emoji: '🛏️', color: '#9C27B0' },
  { id: 'villa', emoji: '🏘️', color: '#E91E63' },
  { id: 'boutique', emoji: '✨', color: '#F57C00' },
  { id: 'apartment', emoji: '🏢', color: '#607D8B' },
  { id: 'lodge', emoji: '🛖', color: '#795548' },
  { id: 'camp', emoji: '⛺', color: '#8BC34A' }
];

const AMENITIES_LIST = [
  { id: 'WiFi', emoji: '📶' },
  { id: 'Pool', emoji: '🏊' },
  { id: 'Spa', emoji: '💆' },
  { id: 'Restaurant', emoji: '🍽️' },
  { id: 'Gym', emoji: '🏋️' },
  { id: 'Parking', emoji: '🅿️' },
  { id: 'Beach Access', emoji: '🏖️' },
  { id: 'Bar', emoji: '🍸' },
  { id: 'Kitchen', emoji: '🍳' },
  { id: 'Garden', emoji: '🌿' },
  { id: 'Airport Shuttle', emoji: '🚐' },
  { id: 'Airport Transfer', emoji: '✈️' },
  { id: 'Laundry', emoji: '👕' },
  { id: 'Room Service', emoji: '🛎️' },
  { id: 'Pet Friendly', emoji: '🐾' },
  { id: 'Breakfast', emoji: '🥐' },
  { id: 'Rooftop', emoji: '🌇' },
  { id: 'Fireplace', emoji: '🔥' },
  { id: 'Butler', emoji: '🤵' },
  { id: 'Bicycle Rental', emoji: '🚲' },
  { id: 'Cycling', emoji: '🚴' },
  { id: 'Hiking', emoji: '🥾' },
  { id: 'Water Sports', emoji: '🏄' },
  { id: 'Surfing', emoji: '🌊' },
  { id: 'Snorkelling', emoji: '🤿' },
  { id: 'Safari', emoji: '🚙' },
  { id: 'Bird Watching', emoji: '🦜' },
  { id: 'Tea Tours', emoji: '☕' },
  { id: 'Cooking Class', emoji: '👨‍🍳' },
  { id: 'Kids Club', emoji: '🧸' },
  { id: 'Business Center', emoji: '💼' },
  { id: 'Lake View', emoji: '🏞️' },
  { id: 'River View', emoji: '🌊' },
  { id: 'Air Conditioning', emoji: '❄️' },
  { id: 'Boat Tours', emoji: '⛵' },
  { id: 'Concierge', emoji: '🛎️' },
  { id: 'Guided Walks', emoji: '🚶' },
  { id: 'Kayaking', emoji: '🛶' },
  { id: 'View Terrace', emoji: '🌄' },
  { id: 'Library', emoji: '📚' },
  { id: 'Bowling', emoji: '🎳' },
  { id: 'Rafting', emoji: '🚣' },
];

const toAmenityKey = (amenity) => String(amenity || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const AMENITY_LABEL_BY_KEY = new Map(AMENITIES_LIST.map((a) => [toAmenityKey(a.id), a.id]));

const normalizeAmenities = (value) => {
  const clean = (a) => {
    const v = String(a || '').trim();
    if (!v) return '';
    return AMENITY_LABEL_BY_KEY.get(toAmenityKey(v)) || v;
  };
  if (Array.isArray(value)) {
    return value
      .map((a) => typeof a === 'string' ? a : a?.id || a?.name || a?.label)
      .map(clean).filter(Boolean);
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return [];
    try { return normalizeAmenities(JSON.parse(t)); } catch { return t.split(',').map(clean).filter(Boolean); }
  }
  return [];
};

const isAmenitySelected = (selected = [], id) =>
  selected.some((a) => toAmenityKey(a) === toAmenityKey(id));

const getContactValue = (hotel, key) =>
  hotel?.contact?.[key] || hotel?.[`contact_${key}`] || hotel?.[key] || '';

const getHotelCoordinate = (hotel, key) => {
  const direct = hotel?.[key];
  if (direct !== undefined && direct !== null && direct !== '') return direct;
  const alt = key === 'lat' ? 'latitude' : 'longitude';
  const alternate = hotel?.[alt];
  if (alternate !== undefined && alternate !== null && alternate !== '') return alternate;
  const obj = hotel?.coordinates || hotel?.geo || hotel?.geoLocation || hotel?.mapLocation;
  if (obj?.[key] !== undefined) return obj[key];
  if (obj?.[alt] !== undefined) return obj[alt];
  const arr = obj?.coordinates || hotel?.location?.coordinates;
  if (Array.isArray(arr) && arr.length >= 2) return key === 'lat' ? arr[1] : arr[0];
  return '';
};

// ─── Section header component ────────────────────────────────────────────────

const SectionHeader = ({ icon, title, subtitle, color = colors.primary }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionHeaderIcon, { backgroundColor: color + '16' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={styles.sectionHeaderText}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const AdminHotelFormScreen = ({ route, navigation }) => {
  const existing = route.params?.hotel || null;
  const district = route.params?.district || null;
  const isEdit = !!existing;

  const prefilledDistrictId = existing?.district_id?.toString()
    || district?.district_id?.toString()
    || '';
  const existingAmenities = normalizeAmenities(existing?.amenities);
  const existingPhone = getContactValue(existing, 'phone');
  const existingEmail = getContactValue(existing, 'email');
  const existingWebsite = getContactValue(existing, 'website');
  const existingLat = getHotelCoordinate(existing, 'lat');
  const existingLng = getHotelCoordinate(existing, 'lng');

  const [form, setForm] = useState({
    hotel_id: existing?.hotel_id?.toString() || '',
    place_id: existing?.place_id?.toString() || '',
    nearby_place_id: existing?.nearby_place_id?.toString() || '',
    district_id: prefilledDistrictId,
    name: existing?.name || '',
    description: existing?.description || '',
    address_text: existing?.address_text || '',
    location: typeof existing?.location === 'string' ? existing.location : '',
    hotel_type: existing?.hotel_type || 'hotel',
    price_per_night: existing?.price_per_night?.toString() || '',
    star_class: existing?.star_class?.toString() || '',
    lat: existingLat?.toString() || '',
    lng: existingLng?.toString() || '',
    contact_phone: existingPhone,
    contact_email: existingEmail,
    contact_website: existingWebsite,
    noContact: existing ? (!existingPhone && !existingEmail && !existingWebsite) : false,
    amenities: existingAmenities,
    image_url: existing?.image_url || '',
    isActive: existing?.isActive !== false
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const deltaRef = useRef({ latitudeDelta: 0.08, longitudeDelta: 0.08 });

  const SRI_LANKA = { latitude: 7.8731, longitude: 80.7718, latitudeDelta: 5.5, longitudeDelta: 3.5 };

  const markerCoord = useMemo(() => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
    return null;
  }, [form.lat, form.lng]);

  const [districts, setDistricts] = useState([]);
  const [districtPlaces, setDistrictPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const applyHotelToForm = useCallback((hotel) => {
    if (!hotel) return;
    const phone = getContactValue(hotel, 'phone');
    const email = getContactValue(hotel, 'email');
    const website = getContactValue(hotel, 'website');
    const lat = getHotelCoordinate(hotel, 'lat');
    const lng = getHotelCoordinate(hotel, 'lng');
    setForm((prev) => ({
      ...prev,
      hotel_id: hotel.hotel_id?.toString() || '',
      place_id: hotel.place_id?.toString() || '',
      nearby_place_id: hotel.nearby_place_id?.toString() || '',
      district_id: hotel.district_id?.toString() || prev.district_id,
      name: hotel.name || '',
      description: hotel.description || '',
      address_text: hotel.address_text || '',
      location: typeof hotel.location === 'string' ? hotel.location : '',
      hotel_type: hotel.hotel_type || 'hotel',
      price_per_night: hotel.price_per_night?.toString() || '',
      star_class: hotel.star_class?.toString() || '',
      lat: lat?.toString() || '',
      lng: lng?.toString() || '',
      contact_phone: phone,
      contact_email: email,
      contact_website: website,
      noContact: !phone && !email && !website,
      amenities: normalizeAmenities(hotel.amenities),
      image_url: hotel.image_url || '',
      isActive: hotel.isActive !== false,
    }));
  }, []);

  const loadDistricts = useCallback(async () => {
    try {
      const res = await getDistrictsApi();
      setDistricts(res?.data || []);
    } catch (err) {
      console.log('Failed to load districts', err);
    }
  }, []);

  const loadDistrictPlaces = useCallback(async (districtId) => {
    if (!districtId) { setDistrictPlaces([]); return; }
    setLoadingPlaces(true);
    try {
      const res = await getPlacesApi({ districtId });
      const arr = res?.data?.places || (Array.isArray(res?.data) ? res.data : []);
      setDistrictPlaces(arr.sort((a, b) =>
        (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' })
      ));
    } catch (err) {
      console.log('Failed to load places', err);
      setDistrictPlaces([]);
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  useEffect(() => { loadDistricts(); }, [loadDistricts]);

  useEffect(() => {
    if (!isEdit || !existing?._id) return;
    let mounted = true;
    getHotelApi(existing._id)
      .then((res) => {
        if (!mounted) return;
        applyHotelToForm(res?.data?.hotel || res?.hotel || res?.data || null);
      })
      .catch((err) => console.log('Failed to load full hotel details', err));
    return () => { mounted = false; };
  }, [applyHotelToForm, existing?._id, isEdit]);

  useEffect(() => {
    if (form.district_id) loadDistrictPlaces(form.district_id);
    else setDistrictPlaces([]);
  }, [form.district_id, loadDistrictPlaces]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setApiError('');
  };

  const handleDistrictChange = (districtId) => {
    set('district_id', districtId);
    set('nearby_place_id', '');
    set('lat', '');
    set('lng', '');
  };

  const handleNearbyPlaceChange = (placeId) => {
    set('nearby_place_id', placeId);
    const place = districtPlaces.find((p) => String(p.place_id) === String(placeId));
    if (place) {
      if (place.lat) set('lat', String(place.lat));
      if (place.lng) set('lng', String(place.lng));
    }
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    set('lat', latitude.toFixed(6));
    set('lng', longitude.toFixed(6));
  };

  const handleMarkerDrag = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    set('lat', latitude.toFixed(6));
    set('lng', longitude.toFixed(6));
  };

  const zoomIn = () => {
    const next = { latitudeDelta: deltaRef.current.latitudeDelta / 2, longitudeDelta: deltaRef.current.longitudeDelta / 2 };
    deltaRef.current = next;
    const lat = parseFloat(form.lat) || 7.8731;
    const lng = parseFloat(form.lng) || 80.7718;
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, ...next }, 250);
  };

  const zoomOut = () => {
    const next = { latitudeDelta: Math.min(deltaRef.current.latitudeDelta * 2, 5.5), longitudeDelta: Math.min(deltaRef.current.longitudeDelta * 2, 3.5) };
    deltaRef.current = next;
    const lat = parseFloat(form.lat) || 7.8731;
    const lng = parseFloat(form.lng) || 80.7718;
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, ...next }, 250);
  };

  const resetMapView = () => {
    const originalLat = getHotelCoordinate(existing, 'lat')?.toString() || '';
    const originalLng = getHotelCoordinate(existing, 'lng')?.toString() || '';
    set('lat', originalLat);
    set('lng', originalLng);
    const lat = parseFloat(originalLat);
    const lng = parseFloat(originalLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const region = { latitude: lat, longitude: lng, latitudeDelta: 0.08, longitudeDelta: 0.08 };
      deltaRef.current = { latitudeDelta: 0.08, longitudeDelta: 0.08 };
      mapRef.current?.animateToRegion(region, 400);
    } else {
      deltaRef.current = { latitudeDelta: 5.5, longitudeDelta: 3.5 };
      mapRef.current?.animateToRegion(SRI_LANKA, 600);
    }
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => {
      const key = toAmenityKey(amenity);
      const isSelected = isAmenitySelected(prev.amenities, amenity);
      const newAmenities = isSelected
        ? prev.amenities.filter((a) => toAmenityKey(a) !== key)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to pick a cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, aspect: [16, 9], quality: 0.7
    });
    if (!result.canceled && result.assets?.length > 0) {
      setLoading(true);
      try {
        const res = await uploadHotelImageApi(result.assets[0].uri);
        set('image_url', res?.data?.imageUrl || '');
      } catch (err) {
        Alert.alert('Upload failed', getApiErrorMessage(err, 'Could not upload image. Paste a URL instead.'));
      } finally {
        setLoading(false);
      }
    }
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    if (!name) next.name = 'Hotel name is required.';
    else if (name.length < 2) next.name = 'Hotel name must be at least 2 characters.';
    else if (name.length > 200) next.name = 'Hotel name must be less than 200 characters.';
    if (form.description.trim().length > 1000) next.description = 'Description must be less than 1000 characters.';
    if (form.price_per_night && isNaN(parseFloat(form.price_per_night)))
      next.price_per_night = 'Price per night must be a valid number.';
    if (form.star_class && isNaN(parseInt(form.star_class)))
      next.star_class = 'Star class must be a valid number.';
    if (!form.noContact && !form.contact_phone.trim() && !form.contact_email.trim() && !form.contact_website.trim())
      next.contact_phone = 'Provide at least one contact method';
    return Object.keys(next).length > 0 ? next : null;
  };

  const onSubmit = async () => {
    const fieldErrors = validate();
    if (fieldErrors) { setErrors(fieldErrors); return; }
    try {
      setLoading(true);
      setErrors({});
      setApiError('');
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        address_text: form.address_text.trim(),
        location: form.location.trim() || form.address_text.trim(),
        hotel_type: form.hotel_type,
        image_url: form.image_url.trim(),
        amenities: form.amenities,
        contact: {
          phone: form.contact_phone.trim(),
          email: form.contact_email.trim(),
          website: form.contact_website.trim()
        },
        isActive: form.isActive,
      };
      if (form.hotel_id) payload.hotel_id = parseInt(form.hotel_id);
      if (form.place_id) payload.place_id = parseInt(form.place_id);
      if (form.nearby_place_id) payload.nearby_place_id = parseInt(form.nearby_place_id);
      if (form.district_id) payload.district_id = parseInt(form.district_id);
      if (form.price_per_night) payload.price_per_night = parseFloat(form.price_per_night);
      if (form.star_class) payload.star_class = parseInt(form.star_class);
      const parsedLat = form.lat !== '' ? parseFloat(form.lat) : NaN;
      const parsedLng = form.lng !== '' ? parseFloat(form.lng) : NaN;
      payload.lat = Number.isFinite(parsedLat) ? parsedLat : null;
      payload.lng = Number.isFinite(parsedLng) ? parsedLng : null;
      if (!isEdit) { await createHotelApi(payload); } else { await updateHotelApi(existing._id, payload); }
      navigation.goBack();
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Operation failed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    Alert.alert(
      'Reset Changes',
      'Discard all edits and restore original values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: () => {
            setForm({
              hotel_id: existing?.hotel_id?.toString() || '',
              place_id: existing?.place_id?.toString() || '',
              nearby_place_id: existing?.nearby_place_id?.toString() || '',
              district_id: prefilledDistrictId,
              name: existing?.name || '',
              description: existing?.description || '',
              address_text: existing?.address_text || '',
              location: typeof existing?.location === 'string' ? existing.location : '',
              hotel_type: existing?.hotel_type || 'hotel',
              price_per_night: existing?.price_per_night?.toString() || '',
              star_class: existing?.star_class?.toString() || '',
              rating: existing?.rating?.toString() || '',
              lat: getHotelCoordinate(existing, 'lat')?.toString() || '',
              lng: getHotelCoordinate(existing, 'lng')?.toString() || '',
              contact_phone: getContactValue(existing, 'phone'),
              contact_email: getContactValue(existing, 'email'),
              contact_website: getContactValue(existing, 'website'),
              noContact: existing ? (!getContactValue(existing, 'phone') && !getContactValue(existing, 'email') && !getContactValue(existing, 'website')) : false,
              amenities: normalizeAmenities(existing?.amenities),
              image_url: existing?.image_url || '',
              isActive: existing?.isActive !== false,
            });
            setErrors({});
            setApiError('');
          }
        }
      ]
    );
  };

  const districtLocked = !!district && isEdit;
  const selectedType = HOTEL_TYPES.find((t) => t.id === form.hotel_type);
  const selectedAmenityCount = form.amenities.length;

  const districtOptions = useMemo(() =>
    districts.map((d) => ({ label: d.name, value: String(d.district_id) })),
    [districts]
  );

  const placeOptions = useMemo(() =>
    districtPlaces.map((p) => ({
      label: `${p.name}${p.type ? ` (${p.type})` : ''}`,
      value: String(p.place_id)
    })),
    [districtPlaces]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Hotel' : 'Add Hotel'}</Text>
            {district ? <Text style={styles.headerSub}>{district.name}</Text> : null}
          </View>
          {isEdit ? (
            <Pressable onPress={resetForm} style={styles.resetBtn}>
              <Ionicons name="refresh-outline" size={18} color={colors.warning} />
            </Pressable>
          ) : (
            <View style={{ width: 42 }} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Cover Photo ── */}
          <SectionHeader icon="image-outline" title="Cover Photo" subtitle="16:9 recommended" />

          <Pressable onPress={pickImage} style={styles.photoCard}>
            <FallbackImage
              uri={form.image_url}
              style={styles.photoPreview}
              resizeMode="cover"
              iconName="image-outline"
              iconSize={48}
            />
            <View style={styles.photoOverlay}>
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <View style={styles.photoCameraBtn}>
                  <Ionicons name="camera" size={18} color={colors.white} />
                </View>
              )}
              <Text style={styles.photoOverlayText}>
                {form.image_url ? 'Tap to change photo' : 'Tap to add cover photo'}
              </Text>
            </View>
          </Pressable>

          <AppInput
            label="Image URL (or pick above)"
            leftIcon="link-outline"
            value={form.image_url}
            onChangeText={(t) => set('image_url', t)}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://..."
          />

          {/* ── Basic Info ── */}
          <SectionHeader icon="business-outline" title="Basic Information" />

          <AppInput
            label="Hotel Name *"
            leftIcon="business-outline"
            value={form.name}
            onChangeText={(t) => set('name', t)}
            error={errors.name}
            placeholder="e.g. Cinnamon Grand"
          />

          <AppInput
            label="Description"
            leftIcon="document-text-outline"
            value={form.description}
            onChangeText={(t) => set('description', t)}
            error={errors.description}
            placeholder="Brief description of this hotel..."
            multiline
            numberOfLines={3}
          />

          {/* ── Hotel Type ── */}
          <SectionHeader icon="storefront-outline" title="Hotel Type" />

          <View style={styles.typeGrid}>
            {HOTEL_TYPES.map((pt) => {
              const active = form.hotel_type === pt.id;
              return (
                <Pressable
                  key={pt.id}
                  onPress={() => set('hotel_type', pt.id)}
                  style={[
                    styles.typeChip,
                    active && { borderColor: pt.color, backgroundColor: pt.color + '18' }
                  ]}
                >
                  <Text style={styles.typeEmoji}>{pt.emoji}</Text>
                  <Text style={[styles.typeChipText, active && { color: pt.color, fontWeight: '800' }]}>
                    {pt.id.charAt(0).toUpperCase() + pt.id.slice(1)}
                  </Text>
                  {active && (
                    <View style={[styles.typeCheckmark, { backgroundColor: pt.color }]}>
                      <Ionicons name="checkmark" size={10} color={colors.white} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {selectedType && (
            <View style={[styles.selectedTypeBanner, { backgroundColor: selectedType.color + '12', borderColor: selectedType.color + '35' }]}>
              <Text style={styles.selectedTypeEmoji}>{selectedType.emoji}</Text>
              <Text style={[styles.selectedTypeText, { color: selectedType.color }]}>
                {selectedType.id.charAt(0).toUpperCase() + selectedType.id.slice(1)} selected
              </Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="checkmark-circle" size={18} color={selectedType.color} />
            </View>
          )}

          {/* ── Location ── */}
          <SectionHeader icon="map-outline" title="Location Details" subtitle="Set address and pin on the map" />

          {districtLocked ? (
            <View style={styles.lockedField}>
              <Ionicons name="grid-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.lockedLabel}>DISTRICT</Text>
                <Text style={styles.lockedValue}>{district.name} (ID: {district.district_id})</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            </View>
          ) : (
            <AppSelect
              label="District *"
              leftIcon="grid-outline"
              value={String(form.district_id)}
              options={districtOptions}
              onChange={handleDistrictChange}
              placeholder="— Select District —"
            />
          )}

          {form.district_id ? (
            <AppSelect
              label="Nearby Destination (optional, auto-fills coordinates)"
              leftIcon="location-outline"
              value={String(form.nearby_place_id)}
              options={[{ label: '— None —', value: '' }, ...placeOptions]}
              onChange={handleNearbyPlaceChange}
              placeholder={loadingPlaces ? 'Loading destinations...' : '— Select a destination —'}
            />
          ) : null}

          <AppInput
            label="Address"
            leftIcon="map-outline"
            value={form.address_text}
            onChangeText={(t) => set('address_text', t)}
            placeholder="e.g. 77 Galle Rd, Colombo 03"
          />

          <AppInput
            label="Location / Area"
            leftIcon="navigate-outline"
            value={form.location}
            onChangeText={(t) => set('location', t)}
            placeholder="e.g. Colombo Fort, Ella town, Beachfront"
          />

          <View style={styles.coordRow}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="Latitude"
                leftIcon="navigate-outline"
                value={form.lat}
                onChangeText={(t) => set('lat', t)}
                keyboardType="numeric"
                error={errors.lat}
                placeholder="e.g. 6.9271"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AppInput
                label="Longitude"
                leftIcon="navigate-outline"
                value={form.lng}
                onChangeText={(t) => set('lng', t)}
                keyboardType="numeric"
                error={errors.lng}
                placeholder="e.g. 79.8612"
              />
            </View>
          </View>

          {/* Map picker */}
          <View style={styles.mapCard}>
            <View style={styles.mapHint}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.mapHintText}>
                {markerCoord ? 'Tap map to reposition · drag pin to adjust' : 'Tap the map to pin a location'}
              </Text>
              {markerCoord && (
                <Pressable onPress={() => { set('lat', ''); set('lng', ''); }} style={styles.clearPin}>
                  <Text style={styles.clearPinText}>Clear pin</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.mapOuter}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={markerCoord
                  ? { latitude: markerCoord.latitude, longitude: markerCoord.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }
                  : SRI_LANKA
                }
                onPress={handleMapPress}
                scrollEnabled zoomEnabled pitchEnabled={false} rotateEnabled={false}
              >
                {markerCoord && (
                  <Marker
                    coordinate={markerCoord}
                    draggable
                    onDragEnd={handleMarkerDrag}
                    title={form.name || 'Selected location'}
                  />
                )}
              </MapView>

              <View style={styles.mapZoomControls}>
                <Pressable style={styles.mapZoomBtn} onPress={zoomIn}>
                  <Ionicons name="add" size={18} color={colors.textPrimary} />
                </Pressable>
                <Pressable style={styles.mapZoomBtn} onPress={zoomOut}>
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </Pressable>
              </View>

              <Pressable style={styles.mapResetBtn} onPress={resetMapView}>
                <Ionicons name="scan-outline" size={13} color={colors.textPrimary} />
                <Text style={styles.mapResetText}>Reset view</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Pricing & Class ── */}
          <SectionHeader icon="cash-outline" title="Pricing & Classification" color={colors.success} />

          <AppInput
            label="Price per Night (LKR) *"
            leftIcon="cash-outline"
            value={form.price_per_night}
            onChangeText={(t) => set('price_per_night', t)}
            keyboardType="numeric"
            error={errors.price_per_night}
            placeholder="e.g. 15000"
          />
          <View style={{ marginTop: 8 }}>
            <AppSelect
              label="Star Classification"
              leftIcon="star-outline"
              value={String(form.star_class)}
              options={[
                { label: 'Unclassified', value: '0' },
                { label: '⭐ 1-star', value: '1' },
                { label: '⭐⭐ 2-star', value: '2' },
                { label: '⭐⭐⭐ 3-star', value: '3' },
                { label: '⭐⭐⭐⭐ 4-star', value: '4' },
                { label: '⭐⭐⭐⭐⭐ 5-star', value: '5' }
              ]}
              onChange={(val) => set('star_class', val)}
              placeholder="Select classification"
            />
          </View>

          {/* ── Amenities ── */}
          <SectionHeader
            icon="sparkles-outline"
            title="Amenities"
            subtitle={selectedAmenityCount > 0 ? `${selectedAmenityCount} selected` : 'Tap to select'}
            color={colors.accent}
          />

          <View style={styles.amenitiesGrid}>
            {AMENITIES_LIST.map((am) => {
              const selected = isAmenitySelected(form.amenities, am.id);
              return (
                <Pressable
                  key={am.id}
                  onPress={() => toggleAmenity(am.id)}
                  style={[styles.amenityChip, selected && styles.amenityChipSelected]}
                >
                  <Text style={styles.amenityEmoji}>{am.emoji}</Text>
                  <Text style={[styles.amenityText, selected && styles.amenityTextSelected]}>
                    {am.id}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Contact Details ── */}
          <View style={styles.sectionHeaderRow}>
            <SectionHeader icon="call-outline" title="Contact Details" />
            <Pressable
              style={styles.noContactToggle}
              onPress={() => {
                const next = !form.noContact;
                setForm((prev) => ({
                  ...prev,
                  noContact: next,
                  ...(next ? { contact_phone: '', contact_email: '', contact_website: '' } : {})
                }));
                setErrors((prev) => ({ ...prev, contact_phone: '' }));
              }}
            >
              <Ionicons
                name={form.noContact ? 'checkbox' : 'square-outline'}
                size={20}
                color={form.noContact ? colors.primary : colors.textMuted}
              />
              <Text style={styles.noContactLabel}>No contacts</Text>
            </Pressable>
          </View>

          {!form.noContact && (
            <>
              <View style={styles.coordRow}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Phone"
                    leftIcon="call-outline"
                    value={form.contact_phone}
                    onChangeText={(t) => set('contact_phone', t)}
                    keyboardType="phone-pad"
                    error={errors.contact_phone}
                    placeholder="07XXXXXXXX"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Email"
                    leftIcon="mail-outline"
                    value={form.contact_email}
                    onChangeText={(t) => set('contact_email', t)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="info@hotel.com"
                  />
                </View>
              </View>
              <AppInput
                label="Website"
                leftIcon="globe-outline"
                value={form.contact_website}
                onChangeText={(t) => set('contact_website', t)}
                keyboardType="url"
                autoCapitalize="none"
                placeholder="https://www.hotel.com"
              />
            </>
          )}

          {/* ── Status ── */}
          <SectionHeader icon="toggle-outline" title="Visibility Status" color={form.isActive ? colors.success : colors.textMuted} />

          <Pressable
            onPress={() => set('isActive', !form.isActive)}
            style={[
              styles.statusCard,
              form.isActive
                ? { borderColor: colors.success + '45', backgroundColor: colors.success + '08' }
                : { borderColor: colors.border, backgroundColor: colors.surface2 }
            ]}
          >
            <View style={[styles.statusCardIcon, { backgroundColor: form.isActive ? colors.success + '18' : colors.surface3 }]}>
              <Ionicons
                name={form.isActive ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color={form.isActive ? colors.success : colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusCardTitle, { color: form.isActive ? colors.success : colors.textMuted }]}>
                {form.isActive ? 'Active — visible to travelers' : 'Inactive — hidden from travelers'}
              </Text>
              <Text style={styles.statusCardHint}>Tap to toggle</Text>
            </View>
            <Switch
              value={form.isActive}
              onValueChange={(v) => set('isActive', v)}
              trackColor={{ false: colors.border, true: colors.success + '80' }}
              thumbColor={form.isActive ? colors.success : colors.textMuted}
            />
          </Pressable>

          <ErrorText message={apiError} />

          <View style={styles.btnContainer}>
            <AppButton
              title={loading
                ? (isEdit ? 'Saving...' : 'Adding...')
                : (isEdit ? 'Save Changes' : 'Add Hotel')}
              onPress={onSubmit}
              disabled={loading}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  resetBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.warning + '15', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.warning + '40',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1, textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 6 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 22, marginBottom: 14,
  },
  sectionHeaderIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionHeaderText: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: colors.textPrimary },
  sectionSubtitle: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noContactToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 14 },
  noContactLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  // Photo picker
  photoCard: {
    height: 190, borderRadius: 16, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    position: 'relative',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  photoCameraBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoOverlayText: { color: colors.white, fontSize: 13, fontWeight: '700' },

  // Hotel type grid
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  typeChip: {
    width: '30%', backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: 12, paddingHorizontal: 4,
    alignItems: 'center', gap: 5, position: 'relative',
  },
  typeEmoji: { fontSize: 24 },
  typeChipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  typeCheckmark: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  selectedTypeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 6,
  },
  selectedTypeEmoji: { fontSize: 18 },
  selectedTypeText: { fontSize: 14, fontWeight: '700' },

  // Coords
  coordRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },

  // Map
  mapCard: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  mapHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: colors.surface2,
  },
  mapHintText: { flex: 1, fontSize: 12, color: colors.textMuted },
  clearPin: {
    backgroundColor: colors.danger + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  clearPinText: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  mapOuter: { position: 'relative' },
  map: { width: '100%', height: 220 },
  mapZoomControls: { position: 'absolute', right: 8, top: 8, gap: 6 },
  mapZoomBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3,
  },
  mapResetBtn: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3,
  },
  mapResetText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  amenityChipSelected: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  amenityEmoji: { fontSize: 14 },
  amenityText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  amenityTextSelected: { color: colors.white, fontWeight: '800' },

  // Locked district
  lockedField: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface2, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  lockedLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8 },
  lockedValue: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },

  // Status card
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20,
  },
  statusCardIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statusCardTitle: { fontSize: 14, fontWeight: '700' },
  statusCardHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  btnContainer: { marginTop: 8 },
});

export default AdminHotelFormScreen;
