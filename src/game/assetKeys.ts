export const AssetKey = {
  Bird: 'bird',
  Pipe: 'pipe',
  Wall: 'wall',
  Ceiling: 'ceiling',
  Chains: 'chains',
  Decor: 'decor',
  Ground: 'ground',
} as const;

export type AssetKey = (typeof AssetKey)[keyof typeof AssetKey];
