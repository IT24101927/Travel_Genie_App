import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../../components/common/AppButton';
import ErrorText from '../../components/common/ErrorText';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constants/colors';
import { getMyProfileApi, deleteAccountApi } from '../../api/userApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { Alert } from 'react-native';

const ProfileScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMyProfileApi();
      setProfile(response?.data?.user || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Logout failed'));
    }
  };

  const handleDeleteAccount = () => {
    Alert.prompt(
      'Delete Account',
      'Enter your password to confirm. This action cannot be undone.',
      async (password) => {
        if (!password) return;
        try {
          await deleteAccountApi({ password });
          await logout();
        } catch (err) {
          setError(getApiErrorMessage(err, 'Failed to delete account'));
        }
      },
      'secure-text'
    );
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
         <View style={styles.avatar}>
           <Text style={styles.avatarText}>
             {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : '?'}
           </Text>
         </View>
         <Text style={styles.name}>{profile?.fullName || 'Traveler'}</Text>
         <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <ErrorText message={error} />

      <View style={styles.section}>
        <View style={styles.menuItem}>
          <View style={styles.menuIconInfo}>
             <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Account Info</Text>
            <Text style={styles.menuSubtitle}>Personal details and email</Text>
          </View>
        </View>
        <AppButton 
          title="Edit Profile" 
          variant="secondary"
          onPress={() => navigation.navigate('EditProfile', { profile })} 
        />
      </View>

      <View style={styles.section}>
        <View style={styles.menuItem}>
          <View style={styles.menuIconSecurity}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Privacy & Security</Text>
            <Text style={styles.menuSubtitle}>Change your password</Text>
          </View>
        </View>
        <AppButton
          title="Change Password"
          variant="secondary"
          onPress={() => navigation.navigate('ChangePassword')}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.menuItem}>
          <View style={styles.menuIconDanger}>
            <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Sign Out</Text>
            <Text style={styles.menuSubtitle}>Log out of this device</Text>
          </View>
        </View>
        <AppButton title="Sign Out" variant="danger" onPress={handleLogout} />
      </View>

      <View style={[styles.section, { borderColor: colors.danger + '40', borderWidth: 1 }]}>
        <View style={styles.menuItem}>
          <View style={[styles.menuIconDanger, { backgroundColor: colors.danger + '15' }]}>
            <Ionicons name="trash-outline" size={24} color={colors.danger} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: colors.danger }]}>Delete Account</Text>
            <Text style={styles.menuSubtitle}>Permanently remove your data</Text>
          </View>
        </View>
        <AppButton title="Delete My Account" variant="danger" onPress={handleDeleteAccount} />
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    padding: 24,
    paddingBottom: 120
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.primary
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  menuIconInfo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  menuIconSecurity: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  menuIconDanger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.danger + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  menuContent: {
    flex: 1
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2
  },
  menuSubtitle: {
    color: colors.textMuted,
    fontSize: 13
  }
});

export default ProfileScreen;
