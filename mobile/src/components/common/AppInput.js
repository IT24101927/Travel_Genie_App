import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import colors from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const AppInput = ({ label, error, style, leftIcon, rightIcon, onRightIconPress, secureTextEntry, helperText, onContainerPress, ...props }) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const isReadOnlyField = props.editable === false;

  const renderInput = () => (
    <>
      {leftIcon && (
        <View style={styles.leftIconContainer} pointerEvents="none">
          <Ionicons name={leftIcon} size={20} color={isFocused ? colors.primary : colors.textMuted} />
        </View>
      )}

      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        editable={!isReadOnlyField}
        selectTextOnFocus={false}
        caretHidden={isReadOnlyField}
        contextMenuHidden={isReadOnlyField}
        onPressIn={(e) => {
          if (isReadOnlyField) {
            onContainerPress?.();
          }
          props.onPressIn?.(e);
        }}
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

      {secureTextEntry ? (
        <Pressable style={styles.rightIconContainer} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
          <Ionicons name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
        </Pressable>
      ) : rightIcon ? (
        <Pressable style={styles.rightIconContainer} onPress={onRightIconPress} disabled={!onRightIconPress}>
          {typeof rightIcon === 'string' ? (
            <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
          ) : rightIcon}
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {isReadOnlyField ? (
        <Pressable
          onPress={onContainerPress}
          android_disableSound
          android_ripple={{ color: 'transparent' }}
          style={[
            styles.inputContainer,
            style,
            isFocused && styles.inputFocused,
            !!error && styles.errorBorder
          ]}
        >
          {renderInput()}
        </Pressable>
      ) : (
        <View
          style={[
            styles.inputContainer,
            style,
            isFocused && styles.inputFocused,
            !!error && styles.errorBorder
          ]}
        >
          {renderInput()}
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 6
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDE6E1',
    backgroundColor: '#F7FAF8',
    borderRadius: 14,
    height: 54,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  leftIconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  rightIconContainer: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    color: colors.textPrimary,
    fontSize: 15,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  }
});

export default AppInput;
