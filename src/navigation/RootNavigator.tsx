import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setNavigationRef } from '../services/api';

import AuthStack from './AuthStack';
import StudentStack from './StudentStack';
import StaffStack from './StaffStack';
import WardenStack from './WardenStack';
import WatchmanStack from './WatchmanStack';
import YearInchargeStack from './YearInchargeStack';
import AdminStack from './AdminStack';

const RootStack = createStackNavigator();

const RootNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userType, setUserType] = useState<string | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const navigationRef = useRef<any>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const logged = await AsyncStorage.getItem('isLoggedIn');
        const type = await AsyncStorage.getItem('userType');
        setLoggedIn(logged === 'true');
        setUserType(type);
        setIsLoading(false);
    };

    if (isLoading) return null;

    const getAppStack = () => {
        if (!loggedIn) return <RootStack.Screen name="Auth" component={AuthStack} />;
        switch (userType) {
            case 'staff': return <RootStack.Screen name="Staff" component={StaffStack} />;
            case 'warden': return <RootStack.Screen name="Warden" component={WardenStack} />;
            case 'watchman': return <RootStack.Screen name="Watchman" component={WatchmanStack} />;
            case 'year_incharge': return <RootStack.Screen name="YearIncharge" component={YearInchargeStack} />;
            case 'admin': return <RootStack.Screen name="Admin" component={AdminStack} />;
            default: return <RootStack.Screen name="Student" component={StudentStack} />;
        }
    };

    return (
        <NavigationContainer
            ref={(ref) => {
                navigationRef.current = ref;
                setNavigationRef(ref);
            }}
        >
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="Auth" component={AuthStack} />
                <RootStack.Screen name="Student" component={StudentStack} />
                <RootStack.Screen name="Staff" component={StaffStack} />
                <RootStack.Screen name="Warden" component={WardenStack} />
                <RootStack.Screen name="Watchman" component={WatchmanStack} />
                <RootStack.Screen name="YearIncharge" component={YearInchargeStack} />
                <RootStack.Screen name="Admin" component={AdminStack} />
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
