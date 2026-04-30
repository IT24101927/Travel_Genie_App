import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

const GuestSignInPromptScreen = ({ navigation }) => {
  const { exitGuest } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>Sign in to continue</Text>
        <Text style={styles.sub}>
          Create a free account or sign in to view full details, write reviews, plan trips and more.
        </Text>

        <View style={styles.btnGroup}>
          <AppButton title="Sign In" onPress={exitGuest} />
          <AppButton title="Create Account" variant="secondary" onPress={exitGuest} />
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.stayLink}>
          <Text style={styles.stayText}>Keep browsing as guest</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    margin: 16
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#EAF4F1',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1, borderColor: '#DDE6E1'
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  sub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btnGroup: { width: '100%', gap: 12, marginBottom: 20 },
  stayLink: { paddingVertical: 10 },
  stayText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' }
});

export default GuestSignInPromptScreen;
