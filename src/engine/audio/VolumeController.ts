/**
 * VolumeController - Safe volume management and gain control
 * 
 * Prevents clipping, manages dynamic range, and ensures
 * safe listening levels across devices.
 * 
 * Note: System volume cannot be read directly on iOS/Android.
 * This controller manages app-level gain instead.
 */

import { Platform } from 'react-native';

export interface VolumeConfig {
  maxGain: number; // 0.0 - 1.0, overall limiter
  targetSPL?: number; // Target sound pressure level in dB
  enableLimiter: boolean;
  enableNormalization: boolean;
}

export interface VolumeSafetyCheck {
  isHeadphonesConnected: boolean;
  currentVolume: number; // 0-1
  isSafe: boolean;
  warnings: string[];
}

export class VolumeController {
  private config: Required<VolumeConfig>;
  private systemVolume = 1.0;

  constructor(config: Partial<VolumeConfig> = {}) {
    this.config = {
      maxGain: config.maxGain ?? 0.85,
      targetSPL: config.targetSPL ?? 85, // EU safe limit for extended exposure
      enableLimiter: config.enableLimiter ?? true,
      enableNormalization: config.enableNormalization ?? true,
    };
  }

  /**
   * Initialize and get current system volume
   * Note: System volume cannot be read directly on iOS/Android.
   * Returns safe default and manages app-level gain instead.
   */
  async initialize(): Promise<void> {
    try {
      // System volume cannot be read directly on iOS/Android due to platform restrictions
      // Use a safe default value (75% is recommended for speaker cleaning)
      this.systemVolume = 0.75;
      
      // Log that we're using app-level gain control
      console.log('[VolumeController] Initialized with app-level gain control. System volume cannot be read directly.');
    } catch (error) {
      console.warn('[VolumeController] Initialization warning:', error);
      // Use safe default even on error
      this.systemVolume = 0.75;
    }
  }

  /**
   * Perform safety checks before playing audio
   */
  async performSafetyCheck(): Promise<VolumeSafetyCheck> {
    const warnings: string[] = [];
    let isSafe = true;

    // Check for headphones (critical safety issue)
    const isHeadphonesConnected = await this.isHeadphonesConnected();
    if (isHeadphonesConnected) {
      warnings.push('Headphones detected - speaker cleaning will not work and may damage hearing');
      isSafe = false;
    }

    // Note: System volume cannot be read directly, so we use app-level gain
    // Warn user to check their system volume manually
    warnings.push('Ensure system volume is set to 70-80% for effective cleaning');
    warnings.push('Reduce system volume if it exceeds 80% to prevent speaker damage');

    const currentVolume = this.systemVolume; // This is our app-level gain estimate

    return {
      isHeadphonesConnected,
      currentVolume,
      isSafe,
      warnings,
    };
  }

  /**
   * Calculate safe gain value based on device and frequency
   */
  calculateSafeGain(frequency: number, requestedGain: number): number {
    let safeGain = requestedGain;

    // Apply max gain limiter
    safeGain = Math.min(safeGain, this.config.maxGain);

    // Reduce gain for very high frequencies (ear protection)
    if (frequency > 12000) {
      safeGain *= 0.7; // Reduce by 30%
    } else if (frequency > 15000) {
      safeGain *= 0.5; // Reduce by 50%
    }

    // Reduce gain for very low frequencies (speaker protection)
    if (frequency < 100) {
      safeGain *= 0.8; // Reduce by 20%
    }

    // Ensure within bounds
    return Math.max(0, Math.min(1, safeGain));
  }

  /**
   * Apply soft clipping to prevent distortion
   * Uses tanh function for smooth limiting
   */
  applySoftClipping(sample: number, threshold = 0.9): number {
    if (Math.abs(sample) < threshold) {
      return sample;
    }

    // Soft clip using hyperbolic tangent
    return Math.tanh(sample);
  }

  /**
   * Normalize gain for multi-tone playback
   * Prevents cumulative clipping when multiple frequencies play
   */
  normalizeMultiToneGains(frequencies: number[], requestedGains: number[]): number[] {
    if (!this.config.enableNormalization) {
      return requestedGains;
    }

    // Calculate total RMS power
    const totalPower = requestedGains.reduce((sum, gain) => sum + gain * gain, 0);
    const rms = Math.sqrt(totalPower);

    // Normalize if exceeds threshold
    if (rms > 1.0) {
      return requestedGains.map((gain) => gain / rms);
    }

    return requestedGains;
  }

  /**
   * Generate fade envelope (ADSR-style)
   */
  generateFadeEnvelope(
    sampleCount: number,
    fadeInSamples: number,
    fadeOutSamples: number,
    sampleRate: number,
  ): Float32Array {
    const envelope = new Float32Array(sampleCount);

    for (let i = 0; i < sampleCount; i++) {
      let gain = 1.0;

      // Attack (fade in)
      if (i < fadeInSamples) {
        gain = i / fadeInSamples;
      }
      // Release (fade out)
      else if (i >= sampleCount - fadeOutSamples) {
        gain = (sampleCount - i) / fadeOutSamples;
      }

      envelope[i] = gain;
    }

    return envelope;
  }

  /**
   * Estimate SPL from gain and frequency
   * Rough approximation based on typical phone speakers
   */
  estimateSPL(frequency: number, gain: number): number {
    // Baseline: 80 dB at 1kHz, full gain
    const baseSPL = 80;
    const frequencyFactor = this.getFrequencyResponseCurve(frequency);
    
    // Convert gain to dB (20 * log10(gain))
    const gainDB = 20 * Math.log10(gain);

    return baseSPL + gainDB + frequencyFactor;
  }

  /**
   * Get frequency response curve correction
   * Most phone speakers have poor bass and treble response
   */
  private getFrequencyResponseCurve(frequency: number): number {
    // Typical phone speaker response (approximate)
    if (frequency < 200) {
      return -15; // Poor bass response
    } else if (frequency < 500) {
      return -8;
    } else if (frequency < 3000) {
      return 0; // Flat midrange
    } else if (frequency < 8000) {
      return 2; // Slight treble boost
    } else if (frequency < 12000) {
      return -5;
    } else {
      return -12; // Poor high-frequency response
    }
  }

  /**
   * Check if headphones are connected
   */
  private async isHeadphonesConnected(): Promise<boolean> {
    try {
      // Platform-specific checks
      if (Platform.OS === 'ios') {
        // iOS: Check audio route
        // This would require native module implementation
        return false; // Placeholder
      } else if (Platform.OS === 'android') {
        // Android: Check audio device
        // This would require native module implementation
        return false; // Placeholder
      }
    } catch (error) {
      console.warn('[VolumeController] Could not check headphone status:', error);
    }

    return false;
  }

  /**
   * Set maximum safe gain
   */
  setMaxGain(maxGain: number): void {
    this.config.maxGain = Math.max(0, Math.min(1, maxGain));
  }

  /**
   * Get recommended volume level
   */
  getRecommendedVolume(): number {
    // Recommend 70-80% volume for effective cleaning
    return 0.75;
  }

  /**
   * Calculate dynamic range compression
   * Useful for maintaining consistent loudness
   */
  applyCompression(sample: number, threshold = 0.7, ratio = 4): number {
    const abs = Math.abs(sample);
    
    if (abs < threshold) {
      return sample;
    }

    const excess = abs - threshold;
    const compressed = threshold + excess / ratio;
    
    return (sample / abs) * compressed;
  }
}

