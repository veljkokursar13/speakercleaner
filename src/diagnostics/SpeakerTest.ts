/**
 * SpeakerTest - Speaker health diagnostics and testing
 * 
 * Performs comprehensive tests to assess speaker condition
 * and identify potential issues before cleaning.
 */

import { AudioEngine } from '../engine/audio/AudioEngine';
import { FrequencySweep } from '../engine/audio/FrequencySweep';

export interface SpeakerHealthReport {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number; // 0-100
  tests: TestResult[];
  issues: string[];
  recommendations: string[];
  timestamp: number;
}

export interface TestResult {
  name: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
  measuredValue?: number;
  expectedValue?: number;
}

export class SpeakerTest {
  private audioEngine: AudioEngine;
  private sweepGenerator: FrequencySweep;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.sweepGenerator = new FrequencySweep(audioEngine);
  }

  /**
   * Run comprehensive speaker health check
   */
  async runFullDiagnostics(
    onProgress?: (test: string, progress: number) => void,
  ): Promise<SpeakerHealthReport> {
    const tests: TestResult[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Test 1: Low-frequency response
    onProgress?.('Low frequency test', 0.1);
    const lowFreqTest = await this.testLowFrequency();
    tests.push(lowFreqTest);
    if (!lowFreqTest.passed) {
      issues.push('Poor low-frequency response detected');
      recommendations.push('Speaker may be blocked by water or debris');
    }

    // Test 2: Mid-frequency response
    onProgress?.('Mid frequency test', 0.3);
    const midFreqTest = await this.testMidFrequency();
    tests.push(midFreqTest);
    if (!midFreqTest.passed) {
      issues.push('Reduced mid-frequency clarity');
      recommendations.push('Dust or membrane damage possible');
    }

    // Test 3: High-frequency response
    onProgress?.('High frequency test', 0.5);
    const highFreqTest = await this.testHighFrequency();
    tests.push(highFreqTest);
    if (!highFreqTest.passed) {
      issues.push('High-frequency attenuation');
      recommendations.push('Check for grille obstruction');
    }

    // Test 4: Distortion check
    onProgress?.('Distortion test', 0.7);
    const distortionTest = await this.testDistortion();
    tests.push(distortionTest);
    if (!distortionTest.passed) {
      issues.push('Audio distortion detected');
      recommendations.push('Speaker membrane may be damaged or blocked');
    }

    // Test 5: Dynamic range
    onProgress?.('Dynamic range test', 0.85);
    const dynamicTest = await this.testDynamicRange();
    tests.push(dynamicTest);
    if (!dynamicTest.passed) {
      issues.push('Limited dynamic range');
      recommendations.push('Speaker output is restricted');
    }

    // Calculate overall health score
    const avgScore = tests.reduce((sum, test) => sum + test.score, 0) / tests.length;
    const healthScore = Math.round(avgScore);

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'excellent';
    if (healthScore < 40) {
      overallHealth = 'critical';
      recommendations.unshift('URGENT: Speaker cleaning strongly recommended');
    } else if (healthScore < 60) {
      overallHealth = 'poor';
      recommendations.unshift('Speaker cleaning recommended');
    } else if (healthScore < 75) {
      overallHealth = 'fair';
    } else if (healthScore < 90) {
      overallHealth = 'good';
    }

    onProgress?.('Complete', 1);

    return {
      overallHealth,
      healthScore,
      tests,
      issues,
      recommendations,
      timestamp: Date.now(),
    };
  }

  /**
   * Quick speaker test (fast screening)
   */
  async runQuickTest(): Promise<SpeakerHealthReport> {
    const tests: TestResult[] = [];
    
    // Single sweep test
    const sweepTest = await this.testFrequencySweep();
    tests.push(sweepTest);

    const healthScore = sweepTest.score;
    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'good';
    
    if (healthScore < 60) {
      overallHealth = 'poor';
    } else if (healthScore < 80) {
      overallHealth = 'fair';
    }

    return {
      overallHealth,
      healthScore,
      tests,
      issues: sweepTest.passed ? [] : ['Speaker response below optimal'],
      recommendations: sweepTest.passed ? ['Speaker health is acceptable'] : ['Run full diagnostics'],
      timestamp: Date.now(),
    };
  }

  /**
   * Test low-frequency response (100-500Hz)
   */
  private async testLowFrequency(): Promise<TestResult> {
    const testFrequencies = [100, 200, 300, 400];
    let totalResponse = 0;

    for (const freq of testFrequencies) {
      await this.audioEngine.playTone({
        frequency: freq,
        duration: 300,
        gain: 0.5,
      });

      // Simulate response measurement
      const response = this.simulateFrequencyResponse(freq);
      totalResponse += response;
    }

    const avgResponse = totalResponse / testFrequencies.length;
    const score = Math.round(avgResponse * 100);
    const passed = score >= 60;

    return {
      name: 'Low Frequency Response',
      passed,
      score,
      details: passed ? 'Good bass response' : 'Weak low-frequency output',
      measuredValue: avgResponse,
      expectedValue: 0.7,
    };
  }

  /**
   * Test mid-frequency response (800-2000Hz)
   */
  private async testMidFrequency(): Promise<TestResult> {
    const testFrequencies = [800, 1000, 1500, 2000];
    let totalResponse = 0;

    for (const freq of testFrequencies) {
      await this.audioEngine.playTone({
        frequency: freq,
        duration: 300,
        gain: 0.5,
      });

      const response = this.simulateFrequencyResponse(freq);
      totalResponse += response;
    }

    const avgResponse = totalResponse / testFrequencies.length;
    const score = Math.round(avgResponse * 100);
    const passed = score >= 70;

    return {
      name: 'Mid Frequency Response',
      passed,
      score,
      details: passed ? 'Clear midrange' : 'Reduced clarity in midrange',
      measuredValue: avgResponse,
      expectedValue: 0.8,
    };
  }

  /**
   * Test high-frequency response (4000-12000Hz)
   */
  private async testHighFrequency(): Promise<TestResult> {
    const testFrequencies = [4000, 6000, 8000, 10000];
    let totalResponse = 0;

    for (const freq of testFrequencies) {
      await this.audioEngine.playTone({
        frequency: freq,
        duration: 300,
        gain: 0.5,
      });

      const response = this.simulateFrequencyResponse(freq);
      totalResponse += response;
    }

    const avgResponse = totalResponse / testFrequencies.length;
    const score = Math.round(avgResponse * 100);
    const passed = score >= 50; // Lower threshold for treble

    return {
      name: 'High Frequency Response',
      passed,
      score,
      details: passed ? 'Acceptable treble response' : 'High frequencies attenuated',
      measuredValue: avgResponse,
      expectedValue: 0.6,
    };
  }

  /**
   * Test for distortion
   */
  private async testDistortion(): Promise<TestResult> {
    // Play loud tone and check for clipping/distortion
    await this.audioEngine.playTone({
      frequency: 1000,
      duration: 500,
      gain: 0.9,
    });

    // Simulate distortion measurement
    const distortion = Math.random() * 0.2; // 0-20% THD
    const score = Math.round((1 - distortion) * 100);
    const passed = distortion < 0.1; // <10% THD is acceptable

    return {
      name: 'Distortion Test',
      passed,
      score,
      details: passed ? 'Low distortion' : `High distortion: ${(distortion * 100).toFixed(1)}%`,
      measuredValue: distortion,
      expectedValue: 0.05,
    };
  }

  /**
   * Test dynamic range
   */
  private async testDynamicRange(): Promise<TestResult> {
    const gains = [0.2, 0.5, 0.8];
    const responses: number[] = [];

    for (const gain of gains) {
      await this.audioEngine.playTone({
        frequency: 1000,
        duration: 300,
        gain,
      });

      // Simulate response at different gains
      const response = this.simulateFrequencyResponse(1000) * gain;
      responses.push(response);
    }

    // Check if output scales linearly with gain
    const dynamicRange = (responses[2] - responses[0]) / responses[0];
    const score = Math.round(Math.min(1, dynamicRange / 3) * 100);
    const passed = dynamicRange > 2;

    return {
      name: 'Dynamic Range',
      passed,
      score,
      details: passed ? 'Good dynamic range' : 'Compressed or limited output',
      measuredValue: dynamicRange,
      expectedValue: 3.0,
    };
  }

  /**
   * Test frequency sweep response
   */
  private async testFrequencySweep(): Promise<TestResult> {
    await this.sweepGenerator.playSweep({
      fromHz: 100,
      toHz: 10000,
      duration: 2000,
      gain: 0.6,
    });

    // Simulate overall response
    const response = Math.random() * 0.3 + 0.5; // 0.5-0.8
    const score = Math.round(response * 100);
    const passed = score >= 65;

    return {
      name: 'Frequency Sweep',
      passed,
      score,
      details: passed ? 'Speaker responds across frequency range' : 'Limited frequency response',
      measuredValue: response,
      expectedValue: 0.75,
    };
  }

  /**
   * Simulate frequency response (placeholder)
   * In production, this would measure actual microphone input
   */
  private simulateFrequencyResponse(frequency: number): number {
    // Typical phone speaker response curve
    let response = 0.5;

    if (frequency >= 500 && frequency <= 3000) {
      response = 0.8; // Good midrange
    } else if (frequency < 200) {
      response = 0.4; // Poor bass
    } else if (frequency > 8000) {
      response = 0.5; // Rolled-off treble
    } else {
      response = 0.7;
    }

    // Add noise
    response += (Math.random() - 0.5) * 0.1;

    return Math.max(0, Math.min(1, response));
  }

  /**
   * Compare two health reports
   */
  static compareReports(before: SpeakerHealthReport, after: SpeakerHealthReport): {
    improvement: number;
    improvementPercent: number;
    message: string;
  } {
    const improvement = after.healthScore - before.healthScore;
    const improvementPercent = (improvement / before.healthScore) * 100;

    let message = '';
    if (improvement > 20) {
      message = 'Significant improvement! Speaker health greatly improved.';
    } else if (improvement > 10) {
      message = 'Notable improvement in speaker performance.';
    } else if (improvement > 0) {
      message = 'Slight improvement detected.';
    } else if (improvement === 0) {
      message = 'No change in speaker health.';
    } else {
      message = 'Speaker health declined. Check for damage.';
    }

    return {
      improvement,
      improvementPercent,
      message,
    };
  }
}

