import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'travelgenie_token';
const USER_KEY = 'travelgenie_user';

export const saveAuthSession = async ({ token, user }) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)]
  ]);
};

export const getAuthSession = async () => {
  const [token, userRaw] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  const tokenValue = token?.[1] || null;
  const userValue = userRaw?.[1] ? JSON.parse(userRaw[1]) : null;
  return { token: tokenValue, user: userValue };
};

export const clearAuthSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};
