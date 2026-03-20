import axios from 'axios';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNavigationContainerRef, ThemeContext } from '@react-navigation/native';
import { InteractionManager } from 'react-native';

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
        const status = error.response?.status;
        const data = error.response?.data;

        // Check for auth failure: proper 401/403 OR backend returning 500 with JWT error
        const isJwtError =
            status === 401 ||
            status === 403 ||
            (data?.error && typeof data.error === 'string' && data.error.toLowerCase().includes('jwt')) ||
            (data?.message && typeof data.message === 'string' &&
                (data.message.toLowerCase().includes('invalid token') ||
                 data.message.toLowerCase().includes('token expired') ||
                 data.message.toLowerCase().includes('jwt expired') ||
                 data.message.toLowerCase().includes('unauthorized')));

        if (isJwtError) {
            await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType']);
            if (navigationRef?.isReady()) {
                navigationRef.reset({ index: 0, routes: [{ name: 'Auth' }] });
            }
        }

        return Promise.reject(error);
    }
);

export default api;
