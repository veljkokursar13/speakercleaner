import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { QuantumTheme } from '../src/theme/styles';
import Button from '../src/ui/components/NeonButton';
import { Subtitle, Title } from '../src/ui/components/Typography';

const { colors } = QuantumTheme;
const primaryColors = [colors.neonCyan, colors.neonMagenta];
const secondaryColors = [colors.neonAmber, colors.neonCyan];
const accentColors = [colors.neonMagenta, colors.neonAmber];

export default function HomeScreen() {
  return (
      <View style={styles.container}>
        <Title style={styles.title}>QUANTUM CLEANER</Title>
        <Subtitle style={styles.subtitle}>PURE ENERGY • SPEAKER RESTORATION</Subtitle>
        <View style={styles.buttons}>
          <Button title="Manual Mode" colors={secondaryColors} onPress={() => router.push('/screens/ManualMode')} />
          <Button title="Auto Mode" colors={primaryColors} onPress={() => router.push('/screens/AutoMode')} />
          <Button title="Smart Diagnostic" colors={accentColors} onPress={() => router.push('/screens/SmartDiagnosis')} />
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    letterSpacing: 2,
    textShadowColor: colors.neonCyan,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: 8,
  },
  subtitle: {
    letterSpacing: 1.5,
    marginBottom: 32,
  },
  buttons: {
    gap: 20,
    width: '85%',
    maxWidth: 400,
  },
});