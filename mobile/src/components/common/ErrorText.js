import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const ErrorText = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="warning" size={20} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10
  },
  text: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
    flex: 1
  }
});

export default ErrorText;
