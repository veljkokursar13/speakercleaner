import { useAudioVisualizer } from '@/src/hooks/useAudioVisualizer';
import { BlurMask, Canvas, LinearGradient, Paint, Path, Skia, useClockValue, useComputedValue, vec } from '@shopify/react-native-skia';
import React from 'react';

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
  const clock = useClockValue();
  const { frequencyData } = useAudioVisualizer(isActive);
  const amplitude = frequencyData.length > 0 
    ? frequencyData.reduce((a, b) => a + b) / frequencyData.length 
    : 0;

  const path = useComputedValue(() => {
    const p = Skia.Path.Make();

    const ampPx = Math.max(4, Math.min(1, amplitude) * (height / 2 - 8));
    const step = 4; // px per sample
    const t = (clock.current ?? 0) / 1000; // seconds
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