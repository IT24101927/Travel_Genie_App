import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'travelgenie_token';
const USER_KEY = 'travelgenie_user';
const MAIN_TAB_KEY = 'travelgenie_main_tab';

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

const getMainTabKey = (userKey) => `${MAIN_TAB_KEY}_${userKey || 'default'}`;

export const saveLastMainTab = async (userKey, tabName) => {
  if (!tabName) return;
  await AsyncStorage.setItem(getMainTabKey(userKey), tabName);
};

export const getLastMainTab = async (userKey) => {
  return AsyncStorage.getItem(getMainTabKey(userKey));
};
