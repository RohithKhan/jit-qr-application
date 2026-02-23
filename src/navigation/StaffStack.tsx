import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import StaffDashboardScreen from '../screens/staff/StaffDashboardScreen';
import StaffProfileScreen from '../screens/staff/StaffProfileScreen';
import StaffNoticesScreen from '../screens/staff/StaffNoticesScreen';
import PassApprovalScreen from '../screens/staff/PassApprovalScreen';
import StudentDetailsScreen from '../screens/staff/StudentDetailsScreen';
import StudentRegistrationScreen from '../screens/staff/StudentRegistrationScreen';

const Stack = createStackNavigator();

const StaffStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
        <Stack.Screen name="StaffProfile" component={StaffProfileScreen} />
        <Stack.Screen name="StaffNotices" component={StaffNoticesScreen} />
        <Stack.Screen name="PassApproval" component={PassApprovalScreen} />
        <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} />
        <Stack.Screen name="StudentRegistration" component={StudentRegistrationScreen} />
    </Stack.Navigator>
);

export default StaffStack;
