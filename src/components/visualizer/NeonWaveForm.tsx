import { BlurMask, Canvas, LinearGradient, Paint, Path, Skia, vec } from '@shopify/react-native-skia';
import React from 'react';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';

type Props = {
  isActive?: boolean;
  width?: number;
  height?: number;
  cycles?: number; // number of sine cycles across the width
  strokeWidth?: number;
  colors?: string[];
};

export default function NeonWaveForm({
  isActive = false,
  width = 300,
  height = 120,
  cycles = 2,
  strokeWidth = 3,
  colors = ['#00FFA3', '#00B2FF', '#A78BFA'], // Cyberpunk neon colors
}: Props) {
  const clock = useSharedValue(0);
  const { frequencyData } = useAudioVisualizer(isActive);
  const amplitude = frequencyData.length > 0 
    ? frequencyData.reduce((a, b) => a + b) / frequencyData.length 
    : 0;

  // Animate clock when active
  React.useEffect(() => {
    if (!isActive) {
      clock.value = 0;
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      clock.value = elapsed;
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isActive, clock]);

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();

    const ampPx = Math.max(4, Math.min(1, amplitude) * (height / 2 - 8));
    const step = 4; // px per sample
    const t = (clock.value ?? 0) / 1000; // seconds
    const speed = 2.0; // radians/sec

    p.moveTo(0, height / 2);

    for (let x = 0; x <= width; x += step) {
      const phase = (x / width) * (Math.PI * 2) * cycles + t * speed;
      const y = height / 2 + Math.sin(phase) * ampPx;
      p.lineTo(x, y);
    }

    return p;
  }, [clock, amplitude, width, height, cycles]);

  return (
    <Canvas style={{ width, height }}>
      <Path path={path} style="stroke" strokeWidth={strokeWidth} strokeJoin="round" strokeCap="round">
        <Paint>
          <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={colors} />
        </Paint>
        <BlurMask blur={4} style="outer" />
      </Path>
      {/* Subtle secondary glow */}
      <Path path={path} style="stroke" strokeWidth={strokeWidth + 2} opacity={0.15} color="#60a5fa" />
    </Canvas>
  );
}