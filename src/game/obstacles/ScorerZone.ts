import Phaser from 'phaser';

import type { ArcadeBodyZone } from '../types/physics';

export type ScorerZone = ArcadeBodyZone & {
  scored?: boolean;
};

export function isScorerZone(object: unknown): object is ScorerZone {
  return object instanceof Phaser.GameObjects.Zone;
}
