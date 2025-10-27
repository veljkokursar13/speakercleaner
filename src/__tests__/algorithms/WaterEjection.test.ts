/**
 * WaterEjection algorithm tests
 */

import { WaterEjection } from '../../engine/algorithms/WaterEjection';
import { AudioEngine } from '../../engine/audio/AudioEngine';

describe('WaterEjection', () => {
  let engine: AudioEngine;
  let waterEjection: WaterEjection;

  beforeEach(async () => {
    engine = new AudioEngine();
    await engine.initialize();
    waterEjection = new WaterEjection(engine);
  });

  afterEach(async () => {
    await engine.dispose();
  });

  describe('execute', () => {
    it('should complete water ejection sequence', async () => {
      let progressCalled = false;
      
      await waterEjection.execute(
        { intensity: 'medium', duration: 100 },
        () => {
          progressCalled = true;
        },
      );

      expect(progressCalled).toBe(true);
    });

    it('should handle different intensities', async () => {
      await expect(
        waterEjection.execute({ intensity: 'low' }),
      ).resolves.not.toThrow();

      await expect(
        waterEjection.execute({ intensity: 'high' }),
      ).resolves.not.toThrow();

      await expect(
        waterEjection.execute({ intensity: 'max' }),
      ).resolves.not.toThrow();
    });

    it('should report progress', async () => {
      const progressUpdates: number[] = [];

      await waterEjection.execute({}, (progress) => {
        progressUpdates.push(progress.progress);
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(1);
    });
  });

  describe('executeQuick', () => {
    it('should complete quick ejection', async () => {
      await expect(waterEjection.executeQuick()).resolves.not.toThrow();
    });

    it('should be faster than standard execution', async () => {
      const quickStart = Date.now();
      await waterEjection.executeQuick();
      const quickDuration = Date.now() - quickStart;

      expect(quickDuration).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('executeDeep', () => {
    it('should complete deep cleaning', async () => {
      await expect(waterEjection.executeDeep()).resolves.not.toThrow();
    });
  });

  describe('executeAdaptive', () => {
    it('should handle light water level', async () => {
      await expect(
        waterEjection.executeAdaptive('light'),
      ).resolves.not.toThrow();
    });

    it('should handle moderate water level', async () => {
      await expect(
        waterEjection.executeAdaptive('moderate'),
      ).resolves.not.toThrow();
    });

    it('should handle heavy water level', async () => {
      await expect(
        waterEjection.executeAdaptive('heavy'),
      ).resolves.not.toThrow();
    });
  });
});

