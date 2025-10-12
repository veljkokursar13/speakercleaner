import FrequencySlider from '@/src/components/FrequencySlider';
import Button from '@/src/ui/components/Button';
import { StyleSheet, Text, View } from 'react-native';

export default function ManualScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Cleaning</Text>
      <FrequencySlider min={100} max={20000} value={950} onChange={() => {}} />
      <View style={styles.row}>
        <Button label="Play" onPress={() => {}} />
        <Button label="Stop" variant="secondary" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
});


