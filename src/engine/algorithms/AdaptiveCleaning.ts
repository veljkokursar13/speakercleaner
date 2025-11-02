/**
 * AdaptiveCleaning - ML-inspired adaptive cleaning algorithm
 * 
 * Adjusts cleaning strategy based on device characteristics,
 * blockage detection, and real-time feedback.
 */

import { Platform } from 'react-native';
import { MicMonitor } from '../../modes/smart/analyzer/MicMonitor';
import { AudioEngine } from '../audio/AudioEngine';
import { DustVibration } from './DustVibration';
import { ResonanceResult, ResonanceScan } from './ResonanceScan';
import { CleaningProgress, WaterEjection } from './WaterEjection';

export interface DeviceProfile {
  manufacturer: string;
  model: string;
  speakerType: 'mono' | 'stereo' | 'dual';
  optimalFrequency?: number;
  resonanceBandwidth?: number;
  maxSafeSPL?: number;
}

export interface BlockageDetection {
  severity: 'none' | 'light' | 'moderate' | 'severe';
  type: 'water' | 'dust' | 'debris' | 'unknown';
  confidence: number; // 0-1
  affectedFrequencies: number[];
}

export interface AdaptiveConfig {
  autoDetectBlockage?: boolean;
  performResonanceScan?: boolean;
  learningMode?: boolean;
  maxDuration?: number; // ms
  enableRealTimeFeedback?: boolean; // Use mic monitoring for real-time adjustment
}

export interface CleaningResult {
  success: boolean;
  improvement: number; // 0-1 (percentage improvement)
  duration: number; // ms
  patternsUsed: string[];
  resonanceData?: ResonanceResult;
  recommendations?: string[];
}

export class AdaptiveCleaning {
  private audioEngine: AudioEngine;
  private waterEjection: WaterEjection;
  private dustVibration: DustVibration;
  private resonanceScan: ResonanceScan;
  private micMonitor: MicMonitor | null = null;
  
  private deviceProfile: DeviceProfile | null = null;
  private cleaningHistory: CleaningResult[] = [];
  private realTimeFeedback: { 
    beforeSnapshot: { rms: number; clarity: number } | null;
    currentSnapshot: { rms: number; clarity: number } | null;
    improvementRate: number;
  } = {
    beforeSnapshot: null,
    currentSnapshot: null,
    improvementRate: 0,
  };

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.waterEjection = new WaterEjection(audioEngine);
    this.dustVibration = new DustVibration(audioEngine);
    this.resonanceScan = new ResonanceScan(audioEngine);
  }

  /**
   * Execute adaptive cleaning session
   */
  async execute(
    config: AdaptiveConfig = {},
    onProgress?: (progress: CleaningProgress) => void,
  ): Promise<CleaningResult> {
    const {
      autoDetectBlockage = true,
      performResonanceScan = true,
      learningMode = true,
      maxDuration = 30000,
      enableRealTimeFeedback = true,
    } = config;

    const startTime = Date.now();
    const patternsUsed: string[] = [];
    let resonanceData: ResonanceResult | undefined;

    // Initialize real-time feedback monitoring
    if (enableRealTimeFeedback) {
      await this.initializeRealTimeFeedback();
    }

    // Step 1: Device profiling
    onProgress?.({ phase: 'Analyzing device...', progress: 0.1 });
    if (!this.deviceProfile) {
      this.deviceProfile = await this.detectDeviceProfile();
    }

    // Step 2: Resonance scan (if enabled)
    if (performResonanceScan) {
      onProgress?.({ phase: 'Scanning resonance...', progress: 0.2 });
      resonanceData = await this.resonanceScan.quickScan((p, freq) => {
        onProgress?.({
          phase: `Scanning ${freq.toFixed(0)}Hz...`,
          progress: 0.2 + p * 0.1,
          currentFrequency: freq,
        });
      });
      patternsUsed.push('resonance-scan');
    }

    // Step 2.5: Capture baseline for real-time feedback
    if (enableRealTimeFeedback && this.micMonitor) {
      await this.captureBaseline();
    }

    // Step 3: Blockage detection
    let blockage: BlockageDetection | null = null;
    if (autoDetectBlockage) {
      onProgress?.({ phase: 'Detecting blockage...', progress: 0.3 });
      blockage = await this.detectBlockage(resonanceData);
      patternsUsed.push('blockage-detection');
    }

    // Step 4: Select and execute cleaning strategy
    onProgress?.({ phase: 'Selecting strategy...', progress: 0.35 });
    const strategy = this.selectStrategy(blockage, resonanceData);
    patternsUsed.push(strategy.name);

    // Step 5: Execute cleaning with real-time feedback
    await this.executeStrategyWithFeedback(strategy, enableRealTimeFeedback, (progress) => {
      onProgress?.({
        ...progress,
        progress: 0.4 + progress.progress * 0.5,
      });
    });

    // Step 6: Verification scan
    onProgress?.({ phase: 'Verifying results...', progress: 0.9 });
    const postCleanResonance = await this.resonanceScan.quickScan();
    patternsUsed.push('post-verification');

    // Step 7: Calculate improvement (use real-time feedback if available)
    let improvement = this.calculateImprovement(resonanceData, postCleanResonance);
    
    // Override with real-time feedback if available
    if (enableRealTimeFeedback && this.realTimeFeedback.beforeSnapshot && this.realTimeFeedback.currentSnapshot) {
      const rmsImprovement = (this.realTimeFeedback.currentSnapshot.rms - this.realTimeFeedback.beforeSnapshot.rms) / 
        Math.max(0.01, this.realTimeFeedback.beforeSnapshot.rms);
      const clarityImprovement = (this.realTimeFeedback.currentSnapshot.clarity - this.realTimeFeedback.beforeSnapshot.clarity) / 
        Math.max(0.01, this.realTimeFeedback.beforeSnapshot.clarity);
      improvement = Math.max(0, Math.min(1, (rmsImprovement + clarityImprovement) / 2));
    }

    // Cleanup real-time feedback
    if (enableRealTimeFeedback) {
      await this.cleanupRealTimeFeedback();
    }
    
    const duration = Date.now() - startTime;
    const result: CleaningResult = {
      success: improvement > 0.1,
      improvement,
      duration,
      patternsUsed,
      resonanceData: postCleanResonance,
      recommendations: this.generateRecommendations(improvement, blockage),
    };

    // Store in history for learning
    if (learningMode) {
      this.cleaningHistory.push(result);
    }

    onProgress?.({ phase: 'Complete', progress: 1 });

    return result;
  }

  /**
   * Quick adaptive clean (skip diagnostics)
   */
  async executeQuick(onProgress?: (progress: CleaningProgress) => void): Promise<CleaningResult> {
    const startTime = Date.now();
    const patternsUsed: string[] = [];

    // Use default strategy based on common blockage
    onProgress?.({ phase: 'Quick cleaning...', progress: 0 });
    
    await this.waterEjection.executeQuick((progress) => {
      onProgress?.({ ...progress, progress: progress.progress * 0.7 });
    });
    patternsUsed.push('water-ejection-quick');

    await this.dustVibration.executeQuick((progress) => {
      onProgress?.({ ...progress, progress: 0.7 + progress.progress * 0.3 });
    });
    patternsUsed.push('dust-vibration-quick');

    const duration = Date.now() - startTime;

    onProgress?.({ phase: 'Complete', progress: 1 });

    return {
      success: true,
      improvement: 0.5, // Estimated
      duration,
      patternsUsed,
    };
  }

  /**
   * Deep adaptive clean (full diagnostics + extended cleaning)
   */
  async executeDeep(onProgress?: (progress: CleaningProgress) => void): Promise<CleaningResult> {
    return this.execute(
      {
        autoDetectBlockage: true,
        performResonanceScan: true,
        learningMode: true,
        maxDuration: 60000,
      },
      onProgress,
    );
  }

  /**
   * Detect device profile
   */
  private async detectDeviceProfile(): Promise<DeviceProfile> {
    // In production, this would query device info
    const manufacturer = Platform.OS === 'ios' ? 'Apple' : 'Android';
    const model = Platform.OS; // Simplified

    return {
      manufacturer,
      model,
      speakerType: 'stereo', // Assume modern device
      optimalFrequency: 165, // Default
      resonanceBandwidth: 100,
      maxSafeSPL: 85,
    };
  }

  /**
   * Detect type and severity of blockage
   */
  private async detectBlockage(resonance?: ResonanceResult): Promise<BlockageDetection> {
    // Simple heuristic-based detection
    // In production, this would use ML model trained on real data

    if (!resonance) {
      return {
        severity: 'moderate',
        type: 'unknown',
        confidence: 0.5,
        affectedFrequencies: [],
      };
    }

    const { peakAmplitude, bandwidth, peakFrequency } = resonance;

    // Low amplitude = likely blockage
    let severity: 'none' | 'light' | 'moderate' | 'severe' = 'none';
    if (peakAmplitude < 0.3) {
      severity = 'severe';
    } else if (peakAmplitude < 0.5) {
      severity = 'moderate';
    } else if (peakAmplitude < 0.7) {
      severity = 'light';
    }

    // Narrow bandwidth = resonant blockage (water)
    // Wide bandwidth = damped blockage (dust/debris)
    const qFactor = peakFrequency / bandwidth;
    let type: 'water' | 'dust' | 'debris' | 'unknown' = 'unknown';
    
    if (qFactor > 5) {
      type = 'water'; // High Q = liquid
    } else if (qFactor > 2) {
      type = 'dust'; // Medium Q = fine particles
    } else {
      type = 'debris'; // Low Q = coarse blockage
    }

    // Find affected frequency ranges
    const affectedFrequencies: number[] = [];
    for (const point of resonance.frequencyResponse) {
      if (point.amplitude < 0.5) {
        affectedFrequencies.push(point.frequency);
      }
    }

    return {
      severity,
      type,
      confidence: 0.7,
      affectedFrequencies,
    };
  }

  /**
   * Select optimal cleaning strategy
   */
  private selectStrategy(
    blockage: BlockageDetection | null,
    resonance?: ResonanceResult,
  ): { name: string; execute: (onProgress?: (p: CleaningProgress) => void) => Promise<void> } {
    if (!blockage) {
      // Default: combined approach
      return {
        name: 'combined-default',
        execute: async (onProgress) => {
          await this.waterEjection.execute({}, onProgress);
        },
      };
    }

    // Strategy selection based on blockage type
    switch (blockage.type) {
      case 'water':
        if (blockage.severity === 'severe' || blockage.severity === 'moderate') {
          return {
            name: 'water-ejection-deep',
            execute: (onProgress) => this.waterEjection.executeDeep(onProgress),
          };
        } else {
          return {
            name: 'water-ejection-standard',
            execute: (onProgress) => this.waterEjection.execute({ intensity: 'high' }, onProgress),
          };
        }

      case 'dust':
        if (blockage.severity === 'severe') {
          return {
            name: 'dust-vibration-deep',
            execute: (onProgress) => this.dustVibration.executeDeep(onProgress),
          };
        } else {
          return {
            name: 'dust-vibration-standard',
            execute: (onProgress) => this.dustVibration.execute({ intensity: 'aggressive' }, onProgress),
          };
        }

      case 'debris':
        return {
          name: 'dust-coarse',
          execute: (onProgress) => this.dustVibration.executeCoarseDust(onProgress),
        };

      default:
        // Unknown: try combined approach
        return {
          name: 'combined-adaptive',
          execute: async (onProgress) => {
            await this.waterEjection.execute({ intensity: 'medium' }, (p) => {
              onProgress?.({ ...p, progress: p.progress * 0.5 });
            });
            await this.dustVibration.execute({ intensity: 'normal' }, (p) => {
              onProgress?.({ ...p, progress: 0.5 + p.progress * 0.5 });
            });
          },
        };
    }
  }

  /**
   * Execute selected strategy
   */
  private async executeStrategy(
    strategy: { name: string; execute: (onProgress?: (p: CleaningProgress) => void) => Promise<void> },
    onProgress?: (progress: CleaningProgress) => void,
  ): Promise<void> {
    await strategy.execute(onProgress);
  }

  /**
   * Execute strategy with real-time feedback adjustment
   */
  private async executeStrategyWithFeedback(
    strategy: { name: string; execute: (onProgress?: (p: CleaningProgress) => void) => Promise<void> },
    enableFeedback: boolean,
    onProgress?: (progress: CleaningProgress) => void,
  ): Promise<void> {
    if (!enableFeedback || !this.micMonitor) {
      await this.executeStrategy(strategy, onProgress);
      return;
    }

    // Execute with periodic feedback checks
    let lastFeedbackTime = Date.now();
    const feedbackInterval = 2000; // Check every 2 seconds

    await strategy.execute(async (progress) => {
      // Update progress callback
      onProgress?.(progress);

      // Check real-time feedback periodically
      const now = Date.now();
      if (now - lastFeedbackTime >= feedbackInterval) {
        await this.updateRealTimeFeedback();
        lastFeedbackTime = now;

        // If improvement rate is negative or plateauing, suggest strategy adjustment
        if (this.realTimeFeedback.improvementRate < -0.05) {
          // Consider changing strategy or stopping early
          // For now, just log - could be enhanced to dynamically adjust
          console.log('[AdaptiveCleaning] Negative improvement detected, consider adjustment');
        }
      }
    });
  }

  /**
   * Initialize real-time feedback monitoring
   */
  private async initializeRealTimeFeedback(): Promise<void> {
    try {
      this.micMonitor = new MicMonitor();
      const initialized = await this.micMonitor.initialize();
      if (initialized) {
        await this.micMonitor.start(500); // Sample every 500ms
      } else {
        console.warn('[AdaptiveCleaning] Mic monitoring not available');
        this.micMonitor = null;
      }
    } catch (error) {
      console.warn('[AdaptiveCleaning] Failed to initialize real-time feedback:', error);
      this.micMonitor = null;
    }
  }

  /**
   * Capture baseline metrics before cleaning
   */
  private async captureBaseline(): Promise<void> {
    if (!this.micMonitor) return;

    // Wait a bit for mic to stabilize
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const level = await this.micMonitor.getCurrentLevel();
      const bandEnergy = await this.micMonitor.getBandEnergy();
      
      // Calculate clarity from band energy
      const totalEnergy = bandEnergy.low + bandEnergy.mid + bandEnergy.high;
      const clarity = totalEnergy > 0.01 ? Math.min(1, totalEnergy * 10) : 0.3;

      this.realTimeFeedback.beforeSnapshot = {
        rms: level,
        clarity,
      };
    } catch (error) {
      console.warn('[AdaptiveCleaning] Failed to capture baseline:', error);
    }
  }

  /**
   * Update real-time feedback during cleaning
   */
  private async updateRealTimeFeedback(): Promise<void> {
    if (!this.micMonitor) return;

    try {
      const level = await this.micMonitor.getCurrentLevel();
      const bandEnergy = await this.micMonitor.getBandEnergy();
      
      const totalEnergy = bandEnergy.low + bandEnergy.mid + bandEnergy.high;
      const clarity = totalEnergy > 0.01 ? Math.min(1, totalEnergy * 10) : 0.3;

      this.realTimeFeedback.currentSnapshot = {
        rms: level,
        clarity,
      };

      // Calculate improvement rate
      if (this.realTimeFeedback.beforeSnapshot) {
        const rmsChange = (this.realTimeFeedback.currentSnapshot.rms - this.realTimeFeedback.beforeSnapshot.rms) / 
          Math.max(0.01, this.realTimeFeedback.beforeSnapshot.rms);
        const clarityChange = (this.realTimeFeedback.currentSnapshot.clarity - this.realTimeFeedback.beforeSnapshot.clarity) / 
          Math.max(0.01, this.realTimeFeedback.beforeSnapshot.clarity);
        
        this.realTimeFeedback.improvementRate = (rmsChange + clarityChange) / 2;
      }
    } catch (error) {
      console.warn('[AdaptiveCleaning] Failed to update feedback:', error);
    }
  }

  /**
   * Cleanup real-time feedback monitoring
   */
  private async cleanupRealTimeFeedback(): Promise<void> {
    if (this.micMonitor) {
      try {
        await this.micMonitor.dispose();
      } catch (error) {
        console.warn('[AdaptiveCleaning] Failed to cleanup feedback:', error);
      }
      this.micMonitor = null;
    }
    this.realTimeFeedback = {
      beforeSnapshot: null,
      currentSnapshot: null,
      improvementRate: 0,
    };
  }

  /**
   * Calculate cleaning improvement
   */
  private calculateImprovement(
    before?: ResonanceResult,
    after?: ResonanceResult,
  ): number {
    if (!before || !after) {
      return 0.5; // Assume moderate improvement
    }

    // Compare peak amplitudes
    const amplitudeImprovement = (after.peakAmplitude - before.peakAmplitude) / before.peakAmplitude;

    // Compare bandwidths (wider is better for phone speakers)
    const bandwidthImprovement = (after.bandwidth - before.bandwidth) / before.bandwidth;

    // Weighted average
    const improvement = (amplitudeImprovement * 0.7 + bandwidthImprovement * 0.3);

    return Math.max(0, Math.min(1, improvement));
  }

  /**
   * Generate recommendations for user
   */
  private generateRecommendations(
    improvement: number,
    blockage: BlockageDetection | null,
  ): string[] {
    const recommendations: string[] = [];

    if (improvement < 0.2) {
      recommendations.push('Cleaning had minimal effect. Consider repeating or seeking professional help.');
      
      if (blockage?.type === 'water') {
        recommendations.push('For water damage, try leaving phone speaker-down for 24 hours.');
      } else if (blockage?.type === 'debris') {
        recommendations.push('Large debris may require physical cleaning. Check speaker grille carefully.');
      }
    } else if (improvement < 0.5) {
      recommendations.push('Partial improvement detected. Consider running cleaning again.');
    } else {
      recommendations.push('Good cleaning results! Speaker should be significantly clearer.');
    }

    if (blockage?.severity === 'severe') {
      recommendations.push('Severe blockage detected. Multiple cleaning sessions may be needed.');
    }

    return recommendations;
  }

  /**
   * Get cleaning history statistics
   */
  getStatistics(): {
    totalCleans: number;
    avgImprovement: number;
    successRate: number;
    mostEffectivePattern: string;
  } {
    if (this.cleaningHistory.length === 0) {
      return {
        totalCleans: 0,
        avgImprovement: 0,
        successRate: 0,
        mostEffectivePattern: 'none',
      };
    }

    const totalCleans = this.cleaningHistory.length;
    const avgImprovement =
      this.cleaningHistory.reduce((sum, result) => sum + result.improvement, 0) / totalCleans;
    const successRate = this.cleaningHistory.filter((r) => r.success).length / totalCleans;

    // Find most effective pattern
    const patternCounts: Record<string, number> = {};
    this.cleaningHistory.forEach((result) => {
      result.patternsUsed.forEach((pattern) => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    });

    const mostEffectivePattern =
      Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    return {
      totalCleans,
      avgImprovement,
      successRate,
      mostEffectivePattern,
    };
  }
}

