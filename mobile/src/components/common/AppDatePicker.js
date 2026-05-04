import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import colors from '../../constants/colors';

const AppDatePicker = ({ 
  label, 
  value, 
  onChange, 
  mode = 'datetime', 
  placeholder = 'Select Date', 
  leftIcon = 'calendar-outline',
  error,
  minimumDate,
  maximumDate
}) => {
  const [isVisible, setIsVisible] = useState(false);


  const formatDisplay = (val) => {
    if (!val) return null;
    const d = new Date(val);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    if (mode === 'date') return `${day} ${month} ${year}`;
    if (mode === 'time') return `${displayHours}:${minutes} ${ampm}`;
    return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`;
  };


  const handleConfirm = (date) => {
    setIsVisible(false);
    onChange(date);
  };

  const displayValue = formatDisplay(value);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Pressable 
        onPress={() => setIsVisible(true)}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
          !!error && styles.errorBorder
        ]}
      >
        <View style={styles.iconBox}>
          <Ionicons name={leftIcon} size={20} color={value ? colors.primary : colors.textMuted} />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.value, !value && styles.placeholder]}>
            {displayValue || placeholder}
          </Text>
        </View>

        <View style={styles.rightIcon}>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </View>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <DateTimePickerModal
        isVisible={isVisible}
        mode={mode}
        date={value ? new Date(value) : new Date()}
        onConfirm={handleConfirm}
        onCancel={() => setIsVisible(false)}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        themeVariant="light"
        confirmTextIOS="Confirm"
        cancelTextIOS="Cancel"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      />



    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 2
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 16,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12
  },
  pressed: {
    backgroundColor: colors.surface3,
    borderColor: colors.primary + '40'
  },
  errorBorder: {
    borderColor: colors.danger
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  content: {
    flex: 1
  },
  value: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  placeholder: {
    color: colors.textMuted,
    fontWeight: '600'
  },
  rightIcon: {
    marginLeft: 8
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600'
  }
});

export default AppDatePicker;
