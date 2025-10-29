/**
 * CleanerStore - Global state management with Zustand
 * 
 * Centralized store for cleaning sessions, settings, and statistics.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { FrequencyTuner, SessionFeedback } from '../analyzer';
import { AdaptiveCleaning, CleaningResult } from '../engine/algorithms/AdaptiveCleaning';
import { DustVibration } from '../engine/algorithms/DustVibration';
import { CleaningProgress, WaterEjection } from '../engine/algorithms/WaterEjection';
import { AudioEngine, getGlobalAudioEngine } from '../engine/audio/AudioEngine';
import { VolumeController } from '../engine/audio/VolumeController';
import {
    CleaningMode,
    CleaningSession,
    CleaningSettings,
    CleaningStatus,
    ManualModeState,
    UserStats,
} from './types';

interface CleanerState {
  // Current session
  status: CleaningStatus;
  currentMode: CleaningMode | null;
  progress: number; // 0-1
  currentPhase: string;
  currentFrequency?: number;
  
  // Sessions history
  sessions: CleaningSession[];
  currentSessionId: string | null;
  
  // Settings
  settings: CleaningSettings;
  
  // Statistics
  stats: UserStats;
  
  // Manual mode
  manualMode: ManualModeState;
  
  // Premium status
  isPremium: boolean;
  
  // Services (not persisted)
  audioEngine: AudioEngine | null;
  volumeController: VolumeController | null;
  frequencyTuner: FrequencyTuner | null;
}

interface CleanerActions {
  // Initialization
  initialize: () => Promise<void>;
  dispose: () => Promise<void>;
  
  // Cleaning operations
  startCleaning: (mode: CleaningMode, config?: any) => Promise<void>;
  pauseCleaning: () => void;
  resumeCleaning: () => void;
  stopCleaning: () => void;
  
  // Manual mode
  setManualFrequency: (freq: number) => void;
  setManualGain: (gain: number) => void;
  setManualWaveform: (waveform: ManualModeState['waveform']) => void;
  playManualTone: () => Promise<void>;
  stopManualTone: () => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<CleaningSettings>) => void;
  resetSettings: () => void;
  
  // Sessions
  getSessionById: (id: string) => CleaningSession | undefined;
  getRecentSessions: (count: number) => CleaningSession[];
  clearHistory: () => void;
  
  // Statistics
  updateStats: () => void;
  
  // Premium
  setPremiumStatus: (isPremium: boolean) => void;
}

type CleanerStore = CleanerState & CleanerActions;

const defaultSettings: CleaningSettings = {
  safetyChecksEnabled: true,
  maxVolume: 0.85,
  hapticsEnabled: true,
  diagnosticsEnabled: true,
  learningModeEnabled: true,
  preferredWaveform: 'sine',
  harmonicsEnabled: true,
  showProgress: true,
  showFrequency: true,
  keepScreenAwake: true,
};

const defaultStats: UserStats = {
  totalCleaningSessions: 0,
  totalCleaningTime: 0,
  avgImprovement: 0,
  successRate: 0,
  streak: 0,
};

const defaultManualMode: ManualModeState = {
  frequency: 950,
  gain: 0.8,
  duration: 3000,
  waveform: 'sine',
  isPlaying: false,
};

export const useCleanerStore = create<CleanerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      status: 'idle',
      currentMode: null,
      progress: 0,
      currentPhase: '',
      currentFrequency: undefined,
      sessions: [],
      currentSessionId: null,
      settings: defaultSettings,
      stats: defaultStats,
      manualMode: defaultManualMode,
      isPremium: false,
      
      // Non-persisted services
      audioEngine: null,
      volumeController: null,
      frequencyTuner: null,

      // Initialize
      initialize: async () => {
        try {
          // Initialize audio engine
          const engine = getGlobalAudioEngine();
          await engine.initialize();
          
          const volumeController = new VolumeController({
            maxGain: get().settings.maxVolume,
            enableLimiter: true,
            enableNormalization: true,
          });
          await volumeController.initialize();
          
          const frequencyTuner = new FrequencyTuner();
          
          set({
            audioEngine: engine,
            volumeController,
            frequencyTuner,
          });
        } catch (error) {
          console.error('[CleanerStore] Initialization failed:', error);
          set({ status: 'error' });
        }
      },

      // Dispose
      dispose: async () => {
        const { audioEngine } = get();
        if (audioEngine) {
          await audioEngine.dispose();
        }
        set({
          audioEngine: null,
          volumeController: null,
          frequencyTuner: null,
        });
      },

      // Start cleaning
      startCleaning: async (mode, config) => {
        const { audioEngine, volumeController, frequencyTuner, settings, sessions, stats } = get();
        
        if (!audioEngine) {
          throw new Error('Audio engine not initialized');
        }

        // Safety checks
        if (settings.safetyChecksEnabled && volumeController) {
          const safetyCheck = await volumeController.performSafetyCheck();
          if (!safetyCheck.isSafe) {
            throw new Error(safetyCheck.warnings.join('\n'));
          }
        }

        // Create session
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const session: CleaningSession = {
          id: sessionId,
          mode,
          startTime: Date.now(),
          duration: 0,
          success: false,
          patternsUsed: [],
          deviceInfo: {
            platform: Platform.OS,
            model: Platform.Version?.toString() || 'unknown',
          },
        };

        set({
          status: 'preparing',
          currentMode: mode,
          currentSessionId: sessionId,
          progress: 0,
          currentPhase: 'Preparing...',
        });

        // Progress callback
        const onProgress = (progress: CleaningProgress) => {
          set({
            progress: progress.progress,
            currentPhase: progress.phase,
            currentFrequency: progress.currentFrequency,
            status: progress.progress >= 1 ? 'complete' : 'running',
          });
        };

        try {
          let result: CleaningResult | undefined;

          // Execute cleaning based on mode
          switch (mode) {
            case 'adaptive': {
              const adaptive = new AdaptiveCleaning(audioEngine);
              result = await adaptive.execute(
                {
                  autoDetectBlockage: true,
                  performResonanceScan: settings.diagnosticsEnabled,
                  learningMode: settings.learningModeEnabled,
                },
                onProgress,
              );
              break;
            }

            case 'water': {
              const waterEjection = new WaterEjection(audioEngine);
              await waterEjection.execute({ intensity: 'high' }, onProgress);
              break;
            }

            case 'dust': {
              const dustVibration = new DustVibration(audioEngine);
              await dustVibration.execute({ intensity: 'aggressive' }, onProgress);
              break;
            }

            case 'auto':
            default: {
              const adaptive = new AdaptiveCleaning(audioEngine);
              result = await adaptive.executeQuick(onProgress);
              break;
            }
          }

          // Update session with results
          session.endTime = Date.now();
          session.duration = session.endTime - session.startTime;
          session.success = result?.success ?? true;
          session.improvement = result?.improvement;
          session.patternsUsed = result?.patternsUsed ?? [mode];
          session.resonanceData = result?.resonanceData;

          // Update calibration if learning enabled
          if (settings.learningModeEnabled && result && frequencyTuner) {
            const feedback: SessionFeedback = {
              effectiveness: result.improvement,
              frequenciesUsed: [frequencyTuner.getCalibration().resonantFrequency],
              gainsUsed: [settings.maxVolume],
            };
            await frequencyTuner.updateFromSession(feedback);
          }

          // Save session
          set({
            sessions: [...sessions, session],
            status: 'complete',
            currentPhase: 'Complete',
            progress: 1,
          });

          // Update stats
          get().updateStats();
        } catch (error) {
          console.error('[CleanerStore] Cleaning failed:', error);
          set({
            status: 'error',
            currentPhase: `Error: ${error}`,
          });
          throw error;
        }
      },

      // Pause cleaning
      pauseCleaning: () => {
        const { audioEngine } = get();
        audioEngine?.stop();
        set({ status: 'paused' });
      },

      // Resume cleaning
      resumeCleaning: () => {
        set({ status: 'running' });
      },

      // Stop cleaning
      stopCleaning: () => {
        const { audioEngine } = get();
        audioEngine?.stop();
        set({
          status: 'idle',
          currentMode: null,
          progress: 0,
          currentPhase: '',
          currentFrequency: undefined,
          currentSessionId: null,
        });
      },

      // Manual mode: set frequency
      setManualFrequency: (frequency) => {
        set((state) => ({
          manualMode: { ...state.manualMode, frequency },
        }));
      },

      // Manual mode: set gain
      setManualGain: (gain) => {
        set((state) => ({
          manualMode: { ...state.manualMode, gain },
        }));
      },

      // Manual mode: set waveform
      setManualWaveform: (waveform) => {
        set((state) => ({
          manualMode: { ...state.manualMode, waveform },
        }));
      },

      // Manual mode: play tone
      playManualTone: async () => {
        const { audioEngine, manualMode } = get();
        if (!audioEngine) {
          throw new Error('Audio engine not initialized');
        }

        set((state) => ({
          manualMode: { ...state.manualMode, isPlaying: true },
        }));

        try {
          await audioEngine.playTone({
            frequency: manualMode.frequency,
            duration: manualMode.duration,
            gain: manualMode.gain,
            waveform: manualMode.waveform,
          });
        } finally {
          set((state) => ({
            manualMode: { ...state.manualMode, isPlaying: false },
          }));
        }
      },

      // Manual mode: stop tone
      stopManualTone: async () => {
        const { audioEngine } = get();
        if (audioEngine) {
          await audioEngine.stop();
        }
        set((state) => ({
          manualMode: { ...state.manualMode, isPlaying: false },
        }));
      },

      // Update settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));

        // Update volume controller if max volume changed
        if (newSettings.maxVolume !== undefined) {
          const { volumeController } = get();
          volumeController?.setMaxGain(newSettings.maxVolume);
        }
      },

      // Reset settings
      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      // Get session by ID
      getSessionById: (id) => {
        return get().sessions.find((s) => s.id === id);
      },

      // Get recent sessions
      getRecentSessions: (count) => {
        return get()
          .sessions.slice(-count)
          .reverse();
      },

      // Clear history
      clearHistory: () => {
        set({ sessions: [] });
        get().updateStats();
      },

      // Update statistics
      updateStats: () => {
        const { sessions } = get();
        
        if (sessions.length === 0) {
          set({ stats: defaultStats });
          return;
        }

        const totalCleaningSessions = sessions.length;
        const totalCleaningTime = sessions.reduce((sum, s) => sum + s.duration, 0);
        const successfulSessions = sessions.filter((s) => s.success);
        const successRate = successfulSessions.length / totalCleaningSessions;
        
        const sessionsWithImprovement = sessions.filter((s) => s.improvement !== undefined);
        const avgImprovement =
          sessionsWithImprovement.length > 0
            ? sessionsWithImprovement.reduce((sum, s) => sum + (s.improvement || 0), 0) /
              sessionsWithImprovement.length
            : 0;

        const lastCleaningDate = sessions[sessions.length - 1]?.startTime;
        
        // Calculate streak (days of consecutive cleaning)
        let streak = 0;
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        for (let i = sessions.length - 1; i >= 0; i--) {
          const daysSince = (now - sessions[i].startTime) / dayMs;
          if (daysSince <= streak + 1) {
            streak = Math.floor(daysSince) + 1;
          } else {
            break;
          }
        }

        set({
          stats: {
            totalCleaningSessions,
            totalCleaningTime,
            avgImprovement,
            successRate,
            lastCleaningDate,
            streak,
          },
        });
      },

      // Set premium status
      setPremiumStatus: (isPremium) => {
        set({ isPremium });
      },
    }),
    {
      name: 'speaker-cleaner-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields
      partialize: (state) => ({
        sessions: state.sessions,
        settings: state.settings,
        stats: state.stats,
        manualMode: state.manualMode,
        isPremium: state.isPremium,
      }),
    },
  ),
);

// Selectors (for optimized re-renders)
export const selectStatus = (state: CleanerStore) => state.status;
export const selectProgress = (state: CleanerStore) => state.progress;
export const selectCurrentPhase = (state: CleanerStore) => state.currentPhase;
export const selectSettings = (state: CleanerStore) => state.settings;
export const selectStats = (state: CleanerStore) => state.stats;
export const selectManualMode = (state: CleanerStore) => state.manualMode;
export const selectIsPremium = (state: CleanerStore) => state.isPremium;
export const selectRecentSessions = (state: CleanerStore) => state.getRecentSessions(10);

