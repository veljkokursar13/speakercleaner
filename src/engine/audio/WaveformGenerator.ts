/**
 * WaveformGenerator - Generate complex waveforms and patterns
 * 
 * Provides utilities for creating custom audio patterns
 * beyond simple tones and sweeps.
 */

import { AudioEngine, WaveformType } from './AudioEngine';

export interface PulsePattern {
  frequency: number;
  onMs: number;
  offMs: number;
  cycles: number;
  gain?: number;
  waveform?: WaveformType;
}

export interface AmplitudeModulation {
  carrierHz: number;
  modulatorHz: number;
  depth: number; // 0-1
  duration: number;
  gain?: number;
}

export class WaveformGenerator {
  constructor(private audioEngine: AudioEngine) {}

  /**
   * Play pulse pattern - on/off cycles
   * Excellent for "shaking" water or dust particles
   */
  async playPulsePattern(pattern: PulsePattern): Promise<void> {
    const { frequency, onMs, offMs, cycles, gain = 0.9, waveform = 'sine' } = pattern;

    for (let i = 0; i < cycles; i++) {
      // ON phase
      await this.audioEngine.playTone({
        frequency,
        duration: onMs,
        gain,
        waveform,
        fadeIn: 5,
        fadeOut: 5,
      });

      // OFF phase (silence)
      if (i < cycles - 1) {
        await new Promise((resolve) => setTimeout(resolve, offMs));
      }
    }
  }

  /**
   * Play burst pattern - rapid pulses
   * Used for aggressive cleaning
   */
  async playBurst(frequency: number, burstDuration: number, burstCount: number, pauseMs = 100): Promise<void> {
    for (let i = 0; i < burstCount; i++) {
      await this.audioEngine.playTone({
        frequency,
        duration: burstDuration,
        gain: 1.0,
        waveform: 'square', // Square wave for punch
        fadeIn: 0,
        fadeOut: 0,
      });

      if (i < burstCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, pauseMs));
      }
    }
  }

  /**
   * Enhanced burst pattern - variable timing and gain
   * More effective for dislodging particles
   */
  async playEnhancedBurst(
    frequency: number,
    burstDuration: number,
    burstCount: number,
    basePauseMs = 100,
    gainVariation = 0.1,
  ): Promise<void> {
    for (let i = 0; i < burstCount; i++) {
      // Vary gain slightly for each burst
      const gain = 0.95 + (Math.random() - 0.5) * gainVariation * 2;
      
      // Vary pause time slightly (20% variation)
      const pauseMs = basePauseMs * (0.8 + Math.random() * 0.4);

      await this.audioEngine.playTone({
        frequency,
        duration: burstDuration,
        gain: Math.min(1.0, Math.max(0.8, gain)),
        waveform: 'square',
        fadeIn: 0,
        fadeOut: 0,
      });

      if (i < burstCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, pauseMs));
      }
    }
  }

  /**
   * Cascade burst - increasing frequency bursts
   * Creates progressive cleaning effect
   */
  async playCascadeBurst(
    baseFrequency: number,
    burstDuration: number,
    burstCount: number,
    frequencyStep: number,
    pauseMs = 100,
    gain = 0.95,
  ): Promise<void> {
    for (let i = 0; i < burstCount; i++) {
      const freq = baseFrequency + frequencyStep * i;
      
      await this.audioEngine.playTone({
        frequency: freq,
        duration: burstDuration,
        gain,
        waveform: 'square',
        fadeIn: 0,
        fadeOut: 0,
      });

      if (i < burstCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, pauseMs));
      }
    }
  }

  /**
   * Random burst pattern - unpredictable timing and frequency
   * Prevents speaker adaptation
   */
  async playRandomBurst(
    minFrequency: number,
    maxFrequency: number,
    burstDuration: number,
    burstCount: number,
    minPauseMs: number,
    maxPauseMs: number,
    gain = 0.9,
  ): Promise<void> {
    for (let i = 0; i < burstCount; i++) {
      const freq = minFrequency + Math.random() * (maxFrequency - minFrequency);
      const pauseMs = minPauseMs + Math.random() * (maxPauseMs - minPauseMs);

      await this.audioEngine.playTone({
        frequency: freq,
        duration: burstDuration,
        gain,
        waveform: 'square',
        fadeIn: 0,
        fadeOut: 0,
      });

      if (i < burstCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, pauseMs));
      }
    }
  }

  /**
   * Play harmonics - fundamental + overtones
   * Creates richer sound for broader membrane movement
   */
  async playHarmonics(
    fundamental: number,
    harmonicCount: number,
    duration: number,
    gain = 0.8,
  ): Promise<void> {
    const frequencies: number[] = [];
    const gains: number[] = [];

    for (let i = 1; i <= harmonicCount; i++) {
      frequencies.push(fundamental * i);
      gains.push(gain / i); // Reduce amplitude for higher harmonics
    }

    await this.audioEngine.playMultiTone({
      frequencies,
      gains,
      duration,
      waveform: 'sine',
    });
  }

  /**
   * Play amplitude modulation (tremolo effect)
   * Carrier frequency modulated by slower frequency
   */
  async playAmplitudeModulation(config: AmplitudeModulation): Promise<void> {
    const { carrierHz, modulatorHz, depth, duration, gain = 0.8 } = config;

    // This requires custom buffer generation
    // Simplified version: play carrier with pulsing gain
    const pulseCount = Math.floor((modulatorHz * duration) / 1000);
    const pulseDuration = 1000 / modulatorHz;

    for (let i = 0; i < pulseCount; i++) {
      const phase = (i / pulseCount) * 2 * Math.PI;
      const modGain = gain * (1 - depth + depth * Math.sin(phase));

      await this.audioEngine.playTone({
        frequency: carrierHz,
        duration: pulseDuration,
        gain: modGain,
        waveform: 'sine',
        fadeIn: 0,
        fadeOut: 0,
      });
    }
  }

  /**
   * Play binaural beat (two slightly different frequencies)
   * Creates beating effect for enhanced membrane vibration
   */
  async playBinauralBeat(
    centerHz: number,
    beatHz: number,
    duration: number,
    gain = 0.8,
  ): Promise<void> {
    const freq1 = centerHz - beatHz / 2;
    const freq2 = centerHz + beatHz / 2;

    await this.audioEngine.playMultiTone({
      frequencies: [freq1, freq2],
      gains: [gain / 2, gain / 2],
      duration,
      waveform: 'sine',
    });
  }

  /**
   * Play stepped pattern - step through frequencies
   * Good for methodical cleaning
   */
  async playSteppedPattern(
    frequencies: number[],
    durationPerStep: number,
    gain = 0.8,
  ): Promise<void> {
    for (const freq of frequencies) {
      await this.audioEngine.playTone({
        frequency: freq,
        duration: durationPerStep,
        gain,
        waveform: 'sine',
      });
    }
  }

  /**
   * Play randomized pattern - unpredictable frequencies
   * Prevents speaker adaptation to repetitive patterns
   */
  async playRandomPattern(
    minHz: number,
    maxHz: number,
    duration: number,
    steps = 10,
    gain = 0.8,
  ): Promise<void> {
    const stepDuration = duration / steps;

    for (let i = 0; i < steps; i++) {
      const randomFreq = minHz + Math.random() * (maxHz - minHz);
      
      await this.audioEngine.playTone({
        frequency: randomFreq,
        duration: stepDuration,
        gain,
        waveform: 'sine',
      });
    }
  }

  /**
   * Generate white noise burst
   * Useful for final cleanup phase
   */
  async playNoiseBurst(duration: number, gain = 0.6): Promise<void> {
    await this.audioEngine.playTone({
      frequency: 1000, // Ignored for noise
      duration,
      gain,
      waveform: 'noise',
    });
  }

  /**
   * Play Shepard tone - infinite ascending/descending illusion
   * Creates continuous pressure sensation
   */
  async playShepardTone(
    baseHz: number,
    duration: number,
    ascending = true,
    gain = 0.7,
  ): Promise<void> {
    // Simplified: play multiple octaves simultaneously
    const octaves = [1, 2, 4, 8];
    const frequencies = octaves.map((oct) => baseHz * oct);

    await this.audioEngine.playMultiTone({
      frequencies,
      gains: frequencies.map(() => gain / frequencies.length),
      duration,
      waveform: 'sine',
    });
  }
}

