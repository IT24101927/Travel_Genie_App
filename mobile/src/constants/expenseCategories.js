const expenseCategories = [
  { id: 'transport',  label: 'Transport',  icon: 'train-outline',      color: '#3B82F6' },
  { id: 'food',       label: 'Food',       icon: 'restaurant-outline', color: '#F59E0B' },
  { id: 'hotel',      label: 'Hotel',      icon: 'bed-outline',        color: '#0E7C5F' },
  { id: 'activity',   label: 'Activity',   icon: 'ticket-outline',     color: '#8B5CF6' },
  { id: 'shopping',   label: 'Shopping',   icon: 'bag-handle-outline', color: '#EC4899' },
  { id: 'other',      label: 'Other',      icon: 'wallet-outline',     color: '#6B7280' },
];

/** Simple string list for validation / backward compat */
export const expenseCategoryIds = expenseCategories.map((c) => c.id);

/** Lookup helpers */
export const getCategoryMeta = (id) =>
  expenseCategories.find((c) => c.id === id) || expenseCategories[expenseCategories.length - 1];

export default expenseCategories;
