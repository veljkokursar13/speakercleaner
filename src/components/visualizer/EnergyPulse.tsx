import { useAudioVisualizer } from '@/src/hooks/useAudioVisualizer';
import { BlurMask, Canvas, Circle, Group, LinearGradient, Paint, useClockValue, useComputedValue, vec } from '@shopify/react-native-skia';
import React from 'react';

type Props = {
  isActive?: boolean;
  width?: number;
  height?: number;
  ringCount?: number;
  strokeWidth?: number;
  colors?: string[];
  speed?: number; // pulse speed multiplier
};

type Ring = { r: number; opacity: number };

export default function EnergyPulse({
  isActive = false,
  width = 240,
  height = 180,
  ringCount = 5,
  strokeWidth = 3,
  colors = ['#00FFA3', '#FFD600'], // Acid green to gold
  speed = 2.5,
}: Props) {
  const clock = useClockValue();
  const { frequencyData } = useAudioVisualizer(isActive);
  const amplitude = frequencyData.length > 0 
    ? frequencyData.reduce((a, b) => a + b) / frequencyData.length 
    : 0;
  const cx = width / 2;
  const cy = height / 2;

  const rings = useComputedValue(() => {
    const t = (clock.current ?? 0) / 1000;
    const base = 18 + amplitude * 28; // base inner radius
    const gap = 12 + amplitude * 10; // distance between rings
    const pulse = 6 + amplitude * 10; // pulsation amplitude

    const arr: Ring[] = [];
    for (let i = 0; i < ringCount; i++) {
      const phase = t * speed + i * 0.6; // stagger phases by ring index
      const r = base + i * gap + Math.sin(phase) * pulse;
      const opacity = Math.max(0.25, 0.85 - i * (0.6 / ringCount)) * (0.7 + amplitude * 0.3);
      arr.push({ r, opacity });
    }
    return arr;
  }, [clock, amplitude, ringCount, speed]);

  const ringData = rings.current as Ring[];

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {ringData.map((ring, i) => (
          <Circle key={i} cx={cx} cy={cy} r={ring.r} style="stroke" strokeWidth={strokeWidth} opacity={ring.opacity}>
            <Paint>
              <LinearGradient start={vec(cx - ring.r, cy - ring.r)} end={vec(cx + ring.r, cy + ring.r)} colors={colors} />
            </Paint>
            <BlurMask blur={6} style="outer" />
          </Circle>
        ))}
      </Group>
    </Canvas>
  );
}