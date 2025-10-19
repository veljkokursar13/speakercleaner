# Expo Audio Engine Module

Native audio synthesis module for iOS and Android with low-latency playback.

## Features

- ✨ Real-time tone generation (sine, square, triangle, sawtooth, noise)
- 🎵 Frequency sweeps (linear and logarithmic)
- 🎶 Multi-tone synthesis (harmonics, chords)
- ⚡ Low latency (<10ms on modern devices)
- 🎚️ Gain control and enveloping (fade in/out)
- 📱 Optimized for mobile devices

## Installation

This module requires a development build (not compatible with Expo Go).

```bash
# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Platform-Specific Implementation

### iOS (AVAudioEngine)

- Uses `AVAudioEngine` for audio graph management
- `AVAudioPlayerNode` for buffer playback
- `AVAudioSourceNode` for real-time synthesis (iOS 13+)
- `vDSP` framework for efficient DSP operations

**File:** `ios/ExpoAudioEngineModule.swift`

### Android (AudioTrack)

- Uses `AudioTrack` for low-latency playback
- `MODE_STREAM` for continuous audio
- `ENCODING_PCM_FLOAT` for high-quality samples
- Kotlin coroutines for async operations

**File:** `android/ExpoAudioEngineModule.kt`

## API

### initialize(config)

Initialize the audio engine.

```typescript
await initialize({
  sampleRate: 48000,      // Sample rate in Hz
  bufferSize: 512,        // Buffer size in samples
  enableHaptics: true,    // Enable haptic feedback
});
```

### playTone(params)

Play a single tone.

```typescript
await playTone({
  frequency: 1000,        // Frequency in Hz
  duration: 2000,         // Duration in ms
  gain: 0.8,              // Gain (0-1)
  waveform: 'sine',       // Waveform type
  fadeIn: 10,             // Fade in duration (ms)
  fadeOut: 10,            // Fade out duration (ms)
});
```

### playSweep(params)

Play a frequency sweep.

```typescript
await playSweep({
  fromHz: 100,            // Start frequency
  toHz: 2000,             // End frequency
  duration: 3000,         // Duration in ms
  gain: 0.8,              // Gain (0-1)
  logarithmic: true,      // Use log scale
  waveform: 'sine',       // Waveform type
});
```

### playMultiTone(params)

Play multiple tones simultaneously.

```typescript
await playMultiTone({
  frequencies: [440, 880, 1320],  // Frequencies in Hz
  gains: [0.5, 0.3, 0.2],         // Individual gains
  duration: 2000,                  // Duration in ms
  waveform: 'sine',                // Waveform type
});
```

### stop()

Stop current playback.

```typescript
await stop();
```

### dispose()

Release all resources.

```typescript
await dispose();
```

## Development Status

🚧 **This module is currently a stub/placeholder.**

To complete implementation:

1. **iOS (Swift):**
   - Implement `playTone()` with AVAudioPlayerNode
   - Implement `playSweep()` with AVAudioSourceNode
   - Implement `playMultiTone()` with buffer mixing
   - Add DSP helper functions using vDSP
   - Handle audio interruptions

2. **Android (Kotlin):**
   - Implement `playTone()` with AudioTrack
   - Implement `playSweep()` with streaming
   - Implement `playMultiTone()` with sample mixing
   - Add DSP helper functions
   - Handle audio focus changes

3. **Testing:**
   - Unit tests for waveform generation
   - Integration tests for playback
   - Performance benchmarks

## Performance Targets

- **Latency:** <10ms (iOS), <20ms (Android)
- **CPU Usage:** <5% during playback
- **Memory:** <10MB for buffers

## References

- [iOS AVAudioEngine Documentation](https://developer.apple.com/documentation/avfaudio/avaudioengine)
- [Android AudioTrack Documentation](https://developer.android.com/reference/android/media/AudioTrack)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## License

MIT

