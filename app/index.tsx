import { Link } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speaker Cleaner</Text>
      <View style={styles.buttons}>
        <Link href="/auto" style={styles.button}>
          <Text style={styles.buttonText}>Auto Clean</Text>
        </Link>
        <Link href="/manual" style={styles.button}>
          <Text style={styles.buttonText}>Manual</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  buttons: {
    gap: 16,
    width: '80%',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});


