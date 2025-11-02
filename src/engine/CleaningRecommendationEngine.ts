import { VisualizerMode } from '../components/visualizer/VisualizerManager';
import { SpeakerHealthReport } from '../modes/smart/analyzer/MicAnalyzer';

// Simplified issue type based on speaker health analysis
export type IssueType = 'water' | 'dust' | 'blockage' | 'damage' | 'none';

export interface DiagnosticResult {
  health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number;
  primaryIssue: IssueType;
  confidence: number;
  speakerReport: SpeakerHealthReport;
}

export interface CleaningRecommendation {
  mode: VisualizerMode;
  intensity: number; // 0.5-1.0
  duration: number; // seconds
  cycles: number;
  reason: string;
  caution?: string;
}

export class CleaningRecommendationEngine {
  /**
   * Generate cleaning recommendation based on diagnostic results
   */
  static recommend(diagnostic: DiagnosticResult): CleaningRecommendation {
    const { primaryIssue, healthScore, confidence } = diagnostic;

    // Low confidence = conservative approach
    if (confidence < 0.6) {
      return this.getConservativeRecommendation();
    }

    // Route to issue-specific recommendations
    return this.getRecommendationForIssue(primaryIssue, healthScore);
  }

  /**
   * Get recommendation based on specific issue type
   */
  private static getRecommendationForIssue(
    issue: IssueType,
    healthScore: number
  ): CleaningRecommendation {
    switch (issue) {
      case 'water':
        return {
          mode: 'pulse',
          intensity: 0.9,
          duration: 30,
          cycles: 3,
          reason: 'Water ejection requires strong low-frequency pulses to displace liquid from speaker cavity',
        };

      case 'dust':
        return {
          mode: 'vibe',
          intensity: 0.7,
          duration: 20,
          cycles: 2,
          reason: 'Dust particles respond best to sustained mid-frequency vibration to loosen and remove debris',
        };

      case 'blockage':
        return {
          mode: 'quantum',
          intensity: 1.0,
          duration: 45,
          cycles: 4,
          reason: 'Physical blockages require varied multi-frequency patterns to break up and dislodge debris',
        };

      case 'damage':
        return {
          mode: 'vibe',
          intensity: 0.4,
          duration: 15,
          cycles: 1,
          reason: 'Gentle cleaning recommended to avoid further stress on potentially damaged speaker membrane',
          caution: '⚠️ Hardware damage detected. If cleaning doesn\'t improve audio, consider professional repair.',
        };

      case 'none':
        // Preventive maintenance based on health score
        if (healthScore >= 90) {
          return {
            mode: 'vibe',
            intensity: 0.5,
            duration: 10,
            cycles: 1,
            reason: 'Light maintenance cleaning - speaker health is excellent',
          };
        } else {
          return {
            mode: 'vibe',
            intensity: 0.6,
            duration: 15,
            cycles: 1,
            reason: 'Routine maintenance cleaning to preserve speaker quality',
          };
        }

      default:
        return this.getConservativeRecommendation();
    }
  }

  /**
   * Conservative recommendation for uncertain diagnoses
   */
  private static getConservativeRecommendation(): CleaningRecommendation {
    return {
      mode: 'vibe',
      intensity: 0.6,
      duration: 15,
      cycles: 1,
      reason: 'Safe general cleaning - diagnostic confidence was low, using conservative approach',
    };
  }

  /**
   * Get intensity adjustment based on health score
   */
  static adjustIntensityForHealth(
    baseIntensity: number,
    healthScore: number
  ): number {
    // Reduce intensity for very poor health to avoid damage
    if (healthScore < 40) {
      return Math.min(baseIntensity, 0.7);
    }
    
    // Slightly reduce for poor health
    if (healthScore < 60) {
      return Math.min(baseIntensity, 0.85);
    }

    return baseIntensity;
  }

  /**
   * Get recommended visualizer mode icon/emoji
   */
  static getModeIcon(mode: VisualizerMode): string {
    const icons: Record<VisualizerMode, string> = {
      vibe: '🌊',
      pulse: '⚡',
      quantum: '✨',
    };
    return icons[mode];
  }

  /**
   * Get issue severity color for UI
   */
  static getIssueColor(issue: IssueType): string {
    const colors: Record<IssueType, string> = {
      water: '#00B2FF', // Cyan
      dust: '#FFD600', // Gold
      blockage: '#FF0077', // Magenta
      damage: '#FF6B00', // Orange
      none: '#00FFA3', // Green
    };
    return colors[issue];
  }
}

