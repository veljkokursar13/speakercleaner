import { View, StyleSheet } from 'react-native';

type Props = { progress: number };

export default function ProgressBar({ progress }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, backgroundColor: '#e5e7eb', borderRadius: 9999, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#10b981' },
});


