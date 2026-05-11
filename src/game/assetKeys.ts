export const AssetKey = {
  Bird: 'bird',
  Pipe: 'pipe',
  Wall: 'wall',
  Ceiling: 'ceiling',
  Chains: 'chains',
  Decor: 'decor',
  Ground: 'ground',
  FlySound: 'fly',
} as const;

const FINISH_SOUND_MODULES = import.meta.glob('../assets/sounds/finish/*.ogg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const finishSoundsSorted = Object.entries(FINISH_SOUND_MODULES).sort(([a], [b]) => a.localeCompare(b));

export const FinishSoundKeys = finishSoundsSorted.map((_, i) => `finish_${i}`);
export const FinishSoundURLs = finishSoundsSorted.map(([, url]) => url);
export type FinishSoundKey = string;

export type AssetKey = (typeof AssetKey)[keyof typeof AssetKey];
