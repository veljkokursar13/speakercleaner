import { VISUALIZER_CONFIG } from '@/constants/visualizerConstants';
import { useEffect, useRef, useState } from 'react';

/**
 * Hook for generating audio visualizer data
 * 
 * @param isActive - Whether the visualizer should be animating
 * @returns frequencyData - Array of normalized amplitude values (0-1)
 */
export function useAudioVisualizer(isActive: boolean = false) {
  const [frequencyData, setFrequencyData] = useState<number[]>(
    Array(VISUALIZER_CONFIG.BAR_COUNT).fill(0)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive) {
      // Fade out when not active
      setFrequencyData(Array(VISUALIZER_CONFIG.BAR_COUNT).fill(0));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Generate random data for visualization
    // TODO: Replace with actual audio analysis when audio engine is connected
    intervalRef.current = setInterval(() => {
      setFrequencyData((prev) => {
        const newData = Array.from({ length: VISUALIZER_CONFIG.BAR_COUNT }, () => 
          Math.random() * 0.8 + 0.2 // Keep bars visible (0.2-1.0 range)
        );
        
        // Apply smoothing
        return newData.map((val, i) => 
          prev[i] * VISUALIZER_CONFIG.SMOOTHING + val * (1 - VISUALIZER_CONFIG.SMOOTHING)
        );
      });
    }, VISUALIZER_CONFIG.ANIMATION_SPEED);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  return { frequencyData };
}

