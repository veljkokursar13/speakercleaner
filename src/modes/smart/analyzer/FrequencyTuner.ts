/**
 * FrequencyTuner - Adaptive frequency tuning with learning
 * 
 * Uses device profile and mic analysis to determine optimal cleaning frequencies.
 * Learns from past sessions to improve effectiveness over time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DeviceProfile } from "./DeviceProfiler";
import { MicProfile } from "./MicAnalyzer";

export type TuningParameters = {
    hz: number;
    durationMs: number;
    volumeDb: number;
    waveform?: 'sine' | 'square';
}[];

export interface CalibrationData {
  deviceId: string;
  
  // Optimal frequencies
  resonantFrequency: number;
  waterFrequency: number;
  dustFrequency: number;
  
  // Optimal gains (volumeDb = 20*log10(gain))
  safeMaxGain: number;
  effectiveMinGain: number;
  
  // Learning metrics
  avgCleaningEffectiveness: number;
  totalCleaningSessions: number;
  lastCalibrated: number;
  
  // Advanced parameters
  optimalSweepDuration: number;
  preferredWaveform: 'sine' | 'square';
  harmonicsEnabled: boolean;
}

export interface SessionFeedback {
  effectiveness: number; // 0-1
  frequenciesUsed: number[];
  gainsUsed: number[];
}

const STORAGE_KEY = '@SpeakerCleaner:TuningCalibration';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const LEARNING_RATE = 0.3;

export class FrequencyTuner {
  private calibration: CalibrationData | null = null;
  private deviceId: string;

  constructor() {
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Build tuning parameters based on device profile and mic analysis
   */
  async build(
    profile: DeviceProfile,
    micProfile: MicProfile
  ): Promise<TuningParameters> {
    // Load calibration data
    await this.loadCalibration();

    if (!this.calibration) {
      throw new Error('Failed to load calibration data');
    }

    const params: TuningParameters = [];

    // Use mic profile to detect issues and adjust frequencies
    const baseFreq = this.calibration.resonantFrequency;
    const avgGain = (this.calibration.safeMaxGain + this.calibration.effectiveMinGain) / 2;
    const volumeDb = this.gainToDb(avgGain);

    // Water ejection frequency (if low band issues detected)
    if (micProfile.lowBandDrop || micProfile.averageAmplitude < 0.3) {
      params.push({
        hz: this.calibration.waterFrequency,
        durationMs: this.calibration.optimalSweepDuration,
        volumeDb: this.gainToDb(this.calibration.safeMaxGain),
        waveform: this.calibration.preferredWaveform,
      });
    }

    // Resonant frequency (main cleaning)
    params.push({
      hz: baseFreq,
      durationMs: this.calibration.optimalSweepDuration * 1.5,
      volumeDb,
      waveform: this.calibration.preferredWaveform,
    });

    // Dust vibration frequency (if mid/high band issues)
    if (micProfile.midBandDrop || micProfile.highBandDrop) {
      params.push({
        hz: this.calibration.dustFrequency,
        durationMs: this.calibration.optimalSweepDuration,
        volumeDb: this.gainToDb(avgGain * 0.9),
        waveform: this.calibration.preferredWaveform,
      });
    }

    // Add harmonics if enabled
    if (this.calibration.harmonicsEnabled) {
      params.push({
        hz: baseFreq * 2,
        durationMs: 1000,
        volumeDb: volumeDb - 6, // Half power
        waveform: 'sine',
      });
    }

    // Adjust for mic anomalies
    if (micProfile.distortionRiskLevel > 0.6) {
      // Reduce all volumes to prevent distortion
      params.forEach(p => p.volumeDb -= 3);
    }

    return params;
  }

  /**
   * Learn from cleaning session results
   */
  async updateFromSession(feedback: SessionFeedback): Promise<void> {
    if (!this.calibration) {
      await this.loadCalibration();
    }

    if (!this.calibration) return;

    const cal = this.calibration;

    // Update session count
    cal.totalCleaningSessions++;

    // Update effectiveness (exponential moving average)
    cal.avgCleaningEffectiveness =
      LEARNING_RATE * feedback.effectiveness + (1 - LEARNING_RATE) * cal.avgCleaningEffectiveness;

    // Update optimal frequencies if effectiveness improved
    if (feedback.effectiveness > cal.avgCleaningEffectiveness) {
      if (feedback.frequenciesUsed.length > 0) {
        const avgFreq =
          feedback.frequenciesUsed.reduce((sum, f) => sum + f, 0) / feedback.frequenciesUsed.length;
        cal.resonantFrequency = Math.round(avgFreq);
        cal.waterFrequency = Math.round(avgFreq * 0.9);
        cal.dustFrequency = Math.round(avgFreq * 1.2);
      }

      // Update gain parameters
      if (feedback.gainsUsed.length > 0) {
        const maxGain = Math.max(...feedback.gainsUsed);
        const minGain = Math.min(...feedback.gainsUsed);
        
        cal.safeMaxGain = Math.min(cal.safeMaxGain, maxGain);
        cal.effectiveMinGain = Math.max(cal.effectiveMinGain, minGain);
      }
    }

    cal.lastCalibrated = Date.now();
    await this.saveCalibration();
  }

  /**
   * Get current calibration data
   */
  getCalibration(): CalibrationData {
    if (!this.calibration) {
      throw new Error('Calibration not loaded');
    }
    return { ...this.calibration };
  }

  /**
   * Check if recalibration is recommended
   */
  needsRecalibration(): boolean {
    if (!this.calibration) return true;

    if (this.calibration.totalCleaningSessions === 0) return true;
    if (Date.now() - this.calibration.lastCalibrated > CACHE_DURATION) return true;
    if (
      this.calibration.totalCleaningSessions > 10 &&
      this.calibration.avgCleaningEffectiveness < 0.4
    ) {
      return true;
    }

    return false;
  }

  /**
   * Reset calibration to defaults
   */
  async reset(): Promise<void> {
    this.calibration = this.createDefaultCalibration();
    await this.saveCalibration();
  }

  /**
   * Load calibration from storage
   */
  private async loadCalibration(): Promise<void> {
    if (this.calibration) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const data = JSON.parse(stored) as CalibrationData;
        
        if (data.deviceId === this.deviceId) {
          if (Date.now() - data.lastCalibrated < CACHE_DURATION) {
            this.calibration = data;
            return;
          }
        }
      }
    } catch (error) {
      console.warn('[FrequencyTuner] Load failed:', error);
    }

    this.calibration = this.createDefaultCalibration();
    await this.saveCalibration();
  }

  /**
   * Save calibration to storage
   */
  private async saveCalibration(): Promise<void> {
    if (!this.calibration) return;

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.calibration));
    } catch (error) {
      console.error('[FrequencyTuner] Save failed:', error);
    }
  }

  /**
   * Create platform-specific default calibration
   */
  private createDefaultCalibration(): CalibrationData {
    let defaultResonance = 800;
    let defaultMaxGain = 0.85;

    if (Platform.OS === 'ios') {
      defaultResonance = 165; // Apple resonance
      defaultMaxGain = 0.9;
    } else if (Platform.OS === 'android') {
      defaultResonance = 950;
      defaultMaxGain = 0.85;
    }

    return {
      deviceId: this.deviceId,
      resonantFrequency: defaultResonance,
      waterFrequency: Math.round(defaultResonance * 0.9),
      dustFrequency: Math.round(defaultResonance * 1.2),
      safeMaxGain: defaultMaxGain,
      effectiveMinGain: 0.5,
      avgCleaningEffectiveness: 0.5,
      totalCleaningSessions: 0,
      lastCalibrated: Date.now(),
      optimalSweepDuration: 3000,
      preferredWaveform: 'sine',
      harmonicsEnabled: true,
    };
  }

  /**
   * Generate device identifier
   */
  private generateDeviceId(): string {
    const platform = Platform.OS;
    const random = Math.random().toString(36).substring(7);
    return `${platform}-${random}`;
  }

  /**
   * Convert gain (0-1) to dB
   */
  private gainToDb(gain: number): number {
    return 20 * Math.log10(Math.max(0.01, gain));
  }
}