import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function Animation() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 24 },
  circle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#bfdbfe' },
});


