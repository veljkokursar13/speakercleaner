/**
 * WaterEjection - Apple Watch-inspired water removal algorithm
 * 
 * Uses low-frequency resonance with harmonics to create
 * strong membrane displacement, forcing water out.
 */

import { AudioEngine } from '../audio/AudioEngine';
import { FrequencySweep } from '../audio/FrequencySweep';
import { WaveformGenerator } from '../audio/WaveformGenerator';

export interface WaterEjectionConfig {
  intensity?: 'low' | 'medium' | 'high' | 'max';
  duration?: number; // Total duration in ms
  useHarmonics?: boolean;
}

export interface CleaningProgress {
  phase: string;
  progress: number; // 0-1
  currentFrequency?: number;
}

export class WaterEjection {
  private audioEngine: AudioEngine;
  private sweepGenerator: FrequencySweep;
  private waveformGenerator: WaveformGenerator;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.sweepGenerator = new FrequencySweep(audioEngine);
    this.waveformGenerator = new WaveformGenerator(audioEngine);
  }

  /**
   * Execute water ejection sequence
   * Based on Apple Watch algorithm with improvements
   */
  async execute(
    config: WaterEjectionConfig = {},
    onProgress?: (progress: CleaningProgress) => void,
  ): Promise<void> {
    const { intensity = 'high', duration = 15000, useHarmonics = true } = config;

    const intensityConfig = this.getIntensityConfig(intensity);
    const totalSteps = 5;
    let currentStep = 0;

    const updateProgress = (phase: string, stepProgress = 0, frequency?: number) => {
      onProgress?.({
        phase,
        progress: (currentStep + stepProgress) / totalSteps,
        currentFrequency: frequency,
      });
    };

    // Phase 1: Resonance scan (find optimal frequency)
    updateProgress('Scanning resonance...', 0);
    await this.sweepGenerator.playSweep({
      fromHz: 150,
      toHz: 250,
      duration: 2000,
      gain: intensityConfig.gain * 0.6,
      curve: 'logarithmic',
    });
    currentStep++;

    // Phase 2: Primary ejection tone (165Hz - Apple's frequency)
    updateProgress('Primary ejection...', 0, 165);
    if (useHarmonics) {
      await this.waveformGenerator.playHarmonics(
        165, // Fundamental
        3, // Include 2nd and 3rd harmonics (330Hz, 495Hz)
        3000,
        intensityConfig.gain,
      );
    } else {
      await this.audioEngine.playTone({
        frequency: 165,
        duration: 3000,
        gain: intensityConfig.gain,
        waveform: 'sine',
      });
    }
    currentStep++;

    // Phase 3: Pulse bursts (rapid on/off for mechanical shock)
    updateProgress('Pulse ejection...', 0, 180);
    await this.waveformGenerator.playPulsePattern({
      frequency: 180,
      onMs: 400,
      offMs: 150,
      cycles: intensityConfig.pulseCount,
      gain: intensityConfig.gain,
      waveform: 'square', // Square wave for stronger punch
    });
    currentStep++;

    // Phase 4: Sweep to clear remaining droplets
    updateProgress('Frequency sweep...', 0);
    await this.sweepGenerator.playSweep({
      fromHz: 200,
      toHz: 500,
      duration: 3000,
      gain: intensityConfig.gain * 0.8,
      curve: 'logarithmic',
    });
    currentStep++;

    // Phase 5: High-frequency finisher (ultrasonic cleaning)
    updateProgress('Ultrasonic clean...', 0, 12000);
    await this.sweepGenerator.playSweep({
      fromHz: 10000,
      toHz: 16000,
      duration: 2000,
      gain: intensityConfig.gain * 0.7,
      curve: 'linear',
    });
    currentStep++;

    updateProgress('Complete', 1);
  }

  /**
   * Quick water ejection (fast mode)
   */
  async executeQuick(onProgress?: (progress: CleaningProgress) => void): Promise<void> {
    onProgress?.({ phase: 'Quick ejection...', progress: 0, currentFrequency: 165 });

    // Single powerful burst at optimal frequency
    await this.waveformGenerator.playHarmonics(165, 3, 2000, 0.95);

    onProgress?.({ phase: 'Complete', progress: 1 });
  }

  /**
   * Deep water removal (extended mode)
   */
  async executeDeep(onProgress?: (progress: CleaningProgress) => void): Promise<void> {
    const phases = [
      { name: 'Pre-scan', from: 100, to: 300, duration: 3000 },
      { name: 'Primary ejection', freq: 165, duration: 4000 },
      { name: 'Secondary ejection', freq: 180, duration: 3000 },
      { name: 'Pulse pattern', freq: 170, pulses: 15 },
      { name: 'Wide sweep', from: 150, to: 600, duration: 4000 },
      { name: 'Ultrasonic', from: 12000, to: 18000, duration: 3000 },
      { name: 'Final bursts', freq: 165, bursts: 5 },
    ];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      onProgress?.({
        phase: phase.name,
        progress: i / phases.length,
        currentFrequency: 'freq' in phase ? phase.freq : phase.from,
      });

      if ('from' in phase && 'to' in phase) {
        await this.sweepGenerator.playSweep({
          fromHz: phase.from,
          toHz: phase.to,
          duration: phase.duration!,
          gain: 0.85,
        });
      } else if ('pulses' in phase) {
        await this.waveformGenerator.playPulsePattern({
          frequency: phase.freq!,
          onMs: 350,
          offMs: 120,
          cycles: phase.pulses,
          gain: 0.9,
        });
      } else if ('bursts' in phase) {
        await this.waveformGenerator.playBurst(phase.freq!, 300, phase.bursts, 100);
      } else {
        await this.audioEngine.playTone({
          frequency: phase.freq!,
          duration: phase.duration!,
          gain: 0.9,
        });
      }
    }

    onProgress?.({ phase: 'Complete', progress: 1 });
  }

  /**
   * Adaptive water ejection
   * Adjusts pattern based on estimated water amount
   */
  async executeAdaptive(
    waterLevel: 'light' | 'moderate' | 'heavy',
    onProgress?: (progress: CleaningProgress) => void,
  ): Promise<void> {
    switch (waterLevel) {
      case 'light':
        await this.executeQuick(onProgress);
        break;
      case 'moderate':
        await this.execute({ intensity: 'high' }, onProgress);
        break;
      case 'heavy':
        await this.executeDeep(onProgress);
        break;
    }
  }

  /**
   * Get configuration based on intensity level
   */
  private getIntensityConfig(intensity: 'low' | 'medium' | 'high' | 'max') {
    switch (intensity) {
      case 'low':
        return { gain: 0.6, pulseCount: 5 };
      case 'medium':
        return { gain: 0.75, pulseCount: 8 };
      case 'high':
        return { gain: 0.9, pulseCount: 12 };
      case 'max':
        return { gain: 0.95, pulseCount: 15 };
    }
  }

  /**
   * Directional water ejection
   * Uses stereo channels to direct water flow (if supported)
   */
  async executeDirectional(
    direction: 'left' | 'right' | 'both',
    onProgress?: (progress: CleaningProgress) => void,
  ): Promise<void> {
    // This would require stereo audio support in AudioEngine
    // For now, execute standard pattern
    await this.execute({ intensity: 'high' }, onProgress);
  }
}

