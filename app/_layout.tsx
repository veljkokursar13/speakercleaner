import { Stack } from 'expo-router';
import React from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import QuantumBackground from './components/QuantumBackround';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QuantumBackground>
          <Stack>
            <Stack.Screen options={{ 
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'slide_from_right',
            }} />
          </Stack>
        </QuantumBackground>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}