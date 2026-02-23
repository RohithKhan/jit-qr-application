import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/services/api';

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <RootNavigator />
      <Toast />
    </NavigationContainer>
  );
}
