/**
 * CalibrationService - Device-specific calibration storage
 * 
 * Stores optimal cleaning parameters per device model,
 * learning from past sessions to improve results.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface DeviceCalibration {
  deviceId: string;
  manufacturer: string;
  model: string;
  
  // Optimal frequencies
  resonantFrequency: number;
  waterFrequency: number;
  dustFrequency: number;
  
  // Optimal gains
  safeMaxGain: number;
  effectiveMinGain: number;
  
  // Performance metrics
  avgCleaningEffectiveness: number;
  totalCleaningSessions: number;
  lastCalibrated: number;
  
  // Advanced parameters
  optimalSweepDuration?: number;
  preferredWaveform?: 'sine' | 'square';
  harmonicsEnabled?: boolean;
}

export interface CalibrationUpdate {
  cleaningEffectiveness: number;
  frequenciesUsed: number[];
  gainsUsed: number[];
}

const STORAGE_KEY = '@SpeakerCleaner:DeviceCalibration';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export class CalibrationService {
  private calibration: DeviceCalibration | null = null;
  private deviceId: string;

  constructor() {
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Load calibration for current device
   */
  async loadCalibration(): Promise<DeviceCalibration> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check if calibration is for current device
        if (data.deviceId === this.deviceId) {
          // Check if not expired
          if (Date.now() - data.lastCalibrated < CACHE_DURATION) {
            this.calibration = data;
            return data;
          }
        }
      }
    } catch (error) {
      console.warn('[CalibrationService] Failed to load calibration:', error);
    }

    // Create default calibration
    this.calibration = this.createDefaultCalibration();
    await this.saveCalibration();
    return this.calibration;
  }

  /**
   * Get current calibration (cached)
   */
  getCalibration(): DeviceCalibration {
    if (!this.calibration) {
      throw new Error('Calibration not loaded. Call loadCalibration() first.');
    }
    return this.calibration;
  }

  /**
   * Update calibration based on cleaning results
   */
  async updateFromResults(update: CalibrationUpdate): Promise<void> {
    if (!this.calibration) {
      await this.loadCalibration();
    }

    const cal = this.calibration!;

    // Update session count
    cal.totalCleaningSessions++;

    // Update effectiveness (exponential moving average)
    const alpha = 0.3; // Learning rate
    cal.avgCleaningEffectiveness =
      alpha * update.cleaningEffectiveness + (1 - alpha) * cal.avgCleaningEffectiveness;

    // Update optimal frequencies (if effectiveness improved)
    if (update.cleaningEffectiveness > cal.avgCleaningEffectiveness) {
      if (update.frequenciesUsed.length > 0) {
        // Use most effective frequency
        const avgFreq =
          update.frequenciesUsed.reduce((sum, f) => sum + f, 0) / update.frequenciesUsed.length;
        cal.resonantFrequency = Math.round(avgFreq);
      }

      // Update gain parameters
      if (update.gainsUsed.length > 0) {
        const maxGain = Math.max(...update.gainsUsed);
        const minGain = Math.min(...update.gainsUsed);
        
        cal.safeMaxGain = Math.min(cal.safeMaxGain, maxGain);
        cal.effectiveMinGain = Math.max(cal.effectiveMinGain, minGain);
      }
    }

    cal.lastCalibrated = Date.now();

    await this.saveCalibration();
  }

  /**
   * Set resonant frequency
   */
  async setResonantFrequency(frequency: number): Promise<void> {
    if (!this.calibration) {
      await this.loadCalibration();
    }

    this.calibration!.resonantFrequency = frequency;
    
    // Derive other frequencies from resonant
    this.calibration!.waterFrequency = Math.round(frequency * 0.9);
    this.calibration!.dustFrequency = Math.round(frequency * 1.2);

    await this.saveCalibration();
  }

  /**
   * Adjust safe gain limits
   */
  async setSafeGainLimits(maxGain: number, minGain: number): Promise<void> {
    if (!this.calibration) {
      await this.loadCalibration();
    }

    this.calibration!.safeMaxGain = Math.max(0, Math.min(1, maxGain));
    this.calibration!.effectiveMinGain = Math.max(0, Math.min(1, minGain));

    await this.saveCalibration();
  }

  /**
   * Reset calibration to defaults
   */
  async resetCalibration(): Promise<void> {
    this.calibration = this.createDefaultCalibration();
    await this.saveCalibration();
  }

  /**
   * Export calibration data
   */
  exportCalibration(): string {
    if (!this.calibration) {
      throw new Error('No calibration loaded');
    }
    return JSON.stringify(this.calibration, null, 2);
  }

  /**
   * Import calibration data
   */
  async importCalibration(data: string): Promise<void> {
    try {
      const imported = JSON.parse(data);
      
      // Validate structure
      if (!imported.deviceId || !imported.resonantFrequency) {
        throw new Error('Invalid calibration data');
      }

      // Update device ID to current device
      imported.deviceId = this.deviceId;
      imported.lastCalibrated = Date.now();

      this.calibration = imported;
      await this.saveCalibration();
    } catch (error) {
      throw new Error(`Failed to import calibration: ${error}`);
    }
  }

  /**
   * Save calibration to storage
   */
  private async saveCalibration(): Promise<void> {
    if (!this.calibration) {
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.calibration));
    } catch (error) {
      console.error('[CalibrationService] Failed to save calibration:', error);
    }
  }

  /**
   * Create default calibration for current device
   */
  private createDefaultCalibration(): DeviceCalibration {
    const manufacturer = Platform.OS === 'ios' ? 'Apple' : 'Android';
    const model = Platform.OS; // Simplified

    // Platform-specific defaults
    let defaultResonance = 800;
    let defaultMaxGain = 0.85;

    if (Platform.OS === 'ios') {
      defaultResonance = 165; // Apple Watch frequency
      defaultMaxGain = 0.9;
    } else if (Platform.OS === 'android') {
      defaultResonance = 950;
      defaultMaxGain = 0.85;
    }

    return {
      deviceId: this.deviceId,
      manufacturer,
      model,
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
   * Generate unique device identifier
   */
  private generateDeviceId(): string {
    // In production, use actual device ID
    // For now, use platform + random
    const platform = Platform.OS;
    const random = Math.random().toString(36).substring(7);
    return `${platform}-${random}`;
  }

  /**
   * Get recommended cleaning parameters
   */
  getRecommendedParams(): {
    frequency: number;
    gain: number;
    duration: number;
  } {
    if (!this.calibration) {
      throw new Error('Calibration not loaded');
    }

    return {
      frequency: this.calibration.resonantFrequency,
      gain: (this.calibration.safeMaxGain + this.calibration.effectiveMinGain) / 2,
      duration: this.calibration.optimalSweepDuration || 3000,
    };
  }

  /**
   * Check if calibration needs update
   */
  needsRecalibration(): boolean {
    if (!this.calibration) {
      return true;
    }

    // Recalibrate if:
    // 1. Never calibrated
    // 2. Expired (older than cache duration)
    // 3. Poor effectiveness with many sessions
    
    if (this.calibration.totalCleaningSessions === 0) {
      return true;
    }

    if (Date.now() - this.calibration.lastCalibrated > CACHE_DURATION) {
      return true;
    }

    if (
      this.calibration.totalCleaningSessions > 10 &&
      this.calibration.avgCleaningEffectiveness < 0.4
    ) {
      return true;
    }

    return false;
  }
}

