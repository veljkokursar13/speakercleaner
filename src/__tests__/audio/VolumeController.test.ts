/**
 * VolumeController tests
 */

import { VolumeController } from '../../engine/audio/VolumeController';

describe('VolumeController', () => {
  let controller: VolumeController;

  beforeEach(() => {
    controller = new VolumeController({
      maxGain: 0.85,
      enableLimiter: true,
      enableNormalization: true,
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(controller.initialize()).resolves.not.toThrow();
    });
  });

  describe('performSafetyCheck', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    it('should return safety check report', async () => {
      const report = await controller.performSafetyCheck();
      
      expect(report).toHaveProperty('isHeadphonesConnected');
      expect(report).toHaveProperty('currentVolume');
      expect(report).toHaveProperty('isSafe');
      expect(report).toHaveProperty('warnings');
    });
  });

  describe('calculateSafeGain', () => {
    it('should limit gain to maxGain', () => {
      const safeGain = controller.calculateSafeGain(1000, 1.0);
      expect(safeGain).toBeLessThanOrEqual(0.85);
    });

    it('should reduce gain for high frequencies', () => {
      const normalGain = controller.calculateSafeGain(1000, 0.8);
      const highGain = controller.calculateSafeGain(15000, 0.8);
      
      expect(highGain).toBeLessThan(normalGain);
    });

    it('should reduce gain for low frequencies', () => {
      const normalGain = controller.calculateSafeGain(1000, 0.8);
      const lowGain = controller.calculateSafeGain(50, 0.8);
      
      expect(lowGain).toBeLessThan(normalGain);
    });

    it('should never return negative gain', () => {
      const gain = controller.calculateSafeGain(1000, -0.5);
      expect(gain).toBeGreaterThanOrEqual(0);
    });
  });

  describe('normalizeMultiToneGains', () => {
    it('should normalize gains exceeding limit', () => {
      const gains = [0.8, 0.8, 0.8];
      const normalized = controller.normalizeMultiToneGains([440, 880, 1320], gains);
      
      const rms = Math.sqrt(normalized.reduce((sum, g) => sum + g * g, 0));
      expect(rms).toBeLessThanOrEqual(1.0);
    });

    it('should not modify gains within limit', () => {
      const gains = [0.3, 0.3, 0.3];
      const normalized = controller.normalizeMultiToneGains([440, 880, 1320], gains);
      
      expect(normalized).toEqual(gains);
    });
  });

  describe('estimateSPL', () => {
    it('should estimate SPL from gain', () => {
      const spl = controller.estimateSPL(1000, 0.8);
      
      expect(spl).toBeGreaterThan(0);
      expect(spl).toBeLessThan(120); // Reasonable SPL range
    });

    it('should increase SPL with gain', () => {
      const lowSPL = controller.estimateSPL(1000, 0.5);
      const highSPL = controller.estimateSPL(1000, 1.0);
      
      expect(highSPL).toBeGreaterThan(lowSPL);
    });
  });

  describe('setMaxGain', () => {
    it('should update maxGain', () => {
      controller.setMaxGain(0.5);
      const safeGain = controller.calculateSafeGain(1000, 1.0);
      
      expect(safeGain).toBeLessThanOrEqual(0.5);
    });

    it('should clamp maxGain to 0-1', () => {
      controller.setMaxGain(1.5);
      const safeGain = controller.calculateSafeGain(1000, 1.0);
      
      expect(safeGain).toBeLessThanOrEqual(1.0);
    });
  });
});

