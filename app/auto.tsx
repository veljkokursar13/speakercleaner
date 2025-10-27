import { cyberpunkTheme } from '@/constants/theme';
import ProgressBar from '@/src/components/ProgressBar';
import VisualizerManager from '@/src/components/visualizer/VisualizerManager';
import { useCleaner } from '@/src/hooks/useCleaner';
import Button from '@/src/ui/components/NeonButton';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

export default function AutoScreen() {
  const { status, progress, start, stop } = useCleaner();

  return (
    <LinearGradient colors={cyberpunkTheme.backgroundGradient} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>AUTO CLEAN MODE</Text>
        <VisualizerManager mode="pulse" isActive={status === 'running'} />
        <ProgressBar progress={progress} />
        <View style={styles.row}>
          <Button 
            label={status === 'running' ? 'Running' : 'Start'} 
            onPress={start} 
            disabled={status === 'running'} 
            variant="primary"
          />
          <Button label="Stop" variant="secondary" onPress={stop} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 16, alignItems: 'center' },
  title: { 
    fontSize: 24, 
    fontWeight: '700',
    color: cyberpunkTheme.textNeon,
    letterSpacing: 2,
    textShadowColor: cyberpunkTheme.glowSoft,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  row: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'center' },
});


