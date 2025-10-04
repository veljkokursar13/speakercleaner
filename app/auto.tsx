import { View, Text, StyleSheet } from 'react-native';
import ProgressBar from '@/src/components/ProgressBar';
import Animation from '@/src/components/Animation';
import { useCleaner } from '@/src/hooks/useCleaner';
import Button from '@/src/components/Button';

export default function AutoScreen() {
  const { status, progress, start, stop } = useCleaner();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auto Clean</Text>
      <Animation />
      <ProgressBar progress={progress} />
      <View style={styles.row}>
        <Button label={status === 'running' ? 'Running' : 'Start'} onPress={start} disabled={status==='running'} />
        <Button label="Stop" variant="secondary" onPress={stop} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
});


