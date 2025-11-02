// Mock expo-audio
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seek: jest.fn(),
    volume: 1,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
  })),
}));

// Mock react-native-audio-record
jest.mock('react-native-audio-record', () => ({
  default: {
    init: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(() => Promise.resolve()),
    addRecordingEventListener: jest.fn(),
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-keep-awake
jest.mock('expo-keep-awake', () => ({
  useKeepAwake: jest.fn(),
  activateKeepAwake: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  getDeviceTypeAsync: jest.fn(() => Promise.resolve(1)),
  DeviceType: {
    PHONE: 1,
    TABLET: 2,
    DESKTOP: 3,
    TV: 4,
    UNKNOWN: 0,
  },
}));

// Mock expo-battery
jest.mock('expo-battery', () => ({
  getBatteryLevelAsync: jest.fn(() => Promise.resolve(0.8)),
  getBatteryStateAsync: jest.fn(() => Promise.resolve(2)),
  BatteryState: {
    UNKNOWN: 0,
    UNPLUGGED: 1,
    CHARGING: 2,
    FULL: 3,
  },
}));

// Mock native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.ExpoAudioEngineModule = {
    initialize: jest.fn(() => Promise.resolve()),
    playTone: jest.fn(() => Promise.resolve()),
    playSweep: jest.fn(() => Promise.resolve()),
    playMultiTone: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    dispose: jest.fn(() => Promise.resolve()),
  };
  return RN;
});

// Global test timeout
jest.setTimeout(10000);

