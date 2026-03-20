import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/config';

import WatchmanDashboardScreen from '../screens/watchman/WatchmanDashboardScreen';
import WatchmanProfileScreen from '../screens/watchman/WatchmanProfileScreen';
import WatchmanOutpassListScreen from '../screens/watchman/WatchmanOutpassListScreen';
import WatchmanStudentViewScreen from '../screens/watchman/WatchmanStudentViewScreen';

const Tab = createBottomTabNavigator();
const DashStack = createStackNavigator();
const HistoryStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const DashboardStackNav = () => (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
        <DashStack.Screen name="WatchmanDashboard" component={WatchmanDashboardScreen} />
        <DashStack.Screen name="WatchmanStudentView" component={WatchmanStudentViewScreen} />
    </DashStack.Navigator>
);

const HistoryStackNav = () => (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
        <HistoryStack.Screen name="WatchmanOutpassList" component={WatchmanOutpassListScreen} />
        <HistoryStack.Screen name="WatchmanStudentView" component={WatchmanStudentViewScreen} />
    </HistoryStack.Navigator>
);

const ProfileStackNav = () => (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
        <ProfileStack.Screen name="WatchmanProfile" component={WatchmanProfileScreen} />
    </ProfileStack.Navigator>
);

const WatchmanStack = () => {
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
                        WatchmanHome: '🏠 Home',
                        WatchmanHistory: '📜 History',
                        WatchmanProfileTab: '👤 Profile',
                    };
                    return <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{labels[route.name] || route.name}</Text>;
                },
            })}
        >
            <Tab.Screen name="WatchmanHome" component={DashboardStackNav} />
            <Tab.Screen name="WatchmanHistory" component={HistoryStackNav} />
            <Tab.Screen name="WatchmanProfileTab" component={ProfileStackNav} />
        </Tab.Navigator>
    );
};

export default WatchmanStack;
