/**
 * Smart Mode Types
 */

export interface DiagnosticStep {
  id: string;
  label: string;
  progress: number;
}

export type DiagnosticPhase = 
  | 'idle'
  | 'initializing'
  | 'testing'
  | 'analyzing'
  | 'complete'
  | 'error';

