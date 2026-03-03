import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WardenDashboardScreen from '../screens/warden/WardenDashboardScreen';
import { WardenProfileScreen } from '../screens/warden/WardenProfileScreen';
import { WardenPendingOutpassScreen } from '../screens/warden/PendingOutpassScreen';
import { WardenOutpassListScreen } from '../screens/warden/OutpassListScreen';
import { WardenStudentViewScreen } from '../screens/warden/WardenStudentViewScreen';

const Stack = createStackNavigator();

const WardenStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WardenDashboard" component={WardenDashboardScreen} />
        <Stack.Screen name="WardenProfile" component={WardenProfileScreen} />
        <Stack.Screen name="PendingOutpass" component={WardenPendingOutpassScreen} />
        <Stack.Screen name="OutpassList" component={WardenOutpassListScreen} />
        <Stack.Screen name="WardenStudentView" component={WardenStudentViewScreen} />
    </Stack.Navigator>
);

export default WardenStack;
