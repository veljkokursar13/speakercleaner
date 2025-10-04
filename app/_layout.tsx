import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: true, title: 'Speaker Cleaner' }} />
        <Stack.Screen name="manual" options={{ title: 'Manual' }} />
        <Stack.Screen name="auto" options={{ title: 'Auto Clean' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
