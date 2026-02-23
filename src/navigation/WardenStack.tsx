import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WardenDashboardScreen from '../screens/warden/WardenDashboardScreen';
import WardenProfileScreen from '../screens/warden/WardenProfileScreen';
import PendingOutpassScreen from '../screens/warden/PendingOutpassScreen';
import OutpassListScreen from '../screens/warden/OutpassListScreen';
import WardenStudentViewScreen from '../screens/warden/WardenStudentViewScreen';

const Stack = createStackNavigator();

const WardenStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WardenDashboard" component={WardenDashboardScreen} />
        <Stack.Screen name="WardenProfile" component={WardenProfileScreen} />
        <Stack.Screen name="PendingOutpass" component={PendingOutpassScreen} />
        <Stack.Screen name="OutpassList" component={OutpassListScreen} />
        <Stack.Screen name="WardenStudentView" component={WardenStudentViewScreen} />
    </Stack.Navigator>
);

export default WardenStack;
