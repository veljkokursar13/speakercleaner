import React from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { cyberpunkTheme } from '../../constants/theme';
import { useManualMode } from '../../src/modes/manual/useManualMode';
import { QuantumTheme } from '../../src/theme/styles';
import Button from '../../src/ui/components/NeonButton';
import { Subtitle, Title } from '../../src/ui/components/Typography';
import Slider from '../components/Slider';

export default function ManualMode() {
  const { frequency, isPlaying, setManualFrequency, playManualTone, stopManualTone } = useManualMode();

  const handleScreenPress = () => {
    Keyboard.dismiss();
    // Ensure frequency is clamped to valid range
    if (setManualFrequency && typeof setManualFrequency === 'function') {
      const clampedFreq = Math.min(Math.max(100, frequency), 40000);
      setManualFrequency(clampedFreq);
    }
  };

  const handleFrequencyChange = (value: number) => {
    if (setManualFrequency && typeof setManualFrequency === 'function') {
      setManualFrequency(value);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleScreenPress}>
      <View style={styles.container}>
        <Title style={styles.title}>Manual Cleaning</Title>
        <Subtitle style={styles.subtitle}>Set frequency and play custom tone</Subtitle>
        <View style={styles.frequencySlider}>
          <Slider
            min={100}
            max={40000}
            step={100}
            value={frequency}
            onChange={handleFrequencyChange}
          />
        </View>
        <View style={styles.controls}>
          <Button
            title={isPlaying ? 'Playing...' : 'Play Tone'}
            onPress={playManualTone}
            colors={[QuantumTheme.colors.neonCyan, QuantumTheme.colors.neonMagenta]}
          />
          <Button
            title="Stop"
            onPress={stopManualTone}
            colors={[QuantumTheme.colors.neonAmber, QuantumTheme.colors.neonCyan]}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
    backgroundColor: cyberpunkTheme.background,
  },
  title: {
    letterSpacing: 2,
  },
  subtitle: {
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  frequencySlider: {
    width: '100%',
    paddingVertical: 8,
  },
});

