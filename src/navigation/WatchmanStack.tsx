import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WatchmanDashboardScreen from '../screens/watchman/WatchmanDashboardScreen';
import WatchmanProfileScreen from '../screens/watchman/WatchmanProfileScreen';
import WatchmanOutpassListScreen from '../screens/watchman/WatchmanOutpassListScreen';
import WatchmanStudentViewScreen from '../screens/watchman/WatchmanStudentViewScreen';

const Stack = createStackNavigator();

const WatchmanStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WatchmanDashboard" component={WatchmanDashboardScreen} />
        <Stack.Screen name="WatchmanProfile" component={WatchmanProfileScreen} />
        <Stack.Screen name="WatchmanOutpassList" component={WatchmanOutpassListScreen} />
        <Stack.Screen name="WatchmanStudentView" component={WatchmanStudentViewScreen} />
    </Stack.Navigator>
);

export default WatchmanStack;
