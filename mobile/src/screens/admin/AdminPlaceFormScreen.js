import React, { useMemo, useRef, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import FallbackImage from '../../components/common/FallbackImage';
import colors from '../../constants/colors';
import { createPlaceApi, updatePlaceApi, uploadPlaceImageApi } from '../../api/placeApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { PLACE_TYPE_OPTIONS, getKnownPlaceType } from '../../utils/placeTypes';

const PLACE_TYPES = PLACE_TYPE_OPTIONS;
const normalizePlaceType = (value) => getKnownPlaceType(value, 'Temple');

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

const AdminPlaceFormScreen = ({ route, navigation }) => {
  const existing = route.params?.place || null;
  const district = route.params?.district || null;
  const isEdit = !!existing;

  const prefilledDistrictId = existing?.district_id?.toString()
    || district?.district_id?.toString()
    || '';

  const [form, setForm] = useState({
    place_id: existing?.place_id?.toString() || '',
    district_id: prefilledDistrictId,
    name: existing?.name || '',
    description: existing?.description || '',
    address_text: existing?.address_text || '',
    lat: existing?.lat?.toString() || '',
    lng: existing?.lng?.toString() || '',
    type: normalizePlaceType(existing?.type),
    duration: existing?.duration || '',
    image_url: existing?.image_url || '',
    isActive: existing?.isActive !== false
  });
  const [uploading, setUploading] = useState(false);
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

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setApiError('');
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
    const originalLat = existing?.lat?.toString() || '';
    const originalLng = existing?.lng?.toString() || '';
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to pick a cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;

    try {
      setUploading(true);
      const res = await uploadPlaceImageApi(localUri);
      set('image_url', res?.data?.imageUrl || '');
    } catch (err) {
      Alert.alert('Upload failed', getApiErrorMessage(err, 'Could not upload image. You can paste a URL instead.'));
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    if (!name) next.name = 'Place name is required.';
    else if (name.length < 2) next.name = 'Place name must be at least 2 characters.';
    else if (name.length > 200) next.name = 'Place name must be less than 200 characters.';
    else if (/[@#$%^*={}[\]|\\<>]/.test(name)) next.name = 'Place name contains invalid characters (@, #, $, % etc).';

    if (!form.district_id.trim()) next.district_id = 'District ID is required.';
    else if (isNaN(parseInt(form.district_id))) next.district_id = 'District ID must be a number.';

    if (!isEdit) {
      if (!form.place_id.trim()) next.place_id = 'Place ID is required.';
      else if (isNaN(parseInt(form.place_id))) next.place_id = 'Place ID must be a number.';
    }

    if (form.description.trim().length > 1000) next.description = 'Description must be less than 1000 characters.';

    if (form.lat) {
      const lat = parseFloat(form.lat);
      if (isNaN(lat)) next.lat = 'Latitude must be a valid number.';
      else if (lat < 5.5 || lat > 10.0) next.lat = 'Latitude must be between 5.5 and 10.0 for Sri Lanka.';
    }
    if (form.lng) {
      const lng = parseFloat(form.lng);
      if (isNaN(lng)) next.lng = 'Longitude must be a valid number.';
      else if (lng < 79.0 || lng > 82.5) next.lng = 'Longitude must be between 79.0 and 82.5 for Sri Lanka.';
    }

    return Object.keys(next).length > 0 ? next : null;
  };

  const onSubmit = async () => {
    const fieldErrors = validate();
    if (fieldErrors) {
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      setApiError('');

      const payload = {
        name: form.name.trim(),
        district_id: parseInt(form.district_id),
        description: form.description.trim(),
        address_text: form.address_text.trim(),
        type: form.type,
        duration: form.duration.trim(),
        image_url: form.image_url.trim(),
        isActive: form.isActive,
        ...(form.lat ? { lat: parseFloat(form.lat) } : {}),
        ...(form.lng ? { lng: parseFloat(form.lng) } : {})
      };

      if (!isEdit) {
        payload.place_id = parseInt(form.place_id);
        await createPlaceApi(payload);
      } else {
        await updatePlaceApi(existing._id, payload);
      }

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
              place_id: existing?.place_id?.toString() || '',
              district_id: prefilledDistrictId,
              name: existing?.name || '',
              description: existing?.description || '',
              address_text: existing?.address_text || '',
              lat: existing?.lat?.toString() || '',
              lng: existing?.lng?.toString() || '',
              type: normalizePlaceType(existing?.type),
              duration: existing?.duration || '',
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

  const districtLocked = !!district;
  const selectedType = PLACE_TYPES.find((t) => t.id === form.type);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Place' : 'Add Place'}</Text>
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

          <Pressable onPress={pickImage} style={styles.photoCard} disabled={uploading}>
            <FallbackImage
              uri={form.image_url}
              style={styles.photoPreview}
              resizeMode="cover"
              iconName="image-outline"
              iconSize={48}
            />
            <View style={styles.photoOverlay}>
              {uploading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <View style={styles.photoCameraBtn}>
                  <Ionicons name="camera" size={18} color={colors.white} />
                </View>
              )}
              <Text style={styles.photoOverlayText}>
                {uploading ? 'Uploading...' : form.image_url ? 'Tap to change photo' : 'Tap to add cover photo'}
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

          {/* ── Identification ── */}
          <SectionHeader icon="bookmark-outline" title="Identification" subtitle="IDs must be unique numbers" />

          {!isEdit && (
            <AppInput
              label="Place ID *"
              leftIcon="bookmark-outline"
              value={form.place_id}
              onChangeText={(t) => set('place_id', t)}
              keyboardType="numeric"
              error={errors.place_id}
              placeholder="Unique numeric ID (e.g. 101)"
              helperText={errors.place_id ? undefined : 'Must be a unique number not already in the system.'}
            />
          )}

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
            <AppInput
              label="District ID *"
              leftIcon="grid-outline"
              value={form.district_id}
              onChangeText={(t) => set('district_id', t)}
              keyboardType="numeric"
              error={errors.district_id}
              placeholder="Numeric district ID (e.g. 1)"
            />
          )}

          {/* ── Basic Information ── */}
          <SectionHeader icon="location-outline" title="Basic Information" />

          <AppInput
            label="Place Name *"
            leftIcon="location-outline"
            value={form.name}
            onChangeText={(t) => set('name', t)}
            error={errors.name}
            placeholder="e.g. Sigiriya Rock Fortress"
          />

          <AppInput
            label="Description"
            leftIcon="document-text-outline"
            value={form.description}
            onChangeText={(t) => set('description', t)}
            error={errors.description}
            placeholder="Brief description of this place..."
            multiline
            numberOfLines={3}
          />

          <AppInput
            label="Address"
            leftIcon="map-outline"
            value={form.address_text}
            onChangeText={(t) => set('address_text', t)}
            placeholder="e.g. Sigiriya, Matale District"
          />

          <AppInput
            label="Typical Visit Duration"
            leftIcon="time-outline"
            value={form.duration}
            onChangeText={(t) => set('duration', t)}
            placeholder="e.g. 2–3 hours"
          />

          {/* ── Place Type ── */}
          <SectionHeader icon="apps-outline" title="Place Type" />

          <View style={styles.typeGrid}>
            {PLACE_TYPES.map((pt) => {
              const active = form.type === pt.id;
              return (
                <Pressable
                  key={pt.id}
                  onPress={() => set('type', pt.id)}
                  style={[
                    styles.typeChip,
                    active && { borderColor: pt.color, backgroundColor: pt.color + '18' }
                  ]}
                >
                  <Text style={styles.typeEmoji}>{pt.emoji}</Text>
                  <Text style={[styles.typeChipText, active && { color: pt.color, fontWeight: '800' }]}>
                    {pt.id}
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
                {selectedType.id} selected
              </Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="checkmark-circle" size={18} color={selectedType.color} />
            </View>
          )}

          {/* ── Coordinates ── */}
          <SectionHeader icon="map-outline" title="Coordinates" subtitle="Optional — tap map to pin location" color={colors.info} />

          <View style={styles.coordRow}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="Latitude"
                leftIcon="navigate-outline"
                value={form.lat}
                onChangeText={(t) => set('lat', t)}
                keyboardType="numeric"
                error={errors.lat}
                placeholder="e.g. 7.9573"
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
                placeholder="e.g. 80.7600"
              />
            </View>
          </View>

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

          {/* ── Status ── */}
          <SectionHeader
            icon="toggle-outline"
            title="Visibility Status"
            color={form.isActive ? colors.success : colors.textMuted}
          />

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
                : (isEdit ? 'Save Changes' : 'Add Place')}
              onPress={onSubmit}
              disabled={loading || uploading}
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

  // Locked district field
  lockedField: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface2, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  lockedLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8 },
  lockedValue: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },

  // Place type grid
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

export default AdminPlaceFormScreen;
