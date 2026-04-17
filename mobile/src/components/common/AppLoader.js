import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';

const AppLoader = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 16
  },
  message: {
    color: colors.primaryLight,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 2,
    textTransform: 'uppercase'
  }
});

export default AppLoader;
