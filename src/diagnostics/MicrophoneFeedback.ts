/**
 * MicrophoneFeedback - Real-time audio monitoring
 * 
 * Uses device microphone to monitor speaker output,
 * enabling closed-loop cleaning optimization.
 */

import { Audio } from 'expo-av';

export interface AudioAnalysis {
  rms: number; // Root mean square amplitude
  peak: number; // Peak amplitude
  frequency: number; // Dominant frequency (Hz)
  clarity: number; // Signal clarity (0-1)
  timestamp: number;
}

export interface MonitoringSession {
  duration: number; // ms
  sampleRate: number; // Hz
  samples: AudioAnalysis[];
  avgRMS: number;
  avgClarity: number;
}

export class MicrophoneFeedback {
  private recording: Audio.Recording | null = null;
  private isMonitoring = false;
  private samples: AudioAnalysis[] = [];

  /**
   * Initialize microphone access
   */
  async initialize(): Promise<void> {
    // Request microphone permissions
    const { status } = await Audio.requestPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Microphone permission not granted');
    }

    // Configure audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }

  /**
   * Start monitoring speaker output
   */
  async startMonitoring(sampleIntervalMs = 100): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    try {
      // Create recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 48000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 48000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await this.recording.startAsync();
      this.isMonitoring = true;
      this.samples = [];

      // Start periodic sampling
      this.startPeriodicSampling(sampleIntervalMs);
    } catch (error) {
      console.error('[MicrophoneFeedback] Failed to start monitoring:', error);
      throw new Error('Failed to start microphone monitoring');
    }
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<MonitoringSession> {
    if (!this.isMonitoring || !this.recording) {
      throw new Error('Not currently monitoring');
    }

    this.isMonitoring = false;

    try {
      await this.recording.stopAndUnloadAsync();
    } catch (error) {
      console.warn('[MicrophoneFeedback] Error stopping recording:', error);
    }

    const duration = this.samples.length > 0
      ? this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp
      : 0;

    const avgRMS = this.samples.reduce((sum, s) => sum + s.rms, 0) / (this.samples.length || 1);
    const avgClarity =
      this.samples.reduce((sum, s) => sum + s.clarity, 0) / (this.samples.length || 1);

    const session: MonitoringSession = {
      duration,
      sampleRate: 48000,
      samples: [...this.samples],
      avgRMS,
      avgClarity,
    };

    this.recording = null;
    this.samples = [];

    return session;
  }

  /**
   * Get current audio level (real-time)
   */
  async getCurrentLevel(): Promise<number> {
    if (!this.recording || !this.isMonitoring) {
      return 0;
    }

    try {
      const status = await this.recording.getStatusAsync();
      if ('metering' in status && status.metering !== undefined) {
        // iOS provides metering in dB (-160 to 0)
        // Convert to 0-1 range
        return Math.pow(10, status.metering / 20);
      }
    } catch (error) {
      console.warn('[MicrophoneFeedback] Error getting level:', error);
    }

    return 0;
  }

  /**
   * Analyze current audio sample
   */
  async analyzeCurrent(): Promise<AudioAnalysis> {
    const level = await this.getCurrentLevel();
    
    // In production, this would perform FFT and detailed analysis
    // For now, return simplified analysis
    const analysis: AudioAnalysis = {
      rms: level,
      peak: level * 1.2,
      frequency: 1000, // Placeholder
      clarity: level > 0.1 ? 0.7 : 0.3,
      timestamp: Date.now(),
    };

    return analysis;
  }

  /**
   * Start periodic sampling
   */
  private startPeriodicSampling(intervalMs: number): void {
    const sampleTimer = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(sampleTimer);
        return;
      }

      try {
        const analysis = await this.analyzeCurrent();
        this.samples.push(analysis);

        // Limit sample history
        if (this.samples.length > 1000) {
          this.samples.shift();
        }
      } catch (error) {
        console.warn('[MicrophoneFeedback] Sampling error:', error);
      }
    }, intervalMs);
  }

  /**
   * Calculate SPL estimate from RMS
   */
  static calculateSPL(rms: number, reference = 0.00002): number {
    // SPL = 20 * log10(rms / reference)
    // reference = 20 μPa (threshold of hearing)
    
    if (rms <= 0) {
      return 0;
    }

    return 20 * Math.log10(rms / reference);
  }

  /**
   * Detect frequency from time-domain signal (autocorrelation)
   */
  static detectFrequency(samples: Float32Array, sampleRate: number): number {
    // Simplified pitch detection
    // In production, use FFT or more robust algorithm (YIN, etc.)
    
    const minFreq = 80;
    const maxFreq = 4000;
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    let bestPeriod = 0;
    let bestCorrelation = 0;

    // Autocorrelation
    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      
      for (let i = 0; i < samples.length - period; i++) {
        correlation += samples[i] * samples[i + period];
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  /**
   * Calculate signal clarity (SNR estimate)
   */
  static calculateClarity(samples: AudioAnalysis[]): number {
    if (samples.length === 0) {
      return 0;
    }

    // Calculate signal strength
    const avgRMS = samples.reduce((sum, s) => sum + s.rms, 0) / samples.length;
    
    // Calculate noise (variance)
    const variance =
      samples.reduce((sum, s) => sum + Math.pow(s.rms - avgRMS, 2), 0) / samples.length;
    const noise = Math.sqrt(variance);

    // SNR ratio
    const snr = avgRMS / (noise + 0.001); // Avoid division by zero

    // Normalize to 0-1
    return Math.min(1, snr / 10);
  }

  /**
   * Compare before/after sessions
   */
  static compareSessions(
    before: MonitoringSession,
    after: MonitoringSession,
  ): {
    rmsImprovement: number;
    clarityImprovement: number;
    message: string;
  } {
    const rmsImprovement = (after.avgRMS - before.avgRMS) / before.avgRMS;
    const clarityImprovement = (after.avgClarity - before.avgClarity) / before.avgClarity;

    let message = '';
    if (rmsImprovement > 0.2 && clarityImprovement > 0.15) {
      message = 'Significant improvement in both volume and clarity!';
    } else if (rmsImprovement > 0.1) {
      message = 'Speaker output increased.';
    } else if (clarityImprovement > 0.1) {
      message = 'Audio clarity improved.';
    } else if (rmsImprovement > 0 || clarityImprovement > 0) {
      message = 'Slight improvement detected.';
    } else {
      message = 'No significant improvement. Try different cleaning method.';
    }

    return {
      rmsImprovement,
      clarityImprovement,
      message,
    };
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.isMonitoring) {
      await this.stopMonitoring();
    }

    this.recording = null;
    this.samples = [];
  }
}

