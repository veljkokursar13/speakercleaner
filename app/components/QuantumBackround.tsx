import { BlurMask, Canvas, Circle, Group, useComputedValue, useLoop } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode, useEffect } from 'react';
import { Image, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeProvider';
interface QuantumBackgroundProps {
  children?: ReactNode;
}

export default function QuantumBackground({ children }: QuantumBackgroundProps) {
  const theme = useTheme();
  const quantumFlow = [...theme.gradients.quantumFlow] as [string, string, ...string[]];
  const progress = useSharedValue(0);
  const { width, height } = useWindowDimensions();

  // Skia-driven animation via loop value (0..1)
  const t = useLoop({ duration: 12000 });

useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, [progress]);

const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.8 + (progress.value * 0.2),
    };
});

  // Smooth parametric motion for 3 blobs (Skia values)
  const cx1 = useComputedValue(() => width * 0.5 + Math.sin(t.current * 2 * Math.PI * 0.35) * width * 0.30, [t]);
  const cy1 = useComputedValue(() => height * 0.45 + Math.cos(t.current * 2 * Math.PI * 0.40) * height * 0.20, [t]);
  const r1 = width * 0.48;

  const cx2 = useComputedValue(() => width * 0.55 + Math.cos(t.current * 2 * Math.PI * 0.28) * width * 0.25, [t]);
  const cy2 = useComputedValue(() => height * 0.35 + Math.sin(t.current * 2 * Math.PI * 0.32) * height * 0.22, [t]);
  const r2 = width * 0.38;

  const cx3 = useComputedValue(() => width * 0.45 + Math.sin(t.current * 2 * Math.PI * 0.22 + Math.PI / 3) * width * 0.35, [t]);
  const cy3 = useComputedValue(() => height * 0.55 + Math.cos(t.current * 2 * Math.PI * 0.26 + Math.PI / 4) * height * 0.28, [t]);
  const r3 = width * 0.62;

return (
    <View style={styles.container}>
      <LinearGradient
        colors={quantumFlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Grain overlay */}
      {theme.background.image && (
        <Image
          source={theme.background.image}
          resizeMode={Platform.OS === 'ios' ? 'repeat' : 'cover'}
          style={[StyleSheet.absoluteFill, { opacity: theme.background.opacity }]}
        />
      )}
      {/* Skia blurred additive blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Use additive-like blending; 'screen' is a pleasant mixing mode */}
          <Group blendMode="screen">
            <Circle cx={cx1} cy={cy1} r={r1} color={theme.colors.neonAmber + '80'}>
              <BlurMask blur={Platform.select({ ios: 50, android: 36, default: 44 }) as number} style="normal" />
            </Circle>
            <Circle cx={cx2} cy={cy2} r={r2} color={theme.colors.bgAccent + '80'}>
              <BlurMask blur={Platform.select({ ios: 50, android: 36, default: 44 }) as number} style="normal" />
            </Circle>
            <Circle cx={cx3} cy={cy3} r={r3} color={theme.colors.neonAmber + '66'}>
              <BlurMask blur={Platform.select({ ios: 60, android: 42, default: 52 }) as number} style="normal" />
            </Circle>
          </Group>
        </Canvas>
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} />
      {children}
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    
    
  },
});