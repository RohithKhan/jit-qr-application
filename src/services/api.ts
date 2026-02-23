import axios from 'axios';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNavigationContainerRef } from '@react-navigation/native';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Shared navigation ref for interceptor use
export const navigationRef = createNavigationContainerRef<any>();

export const setNavigationRef = (ref: any) => {
    // kept for backward compat but navigationRef is now primary
};

// Request interceptor: attach token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType']);
            if (navigationRef) {
                navigationRef.reset({ index: 0, routes: [{ name: 'Auth' }] });
            }
        } else if (error.response?.data?.message) {
            const message = error.response.data.message.toLowerCase();
            if (message.includes('invalid token') || message.includes('token expired') || message.includes('unauthorized')) {
                await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType']);
                if (navigationRef) {
                    navigationRef.reset({ index: 0, routes: [{ name: 'Auth' }] });
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
