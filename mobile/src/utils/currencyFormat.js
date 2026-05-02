export const DISPLAY_CURRENCIES = [
  { code: 'LKR', symbol: 'Rs', flag: '🇱🇰', rate: 1 },
  { code: 'USD', symbol: '$', flag: '🇺🇸', rate: 0.0033 },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', rate: 0.0031 },
];

export const convertAmt = (amount, fromCode, toCode) => {
  if (!amount) return 0;
  const from = DISPLAY_CURRENCIES.find(c => c.code === fromCode)?.rate ?? 1;
  const to = DISPLAY_CURRENCIES.find(c => c.code === toCode)?.rate ?? 1;
  return Math.round((amount / from) * to * 100) / 100;
};

// Formats a value directly with the given currency's symbol
export const formatCurrency = (amount, currency = 'LKR') => {
  const value = Number(amount || 0);
  const currencyObj = DISPLAY_CURRENCIES.find(c => c.code === currency);
  const symbol = currencyObj ? currencyObj.symbol : currency;
  return `${symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  return Number(hotel.price_per_night ?? hotel.pricePerNight ?? 0) || 0;
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
