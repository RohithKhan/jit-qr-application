import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { COLORS } from '../constants/config';

import DashboardScreen from '../screens/student/DashboardScreen';
import SubjectsScreen from '../screens/student/SubjectsScreen';
import SubjectDetailsScreen from '../screens/student/SubjectDetailsScreen';
import OutpassScreen from '../screens/student/OutpassScreen';
import NewOutpassScreen from '../screens/student/NewOutpassScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import StaffsScreen from '../screens/student/StaffsScreen';
import StudentViewStaffProfileScreen from '../screens/student/StudentViewStaffProfileScreen';
import NoticesScreen from '../screens/student/NoticesScreen';

const Tab = createBottomTabNavigator();
const DashStack = createStackNavigator();
const SubjectStack = createStackNavigator();
const OutpassStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const DashboardStackNav = () => (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
        <DashStack.Screen name="Dashboard" component={DashboardScreen} />
        <DashStack.Screen name="Staffs" component={StaffsScreen} />
        <DashStack.Screen name="StaffProfile" component={StudentViewStaffProfileScreen} />
    </DashStack.Navigator>
);

const SubjectsStackNav = () => (
    <SubjectStack.Navigator screenOptions={{ headerShown: false }}>
        <SubjectStack.Screen name="Subjects" component={SubjectsScreen} />
        <SubjectStack.Screen name="SubjectDetails" component={SubjectDetailsScreen} />
    </SubjectStack.Navigator>
);

const OutpassStackNav = () => (
    <OutpassStack.Navigator screenOptions={{ headerShown: false }}>
        <OutpassStack.Screen name="Outpass" component={OutpassScreen} />
        <OutpassStack.Screen name="NewOutpass" component={NewOutpassScreen} />
    </OutpassStack.Navigator>
);

const ProfileStackNav = () => (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
        <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
);

const StudentStack = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.border },
            tabBarLabel: ({ color }) => {
                const labels: Record<string, string> = {
                    HomeTab: '🏠 Home',
                    SubjectsTab: '📚 Subjects',
                    OutpassTab: '📝 Outpass',
                    ProfileTab: '👤 Profile',
                };
                return <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{labels[route.name] || route.name}</Text>;
            },
        })}
    >
        <Tab.Screen name="HomeTab" component={DashboardStackNav} />
        <Tab.Screen name="SubjectsTab" component={SubjectsStackNav} />
        <Tab.Screen name="OutpassTab" component={OutpassStackNav} />
        <Tab.Screen name="ProfileTab" component={ProfileStackNav} />
    </Tab.Navigator>
);

export default StudentStack;
