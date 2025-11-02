/**
 * Manual Mode Types
 */

export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface ManualModeConfig {
  frequency: number;
  gain: number;
  duration: number;
  waveform: Waveform;
}

