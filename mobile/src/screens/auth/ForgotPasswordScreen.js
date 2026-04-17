import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';

const ForgotPasswordScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.text}>
        Password reset is not implemented in this assignment scope yet.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 18
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary
  },
  text: {
    marginTop: 8,
    color: colors.textMuted
  }
});

export default ForgotPasswordScreen;
