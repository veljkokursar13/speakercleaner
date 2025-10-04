import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
};

export default function FrequencySlider({ min, max, value }: Props) {
  const label = useMemo(() => `${Math.round(value)} Hz`, [value]);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Frequency: {label}</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontWeight: '600' },
  placeholder: { height: 36, borderRadius: 8, backgroundColor: '#f3f4f6' },
});


