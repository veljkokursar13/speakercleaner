import { useEffect, useState } from 'react';

/**
 * Hook for audio visualization data
 * Returns frequency data for visualizers
 * 
 * TODO: Connect to actual audio analysis when available
 */
export function useAudioVisualizer(isActive: boolean = false) {
  const [frequencyData, setFrequencyData] = useState<number[]>([]);

  useEffect(() => {
    if (!isActive) {
      setFrequencyData([]);
      return;
    }

    // Generate mock frequency data for visualization
    // In production, this would connect to actual audio analysis
    const generateData = () => {
      const data = new Array(128).fill(0).map(() => Math.random() * 0.5);
      setFrequencyData(data);
    };

    generateData();
    const interval = setInterval(generateData, 100); // Update ~10 times per second

    return () => clearInterval(interval);
  }, [isActive]);

  return { frequencyData };
}

