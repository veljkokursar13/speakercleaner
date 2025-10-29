import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';



export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'PureMic' }} />
        <Stack.Screen name="diagnose" options={{ headerShown: false, title: 'Diagnostic Scan' }} />
        <Stack.Screen name="manual" options={{ headerShown: false, title: 'Manual Mode' }} />
        <Stack.Screen name="auto" options={{ headerShown: false, title: 'Auto Clean' }} />
      </Stack>
      <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
