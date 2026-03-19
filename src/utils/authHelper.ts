import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../services/api';

export const handleGlobalLogout = async () => {
    try {
        await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType']);
        if (navigationRef.isReady()) {
            navigationRef.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
};
