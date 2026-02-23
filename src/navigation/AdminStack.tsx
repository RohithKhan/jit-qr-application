import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import ManageStaffScreen from '../screens/admin/ManageStaffScreen';
import ManageWardenScreen from '../screens/admin/ManageWardenScreen';
import ManageYearInchargeScreen from '../screens/admin/ManageYearInchargeScreen';
import ManageSecurityScreen from '../screens/admin/ManageSecurityScreen';
import ManageBusScreen from '../screens/admin/ManageBusScreen';
import OutpassAdminScreen from '../screens/admin/OutpassAdminScreen';
import AdminStudentViewScreen from '../screens/admin/AdminStudentViewScreen';
import StudentRegistrationScreen from '../screens/staff/StudentRegistrationScreen';

const Stack = createStackNavigator();

const AdminStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
        <Stack.Screen name="ManageStudents" component={AdminStudentViewScreen} />
        <Stack.Screen name="StudentRegistration" component={StudentRegistrationScreen} />
        <Stack.Screen name="ManageStaff" component={ManageStaffScreen} />
        <Stack.Screen name="ManageWarden" component={ManageWardenScreen} />
        <Stack.Screen name="ManageYearIncharge" component={ManageYearInchargeScreen} />
        <Stack.Screen name="ManageSecurity" component={ManageSecurityScreen} />
        <Stack.Screen name="ManageBus" component={ManageBusScreen} />
        <Stack.Screen name="OutpassAdmin" component={OutpassAdminScreen} />
    </Stack.Navigator>
);

export default AdminStack;
