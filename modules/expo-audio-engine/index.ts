/**
 * Expo Audio Engine Module
 * 
 * Native bridge for low-latency audio synthesis on iOS and Android.
 * Provides direct access to AVAudioEngine (iOS) and AudioTrack (Android).
 */

import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'expo-audio-engine' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- Run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const ExpoAudioEngineModule = isTurboModuleEnabled
  ? require('./NativeExpoAudioEngine').default
  : NativeModules.ExpoAudioEngineModule;

const ExpoAudioEngine = ExpoAudioEngineModule
  ? ExpoAudioEngineModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

export interface AudioEngineConfig {
  sampleRate: number;
  bufferSize: number;
  enableHaptics: boolean;
}

export interface ToneParams {
  frequency: number;
  duration: number;
  gain: number;
  waveform: 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';
  fadeIn: number;
  fadeOut: number;
}

export interface SweepParams {
  fromHz: number;
  toHz: number;
  duration: number;
  gain: number;
  logarithmic: boolean;
  waveform: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

export interface MultiToneParams {
  frequencies: number[];
  gains: number[];
  duration: number;
  waveform: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

/**
 * Initialize the audio engine
 */
export function initialize(config: AudioEngineConfig): Promise<void> {
  return ExpoAudioEngine.initialize(config);
}

/**
 * Play a single tone
 */
export function playTone(params: ToneParams): Promise<void> {
  return ExpoAudioEngine.playTone(params);
}

/**
 * Play a frequency sweep
 */
export function playSweep(params: SweepParams): Promise<void> {
  return ExpoAudioEngine.playSweep(params);
}

/**
 * Play multiple tones simultaneously
 */
export function playMultiTone(params: MultiToneParams): Promise<void> {
  return ExpoAudioEngine.playMultiTone(params);
}

/**
 * Stop current playback
 */
export function stop(): Promise<void> {
  return ExpoAudioEngine.stop();
}

/**
 * Dispose and release resources
 */
export function dispose(): Promise<void> {
  return ExpoAudioEngine.dispose();
}

/**
 * Check if audio engine is available
 */
export function isAvailable(): boolean {
  return ExpoAudioEngineModule != null;
}

export default {
  initialize,
  playTone,
  playSweep,
  playMultiTone,
  stop,
  dispose,
  isAvailable,
};

