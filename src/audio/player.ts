import { createAudioPlayer } from 'expo-audio';

export async function playToneAsync(frequencyHz: number, durationMs: number) {
  // Placeholder: uses a baked asset instead of synthesizing frequencyHz
  const player = createAudioPlayer(require('../../assets/sounds/tone-950.wav'));
  player.play();
  await new Promise((r) => setTimeout(r, durationMs));
  player.pause();
  player.remove();
}

export async function playAssetAsync(assetModule: number) {
  const player = createAudioPlayer(assetModule);
  player.play();
  return player;
}


