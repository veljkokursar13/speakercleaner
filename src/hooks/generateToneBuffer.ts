/**
 * Generate WAV file buffer for manual mode tone playback
 * Useful for caching or file-based playback scenarios
 */

import { File, Paths } from 'expo-file-system';

export interface ToneBufferParams {
  frequency: number;
  duration: number; // in seconds
  sampleRate?: number;
  amplitude?: number;
  waveform?: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

export interface ToneBufferResult {
  samples: Int16Array;
  wavBuffer: ArrayBuffer;
  wavBase64: string;
  filePath?: string;
}

/**
 * Generate PCM samples for a tone
 */
function generateSamples(
  frequency: number,
  duration: number,
  sampleRate: number,
  amplitude: number,
  waveform: ToneBufferParams['waveform'] = 'sine'
): Int16Array {
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Int16Array(totalSamples);
  const twoPiF = 2 * Math.PI * frequency;
  const maxAmplitude = 32767; // Int16 max value

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const phase = twoPiF * t;
    
    let sample = 0;
    switch (waveform) {
      case 'sine':
        sample = Math.sin(phase);
        break;
      case 'square':
        sample = Math.sin(phase) > 0 ? 1 : -1;
        break;
      case 'triangle':
        sample = 2 * Math.abs(2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))) - 1;
        break;
      case 'sawtooth':
        sample = 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
        break;
      default:
        sample = Math.sin(phase);
    }
    
    samples[i] = Math.round(sample * amplitude * maxAmplitude);
  }

  return samples;
}

/**
 * Create WAV file header
 */
function createWavHeader(samples: Int16Array, sampleRate: number, channels: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  view.setUint32(8, 0x57415645, false); // "WAVE"
  
  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, channels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  
  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Subchunk2Size

  return buffer;
}

/**
 * Append two ArrayBuffers
 */
function appendBuffer(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
  const tmp = new Uint8Array(a.byteLength + b.byteLength);
  tmp.set(new Uint8Array(a), 0);
  tmp.set(new Uint8Array(b), a.byteLength);
  return tmp.buffer;
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

/**
 * Generate tone buffer and optionally save to file
 */
export async function generateToneBuffer(
  params: ToneBufferParams,
  saveToFile: boolean = false
): Promise<ToneBufferResult> {
  const {
    frequency,
    duration,
    sampleRate = 44100,
    amplitude = 0.2,
    waveform = 'sine',
  } = params;

  // Generate PCM samples
  const samples = generateSamples(frequency, duration, sampleRate, amplitude, waveform);

  // Create WAV header
  const header = createWavHeader(samples, sampleRate, 1);

  // Convert samples to ArrayBuffer (Int16Array -> ArrayBuffer)
  const samplesBuffer = new ArrayBuffer(samples.byteLength);
  new Int16Array(samplesBuffer).set(samples);

  // Append header + samples
  const wavBuffer = appendBuffer(header, samplesBuffer);

  // Convert to Base64
  const wavBase64 = arrayBufferToBase64(wavBuffer);

  let filePath: string | undefined;

  // Optionally save to file system
  if (saveToFile) {
    try {
      const file = new File(Paths.cache, `tone-${frequency}-${duration}s.wav`);
      filePath = file.uri;
      // Write as base64 string
      await file.write(wavBase64, {
        encoding: 'base64' as any,
      });
    } catch (error) {
      console.error('[generateToneBuffer] Failed to save file:', error);
    }
  }

  return {
    samples,
    wavBuffer,
    wavBase64,
    filePath,
  };
}
