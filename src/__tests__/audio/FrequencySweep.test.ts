/**
 * FrequencySweep tests
 */

import { AudioEngine } from '../../engine/audio/AudioEngine';
import { FrequencySweep } from '../../engine/audio/FrequencySweep';

describe('FrequencySweep', () => {
  let engine: AudioEngine;
  let sweep: FrequencySweep;

  beforeEach(async () => {
    engine = new AudioEngine();
    await engine.initialize();
    sweep = new FrequencySweep(engine);
  });

  afterEach(async () => {
    await engine.dispose();
  });

  describe('playSweep', () => {
    it('should play a basic sweep', async () => {
      await expect(
        sweep.playSweep({
          fromHz: 100,
          toHz: 1000,
          duration: 100,
        }),
      ).resolves.not.toThrow();
    });

    it('should handle reverse sweep', async () => {
      await expect(
        sweep.playSweep({
          fromHz: 100,
          toHz: 1000,
          duration: 100,
          reverse: true,
        }),
      ).resolves.not.toThrow();
    });

    it('should handle ping-pong sweep', async () => {
      await expect(
        sweep.playSweep({
          fromHz: 100,
          toHz: 1000,
          duration: 100,
          pingPong: true,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('playMultiBandSweep', () => {
    it('should sweep through multiple bands', async () => {
      await expect(
        sweep.playMultiBandSweep(100, 1000, 3, 50),
      ).resolves.not.toThrow();
    });
  });

  describe('calculateOptimalDuration', () => {
    it('should calculate reasonable duration', () => {
      const duration = FrequencySweep.calculateOptimalDuration(100, 1000);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(30000);
    });

    it('should return minimum duration for wide range', () => {
      const duration = FrequencySweep.calculateOptimalDuration(100, 10000);
      expect(duration).toBeGreaterThanOrEqual(2000);
    });
  });
});

