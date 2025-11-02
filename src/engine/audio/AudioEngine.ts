/**
 * AudioEngine - Core audio synthesis engine using native bridge
 * 
 * This is the primary interface for real-time audio generation.
 * Uses native iOS (AVAudioEngine) and Android (AudioTrack) for low latency.
 */

import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const { ExpoAudioEngineModule } = NativeModules;

// Detect if running in Expo Go (native module won't be available)
// Check both module existence and execution environment
const isExpoGo = !ExpoAudioEngineModule || 
  (Constants.executionEnvironment === 'storeClient');

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

export interface ContinuousToneParameters {
  frequency: number; // Hz
  gain: number; // 0.0 - 1.0
  waveform?: WaveformType;
}

export interface MultiToneParameters {
  frequencies: number[]; // Hz array
  duration: number; // ms
  gains?: number[]; // Optional gain per frequency (defaults to equal distribution)
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
      if (isExpoGo) {
        console.log('[AudioEngine] Running in Expo Go - using console.log fallback');
        this.isInitialized = true;
        return;
      }

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await ExpoAudioEngineModule?.initialize(this.config);
      } else {
        // Web fallback using Web Audio API
        await this.initializeWebAudio();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('[AudioEngine] Initialization failed:', error);
      // In Expo Go, just mark as initialized anyway
      if (isExpoGo) {
        this.isInitialized = true;
        return;
      }
      throw new Error('Failed to initialize audio engine');
    }
  }

  /**
   * Play a single tone
   */
  async playTone(params: ToneParameters): Promise<void> {
    this.ensureInitialized();
    
    const normalized = this.normalizeToneParams(params);
    
    if (isExpoGo) {
      console.log(`[AudioEngine] 🔊 Playing tone: ${normalized.frequency}Hz, ${normalized.duration}ms, ${normalized.waveform}, gain: ${normalized.gain}`);
      this.isPlaying = true;
      // Simulate duration
      await new Promise(resolve => setTimeout(resolve, normalized.duration));
      this.isPlaying = false;
      return;
    }
    
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

    if (isExpoGo) {
      console.log(`[AudioEngine] 🔊 Playing sweep: ${normalized.fromHz}Hz → ${normalized.toHz}Hz, ${normalized.duration}ms, ${normalized.waveform}`);
      this.isPlaying = true;
      await new Promise(resolve => setTimeout(resolve, normalized.duration));
      this.isPlaying = false;
      return;
    }

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

    if (isExpoGo) {
      console.log(`[AudioEngine] 🔊 Playing multi-tone: ${normalized.frequencies.join(', ')}Hz, ${normalized.duration}ms`);
      this.isPlaying = true;
      await new Promise(resolve => setTimeout(resolve, normalized.duration));
      this.isPlaying = false;
      return;
    }

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
   * Play a continuous tone until stop() is called
   * Useful for manual mode where user controls playback
   */
  async playContinuousTone(params: ContinuousToneParameters): Promise<void> {
    this.ensureInitialized();
    
    const normalized = {
      frequency: Math.max(20, Math.min(20000, params.frequency)),
      gain: Math.max(0, Math.min(1, params.gain)),
      waveform: params.waveform ?? 'sine',
    };

    if (isExpoGo) {
      console.log(`[AudioEngine] 🔊 Playing continuous tone: ${normalized.frequency}Hz, ${normalized.waveform}, gain: ${normalized.gain}`);
      this.isPlaying = true;
      // Don't auto-stop - wait for stop() call
      return;
    }

    try {
      this.isPlaying = true;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // For native, use a very long duration (1 hour) to simulate continuous
        // Don't await - let it play in background and stop() will interrupt it
        ExpoAudioEngineModule?.playTone({
          frequency: normalized.frequency,
          duration: 3600000, // 1 hour - will be stopped by stop() call
          gain: normalized.gain,
          waveform: normalized.waveform,
          fadeIn: 10,
          fadeOut: 0, // No fade out for continuous
        }).catch(() => {
          // If interrupted, that's fine - stop() was called
          this.isPlaying = false;
        });
        // Return immediately - don't wait for completion
        return;
      } else {
        await this.playContinuousToneWeb(normalized);
      }
    } catch (error) {
      this.isPlaying = false;
      throw error;
    }
  }

  /**
   * Stop current playback
   */
  async stop(): Promise<void> {
    if (!this.isPlaying && !this.continuousOscillator) return;

    if (isExpoGo) {
      console.log('[AudioEngine] ⏹️ Stopping audio playback');
      this.isPlaying = false;
      return;
    }

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
    
    if (isExpoGo) {
      console.log('[AudioEngine] 🗑️ Disposing audio engine');
      this.isInitialized = false;
      return;
    }

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
  private continuousOscillator?: OscillatorNode;
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

  private async playContinuousToneWeb(params: Required<ContinuousToneParameters>): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    // Stop any existing continuous tone
    if (this.continuousOscillator) {
      this.stopWeb();
    }

    // Create oscillator for continuous playback
    this.continuousOscillator = this.audioContext.createOscillator();
    this.continuousOscillator.type = this.mapWaveformToOscillatorType(params.waveform);
    this.continuousOscillator.frequency.value = params.frequency;
    
    // Set gain
    this.gainNode.gain.value = params.gain;
    
    // Connect and start
    this.continuousOscillator.connect(this.gainNode);
    this.continuousOscillator.start();
  }

  private mapWaveformToOscillatorType(waveform: WaveformType): OscillatorType {
    switch (waveform) {
      case 'sine':
        return 'sine';
      case 'square':
        return 'square';
      case 'triangle':
        return 'triangle';
      case 'sawtooth':
        return 'sawtooth';
      default:
        return 'sine';
    }
  }

  private stopWeb(): void {
    // Stop continuous oscillator if playing
    if (this.continuousOscillator) {
      try {
        this.continuousOscillator.stop();
        this.continuousOscillator.disconnect();
      } catch (error) {
        console.error('[AudioEngine] Error stopping continuous oscillator:', error);
      }
      this.continuousOscillator = undefined;
    }

    // Stop buffer source if playing
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        console.error('[AudioEngine] Error stopping playback:', error);
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

