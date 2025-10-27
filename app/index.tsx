import { cyberpunkTheme } from '@/constants/theme';
import Button from '@/src/ui/components/NeonButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={cyberpunkTheme.backgroundGradient}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>QUANTUM CLEANER</Text>
        <Text style={styles.subtitle}>PURE ENERGY • SPEAKER RESTORATION</Text>
        <View style={styles.buttons}>
          <Link href="/diagnose" asChild>
            <Button label="Smart Diagnostic" variant="accent" onPress={() => {}} />
          </Link>
          <Link href="/auto" asChild>
            <Button label="Auto Mode" variant="primary" onPress={() => {}} />
          </Link>
          <Link href="/manual" asChild>
            <Button label="Manual Mode" variant="secondary" onPress={() => {}} />
          </Link>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: cyberpunkTheme.textNeon,
    letterSpacing: 2,
    textShadowColor: cyberpunkTheme.glowSoft,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: cyberpunkTheme.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 32,
  },
  buttons: {
    gap: 20,
    width: '85%',
    maxWidth: 400,
  },
});


