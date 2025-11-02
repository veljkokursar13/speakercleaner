// QuantumField visualizer (placeholder implementation)
// Uses Skia to render softly glowing particles with gentle motion
import { BlurMask, Canvas, Circle, Group, LinearGradient, Paint, vec } from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';

type Props = {
  isActive?: boolean;
  width?: number;
  height?: number;
  particleCount?: number;
  colors?: string[];
};

type Particle = {
  x0: number;
  y0: number;
  radius: number;
  speed: number;
  angle: number;
  drift: number;
};

type AnimatedParticle = { x: number; y: number; r: number };

export default function QuantumField({
  isActive = false,
  width = 240,
  height = 180,
  particleCount = 48,
  colors = ['#FF00E0', '#00B2FF'], // Magenta to electric cyan
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

  const particles: Particle[] = useMemo(
    () =>
      Array.from({ length: particleCount }, () => ({
        x0: Math.random() * width,
        y0: Math.random() * height,
        radius: Math.random() * 3 + 1.5,
        speed: Math.random() * 0.6 + 0.2, // radians/sec
        angle: Math.random() * Math.PI * 2,
        drift: Math.random() * 8 + 4,
      })),
    [particleCount, width, height]
  );

  const animated = useDerivedValue(() => {
    const t = (clock.value ?? 0) / 1000;
    const amp = 8 + amplitude * 22; // motion radius in px
    return particles.map((p) => ({
      x: p.x0 + Math.cos(p.angle + t * p.speed) * (amp + p.drift),
      y: p.y0 + Math.sin(p.angle + t * p.speed) * (amp + p.drift),
      r: p.radius,
    }));
  }, [clock, particles, amplitude]);

  const animatedParticles = animated.value as AnimatedParticle[];

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {animatedParticles.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={p.r} opacity={0.9}>
            <Paint>
              <LinearGradient start={vec(p.x - p.r, p.y - p.r)} end={vec(p.x + p.r, p.y + p.r)} colors={colors} />
            </Paint>
            <BlurMask blur={6} style="outer" />
          </Circle>
        ))}
      </Group>
    </Canvas>
  );
}