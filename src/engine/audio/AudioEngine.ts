/**
 * AudioEngine - Core audio synthesis engine using native bridge
 * 
 * This is the primary interface for real-time audio generation.
 * Uses native iOS (AVAudioEngine) and Android (AudioTrack) for low latency.
 */

import { NativeModules, Platform } from 'react-native';

const { ExpoAudioEngineModule } = NativeModules;

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';

export interface AudioEngineConfig {
  sampleRate?: number; // Default: 48000
  bufferSize?: number; // Default: 512
  enableHaptics?: boolean;
}

export interface ToneParameters {
  frequency: number; // Hz
  duration: number; // ms
  gain: number; // 0.0 - 1.0
  waveform?: WaveformType;
  fadeIn?: number; // ms
  fadeOut?: number; // ms
}

export interface SweepParameters {
  fromHz: number;
  toHz: number;
  duration: number; // ms
  gain: number; // 0.0 - 1.0
  logarithmic?: boolean; // Default: true
  waveform?: WaveformType;
}

export interface MultiToneParameters {
  frequencies: number[]; // Array of Hz values
  duration: number; // ms
  gains?: number[]; // Individual gains, or uniform if not provided
  waveform?: WaveformType;
}

export class AudioEngine {
  private isInitialized = false;
  private isPlaying = false;
  private config: Required<AudioEngineConfig>;

  constructor(config: AudioEngineConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 48000,
      bufferSize: config.bufferSize ?? 512,
      enableHaptics: config.enableHaptics ?? true,
    };
  }

  /**
   * Initialize the audio engine
   * Must be called before any audio operations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await ExpoAudioEngineModule?.initialize(this.config);
      } else {
        // Web fallback using Web Audio API
        await this.initializeWebAudio();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('[AudioEngine] Initialization failed:', error);
      throw new Error('Failed to initialize audio engine');
    }
  }

  /**
   * Play a single tone
   */
  async playTone(params: ToneParameters): Promise<void> {
    this.ensureInitialized();
    
    const normalized = this.normalizeToneParams(params);
    
    try {
      this.isPlaying = true;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await ExpoAudioEngineModule?.playTone(normalized);
      } else {
        await this.playToneWeb(normalized);
      }
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Play a frequency sweep (linear or logarithmic)
   */
  async playSweep(params: SweepParameters): Promise<void> {
    this.ensureInitialized();
    
    const normalized = {
      ...params,
      logarithmic: params.logarithmic ?? true,
      waveform: params.waveform ?? 'sine',
    };

    try {
      this.isPlaying = true;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await ExpoAudioEngineModule?.playSweep(normalized);
      } else {
        await this.playSweepWeb(normalized);
      }
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Play multiple tones simultaneously (harmonics)
   */
  async playMultiTone(params: MultiToneParameters): Promise<void> {
    this.ensureInitialized();
    
    const normalized = {
      ...params,
      gains: params.gains ?? params.frequencies.map(() => 1.0 / params.frequencies.length),
      waveform: params.waveform ?? 'sine',
    };

    try {
      this.isPlaying = true;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await ExpoAudioEngineModule?.playMultiTone(normalized);
      } else {
        await this.playMultiToneWeb(normalized);
      }
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Stop current playback
   */
  async stop(): Promise<void> {
    if (!this.isPlaying) return;

    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await ExpoAudioEngineModule?.stop();
      } else {
        this.stopWeb();
      }
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Dispose and release all resources
   */
  async dispose(): Promise<void> {
    await this.stop();
    
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await ExpoAudioEngineModule?.dispose();
    } else {
      this.disposeWeb();
    }
    
    this.isInitialized = false;
  }

  /**
   * Check if engine is currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  // ==================== Private Methods ====================

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('AudioEngine not initialized. Call initialize() first.');
    }
  }

  private normalizeToneParams(params: ToneParameters): Required<ToneParameters> {
    return {
      frequency: Math.max(20, Math.min(20000, params.frequency)),
      duration: Math.max(0, params.duration),
      gain: Math.max(0, Math.min(1, params.gain)),
      waveform: params.waveform ?? 'sine',
      fadeIn: params.fadeIn ?? 10,
      fadeOut: params.fadeOut ?? 10,
    };
  }

  // ==================== Web Audio Fallback ====================
  
  private audioContext?: AudioContext;
  private currentSource?: AudioBufferSourceNode;
  private gainNode?: GainNode;

  private async initializeWebAudio(): Promise<void> {
    if (typeof window === 'undefined' || !window.AudioContext) {
      throw new Error('Web Audio API not supported');
    }
    this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  private async playToneWeb(params: Required<ToneParameters>): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    const duration = params.duration / 1000;
    const buffer = this.audioContext.createBuffer(1, this.config.sampleRate * duration, this.config.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate waveform
    for (let i = 0; i < data.length; i++) {
      const t = i / this.config.sampleRate;
      data[i] = this.generateWaveform(params.waveform, params.frequency, t) * params.gain;
    }

    // Apply fade in/out
    this.applyEnvelope(data, params.fadeIn / 1000, params.fadeOut / 1000, this.config.sampleRate);

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.gainNode);
    this.currentSource.start();

    await new Promise((resolve) => setTimeout(resolve, params.duration));
  }

  private async playSweepWeb(params: Required<SweepParameters>): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    const duration = params.duration / 1000;
    const buffer = this.audioContext.createBuffer(1, this.config.sampleRate * duration, this.config.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / this.config.sampleRate;
      const progress = t / duration;
      
      const frequency = params.logarithmic
        ? params.fromHz * Math.pow(params.toHz / params.fromHz, progress)
        : params.fromHz + (params.toHz - params.fromHz) * progress;

      data[i] = this.generateWaveform(params.waveform, frequency, t) * params.gain;
    }

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.gainNode);
    this.currentSource.start();

    await new Promise((resolve) => setTimeout(resolve, params.duration));
  }

  private async playMultiToneWeb(params: Required<MultiToneParameters>): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    const duration = params.duration / 1000;
    const buffer = this.audioContext.createBuffer(1, this.config.sampleRate * duration, this.config.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / this.config.sampleRate;
      let sample = 0;
      
      params.frequencies.forEach((freq, idx) => {
        const gain = params.gains[idx];
        sample += this.generateWaveform(params.waveform, freq, t) * gain;
      });

      data[i] = sample;
    }

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.gainNode);
    this.currentSource.start();

    await new Promise((resolve) => setTimeout(resolve, params.duration));
  }

  private generateWaveform(type: WaveformType, frequency: number, time: number): number {
    const phase = 2 * Math.PI * frequency * time;
    
    switch (type) {
      case 'sine':
        return Math.sin(phase);
      case 'square':
        return Math.sin(phase) > 0 ? 1 : -1;
      case 'triangle':
        return 2 * Math.abs(2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))) - 1;
      case 'sawtooth':
        return 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
      case 'noise':
        return Math.random() * 2 - 1;
      default:
        return Math.sin(phase);
    }
  }

  private applyEnvelope(data: Float32Array, fadeInSec: number, fadeOutSec: number, sampleRate: number): void {
    const fadeInSamples = fadeInSec * sampleRate;
    const fadeOutSamples = fadeOutSec * sampleRate;

    for (let i = 0; i < fadeInSamples && i < data.length; i++) {
      data[i] *= i / fadeInSamples;
    }

    for (let i = 0; i < fadeOutSamples && i < data.length; i++) {
      data[data.length - 1 - i] *= i / fadeOutSamples;
    }
  }

  private stopWeb(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      this.currentSource = undefined;
    }
  }

  private disposeWeb(): void {
    this.stopWeb();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }
    this.gainNode = undefined;
  }
}

// Singleton instance for convenience
let globalEngine: AudioEngine | null = null;

export function getGlobalAudioEngine(): AudioEngine {
  if (!globalEngine) {
    globalEngine = new AudioEngine();
  }
  return globalEngine;
}

export async function disposeGlobalAudioEngine(): Promise<void> {
  if (globalEngine) {
    await globalEngine.dispose();
    globalEngine = null;
  }
}

