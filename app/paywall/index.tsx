import { StyleSheet, Text, View } from 'react-native';

export default function PaywallScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paywall</Text>
      <Text>Purchase options coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
});


