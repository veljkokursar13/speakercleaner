import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: true, title: 'Quantum Cleaner' }} />
        <Stack.Screen name="diagnose" options={{ title: 'Diagnostic Scan' }} />
        <Stack.Screen name="manual" options={{ title: 'Manual Mode' }} />
        <Stack.Screen name="auto" options={{ title: 'Auto Clean' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
