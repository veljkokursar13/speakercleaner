import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cyberpunkTheme } from '../../constants/theme';
import { QuantumTheme } from '../../src/theme/styles';
import ProgressBar from '../../src/components/ProgressBar';
import VisualizerManager from '../../src/components/visualizer/VisualizerManager';
import type { CleaningTechnique } from '../../src/modes/auto/types';
import { useAutoMode } from '../../src/modes/auto/useAutoMode';
import Button from '../../src/ui/components/NeonButton';

const { colors } = QuantumTheme;
const primaryColors = [colors.neonCyan, colors.neonMagenta];
const secondaryColors = [colors.neonAmber, colors.neonCyan];
const accentColors = [colors.neonMagenta, colors.neonAmber];

export default function AutoMode() {
  const {
    progress,
    technique,
    visualizerMode,
    isRunning,
    setTechnique,
    startCleaning,
    stop,
  } = useAutoMode();

  const techniques: { id: CleaningTechnique; label: string }[] = [
    { id: 'water', label: 'Water' },
    { id: 'dust', label: 'Dust' },
    { id: 'sand', label: 'Sand' },
    { id: 'auto', label: 'Auto' },
  ];

  return (
    <LinearGradient colors={cyberpunkTheme.backgroundGradient} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>AUTO CLEAN MODE</Text>
        <Text style={styles.subtitle}>Select cleaning technique</Text>

        <VisualizerManager mode={visualizerMode} isActive={isRunning} />

        <View style={styles.techniqueRow}>
          {techniques.map((t) => (
            <Button
              key={t.id}
              title={t.label}
              colors={technique === t.id ? accentColors : secondaryColors}
              onPress={() => setTechnique(t.id)}
            />
          ))}
        </View>

        <ProgressBar progress={progress} />

        <View style={styles.controlRow}>
          <Button
            title={isRunning ? 'Running...' : 'Start Cleaning'}
            onPress={startCleaning}
            colors={primaryColors}
          />
          <Button title="Stop" colors={secondaryColors} onPress={stop} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: cyberpunkTheme.textNeon,
    letterSpacing: 2,
    textShadowColor: cyberpunkTheme.glowSoft,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: cyberpunkTheme.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  techniqueRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
});

