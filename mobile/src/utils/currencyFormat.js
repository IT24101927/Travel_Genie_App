export const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `LKR ${value.toFixed(2)}`;
};
