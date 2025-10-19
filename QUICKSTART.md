# 🚀 Quick Start Guide

Get the advanced speaker cleaner architecture up and running in **5 minutes**.

---

## ✅ Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or pnpm installed
- [ ] For iOS: macOS with Xcode 15+
- [ ] For Android: Android Studio + SDK 34+
- [ ] Expo account (for EAS builds)

---

## 📦 Installation

```bash
# 1. Install dependencies
npm install

# 2. Install missing packages for new architecture
npm install @react-native-async-storage/async-storage expo-av expo-device expo-battery

# 3. Install dev dependencies for testing
npm install --save-dev @types/jest jest jest-expo

# 4. iOS only: Install pods
cd ios && pod install && cd ..
```

---

## 🏃 Running the App

### Development (Expo Go - Limited Features)

```bash
npm start
# Press 'i' for iOS or 'a' for Android
```

**Note:** Native audio engine won't work in Expo Go. Use for UI development only.

### Development Build (Full Features)

```bash
# Create development build once
eas build --profile development --platform ios
eas build --profile development --platform android

# Install on device/simulator
# Then run:
npm start --dev-client
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode (for TDD)
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🎯 Key Entry Points

### 1. Initialize Audio Engine

```typescript
import { useCleanerStore } from './src/store/cleanerStore';

// In your root component (app/_layout.tsx)
useEffect(() => {
  const initialize = async () => {
    await useCleanerStore.getState().initialize();
  };
  initialize();
}, []);
```

### 2. Start Cleaning

```typescript
import { useCleanerStore } from './src/store/cleanerStore';

function CleaningScreen() {
  const { startCleaning, status, progress } = useCleanerStore();

  const handleClean = async () => {
    try {
      await startCleaning('adaptive', {
        autoDetectBlockage: true,
        performResonanceScan: true,
      });
    } catch (error) {
      console.error('Cleaning failed:', error);
    }
  };

  return (
    <View>
      <Button onPress={handleClean} disabled={status === 'running'}>
        Start Clean
      </Button>
      {status === 'running' && <ProgressBar progress={progress} />}
    </View>
  );
}
```

### 3. Run Diagnostics

```typescript
import { useCleanerStore } from './src/store/cleanerStore';
import { SpeakerTest } from './src/diagnostics/SpeakerTest';

async function runDiagnostics() {
  const engine = useCleanerStore.getState().audioEngine;
  if (!engine) return;

  const test = new SpeakerTest(engine);
  const report = await test.runFullDiagnostics((testName, progress) => {
    console.log(`Running ${testName}: ${Math.round(progress * 100)}%`);
  });

  console.log(`Health Score: ${report.healthScore}`);
  console.log(`Status: ${report.overallHealth}`);
  console.log(`Issues: ${report.issues.length}`);
}
```

### 4. Safety Checks

```typescript
import { SafetyController } from './src/safety/SafetyController';

async function performSafetyCheck() {
  const controller = new SafetyController();
  const report = await controller.performPreFlightChecks();

  if (!report.safe) {
    alert(`Cannot clean: ${report.criticalIssues[0].message}`);
    return false;
  }

  if (report.warnings.length > 0) {
    console.warn('Warnings:', report.warnings);
  }

  return true;
}
```

---

## 📂 File Structure Quick Reference

```
src/
├── engine/audio/
│   ├── AudioEngine.ts          ← Main audio interface
│   ├── FrequencySweep.ts       ← Sweep generation
│   ├── WaveformGenerator.ts    ← Complex patterns
│   └── VolumeController.ts     ← Safety limits
│
├── engine/algorithms/
│   ├── WaterEjection.ts        ← Water cleaning
│   ├── DustVibration.ts        ← Dust cleaning
│   ├── ResonanceScan.ts        ← Frequency analysis
│   └── AdaptiveCleaning.ts     ← AI cleaning
│
├── diagnostics/
│   ├── SpeakerTest.ts          ← Health tests
│   ├── ImpedanceAnalyzer.ts    ← Blockage detection
│   ├── MicrophoneFeedback.ts   ← Real-time monitoring
│   └── CalibrationService.ts   ← Device tuning
│
├── safety/
│   └── SafetyController.ts     ← Safety checks
│
└── store/
    ├── types.ts                ← TypeScript types
    └── cleanerStore.ts         ← Global state (Zustand)
```

---

## 🔧 Common Tasks

### Add New Cleaning Algorithm

1. Create file in `src/engine/algorithms/YourAlgorithm.ts`
2. Extend base pattern:
```typescript
export class YourAlgorithm {
  constructor(private audioEngine: AudioEngine) {}
  
  async execute(
    config: YourConfig,
    onProgress?: (progress: CleaningProgress) => void
  ): Promise<void> {
    // Implementation
  }
}
```
3. Add to `cleanerStore.ts` in `startCleaning()` switch
4. Write tests in `src/__tests__/algorithms/YourAlgorithm.test.ts`

### Add New Diagnostic Test

1. Add method to `SpeakerTest.ts`:
```typescript
private async testNewFeature(): Promise<TestResult> {
  // Run test
  return {
    name: 'New Feature Test',
    passed: true,
    score: 85,
    details: 'Test passed',
  };
}
```
2. Call in `runFullDiagnostics()`
3. Add test in `src/__tests__/diagnostics/SpeakerTest.test.ts`

### Integrate Native Module

1. Complete implementation in `modules/expo-audio-engine/ios/` and `android/`
2. Build native module:
```bash
cd modules/expo-audio-engine
# Follow Expo Modules API docs
```
3. Link in `AudioEngine.ts`:
```typescript
import { NativeModules } from 'react-native';
const { ExpoAudioEngineModule } = NativeModules;
```

---

## 🐛 Troubleshooting

### "AudioEngine not initialized"
```typescript
// Ensure initialize is called before use
await useCleanerStore.getState().initialize();
```

### "Native module not found"
- You're using Expo Go (doesn't support native modules)
- Solution: Create development build with `eas build`

### Tests failing with "Cannot find module"
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Run type check to see all errors
npm run type-check

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

---

## 📚 Next Steps

1. Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** for full technical details
2. Explore `src/__tests__/` for usage examples
3. Check `modules/expo-audio-engine/README.md` for native module guide
4. Review `src/store/cleanerStore.ts` for state management patterns

---

## 🆘 Getting Help

- **Architecture Questions:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Reference:** Check JSDoc comments in source files
- **Bug Reports:** [GitHub Issues](https://github.com/YOUR_USERNAME/speakercleaner/issues)
- **Questions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/speakercleaner/discussions)

---

## ✅ Architecture Checklist

All components are ready for integration:

- [x] **Audio Engine** - Real-time synthesis with native bridge
- [x] **Cleaning Algorithms** - Water, dust, adaptive, resonance
- [x] **Diagnostics** - Health tests, impedance, feedback, calibration
- [x] **Safety** - Pre-flight checks, runtime monitoring
- [x] **State Management** - Zustand store with persistence
- [x] **Native Modules** - iOS/Android stubs ready for implementation
- [x] **Tests** - Unit tests for core components
- [x] **Documentation** - Architecture guide, README, this quickstart

**Status:** Architecture Complete ✅  
**Next:** Integrate into existing UI screens (`app/auto.tsx`, `app/manual.tsx`)

---

**Happy Coding! 🚀**

