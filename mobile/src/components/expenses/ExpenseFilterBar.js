import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import expenseCategories from '../../constants/expenseCategories';

const ExpenseFilterBar = ({
  activeCategory,
  onCategoryChange,
  trips = [],
  activeTrip = '',
  onTripChange,
}) => {
  const showTripFilter = trips.length > 0 && onTripChange;

  return (
    <View style={styles.wrapper}>
      {/* Trip filter row */}
      {showTripFilter ? (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Trip</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <TouchableOpacity
              style={[styles.tripChip, !activeTrip && styles.tripChipActive]}
              onPress={() => onTripChange('')}
            >
              <Ionicons
                name="globe-outline"
                size={14}
                color={!activeTrip ? colors.white : colors.textMuted}
              />
              <Text style={[styles.tripText, !activeTrip && styles.tripTextActive]}>
                All Trips
              </Text>
            </TouchableOpacity>
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip._id}
                style={[styles.tripChip, activeTrip === trip._id && styles.tripChipActive]}
                onPress={() => onTripChange(trip._id)}
              >
                <Ionicons
                  name="airplane"
                  size={12}
                  color={activeTrip === trip._id ? colors.white : colors.textMuted}
                />
                <Text
                  style={[styles.tripText, activeTrip === trip._id && styles.tripTextActive]}
                  numberOfLines={1}
                >
                  {trip.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Category filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <TouchableOpacity
          style={[styles.catChip, !activeCategory && styles.catChipActive]}
          onPress={() => onCategoryChange('')}
        >
          <Text style={[styles.catText, !activeCategory && styles.catTextActive]}>All</Text>
        </TouchableOpacity>

        {expenseCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catChip,
              activeCategory === cat.id && { backgroundColor: cat.color + '18', borderColor: cat.color },
            ]}
            onPress={() => onCategoryChange(cat.id)}
          >
            <Ionicons
              name={cat.icon}
              size={14}
              color={activeCategory === cat.id ? cat.color : colors.textMuted}
            />
            <Text
              style={[
                styles.catText,
                activeCategory === cat.id && { color: cat.color },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
    marginBottom: 12,
  },
  filterSection: {
    gap: 6,
  },
  filterLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 2,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 2,
  },
  tripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tripText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
    maxWidth: 100,
  },
  tripTextActive: {
    color: colors.white,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: colors.primary + '18',
    borderColor: colors.primary,
  },
  catText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  catTextActive: {
    color: colors.primary,
  },
});

export default ExpenseFilterBar;
