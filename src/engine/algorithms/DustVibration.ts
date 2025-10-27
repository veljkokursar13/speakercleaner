/**
 * DustVibration - Dust and debris removal algorithm
 * 
 * Uses rapid vibration patterns and mid-range frequencies
 * to shake loose dust particles from speaker grilles.
 */

import { AudioEngine } from '../audio/AudioEngine';
import { FrequencySweep } from '../audio/FrequencySweep';
import { WaveformGenerator } from '../audio/WaveformGenerator';
import { CleaningProgress } from './WaterEjection';

export interface DustCleaningConfig {
  intensity?: 'gentle' | 'normal' | 'aggressive';
  targetType?: 'fine-dust' | 'coarse-dust' | 'mixed';
}

export class DustVibration {
  private audioEngine: AudioEngine;
  private sweepGenerator: FrequencySweep;
  private waveformGenerator: WaveformGenerator;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.sweepGenerator = new FrequencySweep(audioEngine);
    this.waveformGenerator = new WaveformGenerator(audioEngine);
  }

  /**
   * Execute dust removal sequence
   */
  async execute(
    config: DustCleaningConfig = {},
    onProgress?: (progress: CleaningProgress) => void,
  ): Promise<void> {
    const { intensity = 'normal', targetType = 'mixed' } = config;

    const intensityConfig = this.getIntensityConfig(intensity);
    const totalPhases = 4;
    let currentPhase = 0;

    const updateProgress = (phase: string, stepProgress = 0, frequency?: number) => {
      onProgress?.({
        phase,
        progress: (currentPhase + stepProgress) / totalPhases,
        currentFrequency: frequency,
      });
    };

    // Phase 1: Low-frequency loosening (shake the grille)
    updateProgress('Loosening particles...', 0, 200);
    await this.sweepGenerator.playSweep({
      fromHz: 100,
      toHz: 300,
      duration: 2500,
      gain: intensityConfig.gain * 0.7,
      curve: 'linear',
    });
    currentPhase++;

    // Phase 2: Mid-frequency vibration (primary dust frequency)
    updateProgress('Vibrating grille...', 0, 950);
    if (targetType === 'fine-dust') {
      // Higher frequency for fine particles
      await this.waveformGenerator.playPulsePattern({
        frequency: 1200,
        onMs: 300,
        offMs: 100,
        cycles: intensityConfig.pulseCount,
        gain: intensityConfig.gain,
        waveform: 'square',
      });
    } else {
      // Standard dust frequency (950Hz is sweet spot)
      await this.waveformGenerator.playPulsePattern({
        frequency: 950,
        onMs: 350,
        offMs: 120,
        cycles: intensityConfig.pulseCount,
        gain: intensityConfig.gain,
        waveform: 'square',
      });
    }
    currentPhase++;

    // Phase 3: Rapid bursts (mechanical shock)
    updateProgress('Shock bursts...', 0, 800);
    await this.waveformGenerator.playBurst(
      800,
      200, // Short bursts
      intensityConfig.burstCount,
      80, // Minimal pause
    );
    currentPhase++;

    // Phase 4: High-frequency sweep (final cleanup)
    updateProgress('Final sweep...', 0, 5000);
    await this.sweepGenerator.playSweep({
      fromHz: 3000,
      toHz: 12000,
      duration: 2500,
      gain: intensityConfig.gain * 0.8,
      curve: 'logarithmic',
    });
    currentPhase++;

    updateProgress('Complete', 1);
  }

  /**
   * Quick dust shake (30 seconds)
   */
  async executeQuick(onProgress?: (progress: CleaningProgress) => void): Promise<void> {
    onProgress?.({ phase: 'Quick shake...', progress: 0, currentFrequency: 950 });

    // Concentrated burst at optimal dust frequency
    await this.waveformGenerator.playPulsePattern({
      frequency: 950,
      onMs: 400,
      offMs: 100,
      cycles: 8,
      gain: 0.9,
      waveform: 'square',
    });

    onProgress?.({ phase: 'Complete', progress: 1 });
  }

  /**
   * Deep dust removal (extended session)
   */
  async executeDeep(onProgress?: (progress: CleaningProgress) => void): Promise<void> {
    const phases = [
      { name: 'Pre-loosening', from: 80, to: 200, duration: 3000 },
      { name: 'Low-mid shake', freq: 500, pulses: 10 },
      { name: 'Primary vibration', freq: 950, pulses: 15 },
      { name: 'High-mid shake', freq: 1500, pulses: 10 },
      { name: 'Multi-band sweep', from: 400, to: 4000, duration: 4000 },
      { name: 'Rapid bursts', freq: 800, bursts: 12 },
      { name: 'Ultrasonic clean', from: 8000, to: 15000, duration: 3000 },
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
          waveform: 'square',
        });
      } else if ('bursts' in phase) {
        await this.waveformGenerator.playBurst(phase.freq!, 250, phase.bursts, 80);
      }
    }

    onProgress?.({ phase: 'Complete', progress: 1 });
  }

  /**
   * Randomized pattern to prevent speaker "adaptation"
   */
  async executeRandomized(
    duration: number,
    onProgress?: (progress: CleaningProgress) => void,
  ): Promise<void> {
    const startTime = Date.now();
    let iteration = 0;

    while (Date.now() - startTime < duration) {
      const progress = (Date.now() - startTime) / duration;
      
      // Randomize frequency between 400-2000 Hz
      const freq = 400 + Math.random() * 1600;
      
      onProgress?.({
        phase: `Random vibration ${iteration + 1}...`,
        progress,
        currentFrequency: freq,
      });

      // Random pattern type
      const patternType = Math.random();
      
      if (patternType < 0.4) {
        // Pulse pattern
        await this.waveformGenerator.playPulsePattern({
          frequency: freq,
          onMs: 200 + Math.random() * 300,
          offMs: 50 + Math.random() * 150,
          cycles: 3 + Math.floor(Math.random() * 5),
          gain: 0.7 + Math.random() * 0.2,
          waveform: 'square',
        });
      } else if (patternType < 0.7) {
        // Short sweep
        await this.sweepGenerator.playSweep({
          fromHz: freq,
          toHz: freq + 200 + Math.random() * 500,
          duration: 1000 + Math.random() * 1500,
          gain: 0.7 + Math.random() * 0.2,
        });
      } else {
        // Burst
        await this.waveformGenerator.playBurst(
          freq,
          150 + Math.random() * 200,
          2 + Math.floor(Math.random() * 4),
          50 + Math.random() * 100,
        );
      }

      iteration++;
    }

    onProgress?.({ phase: 'Complete', progress: 1 });
  }

  /**
   * Fine dust specific cleaning (smaller particles)
   */
  async executeFineDust(onProgress?: (progress: CleaningProgress) => void): Promise<void> {
    await this.execute(
      {
        intensity: 'aggressive',
        targetType: 'fine-dust',
      },
      onProgress,
    );
  }

  /**
   * Coarse debris cleaning (larger particles)
   */
  async executeCoarseDust(onProgress?: (progress: CleaningProgress) => void): Promise<void> {
    // Use lower frequencies and stronger pulses for larger particles
    const totalPhases = 3;
    let currentPhase = 0;

    const updateProgress = (phase: string, stepProgress = 0, frequency?: number) => {
      onProgress?.({
        phase,
        progress: (currentPhase + stepProgress) / totalPhases,
        currentFrequency: frequency,
      });
    };

    // Low-frequency mechanical shock
    updateProgress('Heavy shake...', 0, 150);
    await this.waveformGenerator.playPulsePattern({
      frequency: 150,
      onMs: 500,
      offMs: 150,
      cycles: 10,
      gain: 0.95,
      waveform: 'square',
    });
    currentPhase++;

    // Mid-frequency vibration
    updateProgress('Mid vibration...', 0, 700);
    await this.waveformGenerator.playPulsePattern({
      frequency: 700,
      onMs: 400,
      offMs: 120,
      cycles: 12,
      gain: 0.9,
      waveform: 'square',
    });
    currentPhase++;

    // Finishing sweep
    updateProgress('Final sweep...', 0);
    await this.sweepGenerator.playSweep({
      fromHz: 200,
      toHz: 2000,
      duration: 3000,
      gain: 0.85,
    });
    currentPhase++;

    updateProgress('Complete', 1);
  }

  /**
   * Get configuration based on intensity
   */
  private getIntensityConfig(intensity: 'gentle' | 'normal' | 'aggressive') {
    switch (intensity) {
      case 'gentle':
        return { gain: 0.6, pulseCount: 6, burstCount: 5 };
      case 'normal':
        return { gain: 0.8, pulseCount: 10, burstCount: 8 };
      case 'aggressive':
        return { gain: 0.95, pulseCount: 15, burstCount: 12 };
    }
  }
}

