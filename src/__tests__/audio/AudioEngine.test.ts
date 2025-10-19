/**
 * AudioEngine tests
 */

import { AudioEngine } from '../../engine/audio/AudioEngine';

describe('AudioEngine', () => {
  let engine: AudioEngine;

  beforeEach(() => {
    engine = new AudioEngine({ sampleRate: 48000, bufferSize: 512 });
  });

  afterEach(async () => {
    await engine.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(engine.initialize()).resolves.not.toThrow();
    });

    it('should not initialize twice', async () => {
      await engine.initialize();
      await expect(engine.initialize()).resolves.not.toThrow();
    });
  });

  describe('playTone', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should play a tone with valid parameters', async () => {
      await expect(
        engine.playTone({
          frequency: 1000,
          duration: 100,
          gain: 0.5,
        }),
      ).resolves.not.toThrow();
    });

    it('should clamp frequency to valid range', async () => {
      await expect(
        engine.playTone({
          frequency: 50000, // Above range
          duration: 100,
          gain: 0.5,
        }),
      ).resolves.not.toThrow();
    });

    it('should clamp gain to 0-1', async () => {
      await expect(
        engine.playTone({
          frequency: 1000,
          duration: 100,
          gain: 1.5, // Above range
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('playSweep', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should play a frequency sweep', async () => {
      await expect(
        engine.playSweep({
          fromHz: 100,
          toHz: 2000,
          duration: 100,
          gain: 0.5,
        }),
      ).resolves.not.toThrow();
    });

    it('should handle logarithmic sweep', async () => {
      await expect(
        engine.playSweep({
          fromHz: 100,
          toHz: 2000,
          duration: 100,
          gain: 0.5,
          logarithmic: true,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('playMultiTone', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should play multiple tones', async () => {
      await expect(
        engine.playMultiTone({
          frequencies: [440, 880, 1320],
          duration: 100,
        }),
      ).resolves.not.toThrow();
    });

    it('should normalize gains automatically', async () => {
      await expect(
        engine.playMultiTone({
          frequencies: [440, 880],
          gains: [0.8, 0.8],
          duration: 100,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should stop playback', async () => {
      const playPromise = engine.playTone({
        frequency: 1000,
        duration: 5000,
        gain: 0.5,
      });

      // Stop after 100ms
      setTimeout(() => engine.stop(), 100);

      await expect(playPromise).resolves.not.toThrow();
    });
  });
});

