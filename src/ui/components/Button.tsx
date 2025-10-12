import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export default function Button({ label, onPress, disabled, variant = 'primary' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, variant === 'secondary' ? styles.secondary : styles.primary, disabled && styles.disabled]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#6b7280' },
  disabled: { opacity: 0.6 },
  text: { color: 'white', fontWeight: '600' },
});



