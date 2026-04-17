import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';

const PlaceDetailsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Place details screen can be expanded if your team assigns it.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 18
  },
  text: {
    color: colors.textMuted
  }
});

export default PlaceDetailsScreen;
