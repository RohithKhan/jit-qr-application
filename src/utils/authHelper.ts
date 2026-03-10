import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../services/api';

export const handleGlobalLogout = async () => {
    const doLogout = async () => {
        await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType', 'staff_profile']);
        if (navigationRef.isReady()) {
            navigationRef.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                })
            );
        }
    };

    if (Platform.OS === 'web') {
        const confirmContent = window.confirm('Are you sure you want to logout?');
        if (confirmContent) {
            await doLogout();
        }
    } else {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: doLogout }
        ]);
    }
};
