import { useState } from 'react';
import { MicMonitor, analyzeMicBuffer, assessSpeakerHealth } from './analyzer';
import { getGlobalAudioEngine } from '../../engine/audio/AudioEngine';
import {
  CleaningRecommendationEngine,
  type DiagnosticResult,
  type CleaningRecommendation,
} from '../../engine/CleaningRecommendationEngine';

/**
 * Smart Diagnosis Hook
 * Provides smart speaker analysis with AI-powered recommendations
 */
export function useDiagnosis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [recommendation, setRecommendation] = useState<CleaningRecommendation | null>(null);

  const runDiagnosis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);
    setRecommendation(null);

    try {
      // Step 1: Initialize audio engine
      setCurrentStep('Initializing audio engine');
      const engine = getGlobalAudioEngine();
      await engine.initialize();
      setProgress(0.2);

      // Step 2: Initialize microphone
      setCurrentStep('Initializing microphone');
      const monitor = new MicMonitor();
      const ok = await monitor.initialize();
      if (!ok) {
        throw new Error('Microphone permission denied');
      }
      await monitor.start(200);
      setProgress(0.35);

      // Step 3: Play reference tone
      setCurrentStep('Playing reference tone');
      await engine.playTone({
        frequency: 1000,
        duration: 1200,
        gain: 0.6,
        waveform: 'sine',
      });
      setProgress(0.55);

      // Step 4: Analyze microphone response
      setCurrentStep('Analyzing microphone response');
      const samplePack = await monitor.getSamplesForAnalysis();
      const { samples, sampleRate } = samplePack ?? {
        samples: new Float32Array(2048),
        sampleRate: 48000,
      };
      const { profile, anomalies } = await analyzeMicBuffer(samples, sampleRate);
      const speakerReport = assessSpeakerHealth(profile, anomalies);
      setProgress(0.75);

      // Step 5: Generate diagnostic and recommendation
      setCurrentStep('Generating recommendation');
      const primaryIssue: DiagnosticResult['primaryIssue'] = profile.lowBandDrop
        ? 'water'
        : profile.midBandDrop || profile.highBandDrop
        ? 'dust'
        : 'none';

      const diagnostic: DiagnosticResult = {
        health: speakerReport.overallHealth,
        healthScore: speakerReport.healthScore,
        primaryIssue,
        confidence: Math.min(0.95, 0.6 + anomalies.length * 0.05),
        speakerReport,
      };

      const rec = CleaningRecommendationEngine.recommend(diagnostic);

      setResult(diagnostic);
      setRecommendation(rec);
      setProgress(1);

      // Step 6: Cleanup
      await monitor.stop();
      await monitor.dispose();
      setCurrentStep('Complete');
    } catch (error) {
      console.error('[Diagnosis] Failed:', error);
      setCurrentStep('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setResult(null);
      setRecommendation(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setRecommendation(null);
    setProgress(0);
    setCurrentStep('');
  };

  return {
    // State
    isAnalyzing,
    progress,
    currentStep,
    result,
    recommendation,
    hasResult: result !== null,

    // Actions
    runDiagnosis,
    reset,
  };
}

