import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/config';

import StaffDashboardScreen from '../screens/staff/StaffDashboardScreen';
import StaffProfileScreen from '../screens/staff/StaffProfileScreen';
import StaffNoticesScreen from '../screens/staff/StaffNoticesScreen';
import PassApprovalScreen from '../screens/staff/PassApprovalScreen';
import StudentDetailsScreen from '../screens/staff/StudentDetailsScreen';
import StudentRegistrationScreen from '../screens/staff/StudentRegistrationScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ApprovalStack = createStackNavigator();
const StudentStackNav = createStackNavigator();
const ProfileStackNav = createStackNavigator();

const HomeStackNav = () => (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
    </HomeStack.Navigator>
);

const ApprovalStackNav = () => (
    <ApprovalStack.Navigator screenOptions={{ headerShown: false }}>
        <ApprovalStack.Screen name="PassApproval" component={PassApprovalScreen} />
    </ApprovalStack.Navigator>
);

const StudentStackNavigation = () => (
    <StudentStackNav.Navigator screenOptions={{ headerShown: false }}>
        <StudentStackNav.Screen name="StudentDetails" component={StudentDetailsScreen} />
        <StudentStackNav.Screen name="StudentRegistration" component={StudentRegistrationScreen} />
    </StudentStackNav.Navigator>
);

const ProfileStackNavigation = () => (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
        <ProfileStackNav.Screen name="StaffProfile" component={StaffProfileScreen} />
        <ProfileStackNav.Screen name="StaffNotices" component={StaffNoticesScreen} />
    </ProfileStackNav.Navigator>
);

const StaffStack = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: '#64748b',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e2e8f0',
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
                        HomeTab: '🏠 Home',
                        ApprovalTab: '✅ Approvals',
                        StudentTab: '🎓 Students',
                        ProfileTab: '👤 Profile',
                    };
                    return <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{labels[route.name] || route.name}</Text>;
                },
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeStackNav} />
            <Tab.Screen name="ApprovalTab" component={ApprovalStackNav} />
            <Tab.Screen name="StudentTab" component={StudentStackNavigation} />
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigation} />
        </Tab.Navigator>
    );
};

export default StaffStack;
