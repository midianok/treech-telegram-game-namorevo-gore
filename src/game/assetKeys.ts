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

export const FinishSoundKeys = ['finish_0', 'finish_1'] as const;
export type FinishSoundKey = (typeof FinishSoundKeys)[number];

export type AssetKey = (typeof AssetKey)[keyof typeof AssetKey];
