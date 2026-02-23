import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserType } from '../types';

export const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem('token');
};

export const setToken = async (token: string): Promise<void> => {
    await AsyncStorage.setItem('token', token);
};

export const removeToken = async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
};

export const isLoggedIn = async (): Promise<boolean> => {
    const val = await AsyncStorage.getItem('isLoggedIn');
    return val === 'true';
};

export const setLoggedIn = async (val: boolean): Promise<void> => {
    await AsyncStorage.setItem('isLoggedIn', val ? 'true' : 'false');
};

export const getUserType = async (): Promise<UserType | null> => {
    const val = await AsyncStorage.getItem('userType');
    return val as UserType | null;
};

export const setUserType = async (type: UserType): Promise<void> => {
    await AsyncStorage.setItem('userType', type);
};

export const clearAuth = async (): Promise<void> => {
    await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType']);
};
