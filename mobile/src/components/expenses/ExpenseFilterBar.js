import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import colors from '../../constants/colors';
import expenseCategories from '../../constants/expenseCategories';

const ExpenseFilterBar = ({ activeCategory, onCategoryChange }) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity 
        style={[styles.chip, !activeCategory && styles.chipActive]}
        onPress={() => onCategoryChange('')}
      >
        <Text style={[styles.text, !activeCategory && styles.textActive]}>All</Text>
      </TouchableOpacity>
      
      {expenseCategories.map((cat) => (
        <TouchableOpacity 
          key={cat}
          style={[styles.chip, activeCategory === cat && styles.chipActive]}
          onPress={() => onCategoryChange(cat)}
        >
          <Text style={[styles.text, activeCategory === cat && styles.textActive]}>
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginBottom: 16
  },
  content: {
    gap: 10,
    paddingBottom: 4
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  chipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary
  },
  text: {
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  textActive: {
    color: colors.primary
  }
});

export default ExpenseFilterBar;
