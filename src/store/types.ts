/**
 * Shared types for state management
 */

import { SpeakerHealthReport } from '../diagnostics/SpeakerTest';
import { ResonanceResult } from '../engine/algorithms/ResonanceScan';

export type CleaningStatus = 'idle' | 'preparing' | 'running' | 'paused' | 'complete' | 'error';

export type CleaningMode = 'auto' | 'manual' | 'adaptive' | 'water' | 'dust';

export interface CleaningSession {
  id: string;
  mode: CleaningMode;
  startTime: number;
  endTime?: number;
  duration: number; // ms
  
  // Results
  success: boolean;
  improvement?: number; // 0-1
  patternsUsed: string[];
  
  // Diagnostics
  preHealth?: SpeakerHealthReport;
  postHealth?: SpeakerHealthReport;
  resonanceData?: ResonanceResult;
  
  // Metadata
  deviceInfo: {
    platform: string;
    model: string;
  };
}

export interface CleaningSettings {
  // Safety
  safetyChecksEnabled: boolean;
  maxVolume: number; // 0-1
  
  // Features
  hapticsEnabled: boolean;
  diagnosticsEnabled: boolean;
  learningModeEnabled: boolean;
  
  // Audio
  preferredWaveform: 'sine' | 'square' | 'triangle';
  harmonicsEnabled: boolean;
  
  // UX
  showProgress: boolean;
  showFrequency: boolean;
  keepScreenAwake: boolean;
}

export interface UserStats {
  totalCleaningSessions: number;
  totalCleaningTime: number; // ms
  avgImprovement: number; // 0-1
  successRate: number; // 0-1
  lastCleaningDate?: number;
  streak: number; // Days
}

export interface ManualModeState {
  frequency: number;
  gain: number;
  duration: number;
  waveform: 'sine' | 'square' | 'triangle' | 'sawtooth';
  isPlaying: boolean;
}

