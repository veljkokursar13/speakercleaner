//run live tests to understand how the mic behaves
//play a short calibration tone and record mic input
//analyze the recorded input to determine mic characteristics
//measure amplitude response, frequency response, distortion levels, noise floor, etc.

export type MicProfile = {
  optimalLowFreqHz: number;
  optimalHighFreqHz: number;
  distortionRiskLevel: number;
  noiseFloorDb: number;
  averageAmplitude: number;
  lowBandDrop: boolean;
  midBandDrop: boolean;
  highBandDrop: boolean;
  echoLevel: number;
  clippingEvents: number;
};

// ---- DSP helpers (lightweight, no deps) ----

function hann(N: number): Float32Array {
  const w = new Float32Array(N);
  for (let n = 0; n < N; n++) w[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / Math.max(1, N - 1)));
  return w;
}

// Naive real DFT magnitude spectrum (for small N)
function periodogram(samples: Float32Array, sampleRate: number, N = 2048) {
  const len = Math.min(samples.length, N);
  const x = samples.subarray(0, len);
  const w = hann(len);
  const mags: number[] = [];
  const kMax = Math.floor(len / 2);
  for (let k = 0; k <= kMax; k++) {
    let re = 0, im = 0;
    const omega = (-2 * Math.PI * k) / len;
    for (let n = 0; n < len; n++) {
      const v = x[n] * w[n];
      re += v * Math.cos(omega * n);
      im += v * Math.sin(omega * n);
    }
  mags[k] = Math.hypot(re, im) / Math.max(1, len / 2);
  }
  const binToHz = (k: number) => (k * sampleRate) / Math.max(1, len);
  return { mags, binToHz };
}

function bandEnergy(mags: number[], binToHz: (k: number) => number, f1: number, f2: number): number {
  let sum = 0, count = 0;
  for (let k = 1; k < mags.length; k++) {
    const f = binToHz(k);
    if (f >= f1 && f <= f2) { sum += mags[k]; count++; }
  }
  return count ? sum / count : 0;
}

function rms(arr: Float32Array): number {
  let s = 0;
  for (const v of arr) s += v * v;
  return Math.sqrt(s / Math.max(1, arr.length));
}

function meanAbs(arr: Float32Array): number {
  let s = 0;
  for (const v of arr) s += Math.abs(v);
  return s / Math.max(1, arr.length);
}

function countClips(arr: Float32Array, thr = 0.98): number {
  let count = 0, inClip = false;
  for (const v of arr) {
    const c = Math.abs(v) >= thr;
    if (c && !inClip) { count++; inClip = true; }
    else if (!c) { inClip = false; }
  }
  return count;
}

// Approximate noise floor as 20th percentile amplitude in dBFS
function noiseFloorDb(arr: Float32Array): number {
  const abs = Array.from(arr, v => Math.abs(v)).sort((a, b) => a - b);
  const p = abs[Math.floor(0.2 * Math.max(0, abs.length - 1))] ?? 1e-6;
  return 20 * Math.log10(Math.max(p, 1e-6));
}

// Echo tail length until -20 dB of peak envelope
function echoTailMs(arr: Float32Array, sampleRate: number): number {
  const winMs = 0.01; // 10 ms
  const win = Math.max(1, Math.floor(sampleRate * winMs));
  const env: number[] = [];
  for (let i = 0; i < arr.length; i += win) {
    const slice = arr.subarray(i, Math.min(arr.length, i + win));
    env.push(rms(slice));
  }
  const peak = Math.max(...env, 1e-6);
  const thresh = peak * Math.pow(10, -20 / 20);
  let lastAbove = 0;
  for (let i = 0; i < env.length; i++) if (env[i] >= thresh) lastAbove = i;
  return (lastAbove * win * 1000) / Math.max(1, sampleRate);
}

// Combine crest factor and clipping into a 0..1 risk
function distortionRisk(arr: Float32Array): number {
  const r = rms(arr);
  let peak = 0;
  for (const v of arr) { const a = Math.abs(v); if (a > peak) peak = a; }
  const crest = peak / Math.max(1e-6, r);
  const clips = countClips(arr);
  const clipRatio = clips / Math.max(1, arr.length / 512);
  const crestRisk = Math.min(1, Math.max(0, (6 - Math.min(6, crest)) / 5));
  return Math.max(0, Math.min(1, 0.7 * crestRisk + 0.3 * Math.min(1, clipRatio)));
}

// Count derivative outliers as spikes
function randomNoiseSpikes(arr: Float32Array): number {
  if (arr.length < 2) return 0;
  let sumd = 0;
  for (let i = 1; i < arr.length; i++) sumd += Math.abs(arr[i] - arr[i - 1]);
  const avgd = sumd / Math.max(1, arr.length - 1);
  const thr = avgd * 8;
  let spikes = 0;
  for (let i = 1; i < arr.length; i++) if (Math.abs(arr[i] - arr[i - 1]) > thr) spikes++;
  return spikes;
}

export const AnomalyDetector = {
  async detectAnomalies(micProfile: MicProfile): Promise<string[]> {
    const anomalies: string[] = [];

    if (micProfile.distortionRiskLevel > 0.5)
      anomalies.push("HIGH_DISTORTION");
    if (micProfile.noiseFloorDb > -50)
      anomalies.push("HIGH_NOISE_FLOOR");
    if (micProfile.averageAmplitude < 0.2)
      anomalies.push("LOW_SIGNAL_LEVEL");
    if (micProfile.lowBandDrop)
      anomalies.push("FREQ_DROPOUT_LOW");
    if (micProfile.midBandDrop)
      anomalies.push("FREQ_DROPOUT_MID");
    if (micProfile.highBandDrop)
      anomalies.push("FREQ_DROPOUT_HIGH");
    if (micProfile.echoLevel > 0.3)
      anomalies.push("EXCESSIVE_ECHO");
    if (micProfile.clippingEvents > 10)
      anomalies.push("CLIPPING");

    // Derived uneven response based on band drops variance
    const bands = [
      micProfile.lowBandDrop ? 0 : 1,
      micProfile.midBandDrop ? 0 : 1,
      micProfile.highBandDrop ? 0 : 1,
    ];
    const mean = bands.reduce((a, b) => a + b, 0) / bands.length;
    const variance = bands.reduce((a, b) => a + (b - mean) * (b - mean), 0) / bands.length;
    if (mean > 0) {
      const cv = Math.sqrt(variance) / mean; // coefficient of variation
      if (cv > 0.3) anomalies.push("UNEVEN_RESPONSE");
    }

    return anomalies;
  },
};

// Compute MicProfile and anomalies from raw PCM samples
export async function analyzeMicBuffer(
  samples: Float32Array,
  sampleRate: number
): Promise<{
  profile: MicProfile;
  anomalies: string[];
  bands: { low: number; mid: number; high: number };
}> {
  const { mags, binToHz } = periodogram(samples, sampleRate, 2048);
  const low = bandEnergy(mags, binToHz, 100, 400);
  const mid = bandEnergy(mags, binToHz, 500, 2000);
  const high = bandEnergy(mags, binToHz, 5000, 12000);

  const maxBand = Math.max(1e-6, low, mid, high);
  const lowN = low / maxBand;
  const midN = mid / maxBand;
  const highN = high / maxBand;

  const lowBandDrop = lowN < 0.5;
  const midBandDrop = midN < 0.5;
  const highBandDrop = highN < 0.5;

  const nfDb = noiseFloorDb(samples);
  const avgAmp = meanAbs(samples);
  const clips = countClips(samples);
  const echoMs = echoTailMs(samples, sampleRate);
  const echoLevel = Math.min(1, echoMs / 1000); // ~1s tail => 1.0
  const distRisk = distortionRisk(samples);
  const spikes = randomNoiseSpikes(samples);

  const profile: MicProfile = {
    optimalLowFreqHz: 100 + (lowN >= 0.5 ? 150 : 0),
    optimalHighFreqHz: 8000 + (highN >= 0.5 ? 2000 : 0),
    distortionRiskLevel: distRisk,
    noiseFloorDb: nfDb,
    averageAmplitude: avgAmp,
    lowBandDrop,
    midBandDrop,
    highBandDrop,
    echoLevel,
    clippingEvents: clips + Math.max(0, Math.floor(spikes / 50)),
  };

  const anomalies = await AnomalyDetector.detectAnomalies(profile);
  if (spikes > 200 && nfDb < -40) anomalies.push("RANDOM_NOISE_SPIKES");

  return { profile, anomalies, bands: { low: lowN, mid: midN, high: highN } };
}

// ---- Speaker Health Testing ----

export interface SpeakerHealthReport {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number; // 0-100
  issues: string[];
  recommendations: string[];
  micProfile: MicProfile;
  timestamp: number;
}

/**
 * Assess speaker health from mic profile
 */
export function assessSpeakerHealth(
  micProfile: MicProfile,
  anomalies: string[]
): SpeakerHealthReport {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check each anomaly and provide guidance
  if (anomalies.includes('HIGH_DISTORTION')) {
    issues.push('High distortion detected');
    recommendations.push('Reduce volume or clean speaker membrane');
  }
  
  if (anomalies.includes('HIGH_NOISE_FLOOR')) {
    issues.push('Elevated background noise');
    recommendations.push('Test in quieter environment or check mic quality');
  }
  
  if (anomalies.includes('LOW_SIGNAL_LEVEL')) {
    issues.push('Weak speaker output detected');
    recommendations.push('Speaker may be blocked - cleaning recommended');
  }
  
  if (anomalies.includes('FREQ_DROPOUT_LOW')) {
    issues.push('Poor low-frequency response');
    recommendations.push('Water or heavy debris may be blocking speaker');
  }
  
  if (anomalies.includes('FREQ_DROPOUT_MID')) {
    issues.push('Reduced mid-frequency clarity');
    recommendations.push('Dust accumulation likely - try cleaning cycle');
  }
  
  if (anomalies.includes('FREQ_DROPOUT_HIGH')) {
    issues.push('High-frequency attenuation');
    recommendations.push('Check speaker grille for obstructions');
  }
  
  if (anomalies.includes('EXCESSIVE_ECHO')) {
    issues.push('Excessive echo/reverb detected');
    recommendations.push('Test in different location or check for resonance issues');
  }
  
  if (anomalies.includes('CLIPPING')) {
    issues.push('Audio clipping detected');
    recommendations.push('Reduce playback volume to prevent damage');
  }

  if (anomalies.includes('UNEVEN_RESPONSE')) {
    issues.push('Uneven frequency response');
    recommendations.push('Speaker may have physical damage or partial blockage');
  }

  // Calculate health score (0-100)
  let score = 100;
  score -= anomalies.length * 10; // -10 per anomaly
  score -= micProfile.distortionRiskLevel * 20; // -20 max for distortion
  score -= Math.max(0, (micProfile.noiseFloorDb + 40) / 2); // Penalty for high noise
  score -= (1 - micProfile.averageAmplitude) * 30; // -30 max for low amplitude
  score -= micProfile.clippingEvents * 2; // -2 per clipping event
  score -= micProfile.echoLevel * 15; // -15 max for echo
  
  const healthScore = Math.max(0, Math.min(100, Math.round(score)));

  // Determine overall health category
  let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  if (healthScore >= 90) {
    overallHealth = 'excellent';
  } else if (healthScore >= 75) {
    overallHealth = 'good';
  } else if (healthScore >= 60) {
    overallHealth = 'fair';
    recommendations.unshift('Speaker cleaning may improve performance');
  } else if (healthScore >= 40) {
    overallHealth = 'poor';
    recommendations.unshift('Speaker cleaning strongly recommended');
  } else {
    overallHealth = 'critical';
    recommendations.unshift('URGENT: Speaker requires immediate attention');
  }

  return {
    overallHealth,
    healthScore,
    issues,
    recommendations,
    micProfile,
    timestamp: Date.now(),
  };
}

/**
 * Compare two health reports to measure improvement
 */
export function compareSpeakerHealth(
  before: SpeakerHealthReport,
  after: SpeakerHealthReport
): {
  scoreChange: number;
  improvement: number; // percentage
  improved: boolean;
  message: string;
} {
  const scoreChange = after.healthScore - before.healthScore;
  const improvement = (scoreChange / Math.max(1, before.healthScore)) * 100;
  const improved = scoreChange > 0;

  let message = 'No change';
  if (scoreChange > 20) {
    message = 'Significant improvement - speaker health greatly improved!';
  } else if (scoreChange > 10) {
    message = 'Notable improvement in speaker performance';
  } else if (scoreChange > 5) {
    message = 'Moderate improvement detected';
  } else if (scoreChange > 0) {
    message = 'Slight improvement';
  } else if (scoreChange < -10) {
    message = 'Speaker health declined - check for damage';
  } else if (scoreChange < 0) {
    message = 'Slight decline in performance';
  }

  return { scoreChange, improvement, improved, message };
}
