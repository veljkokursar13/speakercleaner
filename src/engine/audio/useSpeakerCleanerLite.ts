import { useCallback, useMemo, useRef, useState } from 'react';

export type CleanerStatus = 'idle' | 'running' | 'stopped';

export function useSpeakerCleanerLite() {
  const [status, setStatus] = useState<CleanerStatus>('idle');
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (timerRef.current) return;
    setStatus('running');
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(1, p + 0.02);
        if (next >= 1 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setStatus('idle');
        }
        return next;
      });
    }, 200);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus('stopped');
  }, []);

  return useMemo(() => ({ status, progress, start, stop }), [status, progress, start, stop]);
}


