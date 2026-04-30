import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../constants/colors';

const OPTIONS = [
  { id: 'MALE',   label: 'Male',   emoji: '👨' },
  { id: 'FEMALE', label: 'Female', emoji: '👩' },
  { id: 'OTHER',  label: 'Other',  emoji: '🧑' }
];

const GenderPicker = ({ value, onChange, label = 'Gender' }) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => onChange(opt.id)}
            >
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={[styles.optLabel, selected && styles.optLabelSelected]}>
                {opt.label}
              </Text>
              <View style={[styles.dot, selected && styles.dotSelected]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 10
  },
  row: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#DDE6E1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EAF7F2'
  },
  emoji: { fontSize: 28 },
  optLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  optLabelSelected: {
    color: colors.primary,
    fontWeight: '800'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginTop: 2
  },
  dotSelected: {
    backgroundColor: colors.primary
  }
});

export default GenderPicker;
