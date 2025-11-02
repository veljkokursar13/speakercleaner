import { useFonts } from 'expo-font';

/**
 * Hook to load app fonts.
 * Returns { loaded, error } so screens can wait for fonts if needed.
 */
export function useFont() {
  const [loaded, error] = useFonts({
    // canonical names
    Orbitron: require('../../assets/fonts/Orbitron-Bold.ttf'),
    ExpoTwoLight: require('../../assets/fonts/Expo2-Light.ttf'),
    Rajdhani: require('../../assets/fonts/Rajdhani-SemiBold.ttf'),
    // theme aliases to match QuantumTheme fontFamily values
    'Orbitron-Bold': require('../../assets/fonts/Orbitron-Bold.ttf'),
    'Exo2-Light': require('../../assets/fonts/Expo2-Light.ttf'),
    'Rajdhani-Regular': require('../../assets/fonts/Rajdhani-SemiBold.ttf'),
  });

  return { loaded, error };
}
