import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/config';

import WardenDashboardScreen from '../screens/warden/WardenDashboardScreen';
import { WardenProfileScreen } from '../screens/warden/WardenProfileScreen';
import { WardenPendingOutpassScreen } from '../screens/warden/PendingOutpassScreen';
import { WardenOutpassListScreen } from '../screens/warden/OutpassListScreen';
import WardenStudentViewScreen from '../screens/warden/WardenStudentViewScreen';
import WardenEmergencyOutpassScreen from '../screens/warden/WardenEmergencyOutpassScreen';

const Tab = createBottomTabNavigator();
const DashStack = createStackNavigator();
const PendingStack = createStackNavigator();
const HistoryStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const DashboardStackNav = () => (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
        <DashStack.Screen name="WardenDashboard" component={WardenDashboardScreen} />
        <DashStack.Screen name="WardenStudentView" component={WardenStudentViewScreen} />
        <DashStack.Screen name="WardenEmergencyOutpass" component={WardenEmergencyOutpassScreen} />
    </DashStack.Navigator>
);

const PendingStackNav = () => (
    <PendingStack.Navigator screenOptions={{ headerShown: false }}>
        <PendingStack.Screen name="PendingOutpass" component={WardenPendingOutpassScreen} />
        <PendingStack.Screen name="WardenStudentView" component={WardenStudentViewScreen} />
        <PendingStack.Screen name="WardenOutpassDetail" component={WardenStudentViewScreen} />
    </PendingStack.Navigator>
);

const HistoryStackNav = () => (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
        <HistoryStack.Screen name="OutpassList" component={WardenOutpassListScreen} />
        <HistoryStack.Screen name="WardenStudentView" component={WardenStudentViewScreen} />
    </HistoryStack.Navigator>
);

const ProfileStackNav = () => (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
        <ProfileStack.Screen name="WardenProfile" component={WardenProfileScreen} />
    </ProfileStack.Navigator>
);

const WardenStack = () => {
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
                        WardenHome: '🏠 Home',
                        WardenPending: '📝 Pending',
                        WardenHistory: '📜 History',
                        WardenProfileTab: '👤 Profile',
                    };
                    return <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{labels[route.name] || route.name}</Text>;
                },
            })}
        >
            <Tab.Screen name="WardenHome" component={DashboardStackNav} />
            <Tab.Screen name="WardenPending" component={PendingStackNav} />
            <Tab.Screen name="WardenHistory" component={HistoryStackNav} />
            <Tab.Screen name="WardenProfileTab" component={ProfileStackNav} />
        </Tab.Navigator>
    );
};

export default WardenStack;
