/**
 * DiagnosticOrchestrator - Coordinates diagnostic tests and analyzes results
 * 
 * Runs multiple diagnostic tests in sequence and combines results
 * to determine speaker health and primary issues.
 */

import { AudioEngine } from '../engine/audio/AudioEngine';
import { ImpedanceAnalyzer, ImpedanceResult } from './ImpedanceAnalyzer';
import { SpeakerHealthReport, SpeakerTest } from './SpeakerTest';

export type IssueType = 'water' | 'dust' | 'blockage' | 'damage' | 'none';

export interface DiagnosticResult {
  health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number; // 0-100
  primaryIssue: IssueType;
  issueDescription: string;
  confidence: number; // 0-1
  tests: {
    speaker: SpeakerHealthReport;
    impedance: ImpedanceResult;
  };
  timestamp: number;
}

export class DiagnosticOrchestrator {
  private speakerTest: SpeakerTest;
  private impedanceAnalyzer: ImpedanceAnalyzer;

  constructor(audioEngine: AudioEngine) {
    this.speakerTest = new SpeakerTest(audioEngine);
    this.impedanceAnalyzer = new ImpedanceAnalyzer(audioEngine);
  }

  /**
   * Run full diagnostic suite
   */
  async runDiagnostics(
    onProgress?: (step: string, progress: number) => void
  ): Promise<DiagnosticResult> {
    onProgress?.('Analyzing speaker response', 0.1);
    const speakerHealth = await this.speakerTest.runQuickTest();

    onProgress?.('Checking impedance', 0.5);
    const impedanceResult = await this.impedanceAnalyzer.quickCheck();

    onProgress?.('Processing results', 0.9);

    // Determine primary issue from combined results
    const primaryIssue = this.determinePrimaryIssue(speakerHealth, impedanceResult);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(speakerHealth, impedanceResult);

    onProgress?.('Complete', 1.0);

    return {
      health: speakerHealth.overallHealth,
      healthScore: speakerHealth.healthScore,
      primaryIssue,
      issueDescription: this.getIssueDescription(primaryIssue),
      confidence,
      tests: {
        speaker: speakerHealth,
        impedance: impedanceResult,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Quick diagnostic check (faster, less comprehensive)
   */
  async runQuickDiagnostic(): Promise<DiagnosticResult> {
    const speakerHealth = await this.speakerTest.runQuickTest();
    
    // Use placeholder impedance data for quick test
    const impedanceResult: ImpedanceResult = {
      estimatedImpedance: 8,
      blockageLevel: speakerHealth.healthScore < 60 ? 'moderate' : 'none',
      confidence: 0.7,
      resonantFrequency: 800,
      dampingFactor: 0.5,
      timestamp: Date.now(),
    };

    const primaryIssue = this.determinePrimaryIssue(speakerHealth, impedanceResult);

    return {
      health: speakerHealth.overallHealth,
      healthScore: speakerHealth.healthScore,
      primaryIssue,
      issueDescription: this.getIssueDescription(primaryIssue),
      confidence: 0.7,
      tests: {
        speaker: speakerHealth,
        impedance: impedanceResult,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Determine primary issue from test results
   */
  private determinePrimaryIssue(
    speaker: SpeakerHealthReport,
    impedance: ImpedanceResult
  ): IssueType {
    // Water detection: high blockage + low-frequency issues
    if (
      impedance.blockageLevel === 'high' &&
      speaker.tests.some((t) => t.name.toLowerCase().includes('low frequency') && !t.passed)
    ) {
      return 'water';
    }

    // Dust: mid-frequency issues + moderate blockage
    if (
      impedance.blockageLevel === 'moderate' &&
      speaker.tests.some((t) => t.name.toLowerCase().includes('mid frequency') && !t.passed)
    ) {
      return 'dust';
    }

    // Physical blockage: high impedance without specific frequency pattern
    if (impedance.blockageLevel === 'high') {
      return 'blockage';
    }

    // Damage: distortion without significant blockage
    if (
      speaker.tests.some((t) => t.name.toLowerCase().includes('distortion') && !t.passed) &&
      impedance.blockageLevel !== 'high'
    ) {
      return 'damage';
    }

    // No significant issues
    if (speaker.healthScore >= 75) {
      return 'none';
    }

    // Default to dust for moderate issues
    return 'dust';
  }

  /**
   * Calculate overall confidence based on test quality
   */
  private calculateConfidence(
    speaker: SpeakerHealthReport,
    impedance: ImpedanceResult
  ): number {
    // Average of impedance confidence and speaker test completeness
    const speakerConfidence = speaker.tests.length >= 3 ? 0.9 : 0.7;
    return (impedance.confidence + speakerConfidence) / 2;
  }

  /**
   * Get human-readable issue description
   */
  private getIssueDescription(issue: IssueType): string {
    const descriptions: Record<IssueType, string> = {
      water: 'Water detected in speaker cavity',
      dust: 'Dust accumulation on speaker membrane',
      blockage: 'Physical obstruction blocking speaker',
      damage: 'Possible speaker membrane damage detected',
      none: 'No significant issues detected',
    };
    return descriptions[issue];
  }
}

