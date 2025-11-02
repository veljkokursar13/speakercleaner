import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useCleaner } from '../../hooks/useCleaner';
import type { CleaningTechnique, VisualizerMode } from './types';

/**
 * Auto Mode Hook
 * Provides state and actions for automated cleaning with technique selection
 */
export function useAutoMode() {
  const { status, progress, start, stop } = useCleaner();
  const params = useLocalSearchParams();
  const [technique, setTechnique] = useState<CleaningTechnique>('auto');

  // Pre-select technique from navigation params (e.g., from Smart Diagnosis)
  useEffect(() => {
    const mode = (params?.mode as string) || '';
    if (mode === 'pulse') setTechnique('water');
    if (mode === 'vibe') setTechnique('dust');
    if (mode === 'quantum') setTechnique('auto');
  }, [params]);

  // Map technique to visualizer mode
  const visualizerMode = useMemo<VisualizerMode>(() => {
    if (technique === 'water') return 'pulse';
    if (technique === 'dust' || technique === 'sand') return 'vibe';
    return 'quantum';
  }, [technique]);

  // Start cleaning with selected technique
  const startCleaning = () => {
    const mode = technique === 'auto' ? 'adaptive' : technique;
    start(mode as any);
  };

  return {
    // State
    status,
    progress,
    technique,
    visualizerMode,
    isRunning: status === 'running',
    
    // Actions
    setTechnique,
    startCleaning,
    stop,
  };
}

