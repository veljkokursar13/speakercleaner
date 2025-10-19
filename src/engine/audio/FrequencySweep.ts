/**
 * FrequencySweep - Advanced frequency sweep generation
 * 
 * Supports linear, logarithmic, and custom sweep curves.
 * Used for resonance detection and progressive cleaning.
 */

import { AudioEngine, SweepParameters } from './AudioEngine';

export type SweepCurve = 'linear' | 'logarithmic' | 'exponential' | 'parabolic';

export interface AdvancedSweepConfig {
  fromHz: number;
  toHz: number;
  duration: number;
  curve?: SweepCurve;
  gain?: number;
  reverse?: boolean; // Sweep backwards
  pingPong?: boolean; // Sweep up then down
}

export class FrequencySweep {
  constructor(private audioEngine: AudioEngine) {}

  /**
   * Play a basic sweep
   */
  async playSweep(config: AdvancedSweepConfig): Promise<void> {
    const { fromHz, toHz, duration, curve = 'logarithmic', gain = 0.8, reverse = false, pingPong = false } = config;

    const startFreq = reverse ? toHz : fromHz;
    const endFreq = reverse ? fromHz : toHz;

    const params: SweepParameters = {
      fromHz: startFreq,
      toHz: endFreq,
      duration,
      gain,
      logarithmic: curve === 'logarithmic',
    };

    await this.audioEngine.playSweep(params);

    // If ping-pong, play reverse sweep
    if (pingPong) {
      const reverseParams: SweepParameters = {
        fromHz: endFreq,
        toHz: startFreq,
        duration,
        gain,
        logarithmic: curve === 'logarithmic',
      };
      await this.audioEngine.playSweep(reverseParams);
    }
  }

  /**
   * Multi-band sweep - divide frequency range into bands
   * Useful for targeting specific resonances
   */
  async playMultiBandSweep(
    fromHz: number,
    toHz: number,
    bands: number,
    durationPerBand: number,
    gain = 0.8,
  ): Promise<void> {
    const frequencies = this.generateBands(fromHz, toHz, bands);

    for (let i = 0; i < frequencies.length - 1; i++) {
      await this.audioEngine.playSweep({
        fromHz: frequencies[i],
        toHz: frequencies[i + 1],
        duration: durationPerBand,
        gain,
        logarithmic: true,
      });
    }
  }

  /**
   * Chirp sweep - rapid frequency change
   * Used for membrane shock and water displacement
   */
  async playChirp(fromHz: number, toHz: number, duration: number, cycles = 1, gain = 0.9): Promise<void> {
    for (let i = 0; i < cycles; i++) {
      await this.audioEngine.playSweep({
        fromHz,
        toHz,
        duration,
        gain,
        logarithmic: false, // Linear chirp for speed
      });

      // Short pause between chirps
      if (i < cycles - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Wobble sweep - oscillating amplitude during sweep
   * Creates pulsing effect for enhanced cleaning
   */
  async playWobbleSweep(
    fromHz: number,
    toHz: number,
    duration: number,
    wobbleHz = 10,
    gain = 0.8,
  ): Promise<void> {
    // This would require custom buffer generation
    // For now, approximate with segmented sweeps
    const segments = 10;
    const segmentDuration = duration / segments;

    for (let i = 0; i < segments; i++) {
      const progress = i / segments;
      const segmentStart = fromHz * Math.pow(toHz / fromHz, progress);
      const segmentEnd = fromHz * Math.pow(toHz / fromHz, (i + 1) / segments);
      
      // Modulate gain
      const wobbleGain = gain * (0.5 + 0.5 * Math.sin(2 * Math.PI * wobbleHz * progress * (duration / 1000)));

      await this.audioEngine.playSweep({
        fromHz: segmentStart,
        toHz: segmentEnd,
        duration: segmentDuration,
        gain: wobbleGain,
        logarithmic: true,
      });
    }
  }

  /**
   * Generate logarithmically-spaced frequency bands
   */
  private generateBands(fromHz: number, toHz: number, count: number): number[] {
    const bands: number[] = [];
    const ratio = Math.pow(toHz / fromHz, 1 / (count - 1));

    for (let i = 0; i < count; i++) {
      bands.push(fromHz * Math.pow(ratio, i));
    }

    return bands;
  }

  /**
   * Calculate optimal sweep duration based on frequency range
   * Rule of thumb: ~10 cycles per frequency for effective membrane movement
   */
  static calculateOptimalDuration(fromHz: number, toHz: number): number {
    const avgFreq = Math.sqrt(fromHz * toHz); // Geometric mean
    const cyclesNeeded = 10;
    const minDuration = (cyclesNeeded / avgFreq) * 1000; // Convert to ms
    return Math.max(minDuration, 2000); // At least 2 seconds
  }

  /**
   * Find resonance peak by sweeping and measuring response
   * Returns frequency with strongest response
   */
  async findResonancePeak(
    fromHz: number,
    toHz: number,
    callback: (frequency: number, amplitude: number) => void,
  ): Promise<number> {
    // This would require microphone feedback
    // Placeholder for now - actual implementation in DiagnosticsService
    const bands = this.generateBands(fromHz, toHz, 20);
    let maxAmplitude = 0;
    let peakFrequency = fromHz;

    for (const freq of bands) {
      await this.audioEngine.playTone({
        frequency: freq,
        duration: 200,
        gain: 0.5,
      });

      // Simulated response - in real implementation, measure mic input
      const amplitude = Math.random();
      callback(freq, amplitude);

      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude;
        peakFrequency = freq;
      }
    }

    return peakFrequency;
  }
}

