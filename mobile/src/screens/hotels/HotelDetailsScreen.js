import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';

const HotelDetailsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hotel details screen can be expanded in next iteration.</Text>
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

export default HotelDetailsScreen;
