import { useEffect, useMemo } from 'react';
import { selectManualMode, useCleanerStore } from '../../store/cleanerStore';

/**
 * Manual Mode Hook
 * Provides state and actions for manual frequency control
 * Automatically generates and caches tone buffers when parameters change
 * 
 * playManualTone integrates:
 * - Tone buffer caching
 * - Volume control and safety checks
 * - Safe gain calculation
 * - Continuous tone playback
 */
export function useManualMode() {
  const manual = useCleanerStore(selectManualMode);
  const setManualFrequency = useCleanerStore((s) => s.setManualFrequency);
  const setManualGain = useCleanerStore((s) => s.setManualGain);
  const setManualWaveform = useCleanerStore((s) => s.setManualWaveform);
  const playManualTone = useCleanerStore((s) => s.playManualTone);
  const stopManualTone = useCleanerStore((s) => s.stopManualTone);
  const initialize = useCleanerStore((s) => s.initialize);
  const audioEngine = useCleanerStore((s) => s.audioEngine);
  const generateAndCacheTone = useCleanerStore((s) => s.generateAndCacheTone);
  const getCachedTone = useCleanerStore((s) => s.getCachedTone);

  // Auto-initialize on mount
  useEffect(() => {
    if (!audioEngine) {
      initialize().catch((err) => {
        console.error('[ManualMode] Initialization failed:', err);
      });
    }
  }, [audioEngine, initialize]);

  // Pre-generate and cache tone buffer when parameters change
  useEffect(() => {
    if (!audioEngine) return;

    const frequency = manual?.frequency ?? 950;
    const duration = (manual?.duration ?? 3000) / 1000; // Convert ms to seconds
    const waveform = manual?.waveform ?? 'sine';
    const gain = manual?.gain ?? 0.8;

    // Check if already cached
    const cached = getCachedTone(frequency, duration);
    if (cached) {
      return; // Already cached, skip generation
    }

    // Generate and cache tone buffer asynchronously (non-blocking)
    generateAndCacheTone(frequency, duration, waveform, gain).catch((err) => {
      console.warn('[ManualMode] Failed to cache tone buffer:', err);
      // Non-critical error, continue without cache
    });
  }, [manual?.frequency, manual?.duration, manual?.waveform, manual?.gain, audioEngine, generateAndCacheTone, getCachedTone]);

  // Memoized values
  const state = useMemo(() => ({
    frequency: manual?.frequency ?? 950,
    gain: manual?.gain ?? 0.8,
    duration: manual?.duration ?? 3000,
    waveform: manual?.waveform ?? 'sine',
    isPlaying: manual?.isPlaying ?? false,
  }), [manual]);

  return {
    // State
    ...state,
    
    // Actions - ensure functions are always defined
    setManualFrequency: setManualFrequency ?? (() => {}),
    setManualGain: setManualGain ?? (() => {}),
    setManualWaveform: setManualWaveform ?? (() => {}),
    // playManualTone now includes: caching, safety checks, volume control, safe gain calculation
    playManualTone: playManualTone ?? (async () => {}),
    stopManualTone: stopManualTone ?? (async () => {}),
    
    // Utility: Check if tone is cached
    isToneCached: () => {
      const frequency = manual?.frequency ?? 950;
      const duration = (manual?.duration ?? 3000) / 1000;
      return getCachedTone(frequency, duration) !== null;
    },
  };
}

