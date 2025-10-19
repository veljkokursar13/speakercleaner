/**
 * ImpedanceAnalyzer - Estimate speaker impedance and blockage
 * 
 * Uses audio playback analysis to estimate electrical
 * and acoustic impedance, indicating blockage level.
 */

import { AudioEngine } from '../engine/audio/AudioEngine';

export interface ImpedanceResult {
  estimatedImpedance: number; // Ohms
  blockageLevel: 'none' | 'light' | 'moderate' | 'severe';
  confidence: number; // 0-1
  resonantFrequency: number; // Hz
  dampingFactor: number;
  timestamp: number;
}

export interface ImpedanceSweep {
  frequency: number;
  impedance: number;
  phase: number; // degrees
}

export class ImpedanceAnalyzer {
  private audioEngine: AudioEngine;
  private nominalImpedance: number; // Typical phone speaker impedance

  constructor(audioEngine: AudioEngine, nominalImpedance = 8) {
    this.audioEngine = audioEngine;
    this.nominalImpedance = nominalImpedance;
  }

  /**
   * Analyze speaker impedance
   */
  async analyze(
    onProgress?: (progress: number, frequency: number) => void,
  ): Promise<ImpedanceResult> {
    // Perform impedance sweep
    const sweepData = await this.performImpedanceSweep(onProgress);

    // Find resonant frequency
    const resonantFrequency = this.findResonantFrequency(sweepData);

    // Estimate impedance at resonance
    const estimatedImpedance = this.estimateImpedance(sweepData, resonantFrequency);

    // Calculate damping factor
    const dampingFactor = this.calculateDampingFactor(sweepData, resonantFrequency);

    // Determine blockage level
    const blockageLevel = this.determineBlockageLevel(estimatedImpedance, dampingFactor);

    // Calculate confidence
    const confidence = this.calculateConfidence(sweepData);

    return {
      estimatedImpedance,
      blockageLevel,
      confidence,
      resonantFrequency,
      dampingFactor,
      timestamp: Date.now(),
    };
  }

  /**
   * Quick impedance check
   */
  async quickCheck(): Promise<ImpedanceResult> {
    // Single-point measurement at typical resonance
    const testFrequency = 800;
    
    await this.audioEngine.playTone({
      frequency: testFrequency,
      duration: 500,
      gain: 0.5,
    });

    // Simulate impedance measurement
    const impedance = this.simulateImpedance(testFrequency);
    const blockageLevel = this.determineBlockageLevel(impedance, 0.5);

    return {
      estimatedImpedance: impedance,
      blockageLevel,
      confidence: 0.6,
      resonantFrequency: testFrequency,
      dampingFactor: 0.5,
      timestamp: Date.now(),
    };
  }

  /**
   * Perform impedance sweep across frequency range
   */
  private async performImpedanceSweep(
    onProgress?: (progress: number, frequency: number) => void,
  ): Promise<ImpedanceSweep[]> {
    const frequencies = this.generateTestFrequencies(100, 2000, 20);
    const sweepData: ImpedanceSweep[] = [];

    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      onProgress?.(i / frequencies.length, freq);

      // Play test tone
      await this.audioEngine.playTone({
        frequency: freq,
        duration: 200,
        gain: 0.4,
      });

      // Measure impedance
      const impedance = this.simulateImpedance(freq);
      const phase = this.simulatePhase(freq);

      sweepData.push({ frequency: freq, impedance, phase });

      // Short pause
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return sweepData;
  }

  /**
   * Find resonant frequency from sweep data
   */
  private findResonantFrequency(sweepData: ImpedanceSweep[]): number {
    // Resonance occurs at minimum impedance
    let minImpedance = Infinity;
    let resonantFreq = 800; // Default

    for (const point of sweepData) {
      if (point.impedance < minImpedance) {
        minImpedance = point.impedance;
        resonantFreq = point.frequency;
      }
    }

    return resonantFreq;
  }

  /**
   * Estimate impedance at specific frequency
   */
  private estimateImpedance(sweepData: ImpedanceSweep[], frequency: number): number {
    // Find closest measurement
    const closest = sweepData.reduce((prev, curr) => {
      return Math.abs(curr.frequency - frequency) < Math.abs(prev.frequency - frequency)
        ? curr
        : prev;
    });

    return closest.impedance;
  }

  /**
   * Calculate damping factor (Q factor)
   */
  private calculateDampingFactor(sweepData: ImpedanceSweep[], resonantFreq: number): number {
    // Find bandwidth at -3dB points
    const resonantImpedance = this.estimateImpedance(sweepData, resonantFreq);
    const threshold = resonantImpedance * Math.sqrt(2); // -3dB point

    let lowerFreq = resonantFreq;
    let upperFreq = resonantFreq;

    // Find lower -3dB frequency
    for (let i = sweepData.length - 1; i >= 0; i--) {
      if (sweepData[i].frequency < resonantFreq && sweepData[i].impedance >= threshold) {
        lowerFreq = sweepData[i].frequency;
        break;
      }
    }

    // Find upper -3dB frequency
    for (const point of sweepData) {
      if (point.frequency > resonantFreq && point.impedance >= threshold) {
        upperFreq = point.frequency;
        break;
      }
    }

    const bandwidth = upperFreq - lowerFreq;
    const dampingFactor = resonantFreq / bandwidth; // Q factor

    return Math.max(0.1, Math.min(10, dampingFactor));
  }

  /**
   * Determine blockage level from impedance
   */
  private determineBlockageLevel(
    impedance: number,
    dampingFactor: number,
  ): 'none' | 'light' | 'moderate' | 'severe' {
    // Higher impedance or lower damping = more blockage
    const blockageScore = (impedance / this.nominalImpedance) * (1 / dampingFactor);

    if (blockageScore > 2.5) {
      return 'severe';
    } else if (blockageScore > 1.8) {
      return 'moderate';
    } else if (blockageScore > 1.2) {
      return 'light';
    } else {
      return 'none';
    }
  }

  /**
   * Calculate confidence in measurement
   */
  private calculateConfidence(sweepData: ImpedanceSweep[]): number {
    // More data points = higher confidence
    const dataDensity = sweepData.length / 20;
    
    // Check for measurement consistency
    const impedances = sweepData.map((d) => d.impedance);
    const avgImpedance = impedances.reduce((sum, z) => sum + z, 0) / impedances.length;
    const variance =
      impedances.reduce((sum, z) => sum + Math.pow(z - avgImpedance, 2), 0) / impedances.length;
    const consistency = 1 / (1 + variance / avgImpedance);

    return Math.min(1, dataDensity * consistency);
  }

  /**
   * Generate logarithmically-spaced test frequencies
   */
  private generateTestFrequencies(min: number, max: number, count: number): number[] {
    const frequencies: number[] = [];
    const ratio = Math.pow(max / min, 1 / (count - 1));

    for (let i = 0; i < count; i++) {
      frequencies.push(min * Math.pow(ratio, i));
    }

    return frequencies;
  }

  /**
   * Simulate impedance measurement (placeholder)
   * In production, this would analyze voltage/current from hardware
   */
  private simulateImpedance(frequency: number): number {
    // Typical speaker impedance curve
    // Minimum at resonance (~800Hz), rises at extremes
    
    const resonantFreq = 800;
    const minImpedance = 6; // Below nominal
    const maxImpedance = 16; // Above nominal

    // Simplified model
    const x = Math.log(frequency / resonantFreq);
    const impedance = minImpedance + (maxImpedance - minImpedance) * Math.pow(x, 2);

    // Add noise
    return impedance + (Math.random() - 0.5) * 1;
  }

  /**
   * Simulate phase measurement
   */
  private simulatePhase(frequency: number): number {
    // Phase shift in degrees
    // Capacitive below resonance, inductive above
    
    const resonantFreq = 800;
    
    if (frequency < resonantFreq) {
      return -45 + (Math.random() - 0.5) * 10;
    } else if (frequency > resonantFreq) {
      return 45 + (Math.random() - 0.5) * 10;
    } else {
      return (Math.random() - 0.5) * 5;
    }
  }

  /**
   * Compare two impedance results
   */
  static compareResults(
    before: ImpedanceResult,
    after: ImpedanceResult,
  ): {
    impedanceChange: number;
    blockageImproved: boolean;
    message: string;
  } {
    const impedanceChange = before.estimatedImpedance - after.estimatedImpedance;
    
    const blockageLevels = ['none', 'light', 'moderate', 'severe'];
    const beforeLevel = blockageLevels.indexOf(before.blockageLevel);
    const afterLevel = blockageLevels.indexOf(after.blockageLevel);
    const blockageImproved = afterLevel < beforeLevel;

    let message = '';
    if (blockageImproved) {
      const levels = beforeLevel - afterLevel;
      if (levels >= 2) {
        message = 'Significant blockage reduction!';
      } else {
        message = 'Blockage reduced.';
      }
    } else if (afterLevel === beforeLevel) {
      message = 'No change in blockage level.';
    } else {
      message = 'Blockage increased. Check speaker.';
    }

    return {
      impedanceChange,
      blockageImproved,
      message,
    };
  }
}

