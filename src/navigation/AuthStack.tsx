import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import WardenLoginScreen from '../screens/auth/WardenLoginScreen';
import WatchmanLoginScreen from '../screens/auth/WatchmanLoginScreen';
import YearInchargeLoginScreen from '../screens/auth/YearInchargeLoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';

const Stack = createStackNavigator();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="WardenLogin" component={WardenLoginScreen} />
        <Stack.Screen name="WatchmanLogin" component={WatchmanLoginScreen} />
        <Stack.Screen name="YearInchargeLogin" component={YearInchargeLoginScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
    </Stack.Navigator>
);

export default AuthStack;
