import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import colors from '../../constants/colors';

const StartScreen = ({ navigation }) => {
  useEffect(() => {
    // Navigate to Login after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image 
          source={require('../../../assets/images/TravelGenie.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Travel<Text style={styles.titleHighlight}>Genie</Text></Text>
      <Text style={styles.subtitle}>Preparing your journey...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  titleHighlight: {
    color: colors.primary,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  }
});

export default StartScreen;
