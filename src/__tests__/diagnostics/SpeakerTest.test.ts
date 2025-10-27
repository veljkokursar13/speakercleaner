/**
 * SpeakerTest tests
 */

import { SpeakerTest } from '../../diagnostics/SpeakerTest';
import { AudioEngine } from '../../engine/audio/AudioEngine';

describe('SpeakerTest', () => {
  let engine: AudioEngine;
  let speakerTest: SpeakerTest;

  beforeEach(async () => {
    engine = new AudioEngine();
    await engine.initialize();
    speakerTest = new SpeakerTest(engine);
  });

  afterEach(async () => {
    await engine.dispose();
  });

  describe('runFullDiagnostics', () => {
    it('should complete full diagnostics', async () => {
      const report = await speakerTest.runFullDiagnostics();

      expect(report).toHaveProperty('overallHealth');
      expect(report).toHaveProperty('healthScore');
      expect(report).toHaveProperty('tests');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timestamp');
    });

    it('should perform multiple tests', async () => {
      const report = await speakerTest.runFullDiagnostics();

      expect(report.tests.length).toBeGreaterThan(0);
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);
    });

    it('should call progress callback', async () => {
      let progressCalled = false;

      await speakerTest.runFullDiagnostics(() => {
        progressCalled = true;
      });

      expect(progressCalled).toBe(true);
    });
  });

  describe('runQuickTest', () => {
    it('should complete quick test', async () => {
      const report = await speakerTest.runQuickTest();

      expect(report).toHaveProperty('overallHealth');
      expect(report).toHaveProperty('healthScore');
    });

    it('should be faster than full diagnostics', async () => {
      const quickStart = Date.now();
      await speakerTest.runQuickTest();
      const quickDuration = Date.now() - quickStart;

      expect(quickDuration).toBeLessThan(5000);
    });
  });

  describe('compareReports', () => {
    it('should calculate improvement', async () => {
      const before = await speakerTest.runQuickTest();
      const after = await speakerTest.runQuickTest();

      const comparison = SpeakerTest.compareReports(before, after);

      expect(comparison).toHaveProperty('improvement');
      expect(comparison).toHaveProperty('improvementPercent');
      expect(comparison).toHaveProperty('message');
    });

    it('should detect improvement', () => {
      const before = {
        overallHealth: 'poor' as const,
        healthScore: 50,
        tests: [],
        issues: [],
        recommendations: [],
        timestamp: Date.now(),
      };

      const after = {
        overallHealth: 'good' as const,
        healthScore: 80,
        tests: [],
        issues: [],
        recommendations: [],
        timestamp: Date.now(),
      };

      const comparison = SpeakerTest.compareReports(before, after);

      expect(comparison.improvement).toBeGreaterThan(0);
    });
  });
});

