import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import AppButton from '../../components/common/AppButton';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

const GuestSignInPromptScreen = ({ navigation }) => {
  const { exitGuest } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.mainVisual}>
          <LinearGradient
            colors={[colors.primary + '20', colors.primary + '05']}
            style={styles.visualCircle}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={42} color={colors.primary} />
            </View>
          </LinearGradient>
          <View style={styles.floatingBadge}>
            <Ionicons name="lock-closed" size={14} color={colors.white} />
          </View>
        </View>

        <Text style={styles.title}>Unlock Premium Features</Text>
        <Text style={styles.sub}>
          Join the TravelGenie community to save your favorite spots, write reviews, and plan smart itineraries.
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.featureText}>Unlimited Trip Planning</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.featureText}>Smart Budget Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.featureText}>Verified Reviews & Ratings</Text>
          </View>
        </View>

        <View style={styles.btnGroup}>
          <Pressable style={styles.primaryBtn} onPress={exitGuest}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.primaryBtnGrad}
            >
              <Text style={styles.primaryBtnText}>Get Started Now</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </LinearGradient>
          </Pressable>

          <AppButton 
            title="Already have an account? Sign In" 
            variant="ghost" 
            onPress={exitGuest} 
            textStyle={styles.secondaryBtnText}
          />
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.stayLink}>
          <Text style={styles.stayText}>Maybe later, keep browsing</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 40
  },
  mainVisual: {
    marginBottom: 40,
    position: 'relative'
  },
  visualCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary + '15'
  },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    elevation: 10, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12
  },
  floatingBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.white,
    elevation: 4
  },
  title: { fontSize: 26, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  featuresList: { alignSelf: 'stretch', gap: 12, marginBottom: 40 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  btnGroup: { width: '100%', gap: 12, marginBottom: 20 },
  primaryBtn: { borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10 },
  primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  primaryBtnText: { color: colors.white, fontSize: 17, fontWeight: '900' },
  secondaryBtnText: { fontWeight: '800', color: colors.primary },
  stayLink: { paddingVertical: 10 },
  stayText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' }
});

export default GuestSignInPromptScreen;
