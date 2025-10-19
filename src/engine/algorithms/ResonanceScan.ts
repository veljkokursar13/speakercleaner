/**
 * ResonanceScan - Find speaker's natural resonant frequency
 * 
 * Scans frequency range to identify peak response.
 * Used for optimizing cleaning algorithms per device.
 */

import { AudioEngine } from '../audio/AudioEngine';
import { FrequencySweep } from '../audio/FrequencySweep';

export interface ResonanceResult {
  peakFrequency: number; // Hz
  peakAmplitude: number; // Relative 0-1
  bandwidth: number; // Hz (Q factor width)
  confidence: number; // 0-1
  frequencyResponse: FrequencyPoint[];
}

export interface FrequencyPoint {
  frequency: number;
  amplitude: number;
  timestamp: number;
}

export interface ScanConfig {
  minFrequency?: number;
  maxFrequency?: number;
  resolution?: number; // Number of test points
  testDuration?: number; // Duration per frequency (ms)
  useMicFeedback?: boolean;
}

export class ResonanceScan {
  private audioEngine: AudioEngine;
  private sweepGenerator: FrequencySweep;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.sweepGenerator = new FrequencySweep(audioEngine);
  }

  /**
   * Perform full resonance scan
   */
  async scan(
    config: ScanConfig = {},
    onProgress?: (progress: number, currentFreq: number) => void,
  ): Promise<ResonanceResult> {
    const {
      minFrequency = 100,
      maxFrequency = 2000,
      resolution = 30,
      testDuration = 200,
      useMicFeedback = false,
    } = config;

    const frequencies = this.generateTestFrequencies(minFrequency, maxFrequency, resolution);
    const frequencyResponse: FrequencyPoint[] = [];

    // Test each frequency
    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      onProgress?.(i / frequencies.length, freq);

      // Play test tone
      await this.audioEngine.playTone({
        frequency: freq,
        duration: testDuration,
        gain: 0.5,
        waveform: 'sine',
      });

      // Measure response
      const amplitude = useMicFeedback
        ? await this.measureMicrophoneResponse()
        : this.simulateResponse(freq);

      frequencyResponse.push({
        frequency: freq,
        amplitude,
        timestamp: Date.now(),
      });

      // Short pause between tests
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    onProgress?.(1, maxFrequency);

    // Analyze results
    return this.analyzeFrequencyResponse(frequencyResponse);
  }

  /**
   * Quick scan (fewer test points, faster)
   */
  async quickScan(
    onProgress?: (progress: number, currentFreq: number) => void,
  ): Promise<ResonanceResult> {
    return this.scan(
      {
        minFrequency: 120,
        maxFrequency: 800,
        resolution: 15,
        testDuration: 150,
      },
      onProgress,
    );
  }

  /**
   * Deep scan (more test points, higher accuracy)
   */
  async deepScan(
    onProgress?: (progress: number, currentFreq: number) => void,
  ): Promise<ResonanceResult> {
    return this.scan(
      {
        minFrequency: 80,
        maxFrequency: 3000,
        resolution: 50,
        testDuration: 300,
      },
      onProgress,
    );
  }

  /**
   * Narrow scan around suspected peak
   */
  async narrowScan(
    centerFrequency: number,
    range = 100,
    onProgress?: (progress: number, currentFreq: number) => void,
  ): Promise<ResonanceResult> {
    return this.scan(
      {
        minFrequency: centerFrequency - range,
        maxFrequency: centerFrequency + range,
        resolution: 20,
        testDuration: 250,
      },
      onProgress,
    );
  }

  /**
   * Continuous sweep scan (faster but less accurate)
   */
  async sweepScan(
    minFrequency = 100,
    maxFrequency = 2000,
    duration = 5000,
    onProgress?: (progress: number) => void,
  ): Promise<ResonanceResult> {
    // Play continuous sweep while monitoring
    const startTime = Date.now();
    const frequencyResponse: FrequencyPoint[] = [];

    // Start sweep playback
    const sweepPromise = this.sweepGenerator.playSweep({
      fromHz: minFrequency,
      toHz: maxFrequency,
      duration,
      gain: 0.6,
      logarithmic: true,
    });

    // Monitor response during sweep
    const sampleInterval = 100; // Sample every 100ms
    const samples = Math.floor(duration / sampleInterval);

    for (let i = 0; i < samples; i++) {
      await new Promise((resolve) => setTimeout(resolve, sampleInterval));
      
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      // Calculate current frequency (logarithmic)
      const currentFreq = minFrequency * Math.pow(maxFrequency / minFrequency, progress);
      const amplitude = await this.measureMicrophoneResponse();

      frequencyResponse.push({
        frequency: currentFreq,
        amplitude,
        timestamp: Date.now(),
      });

      onProgress?.(progress);
    }

    await sweepPromise;

    return this.analyzeFrequencyResponse(frequencyResponse);
  }

  /**
   * Multi-harmonic scan
   * Tests fundamental and harmonics together
   */
  async harmonicScan(
    fundamental: number,
    harmonics = 3,
  ): Promise<{ fundamental: ResonanceResult; harmonics: ResonanceResult[] }> {
    const fundamentalResult = await this.narrowScan(fundamental, 50);
    
    const harmonicResults: ResonanceResult[] = [];
    for (let i = 2; i <= harmonics; i++) {
      const harmonicFreq = fundamental * i;
      const result = await this.narrowScan(harmonicFreq, 50);
      harmonicResults.push(result);
    }

    return {
      fundamental: fundamentalResult,
      harmonics: harmonicResults,
    };
  }

  /**
   * Generate test frequencies (logarithmically spaced)
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
   * Analyze frequency response to find peaks
   */
  private analyzeFrequencyResponse(data: FrequencyPoint[]): ResonanceResult {
    if (data.length === 0) {
      throw new Error('No frequency response data');
    }

    // Find peak amplitude
    let peakIndex = 0;
    let peakAmplitude = 0;

    for (let i = 0; i < data.length; i++) {
      if (data[i].amplitude > peakAmplitude) {
        peakAmplitude = data[i].amplitude;
        peakIndex = i;
      }
    }

    const peakFrequency = data[peakIndex].frequency;

    // Calculate bandwidth (frequencies within 3dB of peak)
    const threshold = peakAmplitude * 0.707; // -3dB
    let lowFreq = peakFrequency;
    let highFreq = peakFrequency;

    // Search downward
    for (let i = peakIndex; i >= 0; i--) {
      if (data[i].amplitude < threshold) {
        lowFreq = data[i].frequency;
        break;
      }
    }

    // Search upward
    for (let i = peakIndex; i < data.length; i++) {
      if (data[i].amplitude < threshold) {
        highFreq = data[i].frequency;
        break;
      }
    }

    const bandwidth = highFreq - lowFreq;

    // Calculate confidence based on peak prominence
    const avgAmplitude = data.reduce((sum, point) => sum + point.amplitude, 0) / data.length;
    const confidence = Math.min(1, (peakAmplitude - avgAmplitude) / avgAmplitude);

    return {
      peakFrequency,
      peakAmplitude,
      bandwidth,
      confidence,
      frequencyResponse: data,
    };
  }

  /**
   * Measure microphone response (placeholder)
   * In production, this would use expo-audio recording
   */
  private async measureMicrophoneResponse(): Promise<number> {
    // Placeholder: return random value
    // Real implementation would:
    // 1. Record audio from microphone
    // 2. Calculate RMS amplitude
    // 3. Apply FFT to isolate test frequency
    // 4. Return amplitude at test frequency
    
    return Math.random();
  }

  /**
   * Simulate speaker response curve
   * Used when microphone feedback is not available
   */
  private simulateResponse(frequency: number): number {
    // Typical phone speaker response curve
    // Peak around 800-1200 Hz, roll-off at extremes
    
    const peakFreq = 1000;
    const peakWidth = 500;
    
    // Gaussian-like response
    const x = (frequency - peakFreq) / peakWidth;
    const response = Math.exp(-x * x);
    
    // Add some noise
    const noise = (Math.random() - 0.5) * 0.1;
    
    return Math.max(0, Math.min(1, response + noise));
  }

  /**
   * Calculate Q factor (quality factor)
   * Higher Q = narrower, more pronounced peak
   */
  static calculateQFactor(peakFrequency: number, bandwidth: number): number {
    return peakFrequency / bandwidth;
  }

  /**
   * Recommend optimal cleaning frequency based on resonance
   */
  static recommendCleaningFrequency(resonance: ResonanceResult): number {
    // Use frequency slightly below peak to avoid overdrive
    return Math.round(resonance.peakFrequency * 0.9);
  }
}

