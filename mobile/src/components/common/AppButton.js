import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text } from 'react-native';
import colors from '../../constants/colors';

const AppButton = ({ title, onPress, variant = 'primary', disabled = false, loading = false, allowPressWhenKeyboardOpen = false }) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handlePress = () => {
    if (loading) return;
    if (!allowPressWhenKeyboardOpen && isKeyboardVisible) {
      Keyboard.dismiss();
    }
    onPress?.();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'ghost':
        return styles.ghost;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
      case 'ghost':
        return styles.textSecondary;
      case 'danger':
      default:
        return styles.textPrimary;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        getVariantStyles(),
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.primary : colors.white} />
        : <Text style={[styles.text, getTextStyle()]}>{title}</Text>
      }
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border
  },
  ghost: {
    backgroundColor: 'transparent'
  },
  danger: {
    backgroundColor: colors.danger
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.8
  },
  text: {
    fontWeight: '700',
    fontSize: 16
  },
  textPrimary: {
    color: colors.white
  },
  textSecondary: {
    color: colors.textPrimary
  }
});

export default AppButton;
