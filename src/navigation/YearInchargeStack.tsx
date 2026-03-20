import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/config';

import YearInchargeDashboardScreen from '../screens/year-incharge/YearInchargeDashboardScreen';
import YearInchargeProfileScreen from '../screens/year-incharge/YearInchargeProfileScreen';
import YIOutpassListScreen from '../screens/year-incharge/YIOutpassListScreen';
import YIPendingOutpassScreen from '../screens/year-incharge/YIPendingOutpassScreen';
import YIStudentViewScreen from '../screens/year-incharge/YIStudentViewScreen';

const Tab = createBottomTabNavigator();
const DashStack = createStackNavigator();
const PendingStack = createStackNavigator();
const HistoryStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const DashboardStackNav = () => (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
        <DashStack.Screen name="YearInchargeDashboard" component={YearInchargeDashboardScreen} />
        <DashStack.Screen name="YIStudentView" component={YIStudentViewScreen} />
    </DashStack.Navigator>
);

const PendingStackNav = () => (
    <PendingStack.Navigator screenOptions={{ headerShown: false }}>
        <PendingStack.Screen name="YIPendingOutpass" component={YIPendingOutpassScreen} />
        <PendingStack.Screen name="YIStudentView" component={YIStudentViewScreen} />
    </PendingStack.Navigator>
);

const HistoryStackNav = () => (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
        <HistoryStack.Screen name="YIOutpassList" component={YIOutpassListScreen} />
        <HistoryStack.Screen name="YIStudentView" component={YIStudentViewScreen} />
    </HistoryStack.Navigator>
);

const ProfileStackNav = () => (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
        <ProfileStack.Screen name="YearInchargeProfile" component={YearInchargeProfileScreen} />
    </ProfileStack.Navigator>
);

const YearInchargeStack = () => {
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
                        YIHome: '🏠 Home',
                        YIPending: '📝 Pending',
                        YIHistory: '📜 History',
                        YIProfileTab: '👤 Profile',
                    };
                    return <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{labels[route.name] || route.name}</Text>;
                },
            })}
        >
            <Tab.Screen name="YIHome" component={DashboardStackNav} />
            <Tab.Screen name="YIPending" component={PendingStackNav} />
            <Tab.Screen name="YIHistory" component={HistoryStackNav} />
            <Tab.Screen name="YIProfileTab" component={ProfileStackNav} />
        </Tab.Navigator>
    );
};

export default YearInchargeStack;
