import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import YearInchargeDashboardScreen from '../screens/year-incharge/YearInchargeDashboardScreen';
import YearInchargeProfileScreen from '../screens/year-incharge/YearInchargeProfileScreen';
import YIOutpassListScreen from '../screens/year-incharge/YIOutpassListScreen';
import YIPendingOutpassScreen from '../screens/year-incharge/YIPendingOutpassScreen';
import YIStudentViewScreen from '../screens/year-incharge/YIStudentViewScreen';

const Stack = createStackNavigator();

const YearInchargeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="YearInchargeDashboard" component={YearInchargeDashboardScreen} />
        <Stack.Screen name="YearInchargeProfile" component={YearInchargeProfileScreen} />
        <Stack.Screen name="YIOutpassList" component={YIOutpassListScreen} />
        <Stack.Screen name="YIPendingOutpass" component={YIPendingOutpassScreen} />
        <Stack.Screen name="YIStudentView" component={YIStudentViewScreen} />
    </Stack.Navigator>
);

export default YearInchargeStack;
