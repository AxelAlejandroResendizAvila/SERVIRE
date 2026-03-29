import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { BadgeProvider } from './src/context/BadgeContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BadgeProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </BadgeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
