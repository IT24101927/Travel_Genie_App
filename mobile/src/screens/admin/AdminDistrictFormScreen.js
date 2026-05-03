import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import FallbackImage from '../../components/common/FallbackImage';
import colors from '../../constants/colors';
import { updateDistrictApi, uploadDistrictImageApi } from '../../api/districtApi';
import { getApiErrorMessage } from '../../utils/apiError';

const BEST_FOR_OPTIONS = [
  'Beaches', 'Mountains', 'Historical', 'Cultural',
  'Adventure', 'Nature', 'Wildlife', 'Religious',
  'Relax', 'Food', 'Nightlife', 'Photography', 'Art', 'Shopping'
];

const AdminDistrictFormScreen = ({ route, navigation }) => {
  const district = route.params?.district;

  const [form, setForm] = useState({
    description:   district?.description || '',
    image_url:     district?.image_url || '',
    highlightsRaw: Array.isArray(district?.highlights) ? district.highlights.join(', ') : '',
    best_for:      Array.isArray(district?.best_for) ? district.best_for : []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
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
      quality: 0.85,
    });

    if (result.canceled) return;

    try {
      setUploading(true);
      setError('');
      const res = await uploadDistrictImageApi(result.assets[0].uri);
      set('image_url', res?.data?.imageUrl || '');
    } catch (err) {
      Alert.alert('Upload failed', getApiErrorMessage(err, 'Could not upload image. You can paste a URL instead.'));
    } finally {
      setUploading(false);
    }
  };

  const toggleBestFor = (tag) => {
    setForm((prev) => ({
      ...prev,
      best_for: prev.best_for.includes(tag)
        ? prev.best_for.filter((t) => t !== tag)
        : [...prev.best_for, tag]
    }));
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const highlights = form.highlightsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name:        district.name,
        province:    district.province,
        description: form.description.trim(),
        image_url:   form.image_url.trim(),
        highlights,
        best_for:    form.best_for
      };

      await updateDistrictApi(district.district_id, payload);
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update district'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Edit District</Text>
            {district?.name ? (
              <Text style={styles.headerSub}>#{district.district_id} · {district.name}</Text>
            ) : null}
          </View>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Locked Info ── */}
          <Text style={styles.sectionTitle}>District Info</Text>

          <View style={styles.lockedRow}>
            <View style={styles.lockedField}>
              <Ionicons name="bookmark-outline" size={16} color={colors.textMuted} />
              <View style={styles.lockedText}>
                <Text style={styles.lockedLabel}>DISTRICT ID</Text>
                <Text style={styles.lockedValue}>#{district?.district_id}</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            </View>

            <View style={styles.lockedField}>
              <Ionicons name="globe-outline" size={16} color={colors.textMuted} />
              <View style={styles.lockedText}>
                <Text style={styles.lockedLabel}>PROVINCE</Text>
                <Text style={styles.lockedValue}>{district?.province}</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            </View>
          </View>

          <View style={styles.lockedField}>
            <Ionicons name="map-outline" size={16} color={colors.textMuted} />
            <View style={styles.lockedText}>
              <Text style={styles.lockedLabel}>DISTRICT NAME</Text>
              <Text style={styles.lockedValue}>{district?.name}</Text>
            </View>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
          </View>

          {/* ── Description ── */}
          <Text style={styles.sectionTitle}>Description</Text>
          <AppInput
            label="Description"
            leftIcon="document-text-outline"
            value={form.description}
            onChangeText={(t) => set('description', t)}
            placeholder="Brief description of this district..."
            multiline
            numberOfLines={3}
          />

          {/* ── Cover Photo ── */}
          <Text style={styles.sectionTitle}>Cover Photo</Text>

          <Pressable onPress={pickImage} style={styles.photoCard} disabled={uploading}>
            <FallbackImage
              uri={form.image_url}
              style={styles.photoPreview}
              resizeMode="cover"
              iconName="map-outline"
              iconSize={48}
            />
            <View style={styles.photoOverlay}>
              {uploading ? (
                <View style={styles.uploadingBadge}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              ) : (
                <View style={styles.changePhotoBadge}>
                  <Ionicons name="camera" size={16} color={colors.white} />
                  <Text style={styles.changePhotoText}>
                    {form.image_url ? 'Change Photo' : 'Add Photo'}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          <AppInput
            label="Or paste image URL"
            leftIcon="link-outline"
            value={form.image_url}
            onChangeText={(t) => set('image_url', t)}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://..."
          />

          {/* ── Highlights ── */}
          <Text style={styles.sectionTitle}>Highlights</Text>
          <AppInput
            label="Highlights (comma-separated)"
            leftIcon="sparkles-outline"
            value={form.highlightsRaw}
            onChangeText={(t) => set('highlightsRaw', t)}
            placeholder="e.g. Temple of Tooth, Peradeniya Gardens"
            helperText="Separate each highlight with a comma."
          />

          {/* ── Best For ── */}
          <Text style={styles.sectionTitle}>Best For</Text>
          <View style={styles.pillContainer}>
            {BEST_FOR_OPTIONS.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => toggleBestFor(tag)}
                style={[styles.pill, form.best_for.includes(tag) && styles.pillSelected]}
              >
                <Text style={[styles.pillText, form.best_for.includes(tag) && styles.pillTextSelected]}>
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>

          <ErrorText message={error} />

          <View style={styles.btnContainer}>
            <AppButton
              title={loading ? 'Saving...' : 'Save Changes'}
              onPress={onSubmit}
              disabled={loading || uploading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 8 },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: colors.textPrimary,
    marginTop: 16, marginBottom: 12
  },

  lockedRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  lockedField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface2, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 11,
    marginBottom: 10
  },
  lockedText: { flex: 1 },
  lockedLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8 },
  lockedValue: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 2 },

  photoCard: {
    height: 180, borderRadius: 16, overflow: 'hidden',
    marginBottom: 12, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12, alignItems: 'center', justifyContent: 'flex-end',
  },
  changePhotoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  changePhotoText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  uploadingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  uploadingText: { color: colors.white, fontSize: 13, fontWeight: '600' },

  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border
  },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pillTextSelected: { color: colors.white, fontWeight: '700' },
  btnContainer: { marginTop: 12 }
});

export default AdminDistrictFormScreen;
