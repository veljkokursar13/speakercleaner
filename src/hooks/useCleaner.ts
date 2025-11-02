import { useCallback, useMemo } from 'react';
import { useCleanerStore, selectProgress, selectStatus } from '../store/cleanerStore';
import type { CleaningMode } from '../store/types';

type StartArg = CleaningMode | 'sand';

/**
 * Convenience hook for cleaning operations
 * Wraps cleanerStore actions with automatic initialization
 */
export function useCleaner() {
  const status = useCleanerStore(selectStatus);
  const progress = useCleanerStore(selectProgress);
  const initialize = useCleanerStore((s) => s.initialize);
  const startCleaning = useCleanerStore((s) => s.startCleaning);
  const stopCleaning = useCleanerStore((s) => s.stopCleaning);
  const audioEngine = useCleanerStore((s) => s.audioEngine);

  const start = useCallback(
    async (mode: StartArg = 'auto') => {
      if (!audioEngine) {
        await initialize();
      }
      await startCleaning(mode as CleaningMode);
    },
    [audioEngine, initialize, startCleaning],
  );

  const stop = useCallback(() => {
    stopCleaning();
  }, [stopCleaning]);

  return useMemo(() => ({ status, progress, start, stop }), [status, progress, start, stop]);
}

