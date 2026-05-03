export const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `LKR ${value.toFixed(2)}`;
};

export const HOTEL_CURRENCIES = [
  { code: 'LKR', symbol: 'Rs', label: 'LKR', rate: 1 },
  { code: 'USD', symbol: '$', label: 'USD', rate: 0.0033 },
  { code: 'EUR', symbol: '€', label: 'EUR', rate: 0.0031 },
];

export const getHotelCurrency = (code = 'LKR') => (
  HOTEL_CURRENCIES.find((currency) => currency.code === String(code).toUpperCase())
  || HOTEL_CURRENCIES[0]
);

export const convertHotelPriceFromLkr = (amount, toCode = 'LKR') => {
  const value = Number(amount || 0);
  const currency = getHotelCurrency(toCode);
  return value * currency.rate;
};

export const convertHotelPriceToLkr = (amount, fromCode = 'LKR') => {
  const value = Number(amount || 0);
  const currency = getHotelCurrency(fromCode);
  return currency.rate ? value / currency.rate : value;
};

export const getHotelNightlyPriceLkr = (hotel = {}) => {
  const priceRange = hotel.priceRange;
  if (typeof priceRange === 'object' && priceRange !== null) {
    return Number(priceRange.min ?? priceRange.price ?? hotel.price_per_night ?? 0) || 0;
  }
  return Number(hotel.price_per_night ?? priceRange ?? hotel.pricePerNight ?? 0) || 0;
};

export const formatHotelPrice = (amountLkr, code = 'LKR') => {
  const currency = getHotelCurrency(code);
  const converted = convertHotelPriceFromLkr(amountLkr, currency.code);
  const decimals = currency.code === 'LKR' ? 0 : 2;
  return `${currency.symbol} ${converted.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};
