import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import colors from '../../constants/colors';

const AppInput = ({ label, error, style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          style,
          isFocused && styles.inputFocused,
          !!error && styles.errorBorder
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface
  },
  errorBorder: {
    borderColor: colors.danger
  },
  errorText: {
    color: colors.danger,
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500'
  }
});

export default AppInput;
