import { StyleSheet, Text, View } from 'react-native';
import PremiumGate from './PremiumGate';

export default function CleanerScreen() {
  return (
    <PremiumGate>
      <View style={styles.container}>
        <Text style={styles.title}>Cleaner</Text>
        <Text>Coming soon...</Text>
      </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
});


