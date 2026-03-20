import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/config';

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
import { 
    WardenDetailsAdminScreen, 
    YearInchargeDetailsAdminScreen, SecurityDetailsAdminScreen, 
    BusDetailsAdminScreen 
} from '../screens/admin/AdminUserDetailScreen';

import AdminStaffDetailsScreen from '../screens/admin/AdminStaffDetailsScreen';
import AdminStudentDetailsScreen from '../screens/admin/AdminStudentDetailsScreen';
import AdminStaffStudentListScreen from '../screens/admin/AdminStaffStudentListScreen';

const Tab = createBottomTabNavigator();
const DashStack = createStackNavigator();
const OutpassStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const DashboardStackNav = () => (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
        <DashStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <DashStack.Screen name="ManageStudents" component={AdminStudentViewScreen} />
        <DashStack.Screen name="StudentRegistration" component={StudentRegistrationScreen} />
        <DashStack.Screen name="ManageStaff" component={ManageStaffScreen} />
        <DashStack.Screen name="ManageWarden" component={ManageWardenScreen} />
        <DashStack.Screen name="ManageYearIncharge" component={ManageYearInchargeScreen} />
        <DashStack.Screen name="ManageSecurity" component={ManageSecurityScreen} />
        <DashStack.Screen name="ManageBus" component={ManageBusScreen} />
        {/* Detail Screens */}
        <DashStack.Screen name="WardenDetailsAdmin" component={WardenDetailsAdminScreen} />
        <DashStack.Screen name="StaffDetailsAdmin" component={AdminStaffDetailsScreen} />
        <DashStack.Screen name="YearInchargeDetailsAdmin" component={YearInchargeDetailsAdminScreen} />
        <DashStack.Screen name="SecurityDetailsAdmin" component={SecurityDetailsAdminScreen} />
        <DashStack.Screen name="BusDetailsAdmin" component={BusDetailsAdminScreen} />
        <DashStack.Screen name="AdminStudentDetailsScreen" component={AdminStudentDetailsScreen} />
        <DashStack.Screen name="AdminStaffStudentListScreen" component={AdminStaffStudentListScreen} />
    </DashStack.Navigator>
);

const OutpassStackNav = () => (
    <OutpassStack.Navigator screenOptions={{ headerShown: false }}>
        <OutpassStack.Screen name="OutpassAdmin" component={OutpassAdminScreen} />
    </OutpassStack.Navigator>
);

const ProfileStackNav = () => (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
        <ProfileStack.Screen name="AdminProfile" component={AdminProfileScreen} />
    </ProfileStack.Navigator>
);

const AdminStack = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.border,
                    height: Platform.OS === 'ios' ? 60 + insets.bottom : 65,
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
                    paddingTop: 8,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    borderTopWidth: 1,
                },
                tabBarLabel: ({ color }) => {
                    const labels: Record<string, string> = {
                        AdminHome: '🏠 Home',
                        AdminOutpasses: '📝 Outpasses',
                        AdminProfileTab: '👤 Profile',
                    };
                    return <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{labels[route.name] || route.name}</Text>;
                },
            })}
        >
            <Tab.Screen name="AdminHome" component={DashboardStackNav} />
            <Tab.Screen name="AdminOutpasses" component={OutpassStackNav} />
            <Tab.Screen name="AdminProfileTab" component={ProfileStackNav} />
        </Tab.Navigator>
    );
};

export default AdminStack;
