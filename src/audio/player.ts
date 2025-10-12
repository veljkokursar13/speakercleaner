import { Audio } from 'expo-audio';

export async function playToneAsync(frequencyHz: number, durationMs: number) {
  // Placeholder: in production, prefer pre-baked assets for reliability
  const sound = new Audio.Sound();
  try {
    await sound.loadAsync(require('@/assets/sounds/tone-950.wav'));
    await sound.playAsync();
    await new Promise((r) => setTimeout(r, durationMs));
  } finally {
    await sound.unloadAsync();
  }
}

export async function playAssetAsync(assetModule: number) {
  const sound = new Audio.Sound();
  await sound.loadAsync(assetModule);
  await sound.playAsync();
  return sound;
}


