import { cyberpunkTheme } from '@/constants/theme';
import GlowingFrame from '@/src/ui/components/GlowingFrame';
import NeonButton from '@/src/ui/components/NeonButton';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

// Placeholder types until we can import the real ones
type DiagnosticResult = {
  health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number;
  primaryIssue: 'water' | 'dust' | 'blockage' | 'damage' | 'none';
  issueDescription: string;
  confidence: number;
  timestamp: number;
};

type CleaningRecommendation = {
  mode: 'vibe' | 'pulse' | 'quantum';
  intensity: number;
  duration: number;
  cycles: number;
  reason: string;
  caution?: string;
};

export default function DiagnoseScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [recommendation, setRecommendation] = useState<CleaningRecommendation | null>(null);

  const runDiagnosis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    
    // Simulate diagnostic process (replace with real implementation)
    const steps = [
      { step: 'Initializing audio engine', delay: 500 },
      { step: 'Analyzing speaker response', delay: 1000 },
      { step: 'Checking impedance', delay: 1000 },
      { step: 'Processing results', delay: 500 },
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].step);
      setProgress((i + 1) / steps.length);
      await new Promise((resolve) => setTimeout(resolve, steps[i].delay));
    }

    // Simulated result (replace with real diagnostic)
    const mockResult: DiagnosticResult = {
      health: 'fair',
      healthScore: 68,
      primaryIssue: 'dust',
      issueDescription: 'Dust accumulation on speaker membrane',
      confidence: 0.82,
      timestamp: Date.now(),
    };

    const mockRecommendation: CleaningRecommendation = {
      mode: 'vibe',
      intensity: 0.7,
      duration: 20,
      cycles: 2,
      reason: 'Dust particles respond best to sustained mid-frequency vibration',
    };

    setResult(mockResult);
    setRecommendation(mockRecommendation);
    setIsAnalyzing(false);
  };

  const startCleaning = () => {
    if (!recommendation) return;
    
    // Navigate to auto screen with recommended settings
    router.push({
      pathname: '/auto',
      params: {
        mode: recommendation.mode,
        intensity: recommendation.intensity.toString(),
      },
    });
  };

  const getHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      excellent: cyberpunkTheme.acidGreen,
      good: '#00B2FF',
      fair: '#FFD600',
      poor: '#FF6B00',
      critical: '#FF0077',
    };
    return colors[health] || cyberpunkTheme.textSecondary;
  };

  const getModeIcon = (mode: string) => {
    const icons: Record<string, string> = {
      vibe: '🌊',
      pulse: '⚡',
      quantum: '✨',
    };
    return icons[mode] || '🔧';
  };

  return (
    <LinearGradient colors={cyberpunkTheme.backgroundGradient} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>QUANTUM DIAGNOSTIC</Text>
        <Text style={styles.subtitle}>AI-POWERED SPEAKER ANALYSIS</Text>

        {!result && !isAnalyzing && (
          <View style={styles.startSection}>
            <GlowingFrame variant="primary" style={styles.infoFrame}>
              <Text style={styles.infoText}>
                Run a comprehensive diagnostic scan to detect speaker issues and receive
                intelligent cleaning recommendations.
              </Text>
              <View style={styles.features}>
                <Text style={styles.featureItem}>✓ Frequency response analysis</Text>
                <Text style={styles.featureItem}>✓ Impedance measurement</Text>
                <Text style={styles.featureItem}>✓ Blockage detection</Text>
                <Text style={styles.featureItem}>✓ Smart mode selection</Text>
              </View>
            </GlowingFrame>

            <NeonButton
              label="Start Diagnostic Scan"
              onPress={runDiagnosis}
              variant="primary"
              style={styles.scanButton}
            />
          </View>
        )}

        {isAnalyzing && (
          <GlowingFrame variant="primary" style={styles.progressFrame}>
            <Text style={styles.progressTitle}>ANALYZING...</Text>
            <ActivityIndicator size="large" color={cyberpunkTheme.acidGreen} />
            <Text style={styles.stepText}>{currentStep}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
          </GlowingFrame>
        )}

        {result && recommendation && (
          <View style={styles.resultsSection}>
            <GlowingFrame variant="secondary" style={styles.healthFrame}>
              <Text style={styles.sectionTitle}>HEALTH STATUS</Text>
              <View style={styles.healthRow}>
                <Text style={[styles.healthScore, { color: getHealthColor(result.health) }]}>
                  {result.healthScore}
                </Text>
                <Text style={styles.healthLabel}>/100</Text>
              </View>
              <Text style={[styles.healthStatus, { color: getHealthColor(result.health) }]}>
                {result.health.toUpperCase()}
              </Text>
            </GlowingFrame>

            <GlowingFrame variant="glass" style={styles.issueFrame}>
              <Text style={styles.sectionTitle}>DETECTED ISSUE</Text>
              <Text style={styles.issueType}>{result.primaryIssue.toUpperCase()}</Text>
              <Text style={styles.issueDescription}>{result.issueDescription}</Text>
              <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text>
            </GlowingFrame>

            <GlowingFrame variant="primary" style={styles.recommendationFrame}>
              <Text style={styles.sectionTitle}>RECOMMENDED CLEANING</Text>
              <View style={styles.modeRow}>
                <Text style={styles.modeIcon}>{getModeIcon(recommendation.mode)}</Text>
                <Text style={styles.modeName}>{recommendation.mode.toUpperCase()} MODE</Text>
              </View>
              <View style={styles.specs}>
                <Text style={styles.specItem}>Intensity: {Math.round(recommendation.intensity * 100)}%</Text>
                <Text style={styles.specItem}>Duration: {recommendation.duration}s</Text>
                <Text style={styles.specItem}>Cycles: {recommendation.cycles}</Text>
              </View>
              <Text style={styles.reason}>{recommendation.reason}</Text>
              {recommendation.caution && (
                <Text style={styles.caution}>{recommendation.caution}</Text>
              )}
            </GlowingFrame>

            <View style={styles.actions}>
              <NeonButton
                label="Start Recommended Cleaning"
                onPress={startCleaning}
                variant="primary"
              />
              <NeonButton
                label="Run New Scan"
                onPress={runDiagnosis}
                variant="secondary"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { padding: 24, gap: 20 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: cyberpunkTheme.textNeon,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: cyberpunkTheme.glowSoft,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: cyberpunkTheme.textSecondary,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  startSection: { gap: 24 },
  infoFrame: { padding: 20 },
  infoText: {
    color: cyberpunkTheme.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  features: { gap: 8 },
  featureItem: {
    color: cyberpunkTheme.textNeon,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  scanButton: { marginTop: 8 },
  progressFrame: { padding: 32, alignItems: 'center', gap: 16 },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: cyberpunkTheme.textNeon,
    letterSpacing: 2,
  },
  stepText: {
    color: cyberpunkTheme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: cyberpunkTheme.glassBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: cyberpunkTheme.acidGreen,
  },
  percentText: {
    color: cyberpunkTheme.textNeon,
    fontSize: 18,
    fontWeight: '700',
  },
  resultsSection: { gap: 16 },
  healthFrame: { padding: 20, alignItems: 'center' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: cyberpunkTheme.textSecondary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  healthRow: { flexDirection: 'row', alignItems: 'baseline' },
  healthScore: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
  },
  healthLabel: {
    fontSize: 24,
    color: cyberpunkTheme.textSecondary,
    marginLeft: 4,
  },
  healthStatus: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 8,
  },
  issueFrame: { padding: 20 },
  issueType: {
    fontSize: 24,
    fontWeight: '700',
    color: cyberpunkTheme.magenta,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  issueDescription: {
    color: cyberpunkTheme.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  confidence: {
    color: cyberpunkTheme.textSecondary,
    fontSize: 12,
  },
  recommendationFrame: { padding: 20 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modeIcon: { fontSize: 32 },
  modeName: {
    fontSize: 20,
    fontWeight: '700',
    color: cyberpunkTheme.textNeon,
    letterSpacing: 1.5,
  },
  specs: { gap: 8, marginBottom: 16 },
  specItem: {
    color: cyberpunkTheme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  reason: {
    color: cyberpunkTheme.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  caution: {
    color: '#FF6B00',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  actions: { gap: 12, marginTop: 8 },
});

